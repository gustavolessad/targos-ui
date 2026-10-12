@props(['title' => null])

{{--
    O layout do painel. Modelo do targos/ui: este arquivo é do projeto,
    e pode mudar à vontade. O desenho de cada parte vem dos componentes
    `x-ui.*`; aqui fica só o arranjo.
--}}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ? $title.' — '.config('app.name') : config('app.name') }}</title>

    <link rel="icon" href="{{ asset('favicon.ico') }}">

    {{-- A fonte de `--font-sans` (theme.css). Trocando lá, troque aqui. --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />

    <x-ui.theme-script />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-white antialiased dark:bg-neutral-900">
    {{--
        No computador a barra é fixa: a partir do lg sai do fluxo e vira coluna.
        Recolhida (botão da barra superior), fica só com os ícones.
    --}}
    <div class="fixed inset-y-0 start-0 z-40 hidden w-64 transition-[width] duration-200 lg:block recolhida:w-16">
        <x-admin.sidebar />
    </div>

    {{-- No celular a mesma barra vira gaveta, pelo botão da barra superior. --}}
    <x-ui.sidebar-drawer id="menu-painel">
        <x-admin.sidebar />
    </x-ui.sidebar-drawer>

    <div class="transition-[padding] duration-200 lg:ps-64 recolhida:ps-16">
        <x-ui.topbar>
            {{-- Recolhe a barra no computador; no celular, abre a gaveta. --}}
            <x-slot:start>
                <x-ui.sidebar-toggle drawer="menu-painel" />
            </x-slot:start>

            <x-ui.theme-toggle />

            @auth
                <x-ui.user-menu :name="auth()->user()->name"
                                :email="auth()->user()->email"
                                :logout="route('logout')" />
            @endauth
        </x-ui.topbar>

        <x-ui.content>
            {{ $slot }}
        </x-ui.content>
    </div>

    {{-- A pergunta das ações que não voltam atrás (`data-confirmar="texto"`). --}}
    <x-ui.confirm />

    <x-ui.toast />

    @stack('scripts')
</body>
</html>
