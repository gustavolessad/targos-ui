/*
 * As linhas repetidas (resources/js/repeater.js): o índice da linha nova,
 * a troca do `__i__` no modelo e os limites de adicionar e remover. Roda
 * com `npm test`, sem navegador — aqui, as regras; a cópia no DOM só
 * junta as peças.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { podeAdicionar, podeRemover, proximoIndice, substituirIndice } from '../../resources/js/repeater.js';

test('o __i__ vira o índice em todo lugar: nome, id, rótulo e texto', () => {
    const modelo = '<div data-repetidor-indice="__i__"><label for="addresses-__i__-zip">CEP da linha __i__</label>'
        + '<input id="addresses-__i__-zip" name="addresses[__i__][zip]"></div>';

    assert.equal(
        substituirIndice(modelo, 3),
        '<div data-repetidor-indice="3"><label for="addresses-3-zip">CEP da linha 3</label>'
            + '<input id="addresses-3-zip" name="addresses[3][zip]"></div>',
    );
});

test('a troca não mexe no resto do HTML', () => {
    assert.equal(substituirIndice('<input name="addresses[0][zip]">', 7), '<input name="addresses[0][zip]">');
    assert.equal(substituirIndice('', 1), '');
    // Um sublinhado só, ou o i sem os dois de cada lado, não é a marca.
    assert.equal(substituirIndice('_i_ __i _i__ __i__', 2), '_i_ __i _i__ 2');
    assert.equal(substituirIndice('__i____i__', 0), '00');
});

test('o próximo índice é o maior mais um, mesmo com buracos e fora de ordem', () => {
    assert.equal(proximoIndice([0, 1, 2]), 3);
    assert.equal(proximoIndice([2, 0, 5]), 6);
    assert.equal(proximoIndice([4]), 5);
});

test('sem linha nenhuma, o próximo índice é 0', () => {
    assert.equal(proximoIndice([]), 0);
    assert.equal(proximoIndice(undefined), 0);
});

test('o próximo índice aceita o texto do data-repetidor-indice e ignora o que não é inteiro', () => {
    assert.equal(proximoIndice(['0', '1', '10']), 11);
    assert.equal(proximoIndice([' 3 ']), 4);
    assert.equal(proximoIndice(['__i__', 'abc', '1.5', '-1', '', null]), 0);
    assert.equal(proximoIndice(['abc', '2']), 3);
    assert.equal(proximoIndice(new Set([1, 8])), 9);
});

test('remover só acima do mínimo', () => {
    assert.equal(podeRemover(2, 1), true);
    assert.equal(podeRemover(1, 1), false);
    assert.equal(podeRemover(1, 0), true);
    // Sem linha, não há o que tirar.
    assert.equal(podeRemover(0, 0), false);
    assert.equal(podeRemover(3), true);
    // Mínimo que não é número vale zero.
    assert.equal(podeRemover(1, null), true);
    assert.equal(podeRemover(1, Number.NaN), true);
});

test('adicionar só abaixo do teto; sem teto, sempre', () => {
    assert.equal(podeAdicionar(4, 5), true);
    assert.equal(podeAdicionar(5, 5), false);
    assert.equal(podeAdicionar(6, 5), false);
    assert.equal(podeAdicionar(0, 0), false);
    assert.equal(podeAdicionar(100, null), true);
    assert.equal(podeAdicionar(100), true);
    assert.equal(podeAdicionar(100, undefined), true);
    assert.equal(podeAdicionar(100, Number.NaN), true);
});
