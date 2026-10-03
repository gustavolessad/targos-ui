@props([
    /** O nome da lista: `pos_warehouses` → cada caixa é `pos_warehouses[]`. */
    'name',
    'label' => null,
    /** `valor => rótulo`, ou lista de `['value' => …, 'label' => …, 'hint' => …, 'disabled' => …]`. */
    'options' => [],
    /*
     * As caixas que não se marcam nem desmarcam, pelos valores:
     * `['transfer']`. Ficam à vista, apagadas — sumir com uma esconderia
     * que ela existe —, e a que está em `selected` continua marcada,
     * também quando o formulário volta com erro. `true` desliga o grupo
     * inteiro. A opção também pode dizer por si:
     * `['label' => …, 'disabled' => true]`.
     *
     * Como no HTML, a caixa desligada não vai no envio, marcada ou não:
     * o servidor mantém o valor que já tinha.
     *
     * @var list<string|int>|bool
     */
    'disabled' => [],
    /** Os valores marcados (lista). `old()` vence, como nos outros campos. */
    'selected' => [],
    'required' => false,
    'hint' => null,
    'info' => null,
    /** `xs|sm|md|lg`: o tamanho das caixas. */
    'size' => 'md',
    /** Lado a lado (`inline`) ou uma por linha (padrão). */
    'inline' => false,
    /** Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado. */
    'remember' => true,
    'id' => null,
])

@php
    /*
     * Um grupo de caixas é um campo só: tem rótulo, dica, erro e
     * obrigatoriedade de "ao menos uma" — o que cada caixa solta não
     * tem como dizer. É o que uma lista curta de escolhas (os depósitos
     * do PDV, os papéis de uma pessoa) pede sem o peso de um select.
     */
    $nome = rtrim($name, '[]');
    $chave = \Targos\Ui\FieldName::key($nome);
    $id ??= \Targos\Ui\FieldName::id($nome);

    // Os valores como texto, sem o que não é valor (um array perdido no `old()`). Uma Collection vale como a lista dela.
    $comoTexto = fn (mixed $lista): array => array_map('strval', array_filter(
        $lista instanceof \Illuminate\Contracts\Support\Arrayable ? $lista->toArray() : (array) $lista,
        fn ($v) => is_scalar($v),
    ));

    $doServidor = $comoTexto($selected);
    $marcados = $remember && session()->hasOldInput() ? $comoTexto(old($chave, [])) : $doServidor;

    // Comparadas como texto, como os valores marcados (ver o radio-group): `[1]` e `['1']` desligam a mesma caixa.
    $desligadas = array_map('strval', match (true) {
        is_array($disabled) => $disabled,
        is_scalar($disabled) && ! is_bool($disabled) => [$disabled],
        default => [],
    });

    $desligada = fn (string $valor, mixed $daOpcao): bool => $disabled === true
        || (bool) $daOpcao
        || in_array($valor, $desligadas, true);

    // Lista de arrays ou mapa valor => rótulo: os dois viram a mesma forma.
    $itens = [];

    foreach ($options as $valor => $rotulo) {
        $item = is_array($rotulo)
            ? ['value' => (string) ($rotulo['value'] ?? $valor), 'label' => (string) ($rotulo['label'] ?? ''), 'hint' => $rotulo['hint'] ?? null, 'disabled' => $rotulo['disabled'] ?? false]
            : ['value' => (string) $valor, 'label' => (string) $rotulo, 'hint' => null, 'disabled' => false];

        $item['disabled'] = $desligada($item['value'], $item['disabled']);

        /*
         * A desligada não foi no envio, e o `old()` nada diz dela: quem
         * diz é o `selected`, o valor gravado. Sem isso, a caixa marcada
         * e travada voltaria desmarcada de todo erro de validação.
         */
        $item['checked'] = in_array($item['value'], $item['disabled'] ? [...$marcados, ...$doServidor] : $marcados, true);
        $itens[] = $item;
    }

    // O erro pode vir na chave do grupo (`roles`) ou numa caixa (`roles.0`): o grupo mostra o primeiro dos dois.
    $erro = $errors->first($chave) ?: $errors->first($chave.'.*');
@endphp

<fieldset {{ $attributes->class(['group min-w-0']) }} id="{{ $id }}" data-grupo-de-caixas @required($required)>
    @if ($label)
        <legend class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <span data-campo-rotulo>{{ $label }}</span>
            @if ($required)<span class="text-danger-500">*</span>@endif
            @if ($info)<x-ui.label-info :text="$info" label="Sobre este grupo" />@endif
        </legend>
    @endif

    <div @class(['flex flex-wrap gap-x-6 gap-y-2' => $inline, 'space-y-2' => ! $inline])>
        @foreach ($itens as $item)
            <div>
                {{-- `disabled` não é prop do checkbox: cai no `$attributes` e vai para o `<input>` (falso não sai). --}}
                <x-ui.checkbox :name="$nome.'[]'" :value="$item['value']" :label="$item['label']"
                               :checked="$item['checked']" :size="$size"
                               :disabled="$item['disabled']"
                               :id="$id.'-'.\Targos\Ui\FieldName::id($item['value'])" />
                @if ($item['hint'])
                    <p @class(['ms-7 text-xs text-neutral-500 dark:text-neutral-400', 'opacity-60' => $item['disabled']])>{{ $item['hint'] }}</p>
                @endif
            </div>
        @endforeach
    </div>

    @if ($erro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $erro }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</fieldset>
