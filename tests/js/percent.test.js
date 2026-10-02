/*
 * O percentual (resources/js/percent.js): o valor do formulário, com 4
 * casas, e o que um percentual colado vira. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { formatarCentavos, lerDigitado } from '../../resources/js/money.js';
import { centesimosColados, centesimosDe, decimalDePercentual } from '../../resources/js/percent.js';

test('o valor do banco vira centésimos', () => {
    assert.equal(centesimosDe('3.2500'), 325);
    assert.equal(centesimosDe('100.0000'), 10000);
    assert.equal(centesimosDe('0.0000'), 0);
    assert.equal(centesimosDe(3.25), 325);
    // A tela mostra 2 casas: a terceira arredonda.
    assert.equal(centesimosDe('3.2550'), 326);
    assert.equal(centesimosDe('3.2549'), 325);
    assert.equal(centesimosDe(''), null);
    assert.equal(centesimosDe(null), null);
    assert.equal(centesimosDe('abc'), null);
});

test('centésimos viram o valor do formulário, com 4 casas', () => {
    assert.equal(decimalDePercentual(325), '3.2500');
    assert.equal(decimalDePercentual(10000), '100.0000');
    assert.equal(decimalDePercentual(5), '0.0500');
    assert.equal(decimalDePercentual(0), '0.0000');
    assert.equal(decimalDePercentual(-325), '-3.2500');
    assert.equal(decimalDePercentual(null), '');
});

test('digitar "325" é 3,25%', () => {
    const { centavos: centesimos } = lerDigitado('325', { zero: true });

    assert.equal(centesimos, 325);
    assert.equal(formatarCentavos(centesimos), '3,25');
    assert.equal(decimalDePercentual(centesimos), '3.2500');
});

test('colar entende vírgula e ponto, e o número inteiro é o percentual', () => {
    assert.equal(centesimosColados('3,25'), 325);
    assert.equal(centesimosColados('3.25'), 325);
    assert.equal(centesimosColados('3,5'), 350);
    assert.equal(centesimosColados('3'), 300);
    assert.equal(centesimosColados('3,25%'), 325);
    assert.equal(centesimosColados('abc'), null);
});

test('colar o valor do banco, com 4 casas, não o lê como milhar', () => {
    assert.equal(centesimosColados('3.2500'), 325);
    assert.equal(centesimosColados('3,2500'), 325);
    assert.equal(centesimosColados('12.3456 %'), 1235);
    // O sinal fica com quem cola, como no valor em reais.
    assert.equal(centesimosColados('-3.2500'), 325);
});
