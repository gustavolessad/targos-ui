@props([
    'name' => 'aba',
    'tabs' => [],
    'active' => null,
    /**
     * As abas que existem mas não aparecem, pelas chaves.
     *
     * Para a aba que depende de uma escolha feita noutra: montá-la ao
     * trocar a escolha exigiria recarregar a tela no meio do cadastro.
     *
     * @var list<string>
     */
    'hidden' => [],
    /**
     * Os campos de cada aba, para contar os erros de validação: a
     * chave da aba e os nomes dos campos, ou prefixos deles.
     *
     *     :fields="['geral' => ['name', 'sku'], 'variacoes' => ['variants']]"
     *
     * O prefixo pega a lista inteira: `variants` conta `variants.0.sku`.
     *
     * @var array<string, list<string>>
     */
    'fields' => [],
    /**
     * Abas que são navegação: a chave da aba e a URL da tela dela.
     *
     * A aba vira link, e cada uma é uma tela própria: não há painéis
     * nem campo escondido, e o slot é o conteúdo da tela, desenhado
     * uma vez abaixo da barra.
     *
     * @var array<string, string>
     */
    'links' => [],
])

@php
    /*
     * As abas de uma tela.
     *
     * `tabs` é o mapa `chave => rótulo`. Cada painel é um slot com o
     * nome da chave:
     *
     *     <x-ui.tabs :tabs="['geral' => 'Geral', 'seo' => 'SEO']">
     *         <x-slot:geral>...</x-slot:geral>
     *         <x-slot:seo>...</x-slot:seo>
     *     </x-ui.tabs>
     *
     * A aba aberta vive na URL (`?aba=seo`) e num campo escondido: o
     * formulário que volta com erro reabre onde a pessoa estava, e o
     * link da aba pode ser compartilhado. A troca em si é JavaScript,
     * sem ida ao servidor.
     *
     * Com `links`, a barra é a mesma, mas cada aba leva a outra tela:
     *
     *     <x-ui.tabs active="historico" :tabs="['dados' => 'Dados', 'historico' => 'Histórico']"
     *                :links="['dados' => route('clientes.edit', $c), 'historico' => route('clientes.historico', $c)]">
     *         ...o conteúdo desta tela...
     *     </x-ui.tabs>
     */
    $chaves = array_keys($tabs);
    $navegacao = $links !== [];

    /*
     * A bolsa de erros da validação: a que o middleware da sessão
     * compartilha com as views — ou, fora de uma requisição (o
     * `Blade::render` de um teste), a da sessão.
     */
    $bolsa = $errors ?? view()->shared('errors') ?? session('errors');
    $chavesComErro = $bolsa?->any() ? $bolsa->keys() : [];

    /*
     * Os erros de cada aba: as chaves da bolsa que são um dos campos,
     * ou que começam por ele e um ponto — `variants` conta
     * `variants.0.sku`, mas não `variants_count`.
     *
     * O nome pode vir como no HTML (`endereco[cep]`): vira a notação
     * de ponto da validação antes de comparar.
     */
    $erros = [];

    foreach ($chaves as $chave) {
        $campos = collect((array) ($fields[$chave] ?? []))
            ->map(fn (string $campo) => rtrim(str_replace(['[]', '[', ']'], ['', '.', ''], $campo), '.'))
            ->filter();

        $doCampo = collect($chavesComErro)->filter(
            fn (string $erro) => $campos->contains(fn (string $campo) => $erro === $campo || str_starts_with($erro, $campo.'.')),
        );

        $erros[$chave] = $doCampo->count();
    }

    if ($navegacao) {
        /*
         * A aba ativa é a de `active`. Sem ela, a cuja URL é a desta
         * tela — a comparação é pela URL inteira, então o link relativo
         * (`/clientes/1`) também vale.
         */
        $atual = $active;

        if ($atual === null) {
            foreach ($links as $chave => $link) {
                if (in_array(url($link), [url()->full(), url()->current()], strict: true)) {
                    $atual = $chave;

                    break;
                }
            }
        }
    } else {
        // Só texto: `?aba[]=x` na URL não pode derrubar a tela.
        $daUrl = request()->query($name);
        $atual = $active ?? (is_string($daUrl) ? $daUrl : null);

        if (! in_array($atual, $chaves, strict: true)) {
            $atual = $chaves[0] ?? null;
        }

        /*
         * O formulário que voltou com erro abre na aba do problema.
         *
         * Só quando a aba aberta não tem erro nenhum — quem errou ali
         * continua ali — e só quando a tela não escolheu a aba: um
         * `active` passado é decisão dela.
         */
        if ($active === null && $bolsa?->any() && ($erros[$atual] ?? 0) === 0) {
            foreach ($chaves as $chave) {
                if ($erros[$chave] > 0) {
                    $atual = $chave;

                    break;
                }
            }
        }
    }
@endphp

<div data-abas="{{ $name }}">
    {{--
        O formulário leva a aba aberta junto, para o erro voltar nela.

        O `form` só sai quando foi passado: `form=""` não é "o
        formulário em volta", é formulário nenhum — e a aba não ia junto.

        `data-nao-salvo-ignorar`: trocar de aba não é mexer no formulário.
        Sem isso, o aviso de alterações não salvas (unsaved.js) veria o
        campo mudar e perguntaria ao sair de uma tela em que só se olhou.
    --}}
    @unless ($navegacao)
        <input type="hidden" name="{{ $name }}" value="{{ $atual }}" data-aba-atual data-nao-salvo-ignorar
               @if (filled($attributes->get('form'))) form="{{ $attributes->get('form') }}" @endif>
    @endunless

    <div class="border-b border-neutral-300 dark:border-neutral-800">
        <nav class="-mb-px flex gap-1 overflow-x-auto" @unless ($navegacao) role="tablist" @endunless>
            @foreach ($tabs as $chave => $rotulo)
                @if ($navegacao)
                    {{--
                        A aba que leva a outra tela é link, com a mesma
                        aparência do botão: a marca da aberta segue o
                        `aria-current`, como a do botão segue o
                        `aria-selected`.

                        Sem URL no mapa, a aba aparece mas não leva a lugar
                        nenhum.
                    --}}
                    @if (isset($links[$chave]))
                        <a href="{{ $links[$chave] }}"
                           @if ($chave === $atual) aria-current="page" @endif
                           @class([
                               'cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium',
                               'transition border-transparent text-neutral-500',
                               'hover:border-neutral-300 hover:text-neutral-800',
                               'dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200',
                               'aria-[current=page]:border-primary-600 aria-[current=page]:text-neutral-900',
                               'dark:aria-[current=page]:text-white',
                               'hidden' => in_array($chave, $hidden, strict: true),
                           ])>
                            {{ $rotulo }}@if ($erros[$chave] > 0)<span data-aba-erros class="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-xs font-semibold text-white">{{ $erros[$chave] }}</span>@endif
                        </a>
                    @else
                        <span aria-disabled="true"
                              @class([
                                  'whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium',
                                  'text-neutral-500 opacity-50 dark:text-neutral-400',
                                  'hidden' => in_array($chave, $hidden, strict: true),
                              ])>
                            {{ $rotulo }}
                        </span>
                    @endif
                @else
                    {{--
                        A cor segue o `aria-selected`, não uma classe posta
                        pelo PHP: o JavaScript troca o atributo ao clicar, e
                        classe decidida na renderização só mudaria com F5.

                        A aba aberta se marca pela linha embaixo, não por fundo.
                    --}}
                    {{--
                        A aba escondida existe no HTML, mas não aparece.

                        É a aba que depende de outra escolha: precisa poder
                        surgir quando ela mudar, sem recarregar a tela no
                        meio do cadastro.

                        `hidden` em vez de não emitir o botão: o painel
                        continua no lugar, e o JavaScript só tira a classe.
                    --}}
                    <button type="button"
                            role="tab"
                            data-aba="{{ $chave }}"
                            aria-selected="{{ $chave === $atual ? 'true' : 'false' }}"
                            aria-controls="painel-{{ $chave }}"
                            @class([
                                'cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium',
                                'transition border-transparent text-neutral-500',
                                'hover:border-neutral-300 hover:text-neutral-800',
                                'dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200',
                                'aria-selected:border-primary-600 aria-selected:text-neutral-900',
                                'dark:aria-selected:text-white',
                                'hidden' => in_array($chave, $hidden, strict: true),
                            ])>
                        {{ $rotulo }}@if ($erros[$chave] > 0)<span data-aba-erros class="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-xs font-semibold text-white">{{ $erros[$chave] }}</span>@endif
                    </button>
                @endif
            @endforeach
        </nav>
    </div>

    @if ($navegacao)
        <div class="pt-6">
            {{ $slot }}
        </div>
    @else
        @foreach ($chaves as $chave)
            <div id="painel-{{ $chave }}"
                 role="tabpanel"
                 data-painel="{{ $chave }}"
                 @if ($chave !== $atual) hidden @endif
                 class="pt-6">
                {{ ${$chave} ?? '' }}
            </div>
        @endforeach
    @endif
</div>
