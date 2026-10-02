/*
 * O select com busca no servidor (resources/js/select.js): a URL da busca e
 * as opções que o nativo fica depois dela. Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { mesclarOpcoes, urlDaBusca } from '../../resources/js/select.js';

const base = 'http://sistema.test/cobrancas';

test('a busca vai para o source com ?q=, mantendo o que ele já tinha', () => {
    assert.equal(urlDaBusca('/contatos/opcoes?papel=cliente', 'padaria', base), 'http://sistema.test/contatos/opcoes?papel=cliente&q=padaria');
    assert.equal(urlDaBusca('/contatos/opcoes', '', base), 'http://sistema.test/contatos/opcoes?q=');
    assert.equal(urlDaBusca('/contatos/opcoes', 'São José & cia', base), 'http://sistema.test/contatos/opcoes?q=S%C3%A3o+Jos%C3%A9+%26+cia');
});

test('sem escolhida, as opções são as que vieram', () => {
    assert.deepEqual(mesclarOpcoes(null, [{ value: 1, label: 'Padaria' }]), [
        { value: '1', label: 'Padaria', selected: false, hidden: false },
    ]);
});

test('a escolhida que veio na busca fica marcada', () => {
    const opcoes = mesclarOpcoes({ value: '2', label: 'Gráfica' }, [{ value: 1, label: 'Padaria' }, { value: 2, label: 'Gráfica' }]);

    assert.deepEqual(opcoes.map((o) => [o.value, o.selected, o.hidden]), [['1', false, false], ['2', true, false]]);
});

test('a escolhida que não veio fica escondida no fim: o valor do formulário não se perde', () => {
    const opcoes = mesclarOpcoes({ value: '9', label: 'Antiga' }, [{ value: 1, label: 'Padaria' }]);

    assert.deepEqual(opcoes.at(-1), { value: '9', label: 'Antiga', selected: true, hidden: true });
    assert.equal(opcoes.length, 2);
});
