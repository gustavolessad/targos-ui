/*
 * A hora (resources/js/time.js): o que se digita, a coluna dos minutos e
 * os limites. Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { agoraDe, deDigitado, foraDosLimites, horaSemMinutoLivre, minutosDaColuna } from '../../resources/js/time.js';

test('deDigitado aceita só a hora completa e de verdade', () => {
    assert.equal(deDigitado('14:30'), '14:30');
    assert.equal(deDigitado('00:00'), '00:00');
    assert.equal(deDigitado('23:59'), '23:59');
    assert.equal(deDigitado('24:00'), null);
    assert.equal(deDigitado('25:99'), null);
    assert.equal(deDigitado('14:60'), null);
    assert.equal(deDigitado('14:3'), null);
    assert.equal(deDigitado('1430'), null);
    assert.equal(deDigitado(''), null);
    assert.equal(deDigitado(null), null);
});

test('a coluna dos minutos vai de step em step a partir do zero', () => {
    assert.deepEqual(minutosDaColuna(15), [0, 15, 30, 45]);
    assert.deepEqual(minutosDaColuna('30'), [0, 30]);
    assert.equal(minutosDaColuna(5).length, 12);
    assert.equal(minutosDaColuna(1).length, 60);
    // O step que não divide a hora para antes dos 60.
    assert.deepEqual(minutosDaColuna(25), [0, 25, 50]);
});

test('step inválido vira o padrão de 5 minutos', () => {
    assert.equal(minutosDaColuna(0).length, 12);
    assert.equal(minutosDaColuna(-10).length, 12);
    assert.equal(minutosDaColuna('abc').length, 12);
    assert.equal(minutosDaColuna(undefined).length, 12);
    assert.deepEqual(minutosDaColuna(90), [0]);
});

test('foraDosLimites compara a hora com o min e o max, inclusive', () => {
    const limites = { min: '08:00', max: '18:30' };

    assert.equal(foraDosLimites('07:59', limites), true);
    assert.equal(foraDosLimites('08:00', limites), false);
    assert.equal(foraDosLimites('18:30', limites), false);
    assert.equal(foraDosLimites('18:31', limites), true);
    assert.equal(foraDosLimites('03:00', {}), false);
    assert.equal(foraDosLimites('03:00', { min: null, max: null }), false);
});

test('a hora inteira fica de fora só quando nenhum minuto dela cabe', () => {
    const limites = { min: '08:30', max: '18:15' };

    assert.equal(horaSemMinutoLivre(7, limites), true);
    // Das 8h, cabem as 8:30 em diante; das 18h, até as 18:15.
    assert.equal(horaSemMinutoLivre(8, limites), false);
    assert.equal(horaSemMinutoLivre(18, limites), false);
    assert.equal(horaSemMinutoLivre(19, limites), true);
    assert.equal(horaSemMinutoLivre(0, {}), false);
});

test('agoraDe escreve a hora do relógio em hh:mm', () => {
    assert.equal(agoraDe(new Date(2026, 9, 17, 9, 5)), '09:05');
    assert.equal(agoraDe(new Date(2026, 9, 17, 23, 59, 59)), '23:59');
});
