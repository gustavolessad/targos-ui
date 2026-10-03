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
     * Várias escolhas: o nativo vira `<select multiple>` e o nome, lista
     * (`roles[]`; passado sem os colchetes, eles entram sozinhos). As
     * escolhidas vêm do `old()` ou do `selected`, os dois listas (array
     * ou Collection de valores). O gatilho as mostra em chips, cada um
     * com o "×" que a tira, e o painel tem uma caixa por opção, com
     * "Limpar" e "Concluir" no rodapé. `required` é "ao menos uma".
     *
     * Com `source`, o `selected-label` é o mapa dos rótulos das
     * escolhidas: `[valor => rótulo]`, ou `valor => ['label' => …,
     * 'caption' => …, 'extra' => […]]`.
     */
    'multiple' => false,
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

    /*
     * Várias escolhas (`multiple`): uma lista de valores, e o nome do
     * HTML é sempre o de lista (`roles[]`), viesse com os colchetes ou
     * não.
     *
     * Quando o formulário volta com erro, vale o que voltou — e, se a
     * lista não voltou, é que nada foi escolhido (o navegador não envia
     * o `<select multiple>` vazio), e não o `selected` de antes. Como a
     * caixa do `x-ui.checkbox`. A sessão é a da requisição, a mesma de
     * onde o `old()` lê.
     *
     * Só ficam valores simples: `?roles[][x]=1` na URL faz o `old()`
     * trazer uma lista de listas, e comparar lista com texto derrubava a
     * tela.
     */
    $nomeDoCampo = $multiple && ! str_ends_with($name, '[]') ? $name.'[]' : $name;
    $valoresAtuais = [];

    if ($multiple) {
        $voltou = $remember && request()->hasSession() && request()->session()->hasOldInput();

        $valoresAtuais = collect($voltou ? old($chave, []) : $selected)
            ->filter(fn (mixed $valor): bool => is_scalar($valor) && (string) $valor !== '')
            ->map(fn (mixed $valor): string => (string) $valor)
            ->unique()
            ->values()
            ->all();

        $valorAtual = null;
    }

    // A opção que nasce marcada: a do valor atual, ou, no múltiplo, cada uma da lista.
    $marcada = fn (string $valor): bool => $multiple ? in_array($valor, $valoresAtuais, true) : $valor === $valorAtual;

    // No múltiplo, o erro de uma das escolhidas (`roles.1`: "inválido") também aparece no campo.
    $erro = $errors->first($chave);

    if ($erro === '' && $multiple) {
        $erro = $errors->first($chave.'.*');
    }

    $temErro = $erro !== '';

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

    if ($source !== null && $multiple) {
        /*
         * Busca no servidor com várias escolhas: o nativo nasce com as
         * escolhidas que têm rótulo no `selected-label` (o mapa
         * `valor => rótulo`, ou `valor => ['label', 'caption', 'extra']`).
         * A escolhida sem rótulo não tem como aparecer, e fica de fora,
         * como a do simples sem `selected-label`.
         */
        $rotulos = is_iterable($selectedLabel) ? collect($selectedLabel) : collect();

        $entradas = collect($valoresAtuais)
            ->filter(fn (string $valor): bool => $rotulos->has($valor))
            ->map(function (string $valor) use ($rotulos, $opcao): array {
                $rotulo = $rotulos->get($valor);

                return is_array($rotulo)
                    ? $opcao($valor, (string) ($rotulo['label'] ?? ''), 0, null, $rotulo['caption'] ?? null, $rotulo['extra'] ?? null)
                    : $opcao($valor, (string) $rotulo);
            })
            ->values()
            ->all();
    } elseif ($source !== null) {
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

    // No múltiplo, as escolhidas na ordem das opções: é a ordem dos chips (e a do `selectedOptions`, no select.js).
    $escolhidas = $todas->filter(fn (array $e): bool => in_array($e['valor'], $valoresAtuais, true))->values();

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

    /*
     * No múltiplo, a altura é a mínima: o gatilho cresce quando os chips
     * não cabem numa linha. Sem JavaScript, o `<select multiple>` aparece
     * como lista, com a altura que o navegador der.
     */
    if ($multiple) {
        $tamanhos = [
            'xs' => 'min-h-7 px-2.5 py-0.5 text-xs',
            'sm' => 'min-h-9 px-3 py-1 text-sm',
            'md' => 'min-h-10 px-3 py-1.5 text-sm',
            'lg' => 'min-h-12 px-4 py-2 text-base',
            'cell' => 'px-2 py-1 text-sm',
        ];
    }

    // O chip de cada escolhida e o "×" dele: as mesmas classes do select.js, que os redesenha a cada mudança.
    $classeDoChip = 'inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';
    $classeDoTirar = '-me-0.5 cursor-pointer rounded-full px-0.5 leading-none text-neutral-400 hover:text-neutral-700 dark:hover:text-white';

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

    Com `multiple`, o nativo é um `<select multiple>` (sem JavaScript, a
    lista do navegador), e o espelho mostra as escolhidas em chips.
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

    {{--
        No múltiplo, o placeholder não vira `<option>`: marcada, ela iria
        no formulário como uma escolha vazia, e o `required` ("ao menos
        uma") passaria com ela. Ele só aparece no gatilho.
    --}}
    <select id="{{ $id }}"
            name="{{ $nomeDoCampo }}"
            @if ($multiple) multiple @endif
            @required($required)
            data-seletor-nativo
            {{ $attributes->except('id')->class($caixa) }}>
        @if ($placeholder !== null && ! $multiple)
            <option value="">{{ $placeholder }}</option>
        @endif

        @foreach ($entradas as $entrada)
            @if ($entrada['tipo'] === 'group')
                <optgroup label="{{ $entrada['rotulo'] }}">
                    @foreach ($entrada['itens'] as $item)
                        <option value="{{ $item['valor'] }}"
                                @if ($item['caption'] !== null) data-caption="{{ $item['caption'] }}" @endif
                                @if ($item['extra'] !== null) data-extra="{{ $item['extra'] }}" @endif
                                @selected($marcada($item['valor']))>{{ $item['rotulo'] }}</option>
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
                        @selected($marcada($entrada['valor']))>{{ str_repeat("\u{00A0}\u{00A0}\u{00A0}", $entrada['nivel']) }}{{ $entrada['rotulo'] }}</option>
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
        @if ($multiple)
            {{--
                No múltiplo, os chips das escolhidas, que quebram linha
                quando não cabem (o gatilho cresce); sem nenhuma, o
                placeholder. O "×" é um `<span>`: botão dentro de botão não
                existe no HTML.
            --}}
            <span @class([
                      'flex min-w-0 flex-1 flex-wrap items-center gap-1',
                      'text-neutral-400' => $escolhidas->isEmpty(),
                  ])
                  data-seletor-texto
                  data-seletor-placeholder="{{ $placeholder }}">
                @forelse ($escolhidas as $item)
                    <span class="{{ $classeDoChip }}" data-seletor-chip="{{ $item['valor'] }}"><span class="truncate">{{ $item['caminho'] }}</span><span class="{{ $classeDoTirar }}" data-seletor-tirar="{{ $item['valor'] }}" tabindex="-1" title="Tirar {{ $item['caminho'] }}" aria-hidden="true">×</span></span>
                @empty
                    {{ $placeholder ?? "\u{00A0}" }}
                @endforelse
            </span>
        @else
            <span @class([
                      'min-w-0 flex-1 truncate',
                      'text-neutral-400' => $escolhida === null,
                  ])
                  data-seletor-texto>{{ $escolhida['caminho'] ?? $placeholder ?? "\u{00A0}" }}</span>
        @endif

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

        <div class="max-h-64 overflow-y-auto" role="listbox" @if ($multiple) aria-multiselectable="true" @endif data-seletor-lista></div>

        <p class="hidden px-2.5 py-2 text-sm text-neutral-500 dark:text-neutral-400" data-seletor-vazio>
            Nada encontrado.
        </p>

        @if ($multiple)
            {{--
                Clicar numa opção alterna e deixa o painel aberto; daqui,
                "Limpar" tira todas (desligado quando não há o que tirar) e
                "Concluir" fecha.
            --}}
            <div class="mt-1 flex items-center justify-between gap-2 border-t border-neutral-100 px-1 pt-1 dark:border-neutral-800">
                <button type="button"
                        data-seletor-limpar
                        @disabled($escolhidas->isEmpty())
                        class="cursor-pointer rounded-md px-2 py-1 text-xs text-neutral-500 focus:outline-none enabled:hover:bg-neutral-100 enabled:hover:text-neutral-700 enabled:focus:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40
                               dark:text-neutral-400 dark:enabled:hover:bg-neutral-800 dark:enabled:hover:text-neutral-200 dark:enabled:focus:bg-neutral-800">
                    Limpar
                </button>

                <button type="button"
                        data-seletor-concluir
                        class="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none
                               dark:text-primary-300 dark:hover:bg-primary-900/40 dark:focus:bg-primary-900/40">
                    Concluir
                </button>
            </div>
        @endif
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $erro }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
