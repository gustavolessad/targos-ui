{{--
    A barra lateral do painel. Modelo do targos/ui: este arquivo é do
    projeto — o logo e os itens do menu são daqui.

    O layout a desenha duas vezes (fixa no computador, gaveta no
    celular): o que tiver `id` aqui dentro precisa de um por desenho.

    `match` é o padrão de nome de rota que acende o item (`clients.*`).
--}}
<x-ui.sidebar>
    <x-slot:logo>
        <a href="{{ url('/') }}" class="text-base font-semibold text-neutral-900 dark:text-white">
            {{ config('app.name') }}
        </a>
    </x-slot:logo>

    {{-- O logo reduzido, para a barra recolhida: um símbolo que caiba em 64px. --}}
    <x-slot:symbol>
        <a href="{{ url('/') }}" aria-label="{{ config('app.name') }}"
           class="flex size-9 items-center justify-center rounded-lg bg-primary-600 text-base font-semibold text-primary-contrast">
            {{ mb_strtoupper(mb_substr(config('app.name'), 0, 1)) }}
        </a>
    </x-slot:symbol>

    {{-- Cada bloco de itens é uma div; os blocos se separam só pelo espaço, sem título. --}}
    <div class="space-y-0.5">
        <x-ui.nav-item icon="layout-dashboard" :href="url('/')" match="dashboard">
            Início
        </x-ui.nav-item>

        <x-ui.nav-group icon="folder" label="Cadastros" match="registers.*">
            <x-ui.nav-item href="#" match="registers.example">Exemplo</x-ui.nav-item>
        </x-ui.nav-group>
    </div>

    <div class="space-y-0.5">
        <x-ui.nav-item icon="settings" href="#" match="settings.*">
            Configurações
        </x-ui.nav-item>
    </div>
</x-ui.sidebar>
