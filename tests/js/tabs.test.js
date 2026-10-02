/*
 * O teclado nas abas (resources/js/tabs.js): para que aba cada tecla
 * leva. Roda com `npm test`, sem navegador — aqui, a regra; o DOM só
 * abre a aba e põe o foco nela.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { indicePelaTecla } from '../../resources/js/tabs.js';

test('as setas andam uma aba e dão a volta nas pontas', () => {
    assert.equal(indicePelaTecla('ArrowRight', 0, 3), 1);
    assert.equal(indicePelaTecla('ArrowRight', 2, 3), 0);
    assert.equal(indicePelaTecla('ArrowLeft', 1, 3), 0);
    assert.equal(indicePelaTecla('ArrowLeft', 0, 3), 2);
});

test('Home vai à primeira e End à última', () => {
    assert.equal(indicePelaTecla('Home', 2, 3), 0);
    assert.equal(indicePelaTecla('End', 0, 3), 2);
});

test('outra tecla, ou grupo sem aba, não leva a lugar nenhum', () => {
    assert.equal(indicePelaTecla('Enter', 0, 3), null);
    assert.equal(indicePelaTecla('ArrowDown', 0, 3), null);
    assert.equal(indicePelaTecla('ArrowRight', 0, 0), null);
});
