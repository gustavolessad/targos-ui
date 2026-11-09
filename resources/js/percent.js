/*
 * O percentual (<x-ui.percent>).
 *
 * O mesmo desenho do valor em reais (money.js): o `<input type="number">`
 * nativo vai no formulário com 4 casas (`3.2500`), visualmente escondido,
 * e por cima o campo com "%". **Mas se digita como se escreve**, e não
 * como calculadora (1.15.4): "10" é 10%, "10,5" é 10,5%. Em centésimos,
 * quem dava 10% de desconto digitava "10" e dava 0,10% sem perceber
 * (teste no navegador do meu-sistema2, 09/11/2026). O `max` do nativo é
 * o teto da digitação: com 100, o dígito que passaria de 100 não entra.
 */
import { centavosColados, centavosDe, decimalDeCentavos, montarCampoEmCentavos } from './money.js';

/**
 * `'3.2500'` → 325 (centésimos de ponto percentual); vazio ou inválido → null.
 *
 * A conta é a dos centavos: duas casas, a terceira arredonda, sem float.
 */
export function centesimosDe(decimal) {
    return centavosDe(decimal);
}

/** O maior número de dígitos antes da vírgula: as colunas de percentual são decimal(8,4). */
const DIGITOS_INTEIROS = 4;

/**
 * Centésimos → o texto do campo, como se escreve: 1000 → "10", 1050 →
 * "10,5", 325 → "3,25"; null → "". Sem separador de milhar, porque o
 * ponto digitado é vírgula.
 */
export function textoDoPercentual(centesimos, negativo = centesimos < 0) {
    if (centesimos === null || centesimos === undefined) {
        return negativo ? '-' : '';
    }

    const absoluto = Math.abs(Math.trunc(centesimos));
    const decimais = String(absoluto % 100).padStart(2, '0').replace(/0+$/, '');

    return (negativo ? '-' : '') + Math.floor(absoluto / 100) + (decimais === '' ? '' : ',' + decimais);
}

/**
 * O texto do campo depois de uma tecla → `{ centesimos, texto, negativo }`,
 * ou null quando a tecla não vale (a terceira casa, a segunda vírgula).
 *
 * O ponto vale como vírgula; os zeros à esquerda saem; a vírgula sozinha
 * espera as casas ("10," fica, e vale 10). `texto` é o que o campo mostra
 * enquanto se digita. Com `negativo`, o "-" troca o sinal, contado como
 * no lerDigitado do valor em reais; sem ele, sai.
 */
export function lerPercentualDigitado(bruto, { negativo = false } = {}) {
    const texto = String(bruto ?? '');
    const sinal = negativo && (texto.match(/-/g)?.length ?? 0) % 2 === 1;
    const partes = texto.replace(/[^\d.,]/g, '').replace(/\./g, ',').split(',');

    if (partes.length > 2 || (partes[1] ?? '').length > 2) {
        return null;
    }

    const temVirgula = partes.length === 2;
    const decimais = partes[1] ?? '';
    const inteiros = partes[0].replace(/^0+(?=\d)/, '');

    if (inteiros.length > DIGITOS_INTEIROS) {
        return null;
    }

    const prefixo = sinal ? '-' : '';

    if (inteiros === '' && ! temVirgula) {
        return { centesimos: null, texto: prefixo, negativo: sinal };
    }

    const centesimos = Number(inteiros || '0') * 100 + Number(decimais.padEnd(2, '0'));

    return {
        centesimos: sinal && centesimos !== 0 ? -centesimos : centesimos,
        texto: prefixo + (inteiros || '0') + (temVirgula ? ',' + decimais : ''),
        negativo: sinal,
    };
}

/** 325 → `'3.2500'`, o valor do formulário; com inteiros, sem passar por float. null → ''. */
export function decimalDePercentual(centesimos) {
    return decimalDeCentavos(centesimos, 4);
}

/**
 * Um percentual colado → centésimos, sem sinal; sem número → null.
 *
 * Como no valor em reais: "3,25", "3.25" e "3" (que é 3%, não 0,03). A
 * diferença é o valor copiado de uma planilha ou do banco, com 4 casas
 * (`3.2500`): ali o separador seguido de 4 dígitos não pode ser milhar,
 * que tem sempre 3, e o centavosColados o leria como 32.500%.
 */
export function centesimosColados(colado) {
    const texto = String(colado).trim().replace(/\s*%$/, '').replace(/^[-−]/, '');

    if (/^\d+[.,]\d{4,}$/.test(texto)) {
        return centesimosDe(texto.replace(',', '.'));
    }

    return centavosColados(colado);
}

function montar(raiz) {
    if (raiz.dataset.percentualLigado) {
        return;
    }

    raiz.dataset.percentualLigado = '1';

    const nativo = raiz.querySelector('[data-percentual-nativo]');

    // Os limites são os do próprio nativo, que a validação do navegador também lê.
    const minimo = centesimosDe(nativo.getAttribute('min'));
    const maximo = centesimosDe(nativo.getAttribute('max'));

    montarCampoEmCentavos(raiz, {
        caixa: raiz.querySelector('[data-percentual-nativo-caixa]'),
        nativo,
        campo: raiz.querySelector('[data-percentual-campo]'),
        texto: raiz.querySelector('[data-percentual-texto]'),
    }, {
        escala: 4,
        // 0% é um percentual, quando o mínimo o aceita: o "0" digitado é 0%, e não o campo em branco.
        zero: minimo === null || minimo <= 0,
        negativo: minimo === null || minimo < 0,
        teto: maximo,
        // Um mínimo positivo não se barra digitando (para chegar a 10 se passa por 1): fica com o navegador.
        piso: minimo !== null && minimo < 0 ? minimo : null,
        colar: centesimosColados,
        // Como se escreve: o cursor fica onde a pessoa o pôs (ver montarCampoEmCentavos).
        ler: (digitado, { negativo }) => {
            const lido = lerPercentualDigitado(digitado, { negativo });

            return lido === null ? null : { centavos: lido.centesimos, texto: lido.texto, negativo: lido.negativo };
        },
        exibir: textoDoPercentual,
    });
}

export function ligarPercentuais(raiz = document) {
    raiz.querySelectorAll('[data-percentual]').forEach(montar);
}
