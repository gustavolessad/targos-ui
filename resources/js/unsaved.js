/*
 * O aviso de alterações não salvas.
 *
 * O formulário declara `data-nao-salvo`:
 *
 *     <form method="POST" action="…" data-nao-salvo>…</form>
 *
 * Ao ligar, o módulo tira a "fotografia" do formulário — o que ele
 * enviaria naquele instante (`new FormData`) — e, quando a pessoa vai
 * sair da página, compara com a de agora. Diferentes, o formulário está
 * sujo, e a saída pergunta antes:
 *
 * - um link para outra página do sistema, na mesma janela, ou o envio de
 *   OUTRO formulário da página: o modal de confirmação do painel
 *   (`confirmar()`), "Sair e descartá-las?". Confirmado, segue; senão,
 *   fica;
 * - o resto (fechar a aba, recarregar, digitar outro endereço, um link
 *   para fora do sistema): o aviso do próprio navegador, pelo
 *   `beforeunload`. O texto é dele, e não se troca.
 *
 * A comparação é feita na hora de sair, e não a cada tecla: digitar não
 * custa nada, e voltar ao valor de antes deixa o formulário limpo de
 * novo — inclusive pelo `form.reset()`.
 *
 * O envio do próprio formulário o libera (`data-nao-salvo-liberado`): é
 * ele que salva. Voltando pelo histórico (`pageshow` do cache), o aviso
 * volta a valer.
 *
 * - `data-sem-aviso` num link, num formulário ou no botão que o envia:
 *   sai sem perguntar, nem pelo modal nem pelo navegador ("Descartar
 *   alterações").
 * - `data-nao-salvo-sujo` no formulário: ele já nasce sujo. É o que
 *   voltou do servidor com erro de validação — o que está na tela veio
 *   do `old()`, e não foi salvo.
 * - Quem salva por `fetch` e continua na tela chama `marcarSalvo(form)`:
 *   o que está nela vira a nova fotografia.
 *
 * Ligado depois do `ligarConfirmacoes()` e antes do `ligarEnvios()`
 * (ver `ligarUi`): o envio que outro módulo segura para perguntar chega
 * aqui já segurado, e o que este segura não chega a mostrar
 * "carregando".
 */
import { confirmacaoPronta, confirmar } from './confirm.js';

const PERGUNTA = 'Há alterações não salvas. Sair e descartá-las?';

/** A fotografia do formulário que nasce sujo: não é igual a nenhuma outra. */
const NASCEU_SUJO = Symbol('nasceu sujo');

/** A fotografia de cada formulário ligado: o que ele enviaria ao ligar, ou no último `marcarSalvo`. */
const fotografias = new WeakMap();

/** Os ouvintes de `window` e `document` são um jogo só, para a página inteira. */
let ouvintesLigados = false;
let avisoDoNavegadorLigado = false;

/**
 * A saída que acabou de ser liberada — confirmada no modal, ou por um
 * `data-sem-aviso` — passa também pelo `beforeunload`, que viria logo
 * atrás com a pergunta do navegador.
 *
 * Vale até a pessoa voltar a mexer na página (uma tecla, um toque, um
 * clique): se a saída não aconteceu, o aviso volta sozinho.
 */
let saidaLiberada = false;

/** O último formulário cujo envio saiu sem ser barrado; ver `seguirComEnvio`. */
let ultimoEnvio = null;

/** Um valor do FormData na fotografia: o texto como está; o arquivo, pelo nome e pelo tamanho. */
function valorNaFotografia(valor) {
    if (typeof valor === 'string') {
        return valor;
    }

    if (valor !== null && typeof valor === 'object') {
        return { arquivo: String(valor.name ?? ''), tamanho: Number(valor.size ?? 0) };
    }

    return String(valor ?? '');
}

/**
 * Os pares `[nome, valor]` do formulário (os de `new FormData(form)`, na
 * ordem) → um texto que só é igual a outro quando os pares são os mesmos.
 *
 * A ordem conta: trocar duas linhas de lugar é mudar o formulário. O
 * arquivo entra pelo nome e pelo tamanho — ler o conteúdo seria ler o
 * arquivo inteiro a cada saída. Em JSON, um texto digitado que por acaso
 * se pareça com a descrição de um arquivo não se confunde com ela.
 */
export function fotografia(pares) {
    return JSON.stringify([...pares].map(([nome, valor]) => [String(nome), valorNaFotografia(valor)]));
}

/** Se o formulário mudou desde a fotografia `antes`. Sem ela (o formulário não foi ligado), não mudou. */
export function mudou(antes, depois) {
    if (antes === null || antes === undefined) {
        return false;
    }

    return antes !== depois;
}

/** Se o link ou o envio abre nesta janela, e não em outra (`_blank`, um nome de janela). */
function nestaJanela(alvo) {
    return ['', '_self'].includes(String(alvo ?? '').trim().toLowerCase());
}

/**
 * Se o clique no link pergunta antes de sair.
 *
 * Pergunta o link que leva a outra página do mesmo sistema, nesta
 * janela. Não pergunta:
 *
 * - o `#` e a âncora da própria página (`#itens`, ou o endereço atual
 *   com `#itens`): não se sai dela;
 * - o `href` vazio: é o link de enfeite, que o JavaScript trata;
 * - o que abre em outra janela (`target="_blank"`, ou um nome de janela)
 *   e o `download`: a página fica;
 * - outra origem (outro site, `mailto:`, `tel:`): ali, se a página sair,
 *   quem avisa é o navegador;
 * - o que declara `data-sem-aviso`.
 *
 * `href` é o atributo como está no HTML; `atual`, o endereço da página —
 * a base dos relativos, e o que diz se só a âncora muda.
 */
export function linkAvisa(href, { origin, atual = origin, target = '', dataset = {}, download = false } = {}) {
    const endereco = String(href ?? '').trim();

    if (endereco === '' || endereco.startsWith('#') || download || 'semAviso' in dataset || ! nestaJanela(target)) {
        return false;
    }

    let destino;
    let aqui;

    try {
        destino = new URL(endereco, atual);
        aqui = new URL(atual);
    } catch {
        return false;
    }

    if (destino.origin !== origin) {
        return false;
    }

    // Só a âncora muda: o navegador rola até ela, e a página fica.
    const ancora = destino.href.indexOf('#');

    return ancora === -1 || destino.href.slice(0, ancora) !== aqui.href.split('#')[0];
}

/** O que o formulário enviaria agora, como fotografia. */
function fotografar(formulario) {
    return fotografia(new FormData(formulario));
}

/**
 * Se o formulário mudou desde que foi ligado (ou desde o último
 * `marcarSalvo`). Só a comparação: o formulário já enviado
 * (`data-nao-salvo-liberado`) continua sujo aqui, mas não avisa.
 */
export function estaSujo(formulario) {
    const antes = fotografias.get(formulario);

    return antes !== undefined && mudou(antes, fotografar(formulario));
}

/**
 * O que está na tela vira a nova fotografia, e o aviso volta a valer:
 * para quem salva por `fetch` e continua na tela.
 */
export function marcarSalvo(formulario) {
    fotografias.set(formulario, fotografar(formulario));
    delete formulario.dataset.naoSalvoLiberado;
}

/** Se a página tem um formulário ligado que perderia o digitado — fora `exceto`, o que está sendo enviado. */
function haSujo(exceto = null) {
    return [...document.querySelectorAll('form[data-nao-salvo-ligado]')].some((formulario) => formulario !== exceto
        && ! ('naoSalvoLiberado' in formulario.dataset)
        && estaSujo(formulario));
}

function liberarSaida() {
    saidaLiberada = true;
}

/** Se o envio tira a pessoa da página. O botão manda, como no navegador (`formtarget`, `formmethod`). */
function envioSai(formulario, botao) {
    const alvo = botao?.getAttribute('formtarget') ?? formulario.getAttribute('target');
    const metodo = botao?.getAttribute('formmethod') ?? formulario.getAttribute('method');

    return nestaJanela(alvo) && String(metodo ?? '').trim().toLowerCase() !== 'dialog';
}

/**
 * A pergunta, no modal do painel.
 *
 * Um passo depois, e não no meio do evento: o envio que o
 * `data-confirmar` acabou de confirmar chega aqui de dentro do clique no
 * "Confirmar" dele — e o confirm.js, vendo o envio barrado, fecha o
 * modal logo em seguida. Perguntando já, a pergunta sairia junto com o
 * fechamento.
 */
async function perguntar() {
    await null;

    return confirmar(PERGUNTA, { perigo: true });
}

function aoClicar(evento) {
    // Com Ctrl, Shift, Alt ou Cmd, o link abre noutra aba (ou baixa): a página fica.
    if (evento.defaultPrevented || evento.button !== 0
        || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) {
        return;
    }

    const link = evento.target instanceof Element ? evento.target.closest('a[href]') : null;

    if (! (link instanceof HTMLAnchorElement)) {
        return;
    }

    if ('semAviso' in link.dataset) {
        liberarSaida();

        return;
    }

    const avisa = linkAvisa(link.getAttribute('href'), {
        origin: window.location.origin,
        atual: window.location.href,
        target: link.getAttribute('target') ?? '',
        dataset: link.dataset,
        download: link.hasAttribute('download'),
    });

    // Sem o modal, a saída segue, e quem pergunta é o navegador.
    if (! avisa || ! confirmacaoPronta() || ! haSujo()) {
        return;
    }

    evento.preventDefault();

    perguntar().then((sim) => {
        if (sim) {
            liberarSaida();
            window.location.assign(link.href);
        }
    });
}

/**
 * Reenvia o formulário que a pessoa mandou seguir, pelo mesmo botão
 * (o `name`/`value` dele vai junto), marcado para não perguntar de novo.
 *
 * O `data-confirmar` dele já perguntou e foi respondido: a marca do
 * confirm.js, que ele tirou ao ver o envio barrado aqui, volta, para a
 * pergunta dele não se repetir.
 */
function seguirComEnvio(formulario, botao, confirmado) {
    liberarSaida();
    formulario.dataset.naoSalvoSegue = '';

    if (confirmado !== undefined) {
        formulario.dataset.confirmado = confirmado;
    }

    ultimoEnvio = null;

    if (botao && botao.form === formulario) {
        formulario.requestSubmit(botao);
    } else {
        formulario.requestSubmit();
    }

    // Barrado de novo (a validação do navegador, outro módulo): as marcas não ficam para o próximo envio.
    if (ultimoEnvio !== formulario) {
        delete formulario.dataset.naoSalvoSegue;

        if (confirmado !== undefined) {
            delete formulario.dataset.confirmado;
        }

        saidaLiberada = false;
    }

    ultimoEnvio = null;
}

/** O envio de outro formulário, com este sujo: pergunta antes. No `document`, antes do submit.js. */
function aoEnviar(evento) {
    const formulario = evento.target;

    // Já segurado por quem pergunta antes (o `data-confirmar`, um `fetch`): não é uma saída, ainda.
    if (evento.defaultPrevented || ! (formulario instanceof HTMLFormElement)) {
        return;
    }

    // A volta do envio que a pessoa mandou seguir: passa.
    if ('naoSalvoSegue' in formulario.dataset) {
        delete formulario.dataset.naoSalvoSegue;

        return;
    }

    const botao = evento.submitter;

    if (! envioSai(formulario, botao)) {
        return;
    }

    if ('semAviso' in formulario.dataset || (botao && 'semAviso' in botao.dataset)) {
        liberarSaida();

        return;
    }

    if (! confirmacaoPronta() || ! haSujo(formulario)) {
        return;
    }

    evento.preventDefault();

    const confirmado = formulario.dataset.confirmado;

    perguntar().then((sim) => {
        if (sim) {
            seguirComEnvio(formulario, botao, confirmado);
        }
    });
}

/**
 * O envio que saiu de fato. Na `window`, que o evento alcança depois de
 * todo ouvinte do `document`: aqui já se sabe se alguém o segurou.
 */
function aoSairOEnvio(evento) {
    const formulario = evento.target;

    if (evento.defaultPrevented || ! (formulario instanceof HTMLFormElement)) {
        return;
    }

    ultimoEnvio = formulario;

    // O próprio formulário: é ele que salva, e a saída que vem não avisa.
    if ('naoSalvoLigado' in formulario.dataset && envioSai(formulario, evento.submitter)) {
        formulario.dataset.naoSalvoLiberado = '';
    }
}

function aoDescarregar(evento) {
    if (saidaLiberada || ! haSujo()) {
        return;
    }

    evento.preventDefault();

    // Os navegadores de antes do `preventDefault` (Chrome e Edge até a 118) pedem o `returnValue`.
    evento.returnValue = true;
}

/**
 * Voltando pelo histórico, a página vem do cache como ficou.
 *
 * O formulário que tinha sido enviado volta com o que foi mandado: é
 * isso que o servidor recebeu, e vira a fotografia. Daqui em diante, o
 * que mudar volta a avisar.
 */
function aoVoltar(evento) {
    if (! evento.persisted) {
        return;
    }

    saidaLiberada = false;

    document.querySelectorAll('form[data-nao-salvo-liberado]').forEach(marcarSalvo);
}

function rearmar() {
    saidaLiberada = false;
}

function ligarOuvintes() {
    ouvintesLigados = true;

    document.addEventListener('click', aoClicar);
    document.addEventListener('submit', aoEnviar);
    window.addEventListener('submit', aoSairOEnvio);
    window.addEventListener('pageshow', aoVoltar);

    // Na captura: a pessoa mexeu na página, e a saída liberada antes deixa de valer.
    document.addEventListener('pointerdown', rearmar, true);
    document.addEventListener('keydown', rearmar, true);
}

export function ligarNaoSalvo(raiz = document) {
    /*
     * Os ouvintes entram na primeira chamada, haja formulário ou não: a
     * ordem deles em relação ao submit.js é a do `ligarUi`, e um
     * formulário que chegue depois (por `fetch`) é ligado com
     * `ligarNaoSalvo(raiz)` sem embaralhá-la.
     */
    if (! ouvintesLigados) {
        ligarOuvintes();
    }

    raiz.querySelectorAll('form[data-nao-salvo]').forEach((formulario) => {
        if (formulario.dataset.naoSalvoLigado) {
            return;
        }

        formulario.dataset.naoSalvoLigado = '1';
        fotografias.set(formulario, 'naoSalvoSujo' in formulario.dataset ? NASCEU_SUJO : fotografar(formulario));

        // O aviso do navegador só na página que tem o que avisar.
        if (! avisoDoNavegadorLigado) {
            avisoDoNavegadorLigado = true;
            window.addEventListener('beforeunload', aoDescarregar);
        }
    });
}
