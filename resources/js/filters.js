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
 *   `por_pagina`);
 * - a gaveta, ao abrir, vai para o fim do `<body>` (é o `layers.js`, para ficar
 *   por cima de tudo): os campos dela ficam ligados ao formulário pelo
 *   atributo `form`, e ela volta ao lugar ao fechar — senão o "Aplicar"
 *   enviaria o formulário vazio;
 * - abaixo do `lg`, embaixo do botão "Filtros", uma etiqueta por filtro em uso
 *   (o que a URL traz), com o X que leva à mesma lista sem ele.
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

/** O nome do parâmetro sem os colchetes: `status[]` e `status[0]` são o filtro `status`. */
export function chaveDoParametro(nome) {
    return String(nome ?? '').replace(/\[.*$/, '');
}

/**
 * Os filtros em uso: as chaves que a URL traz com valor. A página e o "por
 * página" não são filtro. O que o servidor aplica sozinho (o padrão da tela)
 * não está na URL, e por isso não vira etiqueta.
 */
export function chavesEmUso(busca) {
    const usadas = new Set();

    for (const [nome, valor] of new URLSearchParams(busca)) {
        if (String(valor).trim() !== '') {
            usadas.add(chaveDoParametro(nome));
        }
    }

    usadas.delete('page');
    usadas.delete('por_pagina');

    return usadas;
}

/** A busca da URL sem as chaves dadas e sem a página: o X de uma etiqueta. */
export function semAsChaves(busca, chaves) {
    const fora = new Set([...chaves, 'page']);
    const ficam = new URLSearchParams();

    for (const [nome, valor] of new URLSearchParams(busca)) {
        if (! fora.has(chaveDoParametro(nome))) {
            ficam.append(nome, valor);
        }
    }

    const texto = ficam.toString();

    return texto === '' ? '' : `?${texto}`;
}

/** `2026-11-01` → `01/11/2026`; o que não é data fica como veio. */
function dataCurta(iso) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));

    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : String(iso ?? '');
}

/** O período da etiqueta, com uma ponta aberta ou as duas. */
export function textoDoPeriodo(de, ate) {
    if (de && ate) {
        return `${dataCurta(de)} a ${dataCurta(ate)}`;
    }

    if (de) {
        return `a partir de ${dataCurta(de)}`;
    }

    return ate ? `até ${dataCurta(ate)}` : '';
}

/** O texto de um elemento, numa linha só. */
function textoDe(elemento) {
    return String(elemento?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** O nome de um campo da barra: o rótulo dele, ou o da caixa solta. */
function rotuloDe(unidade) {
    // A caixa solta: o primeiro rótulo com texto — o da chave (`x-ui.toggle`) embrulha só o desenho dela.
    if (unidade.matches('input')) {
        return [...(unidade.labels ?? [])].map(textoDe).find((texto) => texto !== '') ?? textoDe(unidade.closest('label'));
    }

    return textoDe(unidade.querySelector('[data-campo-rotulo]') ?? unidade.querySelector('legend, label'));
}

/** O que está escolhido num campo da barra, como a pessoa lê. */
function valorDe(unidade, campos) {
    if (unidade.matches('input')) {
        return '';
    }

    const inicio = unidade.querySelector('[data-periodo-inicio]');
    const fim = unidade.querySelector('[data-periodo-fim]');

    if (inicio || fim) {
        return textoDoPeriodo(inicio?.value, fim?.value);
    }

    const select = campos.find((campo) => campo.tagName === 'SELECT');

    if (select) {
        return [...select.selectedOptions].filter((opcao) => opcao.value !== '').map(textoDe).join(', ');
    }

    const radio = campos.find((campo) => campo.type === 'radio' && campo.checked);

    if (radio) {
        return textoDe(radio.closest('label'));
    }

    const texto = campos.find((campo) => campo.tagName === 'INPUT' && ! ['hidden', 'checkbox', 'radio'].includes(campo.type));

    return String(texto?.value ?? '').trim();
}

// As classes do chip do select de várias escolhas: a etiqueta tem a mesma cara.
const CLASSE_DA_ETIQUETA = 'inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700';

/** As etiquetas dos filtros em uso, embaixo do botão "Filtros". */
function desenharEtiquetas(formulario, gaveta) {
    const lugar = formulario.querySelector('[data-filtros-etiquetas]');

    if (! lugar) {
        return;
    }

    const busca = window.location.search;
    const usadas = chavesEmUso(busca);

    // Cada campo da barra (`data-filtro-campo`) e cada caixa solta (o "Apenas vencidos").
    const unidades = [
        ...gaveta.querySelectorAll('[data-filtro-campo]'),
        ...[...gaveta.querySelectorAll('input[type="checkbox"][name]')].filter((caixa) => ! caixa.closest('[data-filtro-campo]')),
    ];

    const etiquetas = unidades.flatMap((unidade) => {
        const campos = unidade.matches('input') ? [unidade] : [...unidade.querySelectorAll('[name]')];
        const chaves = [...new Set(campos.map((campo) => chaveDoParametro(campo.name)).filter((chave) => chave !== ''))];

        if (! chaves.some((chave) => usadas.has(chave))) {
            return [];
        }

        const rotulo = rotuloDe(unidade);
        const valor = valorDe(unidade, campos);
        const etiqueta = document.createElement('a');

        etiqueta.href = window.location.pathname + semAsChaves(busca, chaves);
        etiqueta.className = CLASSE_DA_ETIQUETA;
        etiqueta.setAttribute('aria-label', `Tirar o filtro ${rotulo}`);

        const texto = document.createElement('span');
        texto.className = 'truncate';
        texto.textContent = valor === '' ? rotulo : `${rotulo}: ${valor}`;

        const tirar = document.createElement('span');
        tirar.className = '-me-0.5 px-0.5 leading-none text-neutral-400';
        tirar.setAttribute('aria-hidden', 'true');
        tirar.textContent = '×';

        etiqueta.append(texto, tirar);

        return [etiqueta];
    });

    lugar.replaceChildren(...etiquetas);
    lugar.hidden = etiquetas.length === 0;
}

/**
 * Os campos da gaveta ligados ao formulário pelo atributo `form`: a gaveta
 * aberta mora no fim do `<body>`, fora dele. Repetir não muda nada.
 */
function prenderAoFormulario(formulario, gaveta) {
    if (! formulario.id) {
        formulario.id = `${gaveta.id}-formulario`;
    }

    gaveta.querySelectorAll('input, select, textarea, button').forEach((campo) => {
        campo.setAttribute('form', formulario.id);
    });
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

        if (gaveta) {
            prenderAoFormulario(formulario, gaveta);
            desenharEtiquetas(formulario, gaveta);

            // Onde ela mora: ao fechar, volta para cá — no computador ela é a própria linha de filtros.
            const lugar = document.createComment('filtros');
            gaveta.before(lugar);

            document.addEventListener('offcanvas:aberto', (evento) => {
                if (evento.detail?.id === gaveta.id) {
                    prenderAoFormulario(formulario, gaveta);
                }
            });

            document.addEventListener('offcanvas:fechado', (evento) => {
                if (evento.detail?.id !== gaveta.id) {
                    return;
                }

                // Depois da animação de saída (300 ms, a do `layers.js`), se não abriu de novo.
                setTimeout(() => {
                    if (! ('aberto' in gaveta.dataset)) {
                        lugar.after(gaveta);
                    }
                }, 350);
            });
        }
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
