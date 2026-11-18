@props(['icon' => null, 'href' => '#'])

{{--
    O atalho em destaque no alto da barra lateral, no slot `top` do
    `ui.sidebar`: um link com a cara do botão primário, maior que os itens
    do menu — a tela que mais se abre (o PDV de uma loja, por exemplo).

        <x-slot:top>
            <x-ui.sidebar-action icon="monitor" :href="route('pos.index')">Abrir PDV</x-ui.sidebar-action>
        </x-slot:top>

    Recolhida a barra, fica só o ícone, e o nome vira a dica à direita
    (`data-barra-dica`, como no `ui.nav-item`).
--}}
<a href="{{ $href }}"
   data-barra-dica="{{ trim(strip_tags((string) $slot)) }}"
   {{ $attributes->class([
       'flex items-center gap-3 rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-semibold text-primary-contrast shadow-sm transition',
       'hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
       'recolhida:justify-center recolhida:px-0 recolhida:py-2',
   ]) }}>
    @if ($icon)
        <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <x-ui.icon :name="$icon" class="size-4" />
        </span>
    @endif

    <span class="flex-1 truncate recolhida:hidden">{{ $slot }}</span>
</a>
