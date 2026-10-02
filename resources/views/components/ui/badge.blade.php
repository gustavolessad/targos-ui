@props([
    'color' => 'neutral',
    // md (padrão, nas tabelas) | lg (destaque, no card principal das telas de detalhe)
    'size' => 'md',
    /*
     * Um ícone do Lucide antes do texto. Sem texto, o selo é só o ícone e
     * fica redondo (o mesmo respiro nos quatro lados): para o estado que
     * aparece ao lado de outra informação, com o nome numa dica. Nesse
     * caso, dê o nome no `aria-label`.
     */
    'icon' => null,
])

@php
    /*
     * Uma cor por significado — e nenhuma é azul.
     *
     * Azul é a cor de ação do painel (o `primary`): um estado
     * pintado de azul parece clicável ou selecionado. Por isso o
     * "em andamento" é `info`, um azul-claro bem longe do de ação.
     *
     * Os nomes são de significado, e as cores vêm dos tokens de
     * `resources/css/theme.css` (`success`, `warning`, `info`, `danger`, `accent`):
     *
     * - neutral: fora de circulação, sem alarme (rascunho, inativo, arquivado);
     * - success: no ar, deu certo (publicado, ativo, negócio fechado);
     * - warning: precisa de você (contato novo);
     * - info: em andamento (em atendimento);
     * - accent: identidade, não estado (o tipo "Parcela" ao lado de "Avulsa");
     *   `violet` é o nome antigo, e continua valendo.
     * - danger: problema.
     *
     * O contorno de dentro dá corpo ao selo sobre o fundo quase branco
     * do painel, onde os tons claros sozinhos ficavam lavados.
     *
     * `success` e `danger` são cheios, com texto branco: pago/quitado/emitida
     * e vencido/erro são os estados que mais importam de relance.
     */
    $cores = [
        'neutral' => 'bg-neutral-100 text-neutral-700 ring-neutral-500/20 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-white/10',
        'success' => 'bg-success-500 text-white ring-success-600/20 dark:ring-success-400/30',
        'warning' => 'bg-warning-50 text-warning-800 ring-warning-600/25 dark:bg-warning-500/15 dark:text-warning-400 dark:ring-warning-400/20',
        'info' => 'bg-info-50 text-info-800 ring-info-600/20 dark:bg-info-500/15 dark:text-info-300 dark:ring-info-400/20',
        'accent' => 'bg-accent-50 text-accent-800 ring-accent-600/20 dark:bg-accent-500/15 dark:text-accent-300 dark:ring-accent-400/20',
        'danger' => 'bg-danger-600 text-white ring-danger-700/20 dark:bg-danger-500 dark:ring-danger-400/30',
        /*
         * Na cor de ação. Para rótulo de identidade (o tipo da nota),
         * não para estado.
         */
        'primary' => 'bg-primary-50 text-primary-800 ring-primary-600/20 dark:bg-primary-500/15 dark:text-primary-300 dark:ring-primary-400/20',
    ];

    // O nome antigo do accent: quem já usava `color="violet"` não muda nada.
    $cores['violet'] = $cores['accent'];
@endphp

@php
    $soIcone = $icon !== null && $slot->isEmpty();

    $espaco = match (true) {
        $soIcone => $size === 'lg' ? 'p-1.5' : 'p-1',
        $size === 'lg' => 'px-3 py-1 text-sm',
        default => 'px-2 py-0.5 text-xs',
    };
@endphp

<span {{ $attributes->class([
    'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
    'gap-1' => $icon !== null && ! $soIcone,
    $espaco,
    $cores[$color] ?? $cores['neutral'],
]) }}>@if ($icon !== null)<x-ui.icon :name="$icon" :class="$size === 'lg' ? 'size-4' : 'size-3.5'" />@endif{{ $slot }}</span>
