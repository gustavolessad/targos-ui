{{--
    A moldura da barra lateral do painel.

    Acompanha o tema: branca no claro, preta no escuro. O projeto entra
    com o conteúdo: o slot `logo`, o slot `top` (opcional: um atalho
    acima da lista) e, no slot principal, os itens (`ui.nav-item` e
    `ui.nav-group`). O modelo `admin/sidebar` do pacote é um exemplo completo.

    Cada bloco de itens é uma `div` com `space-y-0.5`; os blocos se
    separam só pelo espaço, sem título.

    O layout desenha a barra duas vezes (fixa no computador, gaveta no
    celular): o que tiver `id` dentro dela precisa de um por desenho.
--}}
<nav {{ $attributes->class(['flex h-full flex-col bg-white text-sm dark:bg-neutral-900']) }}>
    @isset($logo)
        <div class="flex h-20 shrink-0 items-center px-5">
            {{ $logo }}
        </div>
    @endisset

    @isset($top)
        <div class="relative px-3 pb-2">
            {{ $top }}
        </div>
    @endisset

    <div class="scroll-discreto flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {{ $slot }}
    </div>
</nav>
