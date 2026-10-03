/*
 * O arquivo (resources/js/file.js): o tamanho para gente ler, o
 * `accept` conferido no navegador e o resumo do que foi escolhido. A
 * imagem com prévia (image.js) confere com as mesmas funções. Roda com
 * `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { aceita, conferirArquivos, resumoDosArquivos, tamanhoLegivel } from '../../resources/js/file.js';

const MB = 1024 * 1024;

/** Um arquivo de mentira: o que as funções leem de um `File`. */
function arquivo(name, size = 1024, type = '') {
    return { name, size, type };
}

test('tamanhoLegivel: uma casa abaixo de 10, nenhuma dali para cima', () => {
    assert.equal(tamanhoLegivel(12 * 1024), '12 KB');
    assert.equal(tamanhoLegivel(1.2 * MB), '1,2 MB');
    assert.equal(tamanhoLegivel(1536), '1,5 KB');
    assert.equal(tamanhoLegivel(1024), '1 KB');
    assert.equal(tamanhoLegivel(10 * MB), '10 MB');
    assert.equal(tamanhoLegivel(250 * MB), '250 MB');
    assert.equal(tamanhoLegivel(3.5 * 1024 * MB), '3,5 GB');
});

test('tamanhoLegivel: abaixo de 1 KB, em bytes', () => {
    assert.equal(tamanhoLegivel(500), '500 bytes');
    assert.equal(tamanhoLegivel(1), '1 byte');
    assert.equal(tamanhoLegivel(0), '0 bytes');
    assert.equal(tamanhoLegivel(null), '0 bytes');
    assert.equal(tamanhoLegivel(-5), '0 bytes');
});

test('tamanhoLegivel: o que arredonda para 1024 sobe de unidade', () => {
    assert.equal(tamanhoLegivel(MB - 1), '1 MB');
    assert.equal(tamanhoLegivel(1000 * 1024), '1.000 KB');
});

test('aceita pela extensão, sem diferença de maiúsculas', () => {
    assert.equal(aceita(arquivo('nota.xml'), '.xml'), true);
    assert.equal(aceita(arquivo('NOTA.XML'), '.xml'), true);
    assert.equal(aceita(arquivo('nota.xml.pdf'), '.xml'), false);
    assert.equal(aceita(arquivo('backup.tar.gz'), '.tar.gz'), true);
});

test('aceita pelo tipo exato e pela família com curinga', () => {
    assert.equal(aceita(arquivo('nota', 10, 'text/xml'), 'text/xml'), true);
    assert.equal(aceita(arquivo('foto.png', 10, 'image/png'), 'image/*'), true);
    assert.equal(aceita(arquivo('foto.png', 10, 'image/png'), 'image/jpeg,image/webp'), false);
    assert.equal(aceita(arquivo('video.mp4', 10, 'video/mp4'), 'image/*'), false);
    // Tipo desconhecido (o navegador deixa vazio) não entra pela família.
    assert.equal(aceita(arquivo('foto.heic', 10, ''), 'image/*'), false);
});

test('aceita: qualquer item da lista basta, com espaços em volta', () => {
    assert.equal(aceita(arquivo('nota.xml', 10, 'application/xml'), '.xml, text/xml'), true);
    assert.equal(aceita(arquivo('nota', 10, 'text/xml'), ' .xml , text/xml '), true);
    assert.equal(aceita(arquivo('nota.txt', 10, 'text/plain'), '.xml,text/xml'), false);
});

test('aceita: sem accept, tudo passa', () => {
    assert.equal(aceita(arquivo('qualquer.exe'), null), true);
    assert.equal(aceita(arquivo('qualquer.exe'), ''), true);
    assert.equal(aceita(arquivo('qualquer.exe'), ' , '), true);
    assert.equal(aceita(arquivo('qualquer.exe', 10, 'application/x-msdownload'), '*/*'), true);
});

test('resumoDosArquivos: um pelo nome, vários pela conta', () => {
    assert.equal(resumoDosArquivos([arquivo('nota.xml', 12 * 1024)]), 'nota.xml (12 KB)');
    assert.equal(resumoDosArquivos([arquivo('a.jpg', 0.4 * MB), arquivo('b.jpg', 0.4 * MB), arquivo('c.jpg', 0.4 * MB)]), '3 arquivos (1,2 MB)');
    assert.equal(resumoDosArquivos([]), '');
    assert.equal(resumoDosArquivos(null), '');
});

test('conferirArquivos: o que passa devolve null', () => {
    assert.equal(conferirArquivos([arquivo('nota.xml', 5 * MB, 'text/xml')], { accept: '.xml,text/xml', max: 10 }), null);
    // Exatamente o máximo passa, como no `max:10240` do Laravel.
    assert.equal(conferirArquivos([arquivo('nota.xml', 10 * MB)], { max: 10 }), null);
    assert.equal(conferirArquivos([]), null);
});

test('conferirArquivos: o tamanho, com um arquivo e com vários', () => {
    assert.equal(conferirArquivos([arquivo('grande.xml', 10 * MB + 1)], { max: 10 }), 'O arquivo passa de 10 MB.');
    assert.equal(conferirArquivos([arquivo('grande.xml', MB)], { max: '0.5' }), 'O arquivo passa de 0,5 MB.');
    assert.equal(
        conferirArquivos([arquivo('a.jpg', MB, 'image/jpeg'), arquivo('b.jpg', 20 * MB, 'image/jpeg')], { accept: 'image/*', max: 10 }),
        'O arquivo b.jpg passa de 10 MB.',
    );
});

test('conferirArquivos: o tipo vem antes do tamanho', () => {
    assert.equal(conferirArquivos([arquivo('nota.pdf', 20 * MB, 'application/pdf')], { accept: '.xml', max: 10 }), 'Tipo de arquivo não aceito.');
    assert.equal(
        conferirArquivos([arquivo('a.jpg', MB, 'image/jpeg'), arquivo('b.pdf', MB, 'application/pdf')], { accept: 'image/*' }),
        'Tipo de arquivo não aceito: b.pdf.',
    );
});

test('conferirArquivos: sem max (ausente, vazio ou zero), não há limite de tamanho', () => {
    assert.equal(conferirArquivos([arquivo('enorme.iso', 5000 * MB)]), null);
    assert.equal(conferirArquivos([arquivo('enorme.iso', 5000 * MB)], { max: undefined }), null);
    assert.equal(conferirArquivos([arquivo('enorme.iso', 5000 * MB)], { max: '' }), null);
    assert.equal(conferirArquivos([arquivo('enorme.iso', 5000 * MB)], { max: 0 }), null);
});
