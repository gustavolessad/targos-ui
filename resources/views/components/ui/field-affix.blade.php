@props([
    /** `prefix` (antes do número) ou `suffix` (depois). */
    'side' => 'prefix',
    /** O símbolo: "R$", "%". */
    'text',
    /** Clicável: um `<button>` que anuncia `ui:afixo` (resources/js/affix.js). */
    'action' => false,
    /** O nome do botão para o leitor de tela, e a dica ao passar o mouse ("Trocar para percentual"). */
    'label' => null,
    'disabled' => false,
])

{{--
    O símbolo dentro do campo — o "R$" do `x-ui.money`, o "%" do
    `x-ui.percent` —, igual nos dois e nos dois lados.

    A posição (o recuo da borda) e a letra vêm no `class`, do tamanho do
    campo: é o campo que sabe quanto espaço deixou para o símbolo.

    **Clicável, o visual é o mesmo**: a mesma cor, o mesmo lugar, o mesmo
    peso. O que muda é o cursor e um escurecer discreto no hover — marcá-lo
    com cor ou sublinhado o faria o elemento mais chamativo de uma linha onde
    o que importa é o número. `tabindex="-1"`: o Tab segue entre os campos,
    e o teclado não para num símbolo.
--}}
@php
    $lado = $side === 'suffix' ? 'suffix' : 'prefix';

    $base = [
        'absolute inset-y-0 flex items-center text-neutral-500 dark:text-neutral-400',
        $lado === 'prefix' ? 'start-0' : 'end-0',
    ];

    $temNome = $label !== null && $label !== '';
@endphp

@if ($action)
    <button type="button"
            tabindex="-1"
            data-campo-afixo="{{ $lado }}"
            @if ($temNome) aria-label="{{ $label }}" title="{{ $label }}" @endif
            @disabled($disabled)
            {{ $attributes->class([
                ...$base,
                'cursor-pointer transition-colors',
                'enabled:hover:text-neutral-800 dark:enabled:hover:text-neutral-100',
                'focus-visible:text-primary-600 focus-visible:outline-none dark:focus-visible:text-primary-400',
                // Desligado, apaga junto com o campo: aceso, seria o único pedaço do campo que parece clicável.
                'disabled:cursor-not-allowed disabled:text-neutral-300 dark:disabled:text-neutral-600',
            ]) }}>{{ $text }}</button>
@else
    <span {{ $attributes->class(['pointer-events-none', ...$base]) }}>{{ $text }}</span>
@endif
