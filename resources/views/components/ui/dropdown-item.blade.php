@props(['icon' => null, 'href' => null, 'danger' => false, 'type' => 'button'])

@php
    /*
     * O realce do hover é arredondado e não encosta nas bordas: quem dá
     * a margem é o `p-1` da lista, e o `rounded-lg` daqui acompanha a
     * curva dela. Um retângulo de ponta a ponta brigaria com o canto
     * arredondado do menu.
     */
    $classes = [
        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition',
        'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800' => ! $danger,
        // A exclusão é vermelha já na lista: quem vai clicar precisa ver antes.
        'text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10' => $danger,
    ];
@endphp

@if ($href)
    <a href="{{ $href }}" {{ $attributes->class($classes) }}>
        @if ($icon)
            <x-ui.icon :name="$icon" class="size-3.5 shrink-0" />
        @endif

        {{ $slot }}
    </a>
@else
    {{-- `type="submit"` para o item que é a ação de um formulário, como sair. --}}
    <button type="{{ $type }}" {{ $attributes->class($classes) }}>
        @if ($icon)
            <x-ui.icon :name="$icon" class="size-3.5 shrink-0" />
        @endif

        {{ $slot }}
    </button>
@endif
