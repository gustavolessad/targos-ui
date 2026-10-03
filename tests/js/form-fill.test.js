/*
 * O preenchimento do formulário (resources/js/form-fill.js): o que vai
 * para os textos (`data-form-texto`) e o que conta como "tem valor"
 * para os blocos (`data-form-se`). Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { temValor, textoDoValor } from '../../resources/js/form-fill.js';

test('o texto de um valor: como está; nulo e false viram nada', () => {
    assert.equal(textoDoValor('Loja Centro'), 'Loja Centro');
    assert.equal(textoDoValor(12), '12');
    assert.equal(textoDoValor(0), '0');
    assert.equal(textoDoValor(true), 'true');
    assert.equal(textoDoValor(null), '');
    assert.equal(textoDoValor(undefined), '');
    assert.equal(textoDoValor(false), '');
});

test('a lista vira texto separado por vírgula, sem os vazios', () => {
    assert.equal(textoDoValor(['Cliente', 'Fornecedor']), 'Cliente, Fornecedor');
    assert.equal(textoDoValor(['a', null, '', 'b']), 'a, b');
    assert.equal(textoDoValor([]), '');
});

test('tem valor: o 0 tem; o vazio, o nulo, o false e a lista vazia não', () => {
    assert.equal(temValor('x'), true);
    assert.equal(temValor(0), true);
    assert.equal(temValor(['a']), true);
    assert.equal(temValor(''), false);
    assert.equal(temValor('   '), false);
    assert.equal(temValor(null), false);
    assert.equal(temValor(undefined), false);
    assert.equal(temValor(false), false);
    assert.equal(temValor([]), false);
    assert.equal(temValor([null, '']), false);
});
