<?php

declare(strict_types=1);

namespace Targos\Ui;

use Closure;
use Illuminate\Http\JsonResponse;

/**
 * O lado do servidor do `<x-ui.select :source="...">`: o endpoint que a
 * busca chama.
 *
 *     public function __invoke(): JsonResponse
 *     {
 *         $clientes = Cliente::query()
 *             ->when(SelectOptions::term(), fn ($q, $termo) => $q->search($termo))
 *             ->orderBy('nome')->limit(SelectOptions::limit())->get();
 *
 *         return SelectOptions::response($clientes, fn ($c) => $c->nome);
 *     }
 *
 * O select manda `?q=` (vazio ao abrir) e espera uma lista de
 * `{ "value": "12", "label": "Padaria" }` — o formato fica aqui, para todo
 * endpoint responder igual.
 */
final class SelectOptions
{
    /** O que a pessoa digitou na busca (vazio ao abrir o select). */
    public static function term(): string
    {
        return trim((string) request()->query('q', ''));
    }

    /** Quantas opções cada busca traz: `config('ui.select.limit')`. */
    public static function limit(): int
    {
        return max(1, (int) config('ui.select.limit', 10));
    }

    /**
     * A resposta da busca.
     *
     * @param  iterable<mixed>  $itens
     * @param  Closure(mixed): string  $rotulo  o texto da opção
     * @param  ?Closure(mixed): (int|string)  $valor  o valor que vai no formulário (padrão: o `id`)
     */
    public static function response(iterable $itens, Closure $rotulo, ?Closure $valor = null): JsonResponse
    {
        $valor ??= fn (mixed $item): int|string => $item->id;
        $opcoes = [];

        foreach ($itens as $item) {
            $opcoes[] = ['value' => (string) $valor($item), 'label' => $rotulo($item)];
        }

        return response()->json($opcoes);
    }
}
