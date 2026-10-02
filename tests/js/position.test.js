/*
 * Para que lado abre o que abre por cima da tela: o menu do dropdown
 * (resources/js/dropdown.js) e o painel do select e do calendário
 * (resources/js/floating.js). Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { ladoDoMenu } from '../../resources/js/dropdown.js';
import { encaixeVertical } from '../../resources/js/floating.js';

test('menu abre para baixo quando cabe', () => {
    assert.equal(ladoDoMenu({ natural: 'bottom', altura: 200, acima: 300, abaixo: 500 }), 'bottom');
});

test('menu no pé da janela vira para cima', () => {
    assert.equal(ladoDoMenu({ natural: 'bottom', altura: 233, acima: 793, abaixo: 60 }), 'top');
});

test('menu que não cabe embaixo fica embaixo se em cima há menos espaço ainda', () => {
    assert.equal(ladoDoMenu({ natural: 'bottom', altura: 400, acima: 50, abaixo: 300 }), 'bottom');
});

test('menu pedido para cima vira para baixo no alto da janela', () => {
    assert.equal(ladoDoMenu({ natural: 'top', altura: 200, acima: 40, abaixo: 600 }), 'bottom');
    assert.equal(ladoDoMenu({ natural: 'top', altura: 200, acima: 400, abaixo: 600 }), 'top');
});

test('a folga entre o botão e a lista entra na conta', () => {
    // 200 de lista + 6 de folga + 8 de margem = 214 para caber.
    assert.equal(ladoDoMenu({ natural: 'bottom', altura: 200, acima: 500, abaixo: 214 }), 'bottom');
    assert.equal(ladoDoMenu({ natural: 'bottom', altura: 200, acima: 500, abaixo: 213 }), 'top');
});

test('painel abre embaixo do campo quando cabe', () => {
    assert.deepEqual(encaixeVertical({ topo: 100, base: 140, altura: 300, janela: 900, folga: 6 }), { top: 146 });
});

test('painel no pé da janela abre para cima, preso pela base', () => {
    assert.deepEqual(encaixeVertical({ topo: 800, base: 840, altura: 300, janela: 900, folga: 6 }), { bottom: 106 });
});

test('painel que não cabe em nenhum lado fica inteiro na janela', () => {
    // Campo no meio de uma janela baixa: 385 de calendário não cabem nem acima (380) nem abaixo (348).
    const acima = encaixeVertical({ topo: 380, base: 420, altura: 385, janela: 768, folga: 6 });
    assert.deepEqual(acima, { top: 8 });

    // Mais espaço embaixo, e ainda assim não cabe: sobe até caber.
    const abaixo = encaixeVertical({ topo: 300, base: 340, altura: 385, janela: 700, folga: 6 });
    assert.deepEqual(abaixo, { top: 307 });
    assert.ok(abaixo.top + 385 <= 700 - 8);
});

test('painel mais alto que a janela começa no alto dela', () => {
    assert.deepEqual(encaixeVertical({ topo: 100, base: 140, altura: 600, janela: 500, folga: 6 }), { top: 8 });
});
