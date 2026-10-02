/*
 * Os gráficos (resources/js/chart.js): o formato dos valores e a mescla
 * das opções. Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { escalaJusta, formatador, mesclar, tracejar } from '../../resources/js/chart.js';

// O espaço entre "R$" e o número é o não separável, que o Intl escreve.
const limpo = (texto) => texto.replace(/ /g, ' ');

test('money mostra reais com centavos na dica e sem centavos no eixo', () => {
    assert.equal(limpo(formatador('money')(1234.5)), 'R$ 1.234,50');
    assert.equal(limpo(formatador('money', { curto: true })(1234.5)), 'R$ 1.235');
});

test('percent e número seguem o formato brasileiro', () => {
    assert.equal(formatador('percent')(12.5), '12,5%');
    assert.equal(formatador(null)(1234.567), '1.234,57');
    assert.equal(formatador(undefined)(10), '10');
});

test('valor ausente não vira "NaN"', () => {
    assert.equal(formatador('money')(null), '');
    assert.equal(formatador('money')(undefined), '');
    assert.equal(formatador(null)('abc'), '');
});

test('mesclar junta por nível, e o segundo vence', () => {
    const base = { chart: { type: 'bar', toolbar: { show: false } }, legend: { position: 'top' } };
    const extra = { chart: { toolbar: { show: true } }, legend: { position: 'bottom' } };

    assert.deepEqual(mesclar(base, extra), {
        chart: { type: 'bar', toolbar: { show: true } },
        legend: { position: 'bottom' },
    });

    // A base não é alterada.
    assert.equal(base.chart.toolbar.show, false);
});

test('mesclar troca listas inteiras e aceita extra vazio', () => {
    assert.deepEqual(mesclar({ colors: ['a', 'b'] }, { colors: ['c'] }), { colors: ['c'] });
    assert.deepEqual(mesclar({ a: 1 }, undefined), { a: 1 });
    assert.deepEqual(mesclar({ a: 1 }, {}), { a: 1 });
});

test('tracejar: sem série tracejada, devolve as séries como vieram', () => {
    const series = [{ name: 'Recebido', data: [1, 2] }];

    assert.deepEqual(tracejar(series, 'area'), { series, tracos: null });
});

test('tracejar: no area, a tracejada vira linha e ganha o traço', () => {
    const { series, tracos } = tracejar([
        { name: 'Recebido', data: [1, 2] },
        { name: 'Período anterior', data: [1, 1], dashed: true },
    ], 'area');

    assert.deepEqual(series, [
        { name: 'Recebido', data: [1, 2], type: 'area' },
        { name: 'Período anterior', data: [1, 1], type: 'line' },
    ]);
    assert.deepEqual(tracos, [0, 4]);
});

test('escalaJusta: do zero ao maior valor de todas as séries, ignorando os vazios', () => {
    assert.deepEqual(escalaJusta([{ data: [0, 100, null] }, { data: [0, 250], dashed: true }]), { min: 0, max: 250 });
    assert.deepEqual(escalaJusta([{ data: [-20, 80] }]), { min: -20, max: 80 });
    assert.equal(escalaJusta([{ data: [0, 0, null] }]), null);
});
