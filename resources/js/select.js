import { painelFlutuante } from './floating.js';
import { paraBusca } from './search.js';

// --- Seletor ---

/*
 * O `<select>` do sistema, no estilo do multiselect.
 *
 * O nativo continua no HTML e continua sendo a fonte da verdade: é ele
 * que vai no formulário, que recebe `disabled`, que dispara `change`.
 * Aqui ele só fica escondido, e um gatilho com painel o espelha. Assim
 * nenhum script que já falava com ele — a busca de CEP, o construtor da
 * home, as gavetas que reabrem com outro registro — precisa saber que
 * a cara mudou.
 *
 * Três coisas mantêm o espelho fiel:
 * - o painel é remontado **a cada abertura**, a partir das opções do
 *   nativo (quem esconder ou desligar uma opção é obedecido);
 * - o `value` do nativo ganha um setter que redesenha o gatilho, porque
 *   `select.value = x` vindo de outro script não dispara evento nenhum;
 * - um observador acompanha o `disabled`.
 */
function ligarSeletores(raiz = document) {
    raiz.querySelectorAll('[data-seletor]').forEach(montarSeletor);
}

function montarSeletor(campo) {
    if (campo.dataset.seletorLigado) {
        return;
    }

    const nativo = campo.querySelector('[data-seletor-nativo]');
    const gatilho = campo.querySelector('[data-seletor-gatilho]');
    const texto = campo.querySelector('[data-seletor-texto]');
    const painel = campo.querySelector('[data-seletor-painel]');
    const lista = campo.querySelector('[data-seletor-lista]');
    const filtro = campo.querySelector('[data-seletor-filtro]');
    const vazio = campo.querySelector('[data-seletor-vazio]');

    if (! nativo || ! gatilho || ! texto || ! painel || ! lista) {
        return;
    }

    campo.dataset.seletorLigado = '1';

    // O nativo sai de vista, mas segue no formulário e na validação.
    nativo.classList.add('sr-only');
    nativo.tabIndex = -1;
    nativo.setAttribute('aria-hidden', 'true');
    gatilho.hidden = false;

    // A cor de ação do projeto, pelo token `primary`.
    const marca = 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200';

    /** O que o gatilho mostra: o caminho no hierárquico, senão o rótulo. */
    const rotuloDe = (opcao) => (opcao?.dataset.caminho ?? opcao?.textContent ?? '').trim();

    const desenharGatilho = () => {
        const opcao = nativo.selectedOptions[0];
        const temValor = opcao && opcao.value !== '';

        texto.textContent = rotuloDe(opcao) || ' ';
        texto.classList.toggle('text-neutral-400', ! temValor);

        gatilho.setAttribute('aria-disabled', String(nativo.disabled));
        gatilho.tabIndex = nativo.disabled ? -1 : 0;
    };

    /*
     * `select.value = x` de outro script não dispara `change`. O setter
     * da instância chama o do protótipo e redesenha — é o que mantém o
     * gatilho certo quando a gaveta de edição troca de registro.
     */
    const descritor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

    Object.defineProperty(nativo, 'value', {
        configurable: true,
        get() {
            return descritor.get.call(this);
        },
        set(novo) {
            descritor.set.call(this, novo);
            desenharGatilho();
        },
    });

    nativo.addEventListener('change', desenharGatilho);

    new MutationObserver(desenharGatilho).observe(nativo, {
        attributes: true,
        attributeFilter: ['disabled'],
        childList: true,
        subtree: true,
    });

    /** Uma linha do painel para uma `<option>` do nativo. */
    const linha = (opcao) => {
        const botao = document.createElement('button');
        const nivel = Number(opcao.dataset.nivel ?? 0);
        const escolhida = opcao.selected && opcao.value !== '';

        botao.type = 'button';
        botao.setAttribute('role', 'option');
        botao.dataset.seletorValor = opcao.value;
        botao.dataset.seletorBusca = paraBusca(rotuloDe(opcao));
        botao.setAttribute('aria-selected', String(escolhida));
        botao.disabled = opcao.disabled;
        botao.className = [
            'flex w-full cursor-pointer items-center gap-2 rounded-lg py-2 pe-2.5 text-start text-sm',
            'text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none',
            'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800',
            'disabled:cursor-not-allowed disabled:opacity-40',
            escolhida ? marca : '',
            nivel > 0 ? '' : 'ps-2.5',
            // O pai de uma árvore em negrito: é o que organiza os de baixo.
            opcao.dataset.nivel === '0' ? 'font-medium text-neutral-900 dark:text-white' : '',
        ].join(' ');

        // O recuo acompanha o nível; a guia desenha de quem ele é filho.
        if (nivel > 0) {
            botao.style.paddingInlineStart = `${0.625 + nivel * 1.1}rem`;

            const guia = document.createElement('span');
            guia.className = 'size-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600';
            botao.append(guia);
        }

        const rotulo = document.createElement('span');
        rotulo.className = 'min-w-0 flex-1 truncate';
        rotulo.textContent = opcao.textContent.trim();
        botao.append(rotulo);

        if (escolhida) {
            botao.insertAdjacentHTML(
                'beforeend',
                '<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
            );
        }

        return botao;
    };

    /** Remonta o painel a partir do nativo, como ele está agora. */
    const montarLista = () => {
        lista.textContent = '';

        for (const filho of nativo.children) {
            if (filho.tagName === 'OPTGROUP') {
                const opcoes = Array.from(filho.children).filter((o) => ! o.hidden);

                if (opcoes.length === 0) {
                    continue;
                }

                const grupo = document.createElement('div');
                grupo.dataset.seletorGrupo = '';
                grupo.setAttribute('role', 'group');

                const titulo = document.createElement('p');
                titulo.className = 'px-2.5 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400';
                titulo.textContent = filho.label;
                grupo.append(titulo);

                opcoes.forEach((opcao) => grupo.append(linha(opcao)));
                lista.append(grupo);

                continue;
            }

            if (! filho.hidden) {
                lista.append(linha(filho));
            }
        }
    };

    const opcoesVisiveis = () => Array.from(lista.querySelectorAll('[data-seletor-valor]'))
        .filter((botao) => ! botao.hidden && ! botao.disabled);

    const filtrar = () => {
        const termo = paraBusca(filtro?.value);

        lista.querySelectorAll('[data-seletor-valor]').forEach((botao) => {
            botao.hidden = termo !== '' && ! botao.dataset.seletorBusca.includes(termo);
        });

        // O título do grupo some junto com as opções dele.
        lista.querySelectorAll('[data-seletor-grupo]').forEach((grupo) => {
            grupo.hidden = ! grupo.querySelector('[data-seletor-valor]:not([hidden])');
        });

        vazio?.classList.toggle('hidden', opcoesVisiveis().length > 0);
    };

    const flutuante = painelFlutuante(gatilho, painel);

    const aberto = () => ! painel.hidden;

    const fechar = ({ focar = false } = {}) => {
        flutuante.fechar();
        gatilho.setAttribute('aria-expanded', 'false');

        if (focar) {
            gatilho.focus();
        }
    };

    const abrir = () => {
        if (nativo.disabled) {
            return;
        }

        montarLista();

        if (filtro) {
            filtro.value = '';
        }

        filtrar();

        flutuante.abrir();
        gatilho.setAttribute('aria-expanded', 'true');

        const marcada = lista.querySelector('[aria-selected="true"]');
        marcada?.scrollIntoView({ block: 'nearest' });

        (filtro ?? marcada ?? opcoesVisiveis()[0])?.focus();
    };

    const escolher = (valor) => {
        const mudou = nativo.value !== valor;

        nativo.value = valor;

        // Como o nativo faria: só avisa quando a escolha mudou de fato.
        if (mudou) {
            nativo.dispatchEvent(new Event('input', { bubbles: true }));
            nativo.dispatchEvent(new Event('change', { bubbles: true }));
        }

        fechar({ focar: true });
    };

    gatilho.addEventListener('click', () => (aberto() ? fechar() : abrir()));

    gatilho.addEventListener('keydown', (evento) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(evento.key)) {
            evento.preventDefault();
            abrir();
        }
    });

    lista.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-seletor-valor]');

        if (botao && ! botao.disabled) {
            escolher(botao.dataset.seletorValor);
        }
    });

    filtro?.addEventListener('input', filtrar);

    // As setas andam pelas opções visíveis; Enter no filtro escolhe a primeira.
    painel.addEventListener('keydown', (evento) => {
        const opcoes = opcoesVisiveis();
        const atual = opcoes.indexOf(document.activeElement);

        if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
            evento.preventDefault();

            const passo = evento.key === 'ArrowDown' ? 1 : -1;
            const proxima = atual === -1
                ? (passo === 1 ? 0 : opcoes.length - 1)
                : Math.min(Math.max(atual + passo, 0), opcoes.length - 1);

            opcoes[proxima]?.focus();

            return;
        }

        if (evento.key === 'Enter' && document.activeElement === filtro) {
            evento.preventDefault();

            if (opcoes[0]) {
                escolher(opcoes[0].dataset.seletorValor);
            }

            return;
        }

        if (evento.key === 'Escape') {
            evento.preventDefault();
            evento.stopPropagation();
            fechar({ focar: true });

            return;
        }

        if (evento.key === 'Tab') {
            fechar();
        }
    });

    // Um clique fora fecha, como em qualquer menu.
    document.addEventListener('click', (evento) => {
        if (aberto() && ! campo.contains(evento.target) && ! painel.contains(evento.target)) {
            fechar();
        }
    });

    // O rótulo apontava para o nativo, que está escondido: o foco vai ao gatilho.
    if (nativo.id) {
        document.querySelectorAll(`label[for="${CSS.escape(nativo.id)}"]`).forEach((rotulo) => {
            rotulo.addEventListener('click', (evento) => {
                evento.preventDefault();
                gatilho.focus();
            });
        });
    }

    // Campo obrigatório vazio: o navegador aponta o nativo, que não se vê.
    nativo.addEventListener('invalid', () => {
        gatilho.focus();
    });

    desenharGatilho();
}

window.ligarSeletores = ligarSeletores;

export { ligarSeletores };
