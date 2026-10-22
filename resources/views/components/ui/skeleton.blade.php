@props([
    /**
     * Linhas de texto: com um número, o esqueleto vira esse tanto de
     * barras finas, a última mais curta — o parágrafo que vai chegar.
     * Sem ele, um bloco só.
     */
    'lines' => null,
])

{{--
    O lugar do que ainda está chegando: um bloco cinza pulsando, no
    tamanho do conteúdo de verdade, para a tela não pular quando ele
    entrar (o trecho do `data-carregar`, por exemplo).

    O tamanho e o canto vêm do `class` (`h-8 w-24`, `size-10 rounded-full`).
    Sem altura, a de uma linha de texto; sem largura, a toda; sem canto, o
    `rounded-md`. Os padrões só entram quando o `class` não traz o seu: não
    há duas alturas brigando pela ordem do CSS.

    Decorativo (`aria-hidden`): quem diz ao leitor de tela que o trecho
    está carregando é o contêiner, com `aria-busy` — o `data-carregar` já
    o põe. Quem pede menos movimento vê o bloco parado (`motion-safe:`).
--}}
@php
    $classe = (string) $attributes->get('class', '');

    $padroes = [
        'h-4' => preg_match('/(^|\s)(h|size)-/', $classe) !== 1,
        'w-full' => preg_match('/(^|\s)(w|size)-/', $classe) !== 1,
        'rounded-md' => preg_match('/(^|\s)rounded/', $classe) !== 1,
    ];

    $barra = 'bg-neutral-200 motion-safe:animate-pulse dark:bg-neutral-800';
    $linhas = $lines === null ? null : max(1, (int) $lines);
@endphp

@if ($linhas === null)
    <div aria-hidden="true" data-esqueleto {{ $attributes->class([$barra, ...$padroes]) }}></div>
@else
    <div aria-hidden="true" data-esqueleto {{ $attributes->class(['space-y-2', 'w-full' => $padroes['w-full']]) }}>
        @for ($linha = 1; $linha <= $linhas; $linha++)
            <div @class([$barra, 'h-3 rounded-md', 'w-3/5' => $linha === $linhas && $linhas > 1, 'w-full' => $linha < $linhas || $linhas === 1])></div>
        @endfor
    </div>
@endif
