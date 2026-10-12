@props(['align' => 'start'])

{{-- `align="end"` para a coluna de ações, que fica encostada à direita; `center` para colunas de ícone. --}}
<td {{ $attributes->class([
    'px-4 py-2.5 text-neutral-700 dark:text-neutral-300',
    'text-end' => $align === 'end',
    'text-center' => $align === 'center',
]) }}>{{ $slot }}</td>
