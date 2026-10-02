@props([
    /*
     * O tipo do gráfico, pelo nome do ApexCharts: `bar`, `line`, `area`,
     * `donut`, `pie`, `radialBar`, `polarArea`, `radar`, `scatter`,
     * `heatmap`…
     */
    'type' => 'bar',
    /*
     * Os dados.
     *
     * Com eixo (`bar`, `line`, `area`…), uma lista de séries:
     * `[['name' => 'Recebido', 'data' => [1200, 1500, 980]]]`.
     *
     * Em fatias (`donut`, `pie`, `radialBar`, `polarArea`), uma lista de
     * números, um por rótulo: `[42, 13, 5]`.
     */
    'series' => [],
    // Os rótulos: as categorias do eixo horizontal, ou o nome de cada fatia.
    'labels' => [],
    // A altura, em pixels.
    'height' => 320,
    // Como os valores aparecem: `money` (R$ 1.234,56), `percent` (12,5%) ou, sem nada, o número (1.234,56).
    'format' => null,
    /*
     * A cor de cada série, pelo nome do token: `primary`, `success`,
     * `warning`, `danger`, `info`, `neutral` (e as versões claras,
     * `primary-soft`…). Sem ela, essa mesma ordem.
     *
     * A cor segue o significado, como no resto do sistema: verde para o
     * que deu certo, vermelho para o que venceu.
     */
    'colors' => null,
    // Empilha as séries umas sobre as outras, em vez de lado a lado.
    'stacked' => false,
    /*
     * Qualquer opção do ApexCharts, mesclada por cima do padrão do
     * sistema: é a saída para o que as props acima não cobrem.
     */
    'options' => [],
])

@php
    $config = [
        'type' => $type,
        'series' => $series,
        'labels' => $labels,
        'height' => (int) $height,
        'format' => $format,
        'colors' => $colors,
        'stacked' => (bool) $stacked,
        'options' => (object) $options,
    ];
@endphp

{{--
    O gráfico do sistema.

    Quem desenha é o ApexCharts, ligado pelo chart.js: aqui só vai o que
    o gráfico mostra, em `data-grafico`. As cores, a fonte, o tema escuro
    e o formato dos números vêm do design system — a tela diz o tipo e os
    dados.

    A biblioteca só é baixada nas páginas que têm um gráfico.
--}}
<div {{ $attributes->class(['w-full']) }} data-grafico="{{ json_encode($config) }}"></div>
