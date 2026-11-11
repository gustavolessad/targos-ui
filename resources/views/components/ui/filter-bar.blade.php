@props([
    // O endereço da listagem: o formulário é GET, para o filtro ir na URL.
    'action',
    // O "Limpar": o endereço da lista sem filtros, quando há filtro além do padrão. Nulo, sem o botão.
    'clear' => null,
    // O id da gaveta: duas barras na mesma página precisam de ids diferentes.
    'id' => 'filtros',
    'title' => 'Filtros',
])

{{--
    A barra de filtros em cima de uma listagem — **a mesma em todas as telas**.

    No computador (a partir do `lg`) é a linha de sempre: os campos lado a
    lado, que enviam ao mudar (`data-filtros`, resources/js/filters.js), e o
    "Limpar" no fim quando há filtro em uso. Não há botão "Buscar": tudo envia
    sozinho.

    **No celular e no tablet** (abaixo do `lg`) os campos vão para uma gaveta
    que entra pela direita, aberta pelo botão "Filtros" (com um ponto quando
    há filtro em uso). Ali nada envia ao mudar: a lista vem no "Aplicar" do
    rodapé, e o "Limpar" fica ao lado dele.

    **Um formulário só**: os campos são os mesmos nos dois tamanhos, e é o CSS
    que decide onde ficam. Nada se duplica — nem o nome do campo, nem o `id`.

        <x-ui.filter-bar :action="route('vendas.index')" :clear="$filtros->any() ? route('vendas.index') : null">
            <x-ui.filter-field kind="wide"><x-ui.input type="search" name="busca" label="Buscar" size="sm" /></x-ui.filter-field>
            <x-ui.filter-field kind="select"><x-ui.select name="status" label="Situação" size="sm" … /></x-ui.filter-field>
        </x-ui.filter-bar>

    `top`: o que fica acima da linha de campos (o "Agrupar por" dos
    relatórios). Os atributos vão para o `<form>`.
--}}
<form method="GET" action="{{ $action }}" data-filtros {{ $attributes->class(['mb-4']) }}>
    {{-- Abaixo do lg: o botão que abre a gaveta, e o "Limpar" à mão. --}}
    <div class="flex items-center gap-2 lg:hidden">
        <x-ui.button type="button" variant="secondary" size="sm" icon="sliders-horizontal"
                     data-abre-offcanvas="{{ $id }}" aria-controls="{{ $id }}" data-filtros-abrir>
            {{ $title }}
            @if ($clear !== null)
                <span class="size-2 rounded-full bg-primary-600 dark:bg-primary-400" aria-hidden="true"></span>
                <span class="sr-only">(em uso)</span>
            @endif
        </x-ui.button>

        @if ($clear !== null)
            <x-ui.button :href="$clear" variant="danger-soft" size="sm">Limpar</x-ui.button>
        @endif
    </div>

    {{--
        A gaveta abaixo do lg; a própria linha a partir dele. `data-offcanvas`
        é o do `layers.js` (abre, fecha pelo X, pelo fundo e pelo Esc), e
        `data-filtros-gaveta` é o que diz ao `filters.js` para esperar o
        "Aplicar" — só enquanto ela for gaveta (`position: fixed`).
    --}}
    <div id="{{ $id }}" data-offcanvas data-filtros-gaveta
         class="fixed inset-0 z-60 hidden [&[data-aberto]]:block lg:static lg:z-auto lg:block">
        <div data-offcanvas-fundo
             class="fixed inset-0 bg-neutral-300/50 opacity-0 backdrop-blur-[4px] transition-opacity duration-300
                    dark:bg-neutral-900/50 [[data-aberto]_&]:opacity-100 lg:hidden"></div>

        <div class="fixed inset-y-0 end-0 flex w-full sm:max-w-sm lg:static lg:max-w-none">
            <div class="relative flex w-full flex-col bg-white shadow-xl transition duration-300 ease-out
                        translate-x-full [[data-aberto]_&]:translate-x-0
                        dark:bg-painel-dark dark:ring-1 dark:ring-neutral-800
                        lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:transition-none
                        lg:dark:bg-transparent lg:dark:ring-0"
                 role="group" aria-label="{{ $title }}">
                <div class="flex items-center justify-between gap-4 border-b border-neutral-300 px-5 py-4
                            dark:border-neutral-800 lg:hidden">
                    <h2 class="font-semibold text-neutral-900 dark:text-white">{{ $title }}</h2>

                    <button type="button" data-fecha-offcanvas aria-label="Fechar"
                            class="-me-1 shrink-0 cursor-pointer text-neutral-400 transition hover:text-neutral-600
                                   dark:hover:text-neutral-200">
                        <x-ui.icon name="x" class="size-5" />
                    </button>
                </div>

                {{-- Na gaveta, um campo por linha, na largura toda; no computador, lado a lado. --}}
                <div class="scroll-discreto flex-1 overflow-y-auto px-5 py-5 lg:overflow-visible lg:p-0">
                    @isset($top)
                        <div class="mb-4 lg:mb-3">{{ $top }}</div>
                    @endisset

                    <div class="flex flex-col gap-4 max-lg:*:w-full! lg:flex-row lg:flex-wrap lg:items-end lg:gap-3">
                        {{ $slot }}

                        @if ($clear !== null)
                            <div class="hidden lg:block">
                                <x-ui.button :href="$clear" variant="danger-soft" size="sm">Limpar</x-ui.button>
                            </div>
                        @endif
                    </div>
                </div>

                <div class="flex gap-2 border-t border-neutral-300 px-5 py-4 dark:border-neutral-800 lg:hidden">
                    <x-ui.button type="submit" class="flex-1">Aplicar</x-ui.button>

                    @if ($clear !== null)
                        <x-ui.button :href="$clear" variant="danger-soft">Limpar</x-ui.button>
                    @endif
                </div>
            </div>
        </div>
    </div>
</form>
