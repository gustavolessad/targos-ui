/*
 * O percentual (resources/js/percent.js): o valor do formulário, com 4
 * casas, e o que um percentual colado vira. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    centesimosColados,
    centesimosDe,
    decimalDePercentual,
    lerPercentualDigitado,
    textoDoPercentual,
} from '../../resources/js/percent.js';

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

/*
 * O percentual se digita como se escreve, e não como calculadora (1.15.4):
 * "10" é 10%, e não 0,10%. Quem dava 10% de desconto digitava "10" e dava
 * 0,10%, sem perceber (teste no navegador do meu-sistema2, 09/11/2026).
 */
test('digitar "10" é 10%, e a vírgula separa as casas', () => {
    assert.deepEqual(lerPercentualDigitado('10'), { centesimos: 1000, texto: '10', negativo: false });
    assert.deepEqual(lerPercentualDigitado('10,5'), { centesimos: 1050, texto: '10,5', negativo: false });
    assert.deepEqual(lerPercentualDigitado('3,25'), { centesimos: 325, texto: '3,25', negativo: false });
    assert.equal(decimalDePercentual(lerPercentualDigitado('3,25').centesimos), '3.2500');
});

test('o ponto vale como vírgula, e a vírgula sozinha espera as casas', () => {
    assert.deepEqual(lerPercentualDigitado('10.5'), { centesimos: 1050, texto: '10,5', negativo: false });
    assert.deepEqual(lerPercentualDigitado('10,'), { centesimos: 1000, texto: '10,', negativo: false });
    assert.deepEqual(lerPercentualDigitado(','), { centesimos: 0, texto: '0,', negativo: false });
});

test('zeros à esquerda saem, e o zero sozinho é zero', () => {
    assert.deepEqual(lerPercentualDigitado('05'), { centesimos: 500, texto: '5', negativo: false });
    assert.deepEqual(lerPercentualDigitado('0'), { centesimos: 0, texto: '0', negativo: false });
    assert.deepEqual(lerPercentualDigitado('0,5'), { centesimos: 50, texto: '0,5', negativo: false });
});

test('a terceira casa e a segunda vírgula não entram', () => {
    assert.equal(lerPercentualDigitado('3,255'), null);
    assert.equal(lerPercentualDigitado('3,2,5'), null);
});

test('campo vazio não tem valor', () => {
    assert.deepEqual(lerPercentualDigitado(''), { centesimos: null, texto: '', negativo: false });
    assert.deepEqual(lerPercentualDigitado('%'), { centesimos: null, texto: '', negativo: false });
});

test('com negativo, o "-" troca o sinal; sem ele, sai', () => {
    assert.deepEqual(lerPercentualDigitado('-5', { negativo: true }), { centesimos: -500, texto: '-5', negativo: true });
    assert.deepEqual(lerPercentualDigitado('5-', { negativo: true }), { centesimos: -500, texto: '-5', negativo: true });
    assert.deepEqual(lerPercentualDigitado('-', { negativo: true }), { centesimos: null, texto: '-', negativo: true });
    assert.deepEqual(lerPercentualDigitado('-5'), { centesimos: 500, texto: '5', negativo: false });
});

test('o texto do campo é o percentual como se escreve', () => {
    assert.equal(textoDoPercentual(1000), '10');
    assert.equal(textoDoPercentual(1050), '10,5');
    assert.equal(textoDoPercentual(325), '3,25');
    assert.equal(textoDoPercentual(5), '0,05');
    assert.equal(textoDoPercentual(0), '0');
    assert.equal(textoDoPercentual(10000), '100');
    assert.equal(textoDoPercentual(-325), '-3,25');
    assert.equal(textoDoPercentual(null), '');
    // Sem separador de milhar: o ponto digitado é vírgula.
    assert.equal(textoDoPercentual(123456), '1234,56');
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
