/*
 * O X do aviso (`dismissible` no `x-ui.alert`).
 *
 *     <x-ui.alert type="danger" dismissible>Estoque insuficiente.</x-ui.alert>
 *
 * O clique no `[data-fecha-alerta]` põe `hidden` no aviso (`[data-alerta]`)
 * e dispara `ui:alerta-dispensado` nele, subindo pelo DOM. **O que vem
 * depois é da tela**: limpar o erro que o aviso mostrava, para que o
 * próximo desenho não o traga de volta. Para mostrá-lo de novo, a tela
 * tira o `hidden` — o aviso continua na página.
 *
 * No `document`, uma vez: o aviso que entra depois (um fragmento trocado
 * sem recarregar) já vale.
 */

/**
 * Esconde o aviso e avisa quem escuta. Devolve `true` quando escondeu;
 * `false` quando não havia aviso, ou ele já estava escondido — dispensar
 * duas vezes não avisa duas vezes.
 *
 * @param {{hidden: boolean, dispatchEvent: (evento: Event) => boolean}|null|undefined} alerta
 */
export function dispensarAlerta(alerta) {
    if (! alerta || alerta.hidden) {
        return false;
    }

    alerta.hidden = true;
    alerta.dispatchEvent(new CustomEvent('ui:alerta-dispensado', { bubbles: true }));

    return true;
}

function aoClicar(evento) {
    const botao = evento.target instanceof Element ? evento.target.closest('[data-fecha-alerta]') : null;

    if (botao) {
        dispensarAlerta(botao.closest('[data-alerta]'));
    }
}

let escutando = false;

export function ligarAlertas() {
    if (escutando) {
        return;
    }

    escutando = true;
    document.addEventListener('click', aoClicar);
}
