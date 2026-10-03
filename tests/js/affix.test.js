/*
 * O símbolo clicável do campo (resources/js/affix.js): quando o clique no
 * "R$" ou no "%" anuncia `ui:afixo`, e com o quê. Roda com `npm test`, sem
 * navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { LADOS, anuncioDoAfixo } from '../../resources/js/affix.js';

test('o símbolo anuncia o lado e o campo em que se digita', () => {
    const campo = { disabled: false, readOnly: false };

    assert.deepEqual(anuncioDoAfixo('prefix', campo), { lado: 'prefix', campo });
    assert.deepEqual(anuncioDoAfixo('suffix', campo), { lado: 'suffix', campo });
    // O campo é o mesmo objeto, e não uma cópia: quem escuta lê e foca o campo de verdade.
    assert.equal(anuncioDoAfixo('prefix', campo).campo, campo);
    assert.deepEqual(LADOS, ['prefix', 'suffix']);
});

test('o campo desligado ou só leitura não anuncia nada', () => {
    // A venda faturada mostra o desconto, mas não deixa trocar a unidade.
    assert.equal(anuncioDoAfixo('prefix', { disabled: true, readOnly: false }), null);
    assert.equal(anuncioDoAfixo('suffix', { disabled: false, readOnly: true }), null);
});

test('o lado desconhecido e o campo que não existe também não', () => {
    const campo = { disabled: false, readOnly: false };

    assert.equal(anuncioDoAfixo(undefined, campo), null);
    assert.equal(anuncioDoAfixo('', campo), null);
    assert.equal(anuncioDoAfixo('start', campo), null);
    assert.equal(anuncioDoAfixo('PREFIX', campo), null);
    assert.equal(anuncioDoAfixo('prefix', null), null);
    assert.equal(anuncioDoAfixo('prefix', undefined), null);
});
