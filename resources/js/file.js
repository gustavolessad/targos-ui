/*
 * O arquivo (<x-ui.file>): um ou vários.
 *
 * O `<input type="file">` nativo continua sendo o campo do formulário;
 * aqui ele fica visualmente escondido (sr-only, para a validação do
 * navegador ainda apontar para ele, e no Tab: é ele que recebe o foco)
 * e o botão ao lado — o `<label for>` dele — abre a janela de escolha.
 * Ao lado do botão, o que foi escolhido: "nota.xml (12 KB)", ou
 * "3 arquivos (1,2 MB)".
 *
 * Ao escolher, confere o tipo (`accept`) e o tamanho (`max`, em MB): o
 * que não passa ganha o erro embaixo do campo e a escolha é desfeita.
 * É aviso antes do envio, e não validação — o `accept` não impede quem
 * escolhe "Todos os arquivos", e o servidor confere de novo.
 *
 * Depois de conferir, o nativo dispara `ui:arquivos` (sobe pelo DOM),
 * com `detail.arquivos`: a lista do que ficou escolhido, vazia quando a
 * escolha foi recusada.
 *
 * A imagem com prévia (<x-ui.image>, image.js) confere do mesmo jeito,
 * com as funções daqui.
 */
import { limparErroDoCampo, mostrarErroNoCampo } from './errors.js';

const UNIDADES = ['KB', 'MB', 'GB', 'TB'];

/** Uma casa abaixo de 10 ("1,2 MB"), nenhuma dali para cima ("12 KB"): o que a lista de arquivos de qualquer sistema mostra. */
function casasDe(valor) {
    return valor < 10 ? 1 : 0;
}

function arredondar(valor) {
    const fator = 10 ** casasDe(valor);

    return Math.round(valor * fator) / fator;
}

/**
 * O tamanho para gente ler: 12288 → "12 KB", 1258291 → "1,2 MB",
 * 500 → "500 bytes".
 *
 * Em potências de 1024, como o Laravel conta o `max` de um arquivo
 * (`max:10240` são 10 MB).
 */
export function tamanhoLegivel(bytes) {
    const total = Number(bytes);

    if (! Number.isFinite(total) || total < 1024) {
        const inteiro = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;

        return `${inteiro} ${inteiro === 1 ? 'byte' : 'bytes'}`;
    }

    let valor = total / 1024;
    let unidade = 0;

    // Sobe de unidade quando o número arredondado já chegaria a 1024: 1023,9 KB é "1 MB", não "1.024 KB".
    while (unidade < UNIDADES.length - 1 && arredondar(valor) >= 1024) {
        valor /= 1024;
        unidade += 1;
    }

    const texto = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casasDe(valor) }).format(valor);

    return `${texto} ${UNIDADES[unidade]}`;
}

/**
 * Se o arquivo está no `accept` do campo: `aceita(arquivo, '.xml,text/xml')`.
 *
 * Cada item do `accept` vale como no HTML: `.xml` pela extensão do nome,
 * `image/*` pela família do tipo, `text/xml` pelo tipo exato. Sem
 * `accept`, tudo passa. `arquivo` é um `File` (ou só `{ name, type }`).
 */
export function aceita(arquivo, accept) {
    const regras = String(accept ?? '').split(',').map((regra) => regra.trim().toLowerCase()).filter(Boolean);

    if (regras.length === 0) {
        return true;
    }

    const nome = String(arquivo?.name ?? '').toLowerCase();
    const tipo = String(arquivo?.type ?? '').toLowerCase();

    return regras.some((regra) => {
        if (regra.startsWith('.')) {
            return nome.endsWith(regra);
        }

        if (regra === '*' || regra === '*/*') {
            return true;
        }

        // `image/*` → começa com `image/`. O tipo vazio (o navegador não reconheceu) não entra.
        if (regra.endsWith('/*')) {
            return tipo.startsWith(regra.slice(0, -1));
        }

        return tipo === regra;
    });
}

/** O que foi escolhido, em uma linha: "nota.xml (12 KB)", "3 arquivos (1,2 MB)"; nada → "". */
export function resumoDosArquivos(lista) {
    const arquivos = Array.from(lista ?? []);

    if (arquivos.length === 0) {
        return '';
    }

    const total = arquivos.reduce((soma, arquivo) => soma + (Number(arquivo?.size) || 0), 0);
    const quem = arquivos.length === 1 ? arquivos[0].name : `${arquivos.length} arquivos`;

    return `${quem} (${tamanhoLegivel(total)})`;
}

/** O limite do campo em MB: `'10'` → 10; ausente, zero ou inválido → null (sem limite). */
function megabytes(max) {
    if (max === null || max === undefined || String(max).trim() === '') {
        return null;
    }

    const numero = Number(max);

    return Number.isFinite(numero) && numero > 0 ? numero : null;
}

/**
 * O que impede a escolha: a mensagem do primeiro arquivo que não
 * passa, ou null quando todos passam.
 *
 * `max` é o tamanho máximo de cada arquivo, em MB (número ou o texto do
 * `data-*`). Com um arquivo, a mensagem é a do campo ("O arquivo passa
 * de 10 MB."); com vários, ela diz qual deles.
 */
export function conferirArquivos(lista, { accept = null, max = null } = {}) {
    const arquivos = Array.from(lista ?? []);
    const varios = arquivos.length > 1;
    const limite = megabytes(max);

    for (const arquivo of arquivos) {
        if (! aceita(arquivo, accept)) {
            return varios ? `Tipo de arquivo não aceito: ${arquivo.name}.` : 'Tipo de arquivo não aceito.';
        }

        if (limite !== null && Number(arquivo?.size) > limite * 1024 * 1024) {
            const mb = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(limite);

            return varios ? `O arquivo ${arquivo.name} passa de ${mb} MB.` : `O arquivo passa de ${mb} MB.`;
        }
    }

    return null;
}

function montar(envelope) {
    if (envelope.dataset.arquivoLigado) {
        return;
    }

    envelope.dataset.arquivoLigado = '1';

    const caixa = envelope.querySelector('[data-arquivo-nativo-caixa]');
    const nativo = envelope.querySelector('[data-arquivo-nativo]');
    const botao = envelope.querySelector('[data-arquivo-botao]');
    const nomes = envelope.querySelector('[data-arquivo-nomes]');

    // "Nenhum arquivo escolhido", do Blade: o texto para quando a escolha fica vazia.
    const semArquivo = nomes.textContent.trim();

    caixa.classList.add('sr-only');
    botao.hidden = false;
    nomes.hidden = false;

    const escrever = () => {
        const arquivos = Array.from(nativo.files ?? []);

        nomes.textContent = resumoDosArquivos(arquivos) || semArquivo;

        // O nome inteiro, que o `truncate` corta, no passar do mouse; com vários, um por linha.
        if (arquivos.length > 0) {
            nomes.title = arquivos.map((arquivo) => arquivo.name).join('\n');
        } else {
            nomes.removeAttribute('title');
        }
    };

    nativo.addEventListener('change', () => {
        const problema = conferirArquivos(nativo.files, {
            accept: nativo.getAttribute('accept'),
            max: envelope.dataset.arquivoMax,
        });

        if (problema) {
            mostrarErroNoCampo(nativo, problema);

            // A escolha recusada não vai no formulário: com `required`, o navegador volta a cobrar.
            nativo.value = '';
        } else {
            limparErroDoCampo(nativo);
        }

        escrever();

        nativo.dispatchEvent(new CustomEvent('ui:arquivos', {
            bubbles: true,
            detail: { arquivos: Array.from(nativo.files ?? []) },
        }));
    });

    // O `reset` do formulário esvazia o nativo sem `change`: o texto ao lado acompanha depois que ele acontece.
    nativo.form?.addEventListener('reset', () => {
        setTimeout(() => {
            limparErroDoCampo(nativo);
            escrever();
        });
    });

    // O navegador pode devolver a escolha ao voltar para a página (o "voltar" do Firefox).
    escrever();
}

export function ligarArquivos(raiz = document) {
    raiz.querySelectorAll('[data-arquivo]').forEach(montar);
}
