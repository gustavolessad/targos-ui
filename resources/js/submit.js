/*
 * Todo formulário enviado mostra que está indo.
 *
 * O botão que enviou troca o conteúdo por um "carregando" e fica desligado
 * até a página seguinte chegar; um segundo envio do mesmo formulário (duplo
 * clique, Enter repetido) é barrado aqui mesmo. Vale para qualquer
 * `<form>`, sem marcar nada no HTML — inclusive o botão que vive fora do
 * formulário (`form="…"`) e o que confirma no modal de confirmação.
 *
 * No servidor, o par é o PreventDuplicateSubmissions: se o segundo envio
 * escapar daqui, ele é ignorado lá.
 *
 * Fica de fora: o formulário que abre em outra aba (`target="_blank"`) e o
 * que declarar `data-sem-carregando` (um envio que não troca de página,
 * como um download) — neles a página continua, e o botão ficaria preso.
 */

/** O círculo girando, do tamanho do ícone dos botões. */
const CARREGANDO = `
    <svg aria-hidden="true" class="size-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
    </svg>
    <span class="sr-only">Enviando…</span>`;

/** O conteúdo original de cada botão em "carregando", para devolver depois. */
const originais = new Map();

/** Troca o conteúdo do botão pelo "carregando" e o desliga. */
export function marcarCarregando(botao) {
    if (! botao || originais.has(botao)) {
        return;
    }

    originais.set(botao, { html: botao.innerHTML, largura: botao.style.minWidth, desligado: botao.disabled });

    // A largura fica: o botão não encolhe quando o texto dá lugar ao círculo.
    botao.style.minWidth = `${botao.offsetWidth}px`;
    botao.innerHTML = CARREGANDO;
    botao.setAttribute('aria-busy', 'true');
    botao.disabled = true;
}

/** Devolve o botão ao que era. */
export function desmarcarCarregando(botao) {
    const original = originais.get(botao);

    if (! original) {
        return;
    }

    botao.innerHTML = original.html;
    botao.style.minWidth = original.largura;
    botao.disabled = original.desligado;
    botao.removeAttribute('aria-busy');
    originais.delete(botao);
}

export function ligarEnvios() {
    /*
     * No `document`, e ligado por último (app.js): quem segura o envio para
     * perguntar antes (a confirmação, o modal do parcelamento) já fez o
     * `preventDefault` quando o evento chega aqui.
     */
    document.addEventListener('submit', (evento) => {
        const formulario = evento.target;

        if (evento.defaultPrevented || ! (formulario instanceof HTMLFormElement)) {
            return;
        }

        if (formulario.target === '_blank' || 'semCarregando' in formulario.dataset) {
            return;
        }

        // Já está indo: o segundo envio não sai.
        if (formulario.dataset.enviando) {
            evento.preventDefault();

            return;
        }

        formulario.dataset.enviando = '1';

        const botao = evento.submitter ?? formulario.querySelector('button[type="submit"], button:not([type])');

        /*
         * No instante seguinte, não agora: um botão desligado durante o
         * `submit` não entra nos dados do formulário, e o `name`/`value`
         * dele se perderia.
         */
        setTimeout(() => marcarCarregando(botao));
    });

    // Voltando pelo histórico, a página vem do cache como ficou: tudo volta a poder ser enviado.
    window.addEventListener('pageshow', () => {
        document.querySelectorAll('form[data-enviando]').forEach((formulario) => {
            delete formulario.dataset.enviando;
        });

        [...originais.keys()].forEach(desmarcarCarregando);
    });
}
