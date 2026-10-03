@props([
    'name',
    'label' => null,
    'options' => [],
    'selected' => null,
    // md (o padrão dos formulários) | lg (escolha principal da tela)
    'size' => 'md',
    /*
     * Ícone de cada opção, `valor => ícone`: um nome da Lucide ("barcode")
     * ou um componente do projeto, pelo nome com ponto ("brand.pix" → x-brand.pix).
     *
     * @var array<string, string>
     */
    'icons' => [],
    // Ocupa a largura toda, com as opções dividindo o espaço por igual.
    'full' => false,
    // Uma das opções é obrigatória: o `required` vai em cada rádio, que é como o navegador o entende.
    'required' => false,
    // A explicação do grupo, num ícone ao lado do rótulo (ver o input).
    'info' => null,
    // A linha de apoio embaixo das opções, como no `x-ui.input` (some quando há erro).
    'hint' => null,
    /*
     * As opções que não se escolhem, pelos valores: `['boleto']`. Elas
     * continuam à vista, apagadas — sumir com uma opção esconderia que
     * ela existe. `true` desliga o grupo inteiro.
     *
     * @var list<string|int>|bool
     */
    'disabled' => [],
    // O `id` do grupo de opções (o contorno em volta delas).
    'id' => null,
])

@php
    // `items[0][tipo]` no HTML é `items.0.tipo` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);

    $valorAtual = old($chave, $selected);

    /*
     * Comparadas como texto, como a opção marcada: `[1]` e `['1']`
     * desligam a mesma opção, e um `in_array` solto acharia que
     * `'pj' == true`.
     */
    $desligadas = array_map('strval', match (true) {
        $disabled === true => array_keys($options),
        is_array($disabled) => $disabled,
        $disabled === false || $disabled === null => [],
        default => [$disabled],
    });

    /*
     * A altura da opção é a do campo do mesmo tamanho menos a moldura
     * (1px de borda e o `p-1` de cada lado): o grupo inteiro fica com a
     * altura do `x-ui.input` (40px no md, 48px no lg), e um rádio ao lado
     * de um campo na mesma linha da grade não sobra nem falta.
     */
    $tamanhos = [
        'md' => ['opcao' => 'h-7.5 px-4 text-sm gap-2', 'icone' => 'size-4'],
        'lg' => ['opcao' => 'h-9.5 px-6 text-base gap-2.5', 'icone' => 'size-5'],
    ];
    $tamanho = $tamanhos[$size] ?? $tamanhos['md'];
@endphp

{{--
    Um grupo de opções lado a lado, no estilo de botão segmentado.

    O `peer-checked:` do Tailwind pinta o rótulo conforme o rádio irmão,
    então a seleção não precisa de JavaScript nenhum. Para reagir à
    troca, a tela liga um `onchange` no grupo (ou usa `data-alternancia`).
    A opção não escolhida ganha o fundo cinza sutil dos hovers do painel.
--}}
<div>
    {{-- Sem `for`: o rótulo nomeia o grupo, e cada rádio já tem o seu texto. --}}
    @if ($label)
        <x-ui.field-label :label="$label" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    {{-- Fundo branco, como os campos; no escuro, o mesmo fundo deles. --}}
    <div @if ($id) id="{{ $id }}" @endif {{ $attributes->except('id')->class(['inline-flex' => ! $full, 'flex w-full' => $full, 'rounded-lg border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900']) }}>
        @foreach ($options as $valor => $rotulo)
            <label @class(['cursor-pointer', 'flex-1' => $full])>
                <input type="radio"
                       name="{{ $name }}"
                       value="{{ $valor }}"
                       @checked((string) $valorAtual === (string) $valor)
                       @required($required)
                       @disabled(in_array((string) $valor, $desligadas, true))
                       class="peer sr-only">

                <span @class([
                    'flex items-center rounded-md font-medium text-neutral-600 transition dark:text-neutral-400',
                    'justify-center' => $full,
                    $tamanho['opcao'],
                    'peer-not-checked:hover:bg-neutral-100 peer-not-checked:hover:text-neutral-900',
                    'dark:peer-not-checked:hover:bg-white/5 dark:peer-not-checked:hover:text-white',
                    'peer-checked:bg-primary-600 peer-checked:text-white',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30',
                    'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                ])>
                    @if ($icone = $icons[$valor] ?? null)
                        <span class="contents" data-icone="{{ $valor }}">
                            @if (str_contains($icone, '.'))
                                <x-dynamic-component :component="$icone" :class="$tamanho['icone']" />
                            @else
                                <x-ui.icon :name="$icone" :class="$tamanho['icone']" />
                            @endif
                        </span>
                    @endif
                    {{ $rotulo }}
                </span>
            </label>
        @endforeach
    </div>

    @error($chave)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @else
        @if ($hint)
            <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
        @endif
    @enderror
</div>
