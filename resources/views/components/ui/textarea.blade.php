@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'required' => false,
    /**
     * A explicação do campo, num ícone ao lado do rótulo.
     *
     * Para o que o rótulo não cabe dizer: de onde vem o número, o que
     * acontece se ficar em branco. No `hint` embaixo, o mesmo texto
     * empurraria os vizinhos numa grade de campos.
     */
    'info' => null,
    'rows' => 3,
    /** `xs`, `sm`, `md` ou `lg`, com as medidas do campo de texto comum. */
    'size' => 'md',
])

@php
    // `old()` vence o valor passado, como no campo de texto comum.
    $valorAtual = old($name, $value);
    $temErro = $errors->has($name);

    $tamanhos = [
        'xs' => 'px-2.5 py-1 text-xs',
        'sm' => 'px-3 py-1.5 text-sm',
        'md' => 'px-3 py-2.5 text-sm',
        'lg' => 'px-4 py-3 text-base',
    ];
@endphp

<div class="group">
    @if ($label)
        <x-ui.field-label :label="$label"
                          :for="$name"
                          :required="$required"
                          :info="$info"
                          class="mb-1.5" />
    @endif

    <textarea id="{{ $name }}"
              name="{{ $name }}"
              rows="{{ $rows }}"
              @required($required)
              {{ $attributes->class([
                  'block w-full rounded-lg border text-neutral-900',
                  $tamanhos[$size] ?? $tamanhos['md'],
                  'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                  'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                  'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                  'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                  'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                  'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
              ]) }}>{{ $valorAtual }}</textarea>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($name) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
