@props([
    'variant' => 'primary',
    'size' => 'md',
    'href' => null,
    'type' => 'button',
    /** Um ícone do Lucide antes do texto (`icon="plus"`). */
    'icon' => null,
])

@php
    /*
     * As variantes ficam aqui, não na chamada: `<x-ui.button>` num lugar
     * é igual em todos os outros, e mudar o verde do sistema é mudar
     * esta tabela.
     */
    /*
     * O estado "atual" (`atual:`, do theme.css): o botão com
     * `aria-current` — `step`, `page`, `true` —, que é a etapa, a página
     * ou a aba em que se está. `aria-current="false"` não conta: o script
     * troca o valor entre os botões, sem tirar o atributo.
     *
     * Em cada variante, o "selecionado" dela: as de contorno e o ghost
     * ganham a cor de ação (borda, texto e o fundo `primary-50`); as
     * discretas, um degrau mais forte, fixo no hover. As cheias não
     * mudam: já são o destaque — a página atual da paginação é um
     * `primary` com `aria-current="page"`, e assim continua.
     */
    $variantes = [
        // A ação da tela: salvar, comprar, entrar. Uma por tela.
        'primary' => 'border-transparent bg-primary-600 text-primary-contrast hover:bg-primary-700 focus:ring-primary-500/30',
        // O que acompanha a ação: cancelar, voltar.
        'secondary' => 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-400/30'
            .' dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800'
            .' atual:border-primary-500 atual:bg-primary-50 atual:text-primary-700 atual:hover:bg-primary-100'
            .' dark:atual:border-primary-500 dark:atual:bg-primary-500/15 dark:atual:text-primary-300 dark:atual:hover:bg-primary-500/25',
        // Contorno sobre branco: se destaca do fundo do painel sem competir com a ação.
        'outline' => 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-400/30'
            .' dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800'
            .' atual:border-primary-500 atual:bg-primary-50 atual:text-primary-700 atual:hover:bg-primary-100'
            .' dark:atual:border-primary-500 dark:atual:bg-primary-500/15 dark:atual:text-primary-300 dark:atual:hover:bg-primary-500/25',
        // O que deu certo: o verde do token `success`.
        'success' => 'border-transparent bg-success-600 text-white hover:bg-success-700 focus:ring-success-500/30',
        /*
         * Branco cheio, para a ação que assenta sobre fundo escuro,
         * onde o `secondary` some.
         *
         * Igual nos dois temas: é o contraste com o fundo que ele
         * procura, e não o tema da tela.
         */
        'inverse' => 'border-transparent bg-white text-neutral-950 hover:bg-neutral-200 focus:ring-white/30',
        /*
         * O que pede atenção antes de seguir: estornar, reabrir, forçar.
         * O âmbar do token `warning`, com texto escuro, como no toast de
         * aviso e na dica `warning`: o amarelo não aguenta texto branco.
         * No escuro, um degrau mais claro, para não apagar sobre o fundo.
         */
        'warning' => 'border-transparent bg-warning-500 text-neutral-950 hover:bg-warning-600 focus:ring-warning-500/30'
            .' dark:bg-warning-400 dark:hover:bg-warning-300',
        // Âmbar discreto, para a atenção que não é a ação principal (o par do `danger-soft`).
        'warning-soft' => 'border-transparent bg-warning-50 text-warning-800 hover:bg-warning-100 focus:ring-warning-500/30'
            .' dark:bg-warning-500/15 dark:text-warning-400 dark:hover:bg-warning-500/25'
            .' atual:bg-warning-200 dark:atual:bg-warning-500/30',
        // O que não volta: excluir.
        'danger' => 'border-transparent bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500/30',
        // Vermelho discreto, para a exclusão que não é a ação principal.
        'danger-soft' => 'border-transparent bg-danger-50 text-danger-700 hover:bg-danger-100 focus:ring-danger-500/30'
            .' dark:bg-danger-500/15 dark:text-danger-400 dark:hover:bg-danger-500/25'
            .' atual:bg-danger-200 dark:atual:bg-danger-500/30',
        // Sem moldura: ações de linha de tabela e de rodapé de modal.
        'ghost' => 'border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-400/30'
            .' dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
            .' atual:bg-primary-50 atual:text-primary-700 atual:hover:bg-primary-100 atual:hover:text-primary-700'
            .' dark:atual:bg-primary-500/15 dark:atual:text-primary-300 dark:atual:hover:bg-primary-500/25 dark:atual:hover:text-primary-300',
        /*
         * O ghost sobre fundo colorido (o toast, uma faixa de aviso): a cor
         * do texto em volta, e o hover escurece um pouco o fundo, em vez do
         * cinza claro do ghost, que some sobre o verde ou o vermelho. Sem
         * mexer na opacidade: opacidade < 1 cria uma camada própria, e
         * tooltip vizinho fica preso nela.
         */
        'ghost-contrast' => 'border-transparent bg-transparent text-current hover:bg-black/10 focus:ring-black/15'
            .' atual:bg-black/15',
    ];

    // Altura fixa, a mesma do campo de cada degrau; o botão só de ícone é quadrado nessa altura.
    $tamanhos = [
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-4 text-sm',
        'lg' => 'h-12 px-5 text-base',
        // A chamada de uma landing: o botão que a página inteira prepara.
        'xl' => 'h-14 px-8 text-base',
        // Quadrado, para o botão que só tem ícone.
        'icon-xl' => 'size-14 p-0',
        'icon-lg' => 'size-12 p-0',
        'icon' => 'size-10 p-0',
        'icon-sm' => 'size-9 p-0',
        'icon-xs' => 'size-7 p-0',
        /*
         * Altura livre, com o conteúdo empilhado: o ícone em cima, o texto,
         * e o que vier depois numa linha própria (a tecla de atalho, um
         * valor). Para a grade de escolhas grandes — as formas de
         * pagamento do caixa. A borda, o raio e a variante são os de
         * sempre; a altura mínima é a de dois `lg` encostados.
         */
        'stacked' => 'min-h-20 flex-col gap-1 px-4 py-3 text-center text-sm leading-tight',
    ];

    $classes = [
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-medium',
        'transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        $variantes[$variant] ?? $variantes['primary'],
        $tamanhos[$size] ?? $tamanhos['md'],
    ];
@endphp

@php
    /*
     * A variante no próprio botão (`data-variante="secondary"`): o projeto
     * que tem tema próprio — as cores que o lojista escolhe na vitrine —
     * alcança o botão por ela, sem depender da lista de classes daqui.
     */
    $varianteDoBotao = array_key_exists($variant, $variantes) ? $variant : 'primary';

    // O ícone acompanha o botão: `size-4` no comum, `size-5` no grande, `size-6` no quadrado maior e no empilhado.
    $tamanhoDoIcone = match (true) {
        in_array($size, ['icon-xl', 'stacked'], true) => 'size-6',
        in_array($size, ['lg', 'xl', 'icon-lg'], true) => 'size-5',
        default => 'size-4',
    };
@endphp

@if ($href)
    <a href="{{ $href }}" data-variante="{{ $varianteDoBotao }}" {{ $attributes->class($classes) }}>@if ($icon !== null)<x-ui.icon :name="$icon" :class="$tamanhoDoIcone" />@endif{{ $slot }}</a>
@else
    <button type="{{ $type }}" data-variante="{{ $varianteDoBotao }}" {{ $attributes->class($classes) }}>@if ($icon !== null)<x-ui.icon :name="$icon" :class="$tamanhoDoIcone" />@endif{{ $slot }}</button>
@endif
