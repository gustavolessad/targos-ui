{{--
    As mensagens do sistema, no centro inferior da tela.

    Entram por três caminhos:
      - a sessão (`success`, `warning`, `error` e as demais chaves de `config('ui.toast')`), dos controllers
      - `$errors`, quando a validação recusa o formulário
      - `mostrarToast(tipo, texto)` no JavaScript, quando algo acontece
        sem recarregar a página

    Some sozinho depois de alguns segundos; o X fecha antes disso.

    A animação é de CSS, como a do modal: o JavaScript só põe e tira
    `data-visivel`, e a transição corre sozinha. Entra subindo e sai
    pelo caminho inverso.
--}}
@php
    $mensagens = [];

    /*
     * As chaves de sessão de cada tipo vêm de `config('ui.toast')`: por
     * padrão, tanto as em inglês (`success`, `warning`, `error`) quanto
     * as em português (`sucesso`, `aviso`, `erro`). A primeira que
     * tiver texto vale.
     *
     * O `aviso` é o que deu certo com uma ressalva que a pessoa precisa
     * ler.
     */
    foreach (config('ui.toast', []) as $tipo => $chaves) {
        foreach ((array) $chaves as $chave) {
            if ($texto = session($chave)) {
                $mensagens[] = ['tipo' => $tipo, 'texto' => $texto];

                break;
            }
        }
    }

    // As mesmas cores do `mostrarToast` (ui/toast.js), sem borda. O âmbar leva texto escuro: branco sobre ele não se lê.
    $cores = [
        'sucesso' => 'bg-success-600 text-white',
        'aviso' => 'bg-warning-400 text-neutral-950',
        'erro' => 'bg-danger-600 text-white',
    ];

    /*
     * O corpo de todo toast, o do servidor e o do JavaScript: o
     * `mostrarToast` clona o <template> abaixo, então os dois saem do
     * mesmo HTML (o mesmo botão de fechar, a mesma animação).
     */
    $base = 'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl py-2 ps-4 pe-2 text-sm shadow-lg '
        .'translate-y-3 opacity-0 transition duration-300 ease-out '
        .'[&[data-visivel]]:translate-y-0 [&[data-visivel]]:opacity-100';

    /*
     * Só a primeira mensagem de validação.
     *
     * O erro de cada campo já aparece embaixo dele; o toast serve para
     * quem não viu o campo — empilhar os sete de um cadastro seria uma
     * parede vermelha.
     *
     * `isset` porque `$errors` nem sempre está lá: quem o compartilha é
     * um middleware da sessão, que não roda nas views de erro. Sem a
     * guarda, a página de 404 morria em 500 dentro do layout.
     */
    if (isset($errors) && $errors->any()) {
        $mensagens[] = ['tipo' => 'erro', 'texto' => $errors->first()];
    }
@endphp

<div id="toasts"
     class="pointer-events-none fixed inset-x-0 bottom-0 z-70 flex flex-col items-center gap-2 p-4">
    @foreach ($mensagens as $mensagem)
        <div data-toast="{{ $mensagem['tipo'] }}"
             {{-- O erro e o aviso ficam até o X: muitas vezes é a mensagem da API, que só existe aqui. --}}
             @if ($mensagem['tipo'] !== 'sucesso') data-toast-fica @endif
             class="{{ $base }} {{ $cores[$mensagem['tipo']] }}">
            <span class="flex-1 py-1" data-toast-texto>{{ $mensagem['texto'] }}</span>

            <x-ui.button variant="ghost-contrast" size="icon-xs" data-fecha-toast aria-label="Fechar" class="shrink-0">
                <x-ui.icon name="x" class="size-4" />
            </x-ui.button>
        </div>
    @endforeach

    {{-- O modelo do `mostrarToast`: a cor e o texto entram no clone. --}}
    <template data-toast-modelo>
        <div class="{{ $base }}">
            <span class="flex-1 py-1" data-toast-texto></span>

            <x-ui.button variant="ghost-contrast" size="icon-xs" data-fecha-toast aria-label="Fechar" class="shrink-0">
                <x-ui.icon name="x" class="size-4" />
            </x-ui.button>
        </div>
    </template>
</div>
