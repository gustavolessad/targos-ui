@props([
    /** O que o número significa. */
    'label',
    /** O número. No `loading`, não precisa vir. */
    'value' => null,
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
    /**
     * O que vem abaixo do número. Um texto ("Original: R$ 1.000,00") ou
     * uma lista de informações, cada uma um texto ou
     * `['icon' => 'file-check', 'text' => 'Com nota R$ 500,00']` — lado a
     * lado, separadas pelo espaço, e o ícone diz o que cada uma é.
     */
    'hint' => null,
    /**
     * O tamanho do número principal: `sm` (um pouco menor, para cards
     * apertados), `md` (o padrão) ou `lg` (maior, para o número que é o
     * assunto da tela). Só o número muda; o resto do card fica igual.
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
    'trendHeight' => 140,
    /**
     * A comparação: outra lista de números, ponto a ponto com `trend` —
     * o período anterior. Aparece tracejada e cinza, atrás da principal:
     * é a referência para ler o número, não outro número.
     */
    'trendCompare' => null,
    /** O nome da comparação, na dica do gráfico. */
    'trendCompareLabel' => 'Período anterior',
    /*
     * `solid` (padrão) ou `filled`: o card cheio na cor de ação, para o
     * indicador que resume os outros (o saldo final do extrato) e
     * precisa saltar da fileira.
     */
    'variant' => 'solid',
    /**
     * O card antes de o número chegar (o trecho que vem depois, pelo
     * `data-carregar`): o rótulo fica, e o número, a dica e o gráfico —
     * com `trend`, mesmo vazio — dão lugar ao `x-ui.skeleton`, nos mesmos
     * tamanhos. O card de verdade entra no lugar sem a tela pular.
     */
    'loading' => false,
])

{{--
    O card de indicador, das listagens e do painel.

    Vira link quando recebe `href`: o número que pede ação deve levar à
    tela que a resolve.
--}}
@php
    /*
     * A cor do número sai do `data-cor` do próprio `<p>`, e não de uma
     * classe escolhida aqui: um script que refaz o total (o resumo que
     * muda com o filtro, sem recarregar) troca `textContent` e
     * `dataset.cor`, e a cor acompanha. A prop `color` é só o valor
     * inicial. As variantes estão escritas por extenso para o Tailwind
     * as enxergar; o `neutral` é o padrão, sem variante.
     *
     * No `filled`, o número fica no contraste do card, seja qual for o
     * `data-cor`: as variantes de cor não entram, e nada as vence.
     */
    $classesDoNumero = $variant === 'filled' ? 'text-primary-contrast' : implode(' ', [
        'text-neutral-900 dark:text-white',
        'data-[cor=danger]:text-danger-600 dark:data-[cor=danger]:text-danger-400',
        'data-[cor=warning]:text-warning-600 dark:data-[cor=warning]:text-warning-400',
        'data-[cor=success]:text-success-600 dark:data-[cor=success]:text-success-400',
        'data-[cor=info]:text-info-600 dark:data-[cor=info]:text-info-400',
    ]);

    $cores = ['neutral', 'danger', 'warning', 'success', 'info'];
    $corDoNumero = in_array($color, $cores, true) ? $color : 'neutral';

    $classesDoTamanho = match ($size) {
        'sm' => 'text-2xl font-bold tracking-tight',
        'lg' => 'text-4xl font-bold tracking-tight',
        default => 'text-3xl font-bold tracking-tight',
    };

    // No `loading`, a altura da linha do número, para o esqueleto ocupar o mesmo lugar.
    $alturaDoNumero = match ($size) {
        'sm' => 'h-8',
        'lg' => 'h-10',
        default => 'h-9',
    };

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
        // Coluna: numa grade, o card estica até a altura da linha, e o gráfico fica no pé.
        'flex flex-col',
        /*
         * Item de grade não encolhe abaixo do próprio conteúdo, e o SVG do
         * gráfico sai com a largura de quando foi desenhado: sem o
         * `min-w-0`, o card ficava preso nela e vazava da tela estreita.
         */
        'min-w-0',
        'dark:border-neutral-800 dark:bg-neutral-900' => $variant !== 'filled',
        /*
         * Cheio: fundo e borda na cor de ação, e tudo o que é texto ou
         * ícone dentro (rótulo, número, dica, ícone) no contraste dela.
         * Pelos seletores `[&_…]`, para não repetir a decisão em cada
         * elemento do card.
         */
        'border-primary-600 bg-primary-600 text-primary-contrast dark:border-primary-600 dark:bg-primary-600 '
            .'[&_p]:text-primary-contrast [&_li]:text-primary-contrast/80 [&_svg]:text-primary-contrast/80 [&_span]:text-primary-contrast' => $variant === 'filled',
        /*
         * Só o que é clicável reage ao mouse: a borda na cor de ação, nos
         * dois temas. Era `hover:border-neutral-300`, a mesma da borda em
         * repouso no claro — o hover só aparecia no escuro.
         */
        'transition hover:border-primary-500 dark:hover:border-primary-500' => $href !== null && $variant !== 'filled',
        'transition hover:bg-primary-700' => $href !== null && $variant === 'filled',
    ];
@endphp

<{{ $href !== null ? 'a' : 'div' }}
    @if ($href !== null) href="{{ $href }}" @endif
    @if ($loading) aria-busy="true" @endif
    {{ $attributes->class($classes) }}>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <p class="truncate text-sm font-medium text-neutral-900 dark:text-white">{{ $label }}</p>

            @if ($loading)
                <div class="mt-1 flex items-center {{ $alturaDoNumero }}">
                    <x-ui.skeleton class="h-3/4 w-28" />
                </div>
            @else
                {{-- `data-stat-valor`: o gancho para o script que troca o número (e a cor, pelo `data-cor`). --}}
                <p class="mt-1 {{ $classesDoTamanho }} {{ $classesDoNumero }}" data-stat-valor data-cor="{{ $corDoNumero }}">{{ $value }}</p>
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

    @if ($loading)
        {{-- A dica no mesmo lugar da de verdade: logo abaixo do número com gráfico, no pé sem ele. --}}
        <div @class(['mt-2' => $trend !== null, 'mt-auto pt-3' => $trend === null])>
            {{-- A altura da linha do `text-xs`, por dentro: com o `pt-3` na mesma caixa, o `h-4` contaria o respiro. --}}
            <div class="flex h-4 items-center">
                <x-ui.skeleton class="h-3 w-32 max-w-full" />
            </div>
        </div>
    @elseif ((is_array($hint) && $hint !== []) || (is_string($hint) && $hint !== ''))
        {{--
            Com gráfico, as informações ficam logo abaixo do número, e o
            gráfico no pé. Sem gráfico, elas vão para o pé do card: numa
            grade que estica o card, o número fica em cima e elas embaixo,
            alinhadas com as dos cards vizinhos.
        --}}
        <div @class(['min-w-0', 'mt-2' => $trend !== null, 'mt-auto pt-3' => $trend === null])>
            @if (is_array($hint))
                <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                    @foreach ($hint as $item)
                        <li class="flex min-w-0 items-center gap-1.5">
                            @if (is_array($item) && ($item['icon'] ?? null))
                                <x-ui.icon :name="$item['icon']" class="size-3.5 text-neutral-400 dark:text-neutral-500" />
                            @endif
                            <span class="truncate">{{ is_array($item) ? ($item['text'] ?? '') : $item }}</span>
                        </li>
                    @endforeach
                </ul>
            @else
                <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
            @endif
        </div>
    @endif

    @if ($trend !== null && $loading)
        <div class="-mx-4 -mb-4 mt-auto pt-3">
            <x-ui.skeleton class="w-full rounded-none rounded-b-[11px]" :style="'height: '.(int) $trendHeight.'px'" />
        </div>
    @elseif ($trend !== null)
        {{--
            Margens negativas do tamanho do padding do card (`p-4`): o
            gráfico encosta na base e nas laterais. O canto de baixo do
            desenho acompanha o do card — um ponto a menos, pela borda.
        --}}
        <div class="-mx-4 -mb-4 mt-auto pt-3 [&_svg]:rounded-b-[11px]" data-tendencia>
            <x-ui.chart type="area" sparkline :height="$trendHeight"
                        :series="$seriesDoGrafico"
                        :labels="array_values($trendLabels)"
                        :format="$trendFormat"
                        :colors="$coresDoGrafico" />
        </div>
    @endif
</{{ $href !== null ? 'a' : 'div' }}>
