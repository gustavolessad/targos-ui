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
    /*
     * O `id` do campo. Sem ele, sai do nome (`items[0][obs]` →
     * `items-0-obs`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
])

@php
    // `items[0][obs]` no HTML é `items.0.obs` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    // `old()` vence o valor passado, como no campo de texto comum.
    $valorAtual = $remember ? old($chave, $value) : $value;
    $temErro = $errors->has($chave);

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
                          :for="$id"
                          :required="$required"
                          :info="$info"
                          class="mb-1.5" />
    @endif

    {{-- O `id` é o da prop: um `id` solto nos atributos não pode sair duplicado no campo. --}}
    <textarea id="{{ $id }}"
              name="{{ $name }}"
              rows="{{ $rows }}"
              @required($required)
              {{ $attributes->except('id')->class([
                  'block w-full rounded-lg border text-neutral-900',
                  $tamanhos[$size] ?? $tamanhos['md'],
                  'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                  'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                  'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                  'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
                  'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
                  'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                  'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                  'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
              ]) }}>{{ $valorAtual }}</textarea>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
