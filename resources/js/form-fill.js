/*
 * Preencher um formulário a partir de dados prontos.
 *
 * O caso típico é o modal de editar numa listagem: um modal só serve a
 * todas as linhas, e o botão "Editar" de cada uma traz os dados dela.
 * Sem isto, cada tela escreve o mesmo `form.querySelector(...).value =`
 * para cada campo, e os campos do pacote (valor, data, select) ficam
 * fora de sincronia, porque o visível não acompanha o nativo sem um
 * `change`.
 *
 *     <button data-abre-modal="editar-deposito"
 *             data-form-valores='{"name":"Loja","sells":true}'
 *             data-form-action="/depositos/01J…">Editar</button>
 *
 * Ao abrir, o `<form>` do modal recebe os valores (por `name`) e, se
 * houver, o `action`. Também serve fora do modal: `preencherFormulario`
 * é exportada para quem busca os dados de outro lugar (um fetch).
 */

/** Escreve um valor num campo, do jeito que aquele tipo de campo entende. */
export function escreverNoCampo(campo, valor) {
    if (campo.type === 'checkbox') {
        // `true`/1 liga; e também o próprio valor da caixa (`value="active"` com `'active'`).
        campo.checked = valor === true || valor === 1 || valor === '1' || valor === 'true'
            || (valor !== null && valor !== undefined && valor !== false && String(valor) === String(campo.value));
    } else if (campo.type === 'radio') {
        campo.checked = String(campo.value) === String(valor);
    } else if (campo.type === 'file') {
        return;
    } else {
        campo.value = valor === null || valor === undefined ? '' : String(valor);
    }

    // O visível dos campos do pacote (valor, data, select) acompanha o nativo pelo `change`.
    campo.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Preenche o formulário com `valores` (`{ nome: valor }`), campo a campo
 * pelo `name`. Nomes de lista aceitam a notação do Laravel
 * (`items.0.price`) ou a do HTML (`items[0][price]`).
 *
 * Um campo que não existe no formulário é ignorado; um `_action` ou
 * `action` nos valores NÃO troca o destino (isso é `data-form-action`,
 * de propósito separado: o destino de um POST não vem de dados).
 */
export function preencherFormulario(formulario, valores) {
    Object.entries(valores ?? {}).forEach(([chave, valor]) => {
        const nome = chave.includes('.') ? nomeHtml(chave) : chave;
        /*
         * O escondido que acompanha o interruptor (`data-falsy`, o "0" do
         * desligado) fica como está: é ele que diz "desligado" quando a
         * caixa não vai, e escrever `true` nele mandaria `true` sempre.
         */
        const campos = [...formulario.querySelectorAll(`[name="${CSS.escape(nome)}"]`)]
            .filter((campo) => ! (campo.type === 'hidden' && 'falsy' in campo.dataset));

        if (campos.length === 0) {
            return;
        }

        // Um grupo de rádios: o valor escolhe qual; os demais campos: todos recebem.
        campos.forEach((campo) => escreverNoCampo(campo, valor));
    });
}

function nomeHtml(chave) {
    const partes = String(chave).split('.');

    return partes[0] + partes.slice(1).map((parte) => `[${parte}]`).join('');
}

/** O `<form>` que o botão governa: o do modal que ele abre, ou o apontado por `data-form`. */
function formularioDe(botao) {
    if (botao.dataset.form) {
        return document.getElementById(botao.dataset.form);
    }

    const modal = botao.dataset.abreModal ? document.getElementById(botao.dataset.abreModal) : null;

    return modal?.querySelector('form') ?? botao.closest('form');
}

let ligado = false;

export function ligarPreenchimentos() {
    // Um ouvinte só no `document`: chamar de novo (depois de inserir HTML) não duplica.
    if (ligado) {
        return;
    }

    ligado = true;

    document.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-form-valores], [data-form-action], [data-modal-titulo]');

        if (! botao) {
            return;
        }

        /*
         * O título do modal que serve a várias linhas ("Cancelar NF-e
         * 1/15", "Logo de Nike"): o botão que abre o modal o traz em
         * `data-modal-titulo`, e ele vai para o `[data-modal-titulo]` do
         * modal (o `<h2>` do x-ui.modal) e para o `aria-label` da caixa.
         */
        if (botao.dataset.modalTitulo !== undefined && botao.dataset.abreModal) {
            const modal = document.getElementById(botao.dataset.abreModal);
            const titulo = modal?.querySelector('[data-modal-titulo]');

            if (titulo) {
                titulo.textContent = botao.dataset.modalTitulo;
                modal.querySelector('[role="dialog"]')?.setAttribute('aria-label', botao.dataset.modalTitulo);
            }
        }

        const formulario = formularioDe(botao);

        if (! formulario) {
            return;
        }

        if (botao.dataset.formAction) {
            formulario.action = botao.dataset.formAction;
        }

        if (botao.dataset.formValores) {
            let valores = {};

            try {
                valores = JSON.parse(botao.dataset.formValores);
            } catch {
                console.warn('data-form-valores não é JSON válido.', botao);
            }

            preencherFormulario(formulario, valores);
        }
    });
}
