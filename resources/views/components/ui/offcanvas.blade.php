@props([
    'id',
    'title' => null,
    'subtitle' => null,
    /*
     * A largura no computador: 512px por padrão — folga para dois
     * campos lado a lado. No celular **toda gaveta ocupa a tela
     * inteira** — ver `$larguraNoDesktop` abaixo.
     */
    'width' => 'max-w-lg',
    'side' => 'right',
    // Já aberta ao carregar — o cadastro lateral que voltou do servidor com erro.
    'open' => false,
    // Só os botões fecham (nem o fundo, nem o Esc), como no modal: `data-offcanvas-estatico`.
    'static' => false,
])

@php
    /*
     * De que lado a gaveta entra.
     *
     * O padrão é a direita — um cadastro lateral.
     * A esquerda serve a menus.
     */
    $lados = [
        'right' => [
            'caixa' => 'fixed inset-y-0 end-0 flex w-full max-sm:!max-w-none',
            'fechado' => 'translate-x-full',
            'aberto' => '[[data-aberto]_&]:translate-x-0',
        ],
        'left' => [
            'caixa' => 'fixed inset-y-0 start-0 flex w-full max-sm:!max-w-none',
            'fechado' => '-translate-x-full',
            'aberto' => '[[data-aberto]_&]:translate-x-0',
        ],
    ];

    $lado = $lados[$side] ?? $lados['right'];
@endphp

{{--
    A gaveta lateral: o cadastro curto que não merece uma tela própria,
    e o menu que no celular não cabe na barra.

    Abre com `data-abre-offcanvas="{{ $id }}"` em qualquer botão da
    página, e fecha pelo X, pelo botão do rodapé, clicando no fundo ou
    com Esc — o mesmo `resources/js/layers.js` que cuida do modal (com
    `static`, só pelo X e pelos botões; os eventos são os mesmos).

    A animação é de CSS, como a do modal: o JavaScript só põe e tira
    `data-aberto`. Entra deslizando do lado escolhido e sai pelo caminho
    inverso.

    É irmã do <x-ui.modal>, não uma variação dela: o modal interrompe
    para perguntar, a gaveta acompanha o que ficou atrás. Por isso a de
    cá tem rodapé fixo — o conteúdo pode ser mais alto que a tela.
--}}
<div id="{{ $id }}" data-offcanvas @if ($open) data-abrir-ao-carregar @endif @if ($static) data-offcanvas-estatico @endif
     class="fixed inset-0 z-60 hidden [&[data-aberto]]:block">
    <div data-offcanvas-fundo
         class="fixed inset-0 bg-neutral-300/50 opacity-0 backdrop-blur-[4px] dark:bg-neutral-900/50 transition-opacity duration-300
                [[data-aberto]_&]:opacity-100"></div>

    {{--
        No celular a gaveta ocupa a tela inteira — **padrão do projeto**.

        Num aparelho de 360 px, uma gaveta de 448 px já cobre quase
        tudo, e a fresta que sobra não mostra nada útil: só rouba
        largura de quem mais precisa dela.

        `max-sm:!max-w-none` anula o `max-w-*` abaixo do `sm`, em vez de
        prefixar a classe recebida. Prefixar exigiria montar
        `sm:max-w-md` em tempo de execução, e o Tailwind lê as classes
        no código-fonte: o que nasce no servidor ele nunca vê, e a
        regra não entraria no CSS.

        As dezessete gavetas do sistema herdam o comportamento daqui, e
        a próxima já nasce com ele.
    --}}
    <div class="{{ $lado['caixa'] }} {{ $width }}">
        <div {{ $attributes->class([
                 'relative flex w-full flex-col bg-white shadow-xl',
                 'dark:bg-painel-dark dark:ring-1 dark:ring-neutral-800',
                 'transition duration-300 ease-out',
                 $lado['fechado'],
                 $lado['aberto'],
             ]) }}
             role="dialog" aria-modal="true"
             @if ($title) aria-label="{{ $title }}" aria-labelledby="{{ $id }}-titulo" @endif>
            <div class="flex items-start justify-between gap-4 border-b border-neutral-300 px-5 py-4
                        dark:border-neutral-800">
                <div>
                    @if ($title)
                        {{--
                            `data-camada-titulo`: o gancho para o JavaScript
                            trocar o título (um contador, o nome do que está
                            aberto), o mesmo do modal. O nome acessível da
                            caixa vem daqui (`aria-labelledby`) e acompanha.
                        --}}
                        <h2 id="{{ $id }}-titulo" class="font-semibold text-neutral-900 dark:text-white" data-camada-titulo>{{ $title }}</h2>
                    @endif

                    @if ($subtitle)
                        <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ $subtitle }}</p>
                    @endif
                </div>

                <button type="button" data-fecha-offcanvas aria-label="Fechar"
                        class="-me-1 shrink-0 cursor-pointer text-neutral-400 transition hover:text-neutral-600
                               dark:hover:text-neutral-200">
                    <x-ui.icon name="x" class="size-5" />
                </button>
            </div>

            {{-- Só o corpo rola: o cabeçalho e o rodapé ficam à vista. --}}
            <div class="scroll-discreto flex-1 overflow-y-auto px-5 py-5">
                {{ $slot }}
            </div>

            @isset($footer)
                <div class="border-t border-neutral-300 px-5 py-4 dark:border-neutral-800">
                    {{ $footer }}
                </div>
            @endisset
        </div>
    </div>
</div>
