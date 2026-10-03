/*
 * O aviso de alterações não salvas (resources/js/unsaved.js): a
 * fotografia do formulário, o que conta como mudança e que link pergunta
 * antes de sair. Roda com `npm test` (node --test), sem navegador.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

/*
 * O módulo pergunta pelo confirm.js, que se pendura em `window` ao
 * carregar (`window.confirmar`, e o layers.js com `window.abrirModal`).
 * No Node não há `window`: um vazio basta, e o import vem depois dele.
 */
globalThis.window ??= {};

const { fotografia, linkAvisa, mudou, textoDaPergunta } = await import('../../resources/js/unsaved.js');

const ORIGEM = 'https://painel.test';
const AQUI = 'https://painel.test/vendas/12/editar';

const avisa = (href, opcoes = {}) => linkAvisa(href, { origin: ORIGEM, atual: AQUI, ...opcoes });

test('os mesmos pares dão a mesma fotografia; outro valor, outra', () => {
    const antes = fotografia([['_token', 'abc'], ['cliente', '7'], ['obs', '']]);

    assert.equal(fotografia([['_token', 'abc'], ['cliente', '7'], ['obs', '']]), antes);
    assert.notEqual(fotografia([['_token', 'abc'], ['cliente', '8'], ['obs', '']]), antes);
    assert.notEqual(fotografia([['_token', 'abc'], ['cliente', '7'], ['obs', ' ']]), antes);
});

test('a ordem conta, e o campo a mais ou a menos também', () => {
    const linhas = fotografia([['items[0][id]', '1'], ['items[1][id]', '2']]);

    assert.notEqual(fotografia([['items[0][id]', '2'], ['items[1][id]', '1']]), linhas);
    assert.notEqual(fotografia([['items[0][id]', '1']]), linhas);
    assert.notEqual(fotografia([['items[0][id]', '1'], ['items[1][id]', '2'], ['items[2][id]', '3']]), linhas);
    // A caixa marcada aparece como um par; desmarcada, some.
    assert.notEqual(fotografia([['ativo', '1']]), fotografia([]));
});

test('o arquivo entra pelo nome e pelo tamanho', () => {
    const vazio = { name: '', size: 0, type: '' };
    const foto = { name: 'foto.png', size: 2048, type: 'image/png' };

    // O campo de arquivo sem escolha também é um par (o arquivo vazio): escolher um muda a fotografia.
    assert.notEqual(fotografia([['imagem', foto]]), fotografia([['imagem', vazio]]));
    assert.equal(fotografia([['imagem', { ...foto, lastModified: 1 }]]), fotografia([['imagem', foto]]));
    assert.notEqual(fotografia([['imagem', { ...foto, size: 4096 }]]), fotografia([['imagem', foto]]));
    assert.notEqual(fotografia([['imagem', { ...foto, name: 'outra.png' }]]), fotografia([['imagem', foto]]));
});

test('o arquivo de verdade (File) vale o mesmo que a descrição dele', { skip: typeof File === 'undefined' }, () => {
    const arquivo = new File(['abcd'], 'nota.txt', { type: 'text/plain' });

    assert.equal(fotografia([['anexo', arquivo]]), fotografia([['anexo', { name: 'nota.txt', size: 4 }]]));
});

test('um texto parecido com a descrição de um arquivo não se confunde com ele', () => {
    const arquivo = fotografia([['anexo', { name: 'a.png', size: 3 }]]);

    assert.notEqual(fotografia([['anexo', '{"arquivo":"a.png","tamanho":3}']]), arquivo);
    assert.notEqual(fotografia([['anexo', 'a.png']]), arquivo);
});

test('aceita o FormData, ou qualquer lista de pares que se percorra', () => {
    const pares = new Map([['nome', 'Ana'], ['email', 'ana@x.test']]);

    assert.equal(fotografia(pares), fotografia([['nome', 'Ana'], ['email', 'ana@x.test']]));
    assert.equal(fotografia([]), '[]');
});

test('mudou: só quando há fotografia e ela é outra', () => {
    const antes = fotografia([['valor', '10.00']]);

    assert.equal(mudou(antes, fotografia([['valor', '10.00']])), false);
    assert.equal(mudou(antes, fotografia([['valor', '12.00']])), true);
    // Voltar ao valor de antes (ou o `reset()`) deixa limpo de novo.
    assert.equal(mudou(antes, fotografia([['valor', '10.00']])), false);
    // Sem fotografia, o formulário não foi ligado: nada a avisar.
    assert.equal(mudou(undefined, antes), false);
    assert.equal(mudou(null, antes), false);
});

test('o link para outra página do sistema pergunta', () => {
    assert.equal(avisa('/vendas'), true);
    assert.equal(avisa('/vendas?page=2'), true);
    assert.equal(avisa('https://painel.test/clientes/7'), true);
    // Relativo ao endereço atual.
    assert.equal(avisa('../13/editar'), true);
    // A própria página, sem âncora: recarrega, e o digitado se perde.
    assert.equal(avisa(AQUI), true);
    assert.equal(avisa('?aba=itens'), true);
    // Na mesma janela, com o alvo escrito.
    assert.equal(avisa('/vendas', { target: '_self' }), true);
    assert.equal(avisa('/vendas', { target: ' _SELF ' }), true);
});

test('a âncora da própria página não pergunta: não se sai dela', () => {
    assert.equal(avisa('#'), false);
    assert.equal(avisa('#itens'), false);
    assert.equal(avisa(`${AQUI}#itens`), false);
    assert.equal(avisa('/vendas/12/editar#itens'), false);
    assert.equal(avisa(`${AQUI}#`), false);
    // A âncora de OUTRA página sai.
    assert.equal(avisa('/vendas/13/editar#itens'), true);
    // Já estando numa âncora, outra âncora da mesma página continua nela.
    assert.equal(avisa('#total', { atual: `${AQUI}#itens` }), false);
});

test('o href vazio, outra janela e o download não perguntam', () => {
    assert.equal(avisa(''), false);
    assert.equal(avisa('   '), false);
    assert.equal(avisa(null), false);
    assert.equal(avisa('/relatorio', { target: '_blank' }), false);
    assert.equal(avisa('/relatorio', { target: 'impressao' }), false);
    assert.equal(avisa('/vendas/12/pdf', { download: true }), false);
});

test('outra origem não pergunta: ali quem avisa é o navegador', () => {
    assert.equal(avisa('https://outro.test/vendas'), false);
    assert.equal(avisa('//outro.test/vendas'), false);
    assert.equal(avisa('http://painel.test/vendas'), false);
    assert.equal(avisa('mailto:ana@x.test'), false);
    assert.equal(avisa('tel:+5511999999999'), false);
    assert.equal(avisa('javascript:void(0)'), false);
});

test('data-sem-aviso não pergunta', () => {
    assert.equal(avisa('/vendas', { dataset: { semAviso: '' } }), false);
    assert.equal(avisa('/vendas', { dataset: { outro: '' } }), true);
});

test('sem o endereço atual, os relativos partem da origem', () => {
    assert.equal(linkAvisa('/vendas', { origin: ORIGEM }), true);
    assert.equal(linkAvisa('vendas', { origin: ORIGEM }), true);
    assert.equal(linkAvisa('https://outro.test', { origin: ORIGEM }), false);
});

test('o campo ignorado (data-nao-salvo-ignorar) fica fora da fotografia: mudar nele não suja', () => {
    const antes = fotografia([['_token', 'abc'], ['aba', 'geral'], ['nome', 'Ana']], ['aba']);

    assert.equal(fotografia([['_token', 'abc'], ['aba', 'itens'], ['nome', 'Ana']], ['aba']), antes);
    assert.notEqual(fotografia([['_token', 'abc'], ['aba', 'itens'], ['nome', 'Bia']], ['aba']), antes);
    // Sem a lista, tudo conta — como sempre contou.
    assert.notEqual(fotografia([['_token', 'abc'], ['aba', 'itens'], ['nome', 'Ana']]), antes);
    // A ignorada sai de todo lugar em que aparece, e o nome compara como texto.
    assert.equal(fotografia([['tags[]', 'a'], ['tags[]', 'b'], ['x', '1']], new Set(['tags[]'])), fotografia([['x', '1']]));
    assert.equal(fotografia([['x', '1']], null), fotografia([['x', '1']]));
});

test('a pergunta é a do formulário (data-nao-salvo-texto), ou a de sempre', () => {
    assert.equal(textoDaPergunta({ naoSalvoTexto: 'Descartar a venda em andamento?' }), 'Descartar a venda em andamento?');
    assert.equal(textoDaPergunta({ naoSalvoTexto: '  Sair?  ' }), 'Sair?');
    assert.equal(textoDaPergunta({ naoSalvoTexto: '   ' }), 'Há alterações não salvas. Sair e descartá-las?');
    assert.equal(textoDaPergunta({}), 'Há alterações não salvas. Sair e descartá-las?');
    assert.equal(textoDaPergunta(undefined), 'Há alterações não salvas. Sair e descartá-las?');
});
