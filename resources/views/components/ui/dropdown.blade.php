@props([
    'id',
    'icon' => 'ellipsis-vertical',
    'label' => 'Ações',
    'width' => 'w-44',
    'size' => 'icon',
    'variant' => 'outline',
    'side' => 'bottom',
    // Texto ao lado do ícone (ex.: "Compartilhar"); sem ele, o botão é só o ícone.
    'text' => null,
])

@php
    /*
     * Para onde a lista abre. Embaixo do botão, salvo quando ele está
     * no pé da tela — aí `side="top"` evita que ela nasça fora da
     * janela e force a rolagem.
     */
    $lados = [
        'bottom' => 'top-full mt-1.5',
        'top' => 'bottom-full mb-1.5',
    ];

    /*
     * De onde a lista cresce: do canto colado ao botão. Abrindo para
     * baixo ela nasce no alto; para cima, embaixo — assim parece sair
     * do botão, e não aparecer solta ao lado dele.
     */
    $origens = [
        'bottom' => 'origin-top-right',
        'top' => 'origin-bottom-right',
    ];
@endphp

{{--
    O menu de ações da linha.

    O botão declara `data-abre-menu="{{ $id }}"` e a lista tem esse id —
    é o que `ligarDropdowns()` em resources/js/app.js procura. Um clique
    fora fecha.

    `relative` no envelope para a lista se posicionar pelo botão, e não
    pela página.

    O botão é o `<x-ui.button>` do sistema, de contorno: na linha da
    tabela ele precisa se anunciar como clicável antes do mouse chegar,
    e o `ghost` só aparecia no hover.
--}}
<div class="relative inline-block text-start">
    <x-ui.button type="button"
                 :variant="$variant"
                 :size="$size"
                 data-abre-menu="{{ $id }}"
                 :aria-label="$label"
                 {{ $attributes }}>
        <x-ui.icon :name="$icon" class="size-4" />
        @if ($text)
            {{ $text }}
        @endif
    </x-ui.button>

    {{--
        `end-0` para o menu não vazar da tela na última coluna.

        O `p-1` é o que dá ao realce de cada item a margem em volta —
        sem ele o hover encostaria nas bordas e desmancharia o canto
        arredondado.

        A animação é de CSS: o JavaScript só põe e tira `data-aberto`, e
        a lista cresce do canto do botão. Sai mais rápido do que entra —
        quem fecha já decidiu, e esperar a saída inteira irrita.
    --}}
    <div id="{{ $id }}" data-menu
         @class([
             'absolute end-0 z-20 hidden rounded-xl bg-white p-1',
             $width,
             'shadow-lg ring-1 ring-neutral-200',
             'dark:bg-neutral-900 dark:ring-neutral-800',
             'scale-95 opacity-0 transition duration-150 ease-out',
             '[&[data-aberto]]:scale-100 [&[data-aberto]]:opacity-100',
             $lados[$side] ?? $lados['bottom'],
             $origens[$side] ?? $origens['bottom'],
         ])>
        {{ $slot }}
    </div>
</div>
