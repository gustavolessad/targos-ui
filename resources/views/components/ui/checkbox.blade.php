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
    /** O texto de apoio embaixo da caixa, quando não há erro. Não aparece no `bare`. */
    'hint' => null,
    /*
     * O `id` da caixa. Sem ele, sai do nome e do valor (`items[0][active]`
     * com valor 1 → `items-0-active-1`); no `bare`, sem ele não há `id`.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
])

@php
    /*
     * A caixa acompanha a escala dos campos: `xs` ao lado de um rótulo
     * `text-xs` não pode ser maior que a letra.
     */
    $tamanhos = ['xs' => 'size-3.5', 'sm' => 'size-4', 'md' => 'size-5', 'lg' => 'size-6'];

    // Numa lista (`nome[]`), cada caixa é um item, e não o campo inteiro.
    $lista = $name !== null && str_ends_with($name, '[]');

    // `items[0][active]` no HTML é `items.0.active` para old() e para os erros; `tags[]` é `tags`.
    $chave = $name === null ? null : \Targos\Ui\FieldName::key($name);

    /*
     * Um `id` por caixa, com o valor junto.
     *
     * `FieldName::id` tira os colchetes do nome (`items[0][active]` →
     * `items-0-active`) e limpa o valor, porque ele vira parte do
     * atributo: um "P / Preto" com barra e espaço não é `id` válido, e o
     * `<label for>` não o acharia. Num nome simples, sai o mesmo `id` de
     * sempre (`ativo-1`).
     *
     * Não é `Str::slug`: ele trocaria o `__i__` do `x-ui.repeater` por
     * `-i-`, e toda linha nova nasceria com o mesmo id.
     */
    $nomeNoId = \Targos\Ui\FieldName::id((string) $name);
    $idDaCaixa = $id ?? (\Targos\Ui\FieldName::id($nomeNoId.'-'.mb_strtolower((string) $value)) ?: $nomeNoId);

    /*
     * O erro aparece embaixo da caixa só quando ela é o campo inteiro.
     * Numa lista, o erro é do grupo e a tela o mostra uma vez: repetido
     * em cada caixa, seria o mesmo aviso dez vezes.
     *
     * `isset`: a caixa nunca dependeu de `$errors`, que fora de uma
     * requisição web pode não existir.
     */
    $temErro = $chave !== null && ! $lista && isset($errors) && $errors->has($chave);

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
    // `true` manda "0" no desligado; um texto manda esse texto (`:falsy="'inactive'"`).
    $falsy ??= (bool) config('ui.falsy', false);
    $valorDesligado = is_string($falsy) && $falsy !== '' ? $falsy : '0';
    $falsy = $falsy !== false && $falsy !== null && $falsy !== '';

    $marcado = match (true) {
        $name === null || $lista => $checked,
        // O formulário voltou com erro: marcada é "o que voltou é o valor da caixa" (com `falsy` de texto, o desmarcado também volta).
        $remember && session()->hasOldInput() => (string) old($chave, '') === (string) $value,
        default => $checked,
    };
@endphp

@if ($bare)
    {{-- Na célula, `id` só quando a tela pede: a caixa solta nunca teve um. --}}
    <input type="checkbox"
           @if ($id !== null) id="{{ $id }}" @endif
           @if ($name) name="{{ $name }}" @endif
           value="{{ $value }}"
           @checked($marcado)
           @if ($form) form="{{ $form }}" @endif
           {{ $attributes->except('id')->class([...$classes, 'shrink-0']) }}>
@else
    {{--
        A mensagem embaixo pede um envelope em volta da linha — e só
        quando há mensagem. Sem erro nem dica, a caixa sai com a mesma
        marcação de sempre, e as telas que a põem numa grade ou numa
        linha de caixas não mudam.
    --}}
    @if ($temErro || $hint)
        <div>
    @endif

    <div class="flex items-center">
        @if ($falsy)
            {{--
                O `hidden` antes garante que desmarcado chegue como "0":
                um checkbox desligado não é enviado pelo navegador, e o
                campo voltaria ao padrão sozinho ao salvar.

                O `form` acompanha: fora dele, o escondido não é enviado.
            --}}
            <input type="hidden" name="{{ $name }}" value="{{ $valorDesligado }}" data-falsy @if ($form) form="{{ $form }}" @endif>
        @endif

        <input type="checkbox"
               id="{{ $idDaCaixa }}"
               name="{{ $name }}"
               value="{{ $value }}"
               @checked($marcado)
               @if ($form) form="{{ $form }}" @endif
               {{ $attributes->except('id')->class($classes) }}>

        @if ($label)
            <label for="{{ $idDaCaixa }}"
                   class="ms-2 cursor-pointer text-sm text-neutral-700 select-none dark:text-neutral-300">
                <span data-campo-rotulo>{{ $label }}</span>
            </label>
        @endif
    </div>

    @if ($temErro || $hint)
        @if ($temErro)
            <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
        @else
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
        @endif
        </div>
    @endif
@endif
