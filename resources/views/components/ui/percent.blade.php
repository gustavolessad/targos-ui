@props([
    'name',
    'label' => null,
    /** O percentual como o banco o guarda: `'3.2500'` (ou o número 3.25) é 3,25%. */
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    /*
     * Os limites. O `max` é também o teto da digitação: com 100, o
     * dígito que passaria de 100,00 não entra. Com `min` abaixo de zero
     * (ou `:min="false"`, sem limite), o "-" troca o sinal, como no
     * `x-ui.money`. "Sem limite" é `false` porque um atributo `null` é o
     * mesmo que não passado: o `@props` o troca pelo padrão.
     */
    'max' => '100',
    'min' => '0',
    'placeholder' => '0,00',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][rate]` →
     * `items-0-rate`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o do outro.
     */
    'id' => null,
])

@php
    /*
     * O percentual.
     *
     * O mesmo desenho do `x-ui.money`: o `<input type="number">` nativo é
     * a fonte da verdade, vai no formulário com 4 casas (`3.2500`) e
     * recebe `old()`, `min`/`max`/`required` e os eventos. O JS
     * (resources/js/percent.js) o esconde e mostra por cima o campo com
     * "%", que se digita como calculadora, em centésimos: "325" é 3,25.
     * A tela mostra 2 casas; enquanto ninguém digita, o nativo leva de
     * volta as 4 que vieram do banco.
     */
    // `items[0][rate]` no HTML é `items.0.rate` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $valor = \Targos\Ui\Money::normalize(old($chave, $value), 4);

    // `3.2500` → 3,25. O Money::format deixa o sinal de fora.
    $valorNegativo = $valor !== null && (float) \Targos\Ui\Money::normalize($valor) < 0;
    $exibido = $valor !== null ? ($valorNegativo ? '-' : '').\Targos\Ui\Money::format($valor) : '';

    // Sem piso (`:min="false"`), ou com piso abaixo de zero, o "-" troca o sinal.
    $minimo = $min === false ? null : $min;
    $aceitaNegativo = $minimo === null || (float) $minimo < 0;

    $temErro = $errors->has($chave);

    /*
     * Os atributos que são do campo, e não da caixa em volta: vão para o
     * nativo, que é o que o formulário lê. Todo o resto — `class`,
     * `data-*`, `on*`, `aria-*`, `style` — fica no envelope (ver
     * `x-ui.money`).
     */
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex', 'autocomplete'];

    // O que governa a digitação vai também para o visível; o `autofocus`, o percent.js passa a ele.
    $doTexto = ['disabled', 'readonly', 'tabindex'];

    // A altura, o recuo do texto (o fim livre para o "%") e a posição do "%".
    $tamanhos = [
        'xs' => ['h-7 text-xs', 'ps-2.5 pe-7', 'pe-2.5'],
        'sm' => ['h-9 text-sm', 'ps-3 pe-8', 'pe-3'],
        'md' => ['h-10 text-sm', 'ps-3 pe-9', 'pe-3'],
        'lg' => ['h-12 text-base', 'ps-4 pe-10', 'pe-4'],
    ];
    [$altura, $recuo, $posicaoDoSufixo] = $tamanhos[$size] ?? $tamanhos['md'];

    $caixa = [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
        // Desligado: cinza e sem cursor de escrita, como o campo de texto comum.
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];
@endphp

<div {{ $attributes->except($doCampo)->class(['group relative']) }} data-percentual>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-percentual-nativo-caixa>
    <input type="number"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           step="0.0001"
           @if ($minimo !== null) min="{{ $minimo }}" @endif
           @if ($max !== null) max="{{ $max }}" @endif
           @required($required)
           data-percentual-nativo
           {{ $attributes->only($doCampo) }}
           @class([...$caixa, 'px-3'])>
    </div>

    <div class="relative" data-percentual-campo hidden>
        {{-- Com negativo, o teclado é o de texto: o numérico do iPhone não tem o "-". --}}
        <input type="text"
               id="{{ $id }}-texto"
               inputmode="{{ $aceitaNegativo ? 'text' : 'numeric' }}"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-percentual-texto
               {{ $attributes->only($doTexto) }}
               @class([...$caixa, $recuo, 'text-end tabular-nums'])>

        <span class="pointer-events-none absolute inset-y-0 end-0 flex items-center {{ $posicaoDoSufixo }} text-sm text-neutral-500 dark:text-neutral-400">%</span>
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
