// --- Menu lateral ---

/*
 * O grupo do menu (<x-ui.nav-group>) é um `<details>`: abrir e fechar é
 * do navegador. Os itens entram com uma animação curta, de CSS
 * (`animate-descer`).
 *
 * O grupo da tela atual já nasce aberto, e ali a animação não cabe:
 * rodaria a cada página carregada. Ele vem marcado com `data-inicial`,
 * que segura a animação; no primeiro abre-e-fecha da pessoa a marca sai,
 * e dali em diante ele anima como os outros.
 */
export function ligarMenuLateral() {
    // `toggle` não sobe pelo DOM: só a captura o pega no documento.
    document.addEventListener('toggle', (evento) => {
        if (evento.target instanceof HTMLDetailsElement && 'inicial' in evento.target.dataset) {
            // A abertura que o próprio HTML traz também dispara o evento: só o fechar tira a marca.
            if (! evento.target.open) {
                delete evento.target.dataset.inicial;
            }
        }
    }, true);
}
