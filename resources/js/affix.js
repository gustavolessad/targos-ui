/*
 * O símbolo clicável do campo (`affix-action` no `x-ui.money` e no
 * `x-ui.percent`).
 *
 *     <x-ui.money name="discount" affix-action affix-label="Trocar para percentual" />
 *
 * Com a prop, o "R$" (ou o "%") é um `<button data-campo-afixo="prefix">`
 * (ou `"suffix"`). O clique anuncia `ui:afixo` no envelope do campo
 * (`[data-dinheiro]`, `[data-percentual]`), subindo, com
 * `detail: { lado, campo }` — o lado do símbolo e o `<input>` em que se
 * digita. **O que o clique faz é da tela**: trocar a unidade, abrir uma
 * calculadora. O pacote só avisa.
 *
 * O foco fica no campo: o botão não o toma ao ser apertado, e o clique o
 * devolve ao campo **antes** de anunciar — quem escuta pode levá-lo a
 * outro lugar (o campo que apareceu) sem que ele volte depois.
 *
 * Desligado ou só leitura, o clique não anuncia nada.
 *
 * No `document`, uma vez: o campo que entra depois (a linha nova do
 * `x-ui.repeater`, o modal carregado sem recarregar) já vale.
 */

/** Os lados que um símbolo pode ter. */
export const LADOS = ['prefix', 'suffix'];

/** O envelope do campo, onde o `ui:afixo` é anunciado. */
const ENVELOPES = '[data-dinheiro], [data-percentual]';

/**
 * O que o clique num símbolo anuncia: `{ lado, campo }`, ou `null` quando
 * não anuncia nada — o lado desconhecido, o campo que não existe, o
 * desligado e o só leitura.
 *
 * @param {string|undefined} lado O `data-campo-afixo` do botão.
 * @param {{disabled?: boolean, readOnly?: boolean}|null|undefined} campo O campo em que se digita.
 */
export function anuncioDoAfixo(lado, campo) {
    if (! LADOS.includes(lado) || ! campo || campo.disabled || campo.readOnly) {
        return null;
    }

    return { lado, campo };
}

function botaoDe(evento) {
    return evento.target instanceof Element ? evento.target.closest('[data-campo-afixo]') : null;
}

// Apertar o símbolo não tira o foco do campo: sem `blur` nem `change` no meio da digitação.
function aoApertar(evento) {
    if (botaoDe(evento)) {
        evento.preventDefault();
    }
}

function aoClicar(evento) {
    const botao = botaoDe(evento);

    if (! botao || botao.disabled) {
        return;
    }

    // O campo é o vizinho do símbolo, na mesma caixa (`data-dinheiro-campo`, `data-percentual-campo`).
    const campo = botao.parentElement?.querySelector('input:not([type="hidden"])') ?? null;
    const anuncio = anuncioDoAfixo(botao.dataset.campoAfixo, campo);

    if (! anuncio) {
        return;
    }

    campo.focus();

    (botao.closest(ENVELOPES) ?? botao.parentElement).dispatchEvent(
        new CustomEvent('ui:afixo', { bubbles: true, detail: anuncio }),
    );
}

let escutando = false;

export function ligarAfixos() {
    if (escutando) {
        return;
    }

    escutando = true;
    document.addEventListener('mousedown', aoApertar);
    document.addEventListener('click', aoClicar);
}
