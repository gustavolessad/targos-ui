/*
 * O percentual (<x-ui.percent>).
 *
 * O mesmo desenho do valor em reais (money.js): o `<input type="number">`
 * nativo vai no formulário com 4 casas (`3.2500`), visualmente escondido,
 * e por cima o campo com "%" se digita como calculadora, em centésimos —
 * "325" é 3,25%. O `max` do nativo é o teto da digitação: com 100, o
 * dígito que passaria de 100,00 não entra.
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
        // 0% é um percentual, quando o mínimo o aceita: o "0" digitado é 0,00, e não o campo em branco.
        zero: minimo === null || minimo <= 0,
        negativo: minimo === null || minimo < 0,
        teto: maximo,
        // Um mínimo positivo não se barra digitando (para chegar a 10,00 se passa por 0,10): fica com o navegador.
        piso: minimo !== null && minimo < 0 ? minimo : null,
        colar: centesimosColados,
    });
}

export function ligarPercentuais(raiz = document) {
    raiz.querySelectorAll('[data-percentual]').forEach(montar);
}
