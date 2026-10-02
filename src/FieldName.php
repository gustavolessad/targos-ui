<?php

declare(strict_types=1);

namespace Targos\Ui;

/**
 * O nome de um campo nas três formas em que ele aparece.
 *
 * No HTML o campo de uma linha repetida chama-se `items[0][price]`. Para
 * `old()` e para `$errors` o Laravel o conhece por `items.0.price`, e um
 * `id` não pode ter colchetes — e precisa ser único mesmo quando dois
 * formulários da mesma tela têm um campo com o mesmo nome.
 *
 * Todo componente de campo passa por aqui, para os três concordarem.
 */
final class FieldName
{
    /** `items[0][price]` → `items.0.price`; `tags[]` → `tags`. */
    public static function key(string $name): string
    {
        return trim(str_replace(['[]', '[', ']'], ['', '.', ''], $name), '.');
    }

    /**
     * O `id` do campo: o nome com os colchetes trocados por hífen
     * (`items-0-price`), com um prefixo quando a tela o pede.
     *
     * O prefixo é o que separa dois formulários iguais na mesma página
     * (o modal de criar e o de editar): `novo-items-0-price`.
     */
    public static function id(string $name, ?string $prefix = null): string
    {
        $base = trim(preg_replace('/[^A-Za-z0-9_-]+/', '-', str_replace(['[]', '[', ']'], ['', '-', ''], $name)) ?? '', '-');

        return $prefix !== null && $prefix !== '' ? $prefix.'-'.$base : $base;
    }
}
