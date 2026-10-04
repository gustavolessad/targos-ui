@props([
    'type' => 'info',
    /*
     * Um X no canto, que esconde o aviso.
     *
     * O clique põe `hidden` no aviso e dispara `ui:alerta-dispensado`
     * nele, subindo pelo DOM — quem o mostrou fica sabendo, e decide se
     * ele volta (resources/js/alert.js). O texto vai num
     * `[data-alerta-texto]`, que o script reescreve sem levar o X junto.
     */
    'dismissible' => false,
])

@php
    /*
     * No tema claro, o fundo no tom 100 e uma borda no 200: o tom 50 sem
     * borda sumia sobre o fundo claro do painel e dos cards. No escuro, o
     * tom translúcido já se destaca, e a borda fica de fora.
     */
    $tipos = [
        'success' => 'border-success-200 bg-success-100 text-success-800 dark:border-transparent dark:bg-success-500/10 dark:text-success-400',
        'danger' => 'border-danger-200 bg-danger-100 text-danger-800 dark:border-transparent dark:bg-danger-500/10 dark:text-danger-400',
        'warning' => 'border-warning-200 bg-warning-100 text-warning-800 dark:border-transparent dark:bg-warning-500/10 dark:text-warning-400',
        'info' => 'border-info-200 bg-info-100 text-info-800 dark:border-transparent dark:bg-info-500/10 dark:text-info-400',
    ];
@endphp

@if ($dismissible)
    <div role="alert" data-alerta {{ $attributes->class(['flex items-start gap-3 rounded-lg border p-4 text-sm', $tipos[$type] ?? $tipos['info']]) }}>
        <div class="min-w-0 flex-1" data-alerta-texto>{{ $slot }}</div>

        {{-- Na cor do texto do aviso, mais apagado: é a saída, não o assunto. --}}
        <button type="button" data-fecha-alerta aria-label="Fechar o aviso"
                class="-m-1 shrink-0 cursor-pointer rounded p-1 opacity-70 transition hover:opacity-100
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-current">
            <x-ui.icon name="x" class="size-4" />
        </button>
    </div>
@else
    <div role="alert" {{ $attributes->class(['rounded-lg border p-4 text-sm', $tipos[$type] ?? $tipos['info']]) }}>
        {{ $slot }}
    </div>
@endif
