@props([
    /*
     * O nome base dos campos: `addresses` faz os campos da linha se
     * chamarem `addresses[0][zip]`. Pode ter colchete também
     * (`order[items]`).
     */
    'name',
    /*
     * As linhas gravadas: uma lista de arrays ou de models (uma
     * Collection serve). As chaves viram os índices das linhas.
     */
    'items' => [],
    /*
     * A view do projeto que desenha UMA linha. Ela recebe `$name` (o
     * prefixo da linha: `addresses[0]`), `$index` (0, 1… ou `__i__` no
     * modelo), `$item` (a linha, ou `null` no modelo e nas linhas em
     * branco) e `$key` (`addresses.0`, para `old()` e erros).
     */
    'row',
    /*
     * O que mais a linha precisa da tela — as opções de um select, por
     * exemplo: `:with="['ufs' => $ufs]"`. As variáveis da tela não
     * chegam sozinhas: o componente é uma view isolada.
     */
    'with' => [],
    /*
     * O texto do botão de adicionar. `:add="false"` o esconde — `false`, e
     * não `null`: num componente anônimo, o `null` passado cai no padrão.
     */
    'add' => 'Adicionar',
    /*
     * Quantas linhas no mínimo. Faltando, as que faltam já vêm em
     * branco do servidor; no mínimo, o "remover" some.
     */
    'min' => 0,
    /** O teto: atingido, o "adicionar" fica desligado. */
    'max' => null,
    /** Botões de subir e descer em cada linha. */
    'sortable' => false,
    /*
     * O botão de remover em cada linha (padrão). `:removable="false"`
     * não o desenha, nem no modelo: a lista cujas linhas vêm do servidor
     * e só se preenchem (a contagem de cada item do inventário).
     */
    'removable' => true,
    /** O texto de quando não há linha nenhuma. */
    'empty' => null,
    /*
     * Lembra as linhas enviadas quando o formulário volta com erro.
     * Desligue no repetidor do formulário que não foi enviado — o modal de
     * criar, quando foi o de editar que voltou —, senão ele mostra as
     * linhas do outro.
     */
    'remember' => true,
    /** O `id` do envelope. Sem ele, sai do nome (`order-items`). */
    'id' => null,
])

@php
    /*
     * Linhas que a pessoa adiciona, remove e reordena: os endereços de
     * uma pessoa, os itens de uma venda, as parcelas.
     *
     * O desenho de cada linha é do projeto (`row`); aqui ficam o que se
     * repete em todas — o laço, os botões, o modelo das linhas novas — e
     * o JavaScript (resources/js/repeater.js) adiciona, remove, move e
     * religa os campos do pacote nas linhas que nascem na tela.
     */
    // `order[items]` no HTML é `order.items` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    /*
     * `old()` vence as linhas gravadas: depois de um erro de validação,
     * voltam as linhas que a pessoa tinha na tela — inclusive as que ela
     * adicionou e sem as que ela removeu —, na ordem em que estavam.
     *
     * Os índices são as chaves que vieram, sem renumerar: o erro
     * `addresses.2.zip` é da linha que se chamava `addresses[2]`, e
     * renumerada ela seria outra.
     */
    $linhas = $remember ? old($chave, $items) : $items;

    // Uma Collection (de models ou não) vira array sem perder as chaves; `?addresses=x` na URL vira nada.
    $linhas = match (true) {
        is_array($linhas) => $linhas,
        $linhas instanceof \Traversable => iterator_to_array($linhas),
        default => [],
    };

    $minimo = max(0, (int) $min);
    $maximo = $max === null || $max === '' || $max === false ? null : (int) $max;

    // O próximo índice livre: o maior que já existe, mais um. Chave que não é número (`abc`) não conta.
    $numericas = array_filter(array_keys($linhas), 'is_int');
    $proximo = $numericas === [] ? 0 : max(0, max($numericas) + 1);

    // Faltando linhas para o mínimo, as que faltam já vêm em branco: a pessoa não precisa clicar para começar.
    while (count($linhas) < $minimo) {
        $linhas[$proximo++] = null;
    }

    $total = count($linhas);
    $removivel = $removable && $total > $minimo;
    $comBotao = $add !== false && $add !== null && $add !== '';
    $cheio = $maximo !== null && $total >= $maximo;

    /*
     * A coluna dos botões à direita de cada linha. Sem remover nem
     * mover, ela não existe — nem o espaço dela.
     *
     * O cabeçalho das colunas (slot `header`) reserva a mesma coluna,
     * com os mesmos botões invisíveis: a medida é a dos botões de
     * verdade, e muda junto com eles.
     */
    $comColunaDeBotoes = $sortable || $removable;
    $temConteudo = fn ($slot) => $slot instanceof \Illuminate\View\ComponentSlot ? $slot->hasActualContent() : filled($slot);
    $comCabecalho = isset($header) && $temConteudo($header);

    /*
     * As linhas e, por último, o modelo das novas — no mesmo laço, para
     * não haver dois desenhos da linha para manter iguais.
     *
     * O modelo é a linha com `__i__` no lugar do índice
     * (`addresses[__i__][zip]`, `id="addresses-__i__-zip"`), sem item e
     * sem `old()`. O JavaScript troca o `__i__` pelo próximo índice a
     * cada linha nova.
     */
    $desenhos = [];
    $posicao = 0;

    foreach ($linhas as $indice => $item) {
        $desenhos[] = ['indice' => $indice, 'item' => $item, 'modelo' => false, 'primeira' => $posicao === 0, 'ultima' => $posicao === $total - 1];
        $posicao++;
    }

    $desenhos[] = ['indice' => '__i__', 'item' => null, 'modelo' => true, 'primeira' => false, 'ultima' => false];
@endphp

<div id="{{ $id }}"
     data-repetidor="{{ $name }}"
     data-repetidor-min="{{ $minimo }}"
     @if ($maximo !== null) data-repetidor-max="{{ $maximo }}" @endif
     data-repetidor-proximo="{{ $proximo }}"
     {{ $attributes }}>
    {{--
        `gap`, e não `space-y`: o modelo mora no fim da lista, e o
        `<template>`, que não é desenhado, não abre espaço no gap — no
        `space-y` a última linha ganharia uma margem embaixo.
    --}}
    <div class="flex flex-col gap-3" data-repetidor-lista>
        @if ($comCabecalho)
            {{--
                O cabeçalho das colunas, na mesma caixa das linhas e com
                a mesma coluna de botões à direita: o projeto só repete a
                grade das colunas no slot (`grid gap-3 sm:grid-cols-3`), e
                cada título cai sobre o campo dele. Sem linhas, some junto
                com o texto de vazio (o JavaScript o refaz a cada mudança).
            --}}
            <div class="flex items-start gap-2" data-repetidor-cabecalho @if ($total === 0) hidden @endif>
                <div class="min-w-0 flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ $header }}</div>

                @if ($comColunaDeBotoes)
                    <div class="invisible flex shrink-0 items-center gap-0.5" aria-hidden="true">
                        @if ($sortable)
                            <x-ui.button variant="ghost" size="icon-sm" tabindex="-1" disabled><x-ui.icon name="chevron-up" class="size-4" /></x-ui.button>
                            <x-ui.button variant="ghost" size="icon-sm" tabindex="-1" disabled><x-ui.icon name="chevron-down" class="size-4" /></x-ui.button>
                        @endif

                        @if ($removable)
                            <x-ui.button variant="ghost" size="icon-sm" tabindex="-1" disabled><x-ui.icon name="trash-2" class="size-4" /></x-ui.button>
                        @endif
                    </div>
                @endif
            </div>
        @endif

        @foreach ($desenhos as $desenho)
            @php
                $nomeDaLinha = $name.'['.$desenho['indice'].']';

                /*
                 * A linha recebe só o que é dela (e o que a tela mandou
                 * em `with`). Um `@include` passaria junto as variáveis
                 * daqui — `$items`, `$min`, `$attributes` —, e um
                 * partial do projeto que tivesse um `$items` seu leria o
                 * do componente.
                 */
                $conteudo = view($row, array_merge($with, [
                    'name' => $nomeDaLinha,
                    'index' => $desenho['indice'],
                    'item' => $desenho['item'],
                    'key' => \Targos\Ui\FieldName::key($nomeDaLinha),
                ]))->render();
            @endphp

            {{--
                O modelo fica dentro da lista, no fim: a linha nova entra
                logo antes dele, que é o fim das linhas. Dentro de um
                `<template>`, nada dele é desenhado nem enviado, e os
                módulos do pacote não o ligam (o conteúdo de um
                `<template>` não aparece no `querySelectorAll`).
            --}}
            @if ($desenho['modelo'])
                <template data-repetidor-modelo>
            @endif

            <div class="flex items-start gap-2" data-repetidor-item data-repetidor-indice="{{ $desenho['indice'] }}">
                <div class="min-w-0 flex-1">{!! $conteudo !!}</div>

                {{--
                    O estado dos botões já vem certo do servidor (o
                    JavaScript o refaz a cada mudança): o "remover" some
                    no mínimo, o "subir" da primeira e o "descer" da
                    última ficam desligados.
                --}}
                @if ($comColunaDeBotoes)
                <div class="flex shrink-0 items-center gap-0.5">
                    @if ($sortable)
                        <x-ui.button variant="ghost" size="icon-sm" aria-label="Subir"
                                     data-repetidor-subir :disabled="$desenho['primeira']">
                            <x-ui.icon name="chevron-up" class="size-4" />
                        </x-ui.button>

                        <x-ui.button variant="ghost" size="icon-sm" aria-label="Descer"
                                     data-repetidor-descer :disabled="$desenho['ultima']">
                            <x-ui.icon name="chevron-down" class="size-4" />
                        </x-ui.button>
                    @endif

                    {{-- No mínimo, escondido e não desligado: um botão apagado em cada linha seria ruído para o que ali não se faz. --}}
                    @if ($removable)
                        <x-ui.button variant="ghost" size="icon-sm" aria-label="Remover"
                                     data-repetidor-remover :hidden="! $desenho['modelo'] && ! $removivel">
                            <x-ui.icon name="trash-2" class="size-4" />
                        </x-ui.button>
                    @endif
                </div>
                @endif
            </div>

            @if ($desenho['modelo'])
                </template>
            @endif
        @endforeach
    </div>

    @if ($empty !== null)
        {{-- A moldura tracejada marca onde as linhas vão aparecer. --}}
        <p data-repetidor-vazio @if ($total > 0) hidden @endif
           class="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {{ $empty }}
        </p>
    @endif

    @if ($comBotao)
        <div class="mt-3">
            <x-ui.button variant="secondary" size="sm" data-repetidor-adicionar :disabled="$cheio">
                <x-ui.icon name="plus" class="size-4" />
                {{ $add }}
            </x-ui.button>
        </div>
    @endif

    {{-- O erro da lista inteira ("adicione ao menos um endereço"): o de cada campo fica embaixo do campo. --}}
    @if ($errors->has($chave))
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @endif
</div>
