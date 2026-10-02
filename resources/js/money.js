/*
 * O valor em reais (<x-ui.money>) e o único lugar do navegador que sabe
 * formatar reais. No servidor, o par é Targos\Ui\Money.
 *
 * O `<input type="number">` nativo continua sendo o campo do formulário
 * (`1500.00`); aqui ele fica visualmente escondido (sr-only, para a
 * validação do navegador ainda apontar para ele) e o usuário digita no
 * campo com "R$", como numa calculadora: o que se digita são centavos,
 * e a vírgula anda sozinha — 19990 vira "199,90".
 */

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Centavos (inteiro) → "1.500,00", sem o símbolo. */
export function formatarCentavos(centavos) {
    const texto = String(Math.abs(Math.trunc(centavos))).padStart(3, '0');

    return texto.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + texto.slice(-2);
}

/** Valor em reais (número ou `"1500.00"`) → "R$ 1.500,00". */
export function reais(valor) {
    return REAIS.format(Number(valor) || 0);
}

/** `"1500.00"` → 150000; vazio ou inválido → null. */
function centavosDe(decimal) {
    const numero = Number.parseFloat(decimal);

    return Number.isFinite(numero) ? Math.round(numero * 100) : null;
}

/** 10 dígitos: as colunas são decimal(10,2), até 99.999.999,99. */
const MAXIMO_DE_DIGITOS = 10;

/**
 * Um valor colado → centavos; sem número, ou acima do teto, → null.
 *
 * Colar não é digitar: digitando, "1500" são R$ 15,00 (a vírgula anda
 * sozinha); colado, é o valor como a pessoa o copiou — R$ 1.500,00. O
 * último ponto ou vírgula só é decimal se vier seguido de 1 ou 2 dígitos;
 * com 3, é separador de milhar ("1.500").
 */
export function centavosColados(colado) {
    const texto = String(colado).replace(/[^\d.,]/g, '');
    const separador = Math.max(texto.lastIndexOf(','), texto.lastIndexOf('.'));
    const decimais = separador === -1 ? '' : texto.slice(separador + 1);
    const temDecimais = decimais.length === 1 || decimais.length === 2;

    const inteiros = (temDecimais ? texto.slice(0, separador) : texto).replace(/\D/g, '');
    const digitos = (inteiros + (temDecimais ? decimais.padEnd(2, '0') : '00')).replace(/^0+/, '');

    if (inteiros === '' && ! temDecimais) {
        return null;
    }

    return digitos.length > MAXIMO_DE_DIGITOS ? null : Number(digitos || 0);
}

function montar(raiz) {
    if (raiz.dataset.dinheiroLigado) {
        return;
    }

    raiz.dataset.dinheiroLigado = '1';

    const nativo = raiz.querySelector('[data-dinheiro-nativo]');
    const campo = raiz.querySelector('[data-dinheiro-campo]');
    const texto = raiz.querySelector('[data-dinheiro-texto]');

    raiz.querySelector('[data-dinheiro-nativo-caixa]').classList.add('sr-only');
    nativo.tabIndex = -1;
    nativo.setAttribute('aria-hidden', 'true');
    campo.hidden = false;

    texto.id = `${nativo.id}-texto`;
    raiz.querySelector(`label[for="${nativo.id}"]`)?.setAttribute('for', texto.id);

    const mostrar = (centavos) => {
        texto.value = centavos ? formatarCentavos(centavos) : '';
    };

    const gravar = (centavos) => {
        mostrar(centavos);
        nativo.value = centavos ? (centavos / 100).toFixed(2) : '';

        // Quem escuta o campo (a prévia das parcelas) escuta o nativo.
        nativo.dispatchEvent(new Event('input', { bubbles: true }));
        nativo.dispatchEvent(new Event('change', { bubbles: true }));
    };

    texto.addEventListener('input', () => {
        const digitos = texto.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAXIMO_DE_DIGITOS);

        gravar(digitos === '' ? null : Number(digitos));
    });

    // O valor colado substitui o do campo, lido como valor inteiro (ver centavosColados).
    texto.addEventListener('paste', (evento) => {
        const centavos = centavosColados(evento.clipboardData?.getData('text') ?? '');

        evento.preventDefault();

        // Sem número no que foi colado (ou acima do teto), o campo fica como estava.
        if (centavos !== null) {
            gravar(centavos);
        }
    });

    // Outro código pode gravar no nativo e disparar `change` (o modal de
    // pagamento preenche o valor): o campo visível acompanha.
    nativo.addEventListener('change', () => {
        const centavos = centavosDe(nativo.value);
        const atual = texto.value.replace(/\D/g, '');

        if (String(centavos ?? '') !== atual.replace(/^0+/, '')) {
            mostrar(centavos);
        }
    });
}

export function ligarDinheiro(raiz = document) {
    raiz.querySelectorAll('[data-dinheiro]').forEach(montar);
}
