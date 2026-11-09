/*
 * O erro do campo (resources/js/errors.js): a borda vermelha que sai quando
 * o erro sai. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { classesSemErro, nomeHtml } from '../../resources/js/errors.js';

test('a borda vermelha volta a ser a de sempre, e o resto das classes fica', () => {
    assert.deepEqual(
        classesSemErro(['block', 'w-full', 'border-danger-400', 'focus:border-danger-500', 'focus:ring-danger-500/20', 'dark:border-danger-500']),
        ['block', 'w-full', 'border-neutral-300', 'focus:border-primary-500', 'focus:ring-primary-500/20', 'dark:border-neutral-700'],
    );
});

test('o select aberto também perde o vermelho', () => {
    assert.deepEqual(
        classesSemErro(['aria-expanded:border-danger-500', 'aria-expanded:ring-danger-500/20']),
        ['aria-expanded:border-primary-500', 'aria-expanded:ring-primary-500/20'],
    );
});

test('o nome do erro do Laravel vira o nome do campo', () => {
    assert.equal(nomeHtml('items.0.price'), 'items[0][price]');
    assert.equal(nomeHtml('status'), 'status');
});
