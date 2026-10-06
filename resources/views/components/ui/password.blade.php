@props([
    'name' => 'password',
    'label' => 'Senha',
    'required' => false,
    'hint' => null,
    'size' => 'md',
    // A explicação do campo, num ícone ao lado do rótulo (ver o `x-ui.field-label`).
    'info' => null,
])

@php
    $temErro = $errors->has($name);

    // Mesma tabela do <x-ui.input>, com espaço à direita para o olho.
    $tamanhos = [
        'xs' => 'h-7 px-2.5 pe-8 text-xs',
        'sm' => 'h-9 px-3 pe-9 text-sm',
        'md' => 'h-10 px-3 pe-10 text-sm',
        'lg' => 'h-12 px-4 pe-11 text-base',
    ];
@endphp

{{--
    O rótulo pelo `x-ui.field-label`, como os outros campos, e o slot
    `aside` à direita dele, na mesma linha — o "Esqueci minha senha" do
    login:

        <x-ui.password name="password" label="Senha" required>
            <x-slot:aside><a href="…">Esqueci minha senha</a></x-slot:aside>
        </x-ui.password>

    O mesmo nome do slot do `x-ui.page-header`: o que fica ao lado do título.
--}}
<div>
    <div class="mb-1.5 flex items-center justify-between gap-3">
        <x-ui.field-label :label="$label" :for="$name" :required="$required" :info="$info" />

        @isset($aside)
            <div class="shrink-0 text-xs">{{ $aside }}</div>
        @endisset
    </div>

    <div class="relative">
        <input type="password"
               id="{{ $name }}"
               name="{{ $name }}"
               @required($required)
               {{ $attributes->class([
                   'block w-full rounded-lg border text-neutral-900',
                   'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                   'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                   'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                   'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
                   'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
                   $tamanhos[$size] ?? $tamanhos['md'],
                   'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                   'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                   'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
               ]) }}>

        {{--
            O olho de mostrar a senha; quem o liga é resources/js/app.js.

            **Fora do Tab.** Ele fica dentro do campo, e no caminho do
            teclado se meteria entre a senha e o botão de entrar — quem
            digita e aperta Tab pararia num controle que só serve para
            conferir o que já foi digitado. Continua clicável, e o
            `aria-label` o descreve para quem usa leitor de tela; o que
            sai é só a parada automática.
        --}}
        <button type="button"
                data-ve-senha="{{ $name }}"
                tabindex="-1"
                aria-label="Mostrar ou esconder a senha"
                class="absolute inset-y-0 end-0 flex cursor-pointer items-center pe-3 text-neutral-400 hover:text-neutral-600
                       dark:hover:text-neutral-200">
            <x-ui.icon name="eye" class="size-5" />
            <x-ui.icon name="eye-off" class="hidden size-5" />
        </button>
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($name) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
