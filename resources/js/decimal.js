/*
 * O número decimal (<x-ui.decimal>): peso em kg, medida fracionária,
 * qualquer número com casas que não é dinheiro nem percentual.
 *
 * O mesmo desenho do valor em reais (money.js): o `<input type="number">`
 * nativo vai no formulário (`0.840`), visualmente escondido, e por cima o
 * campo com o sufixo ("kg") se digita como calculadora, com as casas que
 * o Blade pediu — com 3, "840" é 0,840. O `max` do nativo é o teto da
 * digitação.
 */

import { centavosColados, centavosDe, montarCampoEmCentavos } from './money.js';

function montar(raiz) {
    if (raiz.dataset.decimalLigado) {
        return;
    }

    raiz.dataset.decimalLigado = '1';

    const casas = Number(raiz.dataset.decimalCasas ?? 2);
    const nativo = raiz.querySelector('[data-decimal-nativo]');
    // O teto vem do próprio nativo, que a validação do navegador também lê.
    const maximo = centavosDe(nativo.getAttribute('max'), casas);

    montarCampoEmCentavos(raiz, {
        caixa: raiz.querySelector('[data-decimal-nativo-caixa]'),
        nativo,
        campo: raiz.querySelector('[data-decimal-campo]'),
        texto: raiz.querySelector('[data-decimal-texto]'),
    }, {
        casas,
        escala: casas,
        // Zero é valor quando o Blade o aceita (`allow-zero`): "0" digitado é 0,000, e não o campo em branco.
        zero: raiz.dataset.decimalZero !== undefined,
        teto: maximo,
        colar: (colado) => centavosColados(colado, casas),
    });
}

export function ligarDecimais(raiz = document) {
    raiz.querySelectorAll('[data-decimal]').forEach(montar);
}
