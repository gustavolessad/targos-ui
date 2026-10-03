/*
 * A imagem com prévia (<x-ui.image>): o logo da marca, a foto do produto.
 *
 * O `<input type="file">` nativo continua sendo o campo do formulário,
 * escondido (sr-only) como no arquivo (file.js). Aqui:
 *
 * - a escolha aparece no quadro na hora, por uma URL local
 *   (`URL.createObjectURL`), solta quando a escolha muda;
 * - o tipo e o tamanho são conferidos como no arquivo, com as mesmas
 *   funções: o que não passa ganha o erro embaixo e a escolha é desfeita;
 * - "Remover" desfaz a escolha e, havendo imagem gravada, põe em 1 o
 *   escondido `{name}_remove` — é por ele que o servidor sabe que a
 *   gravada deve sair. Escolher um arquivo o volta a 0.
 *
 * A cada mudança, o nativo dispara `ui:imagem` (sobe pelo DOM), com
 * `detail.arquivo` (o `File` escolhido, ou null) e `detail.removida`
 * (se a gravada vai ser tirada ao salvar).
 */
import { limparErroDoCampo, mostrarErroNoCampo } from './errors.js';
import { conferirArquivos, tamanhoLegivel } from './file.js';

function montar(envelope) {
    if (envelope.dataset.imagemLigado) {
        return;
    }

    envelope.dataset.imagemLigado = '1';

    const caixa = envelope.querySelector('[data-imagem-nativo-caixa]');
    const nativo = envelope.querySelector('[data-imagem-nativo]');
    const escolher = envelope.querySelector('[data-imagem-escolher]');
    const textoDoEscolher = escolher.querySelector('[data-imagem-escolher-texto]');
    const remover = envelope.querySelector('[data-imagem-remover]');
    const removerFlag = envelope.querySelector('[data-imagem-remover-flag]');
    const imagem = envelope.querySelector('[data-imagem-previa] img');
    const vazio = envelope.querySelector('[data-imagem-vazio]');
    const nome = envelope.querySelector('[data-imagem-nome]');

    // A imagem que veio do servidor; e o `{name}_remove` como o Blade o desenhou (1 quando volta de um erro).
    let gravada = envelope.dataset.imagemGravada || null;
    const obrigatoria = envelope.dataset.imagemObrigatoria !== undefined;
    const flagInicial = removerFlag?.value ?? '0';

    let escolhido = null;
    let urlLocal = null;

    caixa.classList.add('sr-only');
    escolher.hidden = false;

    const removida = () => removerFlag?.value === '1';

    // A URL local segura o arquivo na memória até ser solta.
    const soltar = () => {
        if (urlLocal) {
            URL.revokeObjectURL(urlLocal);
            urlLocal = null;
        }

        escolhido = null;
    };

    const desenhar = () => {
        const fonte = escolhido ? urlLocal : (gravada && ! removida() ? gravada : null);

        if (fonte !== null && imagem.getAttribute('src') !== fonte) {
            imagem.src = fonte;
        }

        imagem.hidden = fonte === null;
        vazio.hidden = fonte !== null;

        if (remover) {
            remover.hidden = fonte === null;
        }

        textoDoEscolher.textContent = fonte === null ? escolher.dataset.textoEscolher : escolher.dataset.textoTrocar;

        nome.textContent = escolhido ? `${escolhido.name} (${tamanhoLegivel(escolhido.size)})` : '';
        nome.title = escolhido ? escolhido.name : '';
        nome.hidden = ! escolhido;

        // Obrigatória, o navegador só cobra o arquivo quando não há imagem nenhuma: a gravada à vista vale.
        if (obrigatoria) {
            nativo.required = fonte === null;
        }
    };

    const avisar = () => {
        nativo.dispatchEvent(new CustomEvent('ui:imagem', {
            bubbles: true,
            detail: { arquivo: escolhido, removida: removida() },
        }));
    };

    nativo.addEventListener('change', () => {
        const arquivo = nativo.files?.[0] ?? null;

        soltar();

        const problema = arquivo && conferirArquivos([arquivo], {
            accept: nativo.getAttribute('accept'),
            max: envelope.dataset.imagemMax,
        });

        if (problema) {
            mostrarErroNoCampo(nativo, problema);

            // A escolha recusada não vai no formulário; o quadro volta ao que havia antes dela.
            nativo.value = '';
        } else {
            limparErroDoCampo(nativo);
        }

        if (arquivo && ! problema) {
            escolhido = arquivo;
            urlLocal = URL.createObjectURL(arquivo);

            // Uma imagem nova substitui a gravada: não há o que remover.
            if (removerFlag) {
                removerFlag.value = '0';
            }
        }

        desenhar();
        avisar();
    });

    remover?.addEventListener('click', () => {
        if (nativo.disabled) {
            return;
        }

        nativo.value = '';
        soltar();

        // Sem gravada, "Remover" só desfaz a escolha: o servidor não tem o que apagar.
        if (gravada && removerFlag) {
            removerFlag.value = '1';
        }

        limparErroDoCampo(nativo);
        desenhar();

        // O botão sumiu com a imagem: o foco vai para o campo, e quem usa o teclado segue de onde estava.
        nativo.focus();

        avisar();
    });

    /*
     * O `reset` do formulário esvazia o nativo sem `change`, e não
     * devolve o escondido ao valor do começo (num `type="hidden"`, o
     * valor gravado pelo script vira o padrão): os dois voltam aqui.
     */
    nativo.form?.addEventListener('reset', () => {
        setTimeout(() => {
            soltar();

            if (removerFlag) {
                removerFlag.value = flagInicial;
            }

            limparErroDoCampo(nativo);
            desenhar();
        });
    });

    /*
     * Um modal de imagem que serve a várias linhas (a logo de cada marca)
     * precisa trocar a gravada depois de montado: `definirImagemGravada`
     * manda a nova por este evento, e o quadro volta ao estado inicial
     * com ela — sem escolha, sem remoção pedida.
     */
    envelope.addEventListener('ui:imagem-gravada', (evento) => {
        gravada = evento.detail?.src || null;

        nativo.value = '';
        soltar();

        if (removerFlag) {
            removerFlag.value = '0';
        }

        limparErroDoCampo(nativo);
        desenhar();
    });

    // O navegador pode devolver a escolha ao voltar para a página: ela aparece no quadro.
    const devolvido = nativo.files?.[0];

    if (devolvido && ! conferirArquivos([devolvido], { accept: nativo.getAttribute('accept'), max: envelope.dataset.imagemMax })) {
        escolhido = devolvido;
        urlLocal = URL.createObjectURL(devolvido);
    }

    desenhar();
}

/**
 * Troca a imagem gravada de um `<x-ui.image>` já montado (`envelope` é
 * o `[data-imagem]`): o quadro passa a mostrar `src` (ou o vazio, com
 * `null`), sem escolha e sem remoção pedida.
 */
export function definirImagemGravada(envelope, src) {
    envelope.dataset.imagemGravada = src ?? '';
    envelope.dispatchEvent(new CustomEvent('ui:imagem-gravada', { detail: { src: src ?? null } }));
}

export function ligarImagens(raiz = document) {
    raiz.querySelectorAll('[data-imagem]').forEach(montar);
}
