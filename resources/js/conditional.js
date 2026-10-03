/*
 * O bloco que aparece conforme o valor de um campo (`data-mostra-quando`).
 *
 * Os campos da forma de pagamento só fazem sentido com "cartão"
 * escolhido; o endereço de entrega, com a caixa "entregar" marcada. O
 * servidor já desenha o estado inicial (o `hidden` e o `disabled` de
 * quem nasce escondido); aqui só se confirma ao carregar e se reage ao
 * que a pessoa muda.
 *
 *     <fieldset data-mostra-quando="forma=cartao">…</fieldset>
 *     <div data-mostra-quando="forma=cartao|boleto">…</div>
 *     <div data-mostra-quando="entregar">…</div>          qualquer valor, ou a caixa marcada
 *     <div data-mostra-quando="!forma=dinheiro">…</div>   o contrário
 *
 * O campo é o do mesmo `<form>` (ou do documento, fora de um). Escondido,
 * o bloco ganha `hidden`; se é um `<fieldset>` (ou tem
 * `data-mostra-quando-desliga`), ganha `disabled` também, para nada de
 * dentro ir no envio — o servidor não precisa adivinhar se o campo que
 * chegou vazio estava à vista.
 */

// --- Regras ---

/**
 * `"forma=cartao|boleto"` → `{ campo: 'forma', valores: ['cartao', 'boleto'], negado: false }`;
 * `"entregar"` → `{ campo: 'entregar', valores: null, negado: false }` (qualquer valor);
 * `"!forma=dinheiro"` → `negado: true`. Sem campo, `null`.
 */
export function interpretarCondicao(texto) {
    const bruto = String(texto ?? '').trim();
    const negado = bruto.startsWith('!');
    const semSinal = negado ? bruto.slice(1).trim() : bruto;
    const igual = semSinal.indexOf('=');

    const campo = (igual === -1 ? semSinal : semSinal.slice(0, igual)).trim();

    if (campo === '') {
        return null;
    }

    // `campo=` (nada depois do igual) é "o campo está vazio": a lista com o vazio.
    const valores = igual === -1 ? null : semSinal.slice(igual + 1).split('|').map((valor) => valor.trim());

    return { campo, valores, negado };
}

/**
 * Se a condição vale para o valor do campo: um texto (`''` quando o
 * campo está vazio ou a caixa desmarcada) ou, no select de várias, a
 * lista das escolhidas.
 *
 * Sem `valores`, vale qualquer coisa que não seja vazio; com eles, basta
 * um bater (na lista, qualquer escolhida). `negado` inverte.
 */
export function condicaoVale(condicao, valor) {
    if (! condicao) {
        return true;
    }

    const atuais = (Array.isArray(valor) ? valor : [valor]).map((item) => String(item ?? ''));
    const naoVazios = atuais.filter((item) => item !== '');

    const vale = condicao.valores === null
        ? naoVazios.length > 0
        : (atuais.length === 0 ? [''] : atuais).some((item) => condicao.valores.includes(item));

    return condicao.negado ? ! vale : vale;
}

// --- O DOM ---

/** O formulário que governa um elemento: o mais próximo, ou o documento fora de qualquer um. */
function escopoDe(elemento) {
    return elemento.closest('form') ?? document;
}

/** O formulário de um campo: o dono dele (o `form=` conta), ou o documento. */
function escopoDoCampo(campo) {
    return campo.form ?? document;
}

/** Os campos com aquele nome no escopo (`roles` acha `roles[]` também), sem o escondido do interruptor. */
function camposDe(escopo, nome) {
    const nomes = [nome, `${nome}[]`];
    const todos = escopo instanceof HTMLFormElement ? Array.from(escopo.elements) : Array.from(escopo.querySelectorAll('[name]'));

    return todos.filter((campo) => nomes.includes(campo.name) && ! (campo.type === 'hidden' && 'falsy' in campo.dataset));
}

/**
 * O valor atual de um campo pelo nome: numa caixa ou rádio, o do
 * marcado (`''` sem nenhum); num select de várias, a lista; no resto,
 * o `value` do primeiro.
 */
function valorDe(escopo, nome) {
    const campos = camposDe(escopo, nome);

    if (campos.length === 0) {
        return '';
    }

    const marcaveis = campos.filter((campo) => campo.type === 'checkbox' || campo.type === 'radio');

    if (marcaveis.length > 0) {
        const marcados = marcaveis.filter((campo) => campo.checked).map((campo) => campo.value);

        return marcados.length > 1 ? marcados : (marcados[0] ?? '');
    }

    const campo = campos[0];

    if (campo.tagName === 'SELECT' && campo.multiple) {
        return Array.from(campo.selectedOptions, (opcao) => opcao.value);
    }

    return campo.value ?? '';
}

/** Mostra ou esconde o bloco conforme a condição, agora. */
function aplicar(elemento) {
    const condicao = interpretarCondicao(elemento.dataset.mostraQuando);

    if (! condicao) {
        return;
    }

    const vale = condicaoVale(condicao, valorDe(escopoDe(elemento), condicao.campo));

    elemento.hidden = ! vale;

    /*
     * Escondido não é só invisível: o que está dentro não vai no envio.
     * No `<fieldset>`, o `disabled` desliga todos os campos de dentro de
     * uma vez, e religar devolve cada um ao que era (o campo que já
     * estava desligado por outra razão continua assim). É por isso que
     * o `<fieldset>` é o jeito recomendado.
     *
     * Noutro elemento com `data-mostra-quando-desliga`, os campos de
     * dentro são desligados um a um — e só os que este módulo desligou
     * voltam, pela marca que ele deixa.
     */
    if (elemento.tagName === 'FIELDSET') {
        elemento.disabled = ! vale;

        return;
    }

    if (elemento.dataset.mostraQuandoDesliga === undefined) {
        return;
    }

    elemento.querySelectorAll('input, select, textarea, button').forEach((campo) => {
        if (! vale && ! campo.disabled) {
            campo.disabled = true;
            campo.dataset.mostraQuandoDesligou = '1';
        } else if (vale && campo.dataset.mostraQuandoDesligou) {
            campo.disabled = false;
            delete campo.dataset.mostraQuandoDesligou;
        }
    });
}

/** Refaz os blocos que dependem de um campo que mudou, no escopo dele. */
function aoMudar(evento) {
    const campo = evento.target;
    const nome = String(campo?.name ?? '').replace(/\[\]$/, '');

    if (nome === '') {
        return;
    }

    const escopo = escopoDoCampo(campo);

    document.querySelectorAll('[data-mostra-quando]').forEach((elemento) => {
        const condicao = interpretarCondicao(elemento.dataset.mostraQuando);

        if (condicao?.campo === nome && escopoDe(elemento) === escopo) {
            aplicar(elemento);
        }
    });
}

let escutando = false;

/**
 * Os ouvintes ficam no `document`, uma vez só: um bloco que entra
 * depois (a linha nova do repetidor, o modal carregado sem recarregar)
 * já reage. Para cada bloco de `raiz`, o estado é acertado uma vez.
 */
export function ligarCondicionais(raiz = document) {
    if (! escutando) {
        document.addEventListener('input', aoMudar);
        document.addEventListener('change', aoMudar);
        escutando = true;
    }

    raiz.querySelectorAll('[data-mostra-quando]').forEach(aplicar);
}
