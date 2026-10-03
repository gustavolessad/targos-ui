/*
 * A lista que se reordena (resources/js/sortable.js): onde o item cai
 * ao ser solto, a lista reordenada, o passo de cada tecla, o lado do
 * alvo e a ordem dos ids. Roda com `npm test`, sem navegador — aqui, as
 * regras; o DOM só move os elementos e avisa.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { indiceAoSoltar, ladoDoAlvo, ordemDe, passoPelaTecla, reordenar } from '../../resources/js/sortable.js';

test('solto antes de um item mais abaixo, o item cai uma posição antes dele (a lista encolhe atrás)', () => {
    // [a, b, c, d]: a (0) solto antes de c (2) → [b, a, c, d]: a fica em 1.
    assert.equal(indiceAoSoltar(0, 2, false), 1);
    // a (0) solto antes de d (3) → [b, c, a, d]: 2.
    assert.equal(indiceAoSoltar(0, 3, false), 2);
    // Antes do vizinho de baixo é ficar onde está.
    assert.equal(indiceAoSoltar(0, 1, false), 0);
});

test('solto depois de um item mais abaixo, cai na posição dele', () => {
    // a (0) solto depois de c (2) → [b, c, a, d]: 2.
    assert.equal(indiceAoSoltar(0, 2, true), 2);
    // a (0) solto depois de d (3) → [b, c, d, a]: 3.
    assert.equal(indiceAoSoltar(0, 3, true), 3);
});

test('solto sobre um item mais acima, antes é a posição dele e depois é a seguinte', () => {
    // d (3) solto antes de b (1) → [a, d, b, c]: 1.
    assert.equal(indiceAoSoltar(3, 1, false), 1);
    // d (3) solto depois de b (1) → [a, b, d, c]: 2.
    assert.equal(indiceAoSoltar(3, 1, true), 2);
    // Depois do vizinho de cima é ficar onde está.
    assert.equal(indiceAoSoltar(3, 2, true), 3);
});

test('solto sobre si mesmo, fica onde está', () => {
    assert.equal(indiceAoSoltar(2, 2, false), 2);
    assert.equal(indiceAoSoltar(2, 2, true), 2);
});

test('reordenar põe o item de uma posição na outra, numa lista nova', () => {
    const lista = ['a', 'b', 'c', 'd'];

    assert.deepEqual(reordenar(lista, 0, 2), ['b', 'c', 'a', 'd']);
    assert.deepEqual(reordenar(lista, 3, 1), ['a', 'd', 'b', 'c']);
    assert.deepEqual(reordenar(lista, 1, 1), ['a', 'b', 'c', 'd']);
    // A de entrada não muda.
    assert.deepEqual(lista, ['a', 'b', 'c', 'd']);
});

test('reordenar com posição fora da lista devolve a lista como está', () => {
    assert.deepEqual(reordenar(['a', 'b'], 0, 5), ['a', 'b']);
    assert.deepEqual(reordenar(['a', 'b'], -1, 0), ['a', 'b']);
    assert.deepEqual(reordenar([], 0, 0), []);
});

test('o lugar depois de soltar é o mesmo que reordenar dá', () => {
    const lista = ['a', 'b', 'c', 'd'];

    // a solto antes de c.
    assert.deepEqual(reordenar(lista, 0, indiceAoSoltar(0, 2, false)), ['b', 'a', 'c', 'd']);
    // a solto depois de c.
    assert.deepEqual(reordenar(lista, 0, indiceAoSoltar(0, 2, true)), ['b', 'c', 'a', 'd']);
    // d solto antes de b.
    assert.deepEqual(reordenar(lista, 3, indiceAoSoltar(3, 1, false)), ['a', 'd', 'b', 'c']);
    // d solto depois de b.
    assert.deepEqual(reordenar(lista, 3, indiceAoSoltar(3, 1, true)), ['a', 'b', 'd', 'c']);
});

test('as setas para cima e para baixo são um passo; o resto, nada', () => {
    assert.equal(passoPelaTecla('ArrowUp'), -1);
    assert.equal(passoPelaTecla('ArrowDown'), 1);
    // Alt+← e Alt+→ são do navegador (voltar e avançar): não se mexe neles.
    assert.equal(passoPelaTecla('ArrowLeft'), null);
    assert.equal(passoPelaTecla('ArrowRight'), null);
    assert.equal(passoPelaTecla('Enter'), null);
    assert.equal(passoPelaTecla(undefined), null);
});

test('o lado do alvo é pela metade: em cima é antes, embaixo é depois', () => {
    // O alvo começa em 100 e tem 40 de altura: a metade é 120.
    assert.equal(ladoDoAlvo(105, 100, 40), 'antes');
    assert.equal(ladoDoAlvo(119, 100, 40), 'antes');
    assert.equal(ladoDoAlvo(120, 100, 40), 'depois');
    assert.equal(ladoDoAlvo(139, 100, 40), 'depois');
    // Na horizontal, as mesmas contas com x e a largura.
    assert.equal(ladoDoAlvo(10, 0, 100), 'antes');
    assert.equal(ladoDoAlvo(90, 0, 100), 'depois');
});

test('a ordem são os ids na ordem dos itens; sem id, nulo', () => {
    const itens = [
        { dataset: { arrastavelId: '12' } },
        { dataset: { arrastavelId: '15' } },
        { dataset: {} },
        { dataset: { arrastavelId: '7' } },
    ];

    assert.deepEqual(ordemDe(itens), ['12', '15', null, '7']);
    assert.deepEqual(ordemDe([]), []);
    assert.deepEqual(ordemDe(undefined), []);
    assert.deepEqual(ordemDe(new Set([{ dataset: { arrastavelId: 'a' } }])), ['a']);
});
