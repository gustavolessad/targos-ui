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
 * O z-index fica acima de modal e gaveta (60) e abaixo do toast (70).
 */
/*
 * `larguraPropria`: o painel mantém a largura dele (o calendário), em vez
 * de copiar a do campo (o select).
 */
function painelFlutuante(ancora, painel, { larguraPropria = false } = {}) {
    const origem = painel.parentElement;
    const vizinho = painel.nextSibling;
    const folga = 6;

    const posicionar = () => {
        const caixa = ancora.getBoundingClientRect();

        if (! larguraPropria) {
            painel.style.width = `${caixa.width}px`;
        }

        // Horizontal: alinhado ao campo, sem vazar pela direita da tela.
        const largura = painel.offsetWidth;
        const esquerda = Math.max(8, Math.min(caixa.left, window.innerWidth - largura - 8));

        painel.style.left = `${esquerda}px`;

        const abaixo = window.innerHeight - caixa.bottom;
        const paraCima = abaixo < painel.offsetHeight + folga * 2 && caixa.top > abaixo;

        if (paraCima) {
            painel.style.top = 'auto';
            painel.style.bottom = `${window.innerHeight - caixa.top + folga}px`;
        } else {
            painel.style.bottom = 'auto';
            painel.style.top = `${caixa.bottom + folga}px`;
        }
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
