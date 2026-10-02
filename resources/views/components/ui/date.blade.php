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
    $iso = fn ($data): ?string => $data instanceof \DateTimeInterface ? $data->format('Y-m-d') : (is_string($data) ? $data : null);
    $valida = fn (?string $data): ?string => $data !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $data) ? $data : null;

    $valor = $valida($iso(old($name, $iso($value))));
    $exibido = $valor ? \Carbon\CarbonImmutable::createFromFormat('!Y-m-d', $valor)->format('d/m/Y') : '';
    $minimo = $valida($iso($min));
    $maximo = $valida($iso($max));
    $temErro = $errors->has($name);

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
        $tamanhos[$size] ?? $tamanhos['md'],
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];
@endphp

<div {{ $attributes->class(['group relative']) }}
     data-data
     data-hoje="{{ now()->toDateString() }}"
     @if ($minimo) data-min="{{ $minimo }}" @endif
     @if ($maximo) data-max="{{ $maximo }}" @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$name" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-data-nativo-caixa>
    <input type="date"
           id="{{ $name }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           @if ($minimo) min="{{ $minimo }}" @endif
           @if ($maximo) max="{{ $maximo }}" @endif
           @required($required)
           data-data-nativo
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
               @class([...$caixa, 'pe-10 aria-invalid:border-danger-400 aria-invalid:focus:ring-danger-500/20 dark:aria-invalid:border-danger-500'])>

        <button type="button" data-data-abrir tabindex="-1" aria-label="Abrir calendário"
                class="absolute inset-y-0 end-0 flex cursor-pointer items-center pe-3 text-neutral-400
                       hover:text-neutral-600 dark:hover:text-neutral-200">
            <x-ui.icon name="calendar" class="size-4" />
        </button>
    </div>

    <div data-calendario-painel hidden></div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($name) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
