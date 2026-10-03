/*
 * O Enter que não envia o formulário (`data-sem-envio-implicito`).
 *
 * O navegador envia um formulário quando se aperta Enter num campo de
 * texto — o "envio implícito". Na tela que recebe um leitor de código de
 * barras, isso é um desastre: o leitor digita o código e manda um Enter,
 * e a venda (ou o condicional em aberto) iria para o servidor pela
 * metade a cada bipe.
 *
 *     <form method="POST" action="…" data-sem-envio-implicito>…</form>
 *
 * Com a marca, o Enter num campo não envia. O que continua enviando: o
 * clique nos botões, o Enter com o foco num botão de envio (é um clique,
 * não um envio implícito) e o `requestSubmit()` por script. O `<textarea>`
 * não é tocado: ali o Enter quebra a linha, e nunca enviou.
 *
 * Só se barra o padrão: o evento segue para os ouvintes da tela, que é
 * onde o Enter do leitor é lido (`keydown` no campo do código).
 *
 * No `document`, uma vez: o formulário que entra depois (o modal
 * carregado sem recarregar) já vale.
 */

/** Os tipos de `<input>` em que o Enter é um clique, e não o envio implícito. */
const BOTOES = ['submit', 'image', 'button', 'reset'];

/**
 * Se o Enter num elemento seria o envio implícito do navegador: um
 * `<input>` que não é botão. O `<textarea>` quebra a linha; num
 * `<button>`, num `<select>` ou num `<input type="submit">`, o Enter é
 * um clique (ou nada), e não se mexe.
 *
 * @param {{tagName?: string, type?: string}|null|undefined} elemento
 */
export function enterEnviaImplicito(elemento) {
    if (! elemento || String(elemento.tagName ?? '').toUpperCase() !== 'INPUT') {
        return false;
    }

    return ! BOTOES.includes(String(elemento.type ?? 'text').toLowerCase());
}

function aoTeclar(evento) {
    // A composição de um teclado de ideogramas confirma com Enter: não é envio, e já não seria.
    if (evento.key !== 'Enter' || evento.isComposing || evento.defaultPrevented) {
        return;
    }

    const campo = evento.target;

    if (! (campo instanceof Element) || ! enterEnviaImplicito(campo)) {
        return;
    }

    // O formulário dono do campo (o `form=` conta), como o navegador vê.
    const formulario = campo.form ?? campo.closest('form');

    if (formulario && 'semEnvioImplicito' in formulario.dataset) {
        evento.preventDefault();
    }
}

let escutando = false;

export function ligarEnvioImplicito() {
    if (escutando) {
        return;
    }

    escutando = true;
    document.addEventListener('keydown', aoTeclar);
}
