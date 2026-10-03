/*
 * A lista que se reordena (`data-arrastavel`).
 *
 * O envelope declara `data-arrastavel`; cada filho que se move é um
 * `[data-arrastavel-item]`, com o `data-arrastavel-id` que a tela
 * reconhece (o id do registro, a chave da coluna):
 *
 *     <ul data-arrastavel>
 *         <li data-arrastavel-item data-arrastavel-id="12">…</li>
 *         <li data-arrastavel-item data-arrastavel-id="15">…</li>
 *     </ul>
 *
 * Três jeitos de mover, todos levando ao mesmo lugar:
 *
 * - arrastar e soltar, com o drag and drop nativo (`draggable`): quem
 *   está sendo arrastado ganha `data-arrastando`, e o item sobre o qual
 *   o mouse está ganha `data-arrastavel-alvo="antes|depois"`, conforme a
 *   metade em que ele está — o theme.css desenha a linha de destino;
 * - o teclado: Alt+↑ e Alt+↓ com o foco no item (ou num campo dele,
 *   menos o `<select>` nativo, em que Alt+↓ abre a lista);
 * - os botões `[data-arrastavel-subir]` e `[data-arrastavel-descer]`
 *   dentro do item, se a tela os desenhar — desligados nas pontas, e
 *   sem enviar o formulário em volta, mesmo sem `type="button"`.
 *
 * Cada mudança dispara `ui:reordenado` no envelope (sobe pelo DOM), com
 * `detail: { item, de, para, ordem }` — `de` e `para` são as posições, e
 * `ordem` a lista dos ids na ordem nova. É tudo o que o módulo faz: os
 * `name`s dos campos não são renumerados (a ordem enviada é a da tela,
 * como no repetidor), e gravar a ordem é da tela — pelo evento, num
 * `fetch` ou num campo escondido por item.
 *
 * Na linha que tem campos de texto, ponha uma alça: com
 * `[data-arrastavel-alca]` dentro do item, só ela começa o arrasto, e
 * selecionar texto num campo volta a funcionar (num `draggable`, o
 * navegador toma o gesto para si).
 *
 * O toque não é garantido: arrastar com o dedo pelo drag and drop
 * nativo depende do navegador e da versão do celular, e onde existe
 * pede um toque longo que a pessoa não adivinha. Lá valem os botões —
 * desenhe-os onde a ordem importa no celular. Uma biblioteca de arrasto
 * por toque fica para o projeto que precisar; o evento é o mesmo.
 *
 * Tudo no `document`, uma vez: o envelope e o item que chegam depois
 * (o modal carregado sem recarregar) já funcionam — o item fica pronto
 * (`draggable`) no primeiro clique nele. Chamar `ligarArrastaveis(raiz)`
 * com o que chegou (o envelope, ou o item novo) adianta isso e acerta os
 * botões das pontas.
 */

// --- Regras ---

/**
 * Onde o item que estava em `de` fica depois de solto sobre o item que
 * está em `alvo`: antes dele (`depois = false`) ou depois (`depois =
 * true`). As posições são as de antes do movimento; a resposta é a de
 * depois. Soltar sobre si mesmo é ficar onde está.
 */
export function indiceAoSoltar(de, alvo, depois = false) {
    if (alvo === de) {
        return de;
    }

    if (depois) {
        return alvo > de ? alvo : alvo + 1;
    }

    return alvo > de ? alvo - 1 : alvo;
}

/** A lista com o item de `de` posto em `para` (uma lista nova; a de entrada não muda). */
export function reordenar(lista, de, para) {
    const copia = [...lista];

    if (de < 0 || de >= copia.length || para < 0 || para >= copia.length || de === para) {
        return copia;
    }

    const [item] = copia.splice(de, 1);
    copia.splice(para, 0, item);

    return copia;
}

/**
 * O passo que a tecla pede: −1 para cima, +1 para baixo, `null` para o
 * resto. Só ↑ e ↓, também na lista horizontal: Alt+← e Alt+→ são o
 * voltar e o avançar do navegador, e tomá-los seria uma surpresa.
 */
export function passoPelaTecla(tecla) {
    switch (tecla) {
        case 'ArrowUp':
            return -1;
        case 'ArrowDown':
            return 1;
        default:
            return null;
    }
}

/**
 * De que lado do alvo o ponteiro está: na primeira metade, o item
 * solto fica `antes`; na segunda, `depois`. `posicao` e `inicio` são a
 * coordenada do ponteiro e a do começo do alvo (y na lista vertical, x
 * na horizontal), e `tamanho` a altura (ou largura) dele.
 */
export function ladoDoAlvo(posicao, inicio, tamanho) {
    return posicao - inicio < tamanho / 2 ? 'antes' : 'depois';
}

/** Os ids dos itens, na ordem — `null` no item sem `data-arrastavel-id`. */
export function ordemDe(itens) {
    return Array.from(itens ?? [], (item) => item?.dataset?.arrastavelId ?? null);
}

// --- O DOM ---

/** O que já recebe foco dentro de um item: com isso, o item não precisa de `tabindex` próprio. */
const FOCAVEIS = 'input:not([type="hidden"]), select, textarea, button, a[href], [tabindex], [contenteditable]';

/** O item sendo arrastado e o envelope dele; `null` fora de um arrasto. */
let arrastando = null;

/** O item cujo `draggable` foi desligado por um clique fora da alça, para voltar no `mouseup`. */
let itemSemAlca = null;

function envelopeDe(item) {
    return item?.closest('[data-arrastavel]') ?? null;
}

/** O item que contém o elemento, dentro de um envelope; `null` fora de um. */
function itemDe(elemento) {
    const item = elemento instanceof Element ? elemento.closest('[data-arrastavel-item]') : null;

    return item && envelopeDe(item) ? item : null;
}

/** Os itens do envelope, e só dele (não os de um envelope dentro de um item). */
function itensDe(envelope) {
    return [...envelope.querySelectorAll('[data-arrastavel-item]')].filter((item) => envelopeDe(item) === envelope);
}

/** O mesmo, para os elementos de um item. */
function doItem(item, seletor) {
    return [...item.querySelectorAll(seletor)].filter((elemento) => elemento.closest('[data-arrastavel-item]') === item);
}

function horizontal(envelope) {
    return envelope.dataset.arrastavel === 'horizontal';
}

/**
 * Deixa o item pronto: arrastável, e no Tab quando não há nada dentro
 * dele que já esteja — senão Alt+↑ não teria onde pôr o foco.
 */
function preparar(item) {
    if (! item.hasAttribute('draggable')) {
        item.draggable = true;
    }

    if (! item.hasAttribute('tabindex') && ! item.querySelector(FOCAVEIS)) {
        item.tabIndex = 0;
    }
}

function limparAlvos(envelope) {
    envelope.querySelectorAll('[data-arrastavel-alvo]').forEach((item) => {
        delete item.dataset.arrastavelAlvo;
    });
}

/** Os botões de subir e descer de cada item: desligados nas pontas. */
function atualizar(envelope) {
    const itens = itensDe(envelope);

    itens.forEach((item, posicao) => {
        doItem(item, '[data-arrastavel-subir]').forEach((botao) => {
            botao.disabled = posicao === 0;
        });

        doItem(item, '[data-arrastavel-descer]').forEach((botao) => {
            botao.disabled = posicao === itens.length - 1;
        });
    });
}

function avisar(envelope, item, de, para) {
    envelope.dispatchEvent(new CustomEvent('ui:reordenado', {
        bubbles: true,
        detail: { item, de, para, ordem: ordemDe(itensDe(envelope)) },
    }));
}

/**
 * Move o item um passo (−1 sobe, +1 desce) — pelo teclado ou pelos
 * botões. Quem muda de lugar é a vizinha: o item com o foco fica onde
 * está no DOM, e o foco não se perde (tirar um elemento da página, mesmo
 * que para pô-lo logo adiante, leva o foco para o `<body>`).
 */
function moverPasso(envelope, item, passo) {
    const itens = itensDe(envelope);
    const de = itens.indexOf(item);
    const vizinha = itens[de + passo];

    if (de === -1 || ! vizinha) {
        return false;
    }

    if (passo < 0) {
        item.after(vizinha);
    } else {
        item.before(vizinha);
    }

    atualizar(envelope);
    avisar(envelope, item, de, de + passo);

    return true;
}

/** Solta o item sobre o alvo, do lado dito (`antes`/`depois`). */
function soltar(envelope, item, alvo, lado) {
    const itens = itensDe(envelope);
    const de = itens.indexOf(item);
    const para = indiceAoSoltar(de, itens.indexOf(alvo), lado === 'depois');

    if (de === -1 || para === de) {
        return;
    }

    if (lado === 'depois') {
        alvo.after(item);
    } else {
        alvo.before(item);
    }

    atualizar(envelope);
    avisar(envelope, item, de, para);
}

/** De que lado do alvo o ponteiro do evento está, na direção da lista. */
function ladoDoEvento(envelope, alvo, evento) {
    const caixa = alvo.getBoundingClientRect();

    return horizontal(envelope)
        ? ladoDoAlvo(evento.clientX, caixa.left, caixa.width)
        : ladoDoAlvo(evento.clientY, caixa.top, caixa.height);
}

/*
 * O clique que antecede o arrasto: o item fica pronto (o que chegou
 * depois do `ligarArrastaveis` inclusive) e, se tem alça, só ela
 * arrasta — fora dela o `draggable` sai até o botão do mouse subir, e
 * o navegador trata o gesto como sempre (selecionar texto num campo).
 */
function aoPressionar(evento) {
    // O botão solto fora da janela não chega como `mouseup`: o item da vez anterior volta aqui.
    aoSoltarOMouse();

    const item = itemDe(evento.target);

    if (! item) {
        return;
    }

    preparar(item);

    const alca = doItem(item, '[data-arrastavel-alca]')[0];

    if (alca && ! alca.contains(evento.target)) {
        item.draggable = false;
        itemSemAlca = item;
    }
}

function aoSoltarOMouse() {
    if (itemSemAlca) {
        itemSemAlca.draggable = true;
        itemSemAlca = null;
    }
}

function aoComecar(evento) {
    const item = itemDe(evento.target);

    if (! item) {
        return;
    }

    arrastando = { item, envelope: envelopeDe(item) };
    item.dataset.arrastando = '';

    if (evento.dataTransfer) {
        evento.dataTransfer.effectAllowed = 'move';
        // O Firefox só arrasta com algum dado a bordo; o id serve, e é o que outra janela leria.
        evento.dataTransfer.setData('text/plain', item.dataset.arrastavelId ?? '');
    }
}

function aoPassar(evento) {
    const alvo = itemDe(evento.target);

    if (! arrastando || ! alvo || envelopeDe(alvo) !== arrastando.envelope) {
        return;
    }

    // Sem o `preventDefault` no `dragover`, o navegador não deixa soltar.
    evento.preventDefault();

    if (evento.dataTransfer) {
        evento.dataTransfer.dropEffect = 'move';
    }

    if (alvo === arrastando.item) {
        limparAlvos(arrastando.envelope);

        return;
    }

    const lado = ladoDoEvento(arrastando.envelope, alvo, evento);

    if (alvo.dataset.arrastavelAlvo !== lado) {
        limparAlvos(arrastando.envelope);
        alvo.dataset.arrastavelAlvo = lado;
    }
}

function aoSair(evento) {
    const alvo = itemDe(evento.target);

    // Saiu do item de verdade (e não de um filho para outro): a marca sai com ele.
    if (alvo && arrastando && ! alvo.contains(evento.relatedTarget)) {
        delete alvo.dataset.arrastavelAlvo;
    }
}

function aoSoltar(evento) {
    const alvo = itemDe(evento.target);

    if (! arrastando || ! alvo || envelopeDe(alvo) !== arrastando.envelope) {
        return;
    }

    evento.preventDefault();

    const { item, envelope } = arrastando;

    limparAlvos(envelope);

    if (alvo !== item) {
        soltar(envelope, item, alvo, ladoDoEvento(envelope, alvo, evento));
    }
}

/** O fim do arrasto, solto onde for (fora da lista inclusive): as marcas saem. */
function aoTerminar() {
    if (! arrastando) {
        return;
    }

    delete arrastando.item.dataset.arrastando;
    limparAlvos(arrastando.envelope);
    arrastando = null;
}

function aoTeclar(evento) {
    if (! evento.altKey || evento.ctrlKey || evento.metaKey || evento.defaultPrevented) {
        return;
    }

    const passo = passoPelaTecla(evento.key);
    const item = itemDe(evento.target);

    // No `<select>` nativo, Alt+↓ abre a lista (no Windows): a tecla é dele.
    if (passo === null || ! item || evento.target.tagName === 'SELECT') {
        return;
    }

    evento.preventDefault();
    moverPasso(envelopeDe(item), item, passo);
}

function aoClicar(evento) {
    const botao = evento.target.closest('[data-arrastavel-subir], [data-arrastavel-descer]');
    const item = itemDe(botao);

    if (! item || botao.closest('[data-arrastavel-item]') !== item) {
        return;
    }

    // O botão sem `type` num formulário é de envio: mover não pode mandar o formulário.
    evento.preventDefault();

    const sobe = botao.dataset.arrastavelSubir !== undefined;

    moverPasso(envelopeDe(item), item, sobe ? -1 : 1);

    // Chegou à ponta: o botão apertado desligou, e o foco passa para o do outro sentido.
    if (botao.disabled) {
        doItem(item, sobe ? '[data-arrastavel-descer]' : '[data-arrastavel-subir]')[0]?.focus();
    }
}

let escutando = false;

/** Os elementos de `raiz` que casam com o seletor — ela inclusive, quando é um deles (o item novo). */
function dentroDe(raiz, seletor) {
    const proprio = raiz instanceof Element && raiz.matches(seletor) ? [raiz] : [];

    return [...proprio, ...raiz.querySelectorAll(seletor)];
}

/**
 * Os ouvintes ficam no `document`, uma vez só. Para cada envelope e
 * item de `raiz` (ela inclusive), os itens ficam prontos e os botões
 * das pontas, acertados — também os do envelope em volta do item que
 * chegou depois. Chamada de novo, só prepara o que falta.
 */
export function ligarArrastaveis(raiz = document) {
    if (! escutando) {
        escutando = true;

        document.addEventListener('mousedown', aoPressionar);
        document.addEventListener('mouseup', aoSoltarOMouse);
        document.addEventListener('dragstart', aoComecar);
        document.addEventListener('dragover', aoPassar);
        document.addEventListener('dragleave', aoSair);
        document.addEventListener('drop', aoSoltar);
        document.addEventListener('dragend', aoTerminar);
        document.addEventListener('keydown', aoTeclar);
        document.addEventListener('click', aoClicar);
    }

    const envelopes = new Set(dentroDe(raiz, '[data-arrastavel]'));

    dentroDe(raiz, '[data-arrastavel-item]').forEach((item) => {
        const envelope = envelopeDe(item);

        if (envelope) {
            envelopes.add(envelope);
            preparar(item);
        }
    });

    envelopes.forEach(atualizar);
}
