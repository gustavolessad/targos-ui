{{--
    O botão que alterna entre o tema claro e o escuro (theme.js, pelo
    `data-troca-tema`). Mostra para onde o clique leva: a lua no claro,
    o sol no escuro.
--}}
<x-ui.button type="button" variant="ghost" size="icon"
             data-troca-tema
             aria-label="Alternar tema claro e escuro"
             {{ $attributes }}>
    <x-ui.icon name="moon" class="size-5 dark:hidden" />
    <x-ui.icon name="sun" class="hidden size-5 dark:block" />
</x-ui.button>
