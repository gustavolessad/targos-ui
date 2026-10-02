// --- Barra lateral recolhível ---

/*
 * A barra lateral encolhe para uma coluna de ícones.
 *
 * O estado mora no <html> (`data-sidebar="recolhida"`) e em
 * `localStorage`: é preferência do aparelho, como o tema. Quem o põe na
 * primeira pintura é o `<x-ui.theme-script />`, no <head> — aqui só se
 * liga o botão que o troca (`<x-ui.sidebar-toggle />`).
 *
 * O desenho recolhido é todo de CSS, pela variante `recolhida:` do
 * theme.css, que só vale a partir do `lg` e fora da gaveta do celular.
 * O que sobra para o JavaScript é o que não cabe em CSS: com a barra
 * estreita, o nome de cada item vira uma dica à direita, e o grupo vira
 * um menu flutuante com os itens dele. Os dois ficam no <body>, em
 * `position: fixed` — presos à barra seriam cortados pela rolagem dela.
 */
import { abrirCamada } from './layers.js';

const CHAVE = 'sidebar';

/* Precisa bater com o `lg` do Tailwind, que é onde a barra fixa aparece. */
const noComputador = () => window.matchMedia('(min-width: 64rem)').matches;

const recolhida = () => document.documentElement.dataset.sidebar === 'recolhida';

/* A distância entre a barra e o que flutua ao lado dela. */
const FOLGA = 10;

/* O quanto o menu do grupo fica longe da borda da janela. */
const MARGEM = 8;

/* O tempo para o mouse atravessar da barra ao menu do grupo sem ele fechar. */
const ESPERA = 120;

/*
 * A superfície do que flutua ao lado da barra. A dica do item e o menu
 * do grupo são o mesmo cartão — branco no claro, escuro no escuro —,
 * para a coluna de ícones responder do mesmo jeito em toda a altura: o
 * que muda de um para o outro é só o conteúdo.
 */
const CARTAO = 'fixed z-50 rounded-xl bg-white text-sm shadow-lg ring-1 ring-neutral-200'
    + ' dark:bg-neutral-900 dark:ring-neutral-800 origin-left animate-surgir';

// O nome do item, no peso e na cor em que ele aparece com a barra aberta.
const DICA = `${CARTAO} pointer-events-none w-max max-w-64 px-3 py-2 font-medium text-neutral-900 dark:text-white`;

const MENU = `${CARTAO} min-w-48 p-1 [&>a]:py-2`;

const TITULO = 'px-3 pb-1 pt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400';

let dica = null;
let menu = null;
let donoDoMenu = null;
let fechamento = null;

function esconderDica() {
    dica?.remove();
    dica = null;
}

function fecharMenu() {
    clearTimeout(fechamento);
    menu?.remove();
    menu = null;
    donoDoMenu?.setAttribute('aria-expanded', 'false');
    donoDoMenu = null;
}

function fecharMenuDepois() {
    clearTimeout(fechamento);
    fechamento = setTimeout(fecharMenu, ESPERA);
}

/** A dica com o nome do item, à direita dele, centrada na altura. */
function mostrarDica(item) {
    esconderDica();

    const texto = item.dataset.barraDica;

    if (! texto) {
        return;
    }

    dica = document.createElement('div');
    dica.setAttribute('role', 'tooltip');
    dica.className = DICA;
    dica.textContent = texto;
    document.body.append(dica);

    const caixa = item.getBoundingClientRect();

    dica.style.left = `${caixa.right + FOLGA}px`;
    dica.style.top = `${caixa.top + (caixa.height - dica.offsetHeight) / 2}px`;
}

/**
 * O menu do grupo: o nome dele e os itens, à direita do ícone.
 *
 * Os itens são cópias dos que estão dentro do grupo: links comuns, que
 * navegam sozinhos. Montado a cada abertura, para refletir o que a
 * página tiver naquele momento.
 */
function abrirMenu(titulo) {
    if (donoDoMenu === titulo) {
        clearTimeout(fechamento);

        return;
    }

    fecharMenu();
    esconderDica();

    const itens = titulo.parentElement.querySelector('[data-barra-itens]');

    if (! itens) {
        return;
    }

    menu = document.createElement('div');
    menu.dataset.barraFlutuante = '';
    menu.className = MENU;

    const rotulo = document.createElement('p');
    rotulo.className = TITULO;
    rotulo.textContent = titulo.dataset.barraRotulo ?? '';
    menu.append(rotulo, ...[...itens.children].map((item) => item.cloneNode(true)));

    document.body.append(menu);

    const caixa = titulo.getBoundingClientRect();
    const topo = Math.max(MARGEM, Math.min(caixa.top, window.innerHeight - menu.offsetHeight - MARGEM));

    menu.style.left = `${caixa.right + FOLGA}px`;
    menu.style.top = `${topo}px`;

    menu.addEventListener('mouseenter', () => clearTimeout(fechamento));
    menu.addEventListener('mouseleave', fecharMenuDepois);

    donoDoMenu = titulo;
    titulo.setAttribute('aria-expanded', 'true');
}

/** O item ou o título de grupo da barra fixa sob o ponteiro, se a barra estiver recolhida. */
function alvoDe(elemento) {
    if (! recolhida() || ! noComputador() || ! (elemento instanceof Element)) {
        return null;
    }

    const alvo = elemento.closest('[data-barra-dica], [data-barra-rotulo]');

    // Só a barra fixa: a da gaveta do celular nunca encolhe, e as cópias do menu flutuante já mostram o nome.
    if (! alvo || ! alvo.closest('[data-barra]') || alvo.closest('[data-offcanvas], [data-barra-flutuante]')) {
        return null;
    }

    return alvo;
}

function entrar(alvo) {
    if ('barraRotulo' in alvo.dataset) {
        abrirMenu(alvo);
    } else {
        fecharMenu();
        mostrarDica(alvo);
    }
}

function alternar() {
    const recolher = ! recolhida();

    if (recolher) {
        document.documentElement.dataset.sidebar = 'recolhida';
    } else {
        delete document.documentElement.dataset.sidebar;
    }

    try {
        localStorage.setItem(CHAVE, recolher ? 'recolhida' : 'aberta');
    } catch {
        // Armazenamento bloqueado: vale só para esta página.
    }

    esconderDica();
    fecharMenu();
}

export function ligarBarraLateral() {
    document.addEventListener('click', (evento) => {
        // Clicou: a dica já cumpriu o papel, e ficaria por cima do que o clique abrir.
        esconderDica();

        const botao = evento.target.closest('[data-recolhe-barra]');

        if (botao) {
            evento.preventDefault();

            // No celular não há barra fixa para encolher: o mesmo botão abre a gaveta.
            if (noComputador()) {
                alternar();
            } else if (botao.dataset.gaveta) {
                abrirCamada('offcanvas', botao.dataset.gaveta);
            }

            return;
        }

        /*
         * Recolhida, o clique no grupo não o desdobra (não há onde): abre
         * o menu dele, que é o que o toque e o teclado têm no lugar do
         * mouse por cima.
         */
        const titulo = alvoDe(evento.target);

        if (titulo && 'barraRotulo' in titulo.dataset) {
            evento.preventDefault();

            if (donoDoMenu === titulo && evento.detail !== 0) {
                fecharMenu();
            } else {
                abrirMenu(titulo);

                // Veio do teclado (Enter no título): o foco entra no menu.
                if (evento.detail === 0) {
                    menu?.querySelector('a')?.focus();
                }
            }

            return;
        }

        // Um clique fora fecha o menu; num item dele, a página troca.
        if (menu && ! menu.contains(evento.target)) {
            fecharMenu();
        }
    });

    document.addEventListener('mouseover', (evento) => {
        const alvo = alvoDe(evento.target);

        if (alvo && ! alvo.contains(evento.relatedTarget)) {
            entrar(alvo);
        }
    });

    document.addEventListener('mouseout', (evento) => {
        const alvo = alvoDe(evento.target);

        if (! alvo || alvo.contains(evento.relatedTarget)) {
            return;
        }

        if ('barraRotulo' in alvo.dataset) {
            fecharMenuDepois();
        } else {
            esconderDica();
        }
    });

    // Pelo teclado, o foco faz o papel do mouse por cima.
    document.addEventListener('focusin', (evento) => {
        const alvo = alvoDe(evento.target);

        if (alvo && ! ('barraRotulo' in alvo.dataset)) {
            mostrarDica(alvo);
        }
    });

    document.addEventListener('focusout', (evento) => {
        esconderDica();

        if (menu && ! menu.contains(evento.relatedTarget) && evento.relatedTarget !== donoDoMenu) {
            fecharMenuDepois();
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && menu) {
            const dono = donoDoMenu;

            fecharMenu();
            dono?.focus();
        }
    });

    // A lista rolou ou a janela mudou: o que flutua ficaria fora do lugar.
    window.addEventListener('scroll', () => {
        esconderDica();
        fecharMenu();
    }, { capture: true, passive: true });

    window.addEventListener('resize', () => {
        esconderDica();
        fecharMenu();
    });
}
