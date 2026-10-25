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
    {{--
        Mesmas cores do nav-item em repouso, para o grupo não destoar dos links.

        Recolhida a barra, sobra o ícone: os itens somem, e passar o
        mouse (ou clicar) abre um menu à direita com eles (sidebar.js,
        pelo `data-barra-rotulo`). Sem os itens à vista, quem diz que a
        tela atual é deste grupo passa a ser o próprio ícone, aceso como
        o item ativo.
    --}}
    <summary data-barra-rotulo="{{ $label }}" aria-haspopup="true"
             @class([
                 'group flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-1.5',
                 // O hover com o fundo do item ativo, como no `x-ui.nav-item`.
                 'text-sm font-medium text-neutral-900 transition hover:bg-primary-50',
                 'hover:text-neutral-950 dark:text-white dark:hover:bg-primary-500/15',
                 'dark:hover:text-white [&::-webkit-details-marker]:hidden',
                 'recolhida:justify-center recolhida:px-0',
                 'recolhida:bg-primary-50 dark:recolhida:bg-primary-500/15' => $aberto,
             ])>
        @if ($icon)
            <x-ui.icon :name="$icon" @class([
                'size-4 shrink-0 text-neutral-500 transition group-hover:text-neutral-800',
                'dark:text-neutral-400 dark:group-hover:text-neutral-200',
                'recolhida:text-primary-600 dark:recolhida:text-primary-400' => $aberto,
            ]) />
        @endif

        <span class="flex-1 truncate recolhida:hidden">{{ $label }}</span>

        <x-ui.icon name="chevron-down"
                   class="size-4 shrink-0 text-neutral-400 transition group-open/grupo:rotate-180
                          recolhida:hidden dark:text-neutral-600" />
    </summary>

    {{--
        Os filhos recuados, com um fio ligando-os ao pai: sem isso a
        lista aberta se confunde com o nível de cima. Mesmo peso dos itens
        principais, cor um pouco mais fraca (o ativo fica de fora: segue
        bem escuro; o hover volta a escurecer).

        Na altura dos itens do nível de cima (`py-1.5`): quem os liga ao
        grupo é o recuo e o fio, e a lista aberta fica compacta.

        Ao abrir, entram descendo de leve (`animate-descer`); o grupo
        que já veio aberto do servidor fica parado.
    --}}
    <div data-barra-itens
         class="mt-0.5 ms-[1.4rem] space-y-0.5 border-s border-neutral-300 ps-3 recolhida:hidden dark:border-white/10
                [&>a]:py-1.5
                group-[&[open]:not([data-inicial])]/grupo:animate-descer
                [&>a:not([aria-current])]:text-neutral-700 [&>a:not([aria-current]):hover]:text-neutral-950
                dark:[&>a:not([aria-current])]:text-neutral-300 dark:[&>a:not([aria-current]):hover]:text-white">
        {{ $slot }}
    </div>
</details>
