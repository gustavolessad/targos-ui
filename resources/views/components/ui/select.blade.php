@props([
    'name',
    'label' => null,
    /**
     * As opções. Três formatos:
     *
     * - simples: `[valor => rótulo]`, ou lista `['SC', 'SP']`;
     * - agrupado (`grouped`): `['Grupo' => [valor => rótulo]]`;
     * - hierárquico (`hierarchical`): árvore de nós
     *   `['value' => 1, 'label' => 'Residencial', 'children' => [...]]`.
     *
     * No simples e no agrupado, o rótulo pode ser um array, para a opção
     * com segunda linha e dados: `valor => ['label' => 'Café 500 g',
     * 'caption' => 'P-0012 · saldo 12', 'extra' => ['price' => '19.90']]`.
     * O `caption` aparece embaixo do rótulo, em letra menor; o `extra` é o
     * que a tela recebe ao escolher (`escolhaDe()` e o evento
     * `ui:selecionado`, no select.js). Numa lista, o valor vem do `value`
     * de cada um. O nó do hierárquico aceita as mesmas `caption` e `extra`.
     */
    'options' => [],
    'selected' => null,
    'placeholder' => null,
    'required' => false,
    /**
     * A explicação do campo, num ícone ao lado do rótulo.
     *
     * Para o que o rótulo não cabe dizer: de onde vem o número, o que
     * acontece se ficar em branco.
     */
    'info' => null,
    /** A linha de apoio embaixo do campo, como no `x-ui.input` (some quando há erro). */
    'hint' => null,
    /** `xs`, `sm`, `md`, `lg` ou `cell`: os mesmos nomes e medidas do input. */
    'size' => 'md',
    /** As opções vêm em grupos com título, que não se escolhem. */
    'grouped' => false,
    /** As opções vêm em árvore; o recuo mostra o nível e o pai também se escolhe. */
    'hierarchical' => false,
    /**
     * A caixa de busca no painel. Nulo decide sozinho: aparece a partir
     * de oito opções, que é quando rolar começa a custar mais que digitar.
     */
    'searchable' => null,
    /**
     * Busca no servidor, para listas grandes demais para vir inteiras
     * no HTML (os clientes, por exemplo): a URL que o select chama com
     * `?q=` ao abrir (vazio: as primeiras) e a cada busca digitada. O
     * endpoint responde com `Targos\Ui\SelectOptions::response()`.
     *
     * Com `source`, `options` não é usado: as opções vêm da busca.
     */
    'source' => null,
    /** Com `source`: o texto da opção já escolhida (na edição, ou voltando de um erro), que não vem na página. */
    'selectedLabel' => null,
    /*
     * Lembra o que foi enviado quando o formulário volta com erro.
     * Desligue no select que não foi enviado — o filtro da listagem com o
     * mesmo nome do campo do modal, o modal que ficou fechado —, senão ele
     * mostra o valor do outro.
     */
    'remember' => true,
    /** Com `source`: a segunda linha da opção já escolhida, como o `caption` da busca. */
    'selectedCaption' => null,
    /** Com `source`: os dados da opção já escolhida, como o `extra` da busca (array). */
    'selectedExtra' => null,
    /**
     * Com `source`: busca as primeiras opções assim que a página liga o
     * JavaScript, e não só ao abrir, para o primeiro clique abrir sem
     * esperar. Elas ficam guardadas: o painel volta a mostrá-las sem nova
     * busca até alguém digitar.
     */
    'prefetch' => false,
    /*
     * O `id` do `<select>`. Sem ele, sai do nome (`items[0][uf]` →
     * `items-0-uf`). Passe um quando dois formulários da mesma tela têm
     * o mesmo campo, para o rótulo de um não apontar para o do outro.
     */
    'id' => null,
])

@php
    // `items[0][uf]` no HTML é `items.0.uf` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);

    $valorAtual = $remember ? old($chave, $selected) : $selected;

    /*
     * Um select tem uma opção escolhida, nunca uma lista.
     *
     * `?ordem[]=a` na URL faz o `old()` devolver array, e comparar
     * array com texto na hora de marcar a opção derrubava a tela
     * com 500.
     */
    $valorAtual = is_array($valorAtual) ? null : $valorAtual;
    $valorAtual = $valorAtual === null ? null : (string) $valorAtual;

    $temErro = $errors->has($chave);

    /*
     * Tudo vira a mesma lista plana de entradas, e é dela que o
     * `<select>` nasce: `group` abre um `<optgroup>`, `option` é uma
     * escolha com o nível e o caminho que o painel usa, e a segunda linha
     * (`caption`) e os dados (`extra`, já em JSON) quando os tem.
     *
     * @var list<array{tipo: string, valor?: string, rotulo: string, nivel?: int, caminho?: string, caption?: ?string, extra?: ?string}>
     */
    $entradas = [];

    /*
     * A segunda linha e os dados seguem as regras da busca no servidor
     * (SelectOptions::response): vazio é nulo, e o select.js lê as
     * opções da página e as da busca do mesmo jeito.
     */
    $emJson = function (mixed $extra): ?string {
        $dados = \Targos\Ui\SelectOptions::extra($extra);

        return $dados === null ? null : json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    };

    $opcao = fn (mixed $valor, string $rotulo, int $nivel = 0, ?string $caminho = null, mixed $caption = null, mixed $extra = null): array => [
        'tipo' => 'option',
        'valor' => (string) $valor,
        'rotulo' => $rotulo,
        'nivel' => $nivel,
        'caminho' => $caminho ?? $rotulo,
        'caption' => \Targos\Ui\SelectOptions::caption($caption),
        'extra' => $emJson($extra),
    ];

    /*
     * Lista simples (['SC', 'SP']) ou mapa (valor => rótulo): o que
     * distingue as duas é a forma do array inteiro, não o tipo de cada
     * chave — `[3 => 'Casa']` é um mapa de id para nome.
     *
     * O rótulo que é array traz a segunda linha e os dados
     * (`['label' => …, 'caption' => …, 'extra' => […]]`); o valor é a
     * chave, ou o `value` dele numa lista.
     */
    $plano = function (array $mapa) use ($opcao): array {
        $lista = $mapa !== [] && array_is_list($mapa);
        $saida = [];

        foreach ($mapa as $valor => $rotulo) {
            $saida[] = is_array($rotulo)
                ? $opcao($rotulo['value'] ?? $valor, (string) $rotulo['label'], 0, null, $rotulo['caption'] ?? null, $rotulo['extra'] ?? null)
                : $opcao($lista ? $rotulo : $valor, (string) $rotulo);
        }

        return $saida;
    };

    if ($source !== null) {
        /*
         * Busca no servidor: o nativo nasce só com a opção escolhida (se
         * houver). As outras chegam pela busca (select.js), que reescreve
         * as opções do nativo — ele continua sendo o que vai no formulário.
         */
        $entradas = $valorAtual !== null && $selectedLabel !== null
            ? [$opcao($valorAtual, (string) $selectedLabel, 0, null, $selectedCaption, $selectedExtra)]
            : [];
    } elseif ($hierarchical) {
        $descer = function (array $nos, int $nivel, array $ancestrais) use (&$descer, $opcao): array {
            $saida = [];

            foreach ($nos as $no) {
                $caminho = [...$ancestrais, (string) $no['label']];
                $saida[] = $opcao($no['value'], (string) $no['label'], $nivel, implode(' › ', $caminho), $no['caption'] ?? null, $no['extra'] ?? null);
                $saida = [...$saida, ...$descer($no['children'] ?? [], $nivel + 1, $caminho)];
            }

            return $saida;
        };

        $entradas = $descer($options, 0, []);
    } elseif ($grouped) {
        foreach ($options as $grupo => $itens) {
            $entradas[] = ['tipo' => 'group', 'rotulo' => (string) $grupo, 'itens' => $plano($itens)];
        }
    } else {
        $entradas = $plano($options);
    }

    $todas = collect($entradas)->flatMap(fn (array $e): array => $e['tipo'] === 'group' ? $e['itens'] : [$e]);

    $escolhida = $todas->first(fn (array $e): bool => $valorAtual !== null && $e['valor'] === $valorAtual);

    // Com busca no servidor, a caixa de busca é o próprio jeito de achar a opção.
    $buscavel = $source !== null || ($searchable ?? $todas->count() >= 8);

    /*
     * As mesmas medidas do input, para os dois se alinharem quando
     * dividem uma linha.
     */
    $tamanhos = [
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-3 text-sm',
        'lg' => 'h-12 px-4 text-base',
        'cell' => 'px-2 py-1 text-sm',
    ];

    // O gatilho é um botão: ao abrir, o foco vai para o painel. Aberto (aria-expanded) mantém a cara de foco, como o campo de data.
    $foco = 'focus:border-primary-500 focus:ring-primary-500/20 aria-expanded:ring-2 aria-expanded:border-primary-500 aria-expanded:ring-primary-500/20';

    $caixa = [
        'block w-full rounded-lg border text-neutral-900',
        $tamanhos[$size] ?? $tamanhos['md'],
        'focus:outline-none focus:ring-2',
        'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
        'bg-white dark:bg-neutral-900 dark:text-white',
        'border-neutral-300 dark:border-neutral-700 '.$foco => ! $temErro,
        'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 aria-expanded:ring-2 aria-expanded:border-danger-500 aria-expanded:ring-danger-500/20 dark:border-danger-500' => $temErro,
    ];

    /*
     * O `id` do painel acompanha o do campo, que pode vir de fora. Passa
     * pelo FieldName, e não por `Str::slug`: o slug troca `_` por `-`, e o
     * `__i__` das linhas do `<x-ui.repeater>` virava `-i-`, o mesmo id em
     * toda linha clonada (com o `aria-controls` apontando para o painel
     * errado). Assim `addresses[__i__][uf]` dá `sel-addresses-__i__-uf`.
     */
    $id ??= \Targos\Ui\FieldName::id($name);
    $idDoPainel = 'sel-'.\Targos\Ui\FieldName::id($id.'-'.$attributes->get('form', ''));
@endphp

{{--
    O select do sistema.

    **O `<select>` nativo continua aqui**, e é ele que vai no formulário.
    O JavaScript o esconde e põe por cima um gatilho e um painel no
    estilo do multiselect — busca, grupos, recuo por nível. Tudo o que
    já conversava com o select nativo segue funcionando: `.value = x`
    vindo de outro script, o evento `change`, `disabled`, o atributo
    `form`, a busca de CEP que preenche a UF.

    Sem JavaScript, o nativo aparece sozinho, com a mesma cara.
--}}
{{--
    `min-w-0`: o campo cabe na coluna que tiver (a UF no endereço é
    estreita). Quem tem largura mínima é a lista (`min-w-48`, no painel
    abaixo): aberta, ela vai para o <body> (floating.js), alinhada ao campo
    e sem vazar da tela, então pode ser mais larga que ele sem sair cortada.
--}}
<div class="group relative min-w-0"
     data-seletor
     @if ($buscavel) data-seletor-busca @endif
     @if ($source !== null) data-seletor-fonte="{{ $source }}" @endif
     @if ($source !== null && $prefetch) data-seletor-pre-busca @endif>
    @if ($label)
        <x-ui.field-label :label="$label"
                          :for="$id"
                          :required="$required"
                          :info="$info"
                          class="mb-1.5" />
    @endif

    <select id="{{ $id }}"
            name="{{ $name }}"
            @required($required)
            data-seletor-nativo
            {{ $attributes->except('id')->class($caixa) }}>
        @if ($placeholder !== null)
            <option value="">{{ $placeholder }}</option>
        @endif

        @foreach ($entradas as $entrada)
            @if ($entrada['tipo'] === 'group')
                <optgroup label="{{ $entrada['rotulo'] }}">
                    @foreach ($entrada['itens'] as $item)
                        <option value="{{ $item['valor'] }}"
                                @if ($item['caption'] !== null) data-caption="{{ $item['caption'] }}" @endif
                                @if ($item['extra'] !== null) data-extra="{{ $item['extra'] }}" @endif
                                @selected($item['valor'] === $valorAtual)>{{ $item['rotulo'] }}</option>
                    @endforeach
                </optgroup>
            @else
                {{--
                    O recuo no nativo é o espaço; no painel, o `data-nivel`.
                    A segunda linha e os dados vão em `data-caption` e
                    `data-extra` (JSON): o nativo mostra só o rótulo, e o
                    painel e o `escolhaDe()` leem dali.
                --}}
                <option value="{{ $entrada['valor'] }}"
                        @if ($hierarchical)
                            data-nivel="{{ $entrada['nivel'] }}"
                            data-caminho="{{ $entrada['caminho'] }}"
                        @endif
                        @if ($entrada['caption'] !== null) data-caption="{{ $entrada['caption'] }}" @endif
                        @if ($entrada['extra'] !== null) data-extra="{{ $entrada['extra'] }}" @endif
                        @selected($entrada['valor'] === $valorAtual)>{{ str_repeat("\u{00A0}\u{00A0}\u{00A0}", $entrada['nivel']) }}{{ $entrada['rotulo'] }}</option>
            @endif
        @endforeach
    </select>

    {{--
        O gatilho: a cara do campo quando o JavaScript liga. Já vem com o
        texto certo do servidor, para a troca não piscar.
    --}}
    <button type="button"
            hidden
            data-seletor-gatilho
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls="{{ $idDoPainel }}"
            @class([
                ...$caixa,
                'flex cursor-pointer items-center gap-2 text-start',
                'aria-disabled:cursor-not-allowed aria-disabled:bg-neutral-100 aria-disabled:text-neutral-500',
                'dark:aria-disabled:bg-neutral-900/50',
            ])>
        <span @class([
                  'min-w-0 flex-1 truncate',
                  'text-neutral-400' => $escolhida === null,
              ])
              data-seletor-texto>{{ $escolhida['caminho'] ?? $placeholder ?? "\u{00A0}" }}</span>

        <x-ui.icon name="chevron-down" class="size-4 shrink-0 text-neutral-400 transition
                                              [[aria-expanded=true]_&]:rotate-180" />
    </button>

    {{--
        O painel. As opções são montadas pelo JavaScript a partir do
        `<select>` a cada abertura: se outro script esconder ou desligar
        uma opção — como a tela de tipos faz com a descendência —, o
        painel já abre sabendo.
    --}}
    <div id="{{ $idDoPainel }}" hidden
         data-seletor-painel
         class="absolute z-40 mt-1.5 w-full min-w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200
                dark:bg-neutral-900 dark:ring-neutral-800 origin-top animate-surgir">
        @if ($buscavel)
            <x-ui.input type="search"
                        size="cell"
                        radius="rounded-lg"
                        class="mb-1 w-full border-neutral-300 dark:border-neutral-700"
                        placeholder="Buscar..."
                        aria-label="Buscar opção"
                        data-seletor-filtro />
        @endif

        <div class="max-h-64 overflow-y-auto" role="listbox" data-seletor-lista></div>

        <p class="hidden px-2.5 py-2 text-sm text-neutral-500 dark:text-neutral-400" data-seletor-vazio>
            Nada encontrado.
        </p>
    </div>

    @error($chave)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @else
        @if ($hint)
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
        @endif
    @enderror
</div>
