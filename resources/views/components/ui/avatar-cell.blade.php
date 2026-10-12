@props([
    /** O nome que aparece, e de onde o avatar tira as iniciais. */
    'name',
    /** Para onde o nome leva (o cadastro, o documento); sem ele, só o texto. */
    'href' => null,
    /** A segunda linha, menor: o nome fantasia, o documento. */
    'caption' => null,
    /** O tamanho do avatar (ver `ui.avatar`): `xs` nas listagens, para a linha ficar baixa. */
    'size' => 'xs',
    /** A foto, quando houver; sem ela, as iniciais. */
    'src' => null,
])

{{--
    A pessoa numa coluna de listagem: o avatar e o nome, com uma segunda
    linha opcional — cliente, fornecedor, usuário. O que for além da
    segunda linha vai no slot.

    O link no nome dá o clique do meio, o "abrir em nova aba" e o caminho
    de quem usa teclado.
--}}
<div {{ $attributes->class(['flex items-center gap-2.5']) }}>
    <x-ui.avatar :name="$name" :src="$src" :size="$size" />

    <div class="min-w-0">
        @if ($href !== null)
            <a href="{{ $href }}" class="block truncate font-medium text-neutral-900 hover:underline dark:text-white">{{ $name }}</a>
        @else
            <span class="block truncate font-medium text-neutral-900 dark:text-white">{{ $name }}</span>
        @endif

        @if ($caption !== null && $caption !== '')
            <span class="block truncate text-xs text-neutral-500 dark:text-neutral-400">{{ $caption }}</span>
        @endif

        {{ $slot }}
    </div>
</div>
