@props([
    // O `id` da gaveta com a barra lateral: põe o botão de menu, que só aparece abaixo do `lg`.
    'menu' => null,
])

{{--
    A barra superior do painel.

    O slot `start` fica na ponta esquerda — o botão que recolhe a barra
    lateral. O que o layout puser no slot principal fica na ponta
    direita: o botão de tema, a conta de quem está logado.

    `menu` é para o painel sem barra recolhível: só o botão que abre a
    gaveta no celular. Quem usa o `ui.sidebar-toggle` não precisa dele.
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

    {{ $start ?? '' }}

    <div class="flex-1"></div>

    {{ $slot }}
</header>
