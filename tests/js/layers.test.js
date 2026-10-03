/*
 * As camadas (resources/js/layers.js): quais o Esc fecha quando há uma
 * estática (`<x-ui.modal static>`) entre as abertas. Roda com
 * `npm test`, sem navegador — os eventos e o DOM ficam com a tela.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

/*
 * O módulo pendura `abrirModal` e cia. na `window` ao carregar: um
 * objeto vazio basta para importá-lo fora do navegador.
 */
globalThis.window ??= {};

const { fechadasPeloEsc } = await import('../../resources/js/layers.js');

const estatica = (camada) => camada.estatica === true;

test('sem estática, o Esc fecha todas as abertas, como sempre', () => {
    const gaveta = { id: 'gaveta' };
    const modal = { id: 'modal' };

    assert.deepEqual(fechadasPeloEsc([gaveta, modal], estatica), [gaveta, modal]);
});

test('a estática por cima segura o Esc: nem ela nem a gaveta atrás dela fecham', () => {
    const gaveta = { id: 'carrinho' };
    const documento = { id: 'documento', estatica: true };

    assert.deepEqual(fechadasPeloEsc([gaveta, documento], estatica), []);
});

test('o que foi aberto por cima da estática fecha; ela e o resto ficam', () => {
    const gaveta = { id: 'carrinho' };
    const documento = { id: 'documento', estatica: true };
    const confirmacao = { id: 'confirmacao' };

    assert.deepEqual(fechadasPeloEsc([gaveta, documento, confirmacao], estatica), [confirmacao]);
});

test('vale a última estática da pilha', () => {
    const a = { id: 'a', estatica: true };
    const b = { id: 'b' };
    const c = { id: 'c', estatica: true };
    const d = { id: 'd' };

    assert.deepEqual(fechadasPeloEsc([a, b, c, d], estatica), [d]);
});

test('sem nenhuma aberta, nada; aceita qualquer lista (o NodeList do querySelectorAll)', () => {
    assert.deepEqual(fechadasPeloEsc([], estatica), []);
    assert.deepEqual(fechadasPeloEsc(null, estatica), []);
    assert.deepEqual(fechadasPeloEsc(new Set([{ id: 'x' }]), estatica), [{ id: 'x' }]);
});
