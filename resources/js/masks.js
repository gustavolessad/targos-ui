// --- Máscara de campo ---

import { limparErroDoCampo, mostrarErroNoCampo } from './errors.js';

/**
 * As máscaras conhecidas.
 *
 * `9` aceita só dígito e `A` aceita letra ou dígito — o CNPJ que a
 * Receita passou a emitir em 2026 tem letras nas doze primeiras
 * posições, e só os dois verificadores continuam numéricos. O resto do
 * padrão é literal.
 *
 * `telefone` e `documento` não estão aqui: o padrão deles depende do
 * que já foi digitado (ver `padraoDa`).
 */
export const MASCARAS = {
    cep: '99999-999',
    cpf: '999.999.999-99',
    cnpj: 'AA.AAA.AAA/AAAA-99',
    /*
     * O cartão em grupos de quatro. Dezesseis dígitos cobrem Visa,
     * Mastercard e Elo; o Amex tem quinze e sai com um espaço a mais no
     * fim, o que não atrapalha — o servidor só olha os dígitos.
     */
    cartao: '9999 9999 9999 9999',
    validade: '99/9999',
    cvv: '9999',
};

/**
 * O telefone cresce com o que se digita.
 *
 * Fixo tem 8 dígitos e celular tem 9; uma máscara só para os dois evita
 * a tela ter de adivinhar qual usar antes de a pessoa digitar.
 */
const MASCARA_TELEFONE = (digitos) => (digitos.length > 10
    ? '(99) 99999-9999'
    : '(99) 9999-9999');

/**
 * O documento é CPF até o 11º caractere e CNPJ a partir do 12º.
 *
 * Uma letra também faz dele CNPJ, qualquer que seja o tamanho: só o
 * CNPJ alfanumérico tem letra, e com a máscara do CPF ela seria jogada
 * fora antes de a pessoa chegar ao 12º caractere — o `12ABC…` não
 * poderia ser digitado, só colado.
 */
const MASCARA_DOCUMENTO = (limpo) => (ehCnpj(limpo) ? MASCARAS.cnpj : MASCARAS.cpf);

/** Se o documento (limpo) já só pode ser CNPJ. */
function ehCnpj(limpo) {
    return limpo.length > 11 || /[A-Za-z]/.test(limpo);
}

/** O valor sem pontuação: só letras e dígitos. */
function semPontuacao(valor) {
    return String(valor ?? '').replace(/[^0-9A-Za-z]/g, '');
}

/** Se o caractere serve naquela posição do padrão. */
function aceita(caractere, marcador) {
    return marcador === '9'
        ? /[0-9]/.test(caractere)
        : /[0-9A-Za-z]/.test(caractere);
}

/**
 * Aplica a máscara, descartando o que não couber.
 *
 * Percorre o padrão e consome o valor: onde há `9` ou `A` entra o
 * próximo caractere válido, e o resto é copiado como está.
 */
export function aplicarMascara(valor, mascara) {
    const limpo = semPontuacao(valor);
    let saida = '';
    let i = 0;

    for (const marcador of mascara) {
        if (i >= limpo.length) {
            break;
        }

        if (marcador === '9' || marcador === 'A') {
            // Pula o que não serve ali: letra onde só cabe dígito.
            while (i < limpo.length && ! aceita(limpo[i], marcador)) {
                i += 1;
            }

            if (i >= limpo.length) {
                break;
            }

            saida += marcador === 'A' ? limpo[i].toUpperCase() : limpo[i];
            i += 1;
        } else {
            saida += marcador;
        }
    }

    return saida;
}

/**
 * O padrão de uma máscara pelo nome, para o valor que o campo tem agora.
 *
 * O nome é o do `data-mascara`: um dos de `MASCARAS`, `telefone`,
 * `documento` ou o próprio padrão (`99/99/9999`).
 */
function padraoDa(nome, valor) {
    // `celular` ainda é aceito; o nome que vale é `telefone`.
    if (nome === 'telefone' || nome === 'celular') {
        return MASCARA_TELEFONE(String(valor ?? '').replace(/\D/g, ''));
    }

    if (nome === 'documento') {
        return MASCARA_DOCUMENTO(semPontuacao(valor));
    }

    return MASCARAS[nome] ?? nome;
}

/** A máscara de um campo, que pode depender do que já foi digitado. */
function mascaraDe(campo) {
    return padraoDa(campo.dataset.mascara, campo.value);
}

/**
 * O valor sem pontuação, como o servidor quer guardá-lo.
 *
 * `mascara` é o nome (`cnpj`, `documento`, `telefone`…) ou o padrão. O
 * valor passa pela máscara antes de perder a pontuação, e por isso sai
 * como o campo o mostra: o CNPJ em maiúsculas, e o que não cabe — letra
 * no CPF, dígito além do último — fora. Sem máscara, só tira a
 * pontuação.
 */
export function valorLimpo(valor, mascara) {
    const padrao = mascara ? padraoDa(mascara, valor) : null;

    return semPontuacao(padrao ? aplicarMascara(valor, padrao) : valor);
}

// --- Validação ---

/** Os pesos do segundo verificador do CNPJ; os do primeiro são estes sem o 6 do começo. */
const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * O CPF: 11 dígitos, não todos iguais, e os dois verificadores do
 * módulo 11 batendo.
 *
 * Recebe o valor limpo (`52998224725`).
 */
export function validarCpf(digitos) {
    const cpf = String(digitos ?? '');

    // 111.111.111-11 passa no cálculo, mas não é CPF de ninguém.
    if (! /^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const verificador = (tamanho) => {
        let soma = 0;

        for (let i = 0; i < tamanho; i += 1) {
            soma += Number(cpf[i]) * (tamanho + 1 - i);
        }

        const resto = (soma * 10) % 11;

        return resto === 10 ? 0 : resto;
    };

    return verificador(9) === Number(cpf[9]) && verificador(10) === Number(cpf[10]);
}

/**
 * O CNPJ, numérico ou alfanumérico (o da Receita a partir de 2026).
 *
 * 14 caracteres: os 12 primeiros letra ou dígito, os 2 últimos dígitos.
 * O verificador é o mesmo módulo 11 de sempre, com cada caractere
 * valendo o seu código ASCII menos 48 — `'0'` a `'9'` continuam valendo
 * 0 a 9, e `'A'` vale 17 … `'Z'` 42. Por isso o CNPJ só de números
 * continua válido pela mesma conta.
 *
 * Recebe o valor limpo (`12ABC34501DE35`); minúscula vale como
 * maiúscula, que é como a máscara a mostra.
 */
export function validarCnpj(valor) {
    const cnpj = String(valor ?? '').toUpperCase();

    if (! /^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) {
        return false;
    }

    const verificador = (tamanho) => {
        const pesos = PESOS_CNPJ.slice(PESOS_CNPJ.length - tamanho);
        let soma = 0;

        for (let i = 0; i < tamanho; i += 1) {
            soma += (cnpj.charCodeAt(i) - 48) * pesos[i];
        }

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    };

    return verificador(12) === Number(cnpj[12]) && verificador(13) === Number(cnpj[13]);
}

/**
 * O telefone: DDD de 11 a 99 e 8 ou 9 dígitos depois dele — e, com 9,
 * o primeiro é o 9 do celular.
 *
 * Recebe o valor limpo (`48999991234`).
 */
export function validarTelefone(digitos) {
    const telefone = String(digitos ?? '');

    if (! /^\d{10,11}$/.test(telefone) || Number(telefone.slice(0, 2)) < 11) {
        return false;
    }

    return telefone.length === 10 || telefone[2] === '9';
}

/** O CEP: 8 dígitos. Recebe o valor limpo (`80000000`). */
export function validarCep(digitos) {
    return /^\d{8}$/.test(String(digitos ?? ''));
}

/**
 * O que dizer de um valor que a máscara não aceita, ou `null`.
 *
 * Vazio nunca é inválido aqui: obrigatório é do `required` e do
 * servidor. O documento é julgado pelo tamanho — CPF até 11, CNPJ com
 * 14 —, e o que não é nem um nem outro (12 ou 13 caracteres, ou letra
 * antes do 14º) é só "Documento inválido.". Máscara sem regra (cartão,
 * validade, padrão próprio) também devolve `null`.
 */
export function mensagemInvalida(nomeDaMascara, valor) {
    const limpo = semPontuacao(valor).toUpperCase();

    if (limpo === '') {
        return null;
    }

    switch (nomeDaMascara) {
        case 'cpf':
            return validarCpf(limpo) ? null : 'CPF inválido.';
        case 'cnpj':
            return validarCnpj(limpo) ? null : 'CNPJ inválido.';
        case 'telefone':
        case 'celular':
            return validarTelefone(limpo) ? null : 'Telefone inválido.';
        case 'cep':
            return validarCep(limpo) ? null : 'CEP inválido.';
        case 'documento':
            if (! ehCnpj(limpo)) {
                return validarCpf(limpo) ? null : 'CPF inválido.';
            }

            if (limpo.length === 14) {
                return validarCnpj(limpo) ? null : 'CNPJ inválido.';
            }

            return 'Documento inválido.';
        default:
            return null;
    }
}

// --- Ligação ---

/**
 * O campo escondido que recebe o valor sem pontuação, se houver.
 *
 * Procurado a cada cópia, e não guardado ao ligar: o campo pode ter sido
 * ligado antes de entrar na página (um modelo clonado).
 */
function destinoDe(campo) {
    const id = campo.dataset.mascaraDestino;

    return id ? campo.ownerDocument.getElementById(id) : null;
}

/**
 * Copia o valor sem pontuação para o campo escondido
 * (`data-mascara-destino`), que é o que tem o `name` e vai no envio.
 *
 * Quem escuta o campo pelo nome escuta o escondido: o `input` chega a
 * ele a cada mudança. Sem borbulhar — o `input` do visível já chegou ao
 * formulário, e um segundo contaria cada tecla duas vezes.
 */
function copiarParaDestino(campo, avisar) {
    const destino = destinoDe(campo);

    if (! destino) {
        return;
    }

    const limpo = valorLimpo(campo.value, campo.dataset.mascara);

    if (destino.value === limpo) {
        return;
    }

    destino.value = limpo;

    if (avisar) {
        destino.dispatchEvent(new Event('input'));
    }
}

/**
 * Valida ao sair do campo (`data-mascara-valida`).
 *
 * O erro é escrito embaixo do campo, como o do servidor, e sai na
 * primeira tecla seguinte. Sem `setCustomValidity`: os formulários são
 * `novalidate` e quem decide é o servidor — aqui é só o aviso antes do
 * envio.
 */
function ligarValidacao(campo) {
    let comErro = false;

    campo.addEventListener('blur', () => {
        const mensagem = mensagemInvalida(campo.dataset.mascara, campo.value);

        if (mensagem) {
            mostrarErroNoCampo(campo, mensagem);
            comErro = true;
        } else if (comErro) {
            // O valor mudou sem tecla (outro código o gravou) e ficou certo.
            limparErroDoCampo(campo);
            comErro = false;
        }
    });

    campo.addEventListener('input', () => {
        if (comErro) {
            limparErroDoCampo(campo);
            comErro = false;
        }
    });
}

function ligarMascaras(raiz = document) {
    raiz.querySelectorAll('[data-mascara]').forEach((campo) => {
        if (campo.dataset.mascaraLigada) {
            return;
        }

        campo.dataset.mascaraLigada = '1';

        // A máscara é lida a cada tecla: a do telefone e a do documento mudam de tamanho.
        // (Valor em reais não é máscara: é o <x-ui.money>, em ui/money.js.)
        const formatar = (avisar) => {
            campo.value = aplicarMascara(campo.value, mascaraDe(campo));
            copiarParaDestino(campo, avisar);
        };

        campo.addEventListener('input', () => formatar(true));

        // O `change` do visível (ao sair, depois de mudar) também é do escondido.
        campo.addEventListener('change', () => destinoDe(campo)?.dispatchEvent(new Event('change')));

        if (campo.dataset.mascaraValida !== undefined) {
            ligarValidacao(campo);
        }

        // O valor que já vem do servidor também passa pela máscara.
        formatar(false);
    });
}

/*
 * Exposta porque há formulários que criam campos mascarados depois da
 * carga — as faixas de CEP dos métodos de entrega nascem de um clique.
 * A função já é idempotente (`data-mascaraLigada`), então chamá-la de
 * novo sobre a página inteira não duplica ouvinte.
 */
if (typeof window !== 'undefined') {
    window.ligarMascaras = ligarMascaras;
}

export { ligarMascaras };
