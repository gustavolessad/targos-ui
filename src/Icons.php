<?php

declare(strict_types=1);

namespace Targos\Ui;

use Composer\InstalledVersions;
use Illuminate\Support\Facades\Cache;

/**
 * O conjunto de ícones disponíveis: os do Lucide e os do projeto.
 *
 * Quem pergunta é o `<x-ui.icon>`, que não desenha o que não existe.
 *
 * A lista do Lucide sai da pasta do pacote e fica em cache: são mais de
 * dois mil arquivos, e varrer o disco a cada ícone de cada página seria
 * caro numa tela que desenha dezenas deles.
 *
 * Os do projeto são views: `resources/views/components/ui/icons/{nome}.blade.php`
 * (o Pix, a marca de um cartão — o que o Lucide não tem). O do projeto
 * vence o do Lucide de mesmo nome. A pergunta vai ao localizador de
 * views, que é quem resolve `x-ui.icons.pix`, e a resposta fica
 * guardada na memória do processo (`forget()` a esquece): cada nome
 * custa uma procura, não uma por ícone desenhado.
 */
final class Icons
{
    /** O prefixo das views de ícone do projeto: `components/ui/icons/pix.blade.php` é `components.ui.icons.pix`. */
    public const CUSTOM_VIEW = 'components.ui.icons';

    private const CACHE_KEY = 'icons:lucide';

    private const TTL = 86400;

    private const PACKAGE = 'mallardduck/blade-lucide-icons';

    /** @var list<string>|null */
    private static ?array $memoria = null;

    /** @var array<string, int>|null Os nomes como chaves: perguntar se existe é direto, não uma busca na lista. */
    private static ?array $indice = null;

    /** @var array<string, bool> Se o projeto tem o ícone, por nome — perguntado ao localizador de views uma vez por processo. */
    private static array $personalizados = [];

    /**
     * Se o desenho existe: no projeto ou no Lucide.
     *
     * Pelo índice (as chaves), e não `in_array` na lista: são mais de dois
     * mil nomes, e a pergunta vem a cada ícone de cada página — centenas
     * numa tabela de cobranças.
     */
    public static function exists(string $name): bool
    {
        return self::isCustom($name) || isset((self::$indice ??= array_flip(self::all()))[$name]);
    }

    /**
     * Se o projeto desenha este ícone por conta própria
     * (`resources/views/components/ui/icons/{nome}.blade.php`).
     *
     * Só nomes que podem ser nome de view: um nome vindo de dados (o
     * `empty` do `x-ui.image`) com ponto ou barra não vira uma procura
     * em outra pasta.
     */
    public static function isCustom(string $name): bool
    {
        if ($name === '' || preg_match('/^[a-z0-9][a-z0-9_-]*$/i', $name) !== 1) {
            return false;
        }

        return self::$personalizados[$name] ??= view()->exists(self::customView($name));
    }

    /** A view do ícone do projeto, pelo nome. */
    public static function customView(string $name): string
    {
        return self::CUSTOM_VIEW.'.'.$name;
    }

    /**
     * Todos os nomes, em ordem alfabética.
     *
     * @return list<string>
     */
    public static function all(): array
    {
        /*
         * Duas camadas: o cache atravessa requisições, e a estática
         * evita ir ao cache uma vez por ícone desenhado na mesma
         * página — são dezenas em qualquer tela do painel.
         */
        return self::$memoria ??= Cache::remember(
            self::CACHE_KEY,
            self::TTL,
            function (): array {
                $arquivos = glob(self::path().'/*.svg') ?: [];

                $nomes = array_map(
                    fn (string $caminho): string => basename($caminho, '.svg'),
                    $arquivos,
                );

                sort($nomes);

                return $nomes;
            },
        );
    }

    /** Esquece a lista: para depois de trocar a versão do pacote. */
    public static function forget(): void
    {
        self::$memoria = null;
        self::$indice = null;
        self::$personalizados = [];
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Onde o Composer instalou os desenhos.
     *
     * Perguntado a ele, e não montado a partir de `base_path('vendor')`:
     * o projeto pode ter a pasta de dependências em outro lugar.
     */
    private static function path(): string
    {
        $pacote = InstalledVersions::getInstallPath(self::PACKAGE) ?? base_path('vendor/'.self::PACKAGE);

        return $pacote.'/resources/svg/icons';
    }
}
