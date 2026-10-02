/*
 * As máscaras de campo (resources/js/ui/masks.js). Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { aplicarMascara, MASCARAS } from '../../resources/js/masks.js';

test('CNPJ só com números', () => {
    assert.equal(aplicarMascara('12345678000195', MASCARAS.cnpj), '12.345.678/0001-95');
    assert.equal(aplicarMascara('12.345.678/0001-95', MASCARAS.cnpj), '12.345.678/0001-95');
});

test('CNPJ com letras: aceitas nas 12 primeiras posições, em maiúsculas', () => {
    assert.equal(aplicarMascara('12abc34501de35', MASCARAS.cnpj), '12.ABC.345/01DE-35');
    assert.equal(aplicarMascara('12.ABC.345/01DE-35', MASCARAS.cnpj), '12.ABC.345/01DE-35');
    assert.equal(aplicarMascara('12ab', MASCARAS.cnpj), '12.AB');
});

test('os dois dígitos verificadores do CNPJ são sempre números', () => {
    assert.equal(aplicarMascara('12ABC34501DEXY', MASCARAS.cnpj), '12.ABC.345/01DE-');
    assert.equal(aplicarMascara('12ABC34501DEX3Y5', MASCARAS.cnpj), '12.ABC.345/01DE-35');
});

test('CPF e CEP não aceitam letra', () => {
    assert.equal(aplicarMascara('123a456b78909', MASCARAS.cpf), '123.456.789-09');
    assert.equal(aplicarMascara('80x000000', MASCARAS.cep), '80000-000');
});
