@props([
    // O `id` da gaveta com a barra lateral: põe o botão de menu, que só aparece abaixo do `lg`.
    'menu' => null,
])

{{--
    A barra superior do painel. O que o layout puser no slot fica na
    ponta direita: o botão de tema, a conta de quem está logado.
--}}
<header {{ $attributes->class(['flex h-16 items-center gap-3 px-4 sm:px-6']) }}>
    @if ($menu)
        <x-ui.button type="button" variant="ghost" size="icon"
                     data-abre-offcanvas="{{ $menu }}"
                     aria-label="Abrir menu"
                     class="lg:hidden">
            <x-ui.icon name="menu" class="size-5" />
        </x-ui.button>
    @endif

    <div class="flex-1"></div>

    {{ $slot }}
</header>
