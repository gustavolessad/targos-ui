// --- Gráficos ---

/*
 * Os gráficos do sistema (<x-ui.chart>), desenhados pelo ApexCharts.
 *
 * O componente escreve no HTML o que o gráfico mostra — tipo, séries,
 * rótulos — em `data-grafico`, como JSON. Aqui entra o que faz todo
 * gráfico ter a cara do design system: as cores dos tokens, a fonte da
 * página, a grade e a dica discretas, o tema escuro, os números no
 * formato brasileiro.
 *
 * A biblioteca é pesada, e a maioria das telas não tem gráfico: ela só
 * é baixada na página que tiver um (`import()` sob demanda — o Vite a
 * separa num arquivo próprio).
 */

/*
 * As cores, na ordem em que as séries as recebem. Cada uma é uma classe
 * de texto do Tailwind, lida de um elemento de prova: assim o gráfico
 * segue o `--color-primary-*` de cada projeto sem depender de quais
 * variáveis o Tailwind decidiu emitir.
 *
 * As classes ficam escritas por inteiro: o Tailwind só gera o que
 * encontra no código-fonte.
 */
const CORES = {
    primary: 'text-primary-600',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
    info: 'text-info-500',
    neutral: 'text-neutral-400',
    'primary-soft': 'text-primary-300',
    'success-soft': 'text-success-300',
    'warning-soft': 'text-warning-300',
    'danger-soft': 'text-danger-300',
};

const ORDEM = ['primary', 'success', 'warning', 'danger', 'info', 'neutral', 'primary-soft', 'success-soft', 'warning-soft', 'danger-soft'];

/* O que o tema muda no gráfico: texto dos eixos e linhas da grade. */
const TEXTO = 'text-neutral-500 dark:text-neutral-400';
const GRADE = 'text-neutral-200 dark:text-neutral-800';
const FUNDO = 'text-white dark:text-neutral-900';
const DESTAQUE = 'text-neutral-900 dark:text-white';

/* Os tipos sem eixo: a série é uma lista de números, e os rótulos nomeiam as fatias. */
const SEM_EIXO = ['pie', 'donut', 'radialBar', 'polarArea'];

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reaisSemCentavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/**
 * Como um valor aparece, pelo nome do formato (`format` do componente).
 *
 * `curto` é o do eixo, onde os centavos só ocupam espaço; a dica mostra
 * o valor inteiro.
 */
export function formatador(formato, { curto = false } = {}) {
    return (valor) => {
        if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
            return '';
        }

        if (formato === 'money') {
            return (curto ? reaisSemCentavos : reais).format(valor);
        }

        if (formato === 'percent') {
            return `${numero.format(valor)}%`;
        }

        return numero.format(valor);
    };
}

/**
 * As séries tracejadas (`dashed: true`): a comparação, o período
 * anterior — a referência, e não o dado. No `area`, a tracejada vira
 * linha sem preenchimento, para não cobrir a principal.
 *
 * Devolve as séries como o ApexCharts as quer e o traço de cada uma
 * (`dashArray`), ou `null` quando nenhuma é tracejada.
 */
export function tracejar(series, tipo) {
    if (! Array.isArray(series) || ! series.some((serie) => serie?.dashed)) {
        return { series, tracos: null };
    }

    return {
        series: series.map(({ dashed, ...serie }) => ({ ...serie, type: dashed && tipo === 'area' ? 'line' : (serie.type ?? tipo) })),
        tracos: series.map((serie) => (serie.dashed ? 4 : 0)),
    };
}

/** Junta dois objetos de opções; o segundo vence, nível a nível. Listas são trocadas inteiras. */
export function mesclar(base, extra) {
    const saida = { ...base };

    for (const [chave, valor] of Object.entries(extra ?? {})) {
        const ambosObjetos = valor && typeof valor === 'object' && ! Array.isArray(valor)
            && saida[chave] && typeof saida[chave] === 'object' && ! Array.isArray(saida[chave]);

        saida[chave] = ambosObjetos ? mesclar(saida[chave], valor) : valor;
    }

    return saida;
}

/**
 * A cor que uma classe de texto dá, em `rgb(...)`.
 *
 * Passa por um canvas: o Tailwind escreve as cores em `oklch`, e o
 * ApexCharts faz conta com elas em alguns pontos (o realce, o degradê)
 * esperando o formato antigo.
 */
function corDaClasse(classe) {
    const prova = document.createElement('span');
    prova.className = `hidden ${classe}`;
    document.body.append(prova);

    const cor = getComputedStyle(prova).color;
    prova.remove();

    const tela = document.createElement('canvas');
    tela.width = 1;
    tela.height = 1;

    const pincel = tela.getContext('2d', { willReadFrequently: true });
    pincel.fillStyle = cor;
    pincel.fillRect(0, 0, 1, 1);

    const [r, g, b] = pincel.getImageData(0, 0, 1, 1).data;

    return `rgb(${r}, ${g}, ${b})`;
}

/** As cores das séries: os nomes pedidos (ou a ordem padrão); o que não for nome de token passa como veio. */
function paleta(nomes) {
    return (nomes?.length ? nomes : ORDEM).map((nome) => (CORES[nome] ? corDaClasse(CORES[nome]) : nome));
}

/** O que depende do tema, refeito a cada troca entre claro e escuro. */
function opcoesDoTema(config) {
    const escuro = document.documentElement.classList.contains('dark');
    const grade = corDaClasse(GRADE);

    return {
        colors: paleta(config.colors),
        /*
         * As cores do tema vêm daqui, uma a uma, e não do `theme.mode` da
         * biblioteca: o modo escuro dela troca a cor do texto pela dela, e
         * não a devolve ao voltar para o claro.
         */
        chart: { foreColor: corDaClasse(TEXTO) },
        grid: { borderColor: grade },
        tooltip: { theme: escuro ? 'dark' : 'light' },
        // O contorno das fatias é da cor do cartão: é ele que as separa.
        stroke: SEM_EIXO.includes(config.type) ? { colors: [corDaClasse(FUNDO)] } : {},
        // O número no centro da rosca é o dado principal dela: na cor do texto forte.
        plotOptions: { pie: { donut: { labels: { value: { color: corDaClasse(DESTAQUE) } } } } },
        xaxis: { axisBorder: { color: grade }, axisTicks: { color: grade } },
    };
}

/** As opções do ApexCharts para um gráfico: o padrão do sistema, o tema, e por cima o que a tela pediu. */
function opcoes(config, localidade) {
    const semEixo = SEM_EIXO.includes(config.type);
    const naDica = formatador(config.format);
    const noEixo = formatador(config.format, { curto: true });
    const { series, tracos } = semEixo ? { series: config.series, tracos: null } : tracejar(config.series, config.type);

    const base = {
        chart: {
            type: config.type,
            height: config.height,
            // A fonte da página, e não a da biblioteca.
            fontFamily: 'inherit',
            background: 'transparent',
            stacked: Boolean(config.stacked),
            toolbar: { show: false },
            zoom: { enabled: false },
            locales: [localidade],
            defaultLocale: localidade.name,
        },
        series,
        dataLabels: { enabled: false },
        legend: {
            position: semEixo ? 'bottom' : 'top',
            horizontalAlign: semEixo ? 'center' : 'right',
            fontSize: '13px',
            markers: { size: 5, shape: 'circle' },
            itemMargin: { horizontal: 8, vertical: 4 },
        },
        tooltip: { y: { formatter: naDica } },
        states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    };

    const comEixo = {
        stroke: { curve: 'smooth', width: ['line', 'area'].includes(config.type) ? 2.5 : 0, ...(tracos ? { dashArray: tracos } : {}) },
        fill: config.type === 'area'
            ? { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 95] } }
            : { opacity: 1 },
        plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '55%' } },
        grid: { strokeDashArray: 4, padding: { left: 8, right: 8 } },
        xaxis: {
            categories: config.labels,
            labels: { style: { fontSize: '12px' } },
            tooltip: { enabled: false },
        },
        yaxis: { labels: { style: { fontSize: '12px' }, formatter: noEixo } },
    };

    const emFatias = {
        labels: config.labels,
        stroke: { width: 2 },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: config.type === 'donut',
                        value: { fontSize: '20px', fontWeight: 600, formatter: naDica },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '13px',
                            formatter: (grafico) => naDica(grafico.globals.seriesTotals.reduce((soma, valor) => soma + valor, 0)),
                        },
                    },
                },
            },
        },
    };

    /*
     * A miniatura: a biblioteca tira eixos, grade e legenda e estica o
     * desenho na caixa. O que sobra para acertar é o traço mais fino, a
     * dica só com o rótulo e o valor, e nada de margem. Com mais de uma
     * série (a comparação), a dica diz de qual é cada valor.
     */
    const variasSeries = Array.isArray(config.series) && config.series.length > 1;
    const miniatura = config.sparkline ? {
        chart: { sparkline: { enabled: true } },
        stroke: { width: tracos ? tracos.map((traco) => (traco ? 1.5 : 2)) : 2 },
        markers: { size: 0, hover: { size: 4 } },
        grid: { padding: { left: 0, right: 0, top: 4, bottom: 0 } },
        tooltip: {
            x: { show: true },
            y: { title: { formatter: variasSeries ? (nome) => `${nome}:` : () => '' } },
            marker: { show: variasSeries },
        },
    } : {};

    return mesclar(mesclar(mesclar(mesclar(base, semEixo ? emFatias : comEixo), miniatura), opcoesDoTema(config)), config.options);
}

function ler(elemento) {
    try {
        return JSON.parse(elemento.dataset.grafico);
    } catch {
        return null;
    }
}

/** Liga os gráficos da página — ou de um trecho dela, quando o HTML chega depois. */
export function ligarGraficos(raiz = document) {
    const pendentes = [...raiz.querySelectorAll('[data-grafico]:not([data-grafico-ligado])')]
        .map((elemento) => ({ elemento, config: ler(elemento) }))
        .filter(({ config }) => config !== null);

    if (pendentes.length === 0) {
        return;
    }

    // O espaço do gráfico antes de ele chegar: sem isso a tela pula quando a biblioteca termina de baixar.
    pendentes.forEach(({ elemento, config }) => {
        elemento.dataset.graficoLigado = '1';
        elemento.style.minHeight = `${config.height}px`;
    });

    Promise.all([import('apexcharts'), import('apexcharts/dist/locales/pt-br.json')]).then(([biblioteca, idioma]) => {
        const ApexCharts = biblioteca.default;
        const localidade = idioma.default ?? idioma;

        const graficos = pendentes.map(({ elemento, config }) => {
            const grafico = new ApexCharts(elemento, opcoes(config, localidade));

            grafico.render();

            // Para a tela que precisa mexer no gráfico depois (trocar as séries, por exemplo).
            elemento.grafico = grafico;

            return { grafico, config };
        });

        // O botão de tema troca a classe do <html>: os gráficos acompanham na hora.
        new MutationObserver(() => {
            graficos.forEach(({ grafico, config }) => grafico.updateOptions(opcoesDoTema(config), false, false));
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
}
