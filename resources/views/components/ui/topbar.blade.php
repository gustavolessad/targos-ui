@props([
    // O `id` da gaveta com a barra lateral: põe o botão de menu, que só aparece abaixo do `lg`.
    'menu' => null,
    // Sem o fundo e a linha de baixo: para a barra dentro de uma moldura que já tem fundo.
    // Aí quem fica fixo no topo é a moldura (a barra fixa só dentro de quem a contém).
    'transparent' => false,
])

{{--
    A barra superior do painel.

    O slot `start` fica na ponta esquerda — o botão que recolhe a barra
    lateral. O que o layout puser no slot principal fica na ponta
    direita: o botão de tema, a conta de quem está logado.

    `menu` é para o painel sem barra recolhível: só o botão que abre a
    gaveta no celular. Quem usa o `ui.sidebar-toggle` não precisa dele.

    Fixa no topo ao rolar (21/11/2026), com o fundo da área de conteúdo e
    uma linha fina embaixo: o conteúdo passa por baixo dela.
--}}
{{-- 56px (h-14): o x-ui.content desconta esta altura no min-h da área de conteúdo. --}}
<header data-barra-superior {{ $attributes->class([
    'sticky top-0 z-30 flex h-14 items-center gap-3 px-4 sm:px-6',
    'border-b border-neutral-200 bg-painel dark:border-neutral-900 dark:bg-painel-dark' => ! $transparent,
]) }}>
    @if ($menu)
        <x-ui.button type="button" variant="ghost" size="icon"
                     data-abre-offcanvas="{{ $menu }}"
                     aria-label="Abrir menu"
                     class="lg:hidden">
            <x-ui.icon name="menu" class="size-5" />
        </x-ui.button>
    @endif

    {{ $start ?? '' }}

    <div class="flex-1"></div>

    {{ $slot }}
</header>
