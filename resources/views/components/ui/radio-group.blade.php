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
])

@php
    $valorAtual = old($name, $selected);

    $tamanhos = [
        'md' => ['opcao' => 'h-9 px-4 text-sm gap-2', 'icone' => 'size-4'],
        'lg' => ['opcao' => 'h-12 px-6 text-base gap-2.5', 'icone' => 'size-5'],
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
    @if ($label)
        <span class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ $label }}</span>
    @endif

    {{-- Fundo branco, como os campos; no escuro, o mesmo fundo deles. --}}
    <div {{ $attributes->class(['inline-flex' => ! $full, 'flex w-full' => $full, 'rounded-lg border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900']) }}>
        @foreach ($options as $valor => $rotulo)
            <label @class(['cursor-pointer', 'flex-1' => $full])>
                <input type="radio"
                       name="{{ $name }}"
                       value="{{ $valor }}"
                       @checked((string) $valorAtual === (string) $valor)
                       class="peer sr-only">

                <span @class([
                    'flex items-center rounded-md font-medium text-neutral-600 transition dark:text-neutral-400',
                    'justify-center' => $full,
                    $tamanho['opcao'],
                    'peer-not-checked:hover:bg-neutral-100 peer-not-checked:hover:text-neutral-900',
                    'dark:peer-not-checked:hover:bg-white/5 dark:peer-not-checked:hover:text-white',
                    'peer-checked:bg-primary-600 peer-checked:text-white',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30',
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

    @error($name)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @enderror
</div>
