// --- Ver a senha ---

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

        const campo = document.getElementById(botao.dataset.veSenha);

        if (! campo) {
            return;
        }

        campo.type = campo.type === 'password' ? 'text' : 'password';

        botao.querySelectorAll('svg').forEach((icone) => icone.classList.toggle('hidden'));
    });
}

export { ligarOlhoDaSenha };
