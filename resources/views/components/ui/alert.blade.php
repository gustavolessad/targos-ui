@props(['type' => 'info'])

@php
    $tipos = [
        'success' => 'bg-success-50 text-success-800 dark:bg-success-500/10 dark:text-success-400',
        'danger' => 'bg-danger-50 text-danger-800 dark:bg-danger-500/10 dark:text-danger-400',
        'warning' => 'bg-warning-50 text-warning-800 dark:bg-warning-500/10 dark:text-warning-400',
        'info' => 'bg-info-50 text-info-800 dark:bg-info-500/10 dark:text-info-400',
    ];
@endphp

<div role="alert" {{ $attributes->class(['rounded-lg p-4 text-sm', $tipos[$type] ?? $tipos['info']]) }}>
    {{ $slot }}
</div>
