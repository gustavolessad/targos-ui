@props([
    /** O que o número significa. */
    'label',
    'value',
    /** O nome de um ícone do componente de ícones; sem ele, fica só o número. */
    'icon' => null,
    /**
     * A cor do número, pelo significado: `neutral`, `danger`, `warning`, `success`, `info`.
     *
     * Cor só onde ela informa — um card sempre vermelho deixa de
     * alarmar, e um painel colorido inteiro não diz o que olhar primeiro.
     */
    'color' => 'neutral',
    /** Para onde o card leva, quando leva a algum lugar. */
    'href' => null,
    /** Uma linha pequena abaixo do número — "Original: R$ 1.000,00". */
    'hint' => null,
    /**
     * O tamanho do número: `md` (o das listagens) ou `lg`, maior e mais
     * pesado, para o card que é o assunto da tela — os do dashboard.
     */
    'size' => 'md',
])

{{--
    O card de indicador, das listagens e do painel.

    Vira link quando recebe `href`: o número que pede ação deve levar à
    tela que a resolve.
--}}
@php
    $classesDoNumero = match ($color) {
        'danger' => 'text-danger-600 dark:text-danger-400',
        'warning' => 'text-warning-600 dark:text-warning-400',
        'success' => 'text-success-600 dark:text-success-400',
        'info' => 'text-info-600 dark:text-info-400',
        default => 'text-neutral-900 dark:text-white',
    };

    $classesDoTamanho = $size === 'lg' ? 'text-3xl font-bold tracking-tight' : 'text-2xl font-semibold';

    $classes = [
        /*
         * O mesmo fundo da tabela e dos cards: no escuro, um cinza
         * acima do resto fazia os indicadores parecerem um bloco de
         * outra tela, e não o topo desta.
         */
        'rounded-xl border border-neutral-300 bg-white p-4',
        'dark:border-neutral-800 dark:bg-neutral-900',
        // Só o que é clicável reage ao mouse.
        'block transition hover:border-neutral-300 dark:hover:border-neutral-700' => $href !== null,
    ];
@endphp

<{{ $href !== null ? 'a' : 'div' }}
    @if ($href !== null) href="{{ $href }}" @endif
    {{ $attributes->class($classes) }}>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">{{ $label }}</p>

            <p class="mt-1 {{ $classesDoTamanho }} {{ $classesDoNumero }}">{{ $value }}</p>

            @if ($hint)
                <p class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
            @endif
        </div>

        @if ($icon !== null)
            <x-ui.icon :name="$icon" class="size-5 shrink-0 text-neutral-400" />
        @endif
    </div>
</{{ $href !== null ? 'a' : 'div' }}>
