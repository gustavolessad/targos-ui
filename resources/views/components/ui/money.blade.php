@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    /*
     * O menor valor aceito. Sem ele, o padrão segue o campo: 0,01 (zero
     * não é valor) ou 0 com `allowZero`.
     *
     * Abaixo de zero, ou `:min="false"` (sem limite), o campo aceita
     * negativo: o "-" troca o sinal e -1.500,00 grava `-1500.00`. É a
     * mesma regra do `x-ui.percent`, sem prop própria.
     *
     * "Sem limite" é `false`, e não `null`: um atributo `null` é o mesmo
     * que não passado (o `@props` o troca pelo padrão), e não teria como
     * ser distinguido de "deixe o padrão decidir".
     */
    'min' => null,
    'placeholder' => '0,00',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][cost]` →
     * `items-0-cost`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo — o modal de criar e o de editar —, para o rótulo de
     * um não apontar para o campo do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
    /*
     * As casas do valor que vai no formulário: 2, ou 4 para o custo
     * unitário (`3.9505`).
     *
     * A tela mostra sempre 2, arredondadas — é dinheiro —, e o que se
     * digita grava com 4 (`3.9500`). Enquanto ninguém digita, o nativo
     * leva de volta o que veio do banco, com as 4 casas: abrir o
     * formulário e salvar sem mexer não arredonda um custo.
     */
    'scale' => 2,
    /*
     * Zero é valor: "0" digitado mostra 0,00 e grava `0.00`, e o `min`
     * padrão vira 0. Para o desconto, o frete grátis — o que pode não
     * custar nada sem estar em branco.
     */
    'allowZero' => false,
])

@php
    /*
     * O valor em reais.
     *
     * O `<input type="number">` nativo é a fonte da verdade: vai no
     * formulário com ponto (`1500.00`), recebe `old()`, `min`/`required`
     * e os eventos que outras telas escutam (a prévia das parcelas). O JS
     * (resources/js/money.js) o esconde e mostra por cima o campo com
     * "R$", que se digita como calculadora (1.500,00). Sem JS, o nativo
     * aparece sozinho. Formatar valor em reais: Targos\Ui\Money.
     */
    // `items[0][cost]` no HTML é `items.0.cost` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    // O visível mostra centavos, então menos de 2 casas não existe; mais de 4, nenhuma coluna pede.
    $escala = max(2, min(4, (int) $scale));
    $passo = '0.'.str_repeat('0', $escala - 1).'1';

    $valor = \Targos\Ui\Money::normalize($remember ? old($chave, $value) : $value, $escala);

    // A tela mostra 2 casas (`3.9505` → 3,95) e o sinal, que o Money::format deixa de fora.
    $valorNegativo = $valor !== null && (float) \Targos\Ui\Money::normalize($valor) < 0;
    $exibido = $valor !== null ? ($valorNegativo ? '-' : '').\Targos\Ui\Money::format($valor) : '';

    $minimo = match (true) {
        $min === false => null,
        $min !== null => $min,
        (bool) $allowZero => '0',
        default => '0.01',
    };

    // Sem piso, ou com piso abaixo de zero, o campo aceita negativo (ver `min`).
    $negativo = $minimo === null || (is_numeric($minimo) && (float) $minimo < 0);

    $temErro = $errors->has($chave);

    /*
     * Os atributos que são do campo, e não da caixa em volta.
     *
     * Num `<div>`, `form` e `disabled` não fazem nada: ele não é enviado
     * nem se desliga. Vão para o nativo, que é o que o formulário lê.
     * (`required` é prop e já vai para ele.) Todo o resto — `class`,
     * `data-*`, `on*`, `aria-*`, `style` — fica no envelope: as telas
     * penduram ali o `onchange` e contam com o evento subindo do nativo.
     */
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex', 'autocomplete'];

    /*
     * O campo visível recebe o que governa a digitação: desligado ou só
     * leitura, não se escreve nele. O `tabindex` também, porque o JS tira
     * o nativo do Tab. O `autofocus` fica só no nativo, que é o que
     * aparece sem JS; o money.js o passa ao visível quando monta.
     */
    $doTexto = ['disabled', 'readonly', 'tabindex'];

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
        // Desligado: cinza e sem cursor de escrita, como o campo de texto comum.
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];
@endphp

<div {{ $attributes->except($doCampo)->class(['group relative']) }}
     data-dinheiro
     data-dinheiro-escala="{{ $escala }}"
     @if ($allowZero) data-dinheiro-zero @endif
     @if ($negativo) data-dinheiro-negativo @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-dinheiro-nativo-caixa>
    <input type="number"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           step="{{ $passo }}"
           @if ($minimo !== null) min="{{ $minimo }}" @endif
           @required($required)
           data-dinheiro-nativo
           {{ $attributes->only($doCampo) }}
           @class([...$caixa, 'px-3'])>
    </div>

    <div class="relative" data-dinheiro-campo hidden>
        <span class="pointer-events-none absolute inset-y-0 start-0 flex items-center {{ $posicaoDoPrefixo }} text-sm text-neutral-500 dark:text-neutral-400">R$</span>

        {{--
            Números alinhados à direita, como numa coluna de valores.

            Com negativo, o teclado é o de texto: o numérico do iPhone não
            tem o "-", e o valor negativo não teria como ser digitado.
        --}}
        <input type="text"
               id="{{ $id }}-texto"
               inputmode="{{ $negativo ? 'text' : 'numeric' }}"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-dinheiro-texto
               {{ $attributes->only($doTexto) }}
               @class([...$caixa, $recuo, 'text-end tabular-nums'])>
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
