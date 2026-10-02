@props(['icon' => null, 'title', 'description' => null])

{{--
    O que aparece quando não há nada na lista.

    Um ícone apagado, uma frase e — quando cabe — o caminho para sair
    dali. Sem isso, a tela vazia parece defeito em vez de começo.
--}}
<div {{ $attributes->class([
    'flex flex-col items-center rounded-xl border border-dashed border-neutral-300 px-6 py-12 text-center',
    'dark:border-neutral-800',
]) }}>
    @if ($icon)
        <span class="mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <x-ui.icon :name="$icon" class="size-6 text-neutral-400" />
        </span>
    @endif

    <p class="font-medium text-neutral-900 dark:text-white">{{ $title }}</p>

    @if ($description)
        <p class="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{{ $description }}</p>
    @endif

    @isset($acao)
        <div class="mt-5">{{ $acao }}</div>
    @endisset
</div>
