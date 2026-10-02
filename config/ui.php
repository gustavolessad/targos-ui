<?php

declare(strict_types=1);

return [

    /*
     * O campo escondido com "0" antes do checkbox e do interruptor.
     *
     * Desligado: o campo desmarcado simplesmente não é enviado, e o
     * controller pergunta `$request->has('campo')`.
     *
     * Ligado: desmarcado chega como "0", e o controller lê
     * `$request->boolean('campo')`.
     *
     * Vale para o projeto inteiro; cada campo pode decidir por si com a
     * prop `falsy`.
     */
    'falsy' => false,

    /*
     * As chaves de sessão que o `<x-ui.toast />` mostra, por tipo. A
     * primeira com texto vale.
     */
    'toast' => [
        'sucesso' => ['success', 'sucesso'],
        'info' => ['info'],
        'aviso' => ['warning', 'aviso'],
        'erro' => ['error', 'erro'],
    ],

    /*
     * Quantos segundos o toast de cada tipo fica na tela antes de sumir
     * sozinho; `null`, até a pessoa fechar no X. O aviso e o erro ficam:
     * muitas vezes são a mensagem da API, que só existe ali.
     */
    'toast_seconds' => [
        'sucesso' => 5,
        'info' => 5,
        'aviso' => null,
        'erro' => null,
    ],

    /*
     * A paginação das tabelas: as quantidades do seletor "Por página" e
     * o parâmetro da URL que a leva (`?por_pagina=50`). O controller lê
     * com `Targos\Ui\PerPage::resolve(30)`.
     */
    'pagination' => [
        'options' => [15, 30, 50, 100],
        'parameter' => 'por_pagina',
    ],

    /*
     * O select com busca no servidor (`<x-ui.select :source="...">`):
     * quantas opções cada busca traz. Ao abrir, vêm as primeiras; ao
     * digitar, as que batem. O endpoint lê com `Targos\Ui\SelectOptions`.
     */
    'select' => [
        'limit' => 10,
    ],

];
