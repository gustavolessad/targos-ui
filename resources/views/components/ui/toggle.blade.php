@props([
    'name', 'label' => null, 'checked' => false, 'hint' => null, 'value' => '1', 'form' => null,
    /*
     * Lembra o que foi enviado quando o formulário volta com erro. Desligue
     * onde vários formulários da mesma tela usam o mesmo nome (uma linha de
     * tabela por formulário): o que voltou pode ser de outra linha.
     */
    'remember' => true,
    /*
     * O campo escondido que faz "desligado" chegar como "0". Sem valor,
     * vale `config('ui.falsy')` — desligado por padrão (ver o checkbox).
     */
    'falsy' => null,
])

@php
    /*
     * Desligado não vem no formulário (ver abaixo), então `old($name)` não
     * distingue "desligado" de "tela nova": quem diz que o formulário voltou
     * é a sessão. Voltou sem o campo = a pessoa desligou, e assim fica — o
     * padrão da tela religaria um interruptor desligado de propósito.
     */
    $ligado = $remember && session()->hasOldInput() ? (bool) old($name) : (bool) $checked;

    $falsy ??= (bool) config('ui.falsy', false);
@endphp

{{--
    O interruptor: ligado ou desligado, sem terceira opção.

    É um checkbox de verdade por baixo — o desenho vem de `peer-checked:`
    no irmão. Assim ele entra no formulário como qualquer campo, funciona
    no teclado e é anunciado pelo leitor de tela sem `role` inventado.

    Por padrão, sem campo escondido com "0": o controller que pergunta
    `$request->has(...)` veria o campo chegar sempre, ligado ou não.
    Desligado, o checkbox simplesmente não é enviado. Quem lê o valor
    liga o `falsy` (ou `config('ui.falsy')`).
--}}
<div>
    <div class="flex items-center gap-3">
        <label class="relative inline-flex cursor-pointer items-center">
            @if ($falsy)
                <input type="hidden" name="{{ $name }}" value="0" @if ($form) form="{{ $form }}" @endif>
            @endif

            <input type="checkbox"
                   id="{{ $name }}"
                   name="{{ $name }}"
                   value="{{ $value }}"
                   @checked($ligado)
                   @if ($form) form="{{ $form }}" @endif
                   {{ $attributes->class(['peer sr-only']) }}>

            <span class="h-6 w-11 rounded-full bg-neutral-300 transition-colors
                         peer-checked:bg-primary-600
                         peer-focus-visible:ring-4 peer-focus-visible:ring-primary-500/30
                         dark:bg-neutral-700"></span>

            {{-- A bolinha, que corre para a direita quando liga. --}}
            <span class="pointer-events-none absolute start-0.5 size-5 rounded-full bg-white
                         ring-1 ring-black/5 transition-transform peer-checked:translate-x-5
                         rtl:peer-checked:-translate-x-5"></span>
        </label>

        @if ($label)
            <label for="{{ $name }}" class="cursor-pointer text-sm text-neutral-700 select-none dark:text-neutral-300">
                {{ $label }}
            </label>
        @endif
    </div>

    @error($name)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @enderror

    @if ($hint && ! $errors->has($name))
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
    @endif
</div>
