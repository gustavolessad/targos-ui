@props([
    'title' => null,
    // O nome do sistema, no título da aba. Sem ele, `config('app.name')`.
    'appName' => null,
    'favicon' => null,
    /*
     * O componente da barra lateral do projeto, pelo nome
     * (`admin.sidebar` → x-admin.sidebar). É nome, e não slot, porque a
     * barra é desenhada duas vezes — fixa no computador, gaveta no
     * celular — e cada desenho precisa dos próprios `id`.
     */
    'sidebar' => null,
    // As entradas do Vite. Nulo não carrega nenhuma (o projeto põe as suas no slot `head`).
    'vite' => ['resources/css/app.css', 'resources/js/app.js'],
    'lang' => 'pt-BR',
])

@php
    $appName ??= config('app.name');
    $fonte = config('ui.font_url');
@endphp

{{--
    A casca do painel: barra lateral, barra superior e a área de conteúdo.

    O projeto a embrulha num layout próprio, que diz o nome, a barra
    lateral e quem está logado (`ui.user-menu`, no slot `user`). O
    exemplo completo está no README do pacote.

    Slots: `head` (mais tags no <head>), `topbar` (ações na barra
    superior, antes do botão de tema), `user` (a conta, na ponta) e
    `end` (antes do fim do <body>).
--}}
<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ? $title.' — '.$appName : $appName }}</title>

    @if ($favicon)
        <link rel="icon" href="{{ $favicon }}">
    @endif

    @if ($fonte)
        <link rel="preconnect" href="{{ parse_url($fonte, PHP_URL_SCHEME).'://'.parse_url($fonte, PHP_URL_HOST) }}">
        <link href="{{ $fonte }}" rel="stylesheet" />
    @endif

    <x-ui.theme-script />

    @if ($vite)
        @vite($vite)
    @endif

    {{ $head ?? '' }}
</head>
<body class="bg-white antialiased dark:bg-neutral-900">
    @if ($sidebar)
        {{-- No computador a barra é fixa: a partir do lg sai do fluxo e vira coluna. --}}
        <div class="fixed inset-y-0 start-0 z-40 hidden w-64 lg:block">
            <x-dynamic-component :component="$sidebar" />
        </div>

        {{-- No celular a mesma barra vira gaveta, pelo botão da barra superior. --}}
        <x-ui.offcanvas id="menu-painel" side="left" width="max-w-64" class="lg:hidden">
            <x-dynamic-component :component="$sidebar" />
        </x-ui.offcanvas>
    @endif

    <div @class(['lg:ps-64' => $sidebar])>
        <header class="flex h-16 items-center gap-3 px-4 sm:px-6">
            @if ($sidebar)
                <x-ui.button type="button" variant="ghost" size="icon"
                             data-abre-offcanvas="menu-painel"
                             aria-label="Abrir menu"
                             class="lg:hidden">
                    <x-ui.icon name="menu" class="size-5" />
                </x-ui.button>
            @endif

            <div class="flex-1"></div>

            {{ $topbar ?? '' }}

            <x-ui.button type="button" variant="ghost" size="icon"
                         data-troca-tema
                         aria-label="Alternar tema claro e escuro">
                {{-- Um por tema: mostra para onde o clique leva. --}}
                <x-ui.icon name="moon" class="size-5 dark:hidden" />
                <x-ui.icon name="sun" class="hidden size-5 dark:block" />
            </x-ui.button>

            {{ $user ?? '' }}
        </header>

        {{--
            O conteúdo emerge da moldura: só o canto de cima à esquerda é
            arredondado, e só a partir do lg, onde há barra lateral para
            ele encostar.
        --}}
        <main class="min-h-[calc(100vh-4rem)] bg-painel p-6 lg:p-10
                     lg:rounded-ss-2xl lg:shadow-[inset_6px_6px_12px_-8px_rgb(0_0_0_/_0.10)]
                     dark:bg-painel-dark dark:lg:shadow-none">
            {{--
                A largura toda da área de conteúdo, junto da barra lateral:
                listagens e tabelas aproveitam o monitor largo. Quem precisa
                de coluna mais estreita divide a tela em grade.
            --}}
            <div class="w-full">
                {{ $slot }}
            </div>
        </main>
    </div>

    <x-ui.confirm />

    <x-ui.toast />

    {{ $end ?? '' }}

    @stack('scripts')
</body>
</html>
