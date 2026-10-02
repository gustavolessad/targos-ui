/*
 * A confirmação das ações que não voltam atrás, no modal do painel em vez
 * do `confirm()` do navegador.
 *
 * O formulário (ou o botão que o envia) declara `data-confirmar="texto"`;
 * `data-confirmar-perigo` pinta o botão de confirmar de vermelho. O envio
 * é segurado, o modal `#confirmacao` abre com o texto, e só o "Confirmar"
 * manda o formulário de verdade — pelo mesmo botão, para o `name`/`value`
 * dele ir junto.
 */
import { abrirCamada, fecharCamada } from './layers.js';
import { marcarCarregando } from './submit.js';

export function ligarConfirmacoes() {
    const modal = document.getElementById('confirmacao');

    if (! modal) {
        return;
    }

    const texto = modal.querySelector('[data-confirmacao-texto]');
    const confirmar = modal.querySelector('[data-confirmacao-ok]');
    const confirmarPerigo = modal.querySelector('[data-confirmacao-ok-perigo]');

    let pendente = null;

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

        pendente = { formulario, botao };
        texto.textContent = pergunta;

        const perigo = 'confirmarPerigo' in origem.dataset;
        confirmar.hidden = perigo;
        confirmarPerigo.hidden = ! perigo;

        abrirCamada('modal', 'confirmacao');
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
            marcarCarregando(confirmar.hidden ? confirmarPerigo : confirmar);
        } else {
            delete formulario.dataset.confirmado;
            fecharCamada('modal', modal);
        }
    };

    confirmar.addEventListener('click', enviar);
    confirmarPerigo.addEventListener('click', enviar);

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
