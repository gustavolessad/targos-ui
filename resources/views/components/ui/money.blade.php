@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    // O menor valor aceito (0,01 por padrão: o campo não aceita zero).
    'min' => '0.01',
    'placeholder' => '0,00',
])

@php
    /*
     * O valor em reais.
     *
     * O `<input type="number">` nativo é a fonte da verdade: vai no
     * formulário com ponto (`1500.00`), recebe `old()`, `min`/`required`
     * e os eventos que outras telas escutam (a prévia das parcelas). O JS
     * (resources/js/ui/money.js) o esconde e mostra por cima o campo com
     * "R$", que se digita como calculadora (1.500,00). Sem JS, o nativo
     * aparece sozinho. Formatar valor em reais: App\Support\Money.
     */
    $valor = \App\Support\Money::normalize(old($name, $value));
    $exibido = $valor !== null ? \App\Support\Money::format($valor) : '';
    $temErro = $errors->has($name);

    $tamanhos = [
        'xs' => ['h-7 text-xs', 'ps-8 pe-2.5', 'ps-2.5'],
        'sm' => ['h-9 text-sm', 'ps-9 pe-3', 'ps-3'],
        'md' => ['h-10 text-sm', 'ps-10 pe-3', 'ps-3'],
        'lg' => ['h-12 text-base', 'ps-11 pe-4', 'ps-4'],
    ];
    [$altura, $recuo, $posicaoDoPrefixo] = $tamanhos[$size] ?? $tamanhos['md'];

    $caixa = [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];
@endphp

<div {{ $attributes->class(['group relative']) }} data-dinheiro>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$name" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-dinheiro-nativo-caixa>
    <input type="number"
           id="{{ $name }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           step="0.01"
           @if ($min !== null) min="{{ $min }}" @endif
           @required($required)
           data-dinheiro-nativo
           @class([...$caixa, 'px-3'])>
    </div>

    <div class="relative" data-dinheiro-campo hidden>
        <span class="pointer-events-none absolute inset-y-0 start-0 flex items-center {{ $posicaoDoPrefixo }} text-sm text-neutral-500 dark:text-neutral-400">R$</span>

        {{-- Números alinhados à direita, como numa coluna de valores. --}}
        <input type="text"
               inputmode="numeric"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-dinheiro-texto
               @class([...$caixa, $recuo, 'text-end tabular-nums'])>
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($name) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
