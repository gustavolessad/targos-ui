@props([
    /*
     * Sem nome, a caixa nao e enviada: e o caso do multiselect, onde
     * ela so controla a escolha e o valor vai por campo escondido.
     */
    'name' => null,
    'label' => null,
    'checked' => false,
    'value' => '1',
    'form' => null,
    /*
     * `size-5` é o da tela; `sm` (size-4) serve às listas longas, onde
     * dezenas de caixas grandes pesam.
     */
    'size' => 'md',
    /*
     * O campo escondido que faz "desmarcado" chegar como "0".
     *
     * Vale para o interruptor de um valor — "Ativo", "Destaque". Numa
     * lista de vários (`nome[]`), atrapalha: cada caixa mandaria um
     * zero, e o servidor receberia uma lista de zeros.
     *
     * Sem valor, vale `config('ui.falsy')` — desligado por padrão: com o
     * "0" o campo chega sempre, e o controller que pergunta
     * `$request->has()` o leria como marcado. Ligue onde o servidor lê
     * o valor (`$request->boolean()`).
     */
    'falsy' => null,
    /*
     * Só a caixa, sem envelope nem rótulo: para a célula de tabela,
     * onde quem rotula é o cabeçalho da coluna.
     */
    'bare' => false,
    /*
     * A cor da caixa marcada: `primary` por padrão, `success` quando
     * marcar é confirmar.
     */
    'color' => 'primary',
])

@php
    /*
     * A caixa acompanha a escala dos campos: `xs` ao lado de um rótulo
     * `text-xs` não pode ser maior que a letra.
     */
    $tamanhos = ['xs' => 'size-3.5', 'sm' => 'size-4', 'md' => 'size-5', 'lg' => 'size-6'];

    /*
     * Um `id` por caixa, com o valor junto.
     *
     * `Str::slug` porque o valor vira parte do atributo: um "P / Preto"
     * com barra e espaço não é `id` válido, e o `<label for>` não o
     * acharia.
     */
    $id = \Illuminate\Support\Str::slug($name.'-'.(string) $value) ?: $name;

    /*
     * As duas cores por extenso, não montadas com interpolação: o
     * Tailwind lê as classes no código-fonte, e `text-{$cor}-600`
     * nunca seria gerado.
     *
     * A borda acompanha o preenchimento quando marcada: o plugin de
     * forms define `border-color` fixo, e cinza contra fundo colorido
     * deixava um contorno estranho em volta da caixa cheia.
     */
    $cores = [
        'primary' => 'text-primary-600 checked:border-primary-600 focus:ring-primary-500/30 '
            .'dark:checked:border-primary-600 dark:checked:bg-primary-600',
        'success' => 'text-success-600 checked:border-success-600 focus:ring-success-500/30 '
            .'dark:checked:border-success-600 dark:checked:bg-success-600',
    ];

    $classes = [
        'cursor-pointer rounded border-neutral-300',
        /*
         * `ring-offset-0`: sem ele o anel de foco nasce descolado da
         * caixa, com um halo branco no meio.
         */
        'focus:ring-2 focus:ring-offset-0',
        'dark:border-neutral-600 dark:bg-neutral-900',
        'disabled:cursor-not-allowed disabled:opacity-60',
        $cores[$color] ?? $cores['primary'],
        $tamanhos[$size] ?? $tamanhos['md'],
    ];

    /*
     * `old()` não serve a uma caixa de lista: ali o que vale é a lista
     * inteira, que a tela resolve antes de chamar o componente.
     */
    $falsy ??= (bool) config('ui.falsy', false);

    $marcado = match (true) {
        $name === null || str_ends_with($name, '[]') => $checked,
        // O formulário voltou com erro: desmarcada não vem no envio, então "não veio" é desmarcada (e não o padrão).
        session()->hasOldInput() => (bool) old($name),
        default => $checked,
    };
@endphp

@if ($bare)
    <input type="checkbox"
           @if ($name) name="{{ $name }}" @endif
           value="{{ $value }}"
           @checked($marcado)
           @if ($form) form="{{ $form }}" @endif
           {{ $attributes->class([...$classes, 'shrink-0']) }}>
@else
    <div class="flex items-center">
        @if ($falsy)
            {{--
                O `hidden` antes garante que desmarcado chegue como "0":
                um checkbox desligado não é enviado pelo navegador, e o
                campo voltaria ao padrão sozinho ao salvar.

                O `form` acompanha: fora dele, o escondido não é enviado.
            --}}
            <input type="hidden" name="{{ $name }}" value="0" @if ($form) form="{{ $form }}" @endif>
        @endif

        <input type="checkbox"
               id="{{ $id }}"
               name="{{ $name }}"
               value="{{ $value }}"
               @checked($marcado)
               @if ($form) form="{{ $form }}" @endif
               {{ $attributes->class($classes) }}>

        @if ($label)
            <label for="{{ $id }}"
                   class="ms-2 cursor-pointer text-sm text-neutral-700 select-none dark:text-neutral-300">
                {{ $label }}
            </label>
        @endif
    </div>
@endif
