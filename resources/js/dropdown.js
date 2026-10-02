// --- Dropdown ---

/* Precisa bater com a `duration-150` do <x-ui.dropdown>. */
const SAIDA_DO_MENU = 150;

/* A distância entre o botão e a lista (o `mt-1.5` do componente). */
const FOLGA = 6;

/* O quanto a lista fica longe da borda da janela. */
const MARGEM = 8;

/**
 * Para que lado a lista abre: o lado pedido (`natural`), salvo quando
 * ela não cabe ali e do outro lado há mais espaço.
 *
 * `acima` e `abaixo` são o espaço livre na janela, a partir do botão.
 */
export function ladoDoMenu({ natural, altura, acima, abaixo }) {
    const precisa = altura + FOLGA + MARGEM;

    if (natural === 'bottom') {
        return abaixo < precisa && acima > abaixo ? 'top' : 'bottom';
    }

    return acima < precisa && abaixo > acima ? 'bottom' : 'top';
}

/*
 * Vira a lista para o lado onde ela cabe.
 *
 * O lado de origem vem do CSS (`side` do <x-ui.dropdown>, ou as classes
 * de quem escreveu o menu à mão). No pé da janela, a lista que abre
 * para baixo nasceria fora dela e esticaria a página; aqui ela passa a
 * abrir para cima do botão — e o contrário no alto da janela.
 *
 * A posição é em pixels, medida a partir do botão: o envelope do menu
 * nem sempre é justo ao botão (o atalho da barra lateral tem margem em
 * volta), e `bottom: 100%` encostaria a lista no envelope, não nele.
 */
function virarSePreciso(menu, gatilho) {
    // Volta ao lado de origem antes de medir: a janela pode ter rolado desde a última abertura.
    for (const propriedade of ['top', 'bottom', 'marginTop', 'marginBottom', 'transformOrigin']) {
        menu.style[propriedade] = '';
    }

    const envelope = menu.offsetParent;

    if (! envelope) {
        return;
    }

    const botao = gatilho.getBoundingClientRect();
    const caixa = menu.getBoundingClientRect();
    const natural = caixa.top >= botao.top ? 'bottom' : 'top';

    const lado = ladoDoMenu({
        natural,
        // `offsetHeight` e não a caixa: a lista fechada está encolhida a 95% pela animação.
        altura: menu.offsetHeight,
        acima: botao.top,
        abaixo: window.innerHeight - botao.bottom,
    });

    if (lado === natural) {
        return;
    }

    const moldura = envelope.getBoundingClientRect();

    // A lista cresce do canto colado ao botão: o horizontal fica, o vertical troca.
    const [origemHorizontal] = getComputedStyle(menu).transformOrigin.split(' ');

    menu.style.marginTop = '0';
    menu.style.marginBottom = '0';

    if (lado === 'top') {
        menu.style.top = 'auto';
        menu.style.bottom = `${moldura.bottom - botao.top + FOLGA}px`;
        menu.style.transformOrigin = `${origemHorizontal} 100%`;
    } else {
        menu.style.bottom = 'auto';
        menu.style.top = `${botao.bottom - moldura.top + FOLGA}px`;
        menu.style.transformOrigin = `${origemHorizontal} 0`;
    }
}

function abrirMenu(menu, gatilho) {
    menu.classList.remove('hidden');

    // Já visível, para ter altura; ainda sem `data-aberto`, para a animação partir do lado certo.
    virarSePreciso(menu, gatilho);

    /*
     * O quadro seguinte, não este: marcar `data-aberto` junto com a
     * remocao do `hidden` faria o navegador pintar ja no estado final,
     * sem transicao nenhuma.
     */
    requestAnimationFrame(() => {
        menu.dataset.aberto = '';
    });
}

function fecharMenu(menu) {
    delete menu.dataset.aberto;

    // O `hidden` só entra depois da animação de saída terminar.
    setTimeout(() => {
        if (! ('aberto' in menu.dataset)) {
            menu.classList.add('hidden');
        }
    }, SAIDA_DO_MENU);
}

function ligarDropdowns() {
    document.addEventListener('click', (evento) => {
        const gatilho = evento.target.closest('[data-abre-menu]');

        // Um clique fora fecha todos os menus abertos.
        document.querySelectorAll('[data-menu][data-aberto]').forEach((menu) => {
            if (menu.id !== gatilho?.dataset.abreMenu) {
                fecharMenu(menu);
            }
        });

        if (! gatilho) {
            return;
        }

        evento.preventDefault();

        const menu = document.getElementById(gatilho.dataset.abreMenu);

        if (! menu) {
            return;
        }

        if ('aberto' in menu.dataset) {
            fecharMenu(menu);
        } else {
            abrirMenu(menu, gatilho);
        }
    });
}

export { ligarDropdowns };
