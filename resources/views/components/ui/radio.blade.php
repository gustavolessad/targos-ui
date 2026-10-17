@props([
    'name',
    'value',
    /*
     * O texto ao lado do rádio. O slot, quando há, vale no lugar: é
     * para o rótulo com destaque dentro ("Em todas com <strong>Preto</strong>").
     */
    'label' => null,
    'checked' => false,
    'form' => null,
    /*
     * `size-5` é o da tela; `sm` (size-4) serve à lista de rádios ao lado
     * de texto `text-sm`, como as caixas de uma lista longa.
     */
    'size' => 'md',
    // A cor do rádio marcado: `primary` por padrão, `success` quando escolher é confirmar.
    'color' => 'primary',
    /** O texto de apoio embaixo do rádio. */
    'hint' => null,
    /*
     * O `id` do rádio. Sem ele, sai do nome e do valor, como no
     * `x-ui.checkbox` (`forma` com valor `pix` → `forma-pix`): os
     * rádios de um grupo têm o mesmo nome, e só o valor os separa.
     */
    'id' => null,
    // Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado.
    'remember' => true,
])

@php
    // Os mesmos degraus do `x-ui.checkbox`: o rádio e a caixa lado a lado não destoam.
    $tamanhos = ['xs' => 'size-3.5', 'sm' => 'size-4', 'md' => 'size-5', 'lg' => 'size-6'];

    // `items[0][tipo]` no HTML é `items.0.tipo` para old().
    $chave = \Targos\Ui\FieldName::key($name);

    $nomeNoId = \Targos\Ui\FieldName::id($name);
    $idDoRadio = $id ?? (\Targos\Ui\FieldName::id($nomeNoId.'-'.mb_strtolower((string) $value)) ?: $nomeNoId);

    /*
     * As cores por extenso: o Tailwind lê as classes no código-fonte, e
     * `text-{$cor}-600` nunca seria gerado. A borda acompanha o
     * preenchimento quando marcado, como na caixa.
     */
    $cores = [
        'primary' => 'text-primary-600 checked:border-primary-600 focus:ring-primary-500/30 '
            .'dark:checked:border-primary-600 dark:checked:bg-primary-600',
        'success' => 'text-success-600 checked:border-success-600 focus:ring-success-500/30 '
            .'dark:checked:border-success-600 dark:checked:bg-success-600',
    ];

    $classes = [
        // `peer`: o rótulo ao lado acompanha o rádio desligado (`peer-disabled:`), sem JavaScript.
        'peer shrink-0 cursor-pointer rounded-full border-neutral-300',
        'focus:ring-2 focus:ring-offset-0',
        'dark:border-neutral-600 dark:bg-neutral-900',
        'disabled:cursor-not-allowed disabled:opacity-60',
        $cores[$color] ?? $cores['primary'],
        $tamanhos[$size] ?? $tamanhos['md'],
    ];

    /*
     * O formulário voltou com erro: marcado é o que voltou. Sem nada no
     * `old()` para o nome, nenhum rádio do grupo volta marcado — salvo o
     * de valor vazio, que é o "nenhuma das outras" que o envio mandou.
     */
    $marcado = $remember && session()->hasOldInput()
        ? (string) old($chave, '') === (string) $value
        : $checked;

    $temRotulo = $slot->isNotEmpty() || filled($label);

    // A dica alinha com o texto do rótulo: a largura do rádio mais o `ms-2`.
    $recuos = ['xs' => 'ms-5.5', 'sm' => 'ms-6', 'md' => 'ms-7', 'lg' => 'ms-8'];
@endphp

{{--
    Um rádio só, com o rótulo ao lado: para a lista de escolhas em
    coluna, onde cada opção é uma frase — o `x-ui.radio-group`, de
    botões lado a lado, é para as escolhas curtas.

    O erro é do grupo, e a tela o mostra uma vez (`@error('forma')`):
    repetido em cada rádio, seria o mesmo aviso em todas as linhas.
--}}
@if ($hint)
    <div>
@endif

<div class="flex items-center">
    <input type="radio"
           id="{{ $idDoRadio }}"
           name="{{ $name }}"
           value="{{ $value }}"
           @checked($marcado)
           @if ($form) form="{{ $form }}" @endif
           {{ $attributes->except('id')->class($classes) }}>

    @if ($temRotulo)
        <label for="{{ $idDoRadio }}"
               class="ms-2 cursor-pointer text-sm text-neutral-700 select-none dark:text-neutral-300
                      peer-disabled:cursor-not-allowed peer-disabled:text-neutral-400 dark:peer-disabled:text-neutral-500">
            <span data-campo-rotulo>{{ $slot->isNotEmpty() ? $slot : $label }}</span>
        </label>
    @endif
</div>

@if ($hint)
        <p @class(['mt-1.5 text-xs text-neutral-500 dark:text-neutral-400', $recuos[$size] ?? $recuos['md']]) data-campo-dica>{{ $hint }}</p>
    </div>
@endif
