@props([
    'name',
    'label' => null,
    'hint' => null,
    /** A explicação do campo, num ícone ao lado do rótulo (ver `x-ui.input`). */
    'info' => null,
    'required' => false,
    /*
     * Os tipos aceitos, como no `accept` do HTML: extensões (`.xml`),
     * tipos (`text/xml`) e famílias (`image/*`), separados por vírgula.
     *
     * O navegador só filtra a janela de escolha — quem escolhe "Todos os
     * arquivos" passa por cima. O JS confere de novo ao escolher, e o
     * servidor confere de verdade (`mimes:xml`).
     */
    'accept' => null,
    /** Vários arquivos de uma vez: o nome vira lista (`files[]`). */
    'multiple' => false,
    /*
     * O tamanho máximo de cada arquivo, em MB (como o Laravel conta:
     * 10 MB é `max:10240`). O JS recusa o que passa disso antes de
     * enviar; `:max="false"` tira o limite.
     *
     * "Sem limite" é `false`, e não `null`: um atributo `null` é o mesmo
     * que não passado, e cairia no padrão (ver `x-ui.money`).
     */
    'max' => 10,
    /*
     * O `id` do campo. Sem ele, sai do nome (`files[]` → `files`,
     * `items[0][xml]` → `items-0-xml`).
     */
    'id' => null,
    /** `sm`, `md` ou `lg`: as alturas do `x-ui.input` e do botão. */
    'size' => 'md',
    /** O texto do botão. Padrão: "Escolher arquivo", ou "Escolher arquivos" com `multiple`. */
    'button' => null,
])

@php
    /*
     * Um arquivo, ou vários: o XML da nota, as fotos do produto.
     *
     * O `<input type="file">` nativo é o campo do formulário: leva o
     * `name`, o `accept`, o `required` e os atributos soltos. O JS
     * (resources/js/file.js) o esconde (sr-only, para a validação do
     * navegador ainda apontar para ele) e mostra no lugar um botão — o
     * `<label for>` do nativo, que abre a janela de escolha sem script —
     * e, ao lado, o nome e o tamanho do que foi escolhido. Sem JS, o
     * nativo aparece sozinho, com o desenho de cada navegador.
     *
     * Ao escolher, o JS recusa o que passa do `max` ou não está no
     * `accept`, com o erro embaixo do campo, e limpa a escolha. É aviso
     * antes do envio, não validação: o servidor confere de novo.
     */
    // `files[]` no HTML é `files` para os erros; os de cada arquivo chegam como `files.0`, `files.1`…
    $chave = \Targos\Ui\FieldName::key($name);
    $id ??= \Targos\Ui\FieldName::id($name);

    $erro = $errors->first($chave);

    // Na lista, o erro de um arquivo (`files.2`: "deve ser uma imagem") aparece no campo.
    if ($erro === '' && $multiple) {
        $erro = $errors->first($chave.'.*');
    }

    $temErro = $erro !== '';

    $maximo = $max === false || ! is_numeric($max) || (float) $max <= 0 ? null : (float) $max;

    $textoDoBotao = $button ?? ($multiple ? 'Escolher arquivos' : 'Escolher arquivo');

    /*
     * As classes do `x-ui.button variant="secondary"` em cada tamanho,
     * com o ícone na medida do texto. O foco e o desligado vêm do
     * nativo (`peer-has-*`): é ele que recebe o Tab, e o rótulo só o
     * desenha.
     */
    $tamanhos = [
        'sm' => ['h-9 px-3 text-sm', 'size-4'],
        'md' => ['h-10 px-4 text-sm', 'size-4'],
        'lg' => ['h-12 px-5 text-base', 'size-5'],
    ];
    [$medidas, $icone] = $tamanhos[$size] ?? $tamanhos['md'];
@endphp

<div class="group" data-arquivo @if ($maximo !== null) data-arquivo-max="{{ $maximo }}" @endif>
    @if ($label)
        <x-ui.field-label :label="$label" :for="$id" :required="$required" :info="$info" class="mb-1.5" />
    @endif

    <div class="relative flex items-center gap-3">
        {{--
            A caixa é o que o JS esconde (sr-only), como no `x-ui.money`.
            Ela é o `peer`: o botão ao lado acende quando o nativo dentro
            dela tem o foco do teclado, e apaga quando ele é desligado.
        --}}
        <div class="peer min-w-0 flex-1" data-arquivo-nativo-caixa>
            <input type="file"
                   id="{{ $id }}"
                   name="{{ $name }}"
                   @if ($accept) accept="{{ $accept }}" @endif
                   @if ($multiple) multiple @endif
                   @required($required)
                   data-arquivo-nativo
                   {{ $attributes->class([
                       'block w-full text-sm text-neutral-700 dark:text-neutral-300',
                       'file:me-3 file:cursor-pointer file:rounded-lg file:border file:border-solid file:px-3 file:py-2',
                       'file:border-neutral-300 file:bg-white file:text-sm file:font-medium file:text-neutral-900',
                       'dark:file:border-neutral-700 dark:file:bg-neutral-900 dark:file:text-white',
                       'disabled:cursor-not-allowed disabled:opacity-60',
                   ]) }}>
        </div>

        <label for="{{ $id }}"
               data-arquivo-botao
               hidden
               @class([
                   'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap',
                   'transition peer-has-focus-visible:ring-4 peer-has-focus-visible:ring-neutral-400/30',
                   'peer-has-disabled:cursor-not-allowed peer-has-disabled:opacity-60',
                   'bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800',
                   'border-neutral-300 dark:border-neutral-700' => ! $temErro,
                   'border-danger-400 dark:border-danger-500' => $temErro,
                   $medidas,
               ])>
            <x-ui.icon name="upload" class="{{ $icone }}" />
            {{ $textoDoBotao }}
        </label>

        {{-- O JS troca pelo nome e tamanho: "nota.xml (12 KB)", ou "3 arquivos (1,2 MB)". --}}
        <span data-arquivo-nomes hidden class="min-w-0 truncate text-sm text-neutral-500 dark:text-neutral-400">Nenhum arquivo escolhido</span>
    </div>

    @if ($temErro)
        <p class="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{{ $erro }}</p>
    @elseif ($hint)
        <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400" data-campo-dica>{{ $hint }}</p>
    @endif
</div>
