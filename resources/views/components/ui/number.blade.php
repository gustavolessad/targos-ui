@props([
    /*
     * Sem nome, o campo não é enviado: é o caso do filtro de um
     * painel, que só estreita o que está à vista.
     */
    'name' => null,
    'label' => null,
    'value' => null,
    'hint' => null,
    /** A explicação do campo, num ícone ao lado do rótulo (ver `x-ui.input`). */
    'info' => null,
    'required' => false,
    'size' => 'md',
    /*
     * Os limites. Ao sair do campo, o que passou deles volta para dentro,
     * e o vazio vira o `min`. Sem `min` (ou com ele abaixo de zero), o
     * campo aceita o "-" no começo.
     */
    'min' => null,
    'max' => null,
    /** Quanto o − e o + andam. */
    'step' => 1,
    /*
     * O campo pode ficar em branco: ao sair, o vazio continua vazio em
     * vez de virar o `min`, e os limites valem só para o que foi
     * digitado. Para a contagem em que "em branco" é "não contado" e 0 é
     * "contei zero". O − num campo vazio dá o `min` (ou 0), sem descer.
     */
    'nullable' => false,
    'placeholder' => null,
    /*
     * O `id` do campo. Sem ele, sai do nome (`items[0][qty]` →
     * `items-0-qty`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
    /*
     * A largura do campo com o seu envelope — rótulo, erro e dica. Aqui,
     * e não no `class`, que vai para o `<input>` (ver `x-ui.input`).
     */
    'width' => null,
])

@php
    /*
     * Um número inteiro, com − e + ao lado: quantidade, parcelas, dias.
     *
     * `type="text"` com `inputmode="numeric"` (o teclado de números no
     * celular), e não `type="number"`: o nativo muda o valor com a roda
     * do mouse quando a tela rola por cima dele, aceita "e" e "1.5", e
     * cada navegador desenha as setas do seu jeito, ou não desenha. O JS
     * (resources/js/number.js) deixa só dígitos, ajusta aos limites ao
     * sair e liga os botões. Sem JS, é um campo de texto comum.
     */
    // `items[0][qty]` no HTML é `items.0.qty` para old() e para os erros.
    $chave = $name === null ? null : \Targos\Ui\FieldName::key($name);
    $id ??= $name === null ? null : \Targos\Ui\FieldName::id($name);

    $valorAtual = $name === null || ! $remember ? $value : old($chave, $value);

    // Um campo tem um valor, nunca uma lista: `?qty[]=1` na URL faria o old() devolver um array.
    $valorAtual = is_array($valorAtual) ? null : $valorAtual;

    // `3.00`, de uma coluna decimal, é 3: o campo é de inteiros.
    if (is_numeric($valorAtual) && (float) $valorAtual == (int) $valorAtual) {
        $valorAtual = (string) (int) $valorAtual;
    }

    $temErro = $chave !== null && $errors->has($chave);

    // Desligado ou só leitura, o − e o + também não mexem: mudariam o valor por fora da trava.
    $travado = (bool) $attributes->get('disabled') || (bool) $attributes->get('readonly');

    /*
     * Os tamanhos do `x-ui.input`, com o fim do campo livre para os dois
     * botões: a altura e o texto, o recuo dos botões e o ícone.
     */
    $tamanhos = [
        'xs' => ['h-7 ps-2.5 pe-14 text-xs', 'px-1', 'size-3.5'],
        'sm' => ['h-9 ps-3 pe-16 text-sm', 'px-1.5', 'size-4'],
        'md' => ['h-10 ps-3 pe-16 text-sm', 'px-1.5', 'size-4'],
        'lg' => ['h-12 ps-4 pe-20 text-base', 'px-2', 'size-5'],
    ];

    $naCelula = $size === 'cell';
    [$medidas, $recuoDoBotao, $icone] = $tamanhos[$size] ?? $tamanhos['md'];

    /*
     * Na célula não há rótulo nem linha de erro: o `label` vira o nome
     * acessível do campo, e o erro vai na borda, no `aria-invalid` e no
     * `title` (a mensagem, ao passar o mouse). Como padrões do `merge`:
     * o `aria-label` passado de fora vence.
     */
    $naCelulaAcessivel = $naCelula ? array_filter([
        'aria-label' => $label,
        'aria-invalid' => $temErro ? 'true' : null,
        'title' => $temErro ? $errors->first($chave) : null,
    ]) : [];
@endphp

@if ($naCelula)
    {{--
        Só o campo: quem o rotula é o cabeçalho da coluna, e o − e o +
        em cada linha de uma grade virariam uma parede de botões. As
        setas do teclado ainda somam e subtraem.
    --}}
    <input type="text"
           inputmode="numeric"
           @if ($id) id="{{ $id }}" @endif
           @if ($name) name="{{ $name }}" @endif
           value="{{ $valorAtual }}"
           @if ($placeholder !== null) placeholder="{{ $placeholder }}" @endif
           @required($required)
           data-numero-campo
           @if ($min !== null) data-min="{{ $min }}" @endif
           @if ($max !== null) data-max="{{ $max }}" @endif
           data-step="{{ $step }}"
           @if ($nullable) data-nullable @endif
           {{ $attributes->merge(['autocomplete' => 'off', ...$naCelulaAcessivel])->class([
               'rounded border bg-transparent text-neutral-900 tabular-nums transition',
               'placeholder:text-neutral-400',
               'focus:ring-2 focus:outline-none',
               'disabled:cursor-not-allowed disabled:text-neutral-400',
               'dark:text-white dark:placeholder:text-neutral-500',
               'px-2 py-1 text-sm',
               $width ?? 'w-full',
               // A borda de erro é a mesma do tamanho normal: na célula não há onde escrever a mensagem, e a cor é o aviso.
               'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-800 dark:hover:border-neutral-600' => ! $temErro,
               'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
           ]) }}>
@else
    <div class="group {{ $width }}" data-numero>
        @if ($label)
            <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
        @endif

        <div class="relative">
            <input type="text"
                   inputmode="numeric"
                   @if ($id) id="{{ $id }}" @endif
                   @if ($name) name="{{ $name }}" @endif
                   value="{{ $valorAtual }}"
                   @if ($placeholder !== null) placeholder="{{ $placeholder }}" @endif
                   @required($required)
                   data-numero-campo
                   @if ($min !== null) data-min="{{ $min }}" @endif
                   @if ($max !== null) data-max="{{ $max }}" @endif
                   data-step="{{ $step }}"
                   @if ($nullable) data-nullable @endif
                   {{ $attributes->merge(['autocomplete' => 'off'])->class([
                       'block w-full rounded-lg border text-neutral-900 tabular-nums',
                       'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                       // Desligado: cinza e sem cursor de escrita, para se ler sem se tentar editar.
                       'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                       'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                       $medidas,
                       'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                       'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                       'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
                   ]) }}>

            {{--
                **Fora do Tab.** Entre um campo e o próximo, quem preenche
                o formulário pararia duas vezes em botões que só repetem o
                que se digita; no teclado, as setas para cima e para baixo
                fazem o papel deles. O `aria-label` os descreve para quem
                usa leitor de tela.
            --}}
            <div class="absolute inset-y-0 end-0 flex items-center pe-1">
                <button type="button" data-numero-menos tabindex="-1" aria-label="Diminuir"
                        @disabled($travado)
                        class="flex h-full cursor-pointer items-center {{ $recuoDoBotao }} text-neutral-400
                               hover:text-neutral-600 dark:hover:text-neutral-200
                               disabled:cursor-not-allowed disabled:hover:text-neutral-400">
                    <x-ui.icon name="minus" class="{{ $icone }}" />
                </button>

                <button type="button" data-numero-mais tabindex="-1" aria-label="Aumentar"
                        @disabled($travado)
                        class="flex h-full cursor-pointer items-center {{ $recuoDoBotao }} text-neutral-400
                               hover:text-neutral-600 dark:hover:text-neutral-200
                               disabled:cursor-not-allowed disabled:hover:text-neutral-400">
                    <x-ui.icon name="plus" class="{{ $icone }}" />
                </button>
            </div>
        </div>

        @if ($temErro)
            <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
        @elseif ($hint)
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
        @endif
    </div>
@endif
