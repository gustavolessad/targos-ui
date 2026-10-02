@props([
    /** O que o número significa. */
    'label',
    'value',
    /**
     * O que o número é, em uma ou duas frases: vira um ícone de
     * informação no canto do card, com o texto na dica. É para o que o
     * rótulo não cabe dizer — de onde vem o número, o que entra na conta.
     */
    'info' => null,
    /** O nome de um ícone decorativo, no mesmo canto. Com `info`, quem aparece é a informação. */
    'icon' => null,
    /**
     * A cor do número, pelo significado: `neutral`, `danger`, `warning`, `success`, `info`.
     *
     * Cor só onde ela informa — um card sempre vermelho deixa de
     * alarmar, e um painel colorido inteiro não diz o que olhar primeiro.
     */
    'color' => 'neutral',
    /** Para onde o card leva, quando leva a algum lugar. */
    'href' => null,
    /** Uma linha pequena abaixo do número — "Original: R$ 1.000,00". */
    'hint' => null,
    /**
     * O tamanho do número: `md` (o das listagens) ou `lg`, maior e mais
     * pesado, para o card que é o assunto da tela — os do dashboard.
     */
    'size' => 'md',
    /**
     * O gráfico do pé do card: uma lista de números, na ordem do tempo.
     * Fica encostado na base e nas laterais, na cor do card, sem eixos —
     * mostra para onde o número foi, não cada valor.
     */
    'trend' => null,
    /** O rótulo de cada ponto do gráfico (a data, o mês), para a dica dele. */
    'trendLabels' => [],
    /** Como os valores do gráfico aparecem na dica: `money`, `percent` ou, sem nada, número. */
    'trendFormat' => null,
    /** A altura do gráfico, em pixels. */
    'trendHeight' => 88,
    /**
     * A comparação: outra lista de números, ponto a ponto com `trend` —
     * o período anterior. Aparece tracejada e cinza, atrás da principal:
     * é a referência para ler o número, não outro número.
     */
    'trendCompare' => null,
    /** O nome da comparação, na dica do gráfico. */
    'trendCompareLabel' => 'Período anterior',
])

{{--
    O card de indicador, das listagens e do painel.

    Vira link quando recebe `href`: o número que pede ação deve levar à
    tela que a resolve.
--}}
@php
    $classesDoNumero = match ($color) {
        'danger' => 'text-danger-600 dark:text-danger-400',
        'warning' => 'text-warning-600 dark:text-warning-400',
        'success' => 'text-success-600 dark:text-success-400',
        'info' => 'text-info-600 dark:text-info-400',
        default => 'text-neutral-900 dark:text-white',
    };

    $classesDoTamanho = $size === 'lg' ? 'text-3xl font-bold tracking-tight' : 'text-2xl font-semibold';

    // O gráfico na cor do número; o card sem cor usa a de ação.
    $corDoGrafico = in_array($color, ['danger', 'warning', 'success', 'info'], true) ? $color : 'primary';

    $seriesDoGrafico = $trend === null ? [] : [['name' => $label, 'data' => array_values($trend)]];
    $coresDoGrafico = [$corDoGrafico];

    if ($trend !== null && $trendCompare !== null) {
        $seriesDoGrafico[] = ['name' => $trendCompareLabel, 'data' => array_values($trendCompare), 'dashed' => true];
        $coresDoGrafico[] = 'neutral';
    }

    $classes = [
        /*
         * O mesmo fundo da tabela e dos cards: no escuro, um cinza
         * acima do resto fazia os indicadores parecerem um bloco de
         * outra tela, e não o topo desta.
         */
        'rounded-xl border border-neutral-300 bg-white p-4',
        'dark:border-neutral-800 dark:bg-neutral-900',
        // Só o que é clicável reage ao mouse.
        'block transition hover:border-neutral-300 dark:hover:border-neutral-700' => $href !== null,
    ];
@endphp

<{{ $href !== null ? 'a' : 'div' }}
    @if ($href !== null) href="{{ $href }}" @endif
    {{ $attributes->class($classes) }}>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">{{ $label }}</p>

            <p class="mt-1 {{ $classesDoTamanho }} {{ $classesDoNumero }}">{{ $value }}</p>

            @if ($hint)
                <p class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
            @endif
        </div>

        @if ($info !== null)
            {{--
                `span`, e não botão: o card pode ser um link, e botão dentro
                de link não vale. O clique na informação não segue o link —
                quem clicou ali quer ler a dica, não trocar de tela.
            --}}
            <x-ui.tooltip :text="$info" side="left" class="shrink-0">
                <span role="img" aria-label="{{ $info }}"
                      onclick="event.preventDefault()"
                      class="flex cursor-help items-center text-neutral-400 transition
                             hover:text-neutral-600 dark:hover:text-neutral-200">
                    <x-ui.icon name="info" class="size-4" />
                </span>
            </x-ui.tooltip>
        @elseif ($icon !== null)
            <x-ui.icon :name="$icon" class="size-5 shrink-0 text-neutral-400" />
        @endif
    </div>

    @if ($trend !== null)
        {{--
            Margens negativas do tamanho do padding do card (`p-4`): o
            gráfico encosta na base e nas laterais. O canto de baixo do
            desenho acompanha o do card — um ponto a menos, pela borda.
        --}}
        <div class="-mx-4 -mb-4 mt-3 [&_svg]:rounded-b-[11px]" data-tendencia>
            <x-ui.chart type="area" sparkline :height="$trendHeight"
                        :series="$seriesDoGrafico"
                        :labels="array_values($trendLabels)"
                        :format="$trendFormat"
                        :colors="$coresDoGrafico" />
        </div>
    @endif
</{{ $href !== null ? 'a' : 'div' }}>
