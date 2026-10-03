/*
 * O bloco condicional (resources/js/conditional.js): a leitura do
 * `data-mostra-quando` e a regra que decide se o bloco aparece. Roda
 * com `npm test`, sem navegador — aqui, as regras; o DOM só as aplica.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { condicaoVale, interpretarCondicao } from '../../resources/js/conditional.js';

test('campo=valor: um campo e um valor', () => {
    assert.deepEqual(interpretarCondicao('forma=cartao'), { campo: 'forma', valores: ['cartao'], negado: false });
});

test('campo=a|b: vários valores, com espaços sobrando', () => {
    assert.deepEqual(interpretarCondicao(' forma = cartao | boleto '), { campo: 'forma', valores: ['cartao', 'boleto'], negado: false });
});

test('campo sozinho: qualquer valor não vazio', () => {
    assert.deepEqual(interpretarCondicao('entregar'), { campo: 'entregar', valores: null, negado: false });
});

test('o "!" na frente nega, com ou sem valor', () => {
    assert.deepEqual(interpretarCondicao('!forma=dinheiro'), { campo: 'forma', valores: ['dinheiro'], negado: true });
    assert.deepEqual(interpretarCondicao('! entregar'), { campo: 'entregar', valores: null, negado: true });
});

test('campo= (nada depois do igual) é "o campo está vazio"', () => {
    assert.deepEqual(interpretarCondicao('obs='), { campo: 'obs', valores: [''], negado: false });
});

test('o nome com colchete fica inteiro, e o "=" só separa no primeiro', () => {
    assert.deepEqual(interpretarCondicao('items[0][kind]=a=b'), { campo: 'items[0][kind]', valores: ['a=b'], negado: false });
});

test('sem campo, não há condição', () => {
    assert.equal(interpretarCondicao(''), null);
    assert.equal(interpretarCondicao('=x'), null);
    assert.equal(interpretarCondicao('!'), null);
    assert.equal(interpretarCondicao(null), null);
    assert.equal(interpretarCondicao(undefined), null);
});

test('com valores, basta o do campo bater com um deles', () => {
    const condicao = interpretarCondicao('forma=cartao|boleto');

    assert.equal(condicaoVale(condicao, 'cartao'), true);
    assert.equal(condicaoVale(condicao, 'boleto'), true);
    assert.equal(condicaoVale(condicao, 'pix'), false);
    assert.equal(condicaoVale(condicao, ''), false);
});

test('o valor compara como texto: o 1 do checkbox e o "1" da condição são o mesmo', () => {
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), 1), true);
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), '1'), true);
    // A caixa desmarcada chega como vazio.
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), ''), false);
});

test('sem valores, vale o que não é vazio (a caixa marcada chega com o valor dela)', () => {
    const condicao = interpretarCondicao('entregar');

    assert.equal(condicaoVale(condicao, '1'), true);
    assert.equal(condicaoVale(condicao, 'qualquer coisa'), true);
    assert.equal(condicaoVale(condicao, ''), false);
    assert.equal(condicaoVale(condicao, null), false);
    assert.equal(condicaoVale(condicao, undefined), false);
});

test('negado, o contrário em tudo', () => {
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), 'dinheiro'), false);
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), 'cartao'), true);
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), ''), true);
    assert.equal(condicaoVale(interpretarCondicao('!entregar'), ''), true);
    assert.equal(interpretarCondicao('!entregar') && condicaoVale(interpretarCondicao('!entregar'), '1'), false);
});

test('campo= casa com o campo vazio, e só com ele', () => {
    assert.equal(condicaoVale(interpretarCondicao('obs='), ''), true);
    assert.equal(condicaoVale(interpretarCondicao('obs='), 'x'), false);
});

test('no select de várias, a lista: basta uma escolhida bater, e nenhuma é vazio', () => {
    const condicao = interpretarCondicao('roles=admin|owner');

    assert.equal(condicaoVale(condicao, ['customer', 'owner']), true);
    assert.equal(condicaoVale(condicao, ['customer']), false);
    assert.equal(condicaoVale(condicao, []), false);

    assert.equal(condicaoVale(interpretarCondicao('roles'), ['customer']), true);
    assert.equal(condicaoVale(interpretarCondicao('roles'), []), false);
    assert.equal(condicaoVale(interpretarCondicao('roles='), []), true);
});

test('sem condição, o bloco aparece', () => {
    assert.equal(condicaoVale(null, ''), true);
});
