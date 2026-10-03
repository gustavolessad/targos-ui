/*
 * O select com busca no servidor (resources/js/select.js): a URL da busca,
 * as opções que o nativo fica depois dela, os dados de cada opção (a
 * segunda linha e o `extra`) e a escolha que a tela lê. Roda com
 * `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    escolhaDaOpcao,
    escolhaDe,
    ficaEscondida,
    lerExtra,
    mesclarOpcoes,
    textoDoExtra,
    urlDaBusca,
} from '../../resources/js/select.js';

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

test('a segunda linha e os dados vêm junto com a opção da busca', () => {
    const extra = { price: '19.90', unit: 'UN', stock: 12 };
    const opcoes = mesclarOpcoes(null, [{ value: 12, label: 'Café 500 g', caption: 'P-0012 · saldo 12', extra }]);

    assert.deepEqual(opcoes, [
        { value: '12', label: 'Café 500 g', caption: 'P-0012 · saldo 12', extra, selected: false, hidden: false },
    ]);
});

test('sem segunda linha nem dados, as chaves não aparecem (nulo e vazio contam como nada)', () => {
    const [opcao] = mesclarOpcoes(null, [{ value: 1, label: 'Padaria', caption: null, extra: null }]);
    const [embranco] = mesclarOpcoes(null, [{ value: 2, label: 'Gráfica', caption: '  ' }]);

    assert.deepEqual(opcao, { value: '1', label: 'Padaria', selected: false, hidden: false });
    assert.equal('caption' in embranco, false);
    assert.equal('extra' in embranco, false);
});

test('a escolhida que não veio continua escondida com a segunda linha e os dados que tinha', () => {
    const escolhida = { value: '9', label: 'Açúcar 1 kg', caption: 'P-0009', extra: { price: '5.49', unit: 'KG' } };
    const opcoes = mesclarOpcoes(escolhida, [{ value: 1, label: 'Padaria', caption: 'P-0001', extra: { price: '1.00' } }]);

    assert.deepEqual(opcoes.at(-1), { ...escolhida, selected: true, hidden: true });
});

test('a escolhida lida do nativo (caption e extra nulos) volta sem as chaves', () => {
    const opcoes = mesclarOpcoes({ value: '9', label: 'Antiga', caption: null, extra: null }, []);

    assert.deepEqual(opcoes, [{ value: '9', label: 'Antiga', selected: true, hidden: true }]);
});

test('a escolhida que veio na busca fica com os dados novos dela', () => {
    const escolhida = { value: '2', label: 'Gráfica', caption: 'saldo 3', extra: { stock: 3 } };
    const [opcao] = mesclarOpcoes(escolhida, [{ value: 2, label: 'Gráfica', caption: 'saldo 7', extra: { stock: 7 } }]);

    assert.deepEqual(opcao, { value: '2', label: 'Gráfica', caption: 'saldo 7', extra: { stock: 7 }, selected: true, hidden: false });
});

test('o data-extra é JSON, e só existe quando há dados', () => {
    assert.equal(textoDoExtra({ price: '19.90', unit: 'UN', stock: 12 }), '{"price":"19.90","unit":"UN","stock":12}');
    assert.equal(textoDoExtra({ nome: 'Pão & "francês"' }), '{"nome":"Pão & \\"francês\\""}');
    assert.equal(textoDoExtra(null), null);
    assert.equal(textoDoExtra(undefined), null);
});

test('o data-extra volta como estava', () => {
    const extra = { price: '19.90', unit: 'UN', stock: 12, tags: ['a', 'b'], ativo: true };

    assert.deepEqual(lerExtra(textoDoExtra(extra)), extra);
});

test('sem data-extra, ou com um JSON que não se lê, os dados são nulos', () => {
    assert.equal(lerExtra(undefined), null);
    assert.equal(lerExtra(null), null);
    assert.equal(lerExtra(''), null);
    assert.equal(lerExtra('{preço: 1'), null);
});

/** Uma `<option>` do jeito que o select.js a lê: valor, texto e `dataset`. */
const opcao = (value, texto, dataset = {}) => ({ value, textContent: texto, dataset });

test('a escolha de uma opção traz o rótulo, a segunda linha e os dados', () => {
    const escolha = escolhaDaOpcao(opcao('12', 'Café 500 g', { caption: 'P-0012 · saldo 12', extra: '{"price":"19.90","unit":"UN"}' }));

    assert.deepEqual(escolha, { value: '12', label: 'Café 500 g', caption: 'P-0012 · saldo 12', extra: { price: '19.90', unit: 'UN' } });
});

test('sem segunda linha nem dados, caption e extra são nulos; o recuo do hierárquico sai do rótulo', () => {
    assert.deepEqual(escolhaDaOpcao(opcao('3', '   Apartamento')), { value: '3', label: 'Apartamento', caption: null, extra: null });
});

test('a opção vazia (o placeholder) não é escolha', () => {
    assert.equal(escolhaDaOpcao(opcao('', 'Selecione…')), null);
    assert.equal(escolhaDaOpcao(undefined), null);
});

test('escolhaDe lê a opção marcada, inclusive a que veio do servidor', () => {
    const marcada = opcao('7', 'Leite', { caption: 'P-0007', extra: '{"price":"4.20"}' });
    const nativo = { selectedOptions: [marcada] };

    assert.deepEqual(escolhaDe(nativo), { value: '7', label: 'Leite', caption: 'P-0007', extra: { price: '4.20' } });
    assert.equal(escolhaDe({ selectedOptions: [] }), null);
    assert.equal(escolhaDe(null), null);
});

test('escolhaDe guarda a escolha: o mesmo objeto enquanto a opção marcada for a mesma', () => {
    const nativo = { selectedOptions: [opcao('7', 'Leite', { extra: '{"price":"4.20"}' })] };
    const primeira = escolhaDe(nativo);

    assert.equal(escolhaDe(nativo), primeira);

    // Outra opção marcada (por script, ou pela busca que reescreveu as opções): lida de novo.
    nativo.selectedOptions = [opcao('8', 'Manteiga', { extra: '{"price":"9.90"}' })];

    assert.deepEqual(escolhaDe(nativo).extra, { price: '9.90' });
});

test('no filtro local, fica quem tem o termo no rótulo ou na segunda linha', () => {
    const linha = { valor: '12', busca: 'cafe 500 g p-0012' };

    assert.equal(ficaEscondida(linha, '', false), false);
    assert.equal(ficaEscondida(linha, 'p-0012', false), false);
    assert.equal(ficaEscondida(linha, 'acucar', false), true);
});

test('na busca no servidor, só a opção vazia sai da frente quando há termo', () => {
    const vazia = { valor: '', busca: 'selecione' };
    const outra = { valor: '12', busca: 'cafe' };

    assert.equal(ficaEscondida(vazia, '', true), false);
    assert.equal(ficaEscondida(vazia, 'leite', true), true);
    assert.equal(ficaEscondida(outra, 'leite', true), false);
});
