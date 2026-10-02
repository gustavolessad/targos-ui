<?php

declare(strict_types=1);

namespace Targos\Ui;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

/**
 * Entrega o design system ao projeto.
 *
 * São duas coisas diferentes:
 *
 * - Os **componentes** (`<x-ui.*>`) ficam aqui e são os mesmos em todo
 *   projeto. O caminho registrado é a pasta que contém `ui/`, e sem
 *   prefixo: é o que faz `<x-ui.button>` ser `<x-ui.button>` nas telas.
 *   Um arquivo em `resources/views/components/ui/` do projeto, com o
 *   mesmo nome, vale no lugar do daqui.
 *
 * - Os **modelos** (layout do painel, barra lateral, tela de login) são
 *   copiados para o projeto por `vendor:publish --tag=ui-templates`, e
 *   dali em diante são dele: montados com os componentes, editáveis à
 *   vontade.
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

        $this->publishes([__DIR__.'/../stubs/views' => resource_path('views')], 'ui-templates');
    }
}
