/*
 * O campo de valor em reais (resources/js/ui/money.js): o que um valor
 * colado vira. Roda com `npm test` (node --test), sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { centavosColados } from '../../resources/js/money.js';

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
