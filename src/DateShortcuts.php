<?php

declare(strict_types=1);

namespace Targos\Ui;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

/**
 * Os atalhos do seletor de período ("Últimos 7 dias", "Próximo mês"…).
 *
 * Calculados aqui, e não no navegador, para o "hoje" ser o do sistema
 * (horário de Brasília) e não o relógio de quem abre a tela. Atalhos
 * fora de `min`/`max` são recortados; os que ficam vazios somem.
 *
 * O conjunto pode ser um nome pronto (`past`, `future`, `both`, `none`)
 * ou uma lista das chaves de PRESETS, na ordem em que devem aparecer:
 * `:shortcuts="['este_mes', 'mes_passado', 'proximo_mes']"`.
 */
final class DateShortcuts
{
    /** As chaves aceitas numa lista. */
    public const PRESETS = [
        'hoje', 'ontem', 'amanha',
        'ultimos_7_dias', 'ultimos_30_dias', 'proximos_7_dias', 'proximos_30_dias',
        'este_mes', 'mes_passado', 'proximo_mes',
        'este_ano', 'ate_fim_do_ano',
    ];

    /**
     * Os conjuntos prontos: grupo => chaves. Grupo '' não mostra título.
     * `both` põe o que vale para os dois lados (hoje, este mês) no topo,
     * sem repetir.
     */
    private const CONJUNTOS = [
        'past' => ['Passado' => ['hoje', 'ontem', 'ultimos_7_dias', 'ultimos_30_dias', 'este_mes', 'mes_passado', 'este_ano']],
        'future' => ['Próximo' => ['hoje', 'amanha', 'proximos_7_dias', 'proximos_30_dias', 'este_mes', 'proximo_mes', 'ate_fim_do_ano']],
        'both' => [
            '' => ['hoje', 'este_mes'],
            'Passado' => ['ontem', 'ultimos_7_dias', 'ultimos_30_dias', 'mes_passado'],
            'Próximo' => ['amanha', 'proximos_7_dias', 'proximos_30_dias', 'proximo_mes'],
        ],
        'none' => [],
    ];

    /**
     * @param  'none'|'past'|'future'|'both'|list<string>  $conjunto
     * @return list<array{label: string, start: string, end: string, group: string}>
     */
    public static function for(
        string|array $conjunto,
        ?CarbonImmutable $min = null,
        ?CarbonImmutable $max = null,
        ?CarbonImmutable $hoje = null,
    ): array {
        $hoje = ($hoje ?? CarbonImmutable::today())->startOfDay();
        $catalogo = self::catalogo($hoje);

        $grupos = is_array($conjunto) ? ['' => $conjunto] : (self::CONJUNTOS[$conjunto] ?? []);
        $atalhos = [];

        foreach ($grupos as $grupo => $chaves) {
            foreach ($chaves as $chave) {
                if (! isset($catalogo[$chave])) {
                    throw new InvalidArgumentException("Atalho de data desconhecido: {$chave}. Use um de: ".implode(', ', self::PRESETS).'.');
                }

                [$rotulo, $inicio, $fim] = $catalogo[$chave];

                if ($min !== null && $inicio->lt($min)) {
                    $inicio = $min;
                }

                if ($max !== null && $fim->gt($max)) {
                    $fim = $max;
                }

                if ($inicio->gt($fim)) {
                    continue;
                }

                $atalhos[] = [
                    'label' => $rotulo,
                    'start' => $inicio->toDateString(),
                    'end' => $fim->toDateString(),
                    'group' => (string) $grupo,
                ];
            }
        }

        return $atalhos;
    }

    /** @return array<string, array{string, CarbonImmutable, CarbonImmutable}> */
    private static function catalogo(CarbonImmutable $hoje): array
    {
        $fimDoMes = fn (CarbonImmutable $data) => $data->endOfMonth()->startOfDay();
        $mesPassado = $hoje->startOfMonth()->subMonthNoOverflow();
        $proximoMes = $hoje->startOfMonth()->addMonthNoOverflow();

        return [
            'hoje' => ['Hoje', $hoje, $hoje],
            'ontem' => ['Ontem', $hoje->subDay(), $hoje->subDay()],
            'amanha' => ['Amanhã', $hoje->addDay(), $hoje->addDay()],
            'ultimos_7_dias' => ['Últimos 7 dias', $hoje->subDays(6), $hoje],
            'ultimos_30_dias' => ['Últimos 30 dias', $hoje->subDays(29), $hoje],
            'proximos_7_dias' => ['Próximos 7 dias', $hoje, $hoje->addDays(6)],
            'proximos_30_dias' => ['Próximos 30 dias', $hoje, $hoje->addDays(29)],
            'este_mes' => ['Este mês', $hoje->startOfMonth(), $fimDoMes($hoje)],
            'mes_passado' => ['Mês passado', $mesPassado, $fimDoMes($mesPassado)],
            'proximo_mes' => ['Próximo mês', $proximoMes, $fimDoMes($proximoMes)],
            'este_ano' => ['Este ano', $hoje->startOfYear(), $hoje],
            'ate_fim_do_ano' => ['Até o fim do ano', $hoje, $hoje->endOfYear()->startOfDay()],
        ];
    }
}
