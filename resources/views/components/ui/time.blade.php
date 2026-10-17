@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    // `HH:mm`: o que fica fora aparece riscado no painel e não se aceita digitado.
    'min' => null,
    'max' => null,
    // De quantos em quantos minutos a coluna do painel anda. Digitado, vale qualquer minuto.
    'step' => 5,
    // Curto de propósito: a hora costuma ir em coluna estreita (início e fim lado a lado), e o formato já diz o que digitar.
    'placeholder' => 'hh:mm',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][start]` →
     * `items-0-start`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o campo do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
])

@php
    /*
     * A hora.
     *
     * Como a data: o `<input type="time">` nativo é a fonte da verdade — vai
     * no formulário em `HH:mm`, recebe `old()`, `min`/`max`/`required` e o
     * `change`. O JS (resources/js/time.js) o esconde e mostra por cima o
     * campo digitável `hh:mm` com o painel de hora e minuto. Sem JS, o
     * nativo aparece sozinho.
     *
     * O `step` não vai para o nativo: lá ele é em segundos e faria o
     * navegador recusar o minuto digitado fora da coluna.
     */
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    // `14:30`, `14:30:00` (a coluna `time` do banco) ou uma data: tudo vira `HH:mm`.
    $hhmm = function ($hora): ?string {
        if ($hora instanceof \DateTimeInterface) {
            return $hora->format('H:i');
        }

        if (! is_string($hora) || preg_match('/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/', $hora) !== 1) {
            return null;
        }

        return substr($hora, 0, 5);
    };

    $valor = $hhmm($remember ? old($chave, $hhmm($value)) : $value);
    $minimo = $hhmm($min);
    $maximo = $hhmm($max);
    $passo = max(1, (int) $step);
    $temErro = $errors->has($chave);

    // Os atributos que são do campo, e não da caixa em volta (ver x-ui.date).
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex', 'autocomplete'];
    $doTexto = ['disabled', 'readonly', 'tabindex'];
    $travado = (bool) $attributes->get('disabled') || (bool) $attributes->get('readonly');

    $tamanhos = [
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-3 text-sm',
        'lg' => 'h-12 px-4 text-base',
    ];

    $caixa = [
        'block w-full rounded-lg border text-neutral-900 bg-white tabular-nums',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
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
     data-horario
     data-passo="{{ $passo }}"
     @if ($minimo) data-min="{{ $minimo }}" @endif
     @if ($maximo) data-max="{{ $maximo }}" @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-horario-nativo-caixa>
    <input type="time"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           @if ($minimo) min="{{ $minimo }}" @endif
           @if ($maximo) max="{{ $maximo }}" @endif
           @required($required)
           data-horario-nativo
           {{ $attributes->only($doCampo) }}
           @class($caixa)>
    </div>

    <div class="relative" data-horario-campo hidden>
        <input type="text"
               inputmode="numeric"
               autocomplete="off"
               value="{{ $valor }}"
               placeholder="{{ $placeholder }}"
               data-mascara="99:99"
               data-horario-texto
               aria-haspopup="dialog"
               aria-expanded="false"
               {{ $attributes->only($doTexto) }}
               @class([...$caixa, 'pe-10 aria-invalid:border-danger-400 aria-invalid:focus:ring-danger-500/20 dark:aria-invalid:border-danger-500'])>

        {{-- Desligado ou só leitura, o painel também não abre: escolher nele mudaria a hora por fora. --}}
        <button type="button" data-horario-abrir tabindex="-1" aria-label="Abrir seletor de hora"
                @disabled($travado)
                class="absolute inset-y-0 end-0 flex cursor-pointer items-center pe-3 text-neutral-400
                       hover:text-neutral-600 dark:hover:text-neutral-200
                       disabled:cursor-not-allowed disabled:hover:text-neutral-400">
            <x-ui.icon name="clock" class="size-4" />
        </button>
    </div>

    <div data-horario-painel hidden></div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
