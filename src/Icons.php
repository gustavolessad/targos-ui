<?php

declare(strict_types=1);

namespace Targos\Ui;

use Composer\InstalledVersions;
use Illuminate\Support\Facades\Cache;

/**
 * O conjunto de ícones disponíveis, do Lucide.
 *
 * Quem pergunta é o `<x-ui.icon>`, que não desenha o que não existe.
 *
 * A lista sai da pasta do pacote e fica em cache: são mais de dois mil
 * arquivos, e varrer o disco a cada ícone de cada página seria caro
 * numa tela que desenha dezenas deles.
 */
final class Icons
{
    private const CACHE_KEY = 'icons:lucide';

    private const TTL = 86400;

    private const PACKAGE = 'mallardduck/blade-lucide-icons';

    /** @var list<string>|null */
    private static ?array $memoria = null;

    /** @var array<string, int>|null Os nomes como chaves: perguntar se existe é direto, não uma busca na lista. */
    private static ?array $indice = null;

    /**
     * Se o desenho existe no conjunto.
     *
     * Pelo índice (as chaves), e não `in_array` na lista: são mais de dois
     * mil nomes, e a pergunta vem a cada ícone de cada página — centenas
     * numa tabela de cobranças.
     */
    public static function exists(string $name): bool
    {
        return isset((self::$indice ??= array_flip(self::all()))[$name]);
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
