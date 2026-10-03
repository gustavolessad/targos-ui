@props([
    /** O paginator do Laravel (`->paginate()` ou `->simplePaginate()`). */
    'paginator',
])

@php
    use Illuminate\Contracts\Pagination\LengthAwarePaginator;
    use Targos\Ui\PerPage;

    /*
     * O rodapé de paginação das tabelas (x-ui.table o desenha sozinho):
     *
     * - à esquerda, "Mostrando 1 a 30 de 293" e o seletor "Por página";
     * - à direita, anterior/próxima e os números de página, com os botões
     *   do design system (o atual em destaque; reticências no meio de
     *   listas longas; a primeira e a última sempre à vista).
     *
     * Tudo é link, não JavaScript: a página e a quantidade vão na URL, que
     * guarda o estado (dá para mandar o link, e o voltar funciona).
     */
    $comTotal = $paginator instanceof LengthAwarePaginator;
    $numero = fn (int $n): string => number_format($n, 0, ',', '.');

    $atual = $paginator->currentPage();
    $ultima = $comTotal ? $paginator->lastPage() : null;

    /*
     * As páginas que aparecem: a primeira, a última e duas de cada lado
     * da atual; no começo e no fim da lista, as cinco primeiras ou as
     * cinco últimas. `null` é a reticência entre um trecho e outro.
     */
    $paginas = [];
    if ($comTotal) {
        if ($ultima <= 7) {
            $paginas = range(1, $ultima);
        } else {
            $janela = match (true) {
                $atual <= 4 => range(1, 5),
                $atual >= $ultima - 3 => range($ultima - 4, $ultima),
                default => range($atual - 1, $atual + 1),
            };
            $visiveis = array_unique([1, ...$janela, $ultima]);
            sort($visiveis);

            foreach ($visiveis as $i => $pagina) {
                if ($i > 0 && $pagina - $visiveis[$i - 1] > 1) {
                    $paginas[] = null;
                }
                $paginas[] = $pagina;
            }
        }
    }

    /*
     * O seletor "Por página" é um formulário GET: leva junto o que já está
     * na URL (filtros, busca, ordem) e volta para a primeira página.
     * `http_build_query` achata os filtros em lista (`situacao[]=...`) nos
     * nomes que o formulário precisa.
     */
    $parametro = PerPage::parameter();
    $porPagina = $paginator->perPage();
    $manter = [];
    foreach (explode('&', http_build_query(request()->except([$parametro, 'page']))) as $par) {
        if ($par !== '') {
            [$chave, $valor] = array_pad(explode('=', $par, 2), 2, '');
            $manter[] = [urldecode($chave), urldecode($valor)];
        }
    }

    $opcoes = collect(PerPage::options($porPagina))->mapWithKeys(fn (int $n) => [$n => (string) $n])->all();
@endphp

<nav aria-label="Paginação" {{ $attributes->class('flex flex-wrap items-center justify-between gap-x-6 gap-y-3') }}>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
        @if ($comTotal)
            <p data-paginacao-resumo>
                Mostrando <span class="font-medium text-neutral-900 dark:text-white">{{ $numero((int) $paginator->firstItem()) }}</span>
                a <span class="font-medium text-neutral-900 dark:text-white">{{ $numero((int) $paginator->lastItem()) }}</span>
                de <span class="font-medium text-neutral-900 dark:text-white">{{ $numero($paginator->total()) }}</span>
            </p>
        @endif

        <form method="GET" action="{{ url()->current() }}" class="flex items-center gap-2"
              onchange="if (event.target.name === @js($parametro)) this.requestSubmit()">
            @foreach ($manter as [$chave, $valor])
                <input type="hidden" name="{{ $chave }}" value="{{ $valor }}">
            @endforeach

            <label for="paginacao-por-pagina" class="whitespace-nowrap">Por página</label>
            <x-ui.select :name="$parametro" id="paginacao-por-pagina" size="xs" :searchable="false"
                         :options="$opcoes" :selected="(string) $porPagina" class="w-20" />
        </form>
    </div>

    @if ($paginator->hasPages())
        <div class="flex items-center gap-1">
            @if ($paginator->onFirstPage())
                <x-ui.button variant="outline" size="icon-xs" disabled aria-label="Página anterior">
                    <x-ui.icon name="chevron-left" class="size-4" />
                </x-ui.button>
            @else
                <x-ui.button variant="outline" size="icon-xs" :href="$paginator->previousPageUrl()" rel="prev" aria-label="Página anterior">
                    <x-ui.icon name="chevron-left" class="size-4" />
                </x-ui.button>
            @endif

            @foreach ($paginas as $pagina)
                @if ($pagina === null)
                    <span class="px-1 text-sm text-neutral-400" aria-hidden="true">…</span>
                @elseif ($pagina === $atual)
                    <x-ui.button variant="primary" size="xs" class="min-w-7 px-2" aria-current="page">
                        {{ $pagina }}
                    </x-ui.button>
                @else
                    <x-ui.button variant="ghost" size="xs" class="min-w-7 px-2" :href="$paginator->url($pagina)"
                                 :aria-label="'Página '.$pagina">
                        {{ $pagina }}
                    </x-ui.button>
                @endif
            @endforeach

            @if ($paginator->hasMorePages())
                <x-ui.button variant="outline" size="icon-xs" :href="$paginator->nextPageUrl()" rel="next" aria-label="Próxima página">
                    <x-ui.icon name="chevron-right" class="size-4" />
                </x-ui.button>
            @else
                <x-ui.button variant="outline" size="icon-xs" disabled aria-label="Próxima página">
                    <x-ui.icon name="chevron-right" class="size-4" />
                </x-ui.button>
            @endif
        </div>
    @endif
</nav>
