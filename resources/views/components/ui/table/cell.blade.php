@props(['align' => 'start'])

{{-- `align="end"` para a coluna de ações, que fica encostada à direita; `center` para colunas de ícone. --}}
<td {{ $attributes->class([
    'px-3 py-2 text-neutral-900 dark:text-neutral-200',
    'text-end' => $align === 'end',
    'text-center' => $align === 'center',
]) }}>{{ $slot }}</td>
