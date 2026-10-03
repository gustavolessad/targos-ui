// --- Camadas: modal e offcanvas ---

/*
 * Modal e gaveta são a mesma coisa por dentro: uma caixa por cima da
 * página, com fundo escuro, que abre e fecha. O que muda é de onde ela
 * entra e o CSS que a anima — então o mecanismo é um só, parametrizado
 * pelo nome.
 *
 * O `<dialog>` nativo daria isso de graça, mas o `::backdrop` não aceita
 * as classes do Tailwind — então o fundo é uma div nossa, e o estado é
 * uma classe `hidden`.
 */
const CAMADAS = {
    // O `duration-200` do <x-ui.modal>.
    modal: 200,
    // O `duration-300` do <x-ui.offcanvas>: percorre mais caminho.
    offcanvas: 300,
};

/*
 * Os motivos de abrir e fechar, como vão no `detail` dos eventos
 * `ui:camada-aberta` e `ui:camada-fechada`: `botao` (um
 * `data-abre-*`/`data-fecha-*`, o X inclusive), `fundo` (o clique
 * fora da caixa), `esc` (a tecla) e `script` (`abrirCamada`,
 * `window.fecharModal`, o `:open` ao carregar).
 */
const MOTIVOS = ['botao', 'fundo', 'esc', 'script'];

/**
 * Avisa no próprio elemento da camada, subindo pelo DOM: quem precisa
 * reagir ao fechar do diálogo do documento ("fechou = próxima venda")
 * escuta a camada, ou um ancestral, sem depender do id dela.
 */
function avisarCamada(camada, evento, tipo, motivo) {
    camada.dispatchEvent(new CustomEvent(`ui:camada-${evento}`, {
        bubbles: true,
        detail: { tipo, id: camada.id, motivo: MOTIVOS.includes(motivo) ? motivo : 'script' },
    }));
}

/**
 * Se a camada só fecha pelos botões: nem o fundo nem o Esc
 * (`<x-ui.modal static>`, `data-modal-estatico`; na gaveta,
 * `data-offcanvas-estatico`).
 */
function estatica(camada) {
    return camada?.matches?.('[data-modal-estatico], [data-offcanvas-estatico]') ?? false;
}

/**
 * As camadas que o Esc fecha, de uma lista das abertas na ordem em que
 * estão no `<body>` — a de cima por último, porque `abrirCamada` leva
 * cada uma ao fim dele. Fecham as que estão acima da última estática;
 * ela e o que ficou atrás dela, não: a gaveta embaixo do diálogo que
 * exige resposta não pode sumir por um Esc que o diálogo recusou. Sem
 * estática nenhuma, todas, como sempre foi.
 *
 * @template T
 * @param {Iterable<T>} camadas
 * @param {(camada: T) => boolean} ehEstatica
 * @returns {T[]}
 */
export function fechadasPeloEsc(camadas, ehEstatica) {
    const lista = [...(camadas ?? [])];
    let ultimaEstatica = -1;

    lista.forEach((camada, posicao) => {
        if (ehEstatica(camada)) {
            ultimaEstatica = posicao;
        }
    });

    return lista.slice(ultimaEstatica + 1);
}

/*
 * As camadas abertas, para os eventos: `ui:camada-aberta` sai só de
 * quem estava fechada, e `ui:camada-fechada` só de quem estava aberta —
 * cada abertura com um fechamento, nem mais nem menos. Não é o
 * `data-aberto`: ele entra um quadro depois da abertura (por causa da
 * animação), e o fechamento que vem antes disso também conta.
 */
const abertas = new WeakSet();

function abrirCamada(tipo, id, motivo = 'script') {
    const camada = document.getElementById(id);

    if (! camada) {
        return;
    }

    /*
     * A camada passa a viver no fim do `<body>`.
     *
     * `position: fixed` cobre a tela inteira **até** algum ancestral
     * criar contexto de empilhamento — o que acontece com `sticky`,
     * `transform`, `filter` e opacidade parcial. Dentro de um card
     * `sticky`, o fundo escuro cobria só a coluna daquele card, e o
     * resto da página continuava claro por cima. z-index não resolve:
     * o filho não escapa do contexto do pai por mais alto que suba.
     *
     * **No fim, a cada abertura**, e não só na primeira: modal e gaveta
     * têm o mesmo z-index, e entre iguais quem vence é a ordem no DOM.
     * O modal de confirmação aberto de dentro de uma gaveta ficava
     * atrás dela quando a gaveta tinha sido movida depois. Assim o
     * aberto por último está sempre por cima.
     *
     * Mover é barato. Os elementos são movidos, não recriados: o que
     * estava digitado num campo do modal continua lá, e os ouvintes
     * ficam — os do pacote estão no `document`, e os que os módulos
     * penduraram nos elementos de dentro vão junto com eles.
     */
    if (camada !== document.body.lastElementChild) {
        document.body.append(camada);
    }

    const jaAberta = abertas.has(camada);

    abertas.add(camada);
    camada.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    /*
     * O quadro seguinte, não este: marcar `data-aberto` junto com a
     * remoção do `hidden` faria o navegador pintar já no estado final,
     * sem transição nenhuma.
     */
    requestAnimationFrame(() => {
        // Fechada antes deste quadro (abriu e fechou no mesmo clique): fica fechada.
        if (! abertas.has(camada)) {
            return;
        }

        camada.dataset.aberto = '';

        // O foco vai para dentro, para quem usa teclado não ficar atrás dela.
        /*
         * O foco vai para o primeiro campo, não para o X de fechar (que
         * vem antes no HTML): quem abre um modal de formulário quer
         * digitar. Sem campo, o primeiro botão ou link.
         */
        const campo = camada.querySelector('[autofocus], input:not([type="hidden"]):not([tabindex="-1"]), select:not([tabindex="-1"]), textarea');

        (campo ?? camada.querySelector('button, a'))?.focus();
    });

    /*
     * Avisa quem precisa buscar conteúdo ao abrir — é o caso da gaveta
     * do carrinho, cujo preço tem de ser o de agora.
     */
    document.dispatchEvent(new CustomEvent(`${tipo}:aberto`, { detail: { id } }));

    if (! jaAberta) {
        avisarCamada(camada, 'aberta', tipo, motivo);
    }
}

function fecharCamada(tipo, camada, motivo = 'script') {
    if (! camada) {
        return;
    }

    /*
     * O `ui:camada-fechada` só sai da camada que estava aberta: o
     * `fecharModal(id)` chamado por garantia num modal já fechado (o
     * `pageshow` do confirm.js faz isso) não é um fechamento, e quem
     * reage a ele — "fechou o documento, próxima venda" — não pode ser
     * chamado duas vezes. O `modal:fechado` de sempre continua saindo
     * como sempre saiu.
     */
    const estavaAberta = abertas.has(camada);

    abertas.delete(camada);
    delete camada.dataset.aberto;

    /*
     * A rolagem só volta quando não resta nenhuma camada aberta: o
     * modal de saída abre sobre a gaveta do menu, e destravar ao
     * fechar o de cima deixaria a página rolando atrás do de baixo.
     */
    if (! document.querySelector('[data-modal][data-aberto], [data-offcanvas][data-aberto]')) {
        document.body.classList.remove('overflow-hidden');
    }

    // O `hidden` só entra depois da animação de saída terminar.
    setTimeout(() => {
        if (! ('aberto' in camada.dataset)) {
            camada.classList.add('hidden');
        }
    }, CAMADAS[tipo]);

    /*
     * Avisa quem precisa desfazer algo ao fechar — é o caso do
     * `<select>` de tipo do produto, que volta ao valor anterior
     * quando a pessoa desiste da confirmação.
     */
    document.dispatchEvent(new CustomEvent(`${tipo}:fechado`, { detail: { id: camada.id } }));

    if (estavaAberta) {
        avisarCamada(camada, 'fechada', tipo, motivo);
    }
}

/** Liga um tipo de camada: `data-abre-modal="id"` e `data-fecha-modal`. */
function ligarCamada(tipo) {
    document.addEventListener('click', (evento) => {
        const nome = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        const gatilho = evento.target.closest(`[data-abre-${tipo}]`);

        if (gatilho) {
            evento.preventDefault();
            abrirCamada(tipo, gatilho.dataset[`abre${nome}`], 'botao');

            return;
        }

        // Fecha pelo botão, pelo X ou clicando fora da caixa.
        const fechar = evento.target.closest(`[data-fecha-${tipo}]`);

        if (fechar) {
            fecharCamada(tipo, fechar.closest(`[data-${tipo}]`), 'botao');

            return;
        }

        /*
         * O clique fora fecha — `matches`, não `closest`: só vale
         * quando o alvo é a moldura em si. Clicar dentro da caixa
         * atinge um filho dela, e um formulário não pode sumir no meio
         * da digitação.
         *
         * A camada estática (`data-modal-estatico`) não fecha por aqui
         * nem pelo Esc: só pelos botões. É o diálogo que não pode ser
         * dispensado por acidente.
         */
        if (evento.target.matches(`[data-${tipo}-fundo]`)) {
            const camada = evento.target.closest(`[data-${tipo}]`);

            if (! estatica(camada)) {
                fecharCamada(tipo, camada, 'fundo');
            }
        }
    });

    /*
     * O Esc fecha as camadas abertas deste tipo — menos a estática e o
     * que está atrás dela (ver `fechadasPeloEsc`). A lista é das abertas
     * dos dois tipos: o modal estático aberto sobre uma gaveta a protege.
     */
    document.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') {
            return;
        }

        const todas = document.querySelectorAll('[data-modal][data-aberto], [data-offcanvas][data-aberto]');

        fechadasPeloEsc(todas, estatica)
            .filter((camada) => camada.matches(`[data-${tipo}]`))
            .forEach((camada) => fecharCamada(tipo, camada, 'esc'));
    });

    /*
     * `<x-ui.modal :open="true">` e `<x-ui.offcanvas :open="true">`: o
     * formulário voltou com erro e a pessoa continua nele.
     */
    document.querySelectorAll(`[data-${tipo}][data-abrir-ao-carregar]`)
        .forEach((camada) => abrirCamada(tipo, camada.id));
}

function ligarCamadas() {
    ligarCamada('modal');
    ligarCamada('offcanvas');
}

/*
 * Abrir de fora, para a tela que precisa disso já no carregamento —
 * o formulário que voltou do servidor com erro, por exemplo.
 */
window.abrirModal = (id) => abrirCamada('modal', id);
window.abrirOffcanvas = (id) => abrirCamada('offcanvas', id);

/*
 * Fechar de fora, para quem confirma uma ação e segue sem recarregar —
 * é o caso da remoção pela gaveta do carrinho.
 */
window.fecharModal = (id) => fecharCamada('modal', document.getElementById(id));
window.fecharOffcanvas = (id) => fecharCamada('offcanvas', document.getElementById(id));

export { ligarCamadas, abrirCamada, fecharCamada };
