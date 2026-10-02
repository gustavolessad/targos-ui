@props([
    'last' => false,
    /**
     * Para onde a linha inteira leva, quando ela é um atalho.
     *
     * A tabela de pedidos usa: a linha toda abre o pedido, e o botão
     * "Abrir" no fim some. Uma `<tr>` não pode ser `<a>` — o HTML não
     * permite —, então quem navega é o JavaScript.
     *
     * O link do identificador continua no lugar: é ele que dá o clique
     * do meio, o "abrir em nova aba" e o caminho de quem usa teclado,
     * que a linha clicável não oferece.
     */
    'href' => null,
])

{{--
    A linha tem fundo próprio: sem ele, mostraria o da página atrás — e
    a tabela deixaria de ser uma superfície para virar um desenho de
    linhas soltas.

    O divisor é dela, não do `<tbody>`: o `divide-y` conta as irmãs
    escondidas, e a linha de expansão fechada deixava a borda para trás.
    A última não tem divisor — ali quem fecha é a borda da tabela.

    `last` marca a última linha visível, para o canto de baixo
    arredondar: nas telas com expansão a última `<tr>` é a escondida, e
    o CSS sozinho não sabe distingui-las.
--}}
<tr @if ($last) data-ultima @endif
    @if ($href) data-linha-url="{{ $href }}" @endif
    {{ $attributes->class([
        'bg-white transition hover:bg-neutral-50',
        'dark:bg-neutral-900 dark:hover:bg-neutral-800',
        'border-b border-neutral-100 dark:border-neutral-800/70' => ! $last,
        'cursor-pointer' => $href,
    ]) }}>
    {{ $slot }}
</tr>
