/*
 * As linhas que a pessoa adiciona, remove e reordena (<x-ui.repeater>).
 *
 * O servidor desenha as linhas e, no fim da lista, um `<template>` com a
 * linha modelo, que tem `__i__` no lugar do índice. Adicionar é copiar o
 * modelo com o próximo índice e ligar nele os campos do pacote; remover
 * e mover mexem só no DOM.
 *
 * Os `name`s nunca são renumerados: a ordem enviada é a ordem no DOM, e
 * quem precisa da posição explícita põe na linha um
 * `<input type="hidden" data-repetidor-posicao>`, que daqui recebe 0, 1, 2…
 *
 * Cada mudança dispara `ui:repetidor` no envelope (sobe pelo DOM), com
 * `detail: { acao, item, indice }` — `acao` é `adicionado`, `removido` ou
 * `movido`. É onde o projeto liga o que é dele na linha nova (a busca
 * de CEP) ou refaz um total.
 */
import { ligarMascaras } from './masks.js';
import { ligarSeletores } from './select.js';
import { ligarDatas } from './date.js';
import { ligarPeriodos } from './date-range.js';
import { ligarDinheiro } from './money.js';
import { ligarNumeros } from './number.js';
import { ligarPercentuais } from './percent.js';
import { ligarDicas } from './tooltip.js';

/** O que o Blade põe no lugar do índice, no modelo. */
const MARCA = '__i__';

// --- Regras ---

/** Troca todo `__i__` do modelo (atributos e texto) pelo índice da linha nova. */
export function substituirIndice(html, indice) {
    return String(html).replaceAll(MARCA, String(indice));
}

/**
 * O índice da próxima linha: o maior que já existe, mais um; sem
 * nenhum, 0. Aceita números ou o texto do `data-repetidor-indice`, e
 * ignora o que não é inteiro (`__i__`, uma chave como `abc`).
 */
export function proximoIndice(indices) {
    const numeros = [...(indices ?? [])]
        .map((indice) => (typeof indice === 'number' ? indice : /^\d+$/.test(String(indice ?? '').trim()) ? Number(indice) : Number.NaN))
        .filter((numero) => Number.isInteger(numero) && numero >= 0);

    return numeros.length === 0 ? 0 : Math.max(...numeros) + 1;
}

/** Tirar uma linha deixa o total no mínimo ou acima? Sem linha, não há o que tirar. */
export function podeRemover(total, min = 0) {
    return total > (Number.isFinite(min) ? Math.max(min, 0) : 0);
}

/** Cabe mais uma? Sem `max` (null, ou o que não é número), não há teto. */
export function podeAdicionar(total, max = null) {
    return ! Number.isFinite(max) || total < max;
}

// --- O envelope ---

/** `data-repetidor-max="5"` → 5; ausente ou inválido → null. */
function limite(texto) {
    if (texto === undefined || texto.trim() === '') {
        return null;
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : null;
}

/*
 * Os elementos que são deste repetidor, e não de outro dentro de uma
 * linha dele: o mais próximo de cada um tem de ser este.
 */
function doRepetidor(envelope, seletor) {
    return [...envelope.querySelectorAll(seletor)].filter((elemento) => elemento.closest('[data-repetidor]') === envelope);
}

/** O mesmo, para os elementos de uma linha. */
function daLinha(linha, seletor) {
    return [...linha.querySelectorAll(seletor)].filter((elemento) => elemento.closest('[data-repetidor-item]') === linha);
}

function linhasDe(envelope) {
    return doRepetidor(envelope, '[data-repetidor-item]');
}

function avisar(envelope, acao, linha) {
    envelope.dispatchEvent(new CustomEvent('ui:repetidor', {
        bubbles: true,
        detail: { acao, item: linha, indice: linha.dataset.repetidorIndice },
    }));
}

/**
 * Deixa os botões e o resto de acordo com o número de linhas: o
 * "adicionar" desligado no teto, o "remover" escondido no mínimo, o
 * "subir" da primeira e o "descer" da última desligados, o texto de
 * vazio só sem linhas, e as posições na ordem da tela.
 */
function atualizar(envelope) {
    const linhas = linhasDe(envelope);
    const total = linhas.length;
    const removivel = podeRemover(total, limite(envelope.dataset.repetidorMin) ?? 0);

    doRepetidor(envelope, '[data-repetidor-adicionar]').forEach((botao) => {
        botao.disabled = ! podeAdicionar(total, limite(envelope.dataset.repetidorMax));
    });

    doRepetidor(envelope, '[data-repetidor-vazio]').forEach((vazio) => {
        vazio.hidden = total > 0;
    });

    linhas.forEach((linha, posicao) => {
        daLinha(linha, '[data-repetidor-remover]').forEach((botao) => {
            botao.hidden = ! removivel;
        });

        daLinha(linha, '[data-repetidor-subir]').forEach((botao) => {
            botao.disabled = posicao === 0;
        });

        daLinha(linha, '[data-repetidor-descer]').forEach((botao) => {
            botao.disabled = posicao === total - 1;
        });

        daLinha(linha, '[data-repetidor-posicao]').forEach((campo) => {
            campo.value = String(posicao);
        });
    });
}

/*
 * Os campos do pacote numa linha que acabou de nascer. Na ordem do
 * `ligarUi()`: a máscara antes da data, que usa uma no campo digitável.
 *
 * Depois de a linha entrar na página, não antes: o campo sem pontuação
 * acha o escondido pelo `id` no documento, e o select mede a tela.
 */
function ligarCampos(linha) {
    ligarMascaras(linha);
    ligarSeletores(linha);
    ligarDatas(linha);
    ligarDinheiro(linha);
    ligarNumeros(linha);
    ligarPercentuais(linha);
    ligarDicas(linha);
    ligarPeriodos(linha);
}

/*
 * O primeiro campo em que se digita, para o foco.
 *
 * Os nativos que o valor, a data e o select escondem saíram do Tab
 * (`tabIndex = -1`) ao ligar, como os botões de ajuda dos campos; o
 * que tem `hidden` ou não ocupa espaço não está à vista.
 */
function primeiroCampo(linha) {
    return [...linha.querySelectorAll('input:not([type="hidden"]), select, textarea, button, [contenteditable], [tabindex]')]
        .find((elemento) => elemento.tabIndex >= 0
            && ! elemento.disabled
            && ! elemento.closest('[hidden]')
            && ! elemento.closest('[data-repetidor-subir], [data-repetidor-descer], [data-repetidor-remover]')
            && elemento.getClientRects().length > 0);
}

// --- As ações ---

/**
 * Acrescenta uma linha no fim, a partir do modelo, e devolve-a (ou
 * `null`, no teto ou sem modelo).
 *
 * Exposta para o projeto que adiciona por outro caminho — o produto
 * escolhido numa busca vira um item da venda: com a linha na mão, ele
 * preenche os campos.
 */
export function adicionarLinha(envelope) {
    const modelo = doRepetidor(envelope, 'template[data-repetidor-modelo]')[0];
    const linhas = linhasDe(envelope);

    if (! modelo || ! podeAdicionar(linhas.length, limite(envelope.dataset.repetidorMax))) {
        return null;
    }

    /*
     * O maior entre o que o servidor disse e o que há na tela: uma linha
     * posta por outro script não tem o índice dela repetido. E o número
     * só avança — o de uma linha removida não volta, para um erro que
     * chegue depois não cair na linha errada.
     */
    const indice = Math.max(limite(envelope.dataset.repetidorProximo) ?? 0, proximoIndice(linhas.map((linha) => linha.dataset.repetidorIndice)));
    envelope.dataset.repetidorProximo = String(indice + 1);

    // Pelo HTML, e não pela árvore: o `__i__` está em `name`, `id`, `for`, `aria-*` e onde mais o projeto o pôs.
    const copia = document.createElement('template');
    copia.innerHTML = substituirIndice(modelo.innerHTML, indice);

    const linha = copia.content.querySelector('[data-repetidor-item]');

    if (! linha) {
        return null;
    }

    modelo.before(linha);

    ligarCampos(linha);
    atualizar(envelope);

    primeiroCampo(linha)?.focus();
    avisar(envelope, 'adicionado', linha);

    return linha;
}

function remover(envelope, linha) {
    const linhas = linhasDe(envelope);

    if (! podeRemover(linhas.length, limite(envelope.dataset.repetidorMin) ?? 0)) {
        return;
    }

    // O foco ia junto com a linha, para o começo da página: vai para a linha que fica no lugar dela.
    const posicao = linhas.indexOf(linha);
    const vizinha = linhas[posicao + 1] ?? linhas[posicao - 1] ?? null;

    linha.remove();
    atualizar(envelope);

    const destino = (vizinha && daLinha(vizinha, '[data-repetidor-remover]:not([hidden])')[0])
        ?? doRepetidor(envelope, '[data-repetidor-adicionar]:not(:disabled)')[0]
        ?? (vizinha && primeiroCampo(vizinha));

    destino?.focus();
    avisar(envelope, 'removido', linha);
}

/**
 * Tira todas as linhas de uma vez (o depósito mudou, e os itens eram
 * daquele depósito). Ignora o `min`: quem limpa por código decide o
 * que vem depois, e o `ui:repetidor` sai uma vez só, com `acao: 'limpo'`.
 */
export function limparLinhas(envelope) {
    linhasDe(envelope).forEach((linha) => linha.remove());
    atualizar(envelope);
    avisar(envelope, 'limpo', null);
}

function mover(envelope, linha, sentido, botao) {
    const linhas = linhasDe(envelope);
    const outra = linhas[linhas.indexOf(linha) + sentido];

    if (! outra) {
        return;
    }

    /*
     * Quem muda de lugar é a vizinha: a linha com o foco fica onde está
     * no DOM, e o foco não se perde — tirar um elemento da página,
     * mesmo que para pô-lo logo adiante, leva o foco para o `<body>`.
     */
    if (sentido < 0) {
        linha.after(outra);
    } else {
        linha.before(outra);
    }

    atualizar(envelope);

    // Chegou à ponta: o botão apertado desligou, e o foco passa para o do outro sentido.
    if (botao.disabled) {
        daLinha(linha, sentido < 0 ? '[data-repetidor-descer]' : '[data-repetidor-subir]')[0]?.focus();
    }

    avisar(envelope, 'movido', linha);
}

function aoClicar(evento) {
    const botao = evento.target.closest('[data-repetidor-adicionar], [data-repetidor-remover], [data-repetidor-subir], [data-repetidor-descer]');
    const envelope = botao?.closest('[data-repetidor]');

    if (! envelope) {
        return;
    }

    if (botao.dataset.repetidorAdicionar !== undefined) {
        adicionarLinha(envelope);

        return;
    }

    const linha = botao.closest('[data-repetidor-item]');

    if (! linha || linha.closest('[data-repetidor]') !== envelope) {
        return;
    }

    if (botao.dataset.repetidorRemover !== undefined) {
        remover(envelope, linha);
    } else {
        mover(envelope, linha, botao.dataset.repetidorSubir !== undefined ? -1 : 1, botao);
    }
}

let escutando = false;

/**
 * Os cliques ficam no `document`, uma vez só: um repetidor que entra
 * depois (num modal carregado sem recarregar) e as linhas novas já
 * funcionam sem ninguém religar nada. Para cada repetidor de `raiz`, o
 * estado dos botões e as posições são acertados uma vez.
 */
export function ligarRepetidores(raiz = document) {
    if (! escutando) {
        document.addEventListener('click', aoClicar);
        escutando = true;
    }

    raiz.querySelectorAll('[data-repetidor]').forEach((envelope) => {
        if (envelope.dataset.repetidorLigado) {
            return;
        }

        envelope.dataset.repetidorLigado = '1';
        atualizar(envelope);
    });
}
