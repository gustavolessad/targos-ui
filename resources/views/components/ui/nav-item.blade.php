@props(['icon' => null, 'href' => '#', 'match' => null, 'badge' => null, 'active' => null])

@php
    /*
     * O item ativo pelo padrão da rota, não pela URL: `orders.*`
     * mantém o item aceso na listagem e no formulário.
     */
    // `active` decide quando o padrão da rota não basta (seções da mesma rota).
    $ativo = $active ?? ($match !== null && request()->routeIs($match));
@endphp

{{--
    `data-barra-dica`: com a barra recolhida só o ícone aparece, e o
    nome vira uma dica à direita (sidebar.js).
--}}
<a href="{{ $href }}"
   @if ($ativo) aria-current="page" @endif
   data-barra-dica="{{ trim(strip_tags((string) $slot)) }}"
   {{ $attributes->class([
       'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
       'recolhida:justify-center recolhida:px-0',
       // Em repouso, a cor do título da página; o hover só ganha fundo. O ativo: fundo azul-claro e texto bem escuro.
       'text-neutral-900 hover:bg-neutral-100 hover:text-neutral-950' => ! $ativo,
       'dark:text-white dark:hover:bg-white/5 dark:hover:text-white' => ! $ativo,
       'bg-primary-50 text-neutral-950' => $ativo,
       'dark:bg-primary-500/15 dark:text-white' => $ativo,
   ]) }}>
    @if ($icon)
        <x-ui.icon :name="$icon" @class([
            'size-5 shrink-0 transition',
            'text-neutral-500 group-hover:text-neutral-800' => ! $ativo,
            'dark:text-neutral-400 dark:group-hover:text-neutral-200' => ! $ativo,
            'text-primary-600 dark:text-primary-400' => $ativo,
        ]) />
    @endif

    <span class="flex-1 truncate recolhida:hidden">{{ $slot }}</span>

    @if ($badge)
        <span class="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium
                     text-neutral-600 recolhida:hidden dark:bg-white/10 dark:text-neutral-300">
            {{ $badge }}
        </span>
    @endif
</a>
