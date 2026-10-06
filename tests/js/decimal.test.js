/*
 * O número decimal (<x-ui.decimal>, resources/js/decimal.js): as contas
 * do money.js com outro número de casas — 3 no peso em kg. Roda com
 * `npm test`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { centavosColados, centavosDe, decimalDeCentavos, formatarCentavos, lerDigitado } from '../../resources/js/money.js';

test('com 3 casas, o que se digita são milésimos', () => {
    // "840" digitado: 840 milésimos, 0,840.
    assert.equal(lerDigitado('840').centavos, 840);
    assert.equal(formatarCentavos(840, 3), '0,840');
    assert.equal(formatarCentavos(1500, 3), '1,500');
    assert.equal(formatarCentavos(1234567, 3), '1.234,567');
    assert.equal(formatarCentavos(5, 3), '0,005');
});

test('milésimos viram o valor do formulário, com as 3 casas', () => {
    assert.equal(decimalDeCentavos(840, 3, 3), '0.840');
    assert.equal(decimalDeCentavos(1500, 3, 3), '1.500');
    assert.equal(decimalDeCentavos(0, 3, 3), '0.000');
    assert.equal(decimalDeCentavos(null, 3, 3), '');
});

test('o valor do banco vira milésimos, sem float', () => {
    assert.equal(centavosDe('0.840', 3), 840);
    assert.equal(centavosDe('1.5', 3), 1500);
    assert.equal(centavosDe('12', 3), 12000);
    // A quarta casa arredonda, como a terceira no dinheiro.
    assert.equal(centavosDe('0.8405', 3), 841);
    assert.equal(centavosDe('', 3), null);
});

test('colado: até 3 casas depois do separador é decimal', () => {
    // No peso, "1,500" é 1,5 kg, e não mil e quinhentos.
    assert.equal(centavosColados('1,500', 3), 1500);
    assert.equal(centavosColados('0,84', 3), 840);
    assert.equal(centavosColados('2', 3), 2000);
    assert.equal(centavosColados('1.234,5', 3), 1234500);
});

test('com 0 casas, o número é inteiro', () => {
    assert.equal(formatarCentavos(1500, 0), '1.500');
    assert.equal(decimalDeCentavos(1500, 0, 0), '1500');
    assert.equal(centavosDe('1500', 0), 1500);
});

test('o dinheiro continua com 2 casas, sem passar o número', () => {
    assert.equal(formatarCentavos(19990), '199,90');
    assert.equal(decimalDeCentavos(395, 4), '3.9500');
    assert.equal(centavosDe('3.9550'), 396);
    assert.equal(centavosColados('1.500'), 150000);
});
