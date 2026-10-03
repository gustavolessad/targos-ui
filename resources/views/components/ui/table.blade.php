@props([
    'headers' => [],
    'rows' => null,
    'sort' => null,
    'empty' => 'Nenhum registro encontrado.',
])

@php
    /*
     * A tabela das listagens do painel.
     *
     * Os cabeçalhos são uma lista de mapas: `['index' => 'name',
     * 'label' => 'Marca']`. Quem não puder ser ordenado declara
     * `'sortable' => false`, e o que fica à direita — a coluna de ações —
     * declara `'align' => 'end'`.
     *
     * Cada célula vem de um slot com o nome da coluna:
     *
     *     <x-ui.table :headers="..." :rows="$marcas">
     *         @foreach ($marcas as $marca)
     *             <x-ui.table.row>
     *                 <x-ui.table.cell>{{ $marca->name }}</x-ui.table.cell>
     *             </x-ui.table.row>
     *         @endforeach
     *     </x-ui.table>
     *
     * A ordenação é link, não JavaScript: a URL carrega o estado, então
     * a lista ordenada pode ser compartilhada e o botão de voltar
     * funciona.
     */
    $colunaAtual = $sort['column'] ?? null;
    $direcaoAtual = $sort['direction'] ?? 'asc';

    /** O link que ordena por uma coluna, invertendo se já for a atual. */
    $linkDeOrdem = function (string $coluna) use ($colunaAtual, $direcaoAtual): string {
        $inverte = $colunaAtual === $coluna && $direcaoAtual === 'asc';

        return request()->fullUrlWithQuery([
            'ordem' => $coluna,
            'direcao' => $inverte ? 'desc' : 'asc',
            // Ordenar volta para a primeira página: a linha procurada mudou de lugar.
            'page' => null,
        ]);
    };

    $temLinhas = $rows === null || count($rows) > 0;

    /*
     * A paginação fica fora do cartão, logo abaixo dele (x-ui.pagination):
     * o cartão termina sempre na última linha. Aparece com mais de uma
     * página — ou, sabendo o total, sempre que há linhas, pelo seletor
     * "Por página" e pelo "Mostrando 1 a 15 de 15".
     */
    $temPaginacao = $rows instanceof Illuminate\Contracts\Pagination\Paginator
        && ($rows->hasPages() || ($rows instanceof Illuminate\Contracts\Pagination\LengthAwarePaginator && $rows->total() > 0));
@endphp

{{--
    Sem `overflow-hidden`: ele arredondaria os cantos recortando o que
    passa da borda — e o menu de ações da última linha nasce justamente
    fora dela. Quem arredonda agora é o `rounded-xl` de cada parte.
--}}
<div {{ $attributes->class([
    'rounded-xl bg-white ring-1 ring-neutral-200',
    'dark:bg-neutral-900 dark:ring-neutral-800',
    /*
     * O canto de cada ponta, já que não há mais recorte para arredondar.
     *
     * Embaixo o alvo é a última linha **visível**: nas telas com
     * expansão a última `<tr>` é a escondida, e mirar `:last-child`
     * deixava o canto reto. `:not([hidden]):last-of-type` não serve —
     * o seletor conta os irmãos, não os visíveis —, então quem marca a
     * linha certa é o Blade, com `data-ultima`.
     */
    '[&_thead_th:first-child]:rounded-ss-xl [&_thead_th:last-child]:rounded-se-xl',
    '[&_tr[data-ultima]_td:first-child]:rounded-es-xl',
    '[&_tr[data-ultima]_td:last-child]:rounded-ee-xl',
]) }}>
    {{--
        Sem embrulho de rolagem: `overflow-x` liga o `overflow-y` junto,
        e o menu de ações da última linha — que nasce abaixo dela — ia
        parar dentro de uma barra de rolagem.

        As colunas de cá são poucas e curtas; a tabela larga é a
        exceção, e quem tiver uma pede `side="top"` no menu da linha.
    --}}
    <table class="w-full text-sm">
        <thead class="border-b border-neutral-300 text-left dark:border-neutral-800">
            <tr>
                @foreach ($headers as $header)
                    @php
                        $indice = $header['index'] ?? '';
                        $ordenavel = ($header['sortable'] ?? true) && $indice !== '';
                        $aoFim = ($header['align'] ?? '') === 'end';
                        $ativa = $colunaAtual === $indice;
                    @endphp

                    <th scope="col"
                        @class([
                            'px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400',
                            'text-end' => $aoFim,
                            'text-center' => ($header['align'] ?? '') === 'center',
                            // Para a coluna que some em tela estreita (`hidden md:table-cell`); a célula leva a mesma classe.
                            $header['class'] ?? '',
                        ])>
                        @if ($ordenavel)
                            {{--
                                Todos os títulos na mesma cor: quem
                                diz qual coluna ordena é a seta, e
                                escurecer a ativa fazia a fileira
                                parecer desalinhada.
                            --}}
                            <a href="{{ $linkDeOrdem($indice) }}"
                               class="inline-flex items-center gap-1 transition
                                      hover:text-neutral-900 dark:hover:text-white">
                                {{ $header['label'] ?? '' }}

                                {{-- A seta só na coluna ativa: nas outras seria ruído. --}}
                                @if ($ativa)
                                    <x-ui.icon :name="$direcaoAtual === 'asc' ? 'chevron-up' : 'chevron-down'"
                                               class="size-3.5" />
                                @endif
                            </a>
                        @else
                            {{ $header['label'] ?? '' }}
                        @endif

                        {{-- `'info' => '…'` no cabeçalho: a explicação da coluna, no mesmo ícone dos rótulos de campo. --}}
                        @if (! empty($header['info']))
                            <x-ui.label-info :text="$header['info']" label="Sobre esta coluna" class="ms-1 inline-flex align-middle" />
                        @endif
                    </th>
                @endforeach
            </tr>
        </thead>

        {{--
            Sem `divide-y`: ele desenha a borda no topo de cada irmã
            exceto a primeira, e conta as escondidas junto — a linha de
            expansão fechada sumia deixando a borda dela para trás. Quem
            separa agora é a própria linha, que some junto com a borda.
        --}}
        <tbody>
            @if ($temLinhas)
                {{ $slot }}
            @else
                {{-- `data-ultima` também aqui: sem linha, o canto de baixo é o desta. --}}
                <tr data-ultima>
                    <td colspan="{{ max(count($headers), 1) }}"
                        class="bg-white px-4 py-12 text-center text-neutral-500
                               dark:bg-neutral-900 dark:text-neutral-400">
                        {{ $empty }}
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

</div>

{{-- Fora do cartão, embaixo: o resumo, o "Por página" e as páginas. --}}
@if ($temPaginacao)
    <x-ui.pagination :paginator="$rows->withQueryString()" class="mt-4" />
@endif
