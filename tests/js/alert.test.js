/*
 * O X do aviso (resources/js/alert.js): quando esconde e quando avisa.
 * Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { dispensarAlerta } from '../../resources/js/alert.js';

function aviso(hidden = false) {
    const eventos = [];

    return { hidden, eventos, dispatchEvent: (evento) => eventos.push(evento) };
}

test('esconde o aviso e anuncia ui:alerta-dispensado, subindo', () => {
    const alerta = aviso();

    assert.equal(dispensarAlerta(alerta), true);
    assert.equal(alerta.hidden, true);
    assert.equal(alerta.eventos.length, 1);
    assert.equal(alerta.eventos[0].type, 'ui:alerta-dispensado');
    // Subindo: quem escuta na raiz da tela fica sabendo.
    assert.equal(alerta.eventos[0].bubbles, true);
});

test('o aviso já escondido não avisa de novo', () => {
    const alerta = aviso(true);

    assert.equal(dispensarAlerta(alerta), false);
    assert.equal(alerta.eventos.length, 0);
});

test('sem aviso, nada', () => {
    assert.equal(dispensarAlerta(null), false);
    assert.equal(dispensarAlerta(undefined), false);
});
