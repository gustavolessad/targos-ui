// --- Painel flutuante ---

/*
 * Solta um painel de lista (select, multiselect) do lugar onde nasceu.
 *
 * Preso ao campo, ele herdava o `overflow: hidden` de qualquer
 * ancestral — o card da ficha, a gaveta, a tabela — e saía cortado.
 * Aberto, ele vai para o `<body>` com `position: fixed`, na altura do
 * gatilho; fechado, volta para o lugar de origem.
 *
 * Abre para baixo, ou para cima quando embaixo não cabe e em cima há
 * mais espaço. Para cima ele se prende pelo `bottom`: quando a busca
 * encolhe a lista, ele encolhe em direção ao campo, e não se solta dele.
 *
 * Quando não cabe inteiro em nenhum dos lados (janela baixa, calendário
 * alto), fica encostado na borda da janela, por cima do campo: cobrir o
 * campo atrapalha menos do que nascer cortado.
 *
 * O z-index fica acima de modal e gaveta (60) e abaixo do toast (70).
 */
/*
 * `larguraPropria`: o painel mantém a largura dele (o calendário), em vez
 * de copiar a do campo (o select).
 */
/* O quanto o painel fica longe da borda da janela. */
const MARGEM = 8;

/**
 * Onde o painel fica na vertical, em pixels da janela.
 *
 * `topo` e `base` são as bordas do campo; `altura`, a do painel;
 * `janela`, a altura da janela. Devolve `{ top }` ou `{ bottom }` —
 * a outra borda fica solta.
 */
export function encaixeVertical({ topo, base, altura, janela, folga }) {
    const abaixo = janela - base;
    const paraCima = abaixo < altura + folga * 2 && topo > abaixo;

    if (paraCima) {
        // Sem espaço nem em cima: desce até caber, encostado no alto da janela.
        if (topo - folga - altura < MARGEM) {
            return { top: MARGEM };
        }

        return { bottom: janela - topo + folga };
    }

    // Sem espaço nem embaixo: sobe até caber, sem passar do alto da janela.
    if (base + folga + altura > janela - MARGEM) {
        return { top: Math.max(MARGEM, Math.min(base + folga, janela - altura - MARGEM)) };
    }

    return { top: base + folga };
}

function painelFlutuante(ancora, painel, { larguraPropria = false } = {}) {
    const origem = painel.parentElement;
    const vizinho = painel.nextSibling;
    const folga = 6;

    const posicionar = () => {
        const caixa = ancora.getBoundingClientRect();

        if (! larguraPropria) {
            painel.style.width = `${caixa.width}px`;
        }

        /*
         * A área visível, **sem as barras de rolagem**: `window.innerWidth`
         * as inclui, e o painel encostado "a 8px da borda" terminava por
         * baixo da barra vertical da página (cerca de 17px no Windows) — o
         * "Aplicar" do calendário do período ficava cortado nela.
         */
        const visivel = document.documentElement;

        // Horizontal: alinhado ao campo, sem vazar pela direita da tela.
        const largura = painel.offsetWidth;
        const esquerda = Math.max(8, Math.min(caixa.left, visivel.clientWidth - largura - 8));

        painel.style.left = `${esquerda}px`;

        const lugar = encaixeVertical({
            topo: caixa.top,
            base: caixa.bottom,
            altura: painel.offsetHeight,
            janela: visivel.clientHeight,
            folga,
        });

        painel.style.top = 'top' in lugar ? `${lugar.top}px` : 'auto';
        painel.style.bottom = 'bottom' in lugar ? `${lugar.bottom}px` : 'auto';
    };

    // Captura: a rolagem de qualquer contêiner (a gaveta, a página) move o campo.
    const aoRolar = () => posicionar();

    return {
        abrir() {
            document.body.append(painel);

            Object.assign(painel.style, { position: 'fixed', margin: '0', zIndex: '65' });

            painel.hidden = false;
            posicionar();

            window.addEventListener('scroll', aoRolar, { capture: true, passive: true });
            window.addEventListener('resize', aoRolar);
        },

        fechar() {
            painel.hidden = true;

            window.removeEventListener('scroll', aoRolar, { capture: true });
            window.removeEventListener('resize', aoRolar);

            if (painel.parentElement !== origem) {
                origem.insertBefore(painel, vizinho);
            }
        },

        posicionar,
    };
}

export { painelFlutuante };
