/*
 * O trecho que chega depois (`data-carregar`).
 *
 *     <div data-carregar="{{ route('painel.visitas') }}">
 *         <x-ui.skeleton class="h-24" />
 *     </div>
 *
 * A página abre com o esqueleto no lugar, e o trecho vem numa requisição
 * à parte: o que é lento de calcular — a consulta a um serviço de fora,
 * como o Google Analytics — não segura a tela inteira. O servidor
 * responde o HTML do trecho, que substitui o conteúdo do elemento; os
 * gráficos, as dicas e os `data-carregar` de dentro dele se ligam, e o
 * elemento dispara `ui:carregado` (subindo), para a tela ligar os módulos
 * dela no que chegou.
 *
 * Enquanto busca, o elemento fica `aria-busy="true"`: o leitor de tela
 * sabe que o trecho ainda vem.
 *
 * Quando não dá certo (o servidor fora, a sessão vencida), o motivo vai
 * no lugar do esqueleto: no `[data-carregar-mensagem]` de um
 * `<template data-carregar-erro>` de dentro do elemento, quando a tela
 * tem um — ela escolhe o desenho do aviso —, ou num parágrafo simples. O
 * elemento dispara `ui:carregamento-falhou`, com a mensagem no `detail`.
 */
import { ligarGraficos } from './chart.js';
import { ligarDicas } from './tooltip.js';

/** A mensagem quando nada mais específico se aplica. */
const FALHA = 'Não deu para carregar agora. Recarregue a página para tentar de novo.';

/** 401 e 419 dizem a mesma coisa para quem está na tela, como no `requisicaoJson`. */
const SESSAO_VENCIDA = 'Sua sessão expirou. Entre de novo para continuar.';

/**
 * O que fazer com a resposta: o HTML para pôr no lugar, ou o motivo de
 * não pôr.
 *
 * O redirecionamento seguido é a sessão vencida: o Laravel manda quem não
 * está logado para a tela de login, e o `fetch` a segue — sem isso, o
 * formulário de login entraria no meio da tela, com status 200.
 *
 * @param {{ok: boolean, status: number, redirected?: boolean}} resposta
 * @param {string} texto
 * @returns {{html: string}|{erro: string}}
 */
export function resultadoDoCarregamento(resposta, texto) {
    if (resposta.redirected || resposta.status === 401 || resposta.status === 419) {
        return { erro: SESSAO_VENCIDA };
    }

    if (resposta.status === 403) {
        return { erro: 'Você não tem permissão para ver isto.' };
    }

    if (! resposta.ok) {
        return { erro: FALHA };
    }

    return { html: texto };
}

/** O motivo no lugar do esqueleto: no modelo de aviso da tela, ou num parágrafo. */
function mostrarFalha(elemento, mensagem) {
    const modelo = elemento.querySelector(':scope > template[data-carregar-erro]');

    if (modelo) {
        const aviso = modelo.content.cloneNode(true);
        const lugar = aviso.querySelector('[data-carregar-mensagem]');

        if (lugar) {
            lugar.textContent = mensagem;
        }

        elemento.replaceChildren(aviso);

        return;
    }

    const paragrafo = elemento.ownerDocument.createElement('p');

    paragrafo.className = 'text-sm text-neutral-500 dark:text-neutral-400';
    paragrafo.setAttribute('role', 'alert');
    paragrafo.textContent = mensagem;

    elemento.replaceChildren(paragrafo);
}

/**
 * Busca o trecho do elemento e o põe no lugar do esqueleto — ou o motivo
 * de não pôr. A promessa termina quando um dos dois está na tela.
 */
export async function carregarTrecho(elemento) {
    elemento.setAttribute('aria-busy', 'true');

    let resultado;

    try {
        /*
         * `Accept: text/html`: o trecho é tela, e não JSON. Com ele, o
         * Laravel não trata o pedido como `expectsJson` — a sessão vencida
         * redireciona para o login, e o `redirected` da resposta a acusa.
         */
        const resposta = await fetch(elemento.dataset.carregar, {
            credentials: 'same-origin',
            headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
        });

        resultado = resultadoDoCarregamento(resposta, await resposta.text());
    } catch {
        resultado = { erro: 'Sem conexão com o servidor.' };
    }

    elemento.removeAttribute('aria-busy');

    if ('html' in resultado) {
        elemento.innerHTML = resultado.html;

        // O que chegou se liga como a página ao abrir: os gráficos, as dicas e os trechos de dentro.
        ligarGraficos(elemento);
        ligarDicas(elemento);
        ligarCarregamentos(elemento);

        elemento.dispatchEvent(new CustomEvent('ui:carregado', { bubbles: true }));

        return;
    }

    mostrarFalha(elemento, resultado.erro);
    elemento.dispatchEvent(new CustomEvent('ui:carregamento-falhou', { bubbles: true, detail: { mensagem: resultado.erro } }));
}

/** Busca os trechos da página — ou de um trecho dela —, cada um uma vez. */
export function ligarCarregamentos(raiz = document) {
    raiz.querySelectorAll('[data-carregar]:not([data-carregar-ligado])').forEach((elemento) => {
        if (elemento.dataset.carregarLigado) {
            return;
        }

        elemento.dataset.carregarLigado = '1';
        carregarTrecho(elemento);
    });
}
