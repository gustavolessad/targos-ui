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
    coluna de ícones: o logo dá lugar ao símbolo. As margens laterais
    ficam as mesmas (`px-3`), e o item vira um bloco de 40px de largura
    (28px de altura) numa barra de 64px. A largura é do layout, que é
    quem a posiciona.

    Compacta: os itens com `py-1.5` e o ícone de 16px (`size-4`), e os
    blocos a `space-y-2` um do outro — o menu de uma loja inteira cabe
    numa tela de notebook sem rolar.
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
        <div class="relative px-3 pb-2">
            {{ $top }}
        </div>
    @endisset

    <div class="scroll-discreto flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {{ $slot }}
    </div>
</nav>
