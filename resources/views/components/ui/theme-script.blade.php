@props([
    // O tema de quem nunca escolheu: `light` ou `dark`.
    'default' => 'light',
])

{{--
    O que precisa estar no <html> antes da primeira pintura. Inline e
    síncrono por isso; vai no <head>, antes das folhas de estilo.

    - O tema: sem a classe `dark` na primeira pintura, a tela pisca
      clara antes de escurecer. A chave `tema` é a que o botão
      `data-troca-tema` grava (theme.js).

    - A barra lateral recolhida: sem o `data-sidebar`, ela apareceria
      aberta e encolheria a cada página. A chave `sidebar` é a que o
      botão `data-recolhe-barra` grava (sidebar.js).
--}}
<script>
    (() => {
        let tema = @json($default);
        let barra = null;

        try {
            tema = localStorage.getItem('tema') ?? tema;
            barra = localStorage.getItem('sidebar');
        } catch {
            // Armazenamento bloqueado: fica no padrão.
        }

        document.documentElement.classList.toggle('dark', tema === 'dark');

        if (barra === 'recolhida') {
            document.documentElement.dataset.sidebar = 'recolhida';
        }
    })();
</script>
