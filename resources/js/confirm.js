/*
 * A confirmação das ações que não voltam atrás, no modal do painel em vez
 * do `confirm()` do navegador.
 *
 * O formulário (ou o botão que o envia) declara `data-confirmar="texto"`;
 * `data-confirmar-perigo` pinta o botão de confirmar de vermelho. O envio
 * é segurado, o modal `#confirmacao` abre com o texto, e só o "Confirmar"
 * manda o formulário de verdade — pelo mesmo botão, para o `name`/`value`
 * dele ir junto.
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
 * Uma pergunta por vez: chamada com outra ainda aberta, volta `false`
 * na hora, sem empilhar.
 */
export function confirmar(texto, { perigo = false } = {}) {
    if (! perguntarPelaPromessa || ! modalLigado?.isConnected) {
        console.warn('confirmar(): o modal de confirmação (<x-ui.confirm>) não está na página, ou ligarConfirmacoes() ainda não rodou.');

        return Promise.resolve(false);
    }

    if (resolverPendente) {
        return Promise.resolve(false);
    }

    return new Promise((resolver) => {
        resolverPendente = resolver;
        perguntarPelaPromessa(String(texto ?? ''), Boolean(perigo));
    });
}

export function ligarConfirmacoes() {
    const modal = document.getElementById('confirmacao');

    if (! modal) {
        return;
    }

    const texto = modal.querySelector('[data-confirmacao-texto]');
    const botaoOk = modal.querySelector('[data-confirmacao-ok]');
    const botaoOkPerigo = modal.querySelector('[data-confirmacao-ok-perigo]');

    let pendente = null;

    /** Escreve a pergunta, mostra o botão certo e abre o modal. */
    const perguntar = (pergunta, perigo) => {
        texto.textContent = pergunta;
        botaoOk.hidden = perigo;
        botaoOkPerigo.hidden = ! perigo;

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
        perguntar(pergunta, 'confirmarPerigo' in origem.dataset);
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
            fecharCamada('modal', modal);
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
            fecharCamada('modal', modal);

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
    perguntarPelaPromessa = (pergunta, perigo) => {
        pendente = null;
        perguntar(pergunta, perigo);
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
