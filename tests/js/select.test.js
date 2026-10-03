/*
 * O select com busca no servidor (resources/js/select.js): a URL da busca,
 * as opções que o nativo fica depois dela, os dados de cada opção (a
 * segunda linha e o `extra`) e a escolha que a tela lê — no simples e no
 * de várias escolhas (`multiple`). Roda com `npm test`, sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    alternarValor,
    chipsDasOpcoes,
    escolhaDaOpcao,
    escolhaDe,
    escolhasDasOpcoes,
    ficaEscondida,
    lerExtra,
    mesclarOpcoes,
    mesclarVarias,
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

// --- Várias escolhas (`multiple`) ---

test('alternar põe no fim o valor que não estava e tira o que estava', () => {
    assert.deepEqual(alternarValor(['a', 'b'], 'c'), ['a', 'b', 'c']);
    assert.deepEqual(alternarValor(['a', 'b', 'c'], 'b'), ['a', 'c']);
    assert.deepEqual(alternarValor([], 'a'), ['a']);
    assert.deepEqual(alternarValor(['a'], 'a'), []);
});

test('alternar compara como texto, devolve textos e não mexe na lista de entrada', () => {
    const valores = [1, '2'];

    assert.deepEqual(alternarValor(valores, '1'), ['2']);
    assert.deepEqual(alternarValor(valores, 3), ['1', '2', '3']);
    assert.deepEqual(valores, [1, '2']);
    assert.deepEqual(alternarValor(undefined, 'a'), ['a']);
});

test('os chips: um por escolhida, com o valor e o texto (o caminho no hierárquico)', () => {
    const chips = chipsDasOpcoes([
        opcao('customer', '  Cliente '),
        opcao('3', '   Apartamento', { caminho: 'Residencial › Apartamento' }),
    ]);

    assert.deepEqual(chips, [
        { value: 'customer', label: 'Cliente' },
        { value: '3', label: 'Residencial › Apartamento' },
    ]);
});

test('a opção vazia não vira chip; sem escolhidas, nenhum chip', () => {
    assert.deepEqual(chipsDasOpcoes([opcao('', 'Selecione…'), opcao('a', 'A')]), [{ value: 'a', label: 'A' }]);
    assert.deepEqual(chipsDasOpcoes([]), []);
    assert.deepEqual(chipsDasOpcoes(undefined), []);
});

test('as escolhas de várias são três listas na ordem das opções, uma posição por escolhida', () => {
    const escolhas = escolhasDasOpcoes([
        opcao('12', 'Café 500 g', { caption: 'P-0012', extra: '{"price":"19.90"}' }),
        opcao('13', 'Açúcar 1 kg'),
        opcao('14', 'Sal', { extra: '{preço' }),
    ]);

    assert.deepEqual(escolhas, {
        values: ['12', '13', '14'],
        labels: ['Café 500 g', 'Açúcar 1 kg', 'Sal'],
        extras: [{ price: '19.90' }, null, null],
    });
});

test('sem escolhida, as listas vêm vazias (nunca null); a opção vazia não entra', () => {
    const vazias = { values: [], labels: [], extras: [] };

    assert.deepEqual(escolhasDasOpcoes([]), vazias);
    assert.deepEqual(escolhasDasOpcoes([opcao('', 'Selecione…')]), vazias);
    assert.deepEqual(escolhasDasOpcoes(undefined), vazias);
});

test('escolhaDe no select de várias devolve as listas', () => {
    const nativo = {
        multiple: true,
        selectedOptions: [opcao('customer', 'Cliente'), opcao('supplier', 'Fornecedor', { extra: '{"tipo":"pj"}' })],
    };

    assert.deepEqual(escolhaDe(nativo), {
        values: ['customer', 'supplier'],
        labels: ['Cliente', 'Fornecedor'],
        extras: [null, { tipo: 'pj' }],
    });
    assert.deepEqual(escolhaDe({ multiple: true, selectedOptions: [] }), { values: [], labels: [], extras: [] });
});

test('escolhaDe no de várias guarda as listas enquanto as marcadas forem as mesmas', () => {
    const cliente = opcao('customer', 'Cliente');
    const fornecedor = opcao('supplier', 'Fornecedor');
    const nativo = { multiple: true, selectedOptions: [cliente, fornecedor] };
    const primeira = escolhaDe(nativo);

    nativo.selectedOptions = [cliente, fornecedor];
    assert.equal(escolhaDe(nativo), primeira);

    // Uma a menos: lidas de novo.
    nativo.selectedOptions = [fornecedor];
    assert.deepEqual(escolhaDe(nativo).values, ['supplier']);

    // A mesma quantidade, outra no lugar: lidas de novo.
    nativo.selectedOptions = [cliente];
    assert.deepEqual(escolhaDe(nativo).values, ['customer']);
});

test('busca com várias: as escolhidas que vieram ficam marcadas; as que não vieram, escondidas no fim, na ordem', () => {
    const escolhidas = [
        { value: '2', label: 'Gráfica' },
        { value: '9', label: 'Antiga', caption: 'inativa', extra: { id: 9 } },
        { value: '7', label: 'Outra' },
    ];
    const opcoes = mesclarVarias(escolhidas, [{ value: 1, label: 'Padaria' }, { value: 2, label: 'Gráfica' }]);

    assert.deepEqual(opcoes, [
        { value: '1', label: 'Padaria', selected: false, hidden: false },
        { value: '2', label: 'Gráfica', selected: true, hidden: false },
        { value: '9', label: 'Antiga', caption: 'inativa', extra: { id: 9 }, selected: true, hidden: true },
        { value: '7', label: 'Outra', selected: true, hidden: true },
    ]);
});

test('busca com várias: sem escolhidas, só as que vieram; escolhida repetida não se duplica', () => {
    assert.deepEqual(mesclarVarias([], [{ value: 1, label: 'Padaria' }]), [
        { value: '1', label: 'Padaria', selected: false, hidden: false },
    ]);

    const repetida = mesclarVarias([{ value: 9, label: 'Antiga' }, { value: '9', label: 'Antiga' }], []);

    assert.deepEqual(repetida, [{ value: '9', label: 'Antiga', selected: true, hidden: true }]);
});

test('o simples é o de várias com uma escolhida só', () => {
    const itens = [{ value: 1, label: 'Padaria' }, { value: 2, label: 'Gráfica', caption: 'saldo 3' }];

    assert.deepEqual(mesclarOpcoes({ value: '2', label: 'Gráfica' }, itens), mesclarVarias([{ value: '2', label: 'Gráfica' }], itens));
    assert.deepEqual(mesclarOpcoes({ value: '9', label: 'Antiga' }, itens), mesclarVarias([{ value: '9', label: 'Antiga' }], itens));
    assert.deepEqual(mesclarOpcoes(null, itens), mesclarVarias([], itens));
});
