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
 *   formulário (campo escondido) é descartado;
 * - **na gaveta da `x-ui.filter-bar`** (abaixo do `lg`, `data-filtros-gaveta`),
 *   nada envia sozinho: escolhe-se com calma e a lista vem no "Aplicar" — que,
 *   como o Enter, passa pelo mesmo envio limpo (sem os vazios, com o
 *   `por_pagina`).
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

/**
 * Se a mudança espera o "Aplicar": o campo está na gaveta da barra, e a
 * gaveta está sendo gaveta — `position: fixed`, que é como ela fica abaixo do
 * `lg`. No computador ela é a própria linha de filtros (`static`), e tudo
 * envia ao mudar, como antes. Quem decide a largura é o CSS, uma vez só.
 */
export function esperaOAplicar(dentroDaGaveta, posicaoDaGaveta) {
    return dentroDaGaveta && posicaoDaGaveta === 'fixed';
}

/**
 * Prepara o formulário para ir: os campos vazios desligados (saem da URL) e o
 * `por_pagina` da URL junto. Serve ao envio automático e ao do botão ou do
 * Enter; repetir não muda nada. Devolve o que desligou e o que acrescentou.
 */
function prepararEnvio(formulario) {
    /*
     * Desligar o campo vazio no instante do envio o tira da URL; no
     * `pageshow` (voltar pelo histórico) eles voltam a ligar, e o
     * formulário fica inteiro para a próxima mudança.
     */
    const desligados = camposForaDaUrl([...formulario.elements]).filter((campo) => ! campo.disabled);

    // Marcados: no `pageshow` só estes religam — o que a tela desligou de propósito fica desligado.
    desligados.forEach((campo) => {
        campo.disabled = true;
        campo.dataset.filtrosDesligado = '';
    });

    /*
     * O "Por página" escolhido vai junto: ele vive na URL (o seletor da
     * paginação o manda), e o formulário de filtros não o tem. Sem isto,
     * mudar um filtro voltava ao padrão de 25.
     */
    const porPagina = porPaginaDaUrl(window.location.search, [...formulario.elements]);

    if (porPagina) {
        formulario.append(porPagina);
    }

    return { desligados, porPagina };
}

function enviar(formulario) {
    const { desligados, porPagina } = prepararEnvio(formulario);

    formulario.requestSubmit();

    // Se o envio foi barrado (validação nativa), nada navega: religa.
    setTimeout(() => {
        desligados.forEach((campo) => {
            campo.disabled = false;
            delete campo.dataset.filtrosDesligado;
        });
        porPagina?.remove();
    });
}

/**
 * O campo escondido com o `por_pagina` da URL atual, quando o formulário
 * ainda não tem um; null quando não há o que levar.
 */
export function porPaginaDaUrl(busca, campos, parametro = 'por_pagina') {
    const valor = new URLSearchParams(busca).get(parametro);

    if (! valor || campos.some((campo) => campo.name === parametro)) {
        return null;
    }

    const escondido = document.createElement('input');
    escondido.type = 'hidden';
    escondido.name = parametro;
    escondido.value = valor;

    return escondido;
}

export function ligarFiltros(raiz = document) {
    raiz.querySelectorAll('form[data-filtros]').forEach((formulario) => {
        if (formulario.dataset.filtrosLigado) {
            return;
        }

        formulario.dataset.filtrosLigado = '1';

        const espera = Number(formulario.dataset.filtrosEspera) || ESPERA_PADRAO;
        let agendado = null;

        // A gaveta da `x-ui.filter-bar`, quando há: abaixo do `lg`, a lista espera o "Aplicar".
        const gaveta = formulario.querySelector('[data-filtros-gaveta]');
        const naGaveta = (campo) => esperaOAplicar(
            gaveta !== null && gaveta.contains(campo),
            gaveta === null ? '' : window.getComputedStyle(gaveta).position,
        );

        formulario.addEventListener('change', (evento) => {
            if (naGaveta(evento.target)) {
                return;
            }

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

            if (naGaveta(campo)) {
                return;
            }

            clearTimeout(agendado);
            agendado = setTimeout(() => enviar(formulario), espera);
        });

        // Enter na busca (ou o "Aplicar" da gaveta) envia na hora, sem esperar o atraso, e pelo mesmo envio limpo.
        formulario.addEventListener('submit', () => {
            clearTimeout(agendado);
            prepararEnvio(formulario);
        });
    });

    window.addEventListener('pageshow', () => {
        raiz.querySelectorAll('form[data-filtros] [data-filtros-desligado]').forEach((campo) => {
            campo.disabled = false;
            delete campo.dataset.filtrosDesligado;
        });
    });
}
