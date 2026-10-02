/*
 * O valor em reais (<x-ui.money>) e o único lugar do navegador que sabe
 * formatar reais. No servidor, o par é Targos\Ui\Money.
 *
 * O `<input type="number">` nativo continua sendo o campo do formulário
 * (`1500.00`); aqui ele fica visualmente escondido (sr-only, para a
 * validação do navegador ainda apontar para ele) e o usuário digita no
 * campo com "R$", como numa calculadora: o que se digita são centavos,
 * e a vírgula anda sozinha — 19990 vira "199,90".
 *
 * O percentual (<x-ui.percent>, percent.js) se digita do mesmo jeito,
 * em centésimos: por isso a montagem do campo é uma só, aqui
 * (`montarCampoEmCentavos`), e cada um entra com as suas regras.
 */

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Centavos (inteiro) → "1.500,00", sem o símbolo e sem o sinal. */
export function formatarCentavos(centavos) {
    const texto = String(Math.abs(Math.trunc(centavos))).padStart(3, '0');

    return texto.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + texto.slice(-2);
}

/**
 * Centavos → o texto do campo visível, com o sinal: -150000 → "-1.500,00"; null → "".
 *
 * O sinal vem à parte (`negativo`) para o "-" que se digita antes do
 * número: o campo mostra "-" sozinho, ou "-0,00", esperando os dígitos,
 * quando o valor ainda não tem sinal nenhum.
 */
export function textoDeCentavos(centavos, negativo = centavos < 0) {
    return (negativo ? '-' : '') + (centavos === null || centavos === undefined ? '' : formatarCentavos(centavos));
}

/** Valor em reais (número ou `"1500.00"`) → "R$ 1.500,00". */
export function reais(valor) {
    return REAIS.format(Number(valor) || 0);
}

/**
 * O valor do formulário → centavos: `"1500.00"` → 150000; vazio ou inválido → null.
 *
 * Pelos dígitos, sem passar por float: `3.955 * 100` dá 395,4999… e
 * arredondaria para baixo. A terceira casa arredonda para longe do zero,
 * como o `number_format` do PHP (`"3.9550"` → 396), e o resto das casas
 * de um custo (`"3.9505"`) não conta: a tela mostra centavos.
 */
export function centavosDe(decimal) {
    const texto = String(decimal ?? '').trim();
    const partes = /^([-+]?)(\d*)(?:\.(\d*))?$/.exec(texto);

    if (! partes || (partes[2] === '' && ! partes[3])) {
        // O que não é um decimal simples (`1e3`, de outro script) ainda passa pelo Number.
        const numero = texto === '' ? Number.NaN : Number(texto);

        return Number.isFinite(numero) ? Math.round(numero * 100) : null;
    }

    const [, sinal, inteiros, decimais = ''] = partes;
    const centavos = Number((inteiros || '0') + decimais.padEnd(2, '0').slice(0, 2)) + (decimais[2] >= '5' ? 1 : 0);

    return sinal === '-' && centavos !== 0 ? -centavos : centavos;
}

/**
 * Centavos → o valor do formulário com `escala` casas: 395 → `"3.95"`,
 * ou `"3.9500"` com 4; null → "".
 *
 * Com inteiros, como o centavosDe: o que se digita é sempre centavos, e
 * as casas a mais do custo entram como zeros.
 */
export function decimalDeCentavos(centavos, escala = 2) {
    if (centavos === null || centavos === undefined) {
        return '';
    }

    const texto = String(Math.abs(Math.trunc(centavos))).padStart(3, '0');

    return (centavos < 0 ? '-' : '') + texto.slice(0, -2) + '.' + texto.slice(-2) + '0'.repeat(Math.max(0, escala - 2));
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

/**
 * O texto do campo visível depois de uma tecla → `{ centavos, negativo }`.
 *
 * Os dígitos são centavos, como numa calculadora; o resto é a
 * formatação que o próprio campo pôs, e sai. `centavos` é null quando
 * não há número: campo vazio, ou só o "-" esperando os dígitos.
 *
 * - `zero`: o "0" digitado vale 0,00, em vez de esvaziar o campo.
 *   Apagando (`apagando`), chegar a zero ainda esvazia — senão o
 *   Backspace num "0,00" o redesenharia para sempre.
 * - `negativo`: o "-" troca o sinal. Conta-se quantos há: o campo só
 *   mostra um, no começo, então um a mais (digitado em qualquer ponto)
 *   inverte o sinal, e apagar o que está lá volta ao positivo.
 */
export function lerDigitado(texto, { zero = false, negativo = false, apagando = false } = {}) {
    const bruto = String(texto ?? '');
    const sinal = negativo && (bruto.match(/-/g)?.length ?? 0) % 2 === 1;
    const digitos = bruto.replace(/\D/g, '');
    const valor = Number(digitos.replace(/^0+/, '').slice(0, MAXIMO_DE_DIGITOS) || 0);

    if (digitos === '' || (valor === 0 && (! zero || apagando))) {
        return { centavos: null, negativo: sinal };
    }

    return { centavos: sinal && valor !== 0 ? -valor : valor, negativo: sinal };
}

/**
 * Liga um campo que se digita em centavos: o nativo escondido, que vai
 * no formulário, e o visível por cima, que se digita como calculadora.
 *
 * É o miolo do valor em reais e do percentual (percent.js), que só
 * diferem nas `regras`:
 *
 * - `escala`: as casas do valor gravado no nativo (2, ou 4 no custo e no
 *   percentual). A tela mostra sempre 2.
 * - `zero`, `negativo`: ver lerDigitado.
 * - `teto`, `piso`: os limites, em centavos; a tecla que passaria deles
 *   não entra. Só o que se pode barrar durante a digitação: um mínimo
 *   positivo não (para chegar a 10,00 se passa por 0,10), e fica com o
 *   `min` do nativo, na validação do navegador.
 * - `colar`: o texto colado → centavos, sem sinal; null o recusa.
 *
 * **O nativo só muda quando a pessoa digita.** Montar o campo não o
 * regrava: o custo `3.9505` que veio do banco volta a ele como está, e
 * não como os `3,95` que a tela mostra.
 */
export function montarCampoEmCentavos(raiz, { caixa, nativo, campo, texto }, regras = {}) {
    const { escala = 2, zero = false, negativo = false, teto = null, piso = null, colar = centavosColados } = regras;

    caixa.classList.add('sr-only');
    nativo.tabIndex = -1;
    nativo.setAttribute('aria-hidden', 'true');
    campo.hidden = false;

    // O `id` do nativo pode vir de fora (prop `id`), com qualquer caractere: daí o escape.
    texto.id ||= `${nativo.id}-texto`;
    raiz.querySelector(`label[for="${CSS.escape(nativo.id)}"]`)?.setAttribute('for', texto.id);

    /*
     * O `autofocus` vem no nativo, que é o que aparece sem JS. Escondido
     * ele, quem recebe o foco é o campo visível — inclusive o do modal,
     * que procura `[autofocus]` ao abrir e acharia o nativo primeiro.
     */
    if (nativo.autofocus) {
        nativo.autofocus = false;
        texto.autofocus = true;

        if (document.activeElement === nativo) {
            texto.focus();
        }
    }

    // O que está à vista, em centavos: é com ele que se compara o nativo mudado por outro script.
    let mostrado = lerDigitado(texto.value, { zero: true, negativo: true }).centavos;
    // O texto da última tecla aceita, para onde o campo volta quando a seguinte passa do limite.
    let anterior = texto.value;

    const mostrar = (centavos, comSinal = centavos < 0) => {
        texto.value = textoDeCentavos(centavos, comSinal);
        mostrado = centavos;
        anterior = texto.value;
    };

    const cabe = (centavos) => centavos === null
        || ((teto === null || centavos <= teto) && (piso === null || centavos >= piso));

    const gravar = (centavos, comSinal) => {
        mostrar(centavos, comSinal);
        nativo.value = decimalDeCentavos(centavos, escala);

        // Quem escuta o campo (a prévia das parcelas) escuta o nativo.
        nativo.dispatchEvent(new Event('input', { bubbles: true }));
        nativo.dispatchEvent(new Event('change', { bubbles: true }));
    };

    texto.addEventListener('input', (evento) => {
        const lido = lerDigitado(texto.value, {
            zero,
            negativo,
            apagando: evento.inputType?.startsWith('delete') ?? false,
        });

        // Além do limite, a tecla não entra: o campo volta ao que era.
        if (! cabe(lido.centavos)) {
            texto.value = anterior;

            return;
        }

        gravar(lido.centavos, lido.negativo);
    });

    // O valor colado substitui o do campo, lido como valor inteiro (ver centavosColados).
    texto.addEventListener('paste', (evento) => {
        evento.preventDefault();

        // Só leitura, o navegador ainda entrega o colar: gravar aqui escreveria por fora da trava.
        if (texto.readOnly || texto.disabled) {
            return;
        }

        const colado = evento.clipboardData?.getData('text') ?? '';
        let centavos = colar(colado);

        // Sem número no que foi colado (ou acima do teto), o campo fica como estava.
        if (centavos === null) {
            return;
        }

        if (negativo && /[-−]/.test(colado)) {
            centavos = -centavos;
        }

        if (centavos === 0 && ! zero) {
            centavos = null;
        }

        if (cabe(centavos)) {
            gravar(centavos, centavos < 0);
        }
    });

    // Outro código pode gravar no nativo e disparar `change` (o modal de
    // pagamento preenche o valor): o campo visível acompanha.
    nativo.addEventListener('change', () => {
        let centavos = centavosDe(nativo.value);

        if (centavos === 0 && ! zero) {
            centavos = null;
        }

        if (centavos !== mostrado) {
            mostrar(centavos);
        }
    });
}

function montar(raiz) {
    if (raiz.dataset.dinheiroLigado) {
        return;
    }

    raiz.dataset.dinheiroLigado = '1';

    // As decisões do Blade (escala, zero, negativo) vêm no envelope.
    montarCampoEmCentavos(raiz, {
        caixa: raiz.querySelector('[data-dinheiro-nativo-caixa]'),
        nativo: raiz.querySelector('[data-dinheiro-nativo]'),
        campo: raiz.querySelector('[data-dinheiro-campo]'),
        texto: raiz.querySelector('[data-dinheiro-texto]'),
    }, {
        escala: Number(raiz.dataset.dinheiroEscala) || 2,
        zero: raiz.dataset.dinheiroZero !== undefined,
        negativo: raiz.dataset.dinheiroNegativo !== undefined,
    });
}

export function ligarDinheiro(raiz = document) {
    raiz.querySelectorAll('[data-dinheiro]').forEach(montar);
}
