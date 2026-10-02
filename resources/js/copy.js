/*
 * Copiar para a área de transferência: qualquer elemento com
 * `data-copiar="texto"`. Confirma com um toast curto (ui/toast.js).
 *
 * `navigator.clipboard` só existe em página segura (HTTPS ou localhost).
 * Fora disso (um endereço local em http, por exemplo), cai no jeito
 * clássico: um campo escondido, selecionado, e `execCommand('copy')`.
 *
 * Depois de copiar, o elemento dispara `ui:copiado` (sobe pelo DOM), com
 * o texto em `detail.texto`: é onde o projeto pendura o que quiser
 * fazer com a cópia.
 */
/** `data-imprimir`: o botão "Imprimir". */
export function ligarImprimir() {
    document.addEventListener('click', (evento) => {
        if (evento.target.closest('[data-imprimir]')) {
            evento.preventDefault();
            window.print();
        }
    });
}

export function ligarCopiar() {
    document.addEventListener('click', async (evento) => {
        const botao = evento.target.closest('[data-copiar]');

        if (!botao) {
            return;
        }

        evento.preventDefault();

        if (await copiar(botao.dataset.copiar)) {
            window.mostrarToast?.('sucesso', 'Copiado.', 2);
            botao.dispatchEvent(new CustomEvent('ui:copiado', { bubbles: true, detail: { texto: botao.dataset.copiar } }));
        } else {
            window.mostrarToast?.('aviso', 'Não foi possível copiar. Selecione o texto e copie manualmente.');
        }
    });
}

async function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(texto);

            return true;
        } catch {
            // segue para o jeito clássico
        }
    }

    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    // Fora da tela, mas no DOM: precisa existir para ser selecionado.
    campo.style.position = 'fixed';
    campo.style.top = '-1000px';
    campo.style.opacity = '0';
    document.body.append(campo);
    campo.select();
    campo.setSelectionRange(0, texto.length);

    let copiou = false;
    try {
        copiou = document.execCommand('copy');
    } catch {
        copiou = false;
    }

    campo.remove();

    return copiou;
}
