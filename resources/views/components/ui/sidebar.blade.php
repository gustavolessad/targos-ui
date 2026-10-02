{{--
    A moldura da barra lateral do painel.

    Acompanha o tema: branca no claro, preta no escuro. O projeto entra
    com o conteúdo: o slot `logo`, o slot `symbol` (o logo reduzido, para
    a barra recolhida), o slot `top` (opcional: um atalho acima da lista)
    e, no slot principal, os itens (`ui.nav-item` e `ui.nav-group`). O
    modelo `admin/sidebar` do pacote é um exemplo completo.

    Cada bloco de itens é uma `div` com `space-y-0.5`; os blocos se
    separam só pelo espaço, sem título.

    O layout desenha a barra duas vezes (fixa no computador, gaveta no
    celular): o que tiver `id` dentro dela precisa de um por desenho.

    Recolhida (`recolhida:`, pelo botão `ui.sidebar-toggle`), vira uma
    coluna de ícones: o logo dá lugar ao símbolo e as margens encolhem.
    A largura é do layout, que é quem a posiciona.
--}}
<nav data-barra {{ $attributes->class(['flex h-full flex-col bg-white text-sm dark:bg-neutral-900']) }}>
    @isset($logo)
        <div class="flex h-20 shrink-0 items-center px-5 recolhida:justify-center recolhida:overflow-hidden recolhida:px-0">
            {{-- `contents`: o envelope não entra no layout; existe só para o logo poder sumir. --}}
            <div @class(['contents', 'recolhida:hidden' => isset($symbol)])>
                {{ $logo }}
            </div>

            @isset($symbol)
                <div class="hidden recolhida:block">
                    {{ $symbol }}
                </div>
            @endisset
        </div>
    @endisset

    @isset($top)
        <div class="relative px-3 pb-2 recolhida:px-2">
            {{ $top }}
        </div>
    @endisset

    <div class="scroll-discreto flex-1 space-y-4 overflow-y-auto px-3 py-2 recolhida:px-2">
        {{ $slot }}
    </div>
</nav>
