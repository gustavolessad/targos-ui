// --- Abas ---

/*
 * A troca de abas, sem ida ao servidor.
 *
 * Qual está aberta vive em três lugares que precisam concordar: o
 * `hidden` de cada painel, o campo escondido que vai junto no
 * formulário, e a URL — para o link da aba poder ser compartilhado e o
 * botão de voltar funcionar.
 */
function ligarAbas() {
    document.addEventListener('click', (evento) => {
        const gatilho = evento.target.closest('[data-aba]');

        if (! gatilho) {
            return;
        }

        const grupo = gatilho.closest('[data-abas]');
        const escolhida = gatilho.dataset.aba;

        if (! grupo) {
            return;
        }

        grupo.querySelectorAll('[data-aba]').forEach((botao) => {
            botao.setAttribute('aria-selected', String(botao.dataset.aba === escolhida));
        });

        grupo.querySelectorAll('[data-painel]').forEach((painel) => {
            painel.hidden = painel.dataset.painel !== escolhida;
        });

        const campo = grupo.querySelector('[data-aba-atual]');

        if (campo) {
            campo.value = escolhida;
        }

        /*
         * `replaceState` e não `pushState`: trocar de aba não é navegar,
         * e encher o histórico faria o botão de voltar percorrer as
         * abas em vez de sair da tela.
         */
        const url = new URL(window.location.href);
        url.searchParams.set(grupo.dataset.abas, escolhida);
        window.history.replaceState({}, '', url);
    });
}

export { ligarAbas };
