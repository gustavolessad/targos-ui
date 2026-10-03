/*
 * A barra de filtros de uma listagem que se envia sozinha.
 *
 * O formulário é um `<form method="GET" data-filtros>` comum, e sem
 * JavaScript continua funcionando pelo botão "Buscar". Com JavaScript:
 *
 * - um select, uma data, um período ou uma caixa marcada enviam ao mudar;
 * - a busca digitada (`type="search"`, ou qualquer campo com
 *   `data-filtro-busca`) espera a pessoa parar de digitar
 *   (`data-filtros-espera`, 400 ms por padrão) e então envia;
 * - os campos vazios ficam de fora da URL (`?status=&busca=` vira `?`),
 *   para o link ser limpo e o controller não distinguir "vazio" de
 *   "não veio";
 * - mudar um filtro volta à primeira página: um `page` que esteja no
 *   formulário (campo escondido) é descartado.
 *
 * Quem escuta o envio no servidor é o mesmo controller da listagem.
 */

const ESPERA_PADRAO = 400;

/** Os campos cujo valor não vai na URL: vazios, ou a página. */
export function camposForaDaUrl(campos) {
    return campos.filter((campo) => {
        if (campo.name === '' || campo.name === 'page') {
            return campo.name === 'page';
        }

        if (campo.type === 'checkbox' || campo.type === 'radio') {
            return ! campo.checked;
        }

        return String(campo.value ?? '').trim() === '';
    });
}

/** Se o campo envia ao mudar (e não ao digitar). */
export function enviaAoMudar(campo) {
    if ('filtroBusca' in campo.dataset) {
        return false;
    }

    return campo.tagName === 'SELECT'
        || ['checkbox', 'radio', 'date', 'month'].includes(campo.type)
        || 'dataNativo' in campo.dataset
        || 'periodoInicio' in campo.dataset
        || 'periodoFim' in campo.dataset;
}

function enviar(formulario) {
    /*
     * Desligar o campo vazio no instante do envio o tira da URL; no
     * `pageshow` (voltar pelo histórico) eles voltam a ligar, e o
     * formulário fica inteiro para a próxima mudança.
     */
    const desligados = camposForaDaUrl([...formulario.elements]).filter((campo) => ! campo.disabled);

    desligados.forEach((campo) => {
        campo.disabled = true;
    });

    formulario.requestSubmit();

    // Se o envio foi barrado (validação nativa), nada navega: religa.
    setTimeout(() => desligados.forEach((campo) => {
        campo.disabled = false;
    }));
}

export function ligarFiltros(raiz = document) {
    raiz.querySelectorAll('form[data-filtros]').forEach((formulario) => {
        if (formulario.dataset.filtrosLigado) {
            return;
        }

        formulario.dataset.filtrosLigado = '1';

        const espera = Number(formulario.dataset.filtrosEspera) || ESPERA_PADRAO;
        let agendado = null;

        formulario.addEventListener('change', (evento) => {
            if (enviaAoMudar(evento.target)) {
                clearTimeout(agendado);
                enviar(formulario);
            }
        });

        formulario.addEventListener('input', (evento) => {
            const campo = evento.target;

            if (campo.type !== 'search' && ! ('filtroBusca' in campo.dataset)) {
                return;
            }

            clearTimeout(agendado);
            agendado = setTimeout(() => enviar(formulario), espera);
        });

        // Enter na busca envia na hora, sem esperar o atraso.
        formulario.addEventListener('submit', () => clearTimeout(agendado));
    });

    window.addEventListener('pageshow', () => {
        raiz.querySelectorAll('form[data-filtros] :disabled').forEach((campo) => {
            campo.disabled = false;
        });
    });
}
