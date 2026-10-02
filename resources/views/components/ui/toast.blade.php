@props([
    /*
     * O código do erro para a pessoa passar ao suporte — o projeto
     * passa `session('correlation_id')`. Vai no fim da mensagem de erro
     * da sessão, com os 6 últimos caracteres: "(código EFGHIJ)".
     */
    'code' => null,
])

{{--
    As mensagens do sistema, no centro inferior da tela.

    Entram por três caminhos:
      - a sessão (`success`, `info`, `warning`, `error` e as demais chaves de `config('ui.toast')`), dos controllers
      - `$errors`, quando a validação recusa o formulário
      - `mostrarToast(tipo, texto)` no JavaScript, quando algo acontece
        sem recarregar a página

    Quanto tempo cada tipo fica vem de `config('ui.toast_seconds')`: o
    sucesso e a informação somem sozinhos; o aviso e o erro ficam até o
    X. O X fecha qualquer um antes do tempo.

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
     * ler; a `info`, o que ela só precisa saber.
     */
    foreach (config('ui.toast', []) as $tipo => $chaves) {
        foreach ((array) $chaves as $chave) {
            if ($texto = session($chave)) {
                /*
                 * O erro que veio do servidor leva o código da
                 * requisição: com ele, o suporte acha o registro no log
                 * sem pedir print nem horário.
                 */
                if ($tipo === 'erro' && filled($code)) {
                    $texto .= ' (código '.mb_strtoupper(mb_substr((string) $code, -6)).')';
                }

                $mensagens[] = ['tipo' => $tipo, 'texto' => $texto];

                break;
            }
        }
    }

    // As mesmas cores do `mostrarToast` (ui/toast.js), sem borda. O âmbar leva texto escuro: branco sobre ele não se lê.
    $cores = [
        'sucesso' => 'bg-success-600 text-white',
        'info' => 'bg-info-600 text-white',
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

    /*
     * Quantos segundos cada tipo fica na tela, de
     * `config('ui.toast_seconds')`; `null`, até o X.
     *
     * O tipo que a configuração não cita fica até o X: uma mensagem
     * que some antes de ser lida é pior que uma que pede um clique.
     */
    $segundos = config('ui.toast_seconds', []);

    foreach ($mensagens as $i => $mensagem) {
        $tempo = $segundos[$mensagem['tipo']] ?? null;

        $mensagens[$i]['segundos'] = is_numeric($tempo) && $tempo > 0 ? $tempo : null;
    }
@endphp

<div id="toasts"
     class="pointer-events-none fixed inset-x-0 bottom-0 z-70 flex flex-col items-center gap-2 p-4">
    @foreach ($mensagens as $mensagem)
        <div data-toast="{{ $mensagem['tipo'] }}"
             {{-- Por padrão, o erro e o aviso ficam até o X: muitas vezes é a mensagem da API, que só existe aqui. --}}
             @if ($mensagem['segundos']) data-toast-segundos="{{ $mensagem['segundos'] }}" @else data-toast-fica @endif
             class="{{ $base }} {{ $cores[$mensagem['tipo']] ?? $cores['erro'] }}">
            <span class="flex-1 py-1" data-texto-toast>{{ $mensagem['texto'] }}</span>

            <x-ui.button variant="ghost-contrast" size="icon-xs" data-fecha-toast aria-label="Fechar" class="shrink-0">
                <x-ui.icon name="x" class="size-4" />
            </x-ui.button>
        </div>
    @endforeach

    {{-- O modelo do `mostrarToast`: a cor e o texto entram no clone. --}}
    <template data-modelo-toast>
        <div class="{{ $base }}">
            <span class="flex-1 py-1" data-texto-toast></span>

            <x-ui.button variant="ghost-contrast" size="icon-xs" data-fecha-toast aria-label="Fechar" class="shrink-0">
                <x-ui.icon name="x" class="size-4" />
            </x-ui.button>
        </div>
    </template>
</div>
