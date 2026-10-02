# targos/ui

O design system da Targos para projetos Laravel: componentes Blade (`<x-ui.*>`),
tokens de Tailwind 4 e JavaScript sem framework, guiado por atributos `data-*`.

São duas coisas diferentes:

- **Componentes** são o padrão. Moram no pacote, são os mesmos em todo projeto,
  e a aparência de cada um se escolhe por prop (variante, tamanho, cor).
- **Modelos** são telas e layouts prontos, montados com os componentes. O
  pacote os copia para o projeto, e dali em diante são do projeto: editáveis à
  vontade.

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `resources/views/components/ui` | Os componentes Blade: campos, botões, tabela, modal, toast, e as peças do painel (barra lateral, barra superior, área de conteúdo, cabeçalho da tela) |
| `stubs/views` | Os modelos: layout do painel, layout sem barra lateral, barra lateral e tela de login |
| `resources/css/theme.css` | Tokens (cores, fonte, animação), tema escuro por classe `.dark`, `.scroll-discreto` |
| `resources/js` | Um módulo por comportamento, e o `index.js` que reexporta tudo |
| `config/ui.php` | As poucas decisões que mudam de projeto para projeto |
| `src/UiServiceProvider.php` | Registra os componentes e a configuração (descoberto sozinho pelo Laravel) |
| `src/Icons.php` | A lista de ícones do Lucide, usada pelo `<x-ui.icon>` |
| `tests/js` | Testes das funções puras (`npm test`) |

Fica **fora** do pacote o que é de cada projeto: as telas, os itens do menu, o
logo, os componentes de domínio e os scripts das telas.

## Instalação num projeto

### 1. Composer

O repositório é privado: a máquina precisa de acesso de leitura a ele (chave SSH
de deploy ou token do GitHub no `auth.json` do Composer).

```json
"repositories": [
    { "type": "vcs", "url": "https://github.com/gustavolessad/targos-ui.git" }
],
"require": {
    "targos/ui": "^1.2"
}
```

O pacote é sempre instalado pelo Git, por versão. Uma mudança só chega aos
projetos depois de uma tag nova (veja o [GUIA](GUIA.md), seção 5).

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

### 5. Modelos

```bash
php artisan vendor:publish --tag=ui-templates
```

Cria no projeto, sem sobrescrever o que já existir:

| Arquivo | O que é |
|---|---|
| `resources/views/components/layouts/panel.blade.php` | O layout do painel: `<x-layouts.panel title="…">` |
| `resources/views/components/layouts/guest.blade.php` | O layout sem barra lateral (login, páginas públicas) |
| `resources/views/components/admin/sidebar.blade.php` | A barra lateral, com um menu de exemplo |
| `resources/views/auth/login.blade.php` | A tela de login (espera a rota `login`) |

São arquivos do projeto: troque o logo, os itens do menu, o favicon, a fonte,
acrescente campos ao login. O desenho de cada parte continua vindo dos
componentes (`x-ui.sidebar`, `x-ui.nav-item`, `x-ui.topbar`, `x-ui.content`,
`x-ui.user-menu`, `x-ui.confirm`, `x-ui.toast`), então uma correção de visual
chega pela atualização do pacote; uma mudança no **arranjo** de um modelo, não —
essa cada projeto aplica no próprio arquivo.

A barra lateral é desenhada duas vezes pelo layout (fixa no computador, gaveta
no celular): o que tiver `id` dentro dela precisa de um por desenho.

### Barra lateral recolhível

O `<x-ui.sidebar-toggle drawer="menu-painel" />`, no slot `start` da barra
superior, encolhe a barra lateral para uma coluna de ícones (no celular, abre
a gaveta). A escolha fica guardada no navegador e é aplicada antes da primeira
pintura pelo `<x-ui.theme-script />`.

- Os componentes do menu já sabem se recolher. O que é do layout do projeto
  é a largura: `w-64 recolhida:w-16` na barra e `lg:ps-64 recolhida:ps-16` no
  conteúdo (o modelo `layouts/panel` já vem assim).
- O slot `symbol` do `x-ui.sidebar` recebe o logo reduzido.
- Recolhida, o nome de cada item aparece numa dica à direita, e o grupo abre
  um menu com os itens dele ao passar o mouse.
- A variante `recolhida:` serve a qualquer classe (`recolhida:hidden`,
  `recolhida:justify-center`) no que o projeto puser dentro da barra. Para
  ganhar a dica, o elemento declara `data-barra-dica="Nome"`.

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

   Trocando a fonte, troque também o `<link>` dela nos layouts do projeto.

2. **Configuração.** `php artisan vendor:publish --tag=ui-config` cria o
   `config/ui.php` do projeto:

   | Chave | O que decide |
   |---|---|
   | `falsy` | Se checkbox e interruptor enviam "0" quando desmarcados (padrão: não) |
   | `toast` | As chaves de sessão que viram toast, por tipo |

3. **Props e classes.** Variante e tamanho são props; classes de posicionamento
   (margem, largura) passam direto no componente.

4. **Composição.** O projeto cria as próprias telas e componentes usando os
   `x-ui.*` por dentro. Os modelos publicados são isso: edite-os.

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
| `data-recolhe-barra` | Recolhe e expande a barra lateral |

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

Versionamento por tag do Git.

- **1.3.2** — A barra recolhida mantém a margem lateral de `px-3`.
- **1.3.1** — Na barra recolhida, a dica do item usa o mesmo cartão do menu
  do grupo (claro no tema claro, escuro no escuro).
- **1.3.0** — Barra lateral recolhível: `x-ui.sidebar-toggle`, variante
  `recolhida:`, slot `symbol` no `x-ui.sidebar`, dica com o nome do item e
  menu flutuante do grupo. O layout do projeto ganha as classes de largura
  (veja o modelo `layouts/panel`); quem liga os módulos um a um no `app.js`
  acrescenta `ligarBarraLateral()`.
- **1.2.4** — Itens do menu lateral com `px-3 py-2.5`.
- **1.2.3** — Itens do menu lateral mais altos (`p-3`) e com ícone maior
  (`size-5`), no item simples e no título do grupo.
- **1.2.2** — Documentação: o pacote é sempre instalado pelo Git; saem as
  instruções de apontar o projeto para a pasta local.
- **1.2.1** — Novo ícone de carregamento no botão que envia o formulário:
  anel fino com um arco girando, no tamanho do texto do botão.
- **1.2.0** — Os itens do `x-ui.nav-group` entram com animação ao abrir
  (`animate-descer`, novo token). Quem liga os módulos um a um no `app.js`
  acrescenta `ligarMenuLateral()`.
- **1.1.2** — O menu do dropdown vira para cima quando não cabe embaixo (e
  o contrário); o painel do select e do calendário fica inteiro na janela
  quando não cabe em nenhum dos lados.
- **1.1.1** — Guia de uso (`GUIA.md`).
- **1.1.0** — Layouts e login passam a ser modelos publicáveis
  (`ui-templates`); saem os componentes `x-ui.layouts.panel` e
  `x-ui.layouts.guest` e a chave `font_url`. Entram `x-ui.topbar`,
  `x-ui.content` e `x-ui.theme-toggle`.
- **1.0.0** — Extração a partir do sistema-targos.

## Testes

```bash
npm test
```

Os componentes Blade são testados pelos projetos que os usam (a suíte do
sistema-targos renderiza todos).
