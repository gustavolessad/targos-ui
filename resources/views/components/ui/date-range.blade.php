@props([
    'start',
    'end',
    'label' => null,
    'startValue' => null,
    'endValue' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    'min' => null,
    'max' => null,
    // 'none' | 'past' | 'future' | 'both', ou uma lista das chaves de
    // DateShortcuts::PRESETS, na ordem: ['este_mes', 'mes_passado'].
    'shortcuts' => 'none',
    'placeholder' => 'Selecione o período',
])

@php
    /*
     * O período: início e fim, cada um no seu `<input type="date">` nativo
     * (nomes `start` e `end`), que vão no formulário em `Y-m-d`. O JS
     * (resources/js/ui/date-range.js) os esconde e mostra um botão com o
     * intervalo e o calendário de dois cliques. "Aplicar" grava os dois.
     *
     * Os atalhos vêm prontos do servidor (App\Support\Dates\DateShortcuts),
     * com o "hoje" do sistema.
     */
    $iso = fn ($data): ?string => $data instanceof \DateTimeInterface ? $data->format('Y-m-d') : (is_string($data) ? $data : null);
    $valida = fn (?string $data): ?string => $data !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $data) ? $data : null;
    $exibir = fn (?string $data): string => $data ? \Carbon\CarbonImmutable::createFromFormat('!Y-m-d', $data)->format('d/m/Y') : '';

    $inicio = $valida($iso(old($start, $iso($startValue))));
    $fim = $valida($iso(old($end, $iso($endValue))));
    $minimo = $valida($iso($min));
    $maximo = $valida($iso($max));
    $texto = $inicio && $fim ? $exibir($inicio).' até '.$exibir($fim) : '';

    $atalhos = \App\Support\Dates\DateShortcuts::for(
        $shortcuts,
        $minimo ? \Carbon\CarbonImmutable::parse($minimo) : null,
        $maximo ? \Carbon\CarbonImmutable::parse($maximo) : null,
    );

    $temErro = $errors->has($start) || $errors->has($end);
    $mensagem = $errors->first($start) ?: $errors->first($end);

    $tamanhos = [
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-3 text-sm',
        'lg' => 'h-12 px-4 text-base',
    ];

    $caixa = [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white',
        $tamanhos[$size] ?? $tamanhos['md'],
        // O gatilho é um botão: aberto (aria-expanded), mantém a cara de foco enquanto o calendário está na tela.
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700'
            .' aria-expanded:ring-2 aria-expanded:border-primary-500 aria-expanded:ring-primary-500/20' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500'
            .' aria-expanded:ring-2 aria-expanded:border-danger-500 aria-expanded:ring-danger-500/20' => $temErro,
    ];
@endphp

<div {{ $attributes->class(['group relative']) }}
     data-periodo
     data-hoje="{{ now()->toDateString() }}"
     @if ($minimo) data-min="{{ $minimo }}" @endif
     @if ($maximo) data-max="{{ $maximo }}" @endif
     data-atalhos='{{ json_encode($atalhos, JSON_UNESCAPED_UNICODE) }}'>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$start" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    <div class="grid grid-cols-2 gap-2" data-periodo-nativos>
        <input type="date" id="{{ $start }}" name="{{ $start }}" value="{{ $inicio }}"
               @if ($minimo) min="{{ $minimo }}" @endif @if ($maximo) max="{{ $maximo }}" @endif
               @required($required) aria-label="Início" data-periodo-inicio @class($caixa)>

        <input type="date" id="{{ $end }}" name="{{ $end }}" value="{{ $fim }}"
               @if ($minimo) min="{{ $minimo }}" @endif @if ($maximo) max="{{ $maximo }}" @endif
               @required($required) aria-label="Fim" data-periodo-fim @class($caixa)>
    </div>

    <button type="button" hidden data-periodo-gatilho aria-haspopup="dialog" aria-expanded="false"
            data-placeholder="{{ $placeholder }}"
            @class([...$caixa, 'flex cursor-pointer items-center gap-2 text-start'])>
        <x-ui.icon name="calendar-range" class="size-4 shrink-0 text-neutral-400" />
        <span @class(['min-w-0 flex-1 truncate', 'text-neutral-400' => $texto === '']) data-periodo-texto>{{ $texto ?: $placeholder }}</span>
        <x-ui.icon name="chevron-down" class="size-4 shrink-0 text-neutral-400" />
    </button>

    <div data-calendario-painel hidden></div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $mensagem }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
