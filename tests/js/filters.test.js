/*
 * A barra de filtros (resources/js/filters.js) e o preenchimento de
 * formulário (resources/js/form-fill.js): as regras puras. Roda com
 * `npm test` (node --test), sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    camposForaDaUrl, chaveDoParametro, chavesEmUso, enviaAoMudar, esperaOAplicar, semAsChaves, textoDoPeriodo,
} from '../../resources/js/filters.js';

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

test('na gaveta da barra (abaixo do lg) nada envia sozinho: a lista espera o Aplicar', () => {
    // A gaveta é `fixed` só quando é gaveta; no computador ela é a própria linha de filtros.
    assert.equal(esperaOAplicar(true, 'fixed'), true);
    assert.equal(esperaOAplicar(true, 'static'), false);
    // O campo fora da gaveta (a barra sem `x-ui.filter-bar`) segue enviando ao mudar.
    assert.equal(esperaOAplicar(false, 'fixed'), false);
});

test('o nome do parâmetro sem os colchetes: status[], status[0] e status são o mesmo filtro', () => {
    assert.equal(chaveDoParametro('status[]'), 'status');
    assert.equal(chaveDoParametro('status[0]'), 'status');
    assert.equal(chaveDoParametro('status'), 'status');
});

test('em uso são os filtros que a URL traz com valor; a página e o por_pagina não contam', () => {
    const usadas = chavesEmUso('?status%5B0%5D=open&status%5B1%5D=partial&search=&from=2026-11-01&page=2&por_pagina=50');

    assert.deepEqual([...usadas].sort(), ['from', 'status']);
});

test('tirar um filtro é a mesma URL sem as chaves dele e sem a página', () => {
    assert.equal(semAsChaves('?status%5B0%5D=open&from=2026-11-01&to=2026-11-30&page=3&por_pagina=50', ['from', 'to']),
        '?status%5B0%5D=open&por_pagina=50');
    // Tirando o último, a URL fica sem nada.
    assert.equal(semAsChaves('?search=ana&page=2', ['search']), '');
});

test('o período da etiqueta: as duas pontas, só o começo ou só o fim', () => {
    assert.equal(textoDoPeriodo('2026-11-01', '2026-11-30'), '01/11/2026 a 30/11/2026');
    assert.equal(textoDoPeriodo('2026-11-01', ''), 'a partir de 01/11/2026');
    assert.equal(textoDoPeriodo('', '2026-11-30'), 'até 30/11/2026');
    assert.equal(textoDoPeriodo('', ''), '');
});
