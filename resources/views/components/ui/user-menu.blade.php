@props([
    'name',
    'email' => null,
    // As letras do círculo; sem elas, a primeira letra da primeira e da última palavra do nome.
    'initials' => null,
    // Para onde o "Sair" envia (POST). Sem ela, o item não aparece.
    'logout' => null,
    // A largura do menu aberto: mais larga quando o slot traz texto comprido (razão social, documento).
    'width' => 'w-60',
    // O papel da pessoa ("Proprietário", "Operador"), num selo ao lado do nome, no menu aberto.
    'role' => null,
])

@php
    if ($initials === null) {
        $palavras = preg_split('/\s+/u', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $letras = array_map(fn (string $palavra): string => mb_substr($palavra, 0, 1), $palavras);

        $initials = mb_strtoupper(count($letras) > 1 ? $letras[0].end($letras) : ($letras[0] ?? ''));
    }
@endphp

{{--
    A conta de quem está no painel, na ponta da barra superior: o
    círculo com as iniciais, o nome, e o menu com o "Sair".

    O menu aberto começa pelo cartão da conta: o mesmo círculo, o nome com
    o papel (`role`) ao lado, o e-mail e, no slot `meta`, o que mais
    identifica a pessoa (o nome de usuário do login). O que o projeto
    puser no slot entra abaixo do cartão, acima do "Sair" — itens
    `ui.dropdown-item`, em grupos separados por `ui.dropdown-separator`.
--}}
<div class="relative">
    <button type="button" data-abre-menu="menu-usuario"
            aria-label="Sua conta"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 transition
                   hover:bg-neutral-100 dark:hover:bg-white/5 sm:pe-3">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full
                     bg-primary-600 text-sm font-semibold text-primary-contrast">
            {{ $initials }}
        </span>

        <span class="hidden min-w-0 text-start sm:block">
            <span class="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                {{ $name }}
            </span>

            @if ($email)
                <span class="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {{ $email }}
                </span>
            @endif
        </span>
    </button>

    <div id="menu-usuario" data-menu
         class="absolute end-0 z-30 mt-1.5 hidden {{ $width }} max-w-[calc(100vw-2rem)] origin-top-right rounded-xl
                bg-white p-1 shadow-lg ring-1 ring-neutral-200
                dark:bg-neutral-900 dark:ring-neutral-800
                scale-95 opacity-0 transition duration-150 ease-out
                [&[data-aberto]]:scale-100 [&[data-aberto]]:opacity-100">
        {{-- O cartão da conta: no celular o botão mostra só o círculo, e é aqui que o nome aparece. --}}
        <div class="flex items-center gap-3 px-2.5 py-2.5" data-conta-usuario>
            <span aria-hidden="true"
                  class="flex size-10 shrink-0 items-center justify-center rounded-full
                         bg-primary-600 text-sm font-semibold text-primary-contrast">
                {{ $initials }}
            </span>

            <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                    <p class="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {{ $name }}
                    </p>

                    @if ($role)
                        <x-ui.badge class="shrink-0">{{ $role }}</x-ui.badge>
                    @endif
                </div>

                @if ($email)
                    <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {{ $email }}
                    </p>
                @endif

                @isset($meta)
                    <div class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {{ $meta }}
                    </div>
                @endisset
            </div>
        </div>

        {{ $slot }}

        @if ($logout)
            <x-ui.dropdown-separator />

            <form method="POST" action="{{ $logout }}">
                @csrf

                <x-ui.dropdown-item type="submit" icon="log-out">Sair</x-ui.dropdown-item>
            </form>
        @endif
    </div>
</div>
