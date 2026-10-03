@props([
    /*
     * Sem nome, o campo não é enviado: é o caso do filtro de um
     * painel, que só estreita o que está à vista.
     */
    'name' => null,
    /*
     * O `id` do campo, quando o que vem do nome não serve — dois
     * formulários iguais na mesma tela (o modal de criar e o de
     * editar). Sem ele, é o nome sem colchetes (`items-0-price`).
     */
    'id' => null,
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
    /*
     * Avisar ao sair do campo que o valor não passa: CPF, CNPJ e
     * documento pelo dígito verificador, telefone pelo DDD e pelo 9 do
     * celular, CEP pelos 8 dígitos. Só com `mask`, e só aviso — quem
     * recusa é o servidor (resources/js/masks.js).
     */
    'validate' => false,
    /*
     * Enviar o valor sem pontuação (`52998224725`, não `529.982.247-25`).
     *
     * O campo que se vê perde o `name` e um escondido ao lado o leva,
     * com o que o JavaScript copia a cada tecla. Só com `mask`: sem
     * máscara não há pontuação a tirar.
     */
    'unmasked' => false,
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
    $chave = $name === null ? null : \Targos\Ui\FieldName::key($name);

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

    // `items[0][price]` → `items-0-price`: `id` com colchete não serve ao `for` nem ao seletor.
    $idDoCampo = $id ?? ($name !== null ? \Targos\Ui\FieldName::id($name) : null);

    /*
     * Sem pontuação no envio: o escondido fica com o `name` e o `id` do
     * campo, e o visível passa a `{id}-mascarado` — é ele que o rótulo
     * nomeia, porque é nele que se digita.
     *
     * Os dois nascem com o valor limpo; o JavaScript formata o visível
     * ao ligar. O CNPJ (e o documento) sobe para maiúsculas, como a
     * máscara o mostra.
     */
    $semPontuacao = $unmasked && $mask && $name !== null;
    $idVisivel = $semPontuacao ? $idDoCampo.'-mascarado' : $idDoCampo;
    $valorLimpo = null;

    if ($semPontuacao && $valorAtual !== null) {
        $valorLimpo = preg_replace('/[^0-9A-Za-z]/', '', (string) $valorAtual);
        $valorLimpo = in_array($mask, ['cnpj', 'documento'], true) ? strtoupper($valorLimpo) : $valorLimpo;
    }

    /*
     * O escondido segue o visível no que decide o envio: desligado não
     * vai, e `form` o leva para o mesmo formulário.
     */
    $escondidoDesligado = (bool) $attributes->get('disabled', false);
    $formDoCampo = $attributes->get('form');

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

    /*
     * Na célula não há rótulo nem linha de erro: o `label` vira o nome
     * acessível do campo (quem o rotula à vista é o cabeçalho da
     * coluna), e o erro vai na borda, no `aria-invalid` e no `title` — a
     * mensagem aparece ao passar o mouse, já que não há onde escrevê-la.
     * Como padrões do `merge`: o `aria-label` passado de fora vence.
     */
    $naCelulaAcessivel = $naCelula ? array_filter([
        'aria-label' => $label,
        'aria-invalid' => $temErro ? 'true' : null,
        'title' => $temErro ? $errors->first($chave) : null,
    ]) : [];
@endphp

@if ($naCelula)
    {{-- Só o campo: quem o rotula é o cabeçalho da coluna. --}}
    {{-- Na célula, o `id` só vem quando a tela o pede: o rótulo é o cabeçalho, não um `for`. --}}
    <input type="{{ $type }}"
           @if ($semPontuacao) id="{{ $idVisivel }}" @elseif ($id !== null) id="{{ $id }}" @endif
           @if ($name && ! $semPontuacao) name="{{ $name }}" @endif
           value="{{ $semPontuacao ? $valorLimpo : $valorAtual }}"
           @required($required)
           @if ($mask) data-mascara="{{ $mask }}" @endif
           @if ($mask && $validate) data-mascara-valida @endif
           @if ($semPontuacao) data-mascara-destino="{{ $idDoCampo }}" @endif
           {{ $attributes->merge($naCelulaAcessivel)->class([
               /*
                * A borda aparece sempre, não só no hover: numa tabela
                * cheia de texto, um campo sem contorno não se anuncia
                * como campo — quem lê não descobre que pode editar.
                */
               $radius.' border bg-transparent text-neutral-900 transition',
               'placeholder:text-neutral-400',
               'focus:ring-2 focus:outline-none',
               'disabled:cursor-not-allowed disabled:text-neutral-400',
               'dark:text-white dark:placeholder:text-neutral-500',
               $tamanhos['cell'],
               $width ?? 'w-full',
               // A borda de erro é a mesma do tamanho normal: aqui a cor é o aviso inteiro.
               'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-800 dark:hover:border-neutral-600' => ! $temErro,
               'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
           ]) }}>

    @if ($semPontuacao)
        <input type="hidden"
               id="{{ $idDoCampo }}"
               name="{{ $name }}"
               value="{{ $valorLimpo }}"
               @disabled($escondidoDesligado)
               @if ($formDoCampo) form="{{ $formDoCampo }}" @endif>
    @endif
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
                                      :for="$idVisivel"
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
               @if ($idVisivel !== null) id="{{ $idVisivel }}" @endif
               @if ($name && ! $semPontuacao) name="{{ $name }}" @endif
               value="{{ $caixaMarcada ? $toggleValue : ($semPontuacao ? $valorLimpo : $valorAtual) }}"
               @required($required)
               @disabled($caixaMarcada)
               @if ($mask) data-mascara="{{ $mask }}" @endif
               @if ($mask && $validate) data-mascara-valida @endif
               @if ($semPontuacao) data-mascara-destino="{{ $idDoCampo }}" @endif
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

        @if ($semPontuacao)
            {{--
                O que vai no envio. Desligado junto com o visível — pela
                caixa ao lado do rótulo ou pelo `disabled` da tela —,
                porque campo desligado não é enviado.
            --}}
            <input type="hidden"
                   id="{{ $idDoCampo }}"
                   name="{{ $name }}"
                   value="{{ $valorLimpo }}"
                   @disabled($caixaMarcada || $escondidoDesligado)
                   @if ($formDoCampo) form="{{ $formDoCampo }}" @endif>
        @endif

        @if ($temErro)
            <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
        @elseif ($hint)
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
        @endif
    </div>
@endif
