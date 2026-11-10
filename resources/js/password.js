// --- Ver a senha ---

/**
 * O campo que o olho mostra: o que está ao lado dele, no mesmo bloco do
 * componente. Só sem ele, o do `id` que o botão declara.
 *
 * Pelo bloco, e não pelo `id`, porque a página pode ter vários campos de
 * mesmo nome — um modal de "Nova senha" por usuário, todos com
 * `name="password"` —, e o `id` repetido levava o olho a mostrar o campo do
 * primeiro modal, e não o do que está aberto.
 */
function campoDoOlho(botao, documento) {
    return botao.parentElement?.querySelector('input') ?? documento.getElementById(botao.dataset.veSenha);
}

/**
 * Alterna entre esconder e mostrar o que está sendo digitado.
 *
 * O botão declara `data-ve-senha="nome-do-campo"`. O clique é ouvido no
 * documento, então um campo que apareça depois — dentro de um modal, por
 * exemplo — funciona sem ninguém religar nada.
 */
function ligarOlhoDaSenha() {
    document.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-ve-senha]');

        if (! botao) {
            return;
        }

        const campo = campoDoOlho(botao, document);

        if (! campo) {
            return;
        }

        campo.type = campo.type === 'password' ? 'text' : 'password';

        botao.querySelectorAll('svg').forEach((icone) => icone.classList.toggle('hidden'));
    });
}

export { campoDoOlho, ligarOlhoDaSenha };
