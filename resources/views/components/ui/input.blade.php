@props([
    /*
     * Sem nome, o campo não é enviado: é o caso do filtro de um
     * painel, que só estreita o que está à vista.
     */
    'name' => null,
    'label' => null,
    'type' => 'text',
    'value' => null,
    'hint' => null,
    /**
     * A explicação do campo, num ícone ao lado do rótulo.
     *
     * Para o que o rótulo não cabe dizer: de onde vem o número, o que
     * acontece se ficar em branco. No `hint` embaixo, o mesmo texto
     * empurraria os vizinhos numa grade de campos.
     */
    'info' => null,
    'required' => false,
    'mask' => null,
    'size' => 'md',
    /*
     * O arredondamento do campo no tamanho `cell`. Na tabela ele é
     * discreto (`rounded`); a busca dentro de um painel suspenso pede
     * o mesmo `rounded-lg` do painel em volta.
     */
    'radius' => 'rounded',
    /*
     * A largura do campo **com o seu envelope** — rótulo, erro e dica.
     *
     * Aqui, e não no `class`: as classes de fora vão para o `<input>`,
     * e um `flex-1` nele não faz a caixa em volta crescer. Numa linha
     * de flex, o campo encolhia ao conteúdo e o botão ao lado ficava
     * desalinhado.
     */
    'width' => null,
    /*
     * Uma caixa de seleção ao lado do rótulo, que desliga o campo e
     * põe nele um valor fixo — "Sem número" no endereço.
     *
     * Dentro do componente, e não solta na tela: a caixa pertence ao
     * campo, e uma linha própria abaixo dele a afastaria do que ela
     * governa. `toggle` é o rótulo dela; sem ele, nada é desenhado.
     */
    'toggle' => null,
    /** O nome da caixa no formulário. */
    'toggleName' => null,
    /** O que o campo passa a valer quando ela é marcada. */
    'toggleValue' => '',
    'toggleChecked' => false,
    /**
     * Não repreencher com o que foi digitado depois de um erro.
     *
     * É para o que não pode voltar ao HTML: número do cartão, CVV,
     * documento do titular. O `dontFlash` do `bootstrap/app.php` já
     * impede que esses valores cheguem à sessão; esta prop é a segunda
     * volta da chave, para o campo não reaparecer preenchido se alguém
     * acrescentar um caminho que reflita a entrada.
     */
    'keepsInput' => true,
])

@php
    /*
     * `old()` vence o valor passado: depois de um erro de validação, a
     * tela precisa mostrar o que a pessoa digitou, não o que estava no
     * banco. `keepsInput` desliga isso para o que não pode voltar à
     * tela — os campos do cartão.
     */
    // `credentials[client_id]` no HTML é `credentials.client_id` para old() e para os erros.
    $chave = $name === null ? null : trim(str_replace(['[]', '[', ']'], ['', '.', ''], $name), '.');

    $valorAtual = $name === null || ! $keepsInput ? $value : old($chave, $value);

    /*
     * Um campo tem um valor, nunca uma lista.
     *
     * `?search[]=1` na URL faz o `old()` devolver um array, e o
     * `htmlspecialchars` do Blade estoura ao montar o `value` — a
     * tela caía com 500 por causa de um parâmetro malformado. Aqui o array vira nada,
     * que é o que um campo sem valor válido deve mostrar.
     */
    $valorAtual = is_array($valorAtual) ? null : $valorAtual;

    $temErro = $name !== null && $errors->has($chave);

    /*
     * O tamanho é prop, não classe passada de fora: duas classes de
     * altura no mesmo elemento — `h-10` do componente e `h-12` da
     * tela — não têm vencedor previsível, quem manda é a ordem no CSS
     * gerado. Aqui só uma das duas entra.
     *
     * `cell` é o campo dentro de uma célula de tabela: sem rótulo, sem
     * envelope e com a borda só no hover. A grade de variações tem
     * quatro campos por linha, e a moldura de cada um viraria uma
     * parede de caixas.
     */
    $tamanhos = [
        /*
         * Altura fixa, a mesma do botão, da senha e do select em cada
         * degrau (xs 28px, sm 36px, md 40px, lg 48px): lado a lado não
         * há degrau, e `type="month"` ou `number` não crescem pela
         * altura de linha de cada navegador.
         */
        'xs' => 'h-7 px-2.5 text-xs',
        'sm' => 'h-9 px-3 text-sm',
        'md' => 'h-10 px-3 text-sm',
        // As telas de acesso: um formulário curto, num card, sem mais nada.
        'lg' => 'h-12 px-4 text-base',
        'cell' => 'px-2 py-1 text-sm',
    ];

    $naCelula = $size === 'cell';
@endphp

@if ($naCelula)
    {{-- Só o campo: quem o rotula é o cabeçalho da coluna. --}}
    <input type="{{ $type }}"
           @if ($name) name="{{ $name }}" @endif
           value="{{ $valorAtual }}"
           @required($required)
           @if ($mask) data-mascara="{{ $mask }}" @endif
           {{ $attributes->class([
               /*
                * A borda aparece sempre, não só no hover: numa tabela
                * cheia de texto, um campo sem contorno não se anuncia
                * como campo — quem lê não descobre que pode editar.
                */
               $radius.' border border-neutral-300 bg-transparent text-neutral-900 transition',
               'placeholder:text-neutral-400 hover:border-neutral-400',
               'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
               'disabled:cursor-not-allowed disabled:text-neutral-400',
               'dark:border-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:hover:border-neutral-600',
               $tamanhos['cell'],
               $width ?? 'w-full',
           ]) }}>
@else
    @php
        // A caixa marcada manda no campo desde o primeiro desenho.
        $comCaixa = $toggle !== null && $toggleName !== null;
        $caixaMarcada = $comCaixa && (bool) old($toggleName, $toggleChecked);
    @endphp

    <div class="group {{ $width }}" @if ($comCaixa) data-campo-alternavel @endif>
        @if ($label || $comCaixa)
            {{--
                Rótulo e caixa na mesma linha: ela governa este campo, e
                pô-la abaixo dele a afastaria do que comanda.
            --}}
            <div class="mb-1.5 flex items-center justify-between gap-3">
                @if ($label)
                    <x-ui.field-label :label="$label"
                                      :for="$name"
                                      :required="$required"
                                      :info="$info" />
                @endif

                @if ($comCaixa)
                    {{--
                        O JavaScript liga as duas pontas: ao marcar,
                        escreve `data-campo-valor` no campo e o desliga;
                        ao desmarcar, devolve o que estava lá antes.

                        **Fora do Tab.** Ele fica entre o rótulo e o
                        campo, e no caminho do teclado se meteria entre
                        "Endereço" e "Número" — quem preenche o
                        formulário direto pararia numa exceção que a
                        maioria nunca usa. Continua clicável, e quem
                        navega por leitor de tela o encontra pelo
                        rótulo; o que sai é só a parada automática.
                    --}}
                    <x-ui.checkbox :name="$toggleName"
                                   :label="$toggle"
                                   :checked="$caixaMarcada"
                                   size="sm"
                                   tabindex="-1"
                                   data-campo-alterna />
                @endif
            </div>
        @endif

        <input type="{{ $type }}"
               @if ($name) id="{{ $name }}" name="{{ $name }}" @endif
               value="{{ $caixaMarcada ? $toggleValue : $valorAtual }}"
               @required($required)
               @disabled($caixaMarcada)
               @if ($mask) data-mascara="{{ $mask }}" @endif
               @if ($comCaixa) data-campo-valor="{{ $toggleValue }}" @endif
               {{ $attributes->class([
                   'block w-full rounded-lg border text-neutral-900',
                   'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                   // Desligado: cinza e sem cursor de escrita, para se ler sem se tentar editar.
                   'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                   'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                   $tamanhos[$size] ?? $tamanhos['md'],
                   'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                   'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                   'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
               ]) }}>

        @if ($temErro)
            <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
        @elseif ($hint)
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{{ $hint }}</p>
        @endif
    </div>
@endif
