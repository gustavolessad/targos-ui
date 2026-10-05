@props([
    'name',
    'label' => null,
    /** O percentual como o banco o guarda: `'3.2500'` (ou o número 3.25) é 3,25%. */
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    /*
     * `xs` a `lg`, ou `cell`: só o campo, para a célula de tabela (o
     * desconto de cada item da venda), como no `x-ui.input`.
     */
    'size' => 'md',
    /*
     * Os limites. O `max` é também o teto da digitação: com 100, o
     * dígito que passaria de 100,00 não entra. Com `min` abaixo de zero
     * (ou `:min="false"`, sem limite), o "-" troca o sinal, como no
     * `x-ui.money`. "Sem limite" é `false` porque um atributo `null` é o
     * mesmo que não passado: o `@props` o troca pelo padrão.
     */
    'max' => '100',
    'min' => '0',
    'placeholder' => '0,00',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][rate]` →
     * `items-0-rate`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
    /*
     * A largura do campo com o seu envelope — rótulo, erro e dica —, como
     * no `x-ui.input` (ver `x-ui.money`). No `cell`, sem ela, o campo
     * ocupa a célula inteira.
     */
    'width' => null,
    /*
     * Os símbolos dentro do campo, antes e depois do número: texto, ou
     * `false` para tirar. Sem eles, nada antes e "%" depois. O recuo do
     * texto acompanha o lado que tem símbolo, com o mesmo espaço do
     * `x-ui.money`: `prefix="%" :suffix="false"` põe o "%" no lugar do
     * "R$", com o mesmo recuo.
     */
    'prefix' => null,
    'suffix' => null,
    /* O símbolo vira botão, que anuncia `ui:afixo` (ver `x-ui.money`). */
    'affixAction' => false,
    'affixLabel' => null,
])

@php
    /*
     * O percentual.
     *
     * O mesmo desenho do `x-ui.money`: o `<input type="number">` nativo é
     * a fonte da verdade, vai no formulário com 4 casas (`3.2500`) e
     * recebe `old()`, `min`/`max`/`required` e os eventos. O JS
     * (resources/js/percent.js) o esconde e mostra por cima o campo com
     * "%", que se digita como calculadora, em centésimos: "325" é 3,25.
     * A tela mostra 2 casas; enquanto ninguém digita, o nativo leva de
     * volta as 4 que vieram do banco.
     */
    // `items[0][rate]` no HTML é `items.0.rate` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $valor = \Targos\Ui\Money::normalize($remember ? old($chave, $value) : $value, 4);

    // `3.2500` → 3,25. O Money::format deixa o sinal de fora.
    $valorNegativo = $valor !== null && (float) \Targos\Ui\Money::normalize($valor) < 0;
    $exibido = $valor !== null ? ($valorNegativo ? '-' : '').\Targos\Ui\Money::format($valor) : '';

    // Sem piso (`:min="false"`), ou com piso abaixo de zero, o "-" troca o sinal.
    $minimo = $min === false ? null : $min;
    $aceitaNegativo = $minimo === null || (float) $minimo < 0;

    $temErro = $errors->has($chave);

    /*
     * Os atributos que são do campo, e não da caixa em volta: vão para o
     * nativo, que é o que o formulário lê. Todo o resto — `class`,
     * `data-*`, `on*`, `aria-*`, `style` — fica no envelope (ver
     * `x-ui.money`).
     */
    $doCampo = ['form', 'disabled', 'readonly', 'autofocus', 'tabindex', 'autocomplete'];

    // O que governa a digitação vai também para o visível; o `autofocus`, o percent.js passa a ele.
    $doTexto = ['disabled', 'readonly', 'tabindex'];

    // Os `aria-*` soltos também vão para o visível: é nele que o leitor de tela para (ver `x-ui.money`).
    $deAria = array_keys($attributes->filter(fn ($valor, string $chave): bool => str_starts_with($chave, 'aria-'))->getAttributes());

    /*
     * Por tamanho: a altura; o recuo do texto sem símbolo (início e fim)
     * e com ele (o espaço do prefixo e o do sufixo); onde o símbolo fica;
     * e a letra dele. **A mesma tabela do `x-ui.money`**: o "%" à
     * esquerda cai no lugar do "R$", com o mesmo recuo.
     */
    $tamanhos = [
        'xs' => ['h-7 text-xs', 'ps-2.5', 'pe-2.5', 'ps-8', 'pe-7', 'ps-2.5', 'pe-2.5', 'text-sm'],
        'sm' => ['h-9 text-sm', 'ps-3', 'pe-3', 'ps-9', 'pe-8', 'ps-3', 'pe-3', 'text-sm'],
        'md' => ['h-10 text-sm', 'ps-3', 'pe-3', 'ps-10', 'pe-9', 'ps-3', 'pe-3', 'text-sm'],
        'lg' => ['h-12 text-base', 'ps-4', 'pe-4', 'ps-11', 'pe-10', 'ps-4', 'pe-4', 'text-sm'],
        // Na célula, o símbolo é menor e mais junto da borda (ver `$naCelula`).
        'cell' => ['py-1 text-sm', 'ps-2', 'pe-2', 'ps-6', 'pe-5', 'ps-1.5', 'pe-1.5', 'text-xs'],
    ];

    /*
     * `cell` é o campo dentro de uma célula de tabela: sem rótulo, erro
     * nem dica, com a borda discreta do `x-ui.input size="cell"`. O
     * desenho continua o do `x-ui.money`, e o percent.js não distingue
     * os dois.
     *
     * **O "%" fica, menor (`text-xs`).** Ao contrário do "R$" do valor
     * em reais, que sai na célula: o percentual tem no máximo seis
     * caracteres ("100,00", uns 46px), e numa coluna de 110px, tirado o
     * recuo da célula da tabela (`px-4`), sobram 48px de texto com o
     * "%" ao lado. É ele que diz, na linha do item, que o 10,00 do
     * desconto não é o 10,00 do preço vizinho. Do mesmo jeito, o
     * símbolo passado (`prefix`, `suffix`) aparece na célula.
     */
    $naCelula = $size === 'cell';

    [$altura, $inicio, $fim, $comPrefixo, $comSufixo, $noPrefixo, $noSufixo, $letraDoSimbolo] = $tamanhos[$size] ?? $tamanhos['md'];

    // `null` é o padrão; `false` ou vazio, nenhum.
    $simbolo = fn (mixed $valor, ?string $padrao): ?string => match (true) {
        $valor === null => $padrao,
        $valor === true => '%',
        $valor === false, $valor === '' => null,
        default => (string) $valor,
    };

    $prefixo = $simbolo($prefix, null);
    $sufixo = $simbolo($suffix, '%');

    // O recuo do texto: o espaço do símbolo do lado que tem um.
    $recuo = [$prefixo !== null ? $comPrefixo : $inicio, $sufixo !== null ? $comSufixo : $fim];

    // O botão do símbolo apaga com o campo desligado (só leitura, o affix.js recusa o clique).
    $campoDesligado = (bool) $attributes->get('disabled');

    $caixa = $naCelula ? [
        // A borda à vista, sem fundo, e mais escura no hover (ver `x-ui.money`).
        'block w-full rounded-md border bg-transparent text-neutral-900 transition',
        'placeholder:text-neutral-400',
        'focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:text-neutral-400',
        'read-only:cursor-not-allowed read-only:text-neutral-400',
        'dark:text-white dark:placeholder:text-neutral-500',
        $altura,
        // A borda de erro é a mesma do tamanho normal: na célula não há onde escrever a mensagem.
        'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-800 dark:hover:border-neutral-600' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ] : [
        'block w-full rounded-lg border text-neutral-900 bg-white',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
        'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
        // Desligado: cinza e sem cursor de escrita, como o campo de texto comum.
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
        'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];

    // O nativo não tem sufixo: o recuo é o mesmo dos dois lados.
    $recuoDoNativo = $naCelula ? 'px-2' : 'px-3';

    // Na célula, o envelope é a largura do campo: sem `width`, a célula inteira.
    $envelope = $naCelula ? ['relative', $width ?? 'w-full'] : ['group relative', $width];

    // Na célula, o `label` vira o nome acessível do visível, e o erro vai no `aria-invalid` e no `title` (ver `x-ui.money`).
    $naCelulaAcessivel = $naCelula ? array_filter([
        'aria-label' => $label,
        'aria-invalid' => $temErro ? 'true' : null,
        'title' => $temErro ? $errors->first($chave) : null,
    ]) : [];
@endphp

<div {{ $attributes->except([...$doCampo, ...$deAria])->class(array_filter($envelope)) }} data-percentual>
    {{-- Na célula, quem rotula é o cabeçalho da coluna. --}}
    @if ($label && ! $naCelula)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-percentual-nativo-caixa>
    <input type="number"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           step="0.0001"
           @if ($minimo !== null) min="{{ $minimo }}" @endif
           @if ($max !== null) max="{{ $max }}" @endif
           @required($required)
           data-percentual-nativo
           {{ $attributes->only($doCampo) }}
           @class([...$caixa, $recuoDoNativo])>
    </div>

    <div class="relative" data-percentual-campo hidden>
        @if ($prefixo !== null)
            <x-ui.field-affix side="prefix" :text="$prefixo" :action="$affixAction" :label="$affixLabel"
                              :disabled="$campoDesligado" class="{{ $noPrefixo }} {{ $letraDoSimbolo }}" />
        @endif

        {{-- Com negativo, o teclado é o de texto: o numérico do iPhone não tem o "-". --}}
        <input type="text"
               id="{{ $id }}-texto"
               inputmode="{{ $aceitaNegativo ? 'text' : 'numeric' }}"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-percentual-texto
               {{ $attributes->only([...$doTexto, ...$deAria])->merge($naCelulaAcessivel) }}
               @class([...$caixa, ...$recuo, 'text-end'])>

        @if ($sufixo !== null)
            <x-ui.field-affix side="suffix" :text="$sufixo" :action="$affixAction" :label="$affixLabel"
                              :disabled="$campoDesligado" class="{{ $noSufixo }} {{ $letraDoSimbolo }}" />
        @endif
    </div>

    {{-- Na célula, nem erro nem dica: uma linha a mais desalinharia a tabela. --}}
    @if ($temErro && ! $naCelula)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint && ! $naCelula)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
