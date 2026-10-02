{{-- `theme="light"`: a página é sempre clara (o que se abre fora do painel), sem o tema escolhido lá. --}}
@props(['title' => null, 'theme' => null])

{{--
    O layout das páginas sem barra lateral: o login e o que se abre fora
    do painel. Modelo do targos/ui: este arquivo é do projeto, e pode
    mudar à vontade.
--}}
<!DOCTYPE html>
<html lang="pt-BR" @if ($theme === 'light') class="light" @endif>
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

    @if ($theme === 'light')
        <meta name="color-scheme" content="light">
    @else
        <x-ui.theme-script />
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-painel antialiased dark:bg-painel-dark">
    {{ $slot }}

    <x-ui.toast />

    @stack('scripts')
</body>
</html>
