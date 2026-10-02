/*
 * O número inteiro (resources/js/number.js): os limites, o − e o + e o
 * que sobra do que se digita. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { ajustar, limparDigitado, somarPasso } from '../../resources/js/number.js';

test('ajustar devolve o número dentro dos limites', () => {
    assert.equal(ajustar('150', { max: 100 }), 100);
    assert.equal(ajustar('-5', { min: 0 }), 0);
    assert.equal(ajustar('42', { min: 1, max: 100 }), 42);
    assert.equal(ajustar(7, { min: 1, max: 5 }), 5);
    assert.equal(ajustar(' 12 '), 12);
    assert.equal(ajustar('007'), 7);
    assert.equal(ajustar('-3'), -3);
});

test('ajustar: vazio é null, com ou sem mínimo', () => {
    assert.equal(ajustar(''), null);
    assert.equal(ajustar('', { min: 1 }), null);
    assert.equal(ajustar('-', { min: 1 }), null);
    assert.equal(ajustar(null), null);
    assert.equal(ajustar('abc'), null);
});

test('ajustar fica nos inteiros', () => {
    assert.equal(ajustar('1.9'), 1);
    assert.equal(ajustar(-0.5), 0);
});

test('o − e o + somam o step dentro dos limites', () => {
    assert.equal(somarPasso('5', 1), 6);
    assert.equal(somarPasso('5', -1), 4);
    assert.equal(somarPasso('10', 1, { step: 5 }), 15);
    assert.equal(somarPasso('100', 1, { max: 100 }), 100);
    assert.equal(somarPasso('1', -1, { min: 1 }), 1);
    // O que já estava fora volta para dentro.
    assert.equal(somarPasso('150', -1, { max: 100 }), 100);
});

test('vazio, o − e o + partem do mínimo, ou do zero', () => {
    assert.equal(somarPasso('', 1), 1);
    assert.equal(somarPasso('', -1), -1);
    assert.equal(somarPasso('', 1, { min: 1 }), 2);
    assert.equal(somarPasso('', -1, { min: 1 }), 1);
    assert.equal(somarPasso('', -1, { min: 0 }), 0);
});

test('digitando, ficam só os dígitos e o "-" do começo', () => {
    assert.equal(limparDigitado('12a3'), '123');
    assert.equal(limparDigitado('1.500'), '1500');
    assert.equal(limparDigitado('-12'), '-12');
    assert.equal(limparDigitado('1-2'), '12');
    assert.equal(limparDigitado('--3'), '-3');
    assert.equal(limparDigitado('-'), '-');
    // Sem negativo (o mínimo não deixa), o "-" sai.
    assert.equal(limparDigitado('-12', false), '12');
});
