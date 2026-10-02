/*
 * A requisição JSON (resources/js/fetch.js): o que vai para o servidor e o
 * que volta de cada resposta. O `fetch` é trocado por um que devolve a
 * resposta combinada, então roda com `npm test`, sem navegador e sem servidor.
 */
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { ErroDeRequisicao, mensagemDe, requisicaoJson, xsrfToken } from '../../resources/js/fetch.js';

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

/** A requisição que tem de falhar: devolve o erro, para o teste olhar dentro. */
async function falha(promessa) {
    try {
        await promessa;
    } catch (erro) {
        return erro;
    }

    assert.fail('a requisição devia ter falhado');
}

afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete globalThis.document;
});

test('200 com JSON devolve o JSON', async () => {
    responder(Response.json({ id: 7, nome: 'Padaria' }));

    assert.deepEqual(await requisicaoJson('/clientes/7'), { id: 7, nome: 'Padaria' });
});

test('204 devolve null', async () => {
    responder(new Response(null, { status: 204 }));

    assert.equal(await requisicaoJson('/clientes/7', { method: 'DELETE' }), null);
});

test('HEAD devolve null: a resposta não tem corpo', async () => {
    responder(new Response(null, { status: 200, headers: { 'Content-Type': 'application/json' } }));

    assert.equal(await requisicaoJson('/clientes/7', { method: 'HEAD' }), null);
});

test('200 em HTML é recusado: é a resposta de outra coisa', async () => {
    responder(new Response('<!doctype html><title>Entrar</title>', { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));

    const erro = await falha(requisicaoJson('/clientes/7'));

    assert.ok(erro instanceof ErroDeRequisicao);
    assert.equal(erro.status, 200);
    assert.equal(erro.mensagem, 'Resposta inesperada do servidor.');
    assert.equal(erro.message, 'Resposta inesperada do servidor.');
    assert.deepEqual(erro.erros, {});
    assert.equal(erro.correlationId, null);
});

test('200 que diz ser JSON mas não se lê também é recusado', async () => {
    responder(new Response('{"id": 7', { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const erro = await falha(requisicaoJson('/clientes/7'));

    assert.equal(erro.status, 200);
    assert.equal(erro.mensagem, 'Resposta inesperada do servidor.');
});

test('401 e 419 viram "sessão expirou", não o inglês do Laravel', async () => {
    responder(Response.json({ message: 'Unauthenticated.' }, { status: 401 }));
    const naoAutenticado = await falha(requisicaoJson('/clientes'));

    responder(Response.json({ message: 'CSRF token mismatch.' }, { status: 419 }));
    const tokenVencido = await falha(requisicaoJson('/clientes', { method: 'POST', body: {} }));

    assert.equal(naoAutenticado.status, 401);
    assert.equal(naoAutenticado.mensagem, 'Sua sessão expirou. Entre de novo para continuar.');
    assert.equal(tokenVencido.status, 419);
    assert.equal(tokenVencido.mensagem, 'Sua sessão expirou. Entre de novo para continuar.');
});

test('422 traz a mensagem e os erros do Laravel', async () => {
    const errors = { nome: ['O campo nome é obrigatório.'], 'itens.0.preco': ['O preço deve ser maior que zero.'] };

    responder(Response.json({ message: 'O campo nome é obrigatório. (e mais 1 erro)', errors }, { status: 422 }));

    const erro = await falha(requisicaoJson('/clientes', { method: 'POST', body: { nome: '' } }));

    assert.equal(erro.status, 422);
    assert.equal(erro.mensagem, 'O campo nome é obrigatório. (e mais 1 erro)');
    assert.deepEqual(erro.erros, errors);
});

test('422 sem errors deixa os erros vazios', async () => {
    responder(Response.json({ message: 'Dados inválidos.' }, { status: 422 }));

    const erro = await falha(requisicaoJson('/clientes', { method: 'POST', body: {} }));

    assert.deepEqual(erro.erros, {});
});

test('403, 404 e 429 têm a mensagem daqui', async () => {
    const casos = [
        [403, 'This action is unauthorized.', 'Você não tem permissão para esta ação.'],
        [404, 'Not Found', 'Não encontrado.'],
        [429, 'Too Many Attempts.', 'Muitas tentativas. Aguarde um instante.'],
    ];

    for (const [status, doLaravel, esperada] of casos) {
        responder(Response.json({ message: doLaravel }, { status }));

        const erro = await falha(requisicaoJson('/clientes/7'));

        assert.equal(erro.status, status);
        assert.equal(erro.mensagem, esperada);
    }
});

test('500 com correlation_id traz a mensagem do servidor e o código', async () => {
    responder(Response.json({ message: 'Erro ao gerar o boleto.', correlation_id: '9f1c2e7a-4b3d-4e21-a0c5-7d8e9fab12cd' }, { status: 500 }));

    const erro = await falha(requisicaoJson('/cobrancas', { method: 'POST', body: {} }));

    assert.equal(erro.status, 500);
    assert.equal(erro.mensagem, 'Erro ao gerar o boleto.');
    assert.equal(erro.correlationId, '9f1c2e7a-4b3d-4e21-a0c5-7d8e9fab12cd');
    assert.equal(mensagemDe(erro), 'Erro ao gerar o boleto. (código AB12CD)');
});

test('500 sem JSON fica com a mensagem genérica', async () => {
    responder(new Response('<h1>Server Error</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } }));

    const erro = await falha(requisicaoJson('/cobrancas'));

    assert.equal(erro.status, 500);
    assert.equal(erro.mensagem, 'Não foi possível concluir a operação.');
    assert.equal(erro.correlationId, null);
});

test('sem rede: status 0 e "sem conexão"', async () => {
    responder(null, { erro: new TypeError('fetch failed') });

    const erro = await falha(requisicaoJson('/clientes'));

    assert.ok(erro instanceof ErroDeRequisicao);
    assert.equal(erro.status, 0);
    assert.equal(erro.mensagem, 'Sem conexão com o servidor.');
});

test('o cancelamento volta como o AbortError que era', async () => {
    const cancelada = new DOMException('This operation was aborted', 'AbortError');

    responder(null, { erro: cancelada });

    assert.equal(await falha(requisicaoJson('/clientes')), cancelada);
});

test('POST manda os cabeçalhos, o token do cookie e o corpo em JSON', async () => {
    globalThis.document = { cookie: 'tema=escuro; XSRF-TOKEN=eyJpdiI6IkFiYyJ9%3D%3D; laravel_session=abc' };
    responder(Response.json({ id: 8 }, { status: 201 }));

    assert.deepEqual(await requisicaoJson('/clientes', { method: 'post', body: { nome: 'Gráfica', ativo: true } }), { id: 8 });

    const [{ url, init }] = chamadas;

    assert.equal(url, '/clientes');
    assert.equal(init.method, 'POST');
    assert.equal(init.credentials, 'same-origin');
    assert.equal(init.headers.get('Accept'), 'application/json');
    assert.equal(init.headers.get('X-Requested-With'), 'XMLHttpRequest');
    assert.equal(init.headers.get('Content-Type'), 'application/json');
    assert.equal(init.headers.get('X-XSRF-TOKEN'), 'eyJpdiI6IkFiYyJ9==');
    assert.equal(init.body, '{"nome":"Gráfica","ativo":true}');
});

test('GET não leva Content-Type, token nem corpo', async () => {
    globalThis.document = { cookie: 'XSRF-TOKEN=abc' };
    responder(Response.json([]));

    await requisicaoJson('/clientes?q=padaria');

    const [{ init }] = chamadas;

    assert.equal(init.method, 'GET');
    assert.equal(init.headers.get('Accept'), 'application/json');
    assert.equal(init.headers.get('X-Requested-With'), 'XMLHttpRequest');
    assert.equal(init.headers.has('Content-Type'), false);
    assert.equal(init.headers.has('X-XSRF-TOKEN'), false);
    assert.equal(init.body, undefined);
});

test('GET com corpo é engano de quem chama, não falta de rede', async () => {
    responder(Response.json({}));

    const erro = await falha(requisicaoJson('/clientes', { body: { q: 'padaria' } }));

    assert.ok(erro instanceof TypeError);
    assert.equal(chamadas.length, 0);
});

test('FormData vai como está, sem Content-Type: quem escreve é o navegador', async () => {
    globalThis.document = { cookie: 'XSRF-TOKEN=abc' };
    responder(Response.json({ ok: true }));

    const dados = new FormData();
    dados.append('arquivo', 'conteúdo');

    await requisicaoJson('/anexos', { method: 'POST', body: dados });

    const [{ init }] = chamadas;

    assert.equal(init.body, dados);
    assert.equal(init.headers.has('Content-Type'), false);
    assert.equal(init.headers.get('X-XSRF-TOKEN'), 'abc');
});

test('os cabeçalhos de quem chama vencem os daqui', async () => {
    responder(Response.json({}));

    await requisicaoJson('/relatorio', { headers: { accept: 'application/vnd.api+json', 'X-Tela': 'cobrancas' } });

    const [{ init }] = chamadas;

    assert.equal(init.headers.get('Accept'), 'application/vnd.api+json');
    assert.equal(init.headers.get('X-Tela'), 'cobrancas');
});

test('xsrfToken lê o cookie e o decodifica', () => {
    assert.equal(xsrfToken('XSRF-TOKEN=eyJpdiI6IkFiYyJ9%3D%3D'), 'eyJpdiI6IkFiYyJ9==');
    assert.equal(xsrfToken('tema=escuro;  XSRF-TOKEN=abc%2Bdef ; outro=1'), 'abc+def');
});

test('xsrfToken sem o cookie volta vazio', () => {
    assert.equal(xsrfToken('tema=escuro; laravel_session=abc'), '');
    assert.equal(xsrfToken(''), '');
    assert.equal(xsrfToken(), '');
});

test('xsrfToken não confunde nome parecido', () => {
    assert.equal(xsrfToken('XSRF-TOKEN2=errado'), '');
    assert.equal(xsrfToken('MEU-XSRF-TOKEN=errado; XSRF-TOKEN2=errado; XSRF-TOKEN=certo'), 'certo');
});

test('xsrfToken com o cookie estragado volta vazio', () => {
    assert.equal(xsrfToken('XSRF-TOKEN=%E0%A4%A'), '');
});

test('mensagemDe dá o texto para a pessoa de qualquer erro', () => {
    assert.equal(mensagemDe(new ErroDeRequisicao('Não encontrado.', { status: 404 })), 'Não encontrado.');
    assert.equal(mensagemDe(new ErroDeRequisicao('Falhou.', { status: 500, correlationId: 'req-1a2b3c4d' })), 'Falhou. (código 2B3C4D)');
    assert.equal(mensagemDe(new TypeError("Cannot read properties of undefined (reading 'id')")), 'Não foi possível concluir a operação.');
    assert.equal(mensagemDe(null), 'Não foi possível concluir a operação.');
});
