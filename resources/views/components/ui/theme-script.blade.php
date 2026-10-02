@props([
    // O tema de quem nunca escolheu: `light` ou `dark`.
    'default' => 'light',
])

{{--
    O tema antes do CSS: a classe precisa estar no <html> na primeira
    pintura, ou a tela pisca clara antes de escurecer. Inline e
    síncrono por isso; vai no <head>, antes das folhas de estilo.

    A chave `tema` é a mesma que o botão `data-troca-tema` grava
    (theme.js).
--}}
<script>
    (() => {
        let tema = @json($default);

        try {
            tema = localStorage.getItem('tema') ?? tema;
        } catch {
            // Armazenamento bloqueado: fica no padrão.
        }

        document.documentElement.classList.toggle('dark', tema === 'dark');
    })();
</script>
