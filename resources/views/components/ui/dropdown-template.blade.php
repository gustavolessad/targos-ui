@props(['name'])

{{--
    O modelo do menu montado no clique: um por página, para as linhas com
    <x-ui.dropdown template="..."> do mesmo nome. Dentro vão os itens de
    sempre (x-ui.dropdown-item, formulários, x-ui.dropdown-separator).

    Na primeira abertura do menu de uma linha, o dropdown.js copia o
    modelo e o preenche com os `values` dela:

    - `{chave}`, ou `{chave.campo}`, em qualquer atributo ou texto vira o
      valor da linha;
    - o elemento com `data-mostra-se="chave"` só fica se a chave tiver
      valor (null, false e texto vazio tiram);
    - o separador que sobra (no começo, no fim ou repetido) sai;
    - o campo com `data-codigo-unico` ganha um código novo em cada cópia.

    Por quê: desenhar o menu inteiro em cada linha (itens, ícones,
    formulários) custa mais que todo o resto da linha, para um menu que
    se abre um de cada vez.
--}}
<template data-modelo-menu="{{ $name }}">
    {{ $slot }}
</template>
