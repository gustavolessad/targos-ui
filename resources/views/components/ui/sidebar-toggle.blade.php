@props([
    // O `id` da gaveta com a barra lateral: abaixo do `lg`, onde não há barra fixa, o botão a abre.
    'drawer' => null,
])

{{--
    O botão que recolhe e expande a barra lateral (sidebar.js, pelo
    `data-recolhe-barra`). Vai na ponta esquerda da barra superior.

    Recolhida, a barra vira uma coluna de ícones; a escolha fica
    guardada no navegador. No celular o mesmo botão abre a gaveta do
    menu.
--}}
<x-ui.button type="button" variant="ghost" size="icon"
             data-recolhe-barra
             :data-gaveta="$drawer"
             aria-label="Recolher ou expandir o menu"
             {{ $attributes }}>
    <x-ui.icon name="panel-left" class="size-5" />
</x-ui.button>
