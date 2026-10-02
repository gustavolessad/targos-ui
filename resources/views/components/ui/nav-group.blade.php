@props([
    'icon' => null,
    'label',
    /**
     * As rotas que pertencem a este grupo: um padrão (`orders.*`) ou uma
     * lista deles.
     *
     * @var string|list<string>|null
     */
    'match' => null,
])

@php
    /*
     * O grupo nasce aberto quando a tela atual está dentro dele: quem está
     * numa tela do grupo precisa ver onde está, sem clicar para descobrir.
     *
     * `<details>` nativo em vez de JavaScript: abre, fecha, funciona no
     * teclado e é anunciado pelo leitor de tela sem nada nosso.
     */
    $aberto = $match !== null && request()->routeIs(...(array) $match);
@endphp

{{-- `data-inicial`: o grupo que já nasce aberto não anima ao carregar a página (nav.js). --}}
<details @if ($aberto) open data-inicial @endif class="group/grupo">
    {{-- Mesmas cores do nav-item em repouso, para o grupo não destoar dos links. --}}
    <summary class="group flex cursor-pointer list-none items-center gap-3 rounded-lg p-3
                    text-sm font-medium text-neutral-900 transition hover:bg-neutral-100
                    hover:text-neutral-950 dark:text-white dark:hover:bg-white/5
                    dark:hover:text-white [&::-webkit-details-marker]:hidden">
        @if ($icon)
            <x-ui.icon :name="$icon" class="size-5 shrink-0 text-neutral-500 transition group-hover:text-neutral-800
                                            dark:text-neutral-400 dark:group-hover:text-neutral-200" />
        @endif

        <span class="flex-1 truncate">{{ $label }}</span>

        <x-ui.icon name="chevron-down"
                   class="size-4 shrink-0 text-neutral-400 transition group-open/grupo:rotate-180
                          dark:text-neutral-600" />
    </summary>

    {{--
        Os filhos recuados, com um fio ligando-os ao pai: sem isso a
        lista aberta se confunde com o nível de cima. Mesmo peso dos itens
        principais, cor um pouco mais fraca (o ativo fica de fora: segue
        bem escuro; o hover volta a escurecer).

        Mais baixos que os itens do nível de cima (`py-2` contra o `p-3`
        deles): a lista aberta fica compacta e se lê como parte do grupo.

        Ao abrir, entram descendo de leve (`animate-descer`); o grupo
        que já veio aberto do servidor fica parado.
    --}}
    <div class="mt-0.5 ms-[1.4rem] space-y-0.5 border-s border-neutral-300 ps-3 dark:border-white/10
                [&>a]:py-2
                group-[&[open]:not([data-inicial])]/grupo:animate-descer
                [&>a:not([aria-current])]:text-neutral-700 [&>a:not([aria-current]):hover]:text-neutral-950
                dark:[&>a:not([aria-current])]:text-neutral-300 dark:[&>a:not([aria-current]):hover]:text-white">
        {{ $slot }}
    </div>
</details>
