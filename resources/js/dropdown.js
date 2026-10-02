// --- Dropdown ---

/* Precisa bater com a `duration-150` do <x-ui.dropdown>. */
const SAIDA_DO_MENU = 150;

function abrirMenu(menu) {
    menu.classList.remove('hidden');

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
            abrirMenu(menu);
        }
    });
}

export { ligarDropdowns };
