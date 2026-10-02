/*
 * A requisição JSON do projeto.
 *
 * Todo `fetch` que fala com o Laravel sem recarregar a página repete as
 * mesmas coisas: pedir JSON, mandar o token do CSRF, ler o 422, traduzir
 * o 419 do inglês. Aqui isso é feito uma vez só — quem chama recebe o
 * JSON da resposta ou um `ErroDeRequisicao` com a mensagem já pronta
 * para mostrar.
 *
 * Os erros de um 422 vão para os campos pelo `mostrarErros` do errors.js;
 * o resto, para um toast com `mensagemDe(erro)`.
 */

/** A mensagem quando nada mais específico se aplica. */
const FALHA = 'Não foi possível concluir a operação.';

/*
 * Os status com mensagem própria, que vence a do servidor: o que o
 * Laravel responde neles vem em inglês ("Unauthenticated.", "CSRF token
 * mismatch.", "This action is unauthorized.") e não serve à pessoa.
 *
 * 401 e 419 dizem a mesma coisa para quem está na tela: o 419 é o token
 * do formulário que venceu junto com a sessão.
 */
const MENSAGEM_DO_STATUS = {
    401: 'Sua sessão expirou. Entre de novo para continuar.',
    419: 'Sua sessão expirou. Entre de novo para continuar.',
    403: 'Você não tem permissão para esta ação.',
    404: 'Não encontrado.',
    429: 'Muitas tentativas. Aguarde um instante.',
};

/** A resposta cujo corpo não é JSON (ou não se lê como tal). */
const SEM_JSON = Symbol('sem JSON');

/**
 * O token do CSRF, do cookie `XSRF-TOKEN` que o Laravel devolve em toda
 * resposta.
 *
 * O cookie, e não a `<meta name="csrf-token">`: ele acompanha a sessão.
 * Se ela trocou de token (um login em outra aba), o cookie já traz o
 * novo, e a meta continua com o do carregamento da página. Vai no
 * `X-XSRF-TOKEN`, que o Laravel decifra.
 *
 * Sem o cookie, ou com ele estragado, volta vazio — e o servidor
 * responde 419, que vira "sessão expirou".
 */
export function xsrfToken(cookies = globalThis.document?.cookie ?? '') {
    for (const pedaco of String(cookies).split(';')) {
        const igual = pedaco.indexOf('=');

        // O nome inteiro, não o começo: `XSRF-TOKEN2` é outro cookie.
        if (igual === -1 || pedaco.slice(0, igual).trim() !== 'XSRF-TOKEN') {
            continue;
        }

        try {
            return decodeURIComponent(pedaco.slice(igual + 1).trim());
        } catch {
            return '';
        }
    }

    return '';
}

/**
 * A requisição que não deu certo, já com o que mostrar.
 *
 * `status` é o HTTP da resposta (0 quando ela nem chegou); `mensagem`, o
 * texto em português para a pessoa; `erros`, os do 422 no formato do
 * Laravel (`{ campo: ['mensagem'] }`), prontos para o `mostrarErros`;
 * `correlationId`, o código que o servidor deu ao erro, para achá-lo no
 * log quando a pessoa ligar.
 */
export class ErroDeRequisicao extends Error {
    constructor(mensagem, { status = 0, erros = {}, correlationId = null } = {}) {
        super(mensagem);

        this.name = 'ErroDeRequisicao';
        this.status = status;
        this.mensagem = mensagem;
        this.erros = erros;
        this.correlationId = correlationId;
    }
}

/**
 * Faz a requisição e devolve o JSON da resposta (`null` no 204).
 *
 * `body` é um objeto, que vai como JSON, ou um `FormData` (com arquivo),
 * que vai como está. Qualquer resposta fora do 2xx, ou um 2xx que não
 * seja JSON, vira `ErroDeRequisicao`. O cancelamento pelo `signal` volta
 * como o `AbortError` de sempre: quem cancelou sabe, e não há o que
 * avisar.
 */
export async function requisicaoJson(url, { method = 'GET', body = null, headers = {}, signal } = {}) {
    const metodo = String(method).toUpperCase();
    const soLeitura = metodo === 'GET' || metodo === 'HEAD';
    const formulario = body instanceof FormData;

    /*
     * O `fetch` recusaria do mesmo jeito, mas com um TypeError que aqui
     * viraria "sem conexão" — e o engano é de quem chamou, não da rede.
     */
    if (soLeitura && body != null) {
        throw new TypeError(`requisicaoJson: ${metodo} não leva corpo; os parâmetros vão na URL.`);
    }

    /*
     * Os dois fazem o Laravel tratar a requisição como AJAX (`expectsJson`):
     * o erro volta em JSON, e a sessão vencida dá 401 em vez de
     * redirecionar para a tela de login.
     */
    const cabecalhos = new Headers({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    });

    if (! soLeitura) {
        // O FormData leva o próprio Content-Type, com a fronteira entre as partes: quem o escreve é o navegador.
        if (! formulario) {
            cabecalhos.set('Content-Type', 'application/json');
        }

        cabecalhos.set('X-XSRF-TOKEN', xsrfToken());
    }

    // Os de quem chamou vencem os daqui — sem duplicar por diferença de maiúscula.
    new Headers(headers).forEach((valor, nome) => cabecalhos.set(nome, valor));

    let resposta;
    let texto;

    try {
        resposta = await fetch(url, {
            method: metodo,
            credentials: 'same-origin',
            headers: cabecalhos,
            body: body == null ? undefined : (formulario ? body : JSON.stringify(body)),
            signal,
        });

        texto = await resposta.text();
    } catch (erro) {
        // Cancelada por quem chamou (inclusive por tempo esgotado no `signal`): volta como veio.
        if (erro?.name === 'AbortError' || signal?.aborted) {
            throw erro;
        }

        throw new ErroDeRequisicao('Sem conexão com o servidor.', { status: 0 });
    }

    const json = lerJson(resposta, texto);

    if (resposta.ok) {
        if (resposta.status === 204 || metodo === 'HEAD') {
            return null;
        }

        /*
         * Um 2xx em HTML é a resposta de outra coisa — uma página que
         * redirecionou, uma rota que devolve tela. Seguir com ela como se
         * fosse o dado esperado quebraria mais adiante, longe daqui.
         */
        if (json === SEM_JSON) {
            throw new ErroDeRequisicao('Resposta inesperada do servidor.', { status: resposta.status });
        }

        return json;
    }

    const dados = json !== SEM_JSON && json !== null && typeof json === 'object' ? json : {};
    const doServidor = typeof dados.message === 'string' && dados.message.trim() !== '' ? dados.message : null;
    const correlationId = dados.correlation_id != null ? String(dados.correlation_id) : null;
    const status = resposta.status;

    if (status === 422) {
        throw new ErroDeRequisicao(doServidor ?? FALHA, { status, erros: dados.errors ?? {}, correlationId });
    }

    throw new ErroDeRequisicao(MENSAGEM_DO_STATUS[status] ?? doServidor ?? FALHA, { status, correlationId });
}

/**
 * O texto a mostrar à pessoa para qualquer erro.
 *
 * O de um `ErroDeRequisicao` é a mensagem dele; o de outro erro (um bug,
 * um TypeError) não é texto para a tela, e vira o genérico. Com código de
 * correlação, os 6 últimos caracteres vão junto: é o que a pessoa lê
 * para o suporte, e basta para achar o erro no log.
 */
export function mensagemDe(erro) {
    const mensagem = erro instanceof ErroDeRequisicao && erro.mensagem ? erro.mensagem : FALHA;
    const codigo = erro?.correlationId;

    return codigo ? `${mensagem} (código ${String(codigo).slice(-6).toUpperCase()})` : mensagem;
}

/** O JSON do corpo, ou `SEM_JSON` quando ele não é (pelo Content-Type) ou não se lê. */
function lerJson(resposta, texto) {
    // `application/json`, com ou sem charset, e os `+json` (`application/problem+json`).
    if (! /[/+]json\b/i.test(resposta.headers.get('Content-Type') ?? '')) {
        return SEM_JSON;
    }

    try {
        return JSON.parse(texto);
    } catch {
        return SEM_JSON;
    }
}
