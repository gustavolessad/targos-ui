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

function abrirCamada(tipo, id) {
    const camada = document.getElementById(id);

    if (! camada) {
        return;
    }

    /*
     * A camada passa a viver no `<body>`.
     *
     * `position: fixed` cobre a tela inteira **até** algum ancestral
     * criar contexto de empilhamento — o que acontece com `sticky`,
     * `transform`, `filter` e opacidade parcial. Dentro de um card
     * `sticky`, o fundo escuro cobria só a coluna daquele card, e o
     * resto da página continuava claro por cima. z-index não resolve:
     * o filho não escapa do contexto do pai por mais alto que suba.
     *
     * Mover é barato e vale uma vez só — na segunda abertura ela já
     * está aqui. Os elementos são movidos, não recriados: o que estava
     * digitado num campo do modal continua lá.
     */
    if (camada.parentElement !== document.body) {
        document.body.append(camada);
    }

    camada.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    /*
     * O quadro seguinte, não este: marcar `data-aberto` junto com a
     * remoção do `hidden` faria o navegador pintar já no estado final,
     * sem transição nenhuma.
     */
    requestAnimationFrame(() => {
        camada.dataset.aberto = '';

        // O foco vai para dentro, para quem usa teclado não ficar atrás dela.
        camada.querySelector('[autofocus], input, button, a')?.focus();
    });

    /*
     * Avisa quem precisa buscar conteúdo ao abrir — é o caso da gaveta
     * do carrinho, cujo preço tem de ser o de agora.
     */
    document.dispatchEvent(new CustomEvent(`${tipo}:aberto`, { detail: { id } }));
}

function fecharCamada(tipo, camada) {
    if (! camada) {
        return;
    }

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
}

/** Liga um tipo de camada: `data-abre-modal="id"` e `data-fecha-modal`. */
function ligarCamada(tipo) {
    document.addEventListener('click', (evento) => {
        const nome = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        const gatilho = evento.target.closest(`[data-abre-${tipo}]`);

        if (gatilho) {
            evento.preventDefault();
            abrirCamada(tipo, gatilho.dataset[`abre${nome}`]);

            return;
        }

        // Fecha pelo botão, pelo X ou clicando fora da caixa.
        const fechar = evento.target.closest(`[data-fecha-${tipo}]`);

        if (fechar) {
            fecharCamada(tipo, fechar.closest(`[data-${tipo}]`));

            return;
        }

        /*
         * O clique fora fecha — `matches`, não `closest`: só vale
         * quando o alvo é a moldura em si. Clicar dentro da caixa
         * atinge um filho dela, e um formulário não pode sumir no meio
         * da digitação.
         */
        if (evento.target.matches(`[data-${tipo}-fundo]`)) {
            fecharCamada(tipo, evento.target.closest(`[data-${tipo}]`));
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            document.querySelectorAll(`[data-${tipo}][data-aberto]`)
                .forEach((camada) => fecharCamada(tipo, camada));
        }
    });
}

function ligarCamadas() {
    ligarCamada('modal');
    ligarCamada('offcanvas');

    // `<x-ui.modal :open="true">`: o formulário voltou com erro e a pessoa continua nele.
    document.querySelectorAll('[data-modal][data-abrir-ao-carregar]').forEach((modal) => abrirCamada('modal', modal.id));
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

export { ligarCamadas, abrirCamada, fecharCamada };
