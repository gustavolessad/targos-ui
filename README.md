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
| `src/Icons.php` | A lista de ícones do Lucide e os desenhados pelo projeto, usada pelo `<x-ui.icon>` |
| `src/Money.php`, `src/DateShortcuts.php`, `src/FieldName.php` | O valor em reais do `<x-ui.money>` (e as 4 casas do `<x-ui.percent>`), os atalhos do `<x-ui.date-range>` e o nome de campo nas três formas (HTML, `old()`, id) |
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
npm install apexcharts
```

O ApexCharts desenha os gráficos do `<x-ui.chart>`. É obrigatório mesmo no
projeto sem gráfico (o JavaScript do pacote o referencia), mas só é baixado pelo
navegador nas páginas que têm um.

> **Licença do ApexCharts**: gratuita para pessoas e organizações com menos de
> US$ 2 milhões de receita anual; acima disso, exige licença comercial. Confira
> em apexcharts.com/license antes de usar num projeto de cliente grande.

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
com as ações no slot (veja "Cabeçalho da tela").

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
   | `toast` | As chaves de sessão que viram toast, por tipo (`sucesso`, `info`, `aviso`, `erro`) |
   | `toast_seconds` | Quantos segundos cada tipo de toast fica na tela; `null`, até o X (padrão: sucesso e info 5, aviso e erro até o X) |
   | `pagination` | As quantidades do seletor "Por página" e o parâmetro da URL (`PerPage::resolve`) |
   | `select` | Quantas opções cada busca do `x-ui.select :source` traz |

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

## Animações

Tokens do `theme.css`, usados como classe do Tailwind:

| Classe | O que faz | Onde o pacote usa |
|---|---|---|
| `animate-surgir` | Surge de 95% com fade, em 150 ms | Painéis que abrem por cima da tela: select, data, tooltip |
| `animate-descer` | Desce 4 px com fade, em 150 ms | Itens de um grupo do menu lateral, ao abrir |
| `animate-entrar` | Sobe 12 px com fade, em 300 ms | — (para o projeto: o cartão das telas de login e cadastro) |

```blade
<div class="w-full max-w-md animate-entrar">
    <x-ui.card>…</x-ui.card>
</div>
```

Quem pede menos movimento no sistema operacional vê tudo aparecer direto: o
`theme.css` desliga as três (`prefers-reduced-motion`), também atrás de
variante (`group-[…]:animate-descer`). Não precisa de `motion-safe:`.

## Abas

```blade
<x-ui.tabs :tabs="['geral' => 'Geral', 'variacoes' => 'Variações']"
           :fields="['geral' => ['name', 'sku'], 'variacoes' => ['variants']]">
    <x-slot:geral>…</x-slot:geral>
    <x-slot:variacoes>…</x-slot:variacoes>
</x-ui.tabs>
```

| Prop | O que é |
|---|---|
| `tabs` | `chave => rótulo`; cada painel é um slot com o nome da chave |
| `active` | A aba aberta; sem ela, a da URL (`?aba=`) |
| `hidden` | As abas que existem mas não aparecem |
| `fields` | Os campos de cada aba: `chave => [nomes ou prefixos]`. Conta os erros de validação de cada aba (`variants` conta `variants.0.sku`) e mostra o número num selo vermelho ao lado do rótulo |
| `icons` | `chave => ícone`: um ícone antes do rótulo, da Lucide (`package`) ou um componente do projeto pelo nome com ponto (`brand.pix`), como no `x-ui.radio-group`. A aba fora do mapa fica só com o rótulo |
| `links` | `chave => URL`: as abas viram links para outras telas. Não há painéis nem campo escondido; o slot é o conteúdo da tela, desenhado abaixo da barra. A aba ativa é a de `active` ou, sem ela, a da URL atual |
| `form` | O `id` do formulário, quando as abas ficam fora dele |

Quando o formulário volta com erro e a aba aberta não tem nenhum, abre a
primeira aba que tem (a não ser que a tela passe `active`). No teclado, as
setas trocam de aba, e Home e End vão às pontas. Cada troca dispara `ui:aba`
no `document`, com `detail: { grupo, aba }`. O campo escondido da aba leva
`data-nao-salvo-ignorar`: trocar de aba não conta como alteração para o
aviso de "Alterações não salvas".

## Cabeçalho da tela

```blade
<x-ui.page-header title="Venda 1.024" back="{{ route('sales.index') }}">
    <x-slot:aside>
        <x-ui.badge color="success" variant="filled">Concluída</x-ui.badge>
        <x-ui.badge color="warning" variant="outline">NFC-e pendente</x-ui.badge>
    </x-slot:aside>

    <x-ui.button variant="warning-soft" icon="undo-2">Devolver</x-ui.button>
</x-ui.page-header>
```

Props: `title`, `subtitle`, `back` (o "Voltar", antes das ações) e
`breadcrumbs` (`[[rótulo, url], …]`, o último sem url). O slot recebe as ações,
à direita. O slot `aside` fica ao lado do título, na linha dele: os selos e
chips que dizem o estado do que a tela mostra. Centrados na altura do título;
quando não cabem (no celular), quebram para baixo dele. O envelope do `aside`
leva `data-cabecalho-selos` e aceita classes (`<x-slot:aside class="ms-1">`).

## Select

```blade
<x-ui.select name="product_id" label="Produto" placeholder="Selecione…" :options="[
    12 => ['label' => 'Café 500 g', 'caption' => 'P-0012 · saldo 12', 'extra' => ['price' => '19.90', 'unit' => 'UN']],
    13 => 'Açúcar 1 kg',
]" />
```

| Prop | O que é |
|---|---|
| `options` | `valor => rótulo`, lista (`['SC', 'SP']`), agrupado (`grouped`) ou árvore (`hierarchical`). O rótulo pode ser `['label' => …, 'caption' => …, 'extra' => […]]`; numa lista, com `value`. O nó da árvore aceita `caption` e `extra` |
| `source` | Busca no servidor: a URL chamada com `?q=` ao abrir e ao digitar; o endpoint responde com `Targos\Ui\SelectOptions::response()` |
| `selected-label`, `selected-caption`, `selected-extra` | Com `source`: o rótulo, a segunda linha e os dados da opção já escolhida, que não vem na página |
| `prefetch` | Com `source`: busca as primeiras opções assim que o JavaScript liga, e o primeiro clique abre sem esperar. Elas ficam guardadas até alguém digitar. Sem `prefetch`, cada abertura busca de novo |
| `remember` | Lembra o enviado quando o formulário volta com erro (padrão). `:remember="false"` no select que não foi enviado — o filtro da listagem com o mesmo nome do campo do modal — para ele não mostrar o valor do outro |
| `hint` | A linha de apoio embaixo do campo, como no `x-ui.input` |
| `readonly` | Só leitura: o gatilho não abre o painel e fica com o fundo apagado (`aria-readonly`), mas o `<select>` **continua no envio** — ao contrário de `disabled`, que o tira do formulário. Vai como `data-readonly` no `<select>`; posto ou tirado depois por script (`select.toggleAttribute('data-readonly', true)`), o gatilho acompanha, como acompanha o `disabled` |
| `multiple` | Várias escolhas: `<select multiple>` com nome de lista (`roles[]`; sem os colchetes, eles entram sozinhos). As escolhidas vêm do `old()` ou do `selected` (array ou Collection). O gatilho mostra chips com "×"; o painel tem uma caixa por opção, com "Limpar" e "Concluir". `required` é "ao menos uma" |

O `caption` é a segunda linha da opção no painel, em letra menor; o gatilho e o
select nativo mostram só o rótulo, e a busca local casa no caption também. O
`extra` são os dados que a tela recebe ao escolher (vão no `data-extra` da
`<option>`, em JSON).

No servidor:

```php
return SelectOptions::response(
    $produtos,
    fn ($p) => $p->name,
    caption: fn ($p) => "{$p->code} · saldo {$p->stock}",
    extra: fn ($p) => ['price' => $p->price, 'unit' => $p->unit, 'stock' => $p->stock],
);
```

Cada opção vira `{ value, label, caption, extra }`. `caption` e `extra` só vêm
quando a closure é passada, e valem `null` no item que não tem.

### Várias escolhas (`multiple`)

```blade
<x-ui.select name="roles[]" label="Papéis" multiple placeholder="Nenhum"
             :options="$roles" :selected="['customer', 'supplier']" required />
```

Clicar numa opção (ou Enter/espaço nela, ou Enter na busca, para a primeira)
alterna a escolha e deixa o painel aberto; Esc, Tab, clique fora e "Concluir"
fecham. O "×" de cada chip tira aquela escolha. Quando o formulário volta com
erro, vale a lista que voltou — e nenhuma, se nada foi enviado —, como na caixa
de lista do `x-ui.checkbox`; no formulário que não foi enviado,
`:remember="false"`. O erro de um item (`roles.1`) também aparece no campo. Com
`source`, o `selected-label` é o mapa dos rótulos das escolhidas
(`:selected-label="$contatos->pluck('name', 'id')"`). No `multiple`, o evento
`ui:selecionado` e o `escolhaDe` falam em listas: `{ values, labels, extras }`.
O preenchimento do modal (`data-form-valores`) aceita a lista no nome do campo.

### A escolha do select

```js
import { escolhaDe } from '@targos-ui';

select.addEventListener('ui:selecionado', (evento) => {
    preco.value = evento.detail.extra?.price ?? '';
});

escolhaDe(select); // { value, label, caption, extra } ou null
```

Quando a escolha muda no painel (opções da página ou da busca), o `<select>`
dispara `ui:selecionado` depois do `change`, subindo pelo DOM, com
`detail: { value, label, caption, extra }`; `extra` é `null` quando não há.
Limpar (a opção do placeholder) também avisa, com `value: ''`. Valor trocado
por script (`select.value = x`) não dispara o evento: leia com
`escolhaDe(select)`, que serve a qualquer hora, inclusive para a opção que veio
marcada do servidor.

## Botão

```blade
<x-ui.button icon="plus">Novo cliente</x-ui.button>
<x-ui.button variant="secondary" size="sm" icon="download" :href="route('export')">Exportar</x-ui.button>
```

`variant` (`primary`, `secondary`, `outline`, `success`, `warning`,
`warning-soft`, `danger`, `danger-soft`, `ghost`, `ghost-contrast`, `inverse`),
`size` (`xs` a `xl`, ou `icon-xs`, `icon-sm`, `icon`, `icon-lg`, `icon-xl` para o botão só de ícone: 28, 36, 40, 48 e 56px, as alturas de `xs`, `sm`, `md`, `lg` e `xl`),
`href` (vira `<a>`) e `icon` (um ícone antes do texto; veja "Ícones").

`warning` é a ação que pede atenção antes de seguir, sem ser destrutiva
(estornar, reabrir, forçar): âmbar cheio com texto escuro — o amarelo não
aguenta texto branco —, um degrau mais claro no tema escuro. `warning-soft` é
o par discreto, como o `danger-soft`, para quando ela não é a ação principal.

```blade
<x-ui.button variant="warning" icon="rotate-ccw">Estornar baixa</x-ui.button>
<x-ui.button variant="warning-soft" size="sm">Reabrir</x-ui.button>
```

**O botão atual.** Com `aria-current` (`step`, `page`, `true`), o botão se
pinta como selecionado na variante dele: no `secondary` e no `outline`, borda
e texto na cor primária e fundo `primary-50`; no `ghost`, o mesmo fundo e
texto; nas discretas (`warning-soft`, `danger-soft`, `ghost-contrast`), um
degrau mais forte, que não muda no hover. As cheias (`primary`, `success`,
`danger`, `warning`, `inverse`) não mudam: já são o destaque — a página atual
do `x-ui.pagination` é um `primary` com `aria-current="page"`. Para a barra de
etapas, as abas feitas de botão:

```blade
<x-ui.button variant="ghost" icon="shopping-cart" data-etapa="items" aria-current="step">Produtos</x-ui.button>
<x-ui.button variant="ghost" icon="user" data-etapa="customer" aria-current="false">Cliente</x-ui.button>
```

`aria-current="false"` (e o valor vazio) não conta: o script que troca a etapa
troca o valor entre os botões, sem tirar o atributo, e o leitor de tela ouve
"etapa atual" no certo. Por trás está a variante `atual:` do `theme.css`
(`&[aria-current]` com valor), que serve a qualquer elemento do projeto.

**Empilhado** (`size="stacked"`): altura livre (mínimo 80px), com o ícone em
cima, o texto e, numa linha própria, o que vier depois no slot — a tecla de
atalho, um valor. Mantém a borda, o raio e a variante. É a grade de escolhas
grandes, como as formas de pagamento de um caixa:

```blade
<x-ui.button variant="secondary" size="stacked" icon="banknote" class="min-w-36" aria-keyshortcuts="1">
    <span>Dinheiro</span>
    <kbd class="font-sans text-xs font-normal opacity-70">1</kbd>
</x-ui.button>
```

Cada filho do slot é uma linha; texto solto também. O ícone sai em `size-6`.

## Ícones

```blade
<x-ui.icon name="receipt" class="size-4" />
<x-ui.icon name="pix" class="size-4 text-success-600" />
```

`name` é um ícone do Lucide (lucide.dev), desenhado no servidor; o tamanho vai
na classe (`size-5` quando não há). O nome que não existe não desenha nada, e
a página continua de pé.

**Os do projeto.** O que o Lucide não tem (o Pix, a bandeira de um cartão, a
marca do cliente) o projeto desenha numa view, sem copiar o componente:

```blade
{{-- resources/views/components/ui/icons/pix.blade.php --}}
<svg {{ $attributes }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="…"/>
</svg>
```

O arquivo em `resources/views/components/ui/icons/{nome}.blade.php` vira o
ícone `{nome}`, chamado como qualquer outro — no `x-ui.icon`, no `icon` do
botão e do selo, no `empty` do `x-ui.image`, nos `icons` do `radio-group`. O
`$attributes` traz o que o SVG do Lucide receberia: as classes (com o tamanho
padrão), os atributos soltos e `aria-hidden="true"` (a não ser que a tela
passe outro). O do projeto vence o do Lucide de mesmo nome. O nome aceita
letras, números, `-` e `_` (sem ponto nem barra). `Targos\Ui\Icons::exists()`
conhece os dois conjuntos, e `Icons::isCustom()` diz se o nome é do projeto.

## Campo de texto: `xl`, ícone e carregando

```blade
<x-ui.input type="search" size="xl" icon="search" :loading="false" loading-label="Buscando…"
            aria-label="Buscar produto" data-busca autocomplete="off" />
```

- **`size="xl"`**: 56px de altura (`h-14`), texto `text-base`. O campo que é o
  centro da tela — a busca do balcão. Os outros degraus continuam: `xs` 28,
  `sm` 36, `md` 40, `lg` 48 (e `cell`, sem envelope).
- **`icon`**: um ícone do Lucide (ou do projeto) à esquerda, dentro do campo.
  O texto recua o bastante para não passar por baixo dele em cada tamanho
  (8px entre o ícone e o texto), e o ícone cresce com o campo (`size-3.5` no
  `xs` a `size-6` no `xl`). Decorativo: quem nomeia o campo é o `label` ou o
  `aria-label`.
- **`loading`**: um indicador girando à direita, dentro do campo, com o texto
  de `loading-label` para o leitor de tela (padrão "Carregando…"). Três
  estados: **sem a prop**, não há indicador; **`:loading="false"`** desenha o
  indicador apagado, à espera do script; **`loading`** (ou `:loading="true"`)
  já o desenha aceso.

**Quem acende e apaga é o atributo `data-carregando` no `<input>`**: o CSS
mostra o indicador quando ele está lá. O script não redesenha nada:

```js
campo.toggleAttribute('data-carregando', buscando);
```

O indicador fica em `[data-campo-carregando]`, irmão logo depois do campo,
numa caixa `relative` só em volta dele (o rótulo e a dica ficam fora). Sem
`icon` nem `loading`, o campo sai exatamente como antes. No `cell`, os dois
são ignorados: a célula não tem onde pô-los.

## Senha: link ao lado do rótulo

O `x-ui.password` tem o slot `aside`, à direita do rótulo e na mesma linha:

```blade
<x-ui.password name="password" label="Senha" required>
    <x-slot:aside>
        <a href="{{ route('password.request') }}" tabindex="-1" class="text-primary-600 hover:underline">Esqueci minha senha</a>
    </x-slot:aside>
</x-ui.password>
```

O slot vem em `text-xs`, o tamanho das dicas. O `tabindex="-1"` tira o link do
caminho do Tab: do usuário o Tab vai direto à senha.

Fora isso, as props de sempre: `name`, `label`, `required`, `hint`, `size` e
`info` (o ícone de explicação ao lado do rótulo).

## Tabela: cabeçalho fixo e corpo endereçável

```blade
<x-ui.table sticky :headers="$colunas" class="max-h-96 overflow-y-auto"
            :body-attributes="['data-linhas' => true]" />
```

- **`sticky`**: o cabeçalho fica no alto enquanto as linhas rolam. Quem rola
  é o contêiner com altura limitada em volta — ou o próprio cartão da tabela,
  com `max-h-*` e `overflow-y-auto` no `class` (que vai nele). O cabeçalho
  ganha o fundo do cartão, opaco nos dois temas, e a linha de baixo dele vira
  sombra das células (a borda do `<thead>` ficaria para trás na rolagem).
- **`body-attributes`**: os atributos do `<tbody>`, num mapa, para o script
  endereçar o corpo — a tela que clona linhas de um `<template>` e as põe ali.
  `true` sai como o próprio nome; `false` e `null` não saem; `class` vale.

Linhas escritas à mão no corpo (sem `x-ui.table.row`) não ganham divisor: o
`class` do `body-attributes` pode trazê-lo (`divide-y divide-neutral-200
dark:divide-neutral-800`), quando nenhuma linha fica escondida.

## Aviso dispensável

```blade
<x-ui.alert type="danger" dismissible data-erro-venda hidden></x-ui.alert>
```

Com `dismissible`, o `x-ui.alert` ganha um X no canto
(`<button data-fecha-alerta aria-label="Fechar o aviso">`). O clique põe
`hidden` no aviso (`[data-alerta]`) e dispara **`ui:alerta-dispensado`** nele,
subindo pelo DOM — quem o mostrou limpa o que o fazia aparecer, para o
próximo desenho não trazê-lo de volta:

```js
raiz.addEventListener('ui:alerta-dispensado', (evento) => {
    if (evento.target.matches('[data-erro-venda]')) {
        estado.erro = null;
    }
});
```

O texto vai num `[data-alerta-texto]`, que o script reescreve sem levar o X
junto (`aviso.querySelector('[data-alerta-texto]').textContent = mensagem`).
Para mostrar de novo, a tela tira o `hidden`. Dispensar o que já está
escondido não avisa outra vez. JS: `ligarAlertas()` (no `ligarUi`, escutando
no `document` uma vez) e `dispensarAlerta(aviso)` para fechar por código
(resources/js/alert.js).

## Lembrar o enviado (`remember`)

Todo campo repreenche com o que foi digitado quando o formulário volta com
erro. Na tela com dois formulários que têm um campo de mesmo nome — o filtro
da listagem e o modal, o modal de criar e o de editar —, o que **não** foi
enviado leva `:remember="false"` (no `x-ui.input`, `:keeps-input="false"`),
senão mostra o valor do outro.

## Grupo de caixas

```blade
<x-ui.checkbox-group name="roles" label="Papéis" required hint="Ao menos um"
                     :options="['customer' => 'Cliente', 'supplier' => 'Fornecedor']"
                     :selected="$person->roles" />
```

Uma lista curta de escolhas, onde um select pesaria: cada caixa é
`roles[]`, e o grupo é o campo — tem rótulo, `hint`, `info`, `required` ("ao
menos uma") e mostra o erro do grupo (`roles`) ou de uma caixa (`roles.0`) uma
vez só. `options` aceita `valor => rótulo` ou uma lista de
`['value', 'label', 'hint', 'disabled']`; `inline` põe as caixas lado a lado;
`remember` como nos outros campos; `selected` é uma lista ou uma Collection.

**Caixa desligada.** A que não se marca nem desmarca fica à vista, apagada (a
caixa, o rótulo e a dica), e marcada se estiver no `selected`:

```blade
<x-ui.checkbox-group name="warehouses" label="Depósitos do PDV"
                     :options="$depositos" :selected="$escolhidos" :disabled="['transit']" />

<x-ui.checkbox-group name="roles" :options="[
    'customer' => 'Cliente',
    'owner' => ['label' => 'Proprietário', 'hint' => 'Definido na assinatura', 'disabled' => true],
]" :selected="['owner']" />
```

`disabled` é a lista dos valores desligados (`[1]` e `['1']` são o mesmo), ou
`true` para o grupo inteiro; a opção também pode dizer por si
(`'disabled' => true`). Como no HTML, a caixa desligada **não vai no envio**,
marcada ou não: o servidor mantém o que já tinha para ela. Por isso, quando o
formulário volta com erro, ela continua como o `selected` diz — o `old()` nada
sabe dela.

## Selo

```blade
<x-ui.badge color="success">Pago</x-ui.badge>
<x-ui.badge color="danger" variant="filled">Vencido</x-ui.badge>
<x-ui.badge color="warning" variant="outline">Em aberto</x-ui.badge>
```

`color` é o significado (`neutral`, `success`, `warning`, `info`, `accent`,
`danger`, `primary`). Três variantes: `soft` (padrão) é o fundo claro e o texto
na cor, em todas as cores; `filled` enche o fundo na cor forte (o `warning`
vira o amarelo com texto escuro), para o estado que tem de saltar de relance,
como pago, vencido ou o período de teste na barra superior; `outline` deixa só
o contorno e o texto na cor, para o estado que acompanha outro na mesma linha
sem competir com ele. `solid` deixou de existir (1.11.1);
`icon` põe um ícone antes do texto (sem texto, o selo fica redondo).

## Cartão

O `<x-ui.card>` aceita os slots `actions` (botões à direita do título, na
mesma linha) e `footer` (rodapé com fundo próprio e o mesmo respiro do corpo):

```blade
<x-ui.card title="Endereço">
    <x-slot:actions><x-ui.button size="sm" variant="secondary">Editar</x-ui.button></x-slot:actions>
    …
    <x-slot:footer><x-ui.button>Salvar</x-ui.button></x-slot:footer>
</x-ui.card>
```

`tone` é o fundo: `raised` (padrão, o card sobre o painel), `sunken` (um
bloco dentro de outro card) ou `success`, `info`, `warning`, `danger` —
fundo e borda tingidos de leve, menos que o `x-ui.alert`, para o quadro de
destaque (o resumo de totais):

```blade
<x-ui.card tone="success" title="Resumo">…</x-ui.card>
```

### Card de indicador

```blade
<x-ui.stat-card label="Vencidos" value="R$ 1.200,00" color="danger" />
```

`color` (`neutral`, `danger`, `warning`, `success`, `info`) é a cor inicial
do número. O `<p>` do número leva `data-stat-valor` e `data-cor`, e a cor sai
do `data-cor`: um script que refaz o total sem recarregar troca os dois —

```js
const numero = card.querySelector('[data-stat-valor]');
numero.textContent = 'R$ 0,00';
numero.dataset.cor = 'success';
```

No `variant="filled"` o número fica no contraste do card, seja qual for o
`data-cor`.

## Gráficos

```blade
<x-ui.chart type="bar" format="money" :labels="['Jul', 'Ago', 'Set']"
            :series="[['name' => 'Recebido', 'data' => [12000, 15400, 9800]]]" />

<x-ui.chart type="donut" :labels="['Pagas', 'Abertas', 'Vencidas']"
            :colors="['success', 'primary', 'danger']" :series="[42, 13, 5]" />
```

| Prop | O que é |
|---|---|
| `type` | O tipo, pelo nome do ApexCharts: `bar`, `line`, `area`, `donut`, `pie`, `radialBar`, `radar`… |
| `series` | Com eixo, uma lista de séries (`name` e `data`); em fatias, uma lista de números |
| `labels` | As categorias do eixo horizontal, ou o nome de cada fatia |
| `height` | Altura em pixels (padrão: 320) |
| `format` | `money`, `percent` ou, sem nada, número |
| `colors` | A cor de cada série, pelo token: `primary`, `success`, `warning`, `danger`, `info`, `neutral` |
| `stacked` | Empilha as séries |
| `options` | Qualquer opção do ApexCharts, mesclada por cima do padrão |

O gráfico acompanha a cor da marca do projeto e o tema escuro, inclusive na
troca pelo botão de tema. Para mexer nele depois de desenhado, a instância do
ApexCharts fica em `elemento.grafico`.

## Comportamentos por atributo

| Atributo | O que faz |
|---|---|
| `data-abre-modal="id"` / `data-fecha-modal` | Abre e fecha um `<x-ui.modal>` |
| `data-abre-offcanvas="id"` / `data-fecha-offcanvas` | Abre e fecha um `<x-ui.offcanvas>`; com `:open="true"`, a gaveta já abre ao carregar, como o modal |
| `data-abre-menu="id"` | Abre um menu (`data-menu`) |
| `data-monta-menu="nome"` + `data-menu-valores` | Monta o menu na primeira abertura, copiando o `<template data-modelo-menu="nome">` da página (vêm de `x-ui.dropdown template` e `x-ui.dropdown-template`; veja o GUIA) |
| `data-mostra-se="chave"` | No modelo do menu, o elemento só fica se a linha tiver a chave |
| `data-codigo-unico` | No modelo do menu, o campo ganha um código novo em cada cópia |
| `data-confirmar="texto"` | Pergunta antes de enviar o formulário; `data-confirmar-perigo` pinta de vermelho; `data-confirmar-titulo` e `data-confirmar-botao` trocam o título e o texto do "Confirmar" só nessa pergunta (no formulário ou no botão que envia; o botão vence). Um `\n` no texto quebra a linha |
| `data-mostra-quando="campo=valor"` | O bloco só aparece quando o campo tem aquele valor (veja "Bloco condicional") |
| `data-sem-envio-implicito` | No `<form>`: o Enter num campo não envia (veja "Enter que não envia") |
| `data-arrastavel` | Uma lista que se reordena (veja "Lista reordenável") |
| `data-modal-estatico` / `data-offcanvas-estatico` | A camada só fecha pelos botões (o `static` do componente) |
| `data-camada-titulo` | O título do `x-ui.modal` e do `x-ui.offcanvas`, para o script trocar o texto (veja "Modal e gaveta") |
| `data-carregando` | No `<input>` de um `x-ui.input` com `loading`: mostra o indicador girando (veja "Campo de texto") |
| `data-fecha-alerta` | O X do `x-ui.alert dismissible`: esconde o aviso e dispara `ui:alerta-dispensado` |
| `data-copiar="texto"` | Copia e avisa com um toast; dispara o evento `ui:copiado` |
| `data-imprimir` | Abre a impressão do navegador |
| `data-troca-tema` | Alterna claro e escuro |
| `data-recolhe-barra` | Recolhe e expande a barra lateral |

## Valor em reais, número e percentual

```blade
<x-ui.money name="amount" label="Valor" required />
<x-ui.money name="items[0][cost]" label="Custo unitário" :value="$item->cost" :scale="4" />
<x-ui.money name="shipping" label="Frete" allow-zero />
<x-ui.money name="adjustment" label="Ajuste" :min="false" />
```

| Prop do `x-ui.money` | O que é |
|---|---|
| `scale` | As casas do valor enviado: 2 (padrão) ou 4. A tela mostra sempre 2. Com 4, o valor do banco (`3.9505`) volta intacto se ninguém digitar, e o que se digita grava `3.9500` |
| `allow-zero` | "0" digitado vale R$ 0,00 e grava `0.00`; o `min` padrão vira 0 |
| `min` | O menor valor. Sem ele: 0,01, ou 0 com `allow-zero`. Abaixo de zero, ou `:min="false"` (sem limite), o campo aceita negativo: o "-" troca o sinal e -1.500,00 grava `-1500.00` |
| `id` | O id do campo. Padrão: o nome sem colchetes (`items-0-cost`); o campo visível é `{id}-texto` |
| `size` | `xs` a `lg`, ou `cell`: só o campo, para tabela (sem rótulo, dica e sem o "R$" — quem diz a moeda é o cabeçalho da coluna — a não ser que o símbolo seja passado ou clicável; ver abaixo). No `x-ui.percent`, o `cell` mantém o "%" menor |
| `width` | A largura com o envelope, como no `x-ui.input` |
| `prefix`, `suffix` | O símbolo antes e depois do número: texto, ou `false` para tirar. Padrão: "R$" antes e nada depois (no `x-ui.percent`, nada antes e "%" depois). O recuo do texto acompanha o lado que tem símbolo |
| `affix-action` | O símbolo vira botão, que anuncia `ui:afixo` (abaixo) |
| `affix-label` | O nome do botão para o leitor de tela (`aria-label`), e a dica ao passar o mouse (`title`) |

**O símbolo** (`prefix`, `suffix`, nos dois campos). Os dois componentes têm a
mesma régua: o prefixo de um cai no mesmo lugar e com o mesmo recuo do prefixo
do outro, e o mesmo com o sufixo. Assim `<x-ui.percent prefix="%" :suffix="false" />`
põe o "%" à esquerda exatamente onde o `x-ui.money` põe o "R$". No `cell`, o
`x-ui.money` continua sem o "R$" — a não ser que o símbolo seja passado
(`prefix="R$"`) ou clicável (`affix-action`): aí ele é um controle, e não um
rótulo, e a coluna tem de caber nele. O "%" do `x-ui.percent` aparece no `cell`
como antes.

```blade
<x-ui.percent name="discount_percent" prefix="%" :suffix="false" />
<x-ui.money name="amount" :prefix="false" suffix="BRL" />
```

**O símbolo clicável** (`affix-action`). O "R$" (ou o "%") vira
`<button type="button" data-campo-afixo="prefix|suffix" tabindex="-1">`, com o
mesmo visual e um escurecer discreto no hover. O clique anuncia `ui:afixo` no
envelope do campo (`[data-dinheiro]`, `[data-percentual]`), subindo pelo DOM,
com `detail: { lado, campo }` — o lado do símbolo (`prefix` ou `suffix`) e o
`<input>` em que se digita — e devolve o foco a ele **antes** de anunciar: quem
escuta pode levar o foco a outro campo. O botão fica fora do Tab (`tabindex="-1"`)
e não toma o foco ao ser apertado: o teclado segue no campo. Desligado, o botão
apaga com o campo; desligado ou só leitura (inclusive posto depois, por outro
script), o clique não anuncia nada. O que o clique faz é da tela — o pacote só
avisa.

```blade
<div id="desconto">
    <x-ui.money name="discount_amount" affix-action affix-label="Trocar para percentual" />
</div>
```

```js
document.getElementById('desconto').addEventListener('ui:afixo', (evento) => {
    const { lado, campo } = evento.detail; // 'prefix', o <input> visível
    // trocar a unidade, abrir uma calculadora…
});
```

O ouvinte fica no `document`, uma vez (`ligarAfixos()`, no `ligarUi`): o campo
que entra depois (a linha nova do repetidor) já vale. A regra de quando o
clique anuncia é `anuncioDoAfixo(lado, campo)`.

**O erro e o rótulo no `cell`** (em `input`, `number`, `money` e `percent`):
não há onde escrever a mensagem, então o campo ganha a borda de erro do
tamanho normal, `aria-invalid="true"` e `title` com a primeira mensagem (ela
aparece ao passar o mouse). O `label`, que no `cell` não é desenhado, vira o
`aria-label` do campo visível — um `aria-label` passado de fora vence. Em
`money` e `percent`, os `aria-*` soltos vão para o campo visível (o que a
pessoa toca), em qualquer tamanho.

```blade
<x-ui.number name="installments" label="Parcelas" :min="1" :max="48" />
<x-ui.number name="items[0][qty]" size="cell" :min="0" />
```

`x-ui.number` é o inteiro: campo de texto com teclado numérico e os botões − e
+ à direita (as setas ↑ e ↓ fazem o mesmo). Aceita só dígitos, e o "-" no
começo quando não há `min` ou ele é negativo. Ao sair do campo, o valor volta
para dentro de `min`/`max`, e o vazio vira o `min`. Props: `min`, `max`
(sem padrão), `step` (quanto o − e o + andam; padrão 1), `nullable`, `size`
(`xs` a `lg`, ou `cell`: só o campo, para tabela), `width`, `id`,
`placeholder`, `hint`, `info`, `required`. Os atributos soltos, `class`
inclusive, vão para o `<input>`.

```blade
<x-ui.number name="counts[0][qty]" size="cell" :min="0" nullable />
```

Com `nullable`, o campo pode ficar em branco: ao sair, o vazio continua vazio
em vez de virar o `min`, e os limites valem só para o que foi digitado. É a
contagem de estoque em que "em branco" é "não contado" e 0 é "contei zero". O
− (ou ↓) num campo vazio dá o `min` (ou 0) e não desce dele; o + dá o `min`
mais um passo; o "-" só entra quando o `min` deixa, como sempre. Fora do
Blade, é `data-nullable` no campo; no JavaScript, `somarPasso` aceita
`{ anulavel: true }`.

```blade
<x-ui.percent name="fee" label="Taxa" :value="$plan->fee" />
<x-ui.percent name="markup" label="Margem" min="-50" max="50" />
```

`x-ui.percent` digita-se como o valor em reais, em centésimos: "325" vira
3,25% e envia `3.2500`. A tela mostra 2 casas; o formulário recebe 4 e, se
ninguém digitar, leva de volta o valor do banco intacto. Props: `value` (como
o banco guarda: `'3.2500'` ou `3.25`), `max` (teto, padrão 100: o dígito que
passaria dele não entra), `min` (piso, padrão 0; abaixo de zero ou
`:min="false"`, o "-" troca o sinal), `id`, `size`, `placeholder`, `hint`,
`info`, `required`, e os do símbolo, como no `x-ui.money`: `prefix`, `suffix`
(padrão "%"), `affix-action`, `affix-label`. Colar aceita "3,25", "3.25", "3" e
"3.2500".

## Número decimal

O `x-ui.decimal` é para o número com casas que não é dinheiro nem
percentual: o peso em kg, uma medida fracionária. O mesmo desenho do
`x-ui.money` e do `x-ui.percent`: se digita como calculadora, e o formulário
recebe o decimal com ponto.

```blade
<x-ui.decimal name="net_weight_kg" label="Peso líquido" :scale="3" suffix="kg" :value="$produto->net_weight_kg" />
```

Com `:scale="3"`, digitar "840" mostra 0,840 kg e envia `0.840`; colado,
"1,500" é 1,5 (até `scale` dígitos depois do separador são casas).

| Prop | O que é |
|---|---|
| `scale` | As casas que a tela mostra e que vão no formulário (0 a 4; padrão 2) |
| `prefix`, `suffix` | O símbolo antes e depois do número (`kg`, `m`, `L`) |
| `min`, `max` | Os limites; o `max` é também o teto da digitação |
| `allowZero` | Zero é valor (0,000); sem ele, zero esvazia o campo — o "não informado" |
| `size` | `xs` a `lg`, ou `cell` (na célula de tabela) |

Além dessas, as de todo campo: `name`, `label`, `value`, `hint`, `info`,
`required`, `placeholder`, `id`, `remember`, `width`.

## Arquivo e imagem

```blade
<x-ui.file name="xml" label="Arquivo XML da nota" accept=".xml,text/xml" required />
<x-ui.file name="files[]" label="Imagens" accept="image/*" multiple :max="10" />
```

`x-ui.file` é um ou vários arquivos. O `<input type="file">` nativo continua
sendo o campo do formulário. O JavaScript o esconde (sr-only), mas ele segue no
Tab, e mostra no lugar um botão que abre a janela de escolha. Ao lado, aparece
o que foi escolhido: "nota.xml (12 KB)" ou "3 arquivos (1,2 MB)". Sem
JavaScript, o nativo aparece sozinho.

| Prop | O que é |
|---|---|
| `accept` | Os tipos aceitos, como no HTML: `.xml`, `text/xml`, `image/*` |
| `multiple` | Vários arquivos; o nome vira lista (`files[]`, id `files`) |
| `max` | Tamanho máximo **de cada arquivo**, em MB (padrão 10; `:max="false"` tira o limite). 10 MB é o `max:10240` do Laravel |
| `button` | O texto do botão. Padrão: "Escolher arquivo" ou "Escolher arquivos" |
| `size` | `sm`, `md` ou `lg`, as alturas do campo |
| `id`, `label`, `hint`, `info`, `required` | Como no `x-ui.input` |

Ao escolher, o arquivo que passa do `max` ou não está no `accept` ganha o erro
embaixo do campo ("O arquivo passa de 10 MB.", "Tipo de arquivo não aceito."),
e a escolha é desfeita. Com vários arquivos, a mensagem diz qual deles falhou,
e a escolha inteira é recusada. É só aviso: valide no servidor também
(`mimes:xml`, `max:10240`). Os atributos soltos (`form`, `disabled`, `capture`,
`data-*`, `onchange`, `class`) vão para o `<input type="file">`. Depois de
conferir, o nativo dispara `ui:arquivos` com `detail.arquivos`, a lista que
ficou escolhida (vazia quando a escolha foi recusada).

```blade
<x-ui.image name="logo" label="Logo" :src="$brand->logo_url" size="lg"
            accept="image/jpeg,image/png,image/webp" :max="10" />
```

`x-ui.image` é uma imagem com prévia. O quadro mostra a imagem gravada (`src`)
e, ao escolher, a nova na hora, sem ir ao servidor. Os botões são "Escolher
imagem" (ou "Trocar", quando já há imagem) e "Remover".

| Prop | O que é |
|---|---|
| `src` | A URL da imagem gravada, ou `null` |
| `size` | O quadro: `sm` (64px), `md` (96px, padrão) ou `lg` (128px) |
| `accept` | Padrão `image/jpeg,image/png,image/webp` |
| `max` | Em MB (padrão 10; `:max="false"` tira o limite) |
| `removable` | O botão "Remover" (padrão `true`). Com `false`, não há botão nem o escondido `_remove` |
| `empty` | O que o quadro mostra sem imagem: o nome de um ícone do Lucide (`building-2`) ou um texto curto ("Sem logo"). Padrão: o ícone `image`, apagado |
| `required` | O `*` no rótulo. O navegador só cobra o arquivo quando não há imagem nenhuma: com a gravada à vista, salvar sem trocar vale |
| `id`, `label`, `hint`, `info` | Como no `x-ui.input` |

**Tirar a imagem gravada.** Não mandar arquivo não diz nada: é o que acontece
em todo salvar que não mexe na imagem. Quem diz é o escondido `{name}_remove`.
"Remover", com imagem gravada, o põe em `1`; escolher um arquivo o volta a `0`.
No controller:

```php
if ($request->hasFile('logo')) {
    // grava a nova (e apaga a antiga)
} elseif ($request->boolean('logo_remove')) {
    // apaga a gravada
}
```

Com colchete, o sufixo entra no último: `items[0][photo]` envia
`items[0][photo_remove]`, lido por `items.0.photo_remove`. A cada mudança, o
nativo dispara `ui:imagem` com `detail.arquivo` (o `File` ou `null`) e
`detail.removida` (se a gravada vai sair ao salvar). Sem JavaScript, aparece o
nativo ao lado do quadro, e não há como remover.

No JavaScript, as regras estão em funções puras: `tamanhoLegivel(bytes)`
("12 KB", "1,2 MB"), `aceita(arquivo, accept)`, `resumoDosArquivos(lista)` e
`conferirArquivos(lista, { accept, max })`, que devolve a mensagem ou `null`.
Um modal de imagem que serve a várias linhas (a logo de cada marca) troca a
gravada com `definirImagemGravada(envelope, src)` — o `[data-imagem]` volta ao
estado inicial com a nova imagem (ou com o vazio, com `null`); o título do modal
está em `[data-modal-titulo]`.

## Linhas repetidas

```blade
<x-ui.repeater name="addresses" :items="$person?->addresses ?? []" row="people.address-row"
               add="Adicionar endereço" :min="1" :max="5" sortable
               empty="Nenhum endereço. Adicione o primeiro." :with="['ufs' => $ufs]" />
```

O desenho de cada linha é uma view do projeto (`row`); o pacote repete, numera,
adiciona, remove, move e liga os campos do pacote nas linhas novas.

```blade
{{-- resources/views/people/address-row.blade.php --}}
<div class="grid gap-3 sm:grid-cols-3">
    <input type="hidden" name="{{ $name }}[id]" value="{{ data_get($item, 'id') }}">
    <input type="hidden" name="{{ $name }}[position]" data-repetidor-posicao>
    <x-ui.input :name="$name.'[zip]'" label="CEP" mask="cep" :value="data_get($item, 'zip')" />
    <x-ui.input :name="$name.'[street]'" label="Rua" :value="data_get($item, 'street')" />
    <x-ui.select :name="$name.'[uf]'" label="UF" :options="$ufs" :selected="data_get($item, 'uf')" />
</div>
```

A linha recebe `$name` (`addresses[0]`), `$index` (`0`, ou `__i__` no modelo das
linhas novas), `$item` (o model, o array do `old()`, ou `null` no modelo e nas
linhas em branco — por isso `data_get`), `$key` (`addresses.0`, para `old()` e
erros) e o que vier em `with`. Só isso: as variáveis da tela não chegam sem `with`.

| Prop | O que é |
|---|---|
| `name` | O nome base: os campos da linha são `addresses[0][zip]`. Aceita colchete (`order[items]`) |
| `items` | As linhas gravadas (array ou Collection, de arrays ou models). As chaves são os índices |
| `row` | A view que desenha uma linha |
| `with` | Variáveis a mais para a linha: `:with="['ufs' => $ufs]"` |
| `add` | O texto do botão de adicionar (padrão "Adicionar"); `:add="false"` o esconde |
| `min` | Linhas no mínimo (padrão 0). Faltando, vêm em branco; no mínimo, o "remover" some |
| `max` | O teto; atingido, o "adicionar" desliga |
| `sortable` | Botões de subir e descer em cada linha |
| `removable` | O botão de remover em cada linha (padrão `true`). `:removable="false"` não o desenha, nem no modelo: a lista cujas linhas vêm do servidor e só se preenchem. Sem `sortable` nem `removable`, não há coluna de botões |
| `empty` | O texto mostrado sem linha nenhuma |
| `remember` | Lembra as linhas enviadas quando o formulário volta com erro (padrão). `:remember="false"` no repetidor do formulário que não foi enviado (o modal de criar, quando foi o de editar que voltou) |
| `id` | O id do envelope (padrão: o nome sem colchetes) |

Depois de um erro de validação, o componente aplica `old()` sozinho: voltam as
linhas que a pessoa tinha (inclusive as que adicionou), na ordem e com os mesmos
índices, e o erro `addresses.2.zip` aparece no campo certo. O erro da lista
(`addresses`, sem índice) aparece embaixo do botão.

Os `name`s não são renumerados ao mover: a ordem enviada é a da tela
(`array_values($request->validated('addresses'))`). Quem grava a posição põe na
linha um `<input type="hidden" … data-repetidor-posicao>`, que o JavaScript
preenche com 0, 1, 2…

**Cabeçalho das colunas.** O slot `header` desenha um cabeçalho dentro da
mesma caixa das linhas, acima delas, com a coluna dos botões (remover, subir,
descer) reservada à direita na mesma medida que a linha usa — o projeto só
repete a grade das colunas:

```blade
<x-ui.repeater name="counts" :items="$counts" row="inventory.count-row" :removable="false" :add="false">
    <x-slot:header>
        <div class="grid gap-3 sm:grid-cols-3"><span>Produto</span><span>Sistema</span><span>Contado</span></div>
    </x-slot:header>
</x-ui.repeater>
```

Sem linhas, o cabeçalho some junto com o texto de vazio, e volta com a
primeira linha.

Na linha nova, os campos do pacote já vêm ligados (máscara, select, data,
período, valor, número, percentual, dica, bloco condicional). O que é do
projeto se liga pelo evento `ui:repetidor`, que sobe do envelope com
`detail: { acao: 'adicionado' | 'removido' | 'movido', item, indice }`
(`item` é o elemento da linha). Repetidor dentro de repetidor não funciona.

`adicionarLinha(envelope, { focar })`, exportada do `@targos-ui`, acrescenta
uma linha por código (o produto escolhido numa busca vira item da venda) e
devolve o elemento, ou `null` no teto. Por padrão o foco vai ao primeiro campo
da linha nova; `{ focar: false }` o deixa onde está — para quem adiciona
várias de uma vez, ou a partir de uma busca em que a pessoa continua
digitando.

```js
import { adicionarLinha } from '@targos-ui';

const linha = adicionarLinha(document.getElementById('items'), { focar: false });
```

## Alterações não salvas

```blade
<form method="POST" action="{{ route('sales.update', $sale) }}" data-nao-salvo @if ($errors->any()) data-nao-salvo-sujo @endif>
```

Com `data-nao-salvo`, o formulário guarda ao carregar o que enviaria (`FormData`)
e compara na hora de sair. Se mudou, um link para outra página do sistema ou o
envio de outro formulário da página pergunta no modal de confirmação ("Há
alterações não salvas. Sair e descartá-las?"). Fechar a aba, recarregar ou ir
para outro site cai no aviso do próprio navegador. Voltar ao valor de antes (ou
`form.reset()`) deixa o formulário limpo. O envio do próprio formulário não
pergunta.

- `data-sem-aviso` num link, formulário ou botão: sai sem perguntar, nem pelo navegador.
- `data-nao-salvo-sujo`: o formulário já nasce sujo (voltou com erro de validação, e o que está na tela não foi salvo).
- `marcarSalvo(form)`: para quem salva por `fetch` e continua na tela. `estaSujo(form)` diz se mudou.
- `data-nao-salvo-texto="Descartar a venda em andamento?"` no formulário: a pergunta do modal
  passa a ser essa. Com dois formulários sujos, vale a do primeiro. O aviso do navegador não muda
  (o texto é dele). `textoDaPergunta(form.dataset)` dá o texto que seria usado.
- `data-nao-salvo-ignorar` num campo, ou num envelope de campos: fica fora da comparação — o que
  muda sem ser alteração (a aba aberta, um filtro dentro do formulário). Vai pelo `name`: um campo
  homônimo sem a marca sai junto. O campo da aba do `x-ui.tabs` já vem com ele.
- Precisa do `<x-ui.confirm>` na página. Sem ele, só o aviso do navegador.
- Links com `target="_blank"`, `download`, âncoras (`#…`) e cliques com Ctrl/⌘/Shift não perguntam.
  Navegação por script (`location.href = …`) e `form.submit()` caem no aviso do navegador: use `requestSubmit()`.

## Enter que não envia

```blade
<form method="POST" action="{{ route('sales.store') }}" data-sem-envio-implicito>
```

O navegador envia o formulário quando se aperta Enter num campo — o "envio
implícito". Na tela que recebe um leitor de código de barras, que digita o
código e manda um Enter, isso enviaria o formulário pela metade a cada bipe.
Com `data-sem-envio-implicito` no `<form>`, o Enter num `<input>` dele (o de
fora ligado por `form="id"` inclusive) não envia. Continuam enviando: o
clique nos botões, o Enter com o foco num botão de envio, o
`requestSubmit()` por script. O `<textarea>` não é tocado (ali o Enter quebra
a linha). Só o padrão é barrado: o `keydown` segue para os ouvintes da tela,
que é onde o Enter do leitor é lido.

Fora do `ligarUi()`, é `ligarEnvioImplicito()`; a regra está em
`enterEnviaImplicito(elemento)`.

## Lista reordenável

```blade
<ul id="colunas" data-arrastavel class="divide-y">
    @foreach ($colunas as $coluna)
        <li data-arrastavel-item data-arrastavel-id="{{ $coluna->key }}" class="flex items-center gap-2 py-2">
            <x-ui.icon name="grip-vertical" class="size-4 text-neutral-400" data-arrastavel-alca />
            <span class="flex-1">{{ $coluna->label }}</span>
            <x-ui.button variant="ghost" size="icon-xs" icon="chevron-up" aria-label="Subir" data-arrastavel-subir />
            <x-ui.button variant="ghost" size="icon-xs" icon="chevron-down" aria-label="Descer" data-arrastavel-descer />
        </li>
    @endforeach
</ul>
```

O envelope declara `data-arrastavel` (`data-arrastavel="horizontal"` na lista
em linha); cada filho que se move é um `[data-arrastavel-item]`, com o
`data-arrastavel-id` que a tela reconhece. Três jeitos de mover:

- **Arrastar e soltar** (o drag and drop nativo): o item arrastado ganha
  `data-arrastando`, e o item sob o mouse, `data-arrastavel-alvo="antes"` ou
  `"depois"`, conforme a metade. O `theme.css` deixa o arrastado translúcido e
  desenha a linha de destino; a tela que quiser outro desenho redeclara os
  mesmos seletores. Com `[data-arrastavel-alca]` dentro do item, só a alça
  começa o arrasto (e ganha o cursor de agarrar) — é o que deixa selecionar
  texto num campo da linha.
- **Teclado**: Alt+↑ e Alt+↓ com o foco no item ou num campo dele (menos o
  `<select>` nativo, em que Alt+↓ abre a lista). Também na lista horizontal:
  Alt+← e Alt+→ são o voltar e o avançar do navegador. O item sem nada
  focável dentro ganha `tabindex="0"`.
- **Botões** `[data-arrastavel-subir]` e `[data-arrastavel-descer]` dentro do
  item: desligados nas pontas, e sem enviar o formulário em volta.

Cada mudança dispara `ui:reordenado` no envelope (sobe pelo DOM), com
`detail: { item, de, para, ordem }` — as posições de antes e de depois, e a
lista dos `data-arrastavel-id` na ordem nova. É só isso: os `name`s não são
renumerados (a ordem enviada é a da tela, como no repetidor), e gravar a
ordem é da tela — pelo evento, num `fetch`, ou num escondido por item:

```js
document.getElementById('colunas').addEventListener('ui:reordenado', (evento) => {
    requisicaoJson('/colunas/ordem', { method: 'PUT', body: { ordem: evento.detail.ordem } });
});
```

**Toque.** Arrastar com o dedo não é garantido: o drag and drop nativo no
celular depende do navegador e da versão, e onde existe pede um toque longo
que ninguém adivinha. Onde a ordem importa no celular, desenhe os botões. Quem
precisar de arrasto por toque usa uma biblioteca no projeto e dispara o mesmo
evento.

Os ouvintes ficam no `document`, uma vez: o envelope que chega depois já
funciona (o item fica pronto no primeiro clique). `ligarArrastaveis(raiz)` com
o que chegou — o envelope ou o item novo — adianta isso e acerta os botões das
pontas. As regras estão em `indiceAoSoltar`, `reordenar`, `passoPelaTecla`,
`ladoDoAlvo` e `ordemDe`.

## Listagem: filtros que se enviam sozinhos

```blade
<form method="GET" action="{{ route('clients.index') }}" data-filtros class="flex flex-wrap items-end gap-3">
    <x-ui.filter-field kind="wide"><x-ui.input type="search" name="busca" label="Buscar" size="sm" /></x-ui.filter-field>
    <x-ui.filter-field kind="select"><x-ui.select name="status" label="Situação" size="sm" placeholder="Todas" :options="$status" /></x-ui.filter-field>
    <x-ui.button type="submit" variant="secondary" size="sm">Buscar</x-ui.button>
</form>
```

Com `data-filtros`, um select, uma data, um período ou uma caixa enviam o
formulário ao mudar; a busca (`type="search"`, ou o campo com
`data-filtro-busca`) espera a pessoa parar de digitar (`data-filtros-espera`,
400 ms por padrão); os campos vazios e o `page` ficam fora da URL, e o
`por_pagina` escolhido no seletor da paginação vai junto. Sem JavaScript,
vale o botão "Buscar".

## Modal e gaveta: `static` e os eventos

```blade
<x-ui.modal id="documento-venda" title="Documento da venda" static>
    …
    <x-slot:footer>
        <x-ui.button variant="secondary" data-fecha-modal>Nenhum</x-ui.button>
        <x-ui.button>Emitir NFC-e</x-ui.button>
    </x-slot:footer>
</x-ui.modal>
```

Com `static` (no `x-ui.modal` e no `x-ui.offcanvas`), a camada só fecha pelos
botões (`data-fecha-modal`, `fecharModal(id)`): nem o clique no fundo nem o
Esc. É o diálogo que exige uma resposta e não pode ser dispensado por
acidente. Aberta por cima de outra, ela segura o Esc também para a de baixo —
a gaveta atrás do diálogo não some por um Esc que o diálogo recusou. Fora do
Blade, é `data-modal-estatico` (ou `data-offcanvas-estatico`) no elemento da
camada.

**O modal estático não tem o X do cabeçalho**: quem fecha são os botões do
rodapé (ou do corpo), que dizem o que acontece ao fechar. A prop `closable`
manda no X — por padrão é `! static`: `closable` o devolve ao estático que
precisar dele, e `:closable="false"` o tira de um modal comum. A gaveta
estática continua com o X (ela não tem rodapé obrigatório).

**O título num gancho.** O `<h2>` do título, no modal e na gaveta, leva
`data-camada-titulo` (o do modal leva também o `data-modal-titulo` de antes),
para o script trocar o texto — um contador, o nome do que está aberto — sem
procurar o `h2` pela estrutura. O nome acessível da caixa vem dele
(`aria-labelledby="{id}-titulo"`), e acompanha o texto trocado.

```js
gaveta.querySelector('[data-camada-titulo]').textContent = `Rascunhos (${quantos})`;
```

Ao abrir e ao fechar, o próprio elemento da camada dispara
`ui:camada-aberta` e `ui:camada-fechada`, subindo pelo DOM, com
`detail: { tipo, id, motivo }`: `tipo` é `modal` ou `offcanvas`, e `motivo` é
`botao` (um `data-abre-*`, um `data-fecha-*`, o X, o "Confirmar" do
`x-ui.confirm`), `fundo` (o clique fora), `esc` ou `script` (`abrirModal`,
`fecharModal`, `abrirCamada`, o `:open` ao carregar). Cada abertura tem um
fechamento: fechar o que já está fechado, ou abrir o que já está aberto, não
avisa de novo.

```js
document.getElementById('documento-venda').addEventListener('ui:camada-fechada', (evento) => {
    // Fechou, por onde for: a próxima venda.
});
```

Os eventos de antes (`modal:aberto`, `modal:fechado`, `offcanvas:aberto` e
`offcanvas:fechado` no `document`, com `detail: { id }`) continuam saindo como
sempre, a cada chamada. `abrirCamada(tipo, id, motivo)` e
`fecharCamada(tipo, elemento, motivo)` aceitam o motivo (padrão `script`).

## Modal de editar preenchido pela linha

```blade
<x-ui.dropdown-item icon="pencil" data-abre-modal="editar-deposito"
                    data-form-action="{{ route('warehouses.update', $row) }}"
                    data-form-valores='@json(["name" => $row->name, "sells" => $row->sells])'>Editar</x-ui.dropdown-item>
```

Um modal de editar serve a todas as linhas: o botão que o abre traz os dados
dela em `data-form-valores` (JSON, `nome do campo => valor`) e o destino em
`data-form-action`. O `<form>` do modal é preenchido campo a campo pelo `name`
(texto, caixa, rádio, select, valor, data — os do pacote redesenham sozinhos).
`preencherFormulario(form, valores)` faz o mesmo por código, com dados vindos de
um `fetch`. O destino nunca vem dos dados: só de `data-form-action`. O escondido
do interruptor (`data-falsy`, o "0" do desligado) não é tocado: a caixa é que
diz ligado ou desligado.

Numa listagem com o menu montado por modelo, os valores da linha vão no
`values` do `x-ui.dropdown` como objeto, e no modelo `{editar.valores}` sai
como JSON — pronto para o `data-form-valores='{editar.valores}'`.

Dois atributos a mais no botão que abre o modal: `data-form="id"` aponta
qual `<form>` preencher quando o modal tem mais de um (por padrão é o
primeiro), e `data-modal-titulo="Cancelar NF-e 1/15"` escreve o título no
`<h2>` do modal, para quem age sobre uma linha ver de qual linha se trata.

Além dos campos, o que só se mostra, dentro do mesmo `<form>`:
`[data-form-texto="chave"]` recebe o valor da chave em `textContent` (o nome
do cliente no modal de baixa), e `[data-form-se="chave"]` fica à vista só
quando a chave tem valor — nulo, `false`, texto vazio e lista vazia não têm;
`0` tem. A chave é como foi escrita nos dados (`cliente.nome` inclusive); uma
lista vira texto separado por vírgula.

```blade
<p>Baixa de <strong data-form-texto="customer_name"></strong></p>
<p data-form-se="notes" hidden>Obs.: <span data-form-texto="notes"></span></p>
```

## Bloco condicional

```blade
<x-ui.select name="forma" label="Forma de pagamento" :options="$formas" />

<fieldset data-mostra-quando="forma=cartao" @if ($forma !== 'cartao') hidden disabled @endif>
    <x-ui.select name="bandeira" label="Bandeira" :options="$bandeiras" />
    <x-ui.number name="parcelas" label="Parcelas" :min="1" />
</fieldset>
```

Um elemento com `data-mostra-quando="campo=valor"` aparece só quando o campo
`campo` do mesmo `<form>` (ou do documento, fora de um) tem aquele valor.

| Sintaxe | Aparece quando |
|---|---|
| `campo=valor` | O campo vale `valor` |
| `campo=a\|b` | Vale `a` ou `b` |
| `campo` | Tem qualquer valor não vazio; numa caixa ou interruptor, está marcado |
| `campo=1` | Numa caixa ou interruptor (`value="1"`), está marcado |
| `campo=` | Está vazio |
| `!campo=valor`, `!campo` | O contrário |
| `a=1&!b=x` | Todas as condições valem ao mesmo tempo (cada uma com o próprio `!`) |
| `campo.chave=valor`, `campo.chave` | A `chave` do `extra` da opção escolhida vale `valor`; sozinha, tem valor |

Em rádios e caixas, o valor é o do marcado (nenhum marcado é vazio; o
escondido `data-falsy` do interruptor não conta); num `x-ui.select multiple`,
basta uma escolhida bater.

**Pelo `extra` da opção.** `campo.chave` não olha o valor do campo, e sim os
dados da opção escolhida num `x-ui.select` — o `extra` de `options` ou da
busca no servidor, que mora no `data-extra` (JSON) da `<option>` e é lido por
`escolhaDe`. Assim o bloco segue o que a opção **é**, sem a tela listar os
valores:

```blade
<x-ui.select name="product_id" label="Produto" :options="[
    12 => ['label' => 'Café em grão', 'extra' => ['unit' => 'KG', 'tracks_lot' => true]],
    13 => ['label' => 'Caneca', 'extra' => ['unit' => 'UN', 'tracks_lot' => false]],
]" />

<fieldset data-mostra-quando="product_id.unit=KG" hidden disabled>…peso…</fieldset>
<fieldset data-mostra-quando="product_id.tracks_lot&!kind=transfer" hidden disabled>…lote…</fieldset>
```

O dado compara como texto: `true` é `1`, e `false`, nulo e a chave que não
existe são vazio (`campo.chave` sozinho é "ligada ou preenchida"); `0` é um
valor. A chave com ponto desce nos dados (`product_id.fiscal.ncm`). No select
de várias, basta uma escolhida bater. Num rádio ou caixa escritos à mão, vale o
`data-extra` (JSON) do marcado. Sem escolha, os dados estão vazios:
`campo.chave=` vale, `campo.chave=KG` não. O ponto separa o campo da chave, por
isso o nome do campo não pode ter ponto — o com colchete (`items[0][kind]`)
fica inteiro.

Escondido, o bloco ganha `hidden`; se é um
`<fieldset>`, ganha `disabled` também, e nada de dentro vai no envio — o
servidor não precisa adivinhar se o campo que chegou vazio estava à vista.
Noutro elemento, `data-mostra-quando-desliga` desliga os campos de dentro um a
um (e religa só os que ele desligou); o `<fieldset>` é o jeito recomendado.

O servidor desenha o estado inicial (`hidden`, e `disabled` no `fieldset`);
o JavaScript só confirma ao carregar e reage ao `input`/`change` do campo —
inclusive ao preenchimento do modal (`data-form-valores`) e às linhas novas do
repetidor. Fora do `ligarUi()`, é `ligarCondicionais()`, antes do
`ligarEnvios()`. As regras estão em `interpretarCondicoes(texto)` (a lista,
uma por parte do `&`), `interpretarCondicao(texto)` (uma: `{ campo, chave,
valores, negado }`), `condicaoVale(condicao, valor)`,
`condicoesValem(condicoes, valorDe)` e `valorDaChave(extra, chave)`.

## Máscaras

```blade
<x-ui.input name="cpf" label="CPF" mask="cpf" />
<x-ui.input name="document" label="CPF ou CNPJ" mask="documento" validate />
<x-ui.input name="cnpj" label="CNPJ" mask="cnpj" validate unmasked />
<x-ui.input name="phone" label="Telefone" mask="telefone" validate unmasked />
```

Máscaras: `cpf`, `cnpj` (aceita o CNPJ alfanumérico da Receita, de 2026),
`documento` (CPF até o 11º caractere; CNPJ a partir do 12º, ou assim que
aparece uma letra), `telefone` (fixo ou celular, cresce com o que se digita),
`cep`, `cartao`, `validade`, `cvv`, ou um padrão próprio (`9` é dígito, `A` é
letra ou dígito, o resto é literal).

`validate` avisa ao sair do campo quando o valor não passa: CPF e CNPJ pelo
dígito verificador, telefone pelo DDD (11 a 99) e pelo 9 do celular, CEP pelos
8 dígitos. O aviso aparece embaixo do campo, no lugar do erro do servidor, e
sai na tecla seguinte. É só aviso: campo vazio não é acusado (obrigatório é do
`required` e do servidor) e não há `setCustomValidity`. Valide no servidor
também.

`unmasked` envia o valor sem pontuação (`52998224725`, `12ABC34501DE35`). O
campo que se vê perde o `name` e passa a ter o id `{id}-mascarado`, e um
`<input type="hidden">` com o `name` e o `id` do campo leva o valor limpo
(o CNPJ em maiúsculas). `old()`, o erro e o `hint` continuam pelo `name`.
**Depende do JavaScript**: sem ele, o escondido vai com o valor que veio do
servidor, e o que se digita não é enviado.

Fora do Blade, os atributos são `data-mascara="<nome>"`, `data-mascara-valida`
e `data-mascara-destino="<id do hidden>"`. As regras estão em funções puras
que recebem o valor limpo: `validarCpf`, `validarCnpj`, `validarTelefone` e
`validarCep`. `mensagemInvalida(mascara, valor)` devolve a mensagem ou `null`,
e `valorLimpo(valor, mascara)` devolve o valor sem pontuação.

## Nomes com colchete, `id` próprio e atributos no campo

Todo campo (`input`, `money`, `number`, `percent`, `date`, `date-range`,
`select`, `textarea`, `toggle`, `checkbox`, `radio-group`, `file`, `image`)
aceita nome de lista, o das linhas repetidas:

```blade
<x-ui.date name="items[0][due]" label="Vencimento" />
```

O `old()` e o erro de validação são lidos por `items.0.due`, como o Laravel os
nomeia (`Targos\Ui\FieldName::key`), e o `id` sai `items-0-due`
(`FieldName::id`). Num nome simples o `id` continua sendo o próprio nome.

**`id`.** Todos têm a prop `id`, para quando dois formulários da mesma tela têm
o mesmo campo (o modal de criar e o de editar). O rótulo aponta para ele:

```blade
<x-ui.select name="uf" id="novo-uf" label="UF" :options="$ufs" />
```

- No `date-range`, o `id` é o do início, e o fim fica com `{id}-fim`.
- No `checkbox`, sem `id` ele sai do nome e do valor (`items-0-active-1`). No
  `bare` só há `id` quando é passado.
- No `radio-group`, o `id` vai no contorno das opções.

**Atributos no campo nativo.** Em `money`, `date` e `date-range`, `form`,
`disabled`, `readonly`, `autofocus`, `tabindex` e `autocomplete` vão para o
`<input>` escondido que leva o valor (no `date-range`, para os dois; o
`autofocus` só para o início). O resto (`class`, `data-*`, `on*`, `style`)
continua no envelope, e o `onchange` posto nele segue recebendo o evento dos
nativos; em `money` e `percent`, os `aria-*` vão para o campo visível, que é
onde o leitor de tela para. Desligado ou só leitura, o calendário não abre e
o campo digitável fica desligado também.

**Ganchos de texto.** O texto do rótulo de todo campo que usa o
`x-ui.field-label` fica num `<span data-campo-rotulo>` (só o texto, sem o
asterisco do `required`), e o parágrafo do `hint` leva `data-campo-dica` — em
`input`, `number`, `money`, `percent`, `select`, `textarea`, `date`,
`date-range`, `password`, `file`, `image`, `toggle`, `checkbox`,
`checkbox-group` e `radio-group`. É para o script trocar o texto sem mexer na
estrutura:

```js
campo.querySelector('[data-campo-rotulo]').textContent = tipo === 'pj' ? 'CNPJ' : 'CPF';
```

```blade
<x-ui.date name="due" label="Vencimento" form="form-pagamento" disabled />
<x-ui.date-range start="de" end="ate" form="filtros" onchange="filtrar()" />
```

**`checkbox`** mostra o erro de validação embaixo e aceita `hint`. Numa lista
(`name="tags[]"`) o erro não se repete em cada caixa: a tela o mostra uma vez
para o grupo (`@error('tags')`).

**`falsy` no toggle e no checkbox** aceita, além de `true` (desligado chega
como "0"), o valor do desligado: `:falsy="'inactive'"` para um `status` que é
`active|inactive`. O escondido leva `data-falsy`, e o preenchimento do modal
(`data-form-valores`) não escreve nele.

**`radio-group`** aceita `required` (vai em cada rádio, e o rótulo ganha o
`*`), `info` (o ícone de explicação ao lado do rótulo), `hint` (a linha de
apoio embaixo das opções, com `data-campo-dica`; some quando há erro, como no
`x-ui.input`) e `disabled` (os valores que não se escolhem, à vista mas
apagados; `true` desliga o grupo inteiro).

```blade
<x-ui.radio-group name="forma" label="Forma de pagamento" required hint="O Pix cai na hora."
                  :options="['pix' => 'Pix', 'boleto' => 'Boleto']" :disabled="['boleto']" />
```

## No JavaScript

### Requisições sem recarregar

```js
import { requisicaoJson, mensagemDe, mostrarErros } from '@targos-ui';

try {
    const cliente = await requisicaoJson('/clientes', { method: 'POST', body: { nome } });
} catch (erro) {
    if (erro.name === 'AbortError') return;

    const semCampo = mostrarErros(formulario, erro.erros ?? {});
    window.mostrarToast('erro', semCampo[0] ?? mensagemDe(erro));
}
```

`requisicaoJson(url, { method, body, headers, signal })` pede JSON, manda o
cookie da sessão e, fora do GET/HEAD, o token do CSRF (`X-XSRF-TOKEN`, lido do
cookie `XSRF-TOKEN`). `body` é um objeto (vai como JSON) ou um `FormData` (vai
como está, para arquivos). Devolve o JSON da resposta, ou `null` no 204.

Qualquer outra resposta vira `ErroDeRequisicao`, com `status` (0 sem rede),
`mensagem` em português, `erros` (os do 422, no formato do Laravel) e
`correlationId`. Sessão vencida (401/419), sem permissão (403), não encontrado
(404) e excesso de tentativas (429) têm mensagem própria; nos outros vale o
`message` do servidor. Um 2xx que não seja JSON também é erro ("Resposta
inesperada do servidor."). O cancelamento pelo `signal` volta como `AbortError`.

`mensagemDe(erro)` dá o texto para mostrar de qualquer erro e acrescenta
`(código XXXXXX)` quando o servidor mandou `correlation_id`.

`mostrarErros(formulario, erros)` escreve cada erro embaixo do campo com aquele
nome (aceita `items.0.price` ou `items[0][price]`) e devolve as mensagens cujo
campo não existe no formulário; `limparErros(formulario)` tira o que o
JavaScript escreveu. Para um campo só: `mostrarErroNoCampo(campo, texto)` e
`limparErroDoCampo(campo)`.

### Confirmação

```js
if (await confirmar('Remover este item?', { perigo: true })) {
    // …
}

await confirmar('Cancelar a venda 12?\nO estoque volta ao depósito.', {
    perigo: true, titulo: 'Cancelar venda', botao: 'Sim, cancelar',
});
```

`confirmar(texto, { perigo, titulo, botao })` faz a pergunta no mesmo modal do
`data-confirmar` (o `<x-ui.confirm>` precisa estar na página) e devolve
`true` no "Confirmar" e `false` em qualquer outra saída. `titulo` e `botao`
trocam o título do modal e o texto do "Confirmar" só nessa pergunta; sem eles,
valem os do componente (`title` e `confirm` do `x-ui.confirm`), e cada
pergunta volta a eles antes de aplicar os seus — uma não herda o título da
anterior. Um `\n` no texto quebra a linha. Uma pergunta por vez: chamada com
outra aberta, volta `false` na hora. Também está em `window.confirmar`, como
`window.mostrarToast(tipo, texto)`, que mostra um aviso sem recarregar a
página.

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

- **1.11.14** — Número decimal: o `x-ui.decimal`, com `scale` casas (0 a
  4) e sufixo, digitado como calculadora — o peso em kg (`:scale="3"`
  `suffix="kg"`: "840" é 0,840). As contas do `money.js` aceitam o número de
  casas (`casas`, 2 por padrão), e o dinheiro e o percentual continuam
  iguais.
- **1.11.13** — O `x-ui.password` ganha o slot `aside`, à direita do
  rótulo, na mesma linha — para o "Esqueci minha senha" do login — e a prop
  `info`. O rótulo passa a ser o `x-ui.field-label`, como nos outros campos.
- **1.11.12** — Animação `animate-entrar` (sobe 12 px com fade, 300 ms),
  para o bloco que chega com a página — o cartão das telas de login e
  cadastro. Nasceu no meu-sistema2 e veio para cá para os outros projetos
  usarem. Desligada com as outras para quem pede menos movimento. Nova seção
  "Animações" no README, com as três.
- **1.11.11** — Correção da 1.11.10: o `x-ui.date-range` aparecia
  desligado em todas as telas. A variante `read-only:` estava na lista de
  classes que vai também para o gatilho, um `<button>`, e para o CSS todo
  botão é `:read-only`. Agora ela vai só nos dois campos de data nativos.
- **1.11.10** — Abas em pílula e com ícone. A aba aberta do `x-ui.tabs`
  deixa de se marcar pela linha embaixo dela: vira uma pílula verde-clara
  (`primary-100`, com contorno `primary-300` e texto `primary-900`; no
  escuro, `primary-500/15` e texto `primary-300`). O `primary-50` do menu
  lateral sumia sobre o fundo cinza da área de conteúdo. As outras ficam em
  cinza, com fundo cinza no hover — nunca o da aberta. A linha embaixo da barra saiu: a pílula já marca
  a aberta. O foco pelo teclado ganha anel. E o componente
  aceita `icons` (`chave => ícone`, da Lucide ou um componente com ponto,
  como no `x-ui.radio-group`), desenhado antes do rótulo e na cor dele.
  E o campo só leitura fica com a cara do desligado — fundo e texto
  apagados, cursor de bloqueio — em todos os campos de texto (`read-only:`)
  e no gatilho do `x-ui.select` (`aria-readonly`, que antes só apagava o
  fundo). No select não há `read-only:`: para o CSS, `<select>` e
  `<button>` são sempre `:read-only`.
  O rótulo do campo (`x-ui.field-label`) fica sempre na cor normal: antes
  ele clareava com o campo desligado e não com o só leitura, e os dois
  pareciam coisas diferentes. A trava aparece na caixa do campo.
- **1.11.9** — Card clicável: com `href`, o `x-ui.card` e o `x-ui.stat-card`
  ganham a borda na cor de ação no hover (`hover:border-primary-500`, nos
  dois temas). No `stat-card` o hover era `border-neutral-300`, a mesma cor
  da borda em repouso no tema claro, e só aparecia no escuro; o `x-ui.card`
  clicável não reagia ao mouse. E o painel flutuante (o calendário do
  período e da data, a lista do select) fica dentro da área visível: o
  limite pela direita usava `window.innerWidth`, que inclui a barra de
  rolagem, e o painel terminava por baixo dela; agora usa a largura e a
  altura sem as barras (`document.documentElement.clientWidth`/`clientHeight`).
- **1.11.8** — Barra lateral: o hover do `x-ui.nav-item` e do título do
  `x-ui.nav-group` ganha o mesmo fundo do item ativo (`bg-primary-50`; no
  escuro, `bg-primary-500/15`). Era cinza (`bg-neutral-100`), e o menu
  tinha duas cores de destaque. O menu flutuante da barra recolhida copia
  os itens, e muda junto.
- **1.11.7** — `x-ui.repeater`: o cabeçalho das colunas (slot `header`) tem a
  altura do texto. A coluna invisível que reserva o lugar dos botões de cada
  linha dava a ele a altura do botão (36px), e o título ficava 16px longe dos
  campos; agora ela reserva só a largura (`h-0`).
- **1.11.6** — O que o PDV pediu, sem nada de PDV no pacote.
  `x-ui.input`: `size="xl"` (56px, `text-base`), `icon` (à esquerda, dentro do
  campo, com o recuo do texto em cada tamanho) e `loading` (o indicador
  girando à direita; `:loading="false"` o desenha apagado, e o atributo
  `data-carregando` no `<input>` o acende pelo CSS, sem redesenhar;
  `loading-label` é o texto para o leitor de tela). `x-ui.table`: `sticky`
  (cabeçalho fixo, opaco nos dois temas) e `body-attributes` (atributos do
  `<tbody>`). `x-ui.button`: o estado atual pelo `aria-current` em cada
  variante (variante `atual:` nova no `theme.css`) e `size="stacked"` (altura
  livre, conteúdo empilhado). `x-ui.alert dismissible`: o X que esconde e
  dispara `ui:alerta-dispensado` (`data-fecha-alerta`, `[data-alerta-texto]`;
  JS `ligarAlertas` — já no `ligarUi` — e `dispensarAlerta`, em
  resources/js/alert.js; quem liga os módulos um a um acrescenta
  `ligarAlertas()`). `data-camada-titulo` no título do `x-ui.modal` e do
  `x-ui.offcanvas`, com `aria-labelledby` na caixa (o `data-modal-titulo`
  continua, e o preenchimento pela linha e o `x-ui.confirm` acham o título
  pelos dois). **Muda o `x-ui.modal static`**: o X do cabeçalho sai — quem
  fecha são os botões; quem dependia do X num estático passa `closable`.
- **1.11.5** — `x-ui.alert` mais visível no tema claro: fundo no tom 100 (era o
  50) e borda no 200. O tema escuro não muda.
- **1.11.4** — `x-ui.button` ganha `size="icon-lg"` (48px) e `size="icon-xl"` (56px),
  os quadrados só de ícone nas alturas do `lg` e do `xl`.
- **1.11.3** — `x-ui.tooltip`: o texto fica num `<span data-dica-texto>`, para um
  script trocá-lo sem levar a seta junto; e `data-sem-dica` no envelope cala a
  dica sem tirá-la da página (o botão que só se explica quando está desligado).
- **1.11.2** — O tamanho `cell` dos campos (`x-ui.input`, `x-ui.number`,
  `x-ui.money`, `x-ui.percent`) arredonda um pouco mais: `rounded-md` (6px) no
  lugar de `rounded` (4px). No `x-ui.input`, a prop `radius` continua trocando.
- **1.11.1** — Muda o `x-ui.badge`, e **quebra o visual**: o padrão passou a se chamar
  `soft` e deixou de pintar `success` e `danger` cheios (agora são claros,
  como as outras cores); `solid` deixou de existir. Quem queria o selo cheio
  usa `variant="filled"`, que já existia. Para a tela manter o visual: todo
  `<x-ui.badge color="success|danger">` sem `variant` (ou com `solid`) ganha
  `variant="filled"`; nas demais cores, tire o `variant="solid"` e nada muda.
- **1.11.0** — O símbolo do `x-ui.money` e do `x-ui.percent` configurável e,
  se a tela quiser, clicável. Props `prefix` e `suffix` nos dois (texto, ou
  `false` para tirar; os padrões são os de sempre: "R$" antes no money, "%"
  depois no percent), com a mesma régua de recuo nos dois — `prefix="%"
  :suffix="false"` põe o "%" no lugar do "R$". No `cell`, o símbolo passado ou
  clicável aparece; sem isso, o `cell` fica como era. `affix-action` faz do
  símbolo um `<button data-campo-afixo="prefix|suffix" tabindex="-1">`
  (`affix-label` é o `aria-label` e o `title`), e o clique anuncia `ui:afixo`
  no envelope, com `detail: { lado, campo }`, devolvendo o foco ao campo;
  desligado ou só leitura, não anuncia. Componente interno novo:
  `x-ui.field-affix`. JS: `ligarAfixos` e a regra `anuncioDoAfixo`
  (resources/js/affix.js). Quem liga os módulos um a um acrescenta
  `ligarAfixos()`.
- **1.10.3** — Sai a classe `tabular-nums` dos campos `x-ui.money`, `x-ui.number`,
  `x-ui.percent` e da `x-ui.pagination`: os números usam a fonte com os
  algarismos dela, como o resto do texto.
- **1.10.2** — `x-ui.badge variant="filled"`: o fundo cheio na cor (o
  `warning` é o amarelo com texto escuro), para o aviso que salta da tela.
- **1.10.1** — O `x-ui.radio-group` fica com a altura do `x-ui.input` do
  mesmo tamanho (40px no md, 48px no lg): as opções eram 6px mais altas que a
  moldura comportava, e o grupo ao lado de um campo sobrava na linha. O
  `x-ui.user-menu` ganha a prop `width` (padrão `w-60`, como antes), para o
  menu que traz texto comprido no slot (razão social, documento).
- **1.10.0** — O que a tela de venda e o PDV pediram, sem nada de venda no
  pacote: `x-ui.button variant="warning"` e `warning-soft` (com tema escuro);
  `x-ui.modal static` e `x-ui.offcanvas static` (só os botões fecham;
  `data-modal-estatico`, e o Esc não passa da estática para a camada de baixo,
  `fechadasPeloEsc`); os eventos `ui:camada-aberta` e `ui:camada-fechada` no
  elemento da camada, com `detail: { tipo, id, motivo }` (`botao`, `fundo`,
  `esc`, `script`), um por abertura e um por fechamento, e `abrirCamada`/
  `fecharCamada` aceitam o motivo; o modal aberto e fechado no mesmo quadro
  fica fechado; `data-nao-salvo-texto` (a pergunta do formulário,
  `textoDaPergunta`) e `data-nao-salvo-ignorar` (o campo fora da comparação; o
  da aba do `x-ui.tabs` já vem com ele); `data-sem-envio-implicito` no
  `<form>` (o Enter do leitor de código de barras não envia;
  `ligarEnvioImplicito`, `enterEnviaImplicito`); slot `aside` no
  `x-ui.page-header` (selos ao lado do título); `disabled` no
  `x-ui.checkbox-group` (pela lista, `true` ou na opção; a desligada continua
  marcada pelo `selected` quando o formulário volta com erro), e o rótulo do
  `x-ui.checkbox` desligado apaga junto; `hint` no `x-ui.radio-group`; a
  lista reordenável `data-arrastavel` (arrastar, Alt+↑/↓, botões, evento
  `ui:reordenado`; `ligarArrastaveis` e as regras `indiceAoSoltar`,
  `reordenar`, `passoPelaTecla`, `ladoDoAlvo`, `ordemDe`); no
  `data-mostra-quando`, várias condições com `&` e a chave do `extra` da opção
  escolhida (`campo.chave=valor`; `interpretarCondicoes`, `condicoesValem`,
  `valorDaChave`); ícones do projeto em
  `resources/views/components/ui/icons/{nome}.blade.php`, sem copiar o
  `x-ui.icon` (`Icons::isCustom`); o rótulo do `x-ui.checkbox-group` ganha o
  `data-campo-rotulo` que o README já prometia, e o `selected` dele aceita
  Collection. Quem liga os módulos um a um
  acrescenta `ligarArrastaveis()` e `ligarEnvioImplicito()` antes do
  `ligarNaoSalvo()`.
- **1.9.1** — Dois acertos da 1.9.0: o `x-ui.toggle` e o `x-ui.checkbox`
  passam a ter o `<span data-campo-rotulo>` no texto do rótulo, como o README já
  dizia; e o `x-ui.select size="cell"` deixa de desenhar o rótulo — o `label`
  vira o `aria-label` do gatilho, como nos outros campos da célula.
- **1.9.0** — O que as telas de contagem, baixa e resumo pediram:
  `x-ui.number nullable` (o vazio fica vazio; `data-nullable`,
  `somarPasso({ anulavel })`); no `size="cell"` de `input`, `number`, `money`
  e `percent`, o erro na borda, no `aria-invalid` e no `title`, e o `label`
  como `aria-label` (em `money` e `percent`, os `aria-*` soltos vão ao campo
  visível); `x-ui.stat-card` com `data-stat-valor` e `data-cor` no número
  (a cor sai do atributo, para o script trocar); `x-ui.confirm` com
  `data-confirmar-titulo`, `data-confirmar-botao`, `confirmar(texto,
  { perigo, titulo, botao })` e quebra de linha pelo `\n`; `x-ui.repeater`
  com slot `header`, `removable` e `adicionarLinha(envelope, { focar })`;
  `x-ui.select readonly` (no envio, sem abrir; `data-readonly` lido também
  por script); o bloco condicional `data-mostra-quando` (`ligarCondicionais`,
  `interpretarCondicao`, `condicaoVale`); `data-campo-rotulo` e
  `data-campo-dica` nos campos; `data-form-texto` e `data-form-se` no
  preenchimento do modal (`textoDoValor`, `temValor`); `x-ui.card tone`
  ganha `success`, `info`, `warning`, `danger`; `abrirCamada` leva a camada
  ao fim do `<body>` a cada abertura (o modal aberto por último fica por
  cima). Quem liga os módulos um a um acrescenta `ligarCondicionais()` antes
  do `ligarNaoSalvo()`.
- **1.8.0** — O que os formulários compostos pedem: `x-ui.select multiple`
  (chips, caixa por opção, `old()` de lista, busca no servidor também);
  `x-ui.checkbox-group` (a lista curta de escolhas como um campo só);
  `data-nao-salvo` (`ligarNaoSalvo`, `marcarSalvo`, `estaSujo`: o aviso de
  alterações não salvas pelo modal de confirmação); `size="cell"` e `width` no
  `x-ui.money` e no `x-ui.percent`; `data-modal-titulo` e `data-form` no botão
  que abre o modal; o preenchimento e os erros do JavaScript entendem listas
  (`roles[]`, `roles.1`); `ligarPreenchimentos` idempotente. Quem liga os
  módulos um a um acrescenta `ligarNaoSalvo()` entre os módulos do projeto e o
  `ligarEnvios()`.
- **1.7.4** — `'info' => '…'` no cabeçalho do `x-ui.table` (o ícone de explicação
  da coluna; `x-ui.label-info` ganha `label` para o leitor de tela);
  `x-ui.stat-card variant="filled"`; o select remoto lê `data-seletor-fonte` a
  cada busca (a tela pode trocar a URL depois); `limparLinhas(envelope)` no
  repetidor; a barra `data-filtros` religa no `pageshow` só o que ela mesma
  desligou; `SelectOptions::term()` não cai com `?q[]=x`.
- **1.7.3** — `remember` em todo campo (`money`, `date`, `date-range`, `number`,
  `percent`, `textarea`, `checkbox`, além de `select`, `toggle` e `repeater`; no
  `input` chama-se `keeps-input`); `hint` no `x-ui.select`; `icon` no
  `x-ui.button`; `x-ui.tabs` não cai com `?aba[]=x`; o modal foca o primeiro
  campo, não o X; `disabled`/`readonly` postos no nativo do `money` e do `date`
  depois de montados passam ao campo visível; o preenchimento do modal liga a
  caixa também pelo valor dela (`value="active"` com `'active'`).
- **1.7.2** — Toggle e checkbox voltam do erro no estado enviado também com `falsy`
  de texto (ligado é "o que voltou é o valor do ligado"); `remember` no
  `x-ui.repeater`; `definirImagemGravada(envelope, src)` troca a imagem gravada
  de um `x-ui.image` já montado (o modal de logo que serve a todas as linhas);
  `data-modal-titulo` no título do `x-ui.modal`.
- **1.7.1** — O que as primeiras listagens do ERP pediram: `x-ui.badge variant="outline"`;
  `falsy` do toggle e do checkbox aceita o valor do desligado (`:falsy="'inactive'"`), e o
  escondido ganha `data-falsy`, que o preenchimento do modal (`data-form-valores`) não
  sobrescreve; `remember` no `x-ui.select`; no modelo do menu, `{chave}` com objeto vira
  JSON; a barra `data-filtros` leva o `por_pagina` da URL.
- **1.7.0** — As peças de listagem e de formulário composto:
  - `x-ui.repeater` (linhas que se adicionam, removem e movem; `old()` por
    índice; evento `ui:repetidor`; `adicionarLinha()`);
  - `x-ui.file` e `x-ui.image` (prévia local, validação de tipo e tamanho,
    `{name}_remove` para tirar a imagem gravada);
  - `x-ui.select`: opção com segunda linha e dados (`caption`/`extra` em
    `options` e em `SelectOptions::response`; `selected-caption`/`selected-extra`),
    evento `ui:selecionado` e `escolhaDe()`, `prefetch`; na busca no servidor, a
    opção vazia sai da frente do resultado e o Enter escolhe a primeira que veio;
  - `data-filtros`: a barra de filtros que se envia sozinha (`ligarFiltros`);
  - `data-form-valores` / `data-form-action`: o modal de editar preenchido pela
    linha (`preencherFormulario`);
  - os ids de `select` e `checkbox` deixam de passar por `Str::slug` (o `__i__`
    do repetidor sobrevive). Quem liga os módulos um a um acrescenta
    `ligarRepetidores()`, `ligarArquivos()`, `ligarImagens()`, `ligarFiltros()` e
    `ligarPreenchimentos()`.
- **1.6.0** — O que um ERP pede dos campos, sem prop de projeto:
  - todo campo aceita nome com colchete (`items[0][price]`: `old()` e erro por
    `items.0.price`, id `items-0-price`, via `Targos\Ui\FieldName`) e a prop `id`;
  - `x-ui.number` (inteiro com − e +) e `x-ui.percent` (4 casas, digitado em
    centésimos); `x-ui.money` ganha `scale` (4 casas para custo), `allow-zero` e
    negativo pelo `min`; `money`, `date` e `date-range` levam `form`, `disabled`,
    `readonly`, `autofocus`, `tabindex` e `autocomplete` ao campo nativo;
  - máscaras: `documento` (CPF ou CNPJ), `validate` (dígito verificador no blur)
    e `unmasked` (envia sem pontuação);
  - `x-ui.tabs`: `fields` (selo de erros por aba e abertura na aba do problema),
    `links` (abas de navegação), teclado, evento `ui:aba`; o campo escondido
    deixa de sair com `form=""`;
  - `x-ui.checkbox` mostra erro e aceita `hint`; `x-ui.radio-group` ganha
    `required`, `info` e `disabled`; `x-ui.card` ganha os slots `actions` e
    `footer`; `x-ui.offcanvas :open` e `window.fecharOffcanvas`;
  - toast `info`, `config('ui.toast_seconds')` e `x-ui.toast :code`;
  - no JavaScript: `requisicaoJson`, `mensagemDe`, `ErroDeRequisicao`
    (fetch.js), `mostrarErros` e cia. (errors.js), `confirmar()` por promessa.
    Quem liga os módulos um a um acrescenta `ligarNumeros()` e `ligarPercentuais()`.
- **1.5.0** — `x-ui.select :source` (busca no servidor, com `Targos\Ui\SelectOptions`
  e `config('ui.select.limit')`), menu ⋮ montado por modelo (`x-ui.dropdown template`,
  `x-ui.dropdown-template`, `x-ui.dropdown-separator`, `data-mostra-se`,
  `data-codigo-unico`) e `Icons::exists` por índice.
- **1.4.3** — `x-ui.money` e `x-ui.date-range` deixam de depender de classes do
  projeto: `Targos\Ui\Money` e `Targos\Ui\DateShortcuts` passam a vir no pacote.
- **1.4.2** — `x-ui.stat-card`: `info` (ícone de informação com dica, no canto)
  e `trend` (gráfico no pé do card, encostado na base e nas laterais).
  `x-ui.chart` ganha `sparkline`.
- **1.4.1** — `x-ui.stat-card` ganha `size="lg"`: número maior e mais pesado.
- **1.4.0** — Gráficos: `<x-ui.chart>`, sobre o ApexCharts, com as cores, a
  fonte e o tema do design system. **Exige `npm install apexcharts` no
  projeto**; quem liga os módulos um a um no `app.js` acrescenta
  `ligarGraficos()`.
- **1.3.21** — Na barra recolhida, a dica do item não pisca mais ao clicar
  (era refeita a cada etapa do clique).
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
