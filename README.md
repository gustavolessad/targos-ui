# targos/ui

O design system da Targos para projetos Laravel: componentes Blade (`<x-ui.*>`),
tokens de Tailwind 4 e JavaScript sem framework, guiado por atributos `data-*`.

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `resources/views/components/ui` | Os componentes Blade: campos, botões, tabela, modal, toast, e a casca do painel (layout, barra lateral, cabeçalho da tela) |
| `resources/css/theme.css` | Tokens (cores, fonte, animação), tema escuro por classe `.dark`, `.scroll-discreto` |
| `resources/js` | Um módulo por comportamento, e o `index.js` que reexporta tudo |
| `config/ui.php` | As poucas decisões que mudam de projeto para projeto |
| `src/UiServiceProvider.php` | Registra os componentes e a configuração (descoberto sozinho pelo Laravel) |
| `src/Icons.php` | A lista de ícones do Lucide, usada pelo `<x-ui.icon>` |
| `tests/js` | Testes das funções puras (`npm test`) |

Fica **fora** do pacote o que é de cada projeto: os itens do menu, o logo, os
componentes de domínio e os scripts das telas.

## Instalação num projeto

### 1. Composer

O repositório é privado: a máquina precisa de acesso de leitura a ele (chave SSH
de deploy ou token do GitHub no `auth.json` do Composer).

```json
"repositories": [
    { "type": "vcs", "url": "https://github.com/gustavolessad/targos-ui.git" }
],
"require": {
    "targos/ui": "^1.0"
}
```

Para mexer no pacote e ver o resultado na hora num projeto ao lado, troque o
repositório pelo caminho local:

```json
"repositories": [
    { "type": "path", "url": "../targos-ui", "options": { "symlink": true } }
],
"require": {
    "targos/ui": "@dev"
}
```

### 2. Dependências de front

```bash
npm install -D tailwindcss @tailwindcss/vite @tailwindcss/forms
```

### 3. CSS (`resources/css/app.css`)

```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';

@source '../views';
@source '../js';

@import '../../vendor/targos/ui/resources/css/theme.css';
```

O `theme.css` já declara os `@source` das views e do JavaScript do pacote.

### 4. JavaScript

No `vite.config.js`, o apelido e a recarga ao mexer num componente:

```js
import { fileURLToPath } from 'node:url';

laravel({
    input: ['resources/css/app.css', 'resources/js/app.js'],
    refresh: ['resources/views/**', 'routes/**', 'vendor/targos/ui/resources/views/**'],
}),

resolve: {
    alias: {
        '@targos-ui': fileURLToPath(new URL('./vendor/targos/ui/resources/js/index.js', import.meta.url)),
    },
},
```

No `resources/js/app.js`:

```js
import { ligarUi } from '@targos-ui';

document.addEventListener('DOMContentLoaded', () => {
    ligarUi(() => {
        // Os módulos do projeto entram aqui, antes do `ligarEnvios`.
    });
});
```

Quem precisa de outra ordem importa as funções uma a uma (`ligarMascaras`,
`ligarCamadas`, …) do mesmo `@targos-ui`.

### 5. Layout

O projeto cria os próprios layouts, finos, em cima da casca do pacote.

`resources/views/components/layouts/panel.blade.php`:

```blade
@props(['title' => null])

<x-ui.layouts.panel :title="$title" app-name="Meu Sistema"
                    :favicon="asset('favicon.png')" sidebar="admin.sidebar">
    <x-slot:user>
        @auth
            <x-ui.user-menu :name="auth()->user()->name" :email="auth()->user()->email"
                            :logout="route('logout')" />
        @endauth
    </x-slot:user>

    {{ $slot }}
</x-ui.layouts.panel>
```

`resources/views/components/admin/sidebar.blade.php` (o nome passado em `sidebar`):

```blade
<x-ui.sidebar>
    <x-slot:logo><a href="{{ route('dashboard') }}">Meu Sistema</a></x-slot:logo>

    <div class="space-y-0.5">
        <x-ui.nav-item icon="layout-dashboard" :href="route('dashboard')" match="dashboard">Início</x-ui.nav-item>

        <x-ui.nav-group icon="wallet" label="Financeiro" match="finance.*">
            <x-ui.nav-item :href="route('finance.index')" match="finance.index">Lançamentos</x-ui.nav-item>
        </x-ui.nav-group>
    </div>
</x-ui.sidebar>
```

A barra lateral é desenhada duas vezes (fixa no computador, gaveta no celular):
o que tiver `id` dentro dela precisa de um por desenho.

Para as páginas sem barra lateral (login), `<x-ui.layouts.guest>`.

O topo de cada tela é o `<x-ui.page-header title="…" back="…" :breadcrumbs="[…]">`,
com as ações no slot.

## Personalização

Do mais leve ao mais pesado:

1. **Tokens.** Redeclare no `app.css` do projeto, depois do import:

   ```css
   @theme {
       --color-primary-600: #41a741;
       --font-sans: 'Roboto', sans-serif;
   }
   ```

   Trocando a fonte, troque também `font_url` na configuração.

2. **Configuração.** `php artisan vendor:publish --tag=ui-config` cria o
   `config/ui.php` do projeto:

   | Chave | O que decide |
   |---|---|
   | `falsy` | Se checkbox e interruptor enviam "0" quando desmarcados (padrão: não) |
   | `toast` | As chaves de sessão que viram toast, por tipo |
   | `font_url` | A folha de estilo da fonte carregada pelos layouts |

3. **Props e classes.** Variante e tamanho são props; classes de posicionamento
   (margem, largura) passam direto no componente.

4. **Composição.** O projeto cria os próprios componentes usando os `x-ui.*`
   por dentro.

5. **Substituir um componente.** Um arquivo em
   `resources/views/components/ui/` do projeto, com o mesmo nome, vale no lugar
   do do pacote. É a saída de emergência: esse arquivo deixa de receber
   atualizações.

6. **Mudar o pacote.** O que serve a mais de um projeto vira prop ou
   configuração aqui, e sai numa versão nova.

## Comportamentos por atributo

| Atributo | O que faz |
|---|---|
| `data-abre-modal="id"` / `data-fecha-modal` | Abre e fecha um `<x-ui.modal>` |
| `data-abre-offcanvas="id"` | Abre um `<x-ui.offcanvas>` |
| `data-abre-menu="id"` | Abre um menu (`data-menu`) |
| `data-confirmar="texto"` | Pergunta antes de enviar o formulário; `data-confirmar-perigo` pinta de vermelho |
| `data-copiar="texto"` | Copia e avisa com um toast; dispara o evento `ui:copiado` |
| `data-imprimir` | Abre a impressão do navegador |
| `data-troca-tema` | Alterna claro e escuro |

No JavaScript, `window.mostrarToast(tipo, texto)` mostra um aviso sem recarregar
a página.

## Convenções

- Cor só por token de significado (`primary`, `success`, `danger`, `warning`,
  `info`) ou pela família `neutral`. Azul é ação, nunca estado.
- Variante e tamanho são props que escolhem classes num mapa dentro do
  componente — nunca classes conflitantes vindas de fora.
- Camadas (z-index): 20–30 menus, 40 barra lateral e topo, 50 dica, 60 modal e
  gaveta, 70 toast.
- Os textos dos componentes estão em português.

## Versões

Versionamento semântico, por tag do Git. Mudança que quebra uma tela existente
(prop renomeada, componente removido) sobe o primeiro número.

## Testes

```bash
npm test
```

Os componentes Blade são testados pelos projetos que os usam (a suíte do
sistema-targos renderiza todos).
