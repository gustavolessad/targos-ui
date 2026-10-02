@props([
    'title' => 'Confirmar ação',
    'cancel' => 'Voltar',
    'confirm' => 'Confirmar',
])

{{--
    A confirmação das ações que não voltam atrás. Os formulários e
    botões marcam `data-confirmar="texto"`; o confirm.js abre este modal
    com o texto e só envia depois do "Confirmar".
    `data-confirmar-perigo` pinta o botão de vermelho (exclusões).
    No JavaScript, `confirmar(texto, { perigo })` faz a mesma pergunta
    e devolve uma promessa (`true` só no "Confirmar").

    Um por página, no layout do painel (o modelo do pacote já o traz).
--}}
<x-ui.modal id="confirmacao" :title="$title">
    <p data-confirmacao-texto></p>

    <x-slot:footer>
        <x-ui.button variant="secondary" data-fecha-modal>{{ $cancel }}</x-ui.button>
        <x-ui.button data-confirmacao-ok>{{ $confirm }}</x-ui.button>
        <x-ui.button variant="danger" data-confirmacao-ok-perigo hidden>{{ $confirm }}</x-ui.button>
    </x-slot:footer>
</x-ui.modal>
