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
     * Um ícone do Lucide à esquerda, dentro do campo (`icon="search"`).
     *
     * O texto recua o bastante para não passar por baixo dele, em cada
     * tamanho. Decorativo: quem nomeia o campo é o rótulo (ou o
     * `aria-label`). Fora do `cell`, que não tem onde pô-lo.
     */
    'icon' => null,
    /*
     * O indicador de "carregando", girando à direita, dentro do campo.
     *
     * Três estados: sem a prop, não há indicador; `:loading="false"`
     * desenha o indicador apagado, para um script acendê-lo depois; e
     * `loading` (ou `:loading="true"`) já o desenha aceso. Quem acende
     * e apaga é o atributo `data-carregando` no `<input>` — o CSS mostra
     * o indicador quando ele está lá:
     *
     *     campo.toggleAttribute('data-carregando', buscando);
     *
     * Sem redesenhar o campo: o indicador já está na página, e o
     * atributo só decide se ele aparece. Fora do `cell`.
     */
    'loading' => null,
    /** O texto do indicador para o leitor de tela. */
    'loadingLabel' => 'Carregando…',
    /*
     * O arredondamento do campo no tamanho `cell`. Na tabela ele é
     * discreto (`rounded-md`); a busca dentro de um painel suspenso pede
     * o mesmo `rounded-lg` do painel em volta.
     */
    'radius' => 'rounded-md',
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
        // O campo que é o centro da tela: a busca do balcão, que se usa de pé e de longe.
        'xl' => 'h-14 px-4 text-base',
        'cell' => 'px-2 py-1 text-sm',
    ];

    $naCelula = $size === 'cell';

    /*
     * Com ícone ou indicador, o tamanho sem o `px`, e o recuo de cada
     * lado à parte: `px-3` e `ps-9` no mesmo campo não têm vencedor
     * previsível (é a ordem no CSS gerado que decide), então só um dos
     * dois entra. O recuo deixa 8px entre o ícone e o texto em todo
     * tamanho; o ícone cresce com o campo, como no botão.
     *
     * Sem ícone nem indicador, o campo sai com as classes de sempre.
     */
    $adornos = [
        'xs' => ['caixa' => 'h-7 text-xs', 'inicio' => 'ps-2.5', 'fim' => 'pe-2.5', 'comIcone' => 'ps-8', 'comIndicador' => 'pe-8',
            'icone' => 'start-2.5 size-3.5', 'indicador' => 'end-2.5', 'tamanho' => 'size-3.5'],
        'sm' => ['caixa' => 'h-9 text-sm', 'inicio' => 'ps-3', 'fim' => 'pe-3', 'comIcone' => 'ps-9', 'comIndicador' => 'pe-9',
            'icone' => 'start-3 size-4', 'indicador' => 'end-3', 'tamanho' => 'size-4'],
        'md' => ['caixa' => 'h-10 text-sm', 'inicio' => 'ps-3', 'fim' => 'pe-3', 'comIcone' => 'ps-9', 'comIndicador' => 'pe-9',
            'icone' => 'start-3 size-4', 'indicador' => 'end-3', 'tamanho' => 'size-4'],
        'lg' => ['caixa' => 'h-12 text-base', 'inicio' => 'ps-4', 'fim' => 'pe-4', 'comIcone' => 'ps-11', 'comIndicador' => 'pe-11',
            'icone' => 'start-4 size-5', 'indicador' => 'end-4', 'tamanho' => 'size-5'],
        'xl' => ['caixa' => 'h-14 text-base', 'inicio' => 'ps-4', 'fim' => 'pe-4', 'comIcone' => 'ps-12', 'comIndicador' => 'pe-12',
            'icone' => 'start-4 size-6', 'indicador' => 'end-4', 'tamanho' => 'size-6'],
    ];

    $comIcone = $icon !== null && $icon !== '' && ! $naCelula;
    $comIndicador = $loading !== null && ! $naCelula;
    $adornado = $comIcone || $comIndicador;
    $adorno = $adornos[$size] ?? $adornos['md'];

    $classesDoTamanho = $adornado
        ? [$adorno['caixa'], $comIcone ? $adorno['comIcone'] : $adorno['inicio'], $comIndicador ? $adorno['comIndicador'] : $adorno['fim']]
        : [$tamanhos[$size] ?? $tamanhos['md']];

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
               'read-only:cursor-not-allowed read-only:text-neutral-400',
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

        {{--
            Com ícone ou indicador, uma caixa em volta só do campo: o
            ícone e o indicador se posicionam por ela, e não pelo
            envelope inteiro (que tem o rótulo em cima e a dica embaixo).
        --}}
        @if ($adornado)
            <div class="relative">
            @if ($comIcone)
                <x-ui.icon :name="$icon"
                           class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 {{ $adorno['icone'] }}" />
            @endif
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
               @if ($comIndicador && $loading) data-carregando @endif
               {{ $attributes->class([
                   // `peer`: o indicador, irmão logo depois, aparece pelo `data-carregando` daqui.
                   'peer' => $comIndicador,
                   'block w-full rounded-lg border text-neutral-900',
                   'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                   // Desligado: cinza e sem cursor de escrita, para se ler sem se tentar editar.
                   'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
                   'dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-500',
                   'read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-500',
                   'dark:read-only:bg-neutral-900/50 dark:read-only:text-neutral-500',
                   ...$classesDoTamanho,
                   'dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500',
                   'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700' => ! $temErro,
                   'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-500' => $temErro,
               ]) }}>

        @if ($adornado)
            @if ($comIndicador)
                {{--
                    Sempre na página, escondido; o `data-carregando` do
                    campo o mostra (`peer-data-carregando:flex`). O
                    script não redesenha nada: põe e tira o atributo.
                --}}
                <span class="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center peer-data-carregando:flex {{ $adorno['indicador'] }}"
                      data-campo-carregando>
                    <x-ui.icon name="loader-circle" class="animate-spin text-neutral-400 {{ $adorno['tamanho'] }}" />
                    <span class="sr-only">{{ $loadingLabel }}</span>
                </span>
            @endif
            </div>
        @endif

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
