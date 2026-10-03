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
    $variantes = [
        // A ação da tela: salvar, comprar, entrar. Uma por tela.
        'primary' => 'border-transparent bg-primary-600 text-primary-contrast hover:bg-primary-700 focus:ring-primary-500/30',
        // O que acompanha a ação: cancelar, voltar.
        'secondary' => 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-400/30'
            .' dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800',
        // Contorno sobre branco: se destaca do fundo do painel sem competir com a ação.
        'outline' => 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-400/30'
            .' dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800',
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
        // O que não volta: excluir.
        'danger' => 'border-transparent bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500/30',
        // Vermelho discreto, para a exclusão que não é a ação principal.
        'danger-soft' => 'border-transparent bg-danger-50 text-danger-700 hover:bg-danger-100 focus:ring-danger-500/30'
            .' dark:bg-danger-500/15 dark:text-danger-400 dark:hover:bg-danger-500/25',
        // Sem moldura: ações de linha de tabela e de rodapé de modal.
        'ghost' => 'border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-400/30'
            .' dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
        /*
         * O ghost sobre fundo colorido (o toast, uma faixa de aviso): a cor
         * do texto em volta, e o hover escurece um pouco o fundo, em vez do
         * cinza claro do ghost, que some sobre o verde ou o vermelho. Sem
         * mexer na opacidade: opacidade < 1 cria uma camada própria, e
         * tooltip vizinho fica preso nela.
         */
        'ghost-contrast' => 'border-transparent bg-transparent text-current hover:bg-black/10 focus:ring-black/15',
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
        'icon' => 'size-10 p-0',
        'icon-sm' => 'size-9 p-0',
        'icon-xs' => 'size-7 p-0',
    ];

    $classes = [
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-medium',
        'transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        $variantes[$variant] ?? $variantes['primary'],
        $tamanhos[$size] ?? $tamanhos['md'],
    ];
@endphp

@php
    // O ícone acompanha o texto: `size-4` no botão comum, `size-5` no grande.
    $tamanhoDoIcone = in_array($size, ['lg', 'xl'], true) ? 'size-5' : 'size-4';
@endphp

@if ($href)
    <a href="{{ $href }}" {{ $attributes->class($classes) }}>@if ($icon !== null)<x-ui.icon :name="$icon" :class="$tamanhoDoIcone" />@endif{{ $slot }}</a>
@else
    <button type="{{ $type }}" {{ $attributes->class($classes) }}>@if ($icon !== null)<x-ui.icon :name="$icon" :class="$tamanhoDoIcone" />@endif{{ $slot }}</button>
@endif
