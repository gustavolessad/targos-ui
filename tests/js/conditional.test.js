/*
 * O bloco condicional (resources/js/conditional.js): a leitura do
 * `data-mostra-quando` e a regra que decide se o bloco aparece. Roda
 * com `npm test`, sem navegador — aqui, as regras; o DOM só as aplica.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { condicaoVale, condicoesValem, interpretarCondicao, interpretarCondicoes, valorDaChave } from '../../resources/js/conditional.js';

test('campo=valor: um campo e um valor', () => {
    assert.deepEqual(interpretarCondicao('forma=cartao'), { campo: 'forma', chave: null, valores: ['cartao'], negado: false });
});

test('campo=a|b: vários valores, com espaços sobrando', () => {
    assert.deepEqual(interpretarCondicao(' forma = cartao | boleto '), { campo: 'forma', chave: null, valores: ['cartao', 'boleto'], negado: false });
});

test('campo sozinho: qualquer valor não vazio', () => {
    assert.deepEqual(interpretarCondicao('entregar'), { campo: 'entregar', chave: null, valores: null, negado: false });
});

test('o "!" na frente nega, com ou sem valor', () => {
    assert.deepEqual(interpretarCondicao('!forma=dinheiro'), { campo: 'forma', chave: null, valores: ['dinheiro'], negado: true });
    assert.deepEqual(interpretarCondicao('! entregar'), { campo: 'entregar', chave: null, valores: null, negado: true });
});

test('campo= (nada depois do igual) é "o campo está vazio"', () => {
    assert.deepEqual(interpretarCondicao('obs='), { campo: 'obs', chave: null, valores: [''], negado: false });
});

test('o nome com colchete fica inteiro, e o "=" só separa no primeiro', () => {
    assert.deepEqual(interpretarCondicao('items[0][kind]=a=b'), { campo: 'items[0][kind]', chave: null, valores: ['a=b'], negado: false });
});

test('sem campo, não há condição', () => {
    assert.equal(interpretarCondicao(''), null);
    assert.equal(interpretarCondicao('=x'), null);
    assert.equal(interpretarCondicao('!'), null);
    assert.equal(interpretarCondicao(null), null);
    assert.equal(interpretarCondicao(undefined), null);
});

test('com valores, basta o do campo bater com um deles', () => {
    const condicao = interpretarCondicao('forma=cartao|boleto');

    assert.equal(condicaoVale(condicao, 'cartao'), true);
    assert.equal(condicaoVale(condicao, 'boleto'), true);
    assert.equal(condicaoVale(condicao, 'pix'), false);
    assert.equal(condicaoVale(condicao, ''), false);
});

test('o valor compara como texto: o 1 do checkbox e o "1" da condição são o mesmo', () => {
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), 1), true);
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), '1'), true);
    // A caixa desmarcada chega como vazio.
    assert.equal(condicaoVale(interpretarCondicao('ativo=1'), ''), false);
});

test('sem valores, vale o que não é vazio (a caixa marcada chega com o valor dela)', () => {
    const condicao = interpretarCondicao('entregar');

    assert.equal(condicaoVale(condicao, '1'), true);
    assert.equal(condicaoVale(condicao, 'qualquer coisa'), true);
    assert.equal(condicaoVale(condicao, ''), false);
    assert.equal(condicaoVale(condicao, null), false);
    assert.equal(condicaoVale(condicao, undefined), false);
});

test('negado, o contrário em tudo', () => {
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), 'dinheiro'), false);
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), 'cartao'), true);
    assert.equal(condicaoVale(interpretarCondicao('!forma=dinheiro'), ''), true);
    assert.equal(condicaoVale(interpretarCondicao('!entregar'), ''), true);
    assert.equal(interpretarCondicao('!entregar') && condicaoVale(interpretarCondicao('!entregar'), '1'), false);
});

test('campo= casa com o campo vazio, e só com ele', () => {
    assert.equal(condicaoVale(interpretarCondicao('obs='), ''), true);
    assert.equal(condicaoVale(interpretarCondicao('obs='), 'x'), false);
});

test('no select de várias, a lista: basta uma escolhida bater, e nenhuma é vazio', () => {
    const condicao = interpretarCondicao('roles=admin|owner');

    assert.equal(condicaoVale(condicao, ['customer', 'owner']), true);
    assert.equal(condicaoVale(condicao, ['customer']), false);
    assert.equal(condicaoVale(condicao, []), false);

    assert.equal(condicaoVale(interpretarCondicao('roles'), ['customer']), true);
    assert.equal(condicaoVale(interpretarCondicao('roles'), []), false);
    assert.equal(condicaoVale(interpretarCondicao('roles='), []), true);
});

test('sem condição, o bloco aparece', () => {
    assert.equal(condicaoVale(null, ''), true);
});

// --- Várias condições (`&`) ---

test('o & junta condições: uma por parte, na ordem, cada uma com o próprio "!"', () => {
    assert.deepEqual(interpretarCondicoes('entrada=1&!origem=transferencia'), [
        { campo: 'entrada', chave: null, valores: ['1'], negado: false },
        { campo: 'origem', chave: null, valores: ['transferencia'], negado: true },
    ]);
    assert.deepEqual(interpretarCondicoes(' forma = cartao | boleto & parcelas '), [
        { campo: 'forma', chave: null, valores: ['cartao', 'boleto'], negado: false },
        { campo: 'parcelas', chave: null, valores: null, negado: false },
    ]);
});

test('uma condição só continua sendo uma lista de uma; a parte sem campo é ignorada', () => {
    assert.deepEqual(interpretarCondicoes('forma=cartao'), [{ campo: 'forma', chave: null, valores: ['cartao'], negado: false }]);
    assert.deepEqual(interpretarCondicoes('forma=cartao&&=x&'), [{ campo: 'forma', chave: null, valores: ['cartao'], negado: false }]);
    assert.deepEqual(interpretarCondicoes(''), []);
    assert.deepEqual(interpretarCondicoes(null), []);
});

test('todas têm de valer; sem nenhuma, vale', () => {
    const condicoes = interpretarCondicoes('entrada=1&!origem=transferencia');
    const valores = (mapa) => (condicao) => mapa[condicao.campo] ?? '';

    assert.equal(condicoesValem(condicoes, valores({ entrada: '1', origem: 'compra' })), true);
    assert.equal(condicoesValem(condicoes, valores({ entrada: '1', origem: 'transferencia' })), false);
    assert.equal(condicoesValem(condicoes, valores({ entrada: '', origem: 'compra' })), false);
    assert.equal(condicoesValem([], () => ''), true);
    assert.equal(condicoesValem(null, () => ''), true);
});

// --- A chave do `extra` da opção (`campo.chave`) ---

test('campo.chave: o campo e a chave dos dados da opção, com ou sem valor', () => {
    assert.deepEqual(interpretarCondicao('produto.unidade=KG'), { campo: 'produto', chave: 'unidade', valores: ['KG'], negado: false });
    assert.deepEqual(interpretarCondicao('produto.controla_lote'), { campo: 'produto', chave: 'controla_lote', valores: null, negado: false });
    assert.deepEqual(interpretarCondicao('!deposito.tipo=transferencia'), { campo: 'deposito', chave: 'tipo', valores: ['transferencia'], negado: true });
    // Só o primeiro ponto separa: o resto é a chave, que desce nos dados.
    assert.deepEqual(interpretarCondicao('produto.dados.unidade=KG'), { campo: 'produto', chave: 'dados.unidade', valores: ['KG'], negado: false });
});

test('o ponto sem nada depois (ou antes) não é condição', () => {
    assert.equal(interpretarCondicao('produto.'), null);
    assert.equal(interpretarCondicao('.unidade'), null);
    assert.equal(interpretarCondicao('produto. =KG'), null);
});

test('o valor da chave sai dos dados como texto; true é "1" e false, nulo e o que falta são vazio', () => {
    const extra = { unidade: 'KG', preco: 19.9, estoque: 0, controla_lote: true, perecivel: false, obs: null, dados: { ncm: '0901' } };

    assert.equal(valorDaChave(extra, 'unidade'), 'KG');
    assert.equal(valorDaChave(extra, 'preco'), '19.9');
    // 0 é um valor, como num campo que diz 0: `produto.estoque=0` casa, e `produto.estoque` sozinho vale.
    assert.equal(valorDaChave(extra, 'estoque'), '0');
    assert.equal(valorDaChave(extra, 'controla_lote'), '1');
    assert.equal(valorDaChave(extra, 'perecivel'), '');
    assert.equal(valorDaChave(extra, 'obs'), '');
    assert.equal(valorDaChave(extra, 'nao_existe'), '');
    assert.equal(valorDaChave(extra, 'dados.ncm'), '0901');
    assert.equal(valorDaChave(extra, 'dados.nao.existe'), '');
    // Sem escolha (ou a opção sem dados), nada casa — a não ser o "está vazio".
    assert.equal(valorDaChave(null, 'unidade'), '');
    assert.equal(valorDaChave(undefined, 'unidade'), '');
});

test('a lista de dados (o select de várias) vira a lista dos valores, um por escolhida', () => {
    assert.deepEqual(valorDaChave([{ tipo: 'loja' }, { tipo: 'cd' }, null], 'tipo'), ['loja', 'cd', '']);
    assert.deepEqual(valorDaChave([], 'tipo'), []);
    // Uma lista dentro dos dados também: basta uma bater.
    assert.deepEqual(valorDaChave({ tags: ['frio', 'fragil'] }, 'tags'), ['frio', 'fragil']);
});

test('a condição pela chave compara como qualquer outra', () => {
    const extra = { unidade: 'KG', controla_lote: true, perecivel: false, estoque: 0 };
    const vale = (texto) => {
        const condicao = interpretarCondicao(texto);

        return condicaoVale(condicao, valorDaChave(extra, condicao.chave));
    };

    assert.equal(vale('produto.unidade=KG'), true);
    assert.equal(vale('produto.unidade=UN|PC'), false);
    assert.equal(vale('produto.controla_lote'), true);
    assert.equal(vale('produto.controla_lote=1'), true);
    assert.equal(vale('!produto.perecivel'), true);
    assert.equal(vale('produto.perecivel'), false);
    assert.equal(vale('produto.estoque=0'), true);
    assert.equal(vale('produto.obs='), true);
    // Sem escolha, só o "está vazio" (e o negado) valem.
    assert.equal(condicaoVale(interpretarCondicao('produto.unidade=KG'), valorDaChave(null, 'unidade')), false);
    assert.equal(condicaoVale(interpretarCondicao('!produto.unidade=KG'), valorDaChave(null, 'unidade')), true);
});

test('campo e chave misturados no mesmo &', () => {
    const condicoes = interpretarCondicoes('entrada=1&produto.unidade=KG');
    const dados = { entrada: '1', produto: { unidade: 'KG' } };
    const valorDe = (condicao) => (condicao.chave === null ? dados[condicao.campo] : valorDaChave(dados[condicao.campo], condicao.chave));

    assert.equal(condicoesValem(condicoes, valorDe), true);
    dados.produto.unidade = 'UN';
    assert.equal(condicoesValem(condicoes, valorDe), false);
});
