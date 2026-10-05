@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    'min' => null,
    'max' => null,
    'placeholder' => 'Selecione a data',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][due]` →
     * `items-0-due`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo — o modal de criar e o de editar —, para o rótulo de
     * um não apontar para o campo do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
])

@php
    /*
     * A data única.
     *
     * O `<input type="date">` nativo é a fonte da verdade: vai no formulário
     * em `Y-m-d`, recebe `old()`, `min`/`max`/`required` e o `change`. O JS
     * (resources/js/ui/date.js) o esconde e mostra por cima o campo digitável
     * `dd/mm/aaaa` com o calendário. Sem JS, o nativo aparece sozinho.
     */
    // `items[0][due]` no HTML é `items.0.due` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $iso = fn ($data): ?string => $data instanceof \DateTimeInterface ? $data->format('Y-m-d') : (is_string($data) ? $data : null);
    $valida = fn (?string $data): ?string => $data !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $data) ? $data : null;

    $valor = $valida($iso($remember ? old($chave, $iso($value)) : $iso($value)));
    $exibido = $valor ? \Carbon\CarbonImmutable::createFromFormat('!Y-m-d', $valor)->format('d/m/Y') : '';
    $minimo = $valida($iso($min));
    $maximo = $valida($iso($max));
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
     * leitura, não se escreve nele. O `autofocus` fica só no nativo, que
     * é o que aparece sem JS; o date.js o passa ao visível quando monta.
     */
    $doTexto = ['disabled', 'readonly', 'tabindex'];
    $travado = (bool) $attributes->get('disabled') || (bool) $attributes->get('readonly');

    $tamanhos = [
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-3 text-sm',
        'lg' => 'h-12 px-4 text-base',
    ];

    $caixa = [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
        // Desligado: cinza e sem cursor de escrita, como o campo de texto comum.
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
        'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
        $tamanhos[$size] ?? $tamanhos['md'],
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];
@endphp

<div {{ $attributes->except($doCampo)->class(['group relative']) }}
     data-data
     data-hoje="{{ now()->toDateString() }}"
     @if ($minimo) data-min="{{ $minimo }}" @endif
     @if ($maximo) data-max="{{ $maximo }}" @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-data-nativo-caixa>
    <input type="date"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           @if ($minimo) min="{{ $minimo }}" @endif
           @if ($maximo) max="{{ $maximo }}" @endif
           @required($required)
           data-data-nativo
           {{ $attributes->only($doCampo) }}
           @class($caixa)>
    </div>

    <div class="relative" data-data-campo hidden>
        <input type="text"
               inputmode="numeric"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-mascara="99/99/9999"
               data-data-texto
               aria-haspopup="dialog"
               aria-expanded="false"
               {{ $attributes->only($doTexto) }}
               @class([...$caixa, 'pe-10 aria-invalid:border-danger-400 aria-invalid:focus:ring-danger-500/20 dark:aria-invalid:border-danger-500'])>

        {{-- Desligado ou só leitura, o calendário também não abre: escolher nele mudaria a data por fora. --}}
        <button type="button" data-data-abrir tabindex="-1" aria-label="Abrir calendário"
                @disabled($travado)
                class="absolute inset-y-0 end-0 flex cursor-pointer items-center pe-3 text-neutral-400
                       hover:text-neutral-600 dark:hover:text-neutral-200
                       disabled:cursor-not-allowed disabled:hover:text-neutral-400">
            <x-ui.icon name="calendar" class="size-4" />
        </button>
    </div>

    <div data-calendario-painel hidden></div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
