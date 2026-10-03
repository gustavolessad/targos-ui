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
 *     <div data-mostra-quando="entrada=1&!origem=transferencia">…</div>   todas valem
 *     <div data-mostra-quando="produto.unidade=KG">…</div>   pelo `extra` da opção escolhida
 *
 * Várias condições separadas por `&` valem todas ao mesmo tempo.
 * `campo.chave` não olha o valor do campo, e sim a `chave` dos dados
 * (`extra`) da opção escolhida num `x-ui.select` — o preço, a unidade,
 * o tipo do depósito, que vêm no `data-extra` da `<option>` (ver
 * select.js, `escolhaDe`); num rádio ou caixa, o `data-extra` do
 * marcado. `campo.chave` sozinho é "a chave tem valor".
 *
 * O campo é o do mesmo `<form>` (ou do documento, fora de um). Escondido,
 * o bloco ganha `hidden`; se é um `<fieldset>` (ou tem
 * `data-mostra-quando-desliga`), ganha `disabled` também, para nada de
 * dentro ir no envio — o servidor não precisa adivinhar se o campo que
 * chegou vazio estava à vista.
 */

import { escolhaDe, lerExtra } from './select.js';

// --- Regras ---

/**
 * `"forma=cartao|boleto"` → `{ campo: 'forma', chave: null, valores: ['cartao', 'boleto'], negado: false }`;
 * `"entregar"` → `{ campo: 'entregar', chave: null, valores: null, negado: false }` (qualquer valor);
 * `"!forma=dinheiro"` → `negado: true`;
 * `"produto.unidade=KG"` → `{ campo: 'produto', chave: 'unidade', … }` (a chave do `extra` da opção).
 * Sem campo, `null`. Uma condição só: as várias, com `&`, são de `interpretarCondicoes`.
 */
export function interpretarCondicao(texto) {
    const bruto = String(texto ?? '').trim();
    const negado = bruto.startsWith('!');
    const semSinal = negado ? bruto.slice(1).trim() : bruto;
    const igual = semSinal.indexOf('=');

    const nome = (igual === -1 ? semSinal : semSinal.slice(0, igual)).trim();

    /*
     * O ponto separa o campo da chave do `extra`: `produto.unidade`.
     * Só o primeiro: `produto.dados.unidade` é a chave `dados.unidade`,
     * que `valorDaChave` desce. O nome de campo com colchete
     * (`items[0][kind]`) não tem ponto, e fica inteiro.
     */
    const ponto = nome.indexOf('.');
    const campo = (ponto === -1 ? nome : nome.slice(0, ponto)).trim();
    const chave = ponto === -1 ? null : nome.slice(ponto + 1).trim();

    if (campo === '' || chave === '') {
        return null;
    }

    // `campo=` (nada depois do igual) é "o campo está vazio": a lista com o vazio.
    const valores = igual === -1 ? null : semSinal.slice(igual + 1).split('|').map((valor) => valor.trim());

    return { campo, chave, valores, negado };
}

/**
 * As condições de um `data-mostra-quando`: uma por parte separada por
 * `&` (`entrada=1&!origem=transferencia`), na ordem. A parte sem campo
 * é ignorada; sem nenhuma que valha, a lista vem vazia — e o bloco
 * aparece, como sem condição.
 */
export function interpretarCondicoes(texto) {
    return String(texto ?? '')
        .split('&')
        .map(interpretarCondicao)
        .filter((condicao) => condicao !== null);
}

/**
 * O valor de uma chave dos dados da opção (`extra`), como a condição o
 * compara: texto. `true` é "1" e `false`, nulo e o que não existe são
 * vazio — `campo.chave` sozinho é "a chave está ligada ou preenchida",
 * e `campo.chave=1` casa com `true`. O número é o texto dele (0 é "0",
 * um valor, como num campo que diz 0). A chave com ponto desce nos
 * dados (`dados.unidade`). Numa lista de `extra`s (o select de
 * várias), a lista dos valores, um por escolhida; uma lista dentro dos
 * dados vira a lista dos textos (basta um bater, como no select de várias).
 */
export function valorDaChave(extra, chave) {
    if (Array.isArray(extra)) {
        return extra.map((item) => valorDaChave(item, chave));
    }

    const valor = String(chave ?? '').split('.').reduce(
        (atual, parte) => (atual !== null && typeof atual === 'object' ? atual[parte] : undefined),
        extra,
    );

    if (Array.isArray(valor)) {
        return valor.map(textoDoDado);
    }

    return textoDoDado(valor);
}

/** Um dado do `extra` como texto: nulo e `false` são vazio, `true` é "1", o resto é o texto dele. */
function textoDoDado(valor) {
    if (valor === null || valor === undefined || valor === false) {
        return '';
    }

    if (valor === true) {
        return '1';
    }

    return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
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

/**
 * Se todas as condições valem. `valorDe(condicao)` dá o valor com que
 * cada uma se compara — o do campo, ou o da chave do `extra` quando a
 * condição tem `chave`. Sem condição nenhuma, vale.
 */
export function condicoesValem(condicoes, valorDe) {
    return (condicoes ?? []).every((condicao) => condicaoVale(condicao, valorDe(condicao)));
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

/**
 * Os dados (`extra`) da opção escolhida num campo pelo nome: no
 * `x-ui.select`, o `data-extra` da `<option>` marcada (pelo
 * `escolhaDe`, que o lê e guarda; nas várias, a lista); num rádio ou
 * caixa, o `data-extra` do marcado. Sem escolha ou sem dados, `null`.
 */
function extraDe(escopo, nome) {
    const campos = camposDe(escopo, nome);

    if (campos.length === 0) {
        return null;
    }

    const marcaveis = campos.filter((campo) => campo.type === 'checkbox' || campo.type === 'radio');

    if (marcaveis.length > 0) {
        const extras = marcaveis.filter((campo) => campo.checked).map((campo) => lerExtra(campo.dataset.extra));

        return extras.length > 1 ? extras : (extras[0] ?? null);
    }

    const campo = campos[0];

    if (campo.tagName !== 'SELECT') {
        return null;
    }

    const escolha = escolhaDe(campo);

    return campo.multiple ? (escolha?.extras ?? []) : (escolha?.extra ?? null);
}

/** O valor com que a condição se compara: o do campo, ou o da chave do `extra` da escolha. */
function valorDaCondicao(escopo, condicao) {
    return condicao.chave === null
        ? valorDe(escopo, condicao.campo)
        : valorDaChave(extraDe(escopo, condicao.campo), condicao.chave);
}

/** Mostra ou esconde o bloco conforme as condições, agora. */
function aplicar(elemento) {
    const condicoes = interpretarCondicoes(elemento.dataset.mostraQuando);

    if (condicoes.length === 0) {
        return;
    }

    const escopo = escopoDe(elemento);
    const vale = condicoesValem(condicoes, (condicao) => valorDaCondicao(escopo, condicao));

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
        const dependeDele = interpretarCondicoes(elemento.dataset.mostraQuando).some((condicao) => condicao.campo === nome);

        if (dependeDele && escopoDe(elemento) === escopo) {
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
