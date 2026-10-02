@props([
    // select | search | wide | period
    'kind' => 'select',
])

@php
    /*
     * Um campo da barra de filtros em cima das tabelas. A largura vem do tipo,
     * não da tela: todos os selects de filtro do sistema têm a mesma largura,
     * e o mesmo vale para a busca e o período. Mudar o padrão é mudar aqui.
     * No celular, cada campo ocupa a linha inteira.
     */
    $larguras = [
        'select' => 'w-full sm:w-52',
        'search' => 'w-full sm:w-64',
        // A busca que procura em vários campos de uma vez: um pouco mais larga.
        'wide' => 'w-full sm:w-72',
        'period' => 'w-full sm:w-64',
    ];
@endphp

<div {{ $attributes->class([$larguras[$kind] ?? $larguras['select']]) }}>
    {{ $slot }}
</div>
