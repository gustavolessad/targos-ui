{{--
    A área de conteúdo do painel, abaixo da barra superior.

    O mesmo fundo da barra superior, que fica fixa em cima dela; a linha
    fina da barra e a da barra lateral separam as três partes, sem sombra
    (21/11/2026; antes, o conteúdo emergia da moldura pela sombra de dentro).

    Por dentro, a largura toda: listagens e tabelas aproveitam o monitor
    largo. Quem precisa de coluna mais estreita divide a tela em grade.
--}}
<main {{ $attributes->class([
    // 3.5rem: a altura do x-ui.topbar (h-14).
    'min-h-[calc(100vh-3.5rem)] bg-painel p-6 lg:p-10',
    'dark:bg-painel-dark',
]) }}>
    <div class="w-full">
        {{ $slot }}
    </div>
</main>
