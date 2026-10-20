/*
 * A cor (resources/js/color.js): o código que se lê e o que se escreve, e
 * a conversão para o HSV do painel. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { fundoDaAmostra, hexDe, hsvParaRgb, lerCor, normalizarCor, rgbParaHsv, XADREZ } from '../../resources/js/color.js';

test('lerCor aceita #rgb e #rrggbb, com ou sem #, em qualquer caixa', () => {
    assert.deepEqual(lerCor('#16a34a'), { r: 22, g: 163, b: 74, a: 1 });
    assert.deepEqual(lerCor('16A34A'), { r: 22, g: 163, b: 74, a: 1 });
    assert.deepEqual(lerCor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(lerCor('  #000  '), { r: 0, g: 0, b: 0, a: 1 });
});

test('sem alfa, o código de transparência não é cor', () => {
    assert.equal(lerCor('#16a34a80'), null);
    assert.equal(lerCor('#fff8'), null);
});

test('com alfa, lê os oito e os quatro dígitos', () => {
    assert.deepEqual(lerCor('#16a34a80', { alfa: true }), { r: 22, g: 163, b: 74, a: 128 / 255 });
    assert.deepEqual(lerCor('#0008', { alfa: true }), { r: 0, g: 0, b: 0, a: 136 / 255 });
    assert.equal(lerCor('#16a34a', { alfa: true }).a, 1);
});

test('o que não é cor é null', () => {
    for (const texto of ['', null, undefined, 'red', '#12345', '#1234567', '#gggggg', 'rgb(0,0,0)', '##fff']) {
        assert.equal(lerCor(texto, { alfa: true }), null, String(texto));
    }
});

test('hexDe escreve em minúsculas, e a opacidade só com alfa e abaixo de 100%', () => {
    assert.equal(hexDe({ r: 22, g: 163, b: 74 }), '#16a34a');
    assert.equal(hexDe({ r: 22, g: 163, b: 74, a: 0.5 }), '#16a34a');
    assert.equal(hexDe({ r: 22, g: 163, b: 74, a: 0.5 }, { alfa: true }), '#16a34a80');
    assert.equal(hexDe({ r: 22, g: 163, b: 74, a: 1 }, { alfa: true }), '#16a34a');
    assert.equal(hexDe({ r: 0, g: 0, b: 0, a: 0 }, { alfa: true }), '#00000000');
    // Fora da faixa, fica na ponta.
    assert.equal(hexDe({ r: 300, g: -5, b: 255.4 }), '#ff00ff');
});

test('normalizarCor deixa o código do jeito do campo', () => {
    assert.equal(normalizarCor('#ABC'), '#aabbcc');
    assert.equal(normalizarCor('16A34A'), '#16a34a');
    assert.equal(normalizarCor('#16A34AFF', { alfa: true }), '#16a34a');
    assert.equal(normalizarCor('#16A34A80', { alfa: true }), '#16a34a80');
    assert.equal(normalizarCor('#16A34A80'), null);
    assert.equal(normalizarCor('azul'), null);
});

test('rgbParaHsv e hsvParaRgb vão e voltam', () => {
    assert.deepEqual(rgbParaHsv({ r: 255, g: 0, b: 0 }), { h: 0, s: 1, v: 1 });
    assert.deepEqual(rgbParaHsv({ r: 0, g: 0, b: 255 }), { h: 240, s: 1, v: 1 });
    assert.deepEqual(rgbParaHsv({ r: 0, g: 0, b: 0 }), { h: 0, s: 0, v: 0 });
    assert.deepEqual(rgbParaHsv({ r: 255, g: 255, b: 255 }), { h: 0, s: 0, v: 1 });

    for (const hex of ['#16a34a', '#171717', '#fafafa', '#e4002b', '#00419e', '#ffd400', '#808080']) {
        const cor = lerCor(hex);

        assert.equal(hexDe(hsvParaRgb(rgbParaHsv(cor))), hex, hex);
    }
});

test('a amostra é a cor por cima do xadrez; vazia, só o xadrez', () => {
    assert.equal(fundoDaAmostra('#16a34a80'), `linear-gradient(#16a34a80, #16a34a80), ${XADREZ}`);
    assert.equal(fundoDaAmostra(''), XADREZ);
});
