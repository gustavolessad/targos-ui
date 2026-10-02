<?php

declare(strict_types=1);

namespace Targos\Ui;

/**
 * Valores em reais: o que o campo `<x-ui.money>` precisa para ler e
 * mostrar o valor. No navegador, o par é resources/js/money.js.
 *
 * O projeto que tem o próprio formatador pode delegar para cá, para os
 * dois lados concordarem sobre o que é um valor.
 */
final class Money
{
    /**
     * `1500.00` (o que o banco guarda e o formulário envia), ou null se não for número.
     *
     * `$scale` é o número de casas. O padrão, 2, é o do valor em reais;
     * custo unitário e percentual guardam 4 (`3.9505`), e normalizá-los
     * com 2 arredondaria o que o banco tem antes mesmo de alguém digitar.
     */
    public static function normalize(mixed $valor, int $scale = 2): ?string
    {
        if ($valor instanceof \Stringable) {
            $valor = (string) $valor;
        }

        if (is_int($valor) || is_float($valor) || (is_string($valor) && is_numeric($valor))) {
            return number_format((float) $valor, max(0, $scale), '.', '');
        }

        return null;
    }

    /** `1.500,00`; vazio ou inválido vira `0,00`. */
    public static function format(mixed $valor): string
    {
        return number_format(abs((float) (self::normalize($valor) ?? 0)), 2, ',', '.');
    }

    /** `R$ 1.500,00` (negativo: `-R$ 10,50`). */
    public static function brl(mixed $valor): string
    {
        $negativo = (float) (self::normalize($valor) ?? 0) < 0;

        return ($negativo ? '-' : '').'R$ '.self::format($valor);
    }
}
