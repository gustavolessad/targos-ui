<?php

declare(strict_types=1);

namespace Targos\Ui;

/**
 * Quantos itens por página a tabela mostra: o que a pessoa escolheu no
 * seletor "Por página" (`?por_pagina=50`), se for uma das opções de
 * `config('ui.pagination.options')`; senão, o padrão da tela.
 *
 *     $clientes = Cliente::query()->paginate(PerPage::resolve(30));
 *
 * Só as opções valem: `?por_pagina=100000` na URL não vira uma consulta
 * de cem mil linhas.
 */
final class PerPage
{
    public static function resolve(int $padrao = 30): int
    {
        $escolhido = (int) request()->query(self::parameter());

        return in_array($escolhido, self::options($padrao), true) ? $escolhido : $padrao;
    }

    /**
     * As quantidades do seletor, com o padrão da tela entre elas (e em ordem).
     *
     * @return list<int>
     */
    public static function options(int $padrao = 30): array
    {
        $opcoes = array_map('intval', (array) config('ui.pagination.options', [15, 30, 50, 100]));
        $opcoes[] = $padrao;
        $opcoes = array_values(array_unique($opcoes));
        sort($opcoes);

        return $opcoes;
    }

    public static function parameter(): string
    {
        return (string) config('ui.pagination.parameter', 'por_pagina');
    }
}
