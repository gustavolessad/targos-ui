@props([
    'id',
    // A largura da gaveta; no celular nunca passa de 85% da tela, para o fundo à direita fechar com um toque.
    'width' => 'w-72',
])

{{--
    A barra lateral no celular: a mesma `ui.sidebar` do computador, deslizando
    da esquerda por cima da tela — sem o cabeçalho, o recuo e a largura cheia
    da `ui.offcanvas`, que é gaveta de cadastro e não de menu.

    Abre pelo `ui.sidebar-toggle` (`drawer="{{ $id }}"`) abaixo do `lg`, e
    fecha pelo X, tocando no fundo ou com Esc — o mesmo `layers.js` da
    gaveta (por isso o `data-offcanvas`). Por estar dentro de um
    `data-offcanvas`, a barra daqui nunca fica "recolhida".

    No layout:

        <x-ui.sidebar-drawer id="menu-painel">
            <x-admin.sidebar />
        </x-ui.sidebar-drawer>
--}}
<div id="{{ $id }}" data-offcanvas class="fixed inset-0 z-60 hidden [&[data-aberto]]:block lg:[&[data-aberto]]:hidden">
    <div data-offcanvas-fundo
         class="fixed inset-0 bg-neutral-900/40 opacity-0 transition-opacity duration-300 [[data-aberto]_&]:opacity-100"></div>

    <div {{ $attributes->class([
             'fixed inset-y-0 start-0 flex max-w-[85vw] flex-col shadow-xl',
             'transition duration-300 ease-out -translate-x-full [[data-aberto]_&]:translate-x-0',
             $width,
         ]) }}
         role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" data-fecha-offcanvas aria-label="Fechar o menu"
                class="absolute end-2 top-2 z-10 rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700
                       dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
            <x-ui.icon name="x" class="size-5" />
        </button>

        {{ $slot }}
    </div>
</div>
