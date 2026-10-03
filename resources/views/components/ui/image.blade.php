@props([
    'name',
    'label' => null,
    'hint' => null,
    /** A explicação do campo, num ícone ao lado do rótulo (ver `x-ui.input`). */
    'info' => null,
    /*
     * Sem imagem, o formulário não passa: o rótulo ganha o `*` e o
     * nativo, o `required` — mas só enquanto não há imagem nenhuma. Com
     * a gravada à vista, salvar sem trocar é válido.
     */
    'required' => false,
    /** A imagem gravada (URL), mostrada no quadro até ser trocada ou removida. */
    'src' => null,
    /** O quadro da prévia: `sm` (64px), `md` (96px) ou `lg` (128px). */
    'size' => 'md',
    /** Os tipos aceitos, como no `accept` do HTML (ver `x-ui.file`). */
    'accept' => 'image/jpeg,image/png,image/webp',
    /** O tamanho máximo, em MB; `:max="false"` tira o limite (ver `x-ui.file`). */
    'max' => 10,
    /*
     * O botão "Remover", que aparece quando há imagem — gravada ou
     * escolhida agora. Tirar a gravada é o `{name}_remove` (abaixo).
     */
    'removable' => true,
    /** O `id` do campo. Sem ele, sai do nome (`items[0][photo]` → `items-0-photo`). */
    'id' => null,
    /*
     * O que o quadro mostra sem imagem: um ícone do Lucide pelo nome
     * (`empty="building-2"`) ou um texto curto (`empty="Sem logo"`).
     * Padrão: o ícone `image`, apagado.
     */
    'empty' => null,
])

@php
    /*
     * Uma imagem, com a prévia ao lado: o logo da marca, a foto do produto.
     *
     * O `<input type="file">` nativo é o campo do formulário. O JS
     * (resources/js/image.js) o esconde (sr-only) e mostra os botões:
     * "Escolher imagem" — o `<label for>` do nativo; "Trocar" quando já
     * há imagem — e "Remover". A escolha aparece no quadro na hora, sem
     * ir ao servidor. Sem JS, o nativo aparece sozinho ao lado do quadro
     * com a imagem gravada, e não há como removê-la.
     *
     * **Tirar a imagem gravada.** Não mandar arquivo não diz nada — é o
     * que acontece em todo salvar que não mexe na imagem. Quem diz é o
     * escondido `{name}_remove`: "Remover", com imagem gravada, o põe em
     * 1; escolher um arquivo o volta a 0. No servidor:
     *
     *     if ($request->boolean('logo_remove')) { ... apaga ... }
     *
     * Com colchete, o sufixo entra no último: `items[0][photo]` →
     * `items[0][photo_remove]` (lido por `items.0.photo_remove`).
     */
    // `items[0][photo]` no HTML é `items.0.photo` para old() e para os erros.
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $nomeDoRemover = str_ends_with($name, ']') ? substr($name, 0, -1).'_remove]' : $name.'_remove';

    /*
     * Depois de um erro de validação, quem tinha clicado em "Remover"
     * volta com a imagem fora do quadro: o pedido de tirar segue de pé.
     * (O arquivo escolhido, esse, não volta: nenhum navegador deixa
     * preencher um campo de arquivo.)
     */
    $removida = $removable && $src && (string) old(\Targos\Ui\FieldName::key($nomeDoRemover), '0') === '1';
    $temImagem = $src && ! $removida;

    $temErro = $errors->has($chave);

    $maximo = $max === false || ! is_numeric($max) || (float) $max <= 0 ? null : (float) $max;

    // O quadro, e o ícone de vazio na proporção dele.
    $tamanhos = [
        'sm' => ['size-16', 'size-6'],
        'md' => ['size-24', 'size-8'],
        'lg' => ['size-32', 'size-10'],
    ];
    [$quadro, $iconeVazio] = $tamanhos[$size] ?? $tamanhos['md'];

    $vazioIcone = $empty === null ? 'image' : (\Targos\Ui\Icons::exists($empty) ? $empty : null);

    /*
     * O escondido segue o nativo no que decide o envio: desligado não
     * vai, e `form` o leva para o mesmo formulário.
     */
    $desligado = (bool) $attributes->get('disabled', false);
    $formDoCampo = $attributes->get('form');
@endphp

<div class="group"
     data-imagem
     @if ($maximo !== null) data-imagem-max="{{ $maximo }}" @endif
     @if ($src) data-imagem-gravada="{{ $src }}" @endif
     @if ($required) data-imagem-obrigatoria @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    <div class="flex items-center gap-4">
        <div data-imagem-previa
             @class([
                 'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-neutral-50 dark:bg-neutral-900',
                 'border-neutral-300 dark:border-neutral-700' => ! $temErro,
                 'border-danger-400 dark:border-danger-500' => $temErro,
                 $quadro,
             ])>
            <img @if ($src) src="{{ $src }}" @endif
                 alt="{{ $label }}"
                 @if (! $temImagem) hidden @endif
                 class="size-full object-contain">

            <span data-imagem-vazio
                  @if ($temImagem) hidden @endif
                  class="px-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
                @if ($vazioIcone)
                    <x-ui.icon :name="$vazioIcone" class="{{ $iconeVazio }} text-neutral-300 dark:text-neutral-600" />
                @else
                    {{ $empty }}
                @endif
            </span>
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <div class="relative flex flex-wrap items-center gap-2">
                {{--
                    A caixa é o que o JS esconde (sr-only), como no
                    `x-ui.money`, e o `peer` do botão: ele acende com o
                    foco do teclado no nativo e apaga com ele desligado.
                --}}
                <div class="peer min-w-0" data-imagem-nativo-caixa>
                    <input type="file"
                           id="{{ $id }}"
                           name="{{ $name }}"
                           @if ($accept) accept="{{ $accept }}" @endif
                           @required($required && ! $temImagem)
                           data-imagem-nativo
                           {{ $attributes->class([
                               'block w-full text-sm text-neutral-700 dark:text-neutral-300',
                               'file:me-3 file:cursor-pointer file:rounded-lg file:border file:border-solid file:px-3 file:py-1.5',
                               'file:border-neutral-300 file:bg-white file:text-sm file:font-medium file:text-neutral-900',
                               'dark:file:border-neutral-700 dark:file:bg-neutral-900 dark:file:text-white',
                               'disabled:cursor-not-allowed disabled:opacity-60',
                           ]) }}>
                </div>

                {{-- As classes do `x-ui.button variant="secondary" size="sm"`. --}}
                <label for="{{ $id }}"
                       data-imagem-escolher
                       data-texto-escolher="Escolher imagem"
                       data-texto-trocar="Trocar"
                       hidden
                       class="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium whitespace-nowrap
                              border-neutral-300 bg-white text-neutral-900 transition hover:bg-neutral-50
                              dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800
                              peer-has-focus-visible:ring-4 peer-has-focus-visible:ring-neutral-400/30
                              peer-has-disabled:cursor-not-allowed peer-has-disabled:opacity-60">
                    <x-ui.icon name="upload" class="size-4" />
                    <span data-imagem-escolher-texto>{{ $temImagem ? 'Trocar' : 'Escolher imagem' }}</span>
                </label>

                @if ($removable)
                    <x-ui.button variant="ghost" size="sm" data-imagem-remover hidden :disabled="$desligado">
                        Remover
                    </x-ui.button>
                @endif
            </div>

            {{-- O JS escreve o nome e o tamanho do que foi escolhido: "logo.png (120 KB)". --}}
            <p data-imagem-nome hidden class="max-w-full truncate text-xs text-neutral-500 dark:text-neutral-400"></p>
        </div>
    </div>

    @if ($removable)
        <input type="hidden"
               name="{{ $nomeDoRemover }}"
               value="{{ $removida ? '1' : '0' }}"
               data-imagem-remover-flag
               @disabled($desligado)
               @if ($formDoCampo) form="{{ $formDoCampo }}" @endif>
    @endif

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $errors->first($chave) }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
