@props([
    'title' => null,
    // O nome do sistema, no título da aba. Sem ele, `config('app.name')`.
    'appName' => null,
    'favicon' => null,
    // `light`: a página é sempre clara (o que se abre fora do painel), sem o tema escolhido lá.
    'theme' => null,
    // As entradas do Vite. Nulo não carrega nenhuma (o projeto põe as suas no slot `head`).
    'vite' => ['resources/css/app.css', 'resources/js/app.js'],
    'lang' => 'pt-BR',
])

@php
    $appName ??= config('app.name');
    $fonte = config('ui.font_url');
@endphp

{{--
    A casca das páginas sem barra lateral: o login e o que se abre fora
    do painel. Só o documento, o tema e o toast — o conteúdo é do projeto.

    Slots: `head` (mais tags no <head>) e `end` (antes do fim do <body>).
--}}
<!DOCTYPE html>
<html lang="{{ $lang }}" @if ($theme === 'light') class="light" @endif>
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

    @if ($theme === 'light')
        <meta name="color-scheme" content="light">
    @else
        {{-- O mesmo tema escolhido no painel, antes da primeira pintura. --}}
        <x-ui.theme-script />
    @endif

    @if ($vite)
        @vite($vite)
    @endif

    {{ $head ?? '' }}
</head>
<body {{ $attributes->class(['min-h-screen bg-painel antialiased dark:bg-painel-dark']) }}>
    {{ $slot }}

    <x-ui.toast />

    {{ $end ?? '' }}

    @stack('scripts')
</body>
</html>
