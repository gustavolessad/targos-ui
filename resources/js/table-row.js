// --- Linha de tabela clicável ---

/*
 * A linha inteira leva ao registro, quando a tela declara `href`.
 *
 * Uma `<tr>` não pode ser `<a>` — o HTML não permite —, então o clique
 * passa por aqui. O link do identificador continua na primeira célula:
 * é ele que dá o clique do meio, o "abrir em nova aba" e o caminho de
 * quem usa teclado, que a linha clicável não oferece.
 *
 * **O que já tem destino próprio vence.** Um link, um botão ou um campo
 * dentro da linha faz o seu trabalho; sem esta checagem, clicar no
 * "Excluir" abriria o registro em vez de perguntar.
 */
function ligarLinhasClicaveis() {
    document.addEventListener('click', (evento) => {
        const linha = evento.target.closest('[data-linha-url]');

        if (! linha) {
            return;
        }

        // Um controle próprio dentro da linha: ele é quem responde.
        if (evento.target.closest('a, button, input, select, textarea, label, [data-menu]')) {
            return;
        }

        /*
         * Quem está selecionando texto não quer navegar: arrastar por
         * cima de um valor para copiá-lo terminaria noutra tela.
         */
        if ((window.getSelection()?.toString() ?? '') !== '') {
            return;
        }

        /*
         * Ctrl/Cmd e o clique do meio abrem noutra aba, como num link
         * de verdade.
         */
        if (evento.ctrlKey || evento.metaKey) {
            window.open(linha.dataset.linhaUrl, '_blank', 'noopener');

            return;
        }

        window.location.href = linha.dataset.linhaUrl;
    });

    /*
     * O clique do meio não dispara `click`: é `auxclick`, e sem ele a
     * roda do mouse na linha não abriria nada.
     */
    document.addEventListener('auxclick', (evento) => {
        if (evento.button !== 1) {
            return;
        }

        const linha = evento.target.closest('[data-linha-url]');

        if (! linha || evento.target.closest('a, button, input, select, textarea, label, [data-menu]')) {
            return;
        }

        evento.preventDefault();

        window.open(linha.dataset.linhaUrl, '_blank', 'noopener');
    });
}

export { ligarLinhasClicaveis };
