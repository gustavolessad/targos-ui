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
     */
    $chaves = array_keys($tabs);
    $atual = $active ?? request()->string($name)->value();

    if (! in_array($atual, $chaves, strict: true)) {
        $atual = $chaves[0] ?? null;
    }
@endphp

<div data-abas="{{ $name }}">
    {{-- O formulário leva a aba aberta junto, para o erro voltar nela. --}}
    <input type="hidden" name="{{ $name }}" value="{{ $atual }}" data-aba-atual form="{{ $attributes->get('form') }}">

    <div class="border-b border-neutral-300 dark:border-neutral-800">
        <nav class="-mb-px flex gap-1 overflow-x-auto" role="tablist">
            @foreach ($tabs as $chave => $rotulo)
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
                    {{ $rotulo }}
                </button>
            @endforeach
        </nav>
    </div>

    @foreach ($chaves as $chave)
        <div id="painel-{{ $chave }}"
             role="tabpanel"
             data-painel="{{ $chave }}"
             @if ($chave !== $atual) hidden @endif
             class="pt-6">
            {{ ${$chave} ?? '' }}
        </div>
    @endforeach
</div>
