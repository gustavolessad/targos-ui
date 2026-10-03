<?php

declare(strict_types=1);

namespace Targos\Ui;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
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
 *
 * Quando a opção precisa dizer mais que o nome (o produto de uma venda: o
 * código e o saldo embaixo do nome, o preço e a unidade para a tela
 * preencher outros campos), `caption` dá a segunda linha e `extra` os
 * dados que a tela recebe ao escolher:
 *
 *     return SelectOptions::response(
 *         $produtos,
 *         fn ($p) => $p->nome,
 *         caption: fn ($p) => "{$p->codigo} · saldo {$p->saldo}",
 *         extra: fn ($p) => ['price' => $p->preco, 'unit' => $p->unidade],
 *     );
 *
 * Cada opção vira `{ "value", "label", "caption", "extra" }`; `caption` e
 * `extra` só vêm quando a closure é passada (e valem `null` no item que
 * não tem).
 */
final class SelectOptions
{
    /** O que a pessoa digitou na busca (vazio ao abrir o select). */
    public static function term(): string
    {
        // Só texto: `?q[]=x` na URL não pode derrubar o endpoint.
        $termo = request()->query('q', '');

        return is_string($termo) ? trim($termo) : '';
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
     * @param  ?Closure(mixed): ?string  $caption  a segunda linha da opção, em letra menor (o código, o saldo)
     * @param  ?Closure(mixed): ?array<array-key, mixed>  $extra  os dados que a tela recebe ao escolher (o preço, a unidade)
     */
    public static function response(
        iterable $itens,
        Closure $rotulo,
        ?Closure $valor = null,
        ?Closure $caption = null,
        ?Closure $extra = null,
    ): JsonResponse {
        $valor ??= fn (mixed $item): int|string => $item->id;
        $opcoes = [];

        foreach ($itens as $item) {
            $opcao = ['value' => (string) $valor($item), 'label' => (string) $rotulo($item)];

            if ($caption !== null) {
                $opcao['caption'] = self::caption($caption($item));
            }

            if ($extra !== null) {
                $opcao['extra'] = self::extra($extra($item));
            }

            $opcoes[] = $opcao;
        }

        return response()->json($opcoes);
    }

    /**
     * A segunda linha como o select a usa: texto, ou `null` quando não há
     * (o vazio não ocupa uma linha à toa).
     */
    public static function caption(mixed $texto): ?string
    {
        $texto = $texto === null ? '' : trim((string) $texto);

        return $texto === '' ? null : $texto;
    }

    /**
     * Os dados da opção como o select os usa: um array, ou `null` quando
     * não há. O array vazio também é `null` — em JSON ele sairia `[]`, uma
     * lista, e a tela esperaria um objeto.
     *
     * @return ?array<array-key, mixed>
     */
    public static function extra(mixed $dados): ?array
    {
        if ($dados instanceof Arrayable) {
            $dados = $dados->toArray();
        }

        return is_array($dados) && $dados !== [] ? $dados : null;
    }
}
