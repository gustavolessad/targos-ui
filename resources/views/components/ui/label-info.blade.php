@props([
    /** O que o campo é, em uma ou duas frases. */
    'text',
    'side' => 'top',
    /** O nome do botão para o leitor de tela: "Sobre este campo" num campo, "Sobre esta coluna" numa tabela. */
    'label' => 'Sobre este campo',
])

{{--
    O ícone de informação que acompanha um rótulo.

    Para o que o rótulo não cabe dizer: de onde vem o número, o que
    acontece se ficar em branco, por que o campo existe. Num `hint`
    embaixo, o mesmo texto empurraria os vizinhos para fora do
    alinhamento numa grade de campos.

    Usado pelo `<x-ui.field-label>`, e disponível solto para quem
    precisar explicar algo que não é campo — o título de uma seção, uma
    coluna de tabela.

    **Fora do caminho do Tab.** Ele fica entre o rótulo e o campo, e no
    teclado se meteria entre um campo e o seguinte: quem preenche o
    formulário direto pararia numa explicação que já leu ou não quer.
    A dica continua alcançável pelo mouse, e quem usa leitor de tela a
    encontra pelo `aria-label`.

    `side="top"` por padrão: numa grade, a bolha à direita cairia sobre
    o campo vizinho.
--}}
<x-ui.tooltip :text="$text" :side="$side">
    <button type="button"
            tabindex="-1"
            {{ $attributes->class([
                'flex cursor-help items-center text-neutral-400 transition',
                'hover:text-neutral-600 dark:hover:text-neutral-200',
            ]) }}
            aria-label="{{ $label }}">
        <x-ui.icon name="info" class="size-3.5" />
    </button>
</x-ui.tooltip>
