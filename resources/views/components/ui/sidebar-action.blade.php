@props(['icon' => null, 'href' => '#'])

{{--
    O atalho em destaque no alto da barra lateral, no slot `top` do
    `ui.sidebar`: um link com a cara e o tamanho do botão primário (o `md`
    do `ui.button`), na largura da barra — a tela que mais se abre (o PDV
    de uma loja, por exemplo).

        <x-slot:top>
            <x-ui.sidebar-action icon="monitor" :href="route('pos.index')">Abrir PDV</x-ui.sidebar-action>
        </x-slot:top>

    Recolhida a barra, fica só o ícone, e o nome vira a dica à direita
    (`data-barra-dica`, como no `ui.nav-item`).
--}}
<a href="{{ $href }}"
   data-barra-dica="{{ trim(strip_tags((string) $slot)) }}"
   {{ $attributes->class([
       'flex h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-primary-600 px-4 text-sm font-medium text-primary-contrast transition',
       'hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30',
       'recolhida:px-0',
   ]) }}>
    @if ($icon)
        <x-ui.icon :name="$icon" class="size-4 shrink-0" />
    @endif

    <span class="truncate recolhida:hidden">{{ $slot }}</span>
</a>
