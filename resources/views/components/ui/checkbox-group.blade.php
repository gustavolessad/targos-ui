@props([
    /** O nome da lista: `pos_warehouses` → cada caixa é `pos_warehouses[]`. */
    'name',
    'label' => null,
    /** `valor => rótulo`, ou lista de `['value' => …, 'label' => …, 'hint' => …]`. */
    'options' => [],
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

    $marcados = $remember && session()->hasOldInput()
        ? (array) old($chave, [])
        : (array) $selected;
    $marcados = array_map('strval', array_filter($marcados, fn ($v) => is_scalar($v)));

    // Lista de arrays ou mapa valor => rótulo: os dois viram a mesma forma.
    $itens = [];

    foreach ($options as $valor => $rotulo) {
        $itens[] = is_array($rotulo)
            ? ['value' => (string) ($rotulo['value'] ?? $valor), 'label' => (string) ($rotulo['label'] ?? ''), 'hint' => $rotulo['hint'] ?? null]
            : ['value' => (string) $valor, 'label' => (string) $rotulo, 'hint' => null];
    }

    // O erro pode vir na chave do grupo (`roles`) ou numa caixa (`roles.0`): o grupo mostra o primeiro dos dois.
    $erro = $errors->first($chave) ?: $errors->first($chave.'.*');
@endphp

<fieldset {{ $attributes->class(['group min-w-0']) }} id="{{ $id }}" data-grupo-de-caixas @required($required)>
    @if ($label)
        <legend class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {{ $label }}
            @if ($required)<span class="text-danger-500">*</span>@endif
            @if ($info)<x-ui.label-info :text="$info" label="Sobre este grupo" />@endif
        </legend>
    @endif

    <div @class(['flex flex-wrap gap-x-6 gap-y-2' => $inline, 'space-y-2' => ! $inline])>
        @foreach ($itens as $item)
            <div>
                <x-ui.checkbox :name="$nome.'[]'" :value="$item['value']" :label="$item['label']"
                               :checked="in_array($item['value'], $marcados, true)" :size="$size"
                               :id="$id.'-'.\Targos\Ui\FieldName::id($item['value'])" />
                @if ($item['hint'])
                    <p class="ms-7 text-xs text-neutral-500 dark:text-neutral-400">{{ $item['hint'] }}</p>
                @endif
            </div>
        @endforeach
    </div>

    @if ($erro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $erro }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</fieldset>
