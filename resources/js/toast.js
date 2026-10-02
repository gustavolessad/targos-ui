// --- Toast ---

/** Quanto o CSS leva para entrar e sair; o mesmo valor do `duration-300`. */
const ANIMACAO_TOAST = 300;

/**
 * Mostra uma mensagem no centro inferior da tela.
 *
 * Exposta em `window` para qualquer tela chamar sem importar nada. O
 * que vem do servidor já sai renderizado pelo `<x-ui.toast>`; esta
 * função serve ao que acontece sem recarregar a página.
 */
function mostrarToast(tipo, texto, segundos = 5) {
    const pilha = document.getElementById('toasts');

    if (! pilha) {
        return;
    }

    /*
     * Três tons: verde para o que deu certo, âmbar para o que pede
     * atenção sem impedir, vermelho para o que falhou.
     *
     * Sem o âmbar, um aviso de "a caixa passou do previsto" saía
     * vermelho e parecia erro — e a pessoa desfazia uma escolha que
     * era dela.
     */
    const cores = {
        sucesso: 'bg-success-600 text-white ring-success-700',
        // Texto escuro: branco sobre o âmbar não se lê.
        aviso: 'bg-warning-400 text-neutral-950 ring-warning-500',
    }[tipo] ?? 'bg-danger-600 text-white ring-danger-700';

    const toast = document.createElement('div');
    toast.dataset.toast = tipo;
    /*
     * As mesmas classes do <x-ui.toast>, inclusive as da animação: o
     * Tailwind varre este arquivo, então elas são geradas igual.
     */
    toast.className = `pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl
        px-4 py-3 text-sm shadow-lg ring-1 translate-y-3 opacity-0 transition duration-300 ease-out
        [&[data-visivel]]:translate-y-0 [&[data-visivel]]:opacity-100 ${cores}`;

    const mensagem = document.createElement('span');
    mensagem.className = 'flex-1';
    mensagem.textContent = texto;

    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.dataset.fechaToast = '';
    fechar.setAttribute('aria-label', 'Fechar');
    fechar.className = 'shrink-0 cursor-pointer opacity-70 transition hover:opacity-100';
    fechar.textContent = '×';

    toast.append(mensagem, fechar);
    pilha.append(toast);

    entrar(toast);
    agendarSaida(toast, segundos);
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
        // Os que vieram do servidor entram animados; o de sucesso some sozinho, o de erro fica até o X.
        entrar(toast);

        if (! ('toastFica' in toast.dataset)) {
            agendarSaida(toast);
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
