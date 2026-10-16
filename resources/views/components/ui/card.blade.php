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
     *
     * `success`, `info`, `warning` e `danger` tingem fundo e borda de
     * leve — menos que o `x-ui.alert`, que é um aviso —, para o quadro
     * de destaque: o resumo de totais, o bloco que resume a situação.
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
    /*
     * O arredondamento dos cantos: `none`, `sm` (4px), `md` (6px), `lg`
     * (8px), `xl` (12px) ou `2xl` (16px, o padrão). Prop, e não classe
     * de fora, pelo mesmo motivo do `tone`: um `rounded-lg` passado
     * conviveria com o `rounded-2xl` daqui, e quem venceria seria a
     * ordem no CSS gerado. E o rodapé acompanha o canto (ver abaixo).
     */
    'radius' => '2xl',
])

@php
    // A borda entra no tom: nos tingidos, ela acompanha o fundo.
    $tons = [
        'raised' => 'border-neutral-300 bg-white dark:border-neutral-800 dark:bg-neutral-900',
        'sunken' => 'border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900',
        'success' => 'border-success-200 bg-success-50/60 dark:border-success-500/30 dark:bg-success-500/10',
        'info' => 'border-info-200 bg-info-50/60 dark:border-info-500/30 dark:bg-info-500/10',
        'warning' => 'border-warning-200 bg-warning-50/60 dark:border-warning-500/30 dark:bg-warning-500/10',
        'danger' => 'border-danger-200 bg-danger-50/60 dark:border-danger-500/30 dark:bg-danger-500/10',
    ];

    $respiros = [
        'none' => '',
        'sm' => 'p-2',
        'md' => 'p-4',
        'lg' => 'p-5 sm:p-6',
        'xl' => 'p-5 sm:p-8',
    ];

    /*
     * O canto do card e o do rodapé, por raio. O do rodapé é o do card
     * menos a borda (1px): com o mesmo raio, o fundo cinza dele deixaria
     * uma fresta clara na curva. Escritos por extenso: o Tailwind só gera
     * a classe que encontra literal no arquivo.
     */
    $cantos = [
        'none' => ['rounded-none', 'rounded-b-none'],
        'sm' => ['rounded-sm', 'rounded-b-[3px]'],
        'md' => ['rounded-md', 'rounded-b-[5px]'],
        'lg' => ['rounded-lg', 'rounded-b-[7px]'],
        'xl' => ['rounded-xl', 'rounded-b-[11px]'],
        '2xl' => ['rounded-2xl', 'rounded-b-[15px]'],
    ];
    [$canto, $cantoDoRodape] = $cantos[$radius] ?? $cantos['2xl'];

    $tag = $href ? 'a' : 'div';

    /*
     * Os slots opcionais: `actions`, os botões à direita do título, e
     * `footer`, o rodapé com fundo próprio — o "Salvar" do bloco, o
     * "Ver todos" da lista.
     *
     * Pelo conteúdo, não só pela presença: o slot cujo conteúdo é um
     * `@can` que não passou chega vazio, e não deve deixar cabeçalho
     * nem rodapé sem nada dentro. O slot pode ser texto puro — o
     * `@slot('footer', 'texto')` —, e aí vale o texto.
     */
    $temConteudo = fn ($slot) => $slot instanceof \Illuminate\View\ComponentSlot ? $slot->hasActualContent() : filled($slot);
    $temAcoes = isset($actions) && $temConteudo($actions);
    $temRodape = isset($footer) && $temConteudo($footer);
@endphp

<{{ $tag }} @if ($href) href="{{ $href }}" @endif {{ $attributes->class([
    $canto,
    'border',
    $tons[$tone] ?? $tons['raised'],
    'shadow-lg' => $elevated,
    // Clicável, a borda vai à cor de ação no hover — como o `x-ui.stat-card` com `href`.
    'transition hover:border-primary-500 dark:hover:border-primary-500' => (bool) $href,
]) }}>
    @if ($temAcoes)
        {{--
            As ações na linha do título, encostadas à direita. O título
            pode quebrar linha; os botões, não (`shrink-0`).
        --}}
        <div class="flex items-center justify-between gap-4 border-b border-neutral-300 px-5 py-4 dark:border-neutral-800">
            <div class="min-w-0">
                @if ($title)
                    <h2 class="font-semibold text-neutral-900 dark:text-white">{{ $title }}</h2>
                @endif

                @if ($subtitle)
                    <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ $subtitle }}</p>
                @endif
            </div>

            <div class="flex shrink-0 items-center gap-2">{{ $actions }}</div>
        </div>
    @elseif ($title || $subtitle)
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
@if ($temRodape)

    {{--
        O rodapé tem o respiro do corpo, para o conteúdo dos dois se
        alinhar. O canto é o do card menos a borda (`$cantoDoRodape`):
        com o mesmo raio, o fundo cinza deixaria uma fresta clara na curva.

        O `@if` na margem é de propósito: sem rodapé, o card sai com o
        mesmo HTML de antes, sem linha em branco a mais.
    --}}
    <div @class([
        $cantoDoRodape,
        'border-t border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-white/5',
        $respiros[$padding] ?? $respiros['md'],
    ])>{{ $footer }}</div>
@endif
</{{ $tag }}>
