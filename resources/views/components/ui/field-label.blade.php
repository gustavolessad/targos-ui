@props([
    'label',
    /** O `id` do campo que este rótulo nomeia. */
    'for' => null,
    'required' => false,
    /**
     * A explicação do campo, num ícone de informação ao lado.
     *
     * Para o que o rótulo não cabe dizer: de onde vem o número, o que
     * acontece se ficar em branco, por que aquele campo existe. No
     * `hint` embaixo, o mesmo texto empurraria os campos vizinhos para
     * fora do alinhamento numa grade.
     */
    'info' => null,
])

{{--
    O rótulo de um campo, igual nos quatro que o desenham.

    Existe porque input, select, textarea e multiselect repetiam a
    mesma marcação — e a dica de informação teria de ser escrita quatro
    vezes, para divergir na primeira mudança.
--}}
<div {{ $attributes->class(['flex items-center gap-1.5']) }}>
    <label @if ($for) for="{{ $for }}" @endif
           class="block text-sm font-medium text-neutral-700 dark:text-neutral-300
                  group-has-disabled:text-neutral-400 dark:group-has-disabled:text-neutral-500">
        {{-- `data-campo-rotulo`: só o texto, para um script trocá-lo ("CPF" → "CNPJ") sem levar o asterisco junto. --}}
        <span data-campo-rotulo>{{ $label }}</span>

        @if ($required)
            <span class="text-danger-500">*</span>
        @endif
    </label>

    @if ($info)
        <x-ui.label-info :text="$info" />
    @endif
</div>
