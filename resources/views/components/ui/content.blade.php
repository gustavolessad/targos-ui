{{--
    A área de conteúdo do painel, abaixo da barra superior.

    O conteúdo emerge da moldura pela sombra de dentro, a partir do lg,
    onde há barra lateral para ele encostar; sem canto arredondado
    (20/11/2026), no raio único do pacote.

    Por dentro, a largura toda: listagens e tabelas aproveitam o monitor
    largo. Quem precisa de coluna mais estreita divide a tela em grade.
--}}
<main {{ $attributes->class([
    // 3.5rem: a altura do x-ui.topbar (h-14).
    'min-h-[calc(100vh-3.5rem)] bg-painel p-6 lg:p-8',
    'lg:shadow-[inset_6px_6px_12px_-8px_rgb(0_0_0_/_0.10)]',
    'dark:bg-painel-dark dark:lg:shadow-none',
]) }}>
    <div class="w-full">
        {{ $slot }}
    </div>
</main>
