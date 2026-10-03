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
 * - um observador acompanha o `disabled` e o só leitura.
 *
 * Só leitura (`data-readonly`, ou `readonly`, no nativo — o `<select>`
 * não tem o atributo, mas um script pode pô-lo mesmo assim): o gatilho
 * não abre e ganha `aria-readonly`, e o nativo continua no envio. É o
 * que `disabled` não dá: desligado, o campo não vai no formulário.
 *
 * Uma opção pode dizer mais que o rótulo: a segunda linha
 * (`data-caption`, o código e o saldo do produto) e os dados que a tela
 * usa ao escolher (`data-extra`, em JSON: o preço, a unidade). Vêm da
 * página ou da busca no servidor, e moram no `<option>` do nativo como o
 * resto. A tela os recebe no evento `ui:selecionado`, disparado no
 * nativo depois do `change`, ou pergunta a qualquer hora com
 * `escolhaDe(nativo)`.
 *
 * Com `multiple`, o nativo é um `<select multiple>` e o espelho muda de
 * cara, não de regra: o gatilho mostra as escolhidas em chips, cada um
 * com o "×" que a tira; no painel, cada opção tem uma caixa (só
 * desenho — o estado é o `selected` do `<option>`), clicar alterna sem
 * fechar, e o rodapé tem "Limpar" e "Concluir". O evento e o
 * `escolhaDe` falam em listas: `{ values, labels, extras }`.
 */
function ligarSeletores(raiz = document) {
    raiz.querySelectorAll('[data-seletor]').forEach(montarSeletor);
}

/** Quanto esperar a pessoa parar de digitar antes de buscar no servidor. */
const ESPERA_DA_BUSCA = 300;

/** A URL da busca no servidor: a do `source`, com `?q=` (mantém o que ela já tiver na query). */
export function urlDaBusca(fonte, termo, base) {
    const url = new URL(fonte, base);
    url.searchParams.set('q', termo ?? '');

    return url.toString();
}

/**
 * Os dados da opção como vão no `data-extra` do `<option>`: JSON, ou
 * `null` quando não há (a opção fica sem o atributo).
 */
export function textoDoExtra(extra) {
    return extra === null || extra === undefined ? null : JSON.stringify(extra);
}

/**
 * O caminho de volta: o `data-extra` lido como dados. Sem o atributo, ou
 * com um JSON que não se lê, `null` — a escolha continua valendo, só
 * sem os dados.
 */
export function lerExtra(texto) {
    if (texto === null || texto === undefined || texto === '') {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch {
        return null;
    }
}

/**
 * Uma opção da busca com os tipos acertados. A segunda linha e os dados
 * só entram quando existem, como na resposta do servidor
 * (`SelectOptions::response`).
 */
function normalizarOpcao(item) {
    const opcao = { value: String(item.value), label: String(item.label) };
    const caption = item.caption === null || item.caption === undefined ? '' : String(item.caption).trim();

    if (caption !== '') {
        opcao.caption = caption;
    }

    if (item.extra !== null && item.extra !== undefined) {
        opcao.extra = item.extra;
    }

    return opcao;
}

/**
 * As opções do nativo depois de uma busca no servidor: as que vieram e,
 * se a escolhida não veio, ela também — escondida, para o valor do
 * formulário não se perder (o painel não mostra opção escondida). A
 * segunda linha e os dados de cada uma vêm junto, os da escolhida
 * inclusive.
 *
 * @param {{value: string, label: string, caption?: string|null, extra?: object|null}|null} escolhida
 * @param {Array<{value: string|number, label: string, caption?: string|null, extra?: object|null}>} itens
 * @returns {Array<{value: string, label: string, caption?: string, extra?: object, selected: boolean, hidden: boolean}>}
 */
export function mesclarOpcoes(escolhida, itens) {
    return mesclarVarias(escolhida === null ? [] : [escolhida], itens);
}

/**
 * O mesmo, para o select de várias escolhas (`multiple`): as que vieram,
 * marcadas quando estão entre as escolhidas, e, no fim, escondidas, as
 * escolhidas que a busca não trouxe — nenhuma sai do formulário porque
 * não bateu com o termo digitado.
 *
 * @param {Array<{value: string, label: string, caption?: string|null, extra?: object|null}>} escolhidas
 * @param {Array<{value: string|number, label: string, caption?: string|null, extra?: object|null}>} itens
 * @returns {Array<{value: string, label: string, caption?: string, extra?: object, selected: boolean, hidden: boolean}>}
 */
export function mesclarVarias(escolhidas, itens) {
    const marcados = new Set(escolhidas.map((escolhida) => String(escolhida.value)));

    const opcoes = itens.map((item) => {
        const opcao = normalizarOpcao(item);

        return { ...opcao, selected: marcados.has(opcao.value), hidden: false };
    });

    const vieram = new Set(opcoes.map((opcao) => opcao.value));

    escolhidas.forEach((escolhida) => {
        const valor = String(escolhida.value);

        if (! vieram.has(valor)) {
            vieram.add(valor);
            opcoes.push({ ...normalizarOpcao(escolhida), selected: true, hidden: true });
        }
    });

    return opcoes;
}

/**
 * Se a linha do painel some com o termo digitado na busca (já passado
 * por `paraBusca`).
 *
 * No filtro local, fica quem tem o termo no texto de busca (o rótulo e a
 * segunda linha). Na busca no servidor, quem filtra é ele: aqui só a
 * opção vazia (a do placeholder, que limpa a escolha) sai da frente do
 * resultado, para o Enter escolher a primeira que veio.
 *
 * @param {{valor: string, busca: string}} linha
 * @param {string} termo
 * @param {boolean} remota
 */
export function ficaEscondida({ valor, busca }, termo, remota) {
    if (termo === '') {
        return false;
    }

    if (remota) {
        return valor === '';
    }

    return ! busca.includes(termo);
}

/**
 * A escolha que uma `<option>` representa, como a tela a recebe: o
 * valor, o rótulo (sem o recuo do hierárquico), a segunda linha e os
 * dados. A opção vazia (o placeholder) não é escolha: `null`.
 *
 * @param {{value: string, textContent: string, dataset: {caption?: string, extra?: string}}|null|undefined} opcao
 * @returns {{value: string, label: string, caption: string|null, extra: object|null}|null}
 */
export function escolhaDaOpcao(opcao) {
    if (! opcao || opcao.value === '') {
        return null;
    }

    return {
        value: opcao.value,
        label: String(opcao.textContent ?? '').trim(),
        caption: opcao.dataset?.caption || null,
        extra: lerExtra(opcao.dataset?.extra),
    };
}

/**
 * As escolhas de um select de várias (`multiple`), como a tela as
 * recebe: três listas na ordem das opções, uma posição por escolhida —
 * o valor, o rótulo (sem o recuo) e os dados (`null` na que não tem).
 * A opção vazia não entra. Sem escolha nenhuma, as três vêm vazias, e
 * nunca `null`.
 *
 * @param {Iterable<{value: string, textContent: string, dataset: {caption?: string, extra?: string}}>} opcoes  as marcadas (`selectedOptions`)
 * @returns {{values: string[], labels: string[], extras: Array<object|null>}}
 */
export function escolhasDasOpcoes(opcoes) {
    const lista = Array.from(opcoes ?? [], (opcao) => escolhaDaOpcao(opcao)).filter((escolha) => escolha !== null);

    return {
        values: lista.map((escolha) => escolha.value),
        labels: lista.map((escolha) => escolha.label),
        extras: lista.map((escolha) => escolha.extra),
    };
}

/**
 * Põe ou tira um valor da lista das escolhas: o que estava sai, o que
 * não estava entra no fim. Devolve uma lista nova, de textos.
 *
 * @param {Array<string|number>} valores
 * @param {string|number} valor
 * @returns {string[]}
 */
export function alternarValor(valores, valor) {
    const lista = Array.from(valores ?? [], String);
    const texto = String(valor);

    return lista.includes(texto) ? lista.filter((item) => item !== texto) : [...lista, texto];
}

/**
 * Os chips do gatilho no select de várias: um por opção escolhida, com o
 * valor (é por ele que o "×" a tira) e o texto — o caminho no
 * hierárquico, senão o rótulo, como no gatilho do simples. A opção
 * vazia não vira chip.
 *
 * @param {Iterable<{value: string, textContent: string, dataset: {caminho?: string}}>} opcoes  as marcadas (`selectedOptions`)
 * @returns {Array<{value: string, label: string}>}
 */
export function chipsDasOpcoes(opcoes) {
    return Array.from(opcoes ?? [])
        .filter((opcao) => opcao.value !== '')
        .map((opcao) => ({ value: opcao.value, label: String(opcao.dataset?.caminho ?? opcao.textContent ?? '').trim() }));
}

/*
 * A escolha de cada select, guardada quando ela muda: o `extra` já lido
 * do JSON, e o mesmo objeto para o evento e para quem perguntar depois.
 * Vale enquanto a `<option>` marcada for a mesma; se outro script trocar
 * o valor (`select.value = x`) ou a busca reescrever as opções, a
 * escolha é lida de novo do `<option>`.
 */
const escolhas = new WeakMap();

/**
 * A opção escolhida num select, com a segunda linha e os dados:
 * `{ value, label, caption, extra }`, ou `null` sem escolha. Serve a
 * qualquer hora, inclusive para a que veio marcada do servidor (lida do
 * `data-caption` e do `data-extra` dela).
 *
 * No select de várias (`multiple`), as listas das escolhidas:
 * `{ values, labels, extras }` (ver `escolhasDasOpcoes`), vazias quando
 * não há nenhuma — nunca `null`.
 *
 * @param {HTMLSelectElement} nativo  o `<select>` (o `[data-seletor-nativo]`)
 * @returns {{value: string, label: string, caption: string|null, extra: object|null}|{values: string[], labels: string[], extras: Array<object|null>}|null}
 */
export function escolhaDe(nativo) {
    if (nativo?.multiple) {
        // Guardada enquanto as marcadas forem as mesmas, uma a uma.
        const marcadas = Array.from(nativo.selectedOptions ?? []);
        const guardada = escolhas.get(nativo);

        if (guardada?.opcoes?.length === marcadas.length && guardada.opcoes.every((opcao, i) => opcao === marcadas[i])) {
            return guardada.escolha;
        }

        const escolha = escolhasDasOpcoes(marcadas);
        escolhas.set(nativo, { opcoes: marcadas, escolha });

        return escolha;
    }

    const opcao = nativo?.selectedOptions?.[0] ?? null;

    if (opcao === null) {
        return null;
    }

    const guardada = escolhas.get(nativo);

    if (guardada?.opcao === opcao) {
        return guardada.escolha;
    }

    const escolha = escolhaDaOpcao(opcao);
    escolhas.set(nativo, { opcao, escolha });

    return escolha;
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
    // O rodapé do painel no select de várias.
    const limpar = campo.querySelector('[data-seletor-limpar]');
    const concluir = campo.querySelector('[data-seletor-concluir]');

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

    // Várias escolhas: quem diz é o nativo (`<select multiple>`), como para todo o resto.
    const multiplo = nativo.multiple;

    // Lido na hora: outro script pode pôr ou tirar depois (o observador abaixo redesenha o gatilho).
    const soLeitura = () => nativo.hasAttribute('data-readonly') || nativo.hasAttribute('readonly');
    // Desligado ou só leitura, nada aqui muda a escolha.
    const travado = () => nativo.disabled || soLeitura();

    /** Os valores escolhidos agora, na ordem das opções (as escondidas pela busca inclusive). */
    const valoresEscolhidos = () => Array.from(nativo.selectedOptions, (opcao) => opcao.value).filter((valor) => valor !== '');

    /*
     * Os chips do select de várias: um por escolhida, com o "×" que a
     * tira (desligado, sem ele). O "×" é um `<span>`, e não um botão: ele
     * mora dentro do gatilho, que já é um botão. As mesmas classes estão
     * no select.blade.php, que desenha os primeiros.
     *
     * Aberto, o painel acompanha: a caixa de cada opção (pelo
     * `aria-selected`) e a posição, porque o gatilho cresce com os chips.
     */
    const desenharChips = () => {
        const chips = chipsDasOpcoes(nativo.selectedOptions);

        texto.textContent = '';
        texto.classList.toggle('text-neutral-400', chips.length === 0);

        if (chips.length === 0) {
            texto.textContent = texto.dataset.seletorPlaceholder || ' ';
        }

        chips.forEach(({ value, label }) => {
            const chip = document.createElement('span');
            chip.className = 'inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';
            chip.dataset.seletorChip = value;

            const rotulo = document.createElement('span');
            rotulo.className = 'truncate';
            rotulo.textContent = label;
            chip.append(rotulo);

            if (! travado()) {
                const tirar = document.createElement('span');
                tirar.className = '-me-0.5 cursor-pointer rounded-full px-0.5 leading-none text-neutral-400 hover:text-neutral-700 dark:hover:text-white';
                tirar.dataset.seletorTirar = value;
                tirar.tabIndex = -1;
                tirar.title = `Tirar ${label}`;
                tirar.setAttribute('aria-hidden', 'true');
                tirar.textContent = '×';
                chip.append(tirar);
            }

            texto.append(chip);
        });

        if (limpar) {
            limpar.disabled = chips.length === 0 || travado();
        }

        const marcados = new Set(chips.map((chip) => chip.value));

        lista.querySelectorAll('[data-seletor-valor]').forEach((botao) => {
            botao.setAttribute('aria-selected', String(marcados.has(botao.dataset.seletorValor)));
        });

        if (! painel.hidden) {
            flutuante.posicionar();
        }
    };

    const desenharGatilho = () => {
        gatilho.setAttribute('aria-disabled', String(nativo.disabled));
        gatilho.tabIndex = nativo.disabled ? -1 : 0;

        // Só leitura fica no Tab (como um input só de leitura): dá para chegar nele e ler o valor.
        if (soLeitura()) {
            gatilho.setAttribute('aria-readonly', 'true');
        } else {
            gatilho.removeAttribute('aria-readonly');
        }

        if (multiplo) {
            desenharChips();

            return;
        }

        const opcao = nativo.selectedOptions[0];
        const temValor = opcao && opcao.value !== '';

        texto.textContent = rotuloDe(opcao) || ' ';
        texto.classList.toggle('text-neutral-400', ! temValor);
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
        attributeFilter: ['disabled', 'readonly', 'data-readonly'],
        childList: true,
        subtree: true,
    });

    /*
     * A caixa da opção no select de várias: o desenho do `x-ui.checkbox
     * bare` (o `sm`), só em CSS, sem `<input>` — quem guarda o estado é o
     * `<option>` do nativo. Ela acende pelo `aria-selected` da linha
     * (`group/opcao`): alternar só troca o atributo, e o painel não se
     * remonta (o foco e a rolagem ficam onde estavam).
     */
    const caixaDaOpcao = () => {
        const caixa = document.createElement('span');

        caixa.setAttribute('aria-hidden', 'true');
        caixa.className = [
            'flex size-4 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-white',
            'dark:border-neutral-600 dark:bg-neutral-900',
            'group-aria-selected/opcao:border-primary-600 group-aria-selected/opcao:bg-primary-600',
        ].join(' ');
        caixa.innerHTML = '<svg class="size-3 opacity-0 group-aria-selected/opcao:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

        return caixa;
    };

    /** Uma linha do painel para uma `<option>` do nativo. */
    const linha = (opcao) => {
        const botao = document.createElement('button');
        const nivel = Number(opcao.dataset.nivel ?? 0);
        const escolhida = opcao.selected && opcao.value !== '';
        const caption = opcao.dataset.caption ?? '';

        botao.type = 'button';
        botao.setAttribute('role', 'option');
        botao.dataset.seletorValor = opcao.value;
        // A busca local casa no rótulo e na segunda linha (o código do produto, por exemplo).
        botao.dataset.seletorBusca = paraBusca(`${rotuloDe(opcao)} ${caption}`);
        botao.setAttribute('aria-selected', String(escolhida));
        botao.disabled = opcao.disabled;
        botao.className = [
            'flex w-full cursor-pointer items-center gap-2 rounded-lg py-2 pe-2.5 text-start text-sm',
            'text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none',
            'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800',
            'disabled:cursor-not-allowed disabled:opacity-40',
            // Nas várias, quem mostra a escolha é a caixa; a linha não se pinta.
            multiplo ? 'group/opcao' : (escolhida ? marca : ''),
            nivel > 0 ? '' : 'ps-2.5',
            // O pai de uma árvore em negrito: é o que organiza os de baixo.
            opcao.dataset.nivel === '0' ? 'font-medium text-neutral-900 dark:text-white' : '',
        ].join(' ');

        // O recuo acompanha o nível; a guia desenha de quem ele é filho (nas várias, a caixa faz esse papel).
        if (nivel > 0) {
            botao.style.paddingInlineStart = `${0.625 + nivel * 1.1}rem`;

            if (! multiplo) {
                const guia = document.createElement('span');
                guia.className = 'size-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600';
                botao.append(guia);
            }
        }

        if (multiplo) {
            botao.append(caixaDaOpcao());
        }

        const rotulo = document.createElement('span');
        rotulo.textContent = opcao.textContent.trim();

        if (caption === '') {
            rotulo.className = 'min-w-0 flex-1 truncate';
            botao.append(rotulo);
        } else {
            // Duas linhas: o rótulo e, embaixo, em letra menor, a segunda linha.
            const textos = document.createElement('span');
            textos.className = 'flex min-w-0 flex-1 flex-col';

            const legenda = document.createElement('span');
            legenda.className = 'truncate text-xs text-neutral-500 dark:text-neutral-400';
            legenda.textContent = caption;

            rotulo.className = 'truncate text-sm';
            textos.append(rotulo, legenda);
            botao.append(textos);
        }

        if (escolhida && ! multiplo) {
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

    /*
     * Busca no servidor (`source` no componente): as opções vêm da URL,
     * não do HTML. Ao abrir, as primeiras; ao digitar, depois de uma
     * pausa, as que batem — a busca anterior é cancelada. O resultado
     * reescreve as opções do nativo, e o painel se monta dele como sempre.
     *
     * Com `prefetch`, as primeiras são buscadas já ao ligar e ficam
     * guardadas: o painel abre com elas, sem esperar nem buscar de novo,
     * até alguém digitar.
     */
    const fonte = campo.dataset.seletorFonte;
    const preBusca = fonte !== undefined && campo.dataset.seletorPreBusca !== undefined;
    const textoDoVazio = vazio?.textContent.trim() ?? '';
    let busca = null;
    let pausa = null;
    // O termo da busca em andamento (`null` sem busca), e se o nativo tem as primeiras opções.
    let termoEmBusca = null;
    let temPrimeiras = false;
    // Enter digitado antes de a busca voltar: escolhe a primeira quando ela chegar.
    let enterPendente = false;

    // Na busca no servidor, a opção vazia não é resultado: com ela sozinha, "Nada encontrado".
    const temResultado = () => opcoesVisiveis().some((botao) => ! fonte || botao.dataset.seletorValor !== '');

    const mostrarAviso = (mensagem) => {
        if (vazio) {
            vazio.textContent = mensagem;
            vazio.classList.remove('hidden');
        }
    };

    const filtrar = () => {
        const termo = paraBusca(filtro?.value);

        lista.querySelectorAll('[data-seletor-valor]').forEach((botao) => {
            botao.hidden = ficaEscondida({ valor: botao.dataset.seletorValor, busca: botao.dataset.seletorBusca }, termo, Boolean(fonte));
        });

        // O título do grupo some junto com as opções dele.
        lista.querySelectorAll('[data-seletor-grupo]').forEach((grupo) => {
            grupo.hidden = ! grupo.querySelector('[data-seletor-valor]:not([hidden])');
        });

        if (vazio) {
            vazio.textContent = textoDoVazio;
        }

        vazio?.classList.toggle('hidden', temResultado());
    };

    const aplicarResultado = (itens) => {
        /*
         * A escolhida que não vier na busca continua, escondida, com a
         * segunda linha e os dados que tinha — no select de várias, cada
         * uma delas.
         */
        const escolhidas = Array.from(nativo.selectedOptions, (opcao) => escolhaDaOpcao(opcao)).filter((escolhida) => escolhida !== null);
        const vaga = Array.from(nativo.options).find((opcao) => opcao.value === '');

        nativo.textContent = '';

        if (vaga) {
            nativo.append(vaga);
        }

        mesclarVarias(escolhidas, itens).forEach((item) => {
            const opcao = new Option(item.label, item.value, item.selected, item.selected);
            const extra = textoDoExtra(item.extra);

            opcao.hidden = item.hidden;

            if (item.caption !== undefined) {
                opcao.dataset.caption = item.caption;
            }

            if (extra !== null) {
                opcao.dataset.extra = extra;
            }

            nativo.append(opcao);
        });
    };

    const buscarNoServidor = async (termo) => {
        busca?.abort();

        const controle = new AbortController();
        busca = controle;
        termoEmBusca = termo;
        mostrarAviso('Buscando…');

        try {
            // A URL é lida a cada busca: a tela pode trocar `data-seletor-fonte` depois (outro depósito, outro filtro).
            const resposta = await fetch(urlDaBusca(campo.dataset.seletorFonte ?? fonte, termo, window.location.href), {
                headers: { Accept: 'application/json' },
                signal: controle.signal,
            });

            if (! resposta.ok) {
                throw new Error(`HTTP ${resposta.status}`);
            }

            aplicarResultado(await resposta.json());
            temPrimeiras = termo === '';
            montarLista();
            filtrar();

            if (enterPendente) {
                enterPendente = false;

                const primeira = opcoesVisiveis()[0];

                if (primeira && aberto()) {
                    agir(primeira.dataset.seletorValor);
                }
            }
        } catch (erro) {
            if (erro.name !== 'AbortError') {
                enterPendente = false;
                mostrarAviso('Não foi possível buscar. Tente de novo.');
            }
        } finally {
            if (busca === controle) {
                busca = null;
                termoEmBusca = null;
            }
        }
    };

    /** Ao abrir: as primeiras opções, buscadas agora, a caminho ou já guardadas. */
    const pedirPrimeiras = () => {
        if (termoEmBusca === '') {
            mostrarAviso('Buscando…');

            return;
        }

        if (preBusca && temPrimeiras && termoEmBusca === null) {
            return;
        }

        buscarNoServidor('');
    };

    const flutuante = painelFlutuante(gatilho, painel);

    const aberto = () => ! painel.hidden;

    const fechar = ({ focar = false } = {}) => {
        clearTimeout(pausa);
        pausa = null;
        enterPendente = false;

        flutuante.fechar();
        gatilho.setAttribute('aria-expanded', 'false');

        if (focar) {
            gatilho.focus();
        }
    };

    const abrir = () => {
        if (travado()) {
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

        if (fonte) {
            pedirPrimeiras();
        }
    };

    /** Avisa a mudança como o nativo faria (`input`, `change`), e depois com os dados da escolha. */
    const avisar = () => {
        nativo.dispatchEvent(new Event('input', { bubbles: true }));
        nativo.dispatchEvent(new Event('change', { bubbles: true }));

        /*
         * Depois do `change`, a escolha com a segunda linha e os dados
         * (o preço e a unidade do produto, para a tela preencher os
         * outros campos). `escolhaDe` a guarda para quem perguntar
         * depois; limpar a escolha também avisa, com o valor vazio. No
         * select de várias, o detalhe são as listas
         * (`{ values, labels, extras }`), vazias quando nada ficou.
         */
        nativo.dispatchEvent(new CustomEvent('ui:selecionado', {
            bubbles: true,
            detail: escolhaDe(nativo) ?? { value: '', label: '', caption: null, extra: null },
        }));
    };

    const escolher = (valor) => {
        const mudou = nativo.value !== valor;

        nativo.value = valor;

        // Como o nativo faria: só avisa quando a escolha mudou de fato.
        if (mudou) {
            avisar();
        }

        fechar({ focar: true });
    };

    /*
     * No select de várias, a escolha é uma lista: cada `<option>` do
     * nativo fica marcada se o valor dela está em `novos`. Avisa como o
     * simples, e só quando alguma mudou; o painel fica aberto. Os chips
     * e as caixas se redesenham pelo `change`.
     */
    const definirValores = (novos) => {
        const marcados = new Set(novos);
        let mudou = false;

        for (const opcao of nativo.options) {
            const marcar = opcao.value !== '' && marcados.has(opcao.value);

            if (opcao.selected !== marcar) {
                opcao.selected = marcar;
                mudou = true;
            }
        }

        if (mudou) {
            avisar();
        }
    };

    /** O clique (ou o Enter) numa opção: no simples, escolhe e fecha; nas várias, alterna. */
    const agir = (valor) => (multiplo ? definirValores(alternarValor(valoresEscolhidos(), valor)) : escolher(valor));

    gatilho.addEventListener('click', (evento) => {
        // O "×" de um chip tira aquela escolha, sem abrir nem fechar o painel.
        const tirar = evento.target.closest('[data-seletor-tirar]');

        if (! tirar) {
            if (aberto()) {
                fechar();
            } else {
                abrir();
            }

            return;
        }

        if (! travado()) {
            definirValores(valoresEscolhidos().filter((valor) => valor !== tirar.dataset.seletorTirar));

            if (! aberto()) {
                gatilho.focus();
            }
        }
    });

    // Clicar no "×" não puxa o foco: com o painel aberto, ele fica na busca ou na opção.
    gatilho.addEventListener('mousedown', (evento) => {
        if (evento.target.closest('[data-seletor-tirar]')) {
            evento.preventDefault();
        }
    });

    limpar?.addEventListener('click', () => {
        definirValores([]);

        // Sem escolhas, o "Limpar" se desliga e perde o foco: ele vai para a busca, ou para a primeira opção.
        (filtro ?? opcoesVisiveis()[0])?.focus();
    });

    concluir?.addEventListener('click', () => fechar({ focar: true }));

    gatilho.addEventListener('keydown', (evento) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(evento.key)) {
            evento.preventDefault();
            abrir();
        }
    });

    lista.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-seletor-valor]');

        if (botao && ! botao.disabled) {
            agir(botao.dataset.seletorValor);
        }
    });

    filtro?.addEventListener('input', () => {
        if (! fonte) {
            filtrar();

            return;
        }

        clearTimeout(pausa);
        pausa = setTimeout(() => {
            pausa = null;
            buscarNoServidor(filtro.value);
        }, ESPERA_DA_BUSCA);
    });

    // As setas andam pelas opções visíveis; Enter no filtro escolhe a primeira (nas várias, alterna).
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

            // A busca ainda não voltou: escolhe quando ela chegar, e não numa lista velha.
            if (fonte && (pausa !== null || termoEmBusca !== null)) {
                enterPendente = true;

                return;
            }

            if (opcoes[0]) {
                agir(opcoes[0].dataset.seletorValor);
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

    /*
     * Um clique fora fecha, como em qualquer menu. "Fora" pelo caminho
     * do clique, e não por `contains`: o chip cujo "×" foi clicado já
     * saiu da página quando o clique chega aqui.
     */
    document.addEventListener('click', (evento) => {
        const caminho = evento.composedPath();

        if (aberto() && ! caminho.includes(campo) && ! caminho.includes(painel)) {
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

    if (preBusca) {
        buscarNoServidor('');
    }
}

// Fora do navegador (os testes, no Node), não há `window`.
if (typeof window !== 'undefined') {
    window.ligarSeletores = ligarSeletores;
}

export { ligarSeletores };
