/*
 * Alternância de painéis por um grupo de opções (o botão segmentado,
 * `x-ui.radio-group`): dentro de `[data-alternancia]`, o rádio marcado
 * mostra o `[data-painel="<valor>"]` correspondente e esconde os outros.
 *
 * O servidor já desenha o estado inicial (o painel escolhido visível, os
 * outros com `hidden`); aqui só se acompanha a troca.
 */
export function ligarAlternancias() {
    document.querySelectorAll('[data-alternancia]').forEach((grupo) => {
        const atualizar = () => {
            const escolhido = grupo.querySelector('input[type="radio"]:checked')?.value;

            if (escolhido === undefined) {
                return;
            }

            grupo.querySelectorAll('[data-painel]').forEach((painel) => {
                painel.hidden = painel.dataset.painel !== escolhido;
            });
        };

        grupo.addEventListener('change', atualizar);
        atualizar();
    });
}
