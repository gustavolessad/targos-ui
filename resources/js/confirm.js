/*
 * A confirmação das ações que não voltam atrás, no modal do painel em vez
 * do `confirm()` do navegador.
 *
 * O formulário (ou o botão que o envia) declara `data-confirmar="texto"`;
 * `data-confirmar-perigo` pinta o botão de confirmar de vermelho;
 * `data-confirmar-titulo` e `data-confirmar-botao` trocam o título e o
 * texto do "Confirmar" só naquela pergunta (o botão vence o formulário).
 * O envio é segurado, o modal `#confirmacao` abre com o texto, e só o
 * "Confirmar" manda o formulário de verdade — pelo mesmo botão, para o
 * `name`/`value` dele ir junto.
 *
 * Para o que não é envio de formulário (um `fetch`, uma remoção na
 * gaveta), `confirmar(texto)` faz a mesma pergunta no mesmo modal e
 * devolve uma promessa: `true` no "Confirmar", `false` em qualquer outra
 * saída (Voltar, X, Esc, clique fora).
 */
import { abrirCamada, fecharCamada } from './layers.js';
import { marcarCarregando } from './submit.js';

/*
 * Os dois caminhos dividem o modal, e o estado da promessa mora aqui
 * fora: `confirmar()` é chamada de qualquer lugar, e quem a liga ao
 * modal é o `ligarConfirmacoes()`.
 */

/** A resolução da promessa de `confirmar()` que espera resposta; `null` quando não há. */
let resolverPendente = null;

/** Abre o modal com a pergunta da promessa; quem a define é o `ligarConfirmacoes()`. */
let perguntarPelaPromessa = null;

/** O modal ligado, para saber se ele continua na página. */
let modalLigado = null;

/** Resolve a promessa pendente, se houver, e a esquece. */
function responder(resposta) {
    const resolver = resolverPendente;
    resolverPendente = null;

    resolver?.(resposta);
}

/**
 * Pergunta no modal de confirmação e espera a resposta.
 *
 *     if (await confirmar('Remover este item do carrinho?', { perigo: true })) { … }
 *
 * `titulo` e `botao` trocam o título do modal e o texto do "Confirmar"
 * só nesta pergunta ("Cancelar venda", "Sim, cancelar"); sem eles, os
 * do componente. Um `\n` no texto quebra a linha.
 *
 * Uma pergunta por vez: chamada com outra ainda aberta, volta `false`
 * na hora, sem empilhar.
 */
export function confirmar(texto, { perigo = false, titulo = null, botao = null } = {}) {
    if (! perguntarPelaPromessa || ! modalLigado?.isConnected) {
        console.warn('confirmar(): o modal de confirmação (<x-ui.confirm>) não está na página, ou ligarConfirmacoes() ainda não rodou.');

        return Promise.resolve(false);
    }

    if (resolverPendente) {
        return Promise.resolve(false);
    }

    return new Promise((resolver) => {
        resolverPendente = resolver;
        perguntarPelaPromessa(String(texto ?? ''), { perigo: Boolean(perigo), titulo, botao });
    });
}

/**
 * Se `confirmar()` tem onde perguntar: o modal está na página e o
 * `ligarConfirmacoes()` já rodou.
 *
 * Para quem precisa decidir antes de segurar uma ação: sem o modal, o
 * `confirmar()` volta `false` na hora, e uma saída segurada à espera
 * dele não sairia nunca (o aviso de alterações não salvas, unsaved.js,
 * deixa a saída com o aviso do navegador nesse caso).
 */
export function confirmacaoPronta() {
    return Boolean(perguntarPelaPromessa) && Boolean(modalLigado?.isConnected);
}

export function ligarConfirmacoes() {
    const modal = document.getElementById('confirmacao');

    if (! modal) {
        return;
    }

    const texto = modal.querySelector('[data-confirmacao-texto]');
    const botaoOk = modal.querySelector('[data-confirmacao-ok]');
    const botaoOkPerigo = modal.querySelector('[data-confirmacao-ok-perigo]');
    // O título é o do x-ui.modal; a caixa (`role="dialog"`) o repete no `aria-label`.
    const titulo = modal.querySelector('[data-modal-titulo]');
    const caixa = modal.querySelector('[role="dialog"]');

    /*
     * Os textos padrão, lidos do Blade uma vez: cada pergunta volta a
     * eles antes de aplicar os seus, para uma não herdar o título ou o
     * botão da anterior.
     */
    const padroes = {
        titulo: titulo?.textContent.trim() ?? '',
        botao: botaoOk.textContent.trim(),
    };

    let pendente = null;

    /** Escreve a pergunta (e o título e o botão desta vez), mostra o botão certo e abre o modal. */
    const perguntar = (pergunta, { perigo = false, titulo: tituloDaVez = null, botao: botaoDaVez = null } = {}) => {
        texto.textContent = pergunta;
        botaoOk.hidden = perigo;
        botaoOkPerigo.hidden = ! perigo;

        const tituloAtual = tituloDaVez || padroes.titulo;
        const botaoAtual = botaoDaVez || padroes.botao;

        if (titulo) {
            titulo.textContent = tituloAtual;
            caixa?.setAttribute('aria-label', tituloAtual);
        }

        // Os dois botões levam o mesmo texto: qual aparece é o `perigo` que decide.
        botaoOk.textContent = botaoAtual;
        botaoOkPerigo.textContent = botaoAtual;

        abrirCamada('modal', 'confirmacao');
    };

    document.addEventListener('submit', (evento) => {
        const formulario = evento.target;
        const botao = evento.submitter;

        // O botão que enviou manda na pergunta; senão, o formulário.
        const origem = botao?.dataset.confirmar ? botao : formulario;
        const pergunta = origem.dataset?.confirmar;

        if (! pergunta || formulario.dataset.confirmado) {
            return;
        }

        evento.preventDefault();

        // Quem pergunta por último fica com o modal: a promessa que ainda esperava desiste.
        responder(false);

        pendente = { formulario, botao };
        perguntar(pergunta, {
            perigo: 'confirmarPerigo' in origem.dataset,
            // O título e o botão desta pergunta: no botão que enviou, senão no formulário. O botão vence.
            titulo: botao?.dataset.confirmarTitulo ?? formulario.dataset.confirmarTitulo ?? null,
            botao: botao?.dataset.confirmarBotao ?? formulario.dataset.confirmarBotao ?? null,
        });
    });

    const enviar = () => {
        if (! pendente) {
            return;
        }

        const { formulario, botao } = pendente;
        pendente = null;

        // Marca antes de reenviar, para o próprio ouvinte acima deixar passar.
        formulario.dataset.confirmado = '1';

        if (botao && botao.form === formulario) {
            formulario.requestSubmit(botao);
        } else {
            formulario.requestSubmit();
        }

        /*
         * Foi (submit.js marcou o formulário): o modal fica aberto com o
         * "Confirmar" em carregando até a página seguinte — o botão que
         * originou o envio costuma estar escondido num menu. Não foi (a
         * validação do navegador barrou): o modal sai da frente do campo.
         */
        if (formulario.dataset.enviando) {
            marcarCarregando(botaoOk.hidden ? botaoOkPerigo : botaoOk);
        } else {
            delete formulario.dataset.confirmado;
            fecharCamada('modal', modal, 'botao');
        }
    };

    /*
     * A promessa, quando há, vence: o modal está aberto para ela. Ela é
     * resolvida antes de o modal fechar, e o `modal:fechado` que o
     * fechamento dispara já não acha nada para dizer `false`.
     */
    const aoConfirmar = () => {
        if (resolverPendente) {
            responder(true);
            fecharCamada('modal', modal, 'botao');

            return;
        }

        enviar();
    };

    botaoOk.addEventListener('click', aoConfirmar);
    botaoOkPerigo.addEventListener('click', aoConfirmar);

    // Fechou por outro caminho (Voltar, X, Esc, clique fora): a resposta é não.
    document.addEventListener('modal:fechado', (evento) => {
        if (evento.detail?.id === 'confirmacao') {
            responder(false);
        }
    });

    /*
     * Um envio que ficou para trás (a pessoa desistiu pelo Esc) não pode
     * ir junto com a promessa: um duplo clique no "Confirmar" dela daria
     * o segundo clique ao `enviar` — e o formulário antigo sairia.
     */
    perguntarPelaPromessa = (pergunta, opcoes) => {
        pendente = null;
        perguntar(pergunta, opcoes);
    };

    modalLigado = modal;

    // Voltando pelo histórico, a página vem do cache com a marca: ela sai, e a pergunta volta a valer.
    window.addEventListener('pageshow', (evento) => {
        document.querySelectorAll('form[data-confirmado]').forEach((formulario) => {
            delete formulario.dataset.confirmado;
        });

        if (evento.persisted) {
            fecharCamada('modal', modal);
        }
    });
}

/*
 * Exposta em `window`, como o `mostrarToast`, para qualquer tela chamar
 * sem importar nada.
 */
window.confirmar = confirmar;
