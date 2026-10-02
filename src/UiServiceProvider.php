<?php

declare(strict_types=1);

namespace Targos\Ui;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

/**
 * Entrega os componentes do design system ao projeto.
 *
 * O caminho registrado é a pasta que **contém** `ui/`, e sem prefixo:
 * é o que faz `<x-ui.button>` ser `<x-ui.button>` nas telas, como se
 * os componentes morassem em `resources/views/components/ui` do projeto.
 *
 * O projeto vem antes: um arquivo em `resources/views/components/ui/`
 * dele substitui o componente de mesmo nome daqui.
 */
final class UiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/ui.php', 'ui');
    }

    public function boot(): void
    {
        Blade::anonymousComponentPath(__DIR__.'/../resources/views/components');

        $this->publishes([__DIR__.'/../config/ui.php' => config_path('ui.php')], 'ui-config');
    }
}
