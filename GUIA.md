# Guia de uso do targos/ui

Como instalar, usar no dia a dia, personalizar e lançar versões do design
system. Para a referência técnica completa, veja o [README](README.md).

## A ideia em duas frases

- **Componentes** (`<x-ui.button>`, `<x-ui.input>`, …) são o padrão: moram no
  pacote e são iguais em todos os projetos.
- **Modelos** (layout do painel, barra lateral, login) são arquivos prontos que
  o pacote **copia** para o seu projeto. Depois de copiados são seus: pode
  editar à vontade.

---

## 1. Instalar num projeto novo

Faça os passos na ordem. Tudo roda na pasta do projeto Laravel.

### Passo 1 — Dizer ao Composer onde está o pacote

No `composer.json` do projeto, acrescente:

```json
"repositories": [
    { "type": "vcs", "url": "https://github.com/gustavolessad/targos-ui.git" }
]
```

### Passo 2 — Instalar o pacote

```bash
composer require targos/ui:^1.1
```

> O repositório é privado. Se o Composer pedir usuário e senha, é o acesso ao
> GitHub que falta (veja "Problemas comuns", no fim).

### Passo 3 — Instalar o Tailwind

```bash
npm install -D tailwindcss @tailwindcss/vite @tailwindcss/forms
```

### Passo 4 — Ligar o CSS

Em `resources/css/app.css`, deixe assim:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';

@source '../views';
@source '../js';

@import '../../vendor/targos/ui/resources/css/theme.css';
```

### Passo 5 — Ligar o JavaScript

No `vite.config.js`:

```js
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: ['resources/views/**', 'routes/**', 'vendor/targos/ui/resources/views/**'],
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@targos-ui': fileURLToPath(new URL('./vendor/targos/ui/resources/js/index.js', import.meta.url)),
        },
    },
});
```

Em `resources/js/app.js`:

```js
import { ligarUi } from '@targos-ui';

document.addEventListener('DOMContentLoaded', () => {
    ligarUi();
});
```

### Passo 6 — Copiar os modelos (layout, menu e login)

```bash
php artisan vendor:publish --tag=ui-templates
```

Isso cria quatro arquivos em `resources/views/`:

| Arquivo | Para que serve | O que você edita nele |
|---|---|---|
| `components/layouts/panel.blade.php` | Layout das telas do painel | Favicon, fonte |
| `components/layouts/guest.blade.php` | Layout das telas sem menu | Favicon, fonte |
| `components/admin/sidebar.blade.php` | Barra lateral | Logo e itens do menu |
| `auth/login.blade.php` | Tela de login | Logo, campos extras |

O comando **não sobrescreve** arquivo que já existe. Pode rodar de novo sem medo.

### Passo 7 — Ver funcionando

```bash
npm run dev
```

Crie uma tela de teste em `resources/views/teste.blade.php`:

```blade
<x-layouts.panel title="Teste">
    <x-ui.page-header title="Teste" />

    <x-ui.card title="Funcionou">
        <x-ui.button>Um botão</x-ui.button>
    </x-ui.card>
</x-layouts.panel>
```

E uma rota para ela em `routes/web.php`:

```php
Route::view('/teste', 'teste');
```

---

## 2. Comandos do dia a dia

| Quero… | Comando |
|---|---|
| Trabalhar com recarga automática | `npm run dev` |
| Gerar o CSS e o JS para produção | `npm run build` |
| Pegar a versão mais nova do pacote | `composer update targos/ui` |
| Ver qual versão está instalada | `composer show targos/ui` |
| Copiar os modelos (layout, menu, login) | `php artisan vendor:publish --tag=ui-templates` |
| Copiar a configuração para o projeto | `php artisan vendor:publish --tag=ui-config` |
| Limpar o cache das telas (quando algo "não atualiza") | `php artisan view:clear` |

Depois de `composer update targos/ui`, rode `php artisan view:clear` e
`npm run build` (ou deixe o `npm run dev` rodando).

---

## 3. Usar os componentes

A aparência se escolhe por **prop**, não por classe. Classe solta só para
posição (margem, largura).

### Botão

```blade
<x-ui.button>Salvar</x-ui.button>
<x-ui.button variant="secondary">Cancelar</x-ui.button>
<x-ui.button variant="danger" size="sm">Excluir</x-ui.button>
<x-ui.button :href="route('clients.create')">Novo cliente</x-ui.button>
```

Variantes: `primary`, `secondary`, `outline`, `success`, `danger`,
`danger-soft`, `ghost`, `inverse`. Tamanhos: `xs`, `sm`, `md`, `lg`, `xl`,
`icon`.

### Campos de formulário

```blade
<x-ui.input name="name" label="Nome" required />
<x-ui.input name="cpf" label="CPF" mask="cpf" />
<x-ui.password name="password" label="Senha" />
<x-ui.textarea name="notes" label="Observações" />
<x-ui.select name="state" label="Estado" :options="['SC' => 'Santa Catarina', 'SP' => 'São Paulo']" />
<x-ui.money name="amount" label="Valor" />
<x-ui.date name="due_date" label="Vencimento" />
<x-ui.toggle name="active" label="Ativo" :checked="true" />
<x-ui.checkbox name="terms" label="Li e aceito" />
```

Os campos já mostram o erro de validação embaixo e guardam o que foi digitado
quando o formulário volta.

### Cartão, selo e aviso

```blade
<x-ui.card title="Dados do cliente" subtitle="Informações de contato">
    …
</x-ui.card>

<x-ui.badge color="success">Pago</x-ui.badge>
<x-ui.badge color="danger">Vencido</x-ui.badge>

<x-ui.alert type="warning">Confira os dados antes de enviar.</x-ui.alert>
```

### Tabela

```blade
<x-ui.table :rows="$clients" :headers="[
    ['index' => 'name', 'label' => 'Nome'],
    ['index' => 'email', 'label' => 'E-mail'],
    ['label' => '', 'sortable' => false, 'align' => 'end'],
]">
    @foreach ($clients as $client)
        <x-ui.table.row>
            <x-ui.table.cell>{{ $client->name }}</x-ui.table.cell>
            <x-ui.table.cell>{{ $client->email }}</x-ui.table.cell>
            <x-ui.table.cell align="end">…</x-ui.table.cell>
        </x-ui.table.row>
    @endforeach
</x-ui.table>
```

Se `$clients` for uma paginação do Laravel, a tabela já mostra os links de
página.

### Modal

```blade
<x-ui.button data-abre-modal="novo-cliente">Novo cliente</x-ui.button>

<x-ui.modal id="novo-cliente" title="Novo cliente">
    …

    <x-slot:footer>
        <x-ui.button variant="secondary" data-fecha-modal>Cancelar</x-ui.button>
        <x-ui.button type="submit">Salvar</x-ui.button>
    </x-slot:footer>
</x-ui.modal>
```

### Pedir confirmação antes de enviar

Basta um atributo no formulário (ou no botão):

```blade
<form method="POST" action="…" data-confirmar="Excluir este cliente?" data-confirmar-perigo>
    @csrf @method('DELETE')
    <x-ui.button type="submit" variant="danger">Excluir</x-ui.button>
</form>
```

### Mensagem depois de salvar (toast)

No controller:

```php
return redirect()->route('clients.index')->with('success', 'Cliente salvo.');
```

Use `success`, `warning` ou `error`. O layout do painel já mostra a mensagem.

### Ícones

Qualquer ícone do [Lucide](https://lucide.dev/icons), pelo nome:

```blade
<x-ui.icon name="users" class="size-4" />
```

### Cabeçalho da tela

```blade
<x-ui.page-header title="Clientes" :back="route('dashboard')"
                  :breadcrumbs="[['Início', route('dashboard')], ['Clientes', null]]">
    <x-ui.button :href="route('clients.create')">Novo cliente</x-ui.button>
</x-ui.page-header>
```

### Itens do menu

No `components/admin/sidebar.blade.php` do projeto:

```blade
<x-ui.nav-item icon="users" :href="route('clients.index')" match="clients.*">
    Clientes
</x-ui.nav-item>

<x-ui.nav-group icon="wallet" label="Financeiro" match="finance.*">
    <x-ui.nav-item :href="route('finance.index')" match="finance.index">Lançamentos</x-ui.nav-item>
</x-ui.nav-group>
```

`match` é o nome da rota que deixa o item aceso (`clients.*` vale para todas as
rotas de clientes).

---

## 4. Personalizar

Escolha sempre a opção mais leve que resolve.

### Trocar a cor da marca ou a fonte

No `resources/css/app.css` do projeto, **depois** do import do tema:

```css
@theme {
    --color-primary-600: #41a741;
    --color-primary-700: #3e8f3e;
}
```

A escala vai de `--color-primary-50` a `--color-primary-950`; o `600` é a cor
principal dos botões.

### Mudar o layout, o menu ou o login

São arquivos do projeto (os modelos do passo 6). Abra e edite.

### Mudar o comportamento do checkbox ou as chaves do toast

```bash
php artisan vendor:publish --tag=ui-config
```

Cria `config/ui.php` no projeto. Lá:

- `falsy`: `true` faz checkbox e interruptor desmarcados enviarem `0`.
- `toast`: quais chaves de sessão viram mensagem.

### Substituir um componente só neste projeto

Crie um arquivo com o mesmo nome em `resources/views/components/ui/` do
projeto (por exemplo `button.blade.php`). Ele passa a valer no lugar do do
pacote. **Use só em último caso:** esse arquivo deixa de receber atualizações.

### Quando mudar o pacote

Se a mudança serve a mais de um projeto, ela vai no pacote (próxima seção).

---

## 5. Mudar o pacote e lançar uma versão

### Para testar a mudança num projeto antes de lançar

No projeto, aponte para a pasta local do pacote:

```bash
composer config repositories.targos-ui '{"type":"path","url":"../targos-ui","options":{"symlink":true}}'
composer require targos/ui:@dev
```

Agora o que você editar em `C:\Projetos\targos-ui` aparece no projeto na hora.

### Para lançar

Na pasta do pacote (`C:\Projetos\targos-ui`):

```bash
npm test
git add -A
git commit -m "feat: descrição da mudança"
git tag -a v1.2.0 -m "1.2.0"
git push origin main
git push origin v1.2.0
```

Qual número subir:

| Mudança | Exemplo | Versão |
|---|---|---|
| Correção que não muda como se usa | Ajuste de cor, bug | `1.1.0` → `1.1.1` |
| Novidade que não quebra nada | Componente novo, prop nova | `1.1.0` → `1.2.0` |
| Algo que quebra tela existente | Prop renomeada, componente removido | `1.1.0` → `2.0.0` |

### Para o projeto voltar a usar a versão lançada

```bash
composer config repositories.targos-ui vcs https://github.com/gustavolessad/targos-ui.git
composer require targos/ui:^1.2
```

---

## 6. Deploy

O servidor precisa conseguir baixar o repositório privado. Uma vez por
servidor, escolha um:

- **Chave SSH de deploy**: gere uma chave no servidor e cadastre a pública em
  GitHub → repositório `targos-ui` → Settings → Deploy keys.
- **Token**: crie um token de leitura no GitHub e rode no servidor
  `composer config --global github-oauth.github.com SEU_TOKEN`.

Depois, o deploy de sempre:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan view:cache
```

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Componente aparece sem estilo | CSS não foi gerado de novo | `npm run build` (ou deixe `npm run dev` rodando) |
| Mudei o pacote e a tela não mudou | Cache das telas | `php artisan view:clear` |
| "Unable to locate a class or view for component [ui.x]" | Pacote não instalado ou nome errado | `composer show targos/ui`; confira o nome em `vendor/targos/ui/resources/views/components/ui` |
| "Unable to locate … [layouts.panel]" | Os modelos não foram copiados | `php artisan vendor:publish --tag=ui-templates` |
| Ícone não aparece | Nome não existe no Lucide | Confira em lucide.dev/icons |
| Select, modal ou máscara não funcionam | JavaScript não ligado | Confira o `ligarUi()` no `app.js` e o apelido `@targos-ui` no `vite.config.js` |
| Composer pede senha ao instalar | Sem acesso ao repositório privado | Veja a seção "Deploy" |
| Tema escuro pisca ao carregar | Falta o `<x-ui.theme-script />` no `<head>` | Está no modelo do layout; confira se não foi removido |
