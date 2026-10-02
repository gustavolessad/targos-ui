@props([
    /** A URL da foto; sem ela, as iniciais. */
    'src' => null,
    /** O nome da pessoa: o `alt` da foto, e de onde saem as iniciais. */
    'name' => '',
    /** `sm` (32px), `md` (40px), `lg` (64px) ou `xl` (96px). */
    'size' => 'md',
    /** `primary` (padrão) ou `danger` — a pessoa com uma pendência a destacar. */
    'color' => 'primary',
])

@php
    /*
     * A foto redonda de uma pessoa.
     *
     * Sem foto, as iniciais num círculo: um vão cinza no lugar do rosto
     * parece imagem quebrada; as iniciais parecem escolha.
     */
    $tamanhos = [
        'sm' => 'size-8 text-xs',
        'md' => 'size-10 text-sm',
        'lg' => 'size-16 text-lg',
        'xl' => 'size-24 text-2xl',
    ];

    $partes = preg_split('/\s+/', trim((string) $name)) ?: [];
    $iniciais = mb_strtoupper(
        mb_substr($partes[0] ?? '', 0, 1).(count($partes) > 1 ? mb_substr($partes[count($partes) - 1], 0, 1) : '')
    );
@endphp

@if ($src)
    <img src="{{ $src }}" alt="{{ $name }}" loading="lazy"
         {{ $attributes->class(['shrink-0 rounded-full object-cover', $tamanhos[$size] ?? $tamanhos['md']]) }}>
@else
    <span aria-hidden="true"
          {{ $attributes->class([
              'flex shrink-0 items-center justify-center rounded-full font-semibold',
              'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' => $color !== 'danger',
              // Chamativo de propósito: vermelho cheio, iniciais brancas.
              'bg-danger-600 text-white dark:bg-danger-500' => $color === 'danger',
              $tamanhos[$size] ?? $tamanhos['md'],
          ]) }}>{{ $iniciais }}</span>
@endif
