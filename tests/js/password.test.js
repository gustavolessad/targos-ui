/*
 * O olho da senha (resources/js/password.js): qual campo ele mostra. Roda com
 * `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { campoDoOlho } from '../../resources/js/password.js';

test('mostra o campo ao lado do botão, mesmo com outro campo de mesmo nome na página', () => {
    // Um modal por usuário, todos com `name="password"`: o do primeiro modal não pode ser o escolhido.
    const doPrimeiroModal = { id: 'password' };
    const desteModal = { id: 'password' };
    const botao = { dataset: { veSenha: 'password' }, parentElement: { querySelector: () => desteModal } };
    const documento = { getElementById: () => doPrimeiroModal };

    assert.equal(campoDoOlho(botao, documento), desteModal);
});

test('sem campo ao lado, procura pelo id que o botão declara', () => {
    const campo = { id: 'senha' };
    const botao = { dataset: { veSenha: 'senha' }, parentElement: { querySelector: () => null } };

    assert.equal(campoDoOlho(botao, { getElementById: (id) => (id === 'senha' ? campo : null) }), campo);
});
