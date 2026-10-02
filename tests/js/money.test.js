/*
 * O campo de valor em reais (resources/js/money.js): o que um valor
 * colado vira, o que o digitado vale (escala, zero, negativo) e o que
 * vai no formulário. Roda com `npm test` (node --test), sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    centavosColados,
    centavosDe,
    decimalDeCentavos,
    formatarCentavos,
    lerDigitado,
    textoDeCentavos,
} from '../../resources/js/money.js';

test('valor colado sem centavos é em reais, não em centavos', () => {
    // Digitando, 1500 são R$ 15,00 (a vírgula anda sozinha). Colado, é o valor inteiro.
    assert.equal(centavosColados('1500'), 150000);
    assert.equal(centavosColados('R$ 1500'), 150000);
    assert.equal(centavosColados('  42 '), 4200);
});

test('vírgula ou ponto seguido de 1 ou 2 dígitos é o separador decimal', () => {
    assert.equal(centavosColados('1500,5'), 150050);
    assert.equal(centavosColados('1500.5'), 150050);
    assert.equal(centavosColados('1500,50'), 150050);
    assert.equal(centavosColados('1500.50'), 150050);
    assert.equal(centavosColados('0,99'), 99);
});

test('formato brasileiro e americano com milhar', () => {
    assert.equal(centavosColados('1.500,00'), 150000);
    assert.equal(centavosColados('R$ 1.234,5'), 123450);
    assert.equal(centavosColados('1,500.00'), 150000);
    assert.equal(centavosColados('1.234.567,89'), 123456789);
});

test('separador seguido de 3 dígitos é milhar', () => {
    assert.equal(centavosColados('1.500'), 150000);
    assert.equal(centavosColados('1,500'), 150000);
    assert.equal(centavosColados('12.345.678'), 1234567800);
});

test('sem número nenhum não vira valor', () => {
    assert.equal(centavosColados(''), null);
    assert.equal(centavosColados('abc'), null);
    assert.equal(centavosColados('R$ '), null);
});

test('respeita o teto da coluna (10 dígitos em centavos)', () => {
    assert.equal(centavosColados('999999999999'), null);
    assert.equal(centavosColados('99.999.999,99'), 9999999999);
});

test('o texto do campo leva o sinal; formatarCentavos continua sem ele', () => {
    assert.equal(formatarCentavos(-150000), '1.500,00');
    assert.equal(textoDeCentavos(-150000), '-1.500,00');
    assert.equal(textoDeCentavos(150000), '1.500,00');
    assert.equal(textoDeCentavos(0), '0,00');
    assert.equal(textoDeCentavos(null), '');
    // O "-" digitado antes dos números espera por eles.
    assert.equal(textoDeCentavos(null, true), '-');
    assert.equal(textoDeCentavos(0, true), '-0,00');
});

test('o valor do formulário vira centavos sem passar por float', () => {
    assert.equal(centavosDe('1500.00'), 150000);
    assert.equal(centavosDe('1500.5'), 150050);
    assert.equal(centavosDe('-1500.00'), -150000);
    assert.equal(centavosDe('0.00'), 0);
    assert.equal(centavosDe('-0.00'), 0);
    // 3.955 * 100 é 395,4999… em float; pelos dígitos, a terceira casa arredonda para cima.
    assert.equal(centavosDe('3.955'), 396);
    assert.equal(centavosDe('3.9505'), 395);
    assert.equal(centavosDe('3.9550'), 396);
    assert.equal(centavosDe('-3.9550'), -396);
    assert.equal(centavosDe(''), null);
    assert.equal(centavosDe(null), null);
    assert.equal(centavosDe('abc'), null);
    assert.equal(centavosDe('-'), null);
});

test('escala 4: a tela mostra 2 casas e o formulário recebe 4', () => {
    // O custo que veio do banco aparece arredondado...
    assert.equal(textoDeCentavos(centavosDe('3.9505')), '3,95');
    // ...e o digitado grava com 4 casas, os centavos seguidos de zeros.
    const { centavos } = lerDigitado('3,955');
    assert.equal(centavos, 3955);
    assert.equal(textoDeCentavos(centavos), '39,55');
    assert.equal(decimalDeCentavos(centavos, 4), '39.5500');
    assert.equal(decimalDeCentavos(395, 4), '3.9500');
    assert.equal(decimalDeCentavos(5, 4), '0.0500');
});

test('escala 2: o mesmo que o toFixed(2) gravava', () => {
    assert.equal(decimalDeCentavos(150000), '1500.00');
    assert.equal(decimalDeCentavos(5), '0.05');
    assert.equal(decimalDeCentavos(0), '0.00');
    assert.equal(decimalDeCentavos(-150000), '-1500.00');
    assert.equal(decimalDeCentavos(9999999999), '99999999.99');
    assert.equal(decimalDeCentavos(null), '');
});

test('digitar: os dígitos são centavos, e só zeros esvaziam o campo', () => {
    assert.deepEqual(lerDigitado('1.500,005'), { centavos: 1500005, negativo: false });
    assert.deepEqual(lerDigitado(''), { centavos: null, negativo: false });
    assert.deepEqual(lerDigitado('0'), { centavos: null, negativo: false });
    assert.deepEqual(lerDigitado('0,00'), { centavos: null, negativo: false });
    // O teto de 10 dígitos: o 11º não entra.
    assert.equal(lerDigitado('99.999.999,999').centavos, 9999999999);
});

test('com zero permitido, "0" digitado é 0,00', () => {
    assert.deepEqual(lerDigitado('0', { zero: true }), { centavos: 0, negativo: false });
    assert.equal(textoDeCentavos(0), '0,00');
    assert.equal(decimalDeCentavos(0), '0.00');
    assert.equal(lerDigitado('0,005', { zero: true }).centavos, 5);
    // Apagando até o zero, o campo esvazia: senão o Backspace num "0,00" o redesenharia.
    assert.equal(lerDigitado('0,0', { zero: true, apagando: true }).centavos, null);
    assert.equal(lerDigitado('0,1', { zero: true, apagando: true }).centavos, 1);
});

test('negativo: o "-" troca o sinal, e um segundo o desfaz', () => {
    assert.deepEqual(lerDigitado('-150000', { negativo: true }), { centavos: -150000, negativo: true });
    assert.equal(textoDeCentavos(-150000), '-1.500,00');
    assert.equal(decimalDeCentavos(-150000), '-1500.00');
    // Um "-" a mais, no começo ou em qualquer ponto, volta ao positivo.
    assert.equal(lerDigitado('--1.500,00', { negativo: true }).centavos, 150000);
    assert.equal(lerDigitado('-1.500,00-', { negativo: true }).centavos, 150000);
    // Apagado o "-", é positivo.
    assert.equal(lerDigitado('1.500,00', { negativo: true }).centavos, 150000);
    // Só o "-": ainda não há número, mas o sinal fica esperando.
    assert.deepEqual(lerDigitado('-', { negativo: true }), { centavos: null, negativo: true });
    assert.deepEqual(lerDigitado('-0', { negativo: true }), { centavos: null, negativo: true });
    assert.equal(lerDigitado('-5', { negativo: true }).centavos, -5);
    // Com zero também: "-0,00" espera o próximo dígito, e grava zero.
    assert.deepEqual(lerDigitado('-0', { negativo: true, zero: true }), { centavos: 0, negativo: true });
});

test('sem negativo, o "-" não conta', () => {
    assert.deepEqual(lerDigitado('-1.500,00'), { centavos: 150000, negativo: false });
});
