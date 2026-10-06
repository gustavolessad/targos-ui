@props([
    'name',
    'label' => null,
    /** O número como o banco o guarda: `'0.840'` (ou o número 0.84). */
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    /** `xs` a `lg`, ou `cell`: só o campo, para a célula de tabela (ver `x-ui.percent`). */
    'size' => 'md',
    /*
     * As casas que a tela mostra e que vão no formulário: 3 no peso em kg
     * (`0.840`), como a NF-e o informa. De 0 a 4.
     */
    'scale' => 2,
    /*
     * Os limites. O `max` é também o teto da digitação: o dígito que
     * passaria dele não entra. Sem `max`, o teto é o de dígitos do campo
     * (dez, como no valor em reais).
     */
    'max' => null,
    'min' => '0',
    /** Sem ele, o zero com as casas: `0,000`. */
    'placeholder' => null,
    /*
     * Zero é valor: "0" digitado mostra 0,000 e grava `0.000`. Sem ele, o
     * zero esvazia o campo — o "não informado".
     */
    'allowZero' => false,
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][peso]` →
     * `items-0-peso`).
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
    /* A largura do campo com o seu envelope — rótulo, erro e dica (ver `x-ui.money`). */
    'width' => null,
    /* Os símbolos dentro do campo, antes e depois do número: texto, ou nada. O "kg" do peso vai no `suffix`. */
    'prefix' => null,
    'suffix' => null,
])

@php
    /*
     * O número decimal: o que não é dinheiro (`x-ui.money`) nem percentual
     * (`x-ui.percent`) mas tem casas — o peso em kg, uma medida
     * fracionária.
     *
     * O mesmo desenho dos dois: o `<input type="number">` nativo é a fonte
     * da verdade, vai no formulário com `scale` casas (`0.840`) e recebe
     * `old()`, `min`/`max`/`required` e os eventos. O JS
     * (resources/js/decimal.js) o esconde e mostra por cima o campo com o
     * símbolo, que se digita como calculadora: com 3 casas, "840" é 0,840.
     */

    // `items[0][peso]` no HTML é `items.0.peso` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $casas = max(0, min(4, (int) $scale));
    $passo = $casas === 0 ? '1' : '0.'.str_repeat('0', $casas - 1).'1';

    $valor = \Targos\Ui\Money::normalize($remember ? old($chave, $value) : $value, $casas);
    // Sem o zero como valor, o zero que veio é o campo em branco.
    $vazio = $valor === null || (! $allowZero && (float) $valor === 0.0);
    $exibido = $vazio ? '' : number_format(abs((float) $valor), $casas, ',', '.');
    $placeholder ??= $casas === 0 ? '0' : '0,'.str_repeat('0', $casas);

    $temErro = $errors->has($chave);

    // Os atributos que são do campo, e não da caixa em volta: vão para o nativo (ver `x-ui.money`).
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex', 'autocomplete'];
    // O que governa a digitação vai também para o visível; o `autofocus`, o decimal.js passa a ele.
    $doTexto = ['disabled', 'readonly', 'tabindex'];
    // Os `aria-*` soltos também vão para o visível: é nele que o leitor de tela para.
    $deAria = array_keys($attributes->filter(fn ($valor, string $chave): bool => str_starts_with($chave, 'aria-'))->getAttributes());

    // A mesma tabela do `x-ui.percent`: altura, recuos sem e com símbolo, onde o símbolo fica, a letra dele.
    $tamanhos = [
        'xs' => ['h-7 text-xs', 'ps-2.5', 'pe-2.5', 'ps-8', 'pe-8', 'ps-2.5', 'pe-2.5', 'text-sm'],
        'sm' => ['h-9 text-sm', 'ps-3', 'pe-3', 'ps-9', 'pe-9', 'ps-3', 'pe-3', 'text-sm'],
        'md' => ['h-10 text-sm', 'ps-3', 'pe-3', 'ps-10', 'pe-10', 'ps-3', 'pe-3', 'text-sm'],
        'lg' => ['h-12 text-base', 'ps-4', 'pe-4', 'ps-11', 'pe-11', 'ps-4', 'pe-4', 'text-sm'],
        'cell' => ['py-1 text-sm', 'ps-2', 'pe-2', 'ps-6', 'pe-7', 'ps-1.5', 'pe-1.5', 'text-xs'],
    ];

    $naCelula = $size === 'cell';
    [$altura, $inicio, $fim, $comPrefixo, $comSufixo, $noPrefixo, $noSufixo, $letraDoSimbolo] = $tamanhos[$size] ?? $tamanhos['md'];

    $prefixo = filled($prefix) ? (string) $prefix : null;
    $sufixo = filled($suffix) ? (string) $suffix : null;
    // O recuo do texto: o espaço do símbolo do lado que tem um.
    $recuo = [$prefixo !== null ? $comPrefixo : $inicio, $sufixo !== null ? $comSufixo : $fim];

    $caixa = $naCelula ? [
        'block w-full rounded-md border bg-transparent text-neutral-900 transition',
        'placeholder:text-neutral-400',
        'focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:text-neutral-400',
        'read-only:cursor-not-allowed read-only:text-neutral-400',
        'dark:text-white dark:placeholder:text-neutral-500',
        $altura,
        'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-800 dark:hover:border-neutral-600' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ] : [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
        'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];

    $recuoDoNativo = $naCelula ? 'px-2' : 'px-3';
    $envelope = $naCelula ? ['relative', $width ?? 'w-full'] : ['group relative', $width];

    $naCelulaAcessivel = $naCelula ? array_filter([
        'aria-label' => $label,
        'aria-invalid' => $temErro ? 'true' : null,
        'title' => $temErro ? $errors->first($chave) : null,
    ]) : [];
@endphp

<div {{ $attributes->except([...$doCampo, ...$deAria])->class(array_filter($envelope)) }}
     data-decimal data-decimal-casas="{{ $casas }}" @if ($allowZero) data-decimal-zero @endif>
    @if ($label && ! $naCelula)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-decimal-nativo-caixa>
    <input type="number"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $vazio ? '' : $valor }}"
           step="{{ $passo }}"
           @if ($min !== null && $min !== false) min="{{ $min }}" @endif
           @if ($max !== null) max="{{ $max }}" @endif
           @required($required)
           data-decimal-nativo
           {{ $attributes->only($doCampo) }}
           @class([...$caixa, $recuoDoNativo])>
    </div>

    <div class="relative" data-decimal-campo hidden>
        @if ($prefixo !== null)
            <x-ui.field-affix side="prefix" :text="$prefixo" class="{{ $noPrefixo }} {{ $letraDoSimbolo }}" />
        @endif

        <input type="text"
               id="{{ $id }}-texto"
               inputmode="numeric"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-decimal-texto
               {{ $attributes->only([...$doTexto, ...$deAria])->merge($naCelulaAcessivel) }}
               @class([...$caixa, ...$recuo, 'text-end'])>

        @if ($sufixo !== null)
            <x-ui.field-affix side="suffix" :text="$sufixo" class="{{ $noSufixo }} {{ $letraDoSimbolo }}" />
        @endif
    </div>

    @if ($temErro && ! $naCelula)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint && ! $naCelula)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
