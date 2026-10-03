/*
 * O menu montado no clique (resources/js/dropdown.js): como o modelo da
 * página vira o menu de uma linha. Roda com `npm test`, sem navegador —
 * aqui, as regras; a cópia no DOM só junta as peças.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { preencherTexto, separadoresSobrando, temValor, valorDoCaminho } from '../../resources/js/dropdown.js';

const valores = {
    ver: '/cobrancas/12',
    excluir: { url: '/cobrancas/12', numero: '0012' },
    pagar: null,
    total: 0,
};

test('a chave vira o valor da linha, inclusive o campo de um objeto', () => {
    assert.equal(preencherTexto('{ver}', valores), '/cobrancas/12');
    assert.equal(preencherTexto('Excluir a cobrança Nº {excluir.numero}?', valores), 'Excluir a cobrança Nº 0012?');
});

test('chave sem valor vira vazio; zero é valor', () => {
    assert.equal(preencherTexto('[{pagar}]', valores), '[]');
    assert.equal(preencherTexto('[{excluir.motivo}]', valores), '[]');
    assert.equal(preencherTexto('{total} em aberto', valores), '0 em aberto');
});

test('chave que os valores não conhecem fica como está', () => {
    assert.equal(preencherTexto('Use {nome} no texto', valores), 'Use {nome} no texto');
    assert.equal(preencherTexto('sem chave nenhuma', valores), 'sem chave nenhuma');
});

test('o caminho anda pelos objetos e para no que falta', () => {
    assert.equal(valorDoCaminho(valores, 'excluir.url'), '/cobrancas/12');
    assert.equal(valorDoCaminho(valores, 'pagar.url'), undefined);
    assert.equal(valorDoCaminho(valores, 'nada'), undefined);
});

test('null, false e texto vazio tiram o item; o resto o mantém', () => {
    for (const vazio of [null, undefined, false, '']) {
        assert.equal(temValor(vazio), false, String(vazio));
    }

    for (const cheio of [true, 0, 'x', { url: '/' }, []]) {
        assert.equal(temValor(cheio), true, JSON.stringify(cheio));
    }
});

test('separador no começo, no fim ou repetido sai', () => {
    // separador, item, separador, separador, item, separador
    assert.deepEqual(separadoresSobrando([true, false, true, true, false, true]), [0, 3, 5]);
});

test('separador entre itens fica', () => {
    assert.deepEqual(separadoresSobrando([false, true, false]), []);
});

test('menu que sobrou só com separadores fica vazio', () => {
    assert.deepEqual(separadoresSobrando([true, true]), [0, 1]);
    assert.deepEqual(separadoresSobrando([]), []);
});

test('um objeto ou lista no valor vira JSON (o data-form-valores da linha)', () => {
    const valores = { editar: { url: '/x/1', valores: { name: 'Loja', sells: true } } };

    assert.equal(preencherTexto('{editar.url}', valores), '/x/1');
    assert.equal(preencherTexto('{editar.valores}', valores), '{"name":"Loja","sells":true}');
});
