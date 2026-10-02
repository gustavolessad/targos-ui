// --- Toast ---

/** Quanto o CSS leva para entrar e sair; o mesmo valor do `duration-300`. */
const ANIMACAO_TOAST = 300;

/**
 * Mostra uma mensagem no centro inferior da tela.
 *
 * Exposta em `window` para qualquer tela chamar sem importar nada. O
 * que vem do servidor já sai renderizado pelo `<x-ui.toast>`; esta
 * função serve ao que acontece sem recarregar a página.
 *
 * Some em `segundos` (5, sem dizer nada); com `null`, fica até o X —
 * como o erro e o aviso que vêm do servidor.
 */
function mostrarToast(tipo, texto, segundos = 5) {
    const pilha = document.getElementById('toasts');

    if (! pilha) {
        return;
    }

    const modelo = pilha.querySelector('template[data-modelo-toast]');

    if (! modelo) {
        return;
    }

    /*
     * Quatro tons, sem borda: verde para o que deu certo, azul para o que
     * a pessoa só precisa saber, âmbar para o que pede atenção sem
     * impedir, vermelho para o que falhou. As mesmas do <x-ui.toast>; o
     * Tailwind varre este arquivo, então são geradas.
     *
     * Sem o âmbar, um aviso de "a caixa passou do previsto" saía
     * vermelho e parecia erro — e a pessoa desfazia uma escolha que
     * era dela.
     */
    const cores = {
        sucesso: ['bg-success-600', 'text-white'],
        info: ['bg-info-600', 'text-white'],
        // Texto escuro: branco sobre o âmbar não se lê.
        aviso: ['bg-warning-400', 'text-neutral-950'],
    }[tipo] ?? ['bg-danger-600', 'text-white'];

    /*
     * O corpo vem do modelo que o <x-ui.toast> desenha (o mesmo botão de
     * fechar, as mesmas classes de animação): o toast daqui e o do
     * servidor saem do mesmo HTML.
     */
    const toast = modelo.content.firstElementChild.cloneNode(true);
    toast.dataset.toast = tipo;
    toast.classList.add(...cores);
    toast.querySelector('[data-texto-toast]').textContent = texto;

    pilha.append(toast);

    entrar(toast);

    if (segundos > 0) {
        agendarSaida(toast, segundos);
    } else {
        toast.dataset.toastFica = '';
    }
}

/**
 * A entrada: sobe e aparece, como a caixa do modal.
 *
 * O mesmo desenho de lá — o CSS faz a animação, aqui só se marca
 * `data-visivel` no quadro seguinte. Marcar neste faria o navegador
 * pintar já no estado final, sem transição nenhuma.
 */
function entrar(toast) {
    requestAnimationFrame(() => {
        toast.dataset.visivel = '';
    });
}

/** Desce e some, e só então sai do DOM. */
function sair(toast) {
    if (! toast) {
        return;
    }

    delete toast.dataset.visivel;

    setTimeout(() => toast.remove(), ANIMACAO_TOAST);
}

/** Some sozinho depois do tempo combinado. */
function agendarSaida(toast, segundos = 5) {
    setTimeout(() => sair(toast), segundos * 1000);
}

function ligarToasts() {
    document.querySelectorAll('#toasts [data-toast]').forEach((toast) => {
        /*
         * Os que vieram do servidor entram animados e saem no tempo que
         * o <x-ui.toast> escreveu em `data-toast-segundos` (o de
         * `config('ui.toast_seconds')`); com `data-toast-fica`, só pelo X.
         */
        entrar(toast);

        if (! ('toastFica' in toast.dataset)) {
            agendarSaida(toast, Number(toast.dataset.toastSegundos) || 5);
        }
    });

    document.addEventListener('click', (evento) => {
        const fechar = evento.target.closest('[data-fecha-toast]');

        if (fechar) {
            // Pelo X também sai animado, em vez de piscar fora da tela.
            sair(fechar.closest('[data-toast]'));
        }
    });
}

window.mostrarToast = mostrarToast;

export { ligarToasts };
