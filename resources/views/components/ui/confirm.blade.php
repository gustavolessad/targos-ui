@props([
    'title' => 'Confirmar ação',
    'cancel' => 'Voltar',
    'confirm' => 'Confirmar',
])

{{--
    A confirmação das ações que não voltam atrás. Os formulários e
    botões marcam `data-confirmar="texto"`; o confirm.js abre este modal
    com o texto e só envia depois do "Confirmar".
    `data-confirmar-perigo` pinta o botão de vermelho (exclusões);
    `data-confirmar-titulo` e `data-confirmar-botao` trocam o título e
    o texto do botão só naquela pergunta (sem eles, valem `title` e
    `confirm` daqui). No JavaScript, `confirmar(texto, { perigo, titulo,
    botao })` faz a mesma pergunta e devolve uma promessa (`true` só no
    "Confirmar").

    Um por página, no layout do painel (o modelo do pacote já o traz).
--}}
<x-ui.modal id="confirmacao" :title="$title">
    {{-- `whitespace-pre-line`: um `\n` na pergunta quebra a linha ("Cancelar a venda 12?\nO estoque volta ao depósito."). --}}
    <p class="whitespace-pre-line" data-confirmacao-texto></p>

    <x-slot:footer>
        <x-ui.button variant="secondary" data-fecha-modal>{{ $cancel }}</x-ui.button>
        <x-ui.button data-confirmacao-ok>{{ $confirm }}</x-ui.button>
        <x-ui.button variant="danger" data-confirmacao-ok-perigo hidden>{{ $confirm }}</x-ui.button>
    </x-slot:footer>
</x-ui.modal>
