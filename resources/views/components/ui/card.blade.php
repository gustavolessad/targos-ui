@props([
    'title' => null,
    'subtitle' => null,
    /*
     * O tom do fundo. Prop, e não classe passada de fora: duas
     * `dark:bg-*` no mesmo elemento têm a mesma especificidade, e quem
     * vence é a ordem no CSS gerado — não a ordem em que se escreveu.
     *
     * `raised` é o card sobre o fundo do painel; `sunken`, um bloco
     * dentro de outro card, que precisa de um degrau de tom.
     */
    'tone' => 'raised',
    /**
     * O respiro do corpo: `none` (a foto que encosta na borda, como no
     * card do imóvel), `sm`, `md` (o padrão do painel), `lg` e `xl` —
     * estes dois crescem do celular para o computador.
     */
    'padding' => 'md',
    /** Com sombra: o card que flutua sobre um fundo colorido — a busca da home. */
    'elevated' => false,
    /** O card inteiro vira link: numa grade, quem clica mira a foto ou o título. */
    'href' => null,
    /** Classes do corpo, para quando ele precisa ser `flex` ou `grid`. */
    'bodyClass' => '',
])

@php
    $tons = [
        'raised' => 'bg-white dark:bg-neutral-900',
        'sunken' => 'bg-neutral-100 dark:bg-neutral-900',
    ];

    $respiros = [
        'none' => '',
        'sm' => 'p-2',
        'md' => 'p-4',
        'lg' => 'p-5 sm:p-6',
        'xl' => 'p-5 sm:p-8',
    ];

    $tag = $href ? 'a' : 'div';
@endphp

<{{ $tag }} @if ($href) href="{{ $href }}" @endif {{ $attributes->class([
    'rounded-2xl border border-neutral-300 dark:border-neutral-800',
    $tons[$tone] ?? $tons['raised'],
    'shadow-lg' => $elevated,
]) }}>
    @if ($title || $subtitle)
        <div class="border-b border-neutral-300 px-5 py-4 dark:border-neutral-800">
            @if ($title)
                <h2 class="font-semibold text-neutral-900 dark:text-white">{{ $title }}</h2>
            @endif

            @if ($subtitle)
                <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ $subtitle }}</p>
            @endif
        </div>
    @endif

    {{--
        `flex-1`: com o card em `flex flex-col` — os planos lado a lado —,
        o corpo ocupa a altura toda e o botão no pé de cada um se
        alinha. Fora de um flex, não muda nada.
    --}}
    <div @class(['flex-1', $respiros[$padding] ?? $respiros['md'], $bodyClass])>{{ $slot }}</div>
</{{ $tag }}>
