// --- Tema ---

/*
 * Claro ou escuro, por classe no <html>.
 *
 * A escolha vive em `localStorage`, não numa sessão: é preferência do
 * aparelho, e quem usa o painel no computador e no celular pode querer
 * uma em cada.
 *
 * A aplicação da classe acontece antes deste arquivo, num script inline
 * no <head> — aqui o tema já está posto, e só se liga o botão que o
 * troca. Esperar o DOMContentLoaded faria a tela piscar clara antes de
 * escurecer.
 */
const CHAVE_TEMA = 'tema';

function temaAtual() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function aplicarTema(tema) {
    document.documentElement.classList.toggle('dark', tema === 'dark');

    try {
        localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
        // Janela anônima, ou armazenamento bloqueado: o tema vale só nesta visita.
    }
}

function ligarTema() {
    document.addEventListener('click', (evento) => {
        if (evento.target.closest('[data-troca-tema]')) {
            aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark');
        }
    });
}

export { ligarTema };
