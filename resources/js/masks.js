// --- Máscara de campo ---

/**
 * As máscaras conhecidas.
 *
 * `9` aceita só dígito e `A` aceita letra ou dígito — o CNPJ que a
 * Receita passou a emitir em 2026 tem letras nas doze primeiras
 * posições, e só os dois verificadores continuam numéricos. O resto do
 * padrão é literal.
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
    const limpo = (valor || '').replace(/[^0-9A-Za-z]/g, '');
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

/** A máscara de um campo, que pode depender do que já foi digitado. */
function mascaraDe(campo) {
    const nome = campo.dataset.mascara;

    // `celular` ainda é aceito; o nome que vale é `telefone`.
    if (nome === 'telefone' || nome === 'celular') {
        return MASCARA_TELEFONE(campo.value.replace(/\D/g, ''));
    }

    return MASCARAS[nome] ?? nome;
}

function ligarMascaras(raiz = document) {
    raiz.querySelectorAll('[data-mascara]').forEach((campo) => {
        if (campo.dataset.mascaraLigada) {
            return;
        }

        campo.dataset.mascaraLigada = '1';

        // A máscara é lida a cada tecla: a do telefone muda de tamanho.
        // (Valor em reais não é máscara: é o <x-ui.money>, em ui/money.js.)
        const formatar = () => {
            campo.value = aplicarMascara(campo.value, mascaraDe(campo));
        };

        campo.addEventListener('input', formatar);

        // O valor que já vem do servidor também passa pela máscara.
        formatar();
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
