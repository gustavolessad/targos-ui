@props([
    'name',
    'label' => null,
    'value' => null,
    'hint' => null,
    'info' => null,
    'required' => false,
    /*
     * `xs` a `lg`, ou `cell`: só o campo, para a célula de tabela (os
     * itens da venda), como no `x-ui.input`.
     */
    'size' => 'md',
    /*
     * O menor valor aceito. Sem ele, o padrão segue o campo: 0,01 (zero
     * não é valor) ou 0 com `allowZero`.
     *
     * Abaixo de zero, ou `:min="false"` (sem limite), o campo aceita
     * negativo: o "-" troca o sinal e -1.500,00 grava `-1500.00`. É a
     * mesma regra do `x-ui.percent`, sem prop própria.
     *
     * "Sem limite" é `false`, e não `null`: um atributo `null` é o mesmo
     * que não passado (o `@props` o troca pelo padrão), e não teria como
     * ser distinguido de "deixe o padrão decidir".
     */
    'min' => null,
    'placeholder' => '0,00',
    /*
     * O `id` do campo nativo. Sem ele, sai do nome (`items[0][cost]` →
     * `items-0-cost`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo — o modal de criar e o de editar —, para o rótulo de
     * um não apontar para o campo do outro.
     */
    'id' => null,
    /* Lembra o enviado quando o formulário volta com erro; desligue no formulário que não foi enviado (o outro modal da tela). */
    'remember' => true,
    /*
     * As casas do valor que vai no formulário: 2, ou 4 para o custo
     * unitário (`3.9505`).
     *
     * A tela mostra sempre 2, arredondadas — é dinheiro —, e o que se
     * digita grava com 4 (`3.9500`). Enquanto ninguém digita, o nativo
     * leva de volta o que veio do banco, com as 4 casas: abrir o
     * formulário e salvar sem mexer não arredonda um custo.
     */
    'scale' => 2,
    /*
     * Zero é valor: "0" digitado mostra 0,00 e grava `0.00`, e o `min`
     * padrão vira 0. Para o desconto, o frete grátis — o que pode não
     * custar nada sem estar em branco.
     */
    'allowZero' => false,
    /*
     * A largura do campo com o seu envelope — rótulo, erro e dica —, como
     * no `x-ui.input`. Aqui o `class` também vai para o envelope e faria
     * o mesmo; a prop existe para a tela escrever a largura igual em todo
     * campo. No `cell`, sem ela, o campo ocupa a célula inteira.
     */
    'width' => null,
    /*
     * Os símbolos dentro do campo, antes e depois do número: texto, ou
     * `false` para tirar. Sem eles, "R$" antes e nada depois. O recuo do
     * texto acompanha o lado que tem símbolo, com o mesmo espaço do
     * `x-ui.percent`: o "%" que ele põe à esquerda cai no lugar do "R$".
     *
     * Não passado é `null`, e não o "R$": é como o `cell` sabe que o
     * símbolo foi pedido de propósito (ver `$naCelula`).
     */
    'prefix' => null,
    'suffix' => null,
    /*
     * O símbolo vira botão (resources/js/affix.js): o clique anuncia
     * `ui:afixo` no envelope, com `detail: { lado, campo }`, e devolve o
     * foco ao campo. O que o clique faz é da tela — o pacote só avisa.
     * `affixLabel` é o nome do botão para o leitor de tela.
     */
    'affixAction' => false,
    'affixLabel' => null,
])

@php
    /*
     * O valor em reais.
     *
     * O `<input type="number">` nativo é a fonte da verdade: vai no
     * formulário com ponto (`1500.00`), recebe `old()`, `min`/`required`
     * e os eventos que outras telas escutam (a prévia das parcelas). O JS
     * (resources/js/money.js) o esconde e mostra por cima o campo com
     * "R$", que se digita como calculadora (1.500,00). Sem JS, o nativo
     * aparece sozinho. Formatar valor em reais: Targos\Ui\Money.
     */
    // `items[0][cost]` no HTML é `items.0.cost` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    // O visível mostra centavos, então menos de 2 casas não existe; mais de 4, nenhuma coluna pede.
    $escala = max(2, min(4, (int) $scale));
    $passo = '0.'.str_repeat('0', $escala - 1).'1';

    $valor = \Targos\Ui\Money::normalize($remember ? old($chave, $value) : $value, $escala);

    // A tela mostra 2 casas (`3.9505` → 3,95) e o sinal, que o Money::format deixa de fora.
    $valorNegativo = $valor !== null && (float) \Targos\Ui\Money::normalize($valor) < 0;
    $exibido = $valor !== null ? ($valorNegativo ? '-' : '').\Targos\Ui\Money::format($valor) : '';

    $minimo = match (true) {
        $min === false => null,
        $min !== null => $min,
        (bool) $allowZero => '0',
        default => '0.01',
    };

    // Sem piso, ou com piso abaixo de zero, o campo aceita negativo (ver `min`).
    $negativo = $minimo === null || (is_numeric($minimo) && (float) $minimo < 0);

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
     * leitura, não se escreve nele. O `tabindex` também, porque o JS tira
     * o nativo do Tab. O `autofocus` fica só no nativo, que é o que
     * aparece sem JS; o money.js o passa ao visível quando monta.
     */
    $doTexto = ['disabled', 'readonly', 'tabindex'];

    /*
     * Os `aria-*` soltos também vão para o visível: é nele que o leitor
     * de tela para. Num `<div>` eles não dizem nada.
     */
    $deAria = array_keys($attributes->filter(fn ($valor, string $chave): bool => str_starts_with($chave, 'aria-'))->getAttributes());

    /*
     * Por tamanho: a altura; o recuo do texto sem símbolo (início e fim)
     * e com ele (o espaço do prefixo e o do sufixo); onde o símbolo fica;
     * e a letra dele. **A mesma tabela do `x-ui.percent`**: o "%" à
     * esquerda cai no lugar do "R$", com o mesmo recuo, e o sufixo daqui
     * no lugar do "%" de lá.
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
     * desenho continua o mesmo — o nativo escondido e o visível por
     * cima —, e o money.js não distingue os dois.
     *
     * **Sem o "R$", a não ser pedido.** Numa coluna de 110px, tirado o
     * recuo da célula da tabela (`px-4`) e o do campo, sobram uns 60px
     * de texto: "1.500,00" cabe justo, e o prefixo, mesmo em `text-xs`,
     * levaria quase metade disso. A moeda vai no cabeçalho da coluna,
     * que é quem rotula o campo na tabela. O símbolo aparece quando a
     * tela o passa (`prefix`, `suffix`) ou quando ele é clicável — aí ele
     * é um controle, e não um rótulo, e a coluna tem de caber nele.
     */
    $naCelula = $size === 'cell';

    [$altura, $inicio, $fim, $comPrefixo, $comSufixo, $noPrefixo, $noSufixo, $letraDoSimbolo] = $tamanhos[$size] ?? $tamanhos['md'];

    // `null` é o padrão; `false` ou vazio, nenhum.
    $simbolo = fn (mixed $valor, ?string $padrao): ?string => match (true) {
        $valor === null => $padrao,
        $valor === true => 'R$',
        $valor === false, $valor === '' => null,
        default => (string) $valor,
    };

    $prefixo = $naCelula && $prefix === null && ! $affixAction ? null : $simbolo($prefix, 'R$');
    $sufixo = $simbolo($suffix, null);

    // O recuo do texto: o espaço do símbolo do lado que tem um.
    $recuo = [$prefixo !== null ? $comPrefixo : $inicio, $sufixo !== null ? $comSufixo : $fim];

    // O botão do símbolo apaga com o campo desligado (só leitura, o affix.js recusa o clique).
    $campoDesligado = (bool) $attributes->get('disabled');

    $caixa = $naCelula ? [
        /*
         * A borda à vista, sem fundo, e mais escura no hover: numa tabela
         * cheia de texto, o campo sem contorno não se anuncia como campo.
         */
        'block w-full rounded border bg-transparent text-neutral-900 transition',
        'placeholder:text-neutral-400',
        'focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:text-neutral-400',
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
        $altura,
        'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];

    // O nativo não tem prefixo: o recuo é o mesmo dos dois lados.
    $recuoDoNativo = $naCelula ? 'px-2' : 'px-3';

    // Na célula, o envelope é a largura do campo: sem `width`, a célula inteira.
    $envelope = $naCelula ? ['relative', $width ?? 'w-full'] : ['group relative', $width];

    /*
     * Na célula não há rótulo nem linha de erro: o `label` vira o nome
     * acessível do visível, e o erro vai no `aria-invalid` e no `title`
     * (a mensagem, ao passar o mouse). Padrões do `merge`: o `aria-label`
     * passado de fora vence.
     */
    $naCelulaAcessivel = $naCelula ? array_filter([
        'aria-label' => $label,
        'aria-invalid' => $temErro ? 'true' : null,
        'title' => $temErro ? $errors->first($chave) : null,
    ]) : [];
@endphp

<div {{ $attributes->except([...$doCampo, ...$deAria])->class(array_filter($envelope)) }}
     data-dinheiro
     data-dinheiro-escala="{{ $escala }}"
     @if ($allowZero) data-dinheiro-zero @endif
     @if ($negativo) data-dinheiro-negativo @endif>
    {{-- Na célula, quem rotula é o cabeçalho da coluna. --}}
    @if ($label && ! $naCelula)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- A caixa é o que o JS esconde (sr-only): no próprio input, o w-full venceria o 1px e vazaria da tela. --}}
    <div data-dinheiro-nativo-caixa>
    <input type="number"
           id="{{ $id }}"
           name="{{ $name }}"
           value="{{ $valor }}"
           step="{{ $passo }}"
           @if ($minimo !== null) min="{{ $minimo }}" @endif
           @required($required)
           data-dinheiro-nativo
           {{ $attributes->only($doCampo) }}
           @class([...$caixa, $recuoDoNativo])>
    </div>

    <div class="relative" data-dinheiro-campo hidden>
        @if ($prefixo !== null)
            <x-ui.field-affix side="prefix" :text="$prefixo" :action="$affixAction" :label="$affixLabel"
                              :disabled="$campoDesligado" class="{{ $noPrefixo }} {{ $letraDoSimbolo }}" />
        @endif

        {{--
            Números alinhados à direita, como numa coluna de valores.

            Com negativo, o teclado é o de texto: o numérico do iPhone não
            tem o "-", e o valor negativo não teria como ser digitado.
        --}}
        <input type="text"
               id="{{ $id }}-texto"
               inputmode="{{ $negativo ? 'text' : 'numeric' }}"
               autocomplete="off"
               value="{{ $exibido }}"
               placeholder="{{ $placeholder }}"
               data-dinheiro-texto
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
