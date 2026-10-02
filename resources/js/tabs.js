// --- Abas ---

/*
 * A troca de abas, sem ida ao servidor.
 *
 * Qual está aberta vive em três lugares que precisam concordar: o
 * `hidden` de cada painel, o campo escondido que vai junto no
 * formulário, e a URL — para o link da aba poder ser compartilhado e o
 * botão de voltar funcionar.
 */

/**
 * Para que aba a tecla leva, pela posição: a seta anda uma e dá a
 * volta no fim, `Home` vai à primeira e `End` à última.
 *
 * `null` quando a tecla não é de aba — e aí ela segue para o
 * navegador, como sempre.
 */
function indicePelaTecla(tecla, atual, total) {
    if (total < 1) {
        return null;
    }

    switch (tecla) {
        case 'ArrowRight':
            return (atual + 1) % total;
        case 'ArrowLeft':
            return (atual - 1 + total) % total;
        case 'Home':
            return 0;
        case 'End':
            return total - 1;
        default:
            return null;
    }
}

/**
 * Os elementos do grupo, e só dele.
 *
 * `querySelectorAll` desce também nas abas de dentro de um painel: sem
 * o filtro, trocar a aba de fora fecharia os painéis das de dentro.
 */
function doGrupo(grupo, seletor) {
    return [...grupo.querySelectorAll(seletor)].filter((elemento) => elemento.closest('[data-abas]') === grupo);
}

/** As abas que se pode escolher: a escondida (`hidden`) fica de fora. */
function abasVisiveis(grupo) {
    return doGrupo(grupo, '[data-aba]').filter((botao) => ! botao.hidden && ! botao.classList.contains('hidden'));
}

/** Abre a aba `escolhida` do grupo e avisa quem escuta `ui:aba`. */
function ativarAba(grupo, escolhida) {
    const anterior = doGrupo(grupo, '[data-aba][aria-selected="true"]')[0]?.dataset.aba;

    doGrupo(grupo, '[data-aba]').forEach((botao) => {
        botao.setAttribute('aria-selected', String(botao.dataset.aba === escolhida));
    });

    doGrupo(grupo, '[data-painel]').forEach((painel) => {
        painel.hidden = painel.dataset.painel !== escolhida;
    });

    const campo = doGrupo(grupo, '[data-aba-atual]')[0];

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

    /*
     * Para quem precisa fazer algo ao trocar — montar o gráfico que
     * nasceu num painel escondido, buscar o conteúdo da aba. Só quando
     * troca de fato: clicar na aba que já está aberta não avisa.
     */
    if (anterior !== escolhida) {
        document.dispatchEvent(new CustomEvent('ui:aba', { detail: { grupo: grupo.dataset.abas, aba: escolhida } }));
    }
}

function ligarAbas() {
    document.addEventListener('click', (evento) => {
        const gatilho = evento.target.closest('[data-aba]');

        if (! gatilho) {
            return;
        }

        const grupo = gatilho.closest('[data-abas]');

        if (! grupo) {
            return;
        }

        ativarAba(grupo, gatilho.dataset.aba);
    });

    /*
     * O teclado, como nas abas do sistema operacional: as setas andam
     * entre as abas e já abrem a escolhida, `Home` e `End` vão às
     * pontas. O foco acompanha, para a próxima seta partir dali.
     */
    document.addEventListener('keydown', (evento) => {
        // Alt + seta é o voltar do navegador; não é com a aba.
        if (evento.altKey || evento.ctrlKey || evento.metaKey) {
            return;
        }

        const gatilho = evento.target.closest('[data-aba]');
        const grupo = gatilho?.closest('[data-abas]');

        if (! grupo) {
            return;
        }

        const abas = abasVisiveis(grupo);
        const destino = abas[indicePelaTecla(evento.key, abas.indexOf(gatilho), abas.length)];

        if (! destino) {
            return;
        }

        evento.preventDefault();

        ativarAba(grupo, destino.dataset.aba);
        destino.focus();
    });
}

export { ligarAbas, indicePelaTecla };
