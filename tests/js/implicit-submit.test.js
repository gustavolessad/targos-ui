/*
 * O Enter que não envia (resources/js/implicit-submit.js): em que
 * elemento o Enter seria o envio implícito do navegador — e por isso é
 * barrado no formulário com `data-sem-envio-implicito`. Roda com
 * `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { enterEnviaImplicito } from '../../resources/js/implicit-submit.js';

test('o Enter num campo de texto é o envio implícito: o do leitor de código de barras', () => {
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'text' }), true);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'search' }), true);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'number' }), true);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'tel' }), true);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'date' }), true);
    // Sem `type`, é texto.
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT' }), true);
    // A caixa e o rádio também enviam com Enter em alguns navegadores: barrados do mesmo jeito.
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'checkbox' }), true);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'radio' }), true);
    // O nome da tag como vier.
    assert.equal(enterEnviaImplicito({ tagName: 'input', type: 'TEXT' }), true);
});

test('no botão de envio, o Enter é um clique, e segue enviando', () => {
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'submit' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'image' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'button' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'INPUT', type: 'reset' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'BUTTON', type: 'submit' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'BUTTON' }), false);
});

test('a área de texto quebra a linha, e o select não envia: nada a barrar', () => {
    assert.equal(enterEnviaImplicito({ tagName: 'TEXTAREA' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'SELECT' }), false);
    assert.equal(enterEnviaImplicito({ tagName: 'DIV' }), false);
    assert.equal(enterEnviaImplicito(null), false);
    assert.equal(enterEnviaImplicito(undefined), false);
});
