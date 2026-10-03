@props([
    'title',
    'back' => null,
    'subtitle' => null,
    /*
     * O caminho de navegação, [[rótulo, url], …] (o último sem url). Sem
     * ele, o topo fica só com o título.
     */
    'breadcrumbs' => [],
])

{{--
    O topo de cada tela: o caminho e o título à esquerda, as ações à direita.

    O slot recebe as ações (busca, botão de criar); `back` põe o "Voltar"
    antes delas, para a ação principal (Salvar, Nova…) ficar na ponta direita.
    As ações alinham pela base, na linha do título (o caminho fica acima dele).

    O slot `aside` fica ao lado do título, na linha dele: os selos e chips
    que dizem o estado do que a tela mostra ("Concluída", "Em aberto").
    Centrados na altura do título; no celular, quando não cabem, quebram
    para baixo dele.
--}}
<div {{ $attributes->class(['mb-6 flex flex-wrap items-end justify-between gap-3']) }}>
    <div class="min-w-0">
        @if (count($breadcrumbs) > 0)
            <nav aria-label="Caminho" class="mb-1">
                <ol class="flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                    @foreach ($breadcrumbs as [$rotulo, $url])
                        <li class="flex min-w-0 items-center gap-1">
                            @if (! $loop->first)
                                <x-ui.icon name="chevron-right" class="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-600" />
                            @endif

                            @if ($url && ! $loop->last)
                                <a href="{{ $url }}" data-migalha
                                   class="truncate transition hover:text-neutral-900 dark:hover:text-white">{{ $rotulo }}</a>
                            @else
                                <span aria-current="page" data-migalha
                                      class="truncate text-neutral-700 dark:text-neutral-300">{{ $rotulo }}</span>
                            @endif
                        </li>
                    @endforeach
                </ol>
            </nav>
        @endif

        @isset($aside)
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">{{ $title }}</h1>

                <div {{ $aside->attributes->class(['flex flex-wrap items-center gap-2']) }} data-cabecalho-selos>{{ $aside }}</div>
            </div>
        @else
            <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">{{ $title }}</h1>
        @endisset

        @if ($subtitle)
            <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ $subtitle }}</p>
        @endif
    </div>

    <div class="flex flex-wrap items-center gap-2">
        @if ($back)
            <x-ui.button :href="$back" variant="secondary">
                <x-ui.icon name="arrow-left" class="size-4" />
                Voltar
            </x-ui.button>
        @endif

        {{ $slot }}
    </div>
</div>
