@props([
    'text' => null,
    // top | bottom | left | right
    'side' => 'right',
    // sm | md | lg
    'size' => 'md',
    /*
     * dark (padrão) | light | primary | success | danger | warning.
     * `dark` é "o contrário do tema": escura no tema claro, clara no escuro.
     * As outras são para quando a dica precisa chamar atenção.
     */
    'color' => 'dark',
    // hover (passar o mouse ou focar pelo teclado) | click (abre e fecha no clique)
    'trigger' => 'hover',
    'when' => null,
])

@php
    /*
     * A dica.
     *
     * No `hover`, só CSS: `group-hover` e `group-focus-within` no envelope
     * fazem a bolha aparecer, sem JavaScript. O `title` do navegador faria
     * o mesmo, mas com meio segundo de espera, sem estilo e sem teclado.
     *
     * No `click`, resources/js/ui/tooltip.js liga e desliga `data-aberta`
     * no envelope; clicar fora ou apertar Esc fecha. Serve ao celular, que
     * não tem mouse para passar por cima, e à dica que a pessoa quer ler
     * com calma.
     *
     *     <x-ui.tooltip text="Marcas" side="top" color="light" trigger="click">
     *         <button type="button">?</button>
     *     </x-ui.tooltip>
     *
     * Quem recebe a dica precisa ser alcançável pelo teclado — um link,
     * um botão — ou ela só aparece para quem usa mouse.
     *
     * No lugar de `text`, o slot `conteudo` põe qualquer coisa dentro da
     * bolha — uma lista de links, por exemplo. Aí ela deixa de ser dica e
     * vira menu: recebe o mouse em vez de deixá-lo passar, e fica sem seta.
     *
     * `when` limita a dica a uma condição de CSS, escrita como seletor do
     * Tailwind — por exemplo `lg:` para mostrá-la só na tela grande. A
     * condição fica na bolha, nunca no envelope: escondê-lo apagaria junto
     * o item que ele embrulha.
     */
    $lado = in_array($side, ['top', 'bottom', 'left', 'right'], true) ? $side : 'right';
    $ehMenu = isset($conteudo);
    $noClique = $trigger === 'click';

    // A bolha, centrada no eixo do item; a seta, no meio da borda que o encara.
    $lados = [
        'top' => ['bottom-full left-1/2 mb-2 -translate-x-1/2', 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2'],
        'bottom' => ['top-full left-1/2 mt-2 -translate-x-1/2', 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2'],
        'left' => ['end-full top-1/2 me-2 -translate-y-1/2', 'start-full top-1/2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2'],
        'right' => ['start-full top-1/2 ms-2 -translate-y-1/2', 'end-full top-1/2 -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2'],
    ];
    [$posicao, $posicaoDaSeta] = $lados[$lado];

    // A entrada (animate-surgir, a do dropdown) cresce a partir do item.
    $origem = ['top' => 'origin-bottom', 'bottom' => 'origin-top', 'left' => 'origin-right', 'right' => 'origin-left'][$lado];

    // Quebra em linhas a partir da largura máxima: uma frase longa numa linha só é pior de ler.
    // `overflow-wrap:anywhere`: texto sem espaço (uma chave de acesso, um link) quebra dentro do balão;
    // `whitespace-normal`: dentro de uma célula `whitespace-nowrap`, o balão não herda o "não quebre".
    $tamanhos = [
        'sm' => 'px-2 py-1 text-[11px] max-w-48 whitespace-normal [overflow-wrap:anywhere]',
        'md' => 'px-2.5 py-1.5 text-xs max-w-64 whitespace-normal [overflow-wrap:anywhere]',
        'lg' => 'px-3 py-2 text-sm max-w-80 whitespace-normal [overflow-wrap:anywhere]',
    ];

    // Fundo (a seta usa o mesmo) e texto. A `dark` inverte o tema para se destacar da tela.
    $cores = [
        'dark' => ['bg-neutral-900 dark:bg-white', 'text-white ring-black/5 dark:text-neutral-900 dark:ring-black/10'],
        'light' => ['bg-white', 'text-neutral-800 ring-neutral-200 dark:ring-white/10'],
        'primary' => ['bg-primary-600', 'text-white ring-primary-700/20'],
        'success' => ['bg-success-600', 'text-white ring-success-700/20'],
        'danger' => ['bg-danger-600', 'text-white ring-danger-700/20'],
        'warning' => ['bg-warning-500', 'text-neutral-950 ring-warning-600/20'],
    ];
    [$fundo, $texto] = $cores[$color] ?? $cores['dark'];

    $aparece = $noClique
        ? 'group-data-[aberta]/dica:block'
        : ($when === null
            ? 'group-hover/dica:block group-focus-within/dica:block'
            : $when.':group-hover/dica:block '.$when.':group-focus-within/dica:block');
@endphp

<div {{ $attributes->class(['group/dica relative']) }} @if ($noClique) data-dica-clique @endif>
    {{ $slot }}

    <div @if (! $ehMenu) role="tooltip" @endif
         data-lado="{{ $lado }}"
         @class([
             'absolute z-50 hidden rounded-lg shadow-lg ring-1 animate-surgir',
             $posicao,
             $origem,
             $aparece,
             // O menu acompanha o tema: é uma superfície, não um aviso.
             'bg-white ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 min-w-44 p-1' => $ehMenu,
             /*
              * A dica no hover deixa o mouse passar: ela só descreve o que
              * já está ali. No clique ela é o próprio assunto — pode ter
              * texto para selecionar.
              */
             'w-max font-medium '.$fundo.' '.$texto.' '.($tamanhos[$size] ?? $tamanhos['md']) => ! $ehMenu,
             'pointer-events-none' => ! $ehMenu && ! $noClique,
             /*
              * `data-sem-dica` no envelope cala a dica sem tirá-la da
              * página: o botão que só se explica quando está desligado
              * liga e desliga o atributo por script. `invisible`, e não
              * `hidden`, para não disputar com o `block` do hover.
              */
             'group-data-[sem-dica]/dica:invisible',
         ])>
        @unless ($ehMenu)
            {{-- A seta: um quadrado girado, meio escondido atrás da bolha. --}}
            <span aria-hidden="true" data-dica-seta
                  class="absolute -z-10 size-2 rotate-45 {{ $fundo }} {{ $posicaoDaSeta }}"></span>
        @endunless

        @if ($ehMenu)
            {{ $conteudo }}
        @else
            {{-- O texto num gancho, para um script trocá-lo sem levar a seta junto. --}}
            <span data-dica-texto>{{ $text }}</span>
        @endif
    </div>
</div>
