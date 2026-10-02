@props([
    'id',
    'title' => null,
    /*
     * A largura da caixa, como no componente de offcanvas.
     *
     * Prop, e não classe passada de fora: `max-w-3xl` vindo do `class`
     * teria a mesma especificidade do `max-w-md` daqui, e quem venceria
     * seria a ordem no CSS gerado — o modal continuaria estreito.
     *
     * Sem escrever a tag do offcanvas aqui: o Blade compila tags de
     * componente mesmo dentro de comentário, e ela viraria um
     * `$component` indefinido em tempo de execução.
     */
    'width' => 'max-w-md',
    // Já aberto ao carregar — o formulário que voltou do servidor com erro.
    'open' => false,
])

{{--
    Abre com `data-abre-modal="{{ $id }}"` em qualquer botão da página, e
    fecha pelo X, pelo botão do rodapé, clicando no fundo ou com Esc — o
    que está em resources/js/app.js.

    A animação é de CSS: o JavaScript só põe e tira `data-aberto`, e a
    transição corre sozinha. Entra com o fundo escurecendo e a caixa
    subindo um pouco; sai pelo caminho inverso.
--}}
{{--
    `z-60`, acima de qualquer elemento fixo.

    A escala do painel: 20–30 para menus, 40 para headers e sidebar, 50
    para o tooltip, 60 para modal e gaveta, 70 para o aviso — que
    confirma o que se acabou de fazer na camada aberta, e por isso fica
    acima dela.

    z-index sozinho não basta: um elemento com `filter` ou
    `backdrop-filter` cria contexto de empilhamento próprio e flutua
    acima do fundo escuro por mais alto que este suba. Por isso o header
    do layout minimal usa fundo sólido.
--}}
<div id="{{ $id }}" data-modal @if ($open) data-abrir-ao-carregar @endif
     class="fixed inset-0 z-60 hidden [&[data-aberto]]:block">
    <div class="fixed inset-0 bg-neutral-900/50 opacity-0 backdrop-blur-[10px] transition-opacity duration-200
                [[data-aberto]_&]:opacity-100"></div>

    {{--
        É esta caixa que recebe o clique de fora, não a escura atrás
        dela: como as duas cobrem a tela, quem está por cima intercepta
        tudo — e a de baixo nunca era clicada.

        A marca vai aqui, e o JavaScript só fecha quando o alvo é ela
        mesma: clicar dentro da caixa branca atinge um filho, e o
        formulário não pode sumir no meio da digitação.
    --}}
    {{--
        O fundo rola e a caixa se centra por margem (`m-auto`): com
        `items-center`, uma caixa mais alta que a tela (o formulário no
        celular) ficava com o topo e o botão de salvar fora, sem como rolar.
    --}}
    <div data-modal-fundo class="fixed inset-0 flex overflow-y-auto p-4">
        <div {{ $attributes->class([
                 'relative m-auto w-full rounded-2xl bg-white p-6 shadow-xl',
                 $width,
                 'dark:bg-painel-dark dark:ring-1 dark:ring-neutral-800',
                 'translate-y-3 scale-95 opacity-0 transition duration-200 ease-out',
                 '[[data-aberto]_&]:translate-y-0 [[data-aberto]_&]:scale-100 [[data-aberto]_&]:opacity-100',
             ]) }}
             role="dialog" aria-modal="true"
             @if ($title) aria-label="{{ $title }}" @endif>
            @if ($title)
                <h2 class="mb-5 text-lg font-semibold text-neutral-900 dark:text-white">{{ $title }}</h2>
            @endif

            <button type="button" data-fecha-modal aria-label="Fechar"
                    class="absolute end-4 top-4 cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <x-ui.icon name="x" class="size-5" />
            </button>

            <div class="text-sm text-neutral-600 dark:text-neutral-400">{{ $slot }}</div>

            @isset($footer)
                <div class="mt-6 flex justify-end gap-2">{{ $footer }}</div>
            @endisset
        </div>
    </div>
</div>
