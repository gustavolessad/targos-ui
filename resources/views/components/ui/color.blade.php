@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    'size' => 'md',
    /*
     * Com transparência: a barra de opacidade no painel e o código de oito
     * dígitos (`#rrggbbaa`). A cor cheia continua saindo com seis — quem
     * recebe só precisa aceitar os oito quando a opacidade é menor que 100%.
     */
    'alpha' => false,
    /** Cores prontas no painel, um clique cada: `['#16a34a', '#171717']`. As que não forem cor ficam de fora. */
    'swatches' => [],
    // Sem ele, o formato que o campo espera.
    'placeholder' => null,
    /*
     * O `id` do campo. Sem ele, sai do nome (`items[0][color]` →
     * `items-0-color`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o campo do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
])

@php
    /*
     * A cor.
     *
     * O campo de texto com o código é o campo do formulário: vai como
     * `#rrggbb` (ou `#rrggbbaa`, com `alpha`), recebe `old()` e
     * `required`. Sem JS, continua digitável, com a amostra ao lado. O JS
     * (resources/js/color.js) acrescenta o painel: a área de saturação e
     * brilho, a barra do matiz, a da opacidade e as cores prontas.
     *
     * No lugar do `<input type="color">` nativo, que não tem transparência
     * e abre um seletor diferente em cada sistema.
     */
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    // `#ABC`, `aabbcc`, `#AABBCCFF`: tudo vira `#aabbcc` (e `#aabbcc80` com transparência). O que não é cor, null.
    $normalizar = function ($cor) use ($alpha): ?string {
        $digitos = $alpha ? [3, 4, 6, 8] : [3, 6];

        if (! is_string($cor) || preg_match('/^#?([0-9a-fA-F]+)$/', trim($cor), $achado) !== 1
            || ! in_array(strlen($achado[1]), $digitos, true)) {
            return null;
        }

        $hex = strtolower($achado[1]);
        $hex = strlen($hex) <= 4 ? implode('', array_map(fn (string $d): string => $d.$d, str_split($hex))) : $hex;

        // A opacidade cheia sai com seis dígitos, como a cor de quem não usa transparência.
        return '#'.(strlen($hex) === 8 && str_ends_with($hex, 'ff') ? substr($hex, 0, 6) : $hex);
    };

    $bruto = $remember ? old($chave, $value) : $value;
    // O digitado que voltou com erro aparece como foi digitado: é ele que a mensagem aponta.
    $valor = is_string($bruto) ? ($normalizar($bruto) ?? $bruto) : null;
    $valido = $normalizar($valor);

    $placeholder ??= $alpha ? '#rrggbbaa' : '#rrggbb';
    $prontas = array_values(array_unique(array_filter(array_map($normalizar, (array) $swatches))));
    $temErro = $errors->has($chave);

    // O xadrez por trás da cor transparente — o mesmo do JS (`XADREZ`).
    $xadrez = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px';
    $fundoDaAmostra = $valido ? "linear-gradient({$valido}, {$valido}), {$xadrez}" : $xadrez;

    // Os atributos que são do campo, e não da caixa em volta (ver x-ui.date).
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex'];
    $travado = (bool) $attributes->get('disabled') || (bool) $attributes->get('readonly');

    $tamanhos = [
        'xs' => ['campo' => 'h-7 pe-2.5 ps-8 text-xs', 'amostra' => 'size-4 ms-2'],
        'sm' => ['campo' => 'h-9 pe-3 ps-10 text-sm', 'amostra' => 'size-5 ms-2.5'],
        'md' => ['campo' => 'h-10 pe-3 ps-11 text-sm', 'amostra' => 'size-6 ms-2.5'],
        'lg' => ['campo' => 'h-12 pe-4 ps-12 text-base', 'amostra' => 'size-7 ms-3'],
    ];

    $tamanho = $tamanhos[$size] ?? $tamanhos['md'];
@endphp

<div {{ $attributes->except($doCampo)->class(['group relative']) }}
     data-seletor-cor
     @if ($alpha) data-cor-alfa @endif
     @if ($prontas !== []) data-cor-amostras="{{ json_encode($prontas) }}" @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    <div class="relative" data-cor-campo>
        {{-- A amostra é o botão do painel. Sem JS, só mostra a cor. Desligado ou só leitura, o painel não abre. --}}
        <button type="button" data-cor-abrir tabindex="-1" aria-label="Abrir seletor de cor"
                @disabled($travado)
                class="absolute inset-y-0 start-0 flex cursor-pointer items-center disabled:cursor-not-allowed">
            <span data-cor-amostra
                  @class(['block rounded-md ring-1 ring-inset ring-black/15 dark:ring-white/20', $tamanho['amostra']])
                  style="background: {{ $fundoDaAmostra }}"></span>
        </button>

        <input type="text"
               id="{{ $id }}"
               name="{{ $name }}"
               value="{{ $valor }}"
               placeholder="{{ $placeholder }}"
               maxlength="{{ $alpha ? 9 : 7 }}"
               autocomplete="off"
               autocapitalize="off"
               spellcheck="false"
               aria-haspopup="dialog"
               aria-expanded="false"
               @required($required)
               data-cor-texto
               {{ $attributes->only($doCampo) }}
               @class([
                   'block w-full rounded-lg border bg-white font-mono text-neutral-900 tabular-nums',
                   'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                   'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                   'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                   'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                   'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
                   'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
                   'aria-invalid:border-danger-400 aria-invalid:focus:ring-danger-500/20 dark:aria-invalid:border-danger-500',
                   $tamanho['campo'],
                   'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                   'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
               ])>
    </div>

    <div data-cor-painel hidden></div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
