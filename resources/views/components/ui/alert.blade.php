@props(['type' => 'info'])

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

<div role="alert" {{ $attributes->class(['rounded-lg border p-4 text-sm', $tipos[$type] ?? $tipos['info']]) }}>
    {{ $slot }}
</div>
