/*
 * O trecho que chega depois (resources/js/lazy.js): o que vai para o
 * servidor, o que entra no lugar do esqueleto e o que aparece quando não
 * dá certo. O `fetch` e o elemento são falsos, então roda com `npm test`,
 * sem navegador e sem servidor.
 */
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { carregarTrecho, ligarCarregamentos, resultadoDoCarregamento } from '../../resources/js/lazy.js';

const fetchOriginal = globalThis.fetch;

/** As chamadas que o `fetch` falso recebeu: `{ url, init }`. */
let chamadas = [];

/** Troca o `fetch` por um que anota a chamada e devolve `resposta` (ou rejeita com `erro`). */
function responder(resposta, { erro } = {}) {
    chamadas = [];

    globalThis.fetch = async (url, init) => {
        chamadas.push({ url, init });

        if (erro) {
            throw erro;
        }

        return resposta;
    };
}

/**
 * O elemento com `data-carregar`, só com o que o módulo usa. `modelo` é o
 * `<template data-carregar-erro>` de dentro dele, quando a tela tem um.
 */
function trecho({ url = '/admin/painel/visitas', modelo = null } = {}) {
    const atributos = new Map();

    const elemento = {
        dataset: { carregar: url },
        innerHTML: '<div data-esqueleto></div>',
        filhos: null,
        eventos: [],
        atributos,
        setAttribute: (nome, valor) => atributos.set(nome, String(valor)),
        removeAttribute: (nome) => atributos.delete(nome),
        querySelector: (seletor) => (seletor.includes('data-carregar-erro') ? modelo : null),
        querySelectorAll: () => [],
        replaceChildren: (...nos) => {
            elemento.filhos = nos;
            elemento.innerHTML = '';
        },
        dispatchEvent: (evento) => elemento.eventos.push(evento),
        ownerDocument: {
            createElement: (tag) => ({
                tag,
                className: '',
                textContent: '',
                atributos: new Map(),
                setAttribute(nome, valor) {
                    this.atributos.set(nome, valor);
                },
            }),
        },
    };

    return elemento;
}

/** O `<template data-carregar-erro>`: a cópia dele, com o lugar da mensagem. */
function modeloDeAviso() {
    const lugar = { textContent: '' };
    const copia = { querySelector: (seletor) => (seletor === '[data-carregar-mensagem]' ? lugar : null) };

    return { lugar, copia, modelo: { content: { cloneNode: () => copia } } };
}

afterEach(() => {
    globalThis.fetch = fetchOriginal;
});

// --- O que fazer com a resposta ---

test('a resposta 200 é o HTML do trecho', () => {
    assert.deepEqual(resultadoDoCarregamento({ ok: true, status: 200 }, '<section>Visitas</section>'), { html: '<section>Visitas</section>' });
});

test('o redirecionamento seguido é a sessão vencida, e não o trecho', () => {
    // O Laravel manda para o login, e o fetch segue: o 200 é o da tela de login.
    const resultado = resultadoDoCarregamento({ ok: true, status: 200, redirected: true }, '<form>Entrar</form>');

    assert.deepEqual(resultado, { erro: 'Sua sessão expirou. Entre de novo para continuar.' });
});

test('401 e 419 também são a sessão vencida', () => {
    for (const status of [401, 419]) {
        assert.deepEqual(resultadoDoCarregamento({ ok: false, status }, ''), { erro: 'Sua sessão expirou. Entre de novo para continuar.' });
    }
});

test('403 diz que falta permissão; o resto, que não deu agora', () => {
    assert.deepEqual(resultadoDoCarregamento({ ok: false, status: 403 }, ''), { erro: 'Você não tem permissão para ver isto.' });
    assert.deepEqual(resultadoDoCarregamento({ ok: false, status: 500 }, '<h1>Server Error</h1>'), { erro: 'Não deu para carregar agora. Recarregue a página para tentar de novo.' });
});

// --- O trecho no lugar ---

test('busca o trecho como HTML, com a sessão, e o põe no lugar do esqueleto', async () => {
    responder(new Response('<section>Visitas da loja</section>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
    const elemento = trecho();

    await carregarTrecho(elemento);

    assert.equal(chamadas.length, 1);
    assert.equal(chamadas[0].url, '/admin/painel/visitas');
    assert.equal(chamadas[0].init.credentials, 'same-origin');
    assert.equal(new Headers(chamadas[0].init.headers).get('Accept'), 'text/html');
    assert.equal(new Headers(chamadas[0].init.headers).get('X-Requested-With'), 'XMLHttpRequest');

    assert.equal(elemento.innerHTML, '<section>Visitas da loja</section>');
    assert.equal(elemento.atributos.has('aria-busy'), false);
});

test('anuncia ui:carregado, subindo, depois de pôr o trecho', async () => {
    responder(new Response('<p>ok</p>', { status: 200 }));
    const elemento = trecho();

    await carregarTrecho(elemento);

    assert.equal(elemento.eventos.length, 1);
    assert.equal(elemento.eventos[0].type, 'ui:carregado');
    assert.equal(elemento.eventos[0].bubbles, true);
});

test('enquanto busca, o trecho fica aria-busy', async () => {
    let entregar;
    globalThis.fetch = () => new Promise((resolver) => {
        entregar = resolver;
    });
    const elemento = trecho();

    const carregando = carregarTrecho(elemento);

    assert.equal(elemento.atributos.get('aria-busy'), 'true');

    entregar(new Response('<p>ok</p>', { status: 200 }));
    await carregando;

    assert.equal(elemento.atributos.has('aria-busy'), false);
});

// --- Quando não dá certo ---

test('a sessão vencida não põe a tela de login no meio da página', async () => {
    responder({ ok: true, status: 200, redirected: true, text: async () => '<form>Entrar</form>' });
    const elemento = trecho();

    await carregarTrecho(elemento);

    assert.doesNotMatch(elemento.innerHTML, /Entrar/);
    assert.equal(elemento.filhos[0].textContent, 'Sua sessão expirou. Entre de novo para continuar.');
    assert.equal(elemento.filhos[0].atributos.get('role'), 'alert');
});

test('com o modelo de aviso da tela, a mensagem vai dentro dele', async () => {
    responder(new Response('<h1>Server Error</h1>', { status: 500 }));
    const { lugar, copia, modelo } = modeloDeAviso();
    const elemento = trecho({ modelo });

    await carregarTrecho(elemento);

    assert.deepEqual(elemento.filhos, [copia]);
    assert.equal(lugar.textContent, 'Não deu para carregar agora. Recarregue a página para tentar de novo.');
});

test('sem conexão, diz que o servidor não respondeu', async () => {
    responder(null, { erro: new TypeError('Failed to fetch') });
    const elemento = trecho();

    await carregarTrecho(elemento);

    assert.equal(elemento.filhos[0].textContent, 'Sem conexão com o servidor.');
});

test('anuncia ui:carregamento-falhou com a mensagem, e tira o aria-busy', async () => {
    responder(new Response('', { status: 500 }));
    const elemento = trecho();

    await carregarTrecho(elemento);

    assert.equal(elemento.eventos.length, 1);
    assert.equal(elemento.eventos[0].type, 'ui:carregamento-falhou');
    assert.equal(elemento.eventos[0].bubbles, true);
    assert.equal(elemento.eventos[0].detail.mensagem, 'Não deu para carregar agora. Recarregue a página para tentar de novo.');
    assert.equal(elemento.atributos.has('aria-busy'), false);
});

// --- Ligar ---

test('ligar duas vezes busca o trecho uma vez só', async () => {
    responder(new Response('<p>ok</p>', { status: 200 }));
    const elemento = trecho();
    const raiz = { querySelectorAll: () => [elemento] };

    ligarCarregamentos(raiz);
    ligarCarregamentos(raiz);
    await new Promise((pronto) => setTimeout(pronto));

    assert.equal(chamadas.length, 1);
});
