/*
 * A barra de filtros (resources/js/filters.js) e o preenchimento de
 * formulário (resources/js/form-fill.js): as regras puras. Roda com
 * `npm test` (node --test), sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { camposForaDaUrl, enviaAoMudar } from '../../resources/js/filters.js';

const campo = (props) => ({ name: '', type: 'text', value: '', checked: false, tagName: 'INPUT', dataset: {}, ...props });

test('os campos vazios e a página ficam fora da URL', () => {
    const vazios = camposForaDaUrl([
        campo({ name: 'busca', value: '  ' }),
        campo({ name: 'status', value: 'ativo' }),
        campo({ name: 'page', value: '3' }),
        campo({ name: 'de', type: 'date', value: '' }),
    ]);

    assert.deepEqual(vazios.map((c) => c.name), ['busca', 'page', 'de']);
});

test('a caixa desmarcada fica fora; a marcada vai', () => {
    const vazios = camposForaDaUrl([
        campo({ name: 'vencidos', type: 'checkbox', value: '1', checked: false }),
        campo({ name: 'cancelados', type: 'checkbox', value: '1', checked: true }),
    ]);

    assert.deepEqual(vazios.map((c) => c.name), ['vencidos']);
});

test('o campo sem nome não entra na conta', () => {
    assert.deepEqual(camposForaDaUrl([campo({ name: '', value: '' })]), []);
});

test('select, data, caixa e os nativos do pacote enviam ao mudar; a busca não', () => {
    assert.equal(enviaAoMudar(campo({ tagName: 'SELECT' })), true);
    assert.equal(enviaAoMudar(campo({ type: 'date' })), true);
    assert.equal(enviaAoMudar(campo({ type: 'checkbox' })), true);
    assert.equal(enviaAoMudar(campo({ dataset: { dataNativo: '' } })), true);
    assert.equal(enviaAoMudar(campo({ dataset: { periodoFim: '' } })), true);
    assert.equal(enviaAoMudar(campo({ type: 'search' })), false);
    assert.equal(enviaAoMudar(campo({ type: 'text' })), false);
    // Quem se declara busca espera o atraso, mesmo sendo select.
    assert.equal(enviaAoMudar(campo({ tagName: 'SELECT', dataset: { filtroBusca: '' } })), false);
});
