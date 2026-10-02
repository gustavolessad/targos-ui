/*
 * As máscaras de campo (resources/js/ui/masks.js). Roda com `npm test`.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
    aplicarMascara,
    ligarMascaras,
    MASCARAS,
    mensagemInvalida,
    validarCep,
    validarCnpj,
    validarCpf,
    validarTelefone,
    valorLimpo,
} from '../../resources/js/masks.js';

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

// --- Um campo de mentira para o `ligarMascaras` ---

/*
 * Só o que o masks.js e o errors.js tocam: `dataset`, `value`, os
 * ouvintes, o envelope (onde o erro entra) e o documento (o destino e o
 * `<p>` do erro). Sem navegador, como o resto destes testes.
 */
function campoFalso(dataset, valor = '') {
    const ouvintes = {};
    const envelope = {
        filhos: [],
        append(elemento) {
            elemento.remove = () => {
                envelope.filhos = envelope.filhos.filter((filho) => filho !== elemento);
            };
            envelope.filhos.push(elemento);
        },
        querySelectorAll: () => [...envelope.filhos],
    };
    const destino = { value: 'o que veio do servidor', eventos: [], dispatchEvent: (evento) => destino.eventos.push(evento.type) };
    const atributos = {};

    const campo = {
        value: valor,
        dataset: { ...dataset },
        envelope,
        destino,
        atributos,
        addEventListener(tipo, ouvinte) {
            (ouvintes[tipo] ??= []).push(ouvinte);
        },
        disparar(tipo) {
            (ouvintes[tipo] ?? []).forEach((ouvinte) => ouvinte());
        },
        /** Uma tecla de cada vez, como quem digita. */
        digitar(texto) {
            for (const tecla of texto) {
                campo.value += tecla;
                campo.disparar('input');
            }
        },
        apagar() {
            campo.value = campo.value.slice(0, -1);
            campo.disparar('input');
        },
        closest: () => envelope,
        setAttribute: (nome, valorDoAtributo) => { atributos[nome] = valorDoAtributo; },
        removeAttribute: (nome) => { delete atributos[nome]; },
        ownerDocument: { getElementById: (id) => (id === dataset.mascaraDestino ? destino : null) },
    };

    globalThis.document ??= { createElement: () => ({ dataset: {} }) };
    ligarMascaras({ querySelectorAll: () => [campo] });

    return campo;
}

/** As mensagens que o JavaScript escreveu embaixo do campo. */
const errosDe = (campo) => campo.envelope.filhos.map((erro) => erro.textContent);

test('ligarMascaras continua idempotente', () => {
    const campo = campoFalso({ mascara: 'cpf' }, '52998224725');

    ligarMascaras({ querySelectorAll: () => [campo] });
    campo.digitar('9');

    assert.equal(campo.value, '529.982.247-25');
});

// --- Documento: CPF até o 11º caractere, CNPJ a partir do 12º ---

test('documento: até 11 dígitos é CPF', () => {
    const campo = campoFalso({ mascara: 'documento' });

    campo.digitar('529982');
    assert.equal(campo.value, '529.982');

    campo.digitar('24725');
    assert.equal(campo.value, '529.982.247-25');
});

test('documento: do 12º caractere em diante vira CNPJ, e volta a CPF ao apagar', () => {
    const campo = campoFalso({ mascara: 'documento' });

    campo.digitar('11222333000');
    assert.equal(campo.value, '112.223.330-00');

    campo.digitar('1');
    assert.equal(campo.value, '11.222.333/0001');

    campo.digitar('81');
    assert.equal(campo.value, '11.222.333/0001-81');

    campo.apagar();
    campo.apagar();
    campo.apagar();
    assert.equal(campo.value, '112.223.330-00');
});

test('documento: uma letra já faz dele CNPJ, para o alfanumérico poder ser digitado', () => {
    const campo = campoFalso({ mascara: 'documento' });

    campo.digitar('12abc');
    assert.equal(campo.value, '12.ABC');

    campo.digitar('34501de35');
    assert.equal(campo.value, '12.ABC.345/01DE-35');
});

test('documento: o valor que vem do servidor é formatado ao ligar', () => {
    assert.equal(campoFalso({ mascara: 'documento' }, '52998224725').value, '529.982.247-25');
    assert.equal(campoFalso({ mascara: 'documento' }, '12ABC34501DE35').value, '12.ABC.345/01DE-35');
});

test('documento: valorLimpo segue o tamanho', () => {
    assert.equal(valorLimpo('12.abc.345/01de-35', 'documento'), '12ABC34501DE35');
    assert.equal(valorLimpo('11.222.333/0001-81', 'documento'), '11222333000181');
    assert.equal(valorLimpo('', 'documento'), '');
});

// --- Validação ---

test('CPF válido', () => {
    assert.equal(validarCpf('52998224725'), true);
    assert.equal(validarCpf('11144477735'), true);
    assert.equal(validarCpf('12345678909'), true);
});

test('CPF inválido: verificador errado, todos iguais, tamanho errado, letra', () => {
    assert.equal(validarCpf('52998224724'), false);
    assert.equal(validarCpf('52998224715'), false);
    assert.equal(validarCpf('11111111111'), false);
    assert.equal(validarCpf('00000000000'), false);
    assert.equal(validarCpf('5299822472'), false);
    assert.equal(validarCpf('529982247250'), false);
    assert.equal(validarCpf('5299822472A'), false);
    assert.equal(validarCpf(''), false);
    assert.equal(validarCpf(null), false);
});

test('CNPJ válido: o numérico de sempre e o alfanumérico da Receita', () => {
    assert.equal(validarCnpj('11222333000181'), true);
    assert.equal(validarCnpj('12345678000195'), true);
    assert.equal(validarCnpj('12ABC34501DE35'), true);
    // A máscara mostra em maiúsculas; minúscula vale o mesmo.
    assert.equal(validarCnpj('12abc34501de35'), true);
});

test('CNPJ inválido: verificador errado, todos iguais, letra no verificador, tamanho errado', () => {
    assert.equal(validarCnpj('11222333000182'), false);
    assert.equal(validarCnpj('11222333000171'), false);
    assert.equal(validarCnpj('12ABC34501DE36'), false);
    assert.equal(validarCnpj('12ABC34501DF35'), false);
    assert.equal(validarCnpj('11111111111111'), false);
    assert.equal(validarCnpj('00000000000000'), false);
    assert.equal(validarCnpj('12ABC34501DE3A'), false);
    assert.equal(validarCnpj('1122233300018'), false);
    assert.equal(validarCnpj('112223330001810'), false);
    assert.equal(validarCnpj(''), false);
});

test('telefone válido: fixo com 10 dígitos, celular com 11 começando por 9', () => {
    assert.equal(validarTelefone('4833334444'), true);
    assert.equal(validarTelefone('48999991234'), true);
    assert.equal(validarTelefone('11987654321'), true);
    assert.equal(validarTelefone('99987654321'), true);
});

test('telefone inválido: DDD fora de 11 a 99, celular sem o 9, tamanho errado', () => {
    assert.equal(validarTelefone('0833334444'), false);
    assert.equal(validarTelefone('1033334444'), false);
    assert.equal(validarTelefone('48899991234'), false);
    assert.equal(validarTelefone('483333444'), false);
    assert.equal(validarTelefone('489999912345'), false);
    assert.equal(validarTelefone(''), false);
});

test('CEP: 8 dígitos', () => {
    assert.equal(validarCep('80000000'), true);
    assert.equal(validarCep('88015420'), true);
    assert.equal(validarCep('8000000'), false);
    assert.equal(validarCep('800000000'), false);
    assert.equal(validarCep('8000000A'), false);
    assert.equal(validarCep(''), false);
});

test('mensagemInvalida: a mensagem de cada máscara, e null quando válido', () => {
    assert.equal(mensagemInvalida('cpf', '529.982.247-25'), null);
    assert.equal(mensagemInvalida('cpf', '111.111.111-11'), 'CPF inválido.');
    assert.equal(mensagemInvalida('cpf', '529.982'), 'CPF inválido.');

    assert.equal(mensagemInvalida('cnpj', '12.ABC.345/01DE-35'), null);
    assert.equal(mensagemInvalida('cnpj', '11.222.333/0001-81'), null);
    assert.equal(mensagemInvalida('cnpj', '11.111.111/1111-11'), 'CNPJ inválido.');

    assert.equal(mensagemInvalida('telefone', '(48) 99999-1234'), null);
    assert.equal(mensagemInvalida('celular', '(48) 3333-4444'), null);
    assert.equal(mensagemInvalida('telefone', '(48) 89999-1234'), 'Telefone inválido.');
    assert.equal(mensagemInvalida('celular', '(05) 3333-4444'), 'Telefone inválido.');

    assert.equal(mensagemInvalida('cep', '80000-000'), null);
    assert.equal(mensagemInvalida('cep', '80000-00'), 'CEP inválido.');
});

test('mensagemInvalida: vazio nunca é inválido (obrigatório é do servidor)', () => {
    for (const mascara of ['cpf', 'cnpj', 'documento', 'telefone', 'celular', 'cep']) {
        assert.equal(mensagemInvalida(mascara, ''), null, mascara);
        assert.equal(mensagemInvalida(mascara, null), null, mascara);
        assert.equal(mensagemInvalida(mascara, '.-/'), null, mascara);
    }
});

test('mensagemInvalida: o documento é julgado pelo tamanho', () => {
    assert.equal(mensagemInvalida('documento', '529.982.247-25'), null);
    assert.equal(mensagemInvalida('documento', '111.111.111-11'), 'CPF inválido.');
    assert.equal(mensagemInvalida('documento', '529.982'), 'CPF inválido.');

    assert.equal(mensagemInvalida('documento', '12.ABC.345/01DE-35'), null);
    assert.equal(mensagemInvalida('documento', '11.222.333/0001-81'), null);
    assert.equal(mensagemInvalida('documento', '11.111.111/1111-11'), 'CNPJ inválido.');

    // 12 ou 13 caracteres, ou letra antes de completar o CNPJ: nem um nem outro.
    assert.equal(mensagemInvalida('documento', '11.222.333/0001'), 'Documento inválido.');
    assert.equal(mensagemInvalida('documento', '11.222.333/0001-8'), 'Documento inválido.');
    assert.equal(mensagemInvalida('documento', '12.ABC'), 'Documento inválido.');
});

test('mensagemInvalida: máscara sem regra não julga', () => {
    assert.equal(mensagemInvalida('cartao', '1234'), null);
    assert.equal(mensagemInvalida('99/99/9999', '99/99'), null);
    assert.equal(mensagemInvalida(undefined, '123'), null);
});

// --- Envio sem pontuação ---

test('valorLimpo: só letras e dígitos, como o campo os mostra', () => {
    assert.equal(valorLimpo('529.982.247-25', 'cpf'), '52998224725');
    assert.equal(valorLimpo('12.abc.345/01de-35', 'cnpj'), '12ABC34501DE35');
    assert.equal(valorLimpo('(48) 99999-1234', 'telefone'), '48999991234');
    assert.equal(valorLimpo('(48) 3333-4444', 'celular'), '4833334444');
    assert.equal(valorLimpo('80000-000', 'cep'), '80000000');
    assert.equal(valorLimpo('01/02/2026', '99/99/9999'), '01022026');
});

test('valorLimpo: o que a máscara não aceita também fica fora', () => {
    // Letra no CPF e dígito além do último não aparecem no campo; no envio, também não.
    assert.equal(valorLimpo('123a456b78909', 'cpf'), '12345678909');
    assert.equal(valorLimpo('800000001', 'cep'), '80000000');
});

test('valorLimpo: sem máscara, só tira a pontuação; vazio fica vazio', () => {
    assert.equal(valorLimpo('ab-12.cd', null), 'ab12cd');
    assert.equal(valorLimpo('', 'cnpj'), '');
    assert.equal(valorLimpo(null, 'cpf'), '');
});

test('data-mascara-destino: o escondido recebe o valor limpo ao ligar e a cada tecla', () => {
    const campo = campoFalso({ mascara: 'cnpj', mascaraDestino: 'cnpj' }, '12abc34501de35');

    // Ao ligar, sem evento: é o estado inicial.
    assert.equal(campo.value, '12.ABC.345/01DE-35');
    assert.equal(campo.destino.value, '12ABC34501DE35');
    assert.deepEqual(campo.destino.eventos, []);

    campo.apagar();
    assert.equal(campo.value, '12.ABC.345/01DE-3');
    assert.equal(campo.destino.value, '12ABC34501DE3');
    assert.deepEqual(campo.destino.eventos, ['input']);

    // O `change` do visível chega ao escondido.
    campo.disparar('change');
    assert.deepEqual(campo.destino.eventos, ['input', 'change']);
});

test('data-mascara-destino: telefone e CPF vão só com dígitos', () => {
    const telefone = campoFalso({ mascara: 'telefone', mascaraDestino: 'phone' });
    const cpf = campoFalso({ mascara: 'cpf', mascaraDestino: 'cpf' });

    telefone.digitar('48999991234');
    cpf.digitar('529.982.247-25');

    assert.equal(telefone.value, '(48) 99999-1234');
    assert.equal(telefone.destino.value, '48999991234');
    assert.equal(cpf.destino.value, '52998224725');
});

test('data-mascara-valida: o erro aparece ao sair do campo e sai na tecla seguinte', () => {
    const campo = campoFalso({ mascara: 'cpf', mascaraValida: '' });

    campo.digitar('11111111111');
    assert.deepEqual(errosDe(campo), []);

    campo.disparar('blur');
    assert.deepEqual(errosDe(campo), ['CPF inválido.']);
    assert.equal(campo.atributos['aria-invalid'], 'true');

    // Sair de novo sem mudar não empilha outro.
    campo.disparar('blur');
    assert.deepEqual(errosDe(campo), ['CPF inválido.']);

    campo.apagar();
    assert.deepEqual(errosDe(campo), []);
    assert.equal(campo.atributos['aria-invalid'], undefined);
});

test('data-mascara-valida: valor válido e campo vazio não mostram erro', () => {
    const valido = campoFalso({ mascara: 'documento', mascaraValida: '' }, '12ABC34501DE35');
    const vazio = campoFalso({ mascara: 'telefone', mascaraValida: '' });

    valido.disparar('blur');
    vazio.disparar('blur');

    assert.deepEqual(errosDe(valido), []);
    assert.deepEqual(errosDe(vazio), []);
});

test('sem data-mascara-valida, a máscara não julga', () => {
    const campo = campoFalso({ mascara: 'cpf' }, '11111111111');

    campo.disparar('blur');

    assert.deepEqual(errosDe(campo), []);
});
