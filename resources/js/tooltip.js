/*
 * A dica que abre no clique (<x-ui.tooltip trigger="click">).
 *
 * Clicar no item liga/desliga `data-aberta` no envelope (o CSS mostra a
 * bolha); clicar fora ou apertar Esc fecha. Só uma aberta por vez. A de
 * hover não passa por aqui: é só CSS.
 */
function fecharTodas(exceto = null) {
    document.querySelectorAll('[data-dica-clique][data-aberta]').forEach((dica) => {
        if (dica !== exceto) {
            fechar(dica);
        }
    });
}

function gatilho(dica) {
    return dica.querySelector('button, a, [tabindex]');
}

function fechar(dica) {
    delete dica.dataset.aberta;
    gatilho(dica)?.setAttribute('aria-expanded', 'false');
}

function abrir(dica) {
    fecharTodas(dica);
    dica.dataset.aberta = '';
    gatilho(dica)?.setAttribute('aria-expanded', 'true');
}

export function ligarDicas(raiz = document) {
    raiz.querySelectorAll('[data-dica-clique]').forEach((dica, indice) => {
        if (dica.dataset.dicaLigada) {
            return;
        }

        dica.dataset.dicaLigada = '1';

        // O item anuncia a dica ao leitor de tela.
        const bolha = dica.querySelector('[role="tooltip"]');
        const alvo = gatilho(dica);

        if (bolha && alvo) {
            bolha.id ||= `dica-${indice}-${Math.random().toString(36).slice(2, 7)}`;
            alvo.setAttribute('aria-describedby', bolha.id);
            alvo.setAttribute('aria-expanded', 'false');
        }

        dica.addEventListener('click', (evento) => {
            // Clique dentro da bolha (selecionar texto) não fecha.
            if (bolha?.contains(evento.target)) {
                return;
            }

            if ('aberta' in dica.dataset) {
                fechar(dica);
            } else {
                abrir(dica);
            }
        });
    });
}

// Uma vez só, para a página inteira.
document.addEventListener('click', (evento) => {
    if (! evento.target.closest('[data-dica-clique]')) {
        fecharTodas();
    }
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        fecharTodas();
    }
});
