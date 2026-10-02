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
        'aviso' => ['warning', 'aviso'],
        'erro' => ['error', 'erro'],
    ],

];
