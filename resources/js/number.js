/*
 * O número inteiro (<x-ui.number>): quantidade, parcelas, dias.
 *
 * O campo é de texto (`inputmode="numeric"`), e não `type="number"` —
 * por quê, no Blade. Aqui ele aceita só dígitos, e o "-" no começo
 * quando o mínimo deixa; ao sair, volta para dentro de `min`/`max`; e o
 * − e o + ao lado (ou as setas do teclado) somam o `step`.
 */

/** O número do campo: `" 12 "` → 12; vazio, só "-" ou inválido → null. */
function numeroDe(valor) {
    const texto = typeof valor === 'number' ? valor : String(valor ?? '').trim();
    const numero = texto === '' ? Number.NaN : Number(texto);

    // `|| 0`: o -0 de `Math.trunc(-0.5)` é zero.
    return Number.isFinite(numero) ? Math.trunc(numero) || 0 : null;
}

/**
 * O valor dentro dos limites: `ajustar('150', { max: 100 })` → 100;
 * vazio → null.
 *
 * O vazio não vira `min` aqui: quem decide se o campo pode ficar em
 * branco é quem chama (o blur do campo o preenche; quem só confere um
 * valor não quer um número inventado).
 */
export function ajustar(valor, { min = null, max = null } = {}) {
    const numero = numeroDe(valor);

    if (numero === null) {
        return null;
    }

    if (max !== null && numero > max) {
        return max;
    }

    return min !== null && numero < min ? min : numero;
}

/**
 * Um clique no − (`sentido` -1) ou no + (1): o valor mais ou menos o
 * `step`, dentro dos limites.
 *
 * Vazio, a conta parte do `min` (ou do zero, sem ele) — o mesmo número
 * que o campo ganharia ao perder o foco.
 *
 * No campo que pode ficar em branco (`anulavel`), o vazio não é um
 * número de onde se desce: o − num campo vazio dá a partida (o `min`,
 * ou zero) e não vai abaixo dela. "Não contado" menos um não é −1.
 */
export function somarPasso(valor, sentido, { min = null, max = null, step = 1, anulavel = false } = {}) {
    const numero = numeroDe(valor);
    const partida = min ?? 0;

    if (numero === null && anulavel && sentido < 0) {
        return ajustar(partida, { min, max });
    }

    return ajustar((numero ?? partida) + sentido * step, { min, max });
}

/** O que fica do que se digitou: só dígitos, e um "-" no começo quando `negativo`. */
export function limparDigitado(texto, negativo = true) {
    const bruto = String(texto ?? '');

    return (negativo && bruto.trimStart().startsWith('-') ? '-' : '') + bruto.replace(/\D/g, '');
}

/** `data-min="10"` → 10; ausente ou inválido → null. */
function limite(texto) {
    if (texto === undefined || texto.trim() === '') {
        return null;
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : null;
}

function avisar(campo) {
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
}

function montar(campo) {
    if (campo.dataset.numeroLigado) {
        return;
    }

    campo.dataset.numeroLigado = '1';

    const min = limite(campo.dataset.min);
    const max = limite(campo.dataset.max);
    const step = Math.abs(limite(campo.dataset.step) ?? 1) || 1;
    const negativo = min === null || min < 0;

    /*
     * `data-nullable`: o vazio é um estado, e não um número por escrever
     * — na contagem de estoque, "em branco" é "não contado", e 0 é
     * "contei zero". Ao sair, o vazio fica vazio; os limites valem só
     * para o que foi digitado.
     */
    const anulavel = campo.dataset.nullable !== undefined;

    // Desligado ou só leitura, nada aqui escreve no campo. Lido na hora: outro script pode desligá-lo depois.
    const travado = () => campo.disabled || campo.readOnly;

    // Só avisa quem escuta quando o valor muda de fato: o + no máximo não é mudança.
    const gravar = (numero) => {
        const texto = numero === null ? '' : String(numero);

        if (texto !== campo.value) {
            campo.value = texto;
            avisar(campo);
        }
    };

    const somar = (sentido) => {
        if (! travado()) {
            gravar(somarPasso(campo.value, sentido, { min, max, step, anulavel }));
        }
    };

    campo.addEventListener('input', () => {
        const limpo = limparDigitado(campo.value, negativo);

        if (limpo === campo.value) {
            return;
        }

        // O cursor fica onde estava, descontado o que saiu antes dele.
        const cursor = limparDigitado(campo.value.slice(0, campo.selectionStart ?? campo.value.length), negativo).length;

        campo.value = limpo;
        campo.setSelectionRange(cursor, cursor);
    });

    // Ao sair, o valor volta para dentro dos limites, e o vazio vira o mínimo (se houver) — ou fica vazio, no anulável.
    campo.addEventListener('blur', () => {
        if (! travado()) {
            gravar(ajustar(campo.value, { min, max }) ?? (anulavel ? null : min));
        }
    });

    // Os botões estão fora do Tab: no teclado, as setas fazem o papel deles, como no `type="number"`.
    campo.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
            evento.preventDefault();
            somar(evento.key === 'ArrowUp' ? 1 : -1);
        }
    });

    // No tamanho `cell` não há envelope, nem botões.
    const botoes = [...(campo.closest('[data-numero]')?.querySelectorAll('[data-numero-menos], [data-numero-mais]') ?? [])];

    botoes.forEach((botao) => {
        /*
         * O foco fica no campo. Indo para o botão, o blur ajustaria o
         * valor no meio da conta, e quem estava digitando teria de
         * voltar ao campo para continuar.
         */
        botao.addEventListener('mousedown', (evento) => evento.preventDefault());
        botao.addEventListener('click', () => somar(botao.dataset.numeroMais !== undefined ? 1 : -1));
    });

    /*
     * Os botões acompanham a trava do campo, também quando outro script
     * a liga ou desliga depois (o número de parcelas que só vale no
     * lançamento parcelado).
     */
    if (botoes.length > 0) {
        const espelharTrava = () => botoes.forEach((botao) => {
            botao.disabled = travado();
        });

        espelharTrava();
        new MutationObserver(espelharTrava).observe(campo, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
    }
}

export function ligarNumeros(raiz = document) {
    raiz.querySelectorAll('[data-numero-campo]').forEach(montar);
}
