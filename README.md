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
| `links` | `chave => URL`: as abas viram links para outras telas. Não há painéis nem campo escondido; o slot é o conteúdo da tela, desenhado abaixo da barra. A aba ativa é a de `active` ou, sem ela, a da URL atual |
| `form` | O `id` do formulário, quando as abas ficam fora dele |

Quando o formulário volta com erro e a aba aberta não tem nenhum, abre a
primeira aba que tem (a não ser que a tela passe `active`). No teclado, as
setas trocam de aba, e Home e End vão às pontas. Cada troca dispara `ui:aba`
no `document`, com `detail: { grupo, aba }`.

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

`variant` (`primary`, `secondary`, `outline`, `success`, `danger`, `danger-soft`,
`ghost`, `ghost-contrast`, `inverse`), `size` (`xs` a `xl`, ou `icon`,
`icon-sm`, `icon-xs` para o botão só de ícone), `href` (vira `<a>`) e `icon`
(um ícone do Lucide antes do texto).

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
`['value', 'label', 'hint']`; `inline` põe as caixas lado a lado; `remember`
como nos outros campos.

## Selo

```blade
<x-ui.badge color="success">Pago</x-ui.badge>
<x-ui.badge color="warning" variant="outline">Em aberto</x-ui.badge>
```

`color` é o significado (`neutral`, `success`, `warning`, `info`, `accent`,
`danger`, `primary`); `variant="outline"` deixa só o contorno e o texto na
cor, para o estado que acompanha outro na mesma linha sem competir com ele;
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
| `data-confirmar="texto"` | Pergunta antes de enviar o formulário; `data-confirmar-perigo` pinta de vermelho |
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

```blade
<x-ui.number name="installments" label="Parcelas" :min="1" :max="48" />
<x-ui.number name="items[0][qty]" size="cell" :min="0" />
```

`x-ui.number` é o inteiro: campo de texto com teclado numérico e os botões − e
+ à direita (as setas ↑ e ↓ fazem o mesmo). Aceita só dígitos, e o "-" no
começo quando não há `min` ou ele é negativo. Ao sair do campo, o valor volta
para dentro de `min`/`max`, e o vazio vira o `min`. Props: `min`, `max`
(sem padrão), `step` (quanto o − e o + andam; padrão 1), `size` (`xs` a `lg`,
ou `cell`: só o campo, para tabela), `width`, `id`, `placeholder`, `hint`,
`info`, `required`. Os atributos soltos, `class` inclusive, vão para o
`<input>`.

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
`info`, `required`. Colar aceita "3,25", "3.25", "3" e "3.2500".

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

Na linha nova, os campos do pacote já vêm ligados (máscara, select, data,
período, valor, número, percentual, dica). O que é do projeto se liga pelo
evento `ui:repetidor`, que sobe do envelope com
`detail: { acao: 'adicionado' | 'removido' | 'movido', item, indice }`
(`item` é o elemento da linha). `adicionarLinha(envelope)` acrescenta uma linha
por código (o produto escolhido numa busca vira item da venda) e devolve o
elemento, ou `null` no teto. Repetidor dentro de repetidor não funciona.

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
`autofocus` só para o início). O resto (`class`, `data-*`, `on*`, `aria-*`,
`style`) continua no envelope, e o `onchange` posto nele segue recebendo o
evento dos nativos. Desligado ou só leitura, o calendário não abre e o campo
digitável fica desligado também.

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
`*`), `info` (o ícone de explicação ao lado do rótulo) e `disabled` (os valores
que não se escolhem, à vista mas apagados; `true` desliga o grupo inteiro).

```blade
<x-ui.radio-group name="forma" label="Forma de pagamento" required
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
```

`confirmar(texto, { perigo })` faz a pergunta no mesmo modal do
`data-confirmar` (o `<x-ui.confirm>` precisa estar na página) e devolve
`true` no "Confirmar" e `false` em qualquer outra saída. Uma pergunta por vez:
chamada com outra aberta, volta `false` na hora. Também está em
`window.confirmar`, como `window.mostrarToast(tipo, texto)`, que mostra um
aviso sem recarregar a página.

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
