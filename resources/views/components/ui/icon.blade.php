@props(['name'])

@php
    /*
     * Os ícones do painel, do Lucide (lucide.dev).
     *
     * Vêm do pacote `mallardduck/blade-lucide-icons`, que traz os mais
     * de dois mil do conjunto e os desenha no servidor — não há
     * JavaScript envolvido, e o SVG chega pronto no HTML.
     *
     * O nome é o do Lucide: `name="receipt"`, com o tamanho na classe
     * (`size-4`).
     *
     * O tamanho padrão só entra se quem chamou não pediu outro:
     * concatenar duas classes de tamanho deixa a decisão com a ordem no
     * CSS, não com a do atributo, e `size-5` vencia todo `size-4` do
     * projeto em silêncio.
     */
    $temTamanho = str_contains((string) $attributes->get('class'), 'size-');

    $classes = trim(($temTamanho ? '' : 'size-5 ').'shrink-0 '.(string) $attributes->get('class'));

    /*
     * O ícone que não existe some, e não derruba a página.
     *
     * Um nome que saiu do conjunto numa atualização do Lucide viraria
     * exceção no meio da tela. Sem o desenho, o texto ao lado continua
     * de pé.
     */
    $existe = \Targos\Ui\Icons::exists($name);
@endphp

@if ($existe)
    {{ svg('lucide-'.$name, $classes, $attributes->except('class')->getAttributes() + ['aria-hidden' => 'true']) }}
@endif
