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

    /*
     * A folha de estilo da fonte, carregada pelos layouts do pacote. A
     * família tem de ser a mesma de `--font-sans` no CSS; nulo não
     * carrega nenhuma.
     */
    'font_url' => 'https://fonts.bunny.net/css?family=inter:400,500,600,700',

];
