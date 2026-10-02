/*
 * O período (<x-ui.date-range>).
 *
 * Os dois `<input type="date">` nativos (início e fim) são os campos do
 * formulário; aqui ficam visualmente escondidos e o usuário usa o botão com
 * o intervalo. No calendário: 1º clique = início, 2º = fim (invertem se o
 * fim vier antes). A escolha só vale no "Aplicar" — fechar sem aplicar
 * descarta, para um filtro com `onchange` não disparar pela metade.
 */
import { BOTAO_TEXTO, Calendario, avisar, exibir, noCelular, painelDoCalendario } from './calendar.js';

const BOTAO_ATALHO = 'w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-start text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white';
const BOTAO_APLICAR = 'cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-primary-contrast transition hover:bg-primary-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-primary-600';

const intervalo = (inicio, fim) => (inicio && fim ? `${exibir(inicio)} até ${exibir(fim)}` : '');

function montar(raiz) {
    if (raiz.dataset.periodoLigado) {
        return;
    }

    raiz.dataset.periodoLigado = '1';

    const nativos = raiz.querySelector('[data-periodo-nativos]');
    const inicio = raiz.querySelector('[data-periodo-inicio]');
    const fim = raiz.querySelector('[data-periodo-fim]');
    const gatilho = raiz.querySelector('[data-periodo-gatilho]');
    const texto = raiz.querySelector('[data-periodo-texto]');
    const painel = raiz.querySelector('[data-calendario-painel]');
    const { hoje, min = null, max = null } = raiz.dataset;
    const atalhos = JSON.parse(raiz.dataset.atalhos || '[]');

    nativos.classList.add('sr-only');
    [inicio, fim].forEach((campo) => {
        campo.tabIndex = -1;
        campo.setAttribute('aria-hidden', 'true');
    });
    gatilho.hidden = false;
    gatilho.id = `${inicio.id}-periodo`;
    raiz.querySelector(`label[for="${inicio.id}"]`)?.setAttribute('for', gatilho.id);
    painel.setAttribute('aria-label', 'Escolher período');

    // --- O conteúdo do painel: atalhos (se houver), calendário e rodapé ---

    const colunaAtalhos = document.createElement('div');
    const grade = document.createElement('div');
    const rodape = document.createElement('div');

    if (atalhos.length) {
        const grupos = [...new Set(atalhos.map((a) => a.group))];

        colunaAtalhos.className = 'flex flex-col gap-3 border-neutral-200 pb-3 sm:w-40 sm:border-e sm:pe-3 sm:pb-0 dark:border-neutral-800 max-sm:border-b';
        colunaAtalhos.innerHTML = grupos.map((grupo) => `<div class="space-y-0.5">${
            grupos.length > 1 && grupo ? `<p class="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">${grupo}</p>` : ''
        }${atalhos.map((atalho, indice) => (atalho.group === grupo
            ? `<button type="button" data-atalho="${indice}" class="${BOTAO_ATALHO}"></button>`
            : '')).join('')}</div>`).join('');

        // O rótulo entra como texto, nunca como HTML.
        colunaAtalhos.querySelectorAll('[data-atalho]').forEach((botao) => {
            botao.textContent = atalhos[Number(botao.dataset.atalho)].label;
        });
    }

    rodape.className = 'mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800';
    rodape.innerHTML = '<span class="text-sm text-neutral-600 dark:text-neutral-300" data-resumo></span>'
        + `<span class="flex items-center gap-1"><button type="button" data-acao="limpar" class="${BOTAO_TEXTO}">Limpar</button>`
        + `<button type="button" data-acao="aplicar" class="${BOTAO_APLICAR}">Aplicar</button></span>`;

    const direita = document.createElement('div');
    direita.append(grade, rodape);

    const corpo = document.createElement('div');
    corpo.className = 'flex flex-col gap-3 sm:flex-row';
    corpo.append(...(atalhos.length ? [colunaAtalhos] : []), direita);
    painel.replaceChildren(corpo);

    const resumo = rodape.querySelector('[data-resumo]');
    const aplicar = rodape.querySelector('[data-acao="aplicar"]');

    const atualizarRodape = () => {
        resumo.textContent = intervalo(calendario.inicio, calendario.fim)
            || (calendario.inicio ? `${exibir(calendario.inicio)} até… escolha o fim` : 'Escolha o início');
        // aria-disabled, não disabled: o rótulo do campo fica cinza com
        // `group-has-disabled`, e o painel mora dentro do grupo.
        aplicar.setAttribute('aria-disabled', String(! (calendario.inicio && calendario.fim)));
    };

    const calendario = new Calendario(grade, {
        modo: 'periodo',
        meses: 2,
        hoje,
        min,
        max,
        aoEscolher: atualizarRodape,
    });

    const painelAberto = painelDoCalendario(gatilho, raiz, painel, () => fechar());

    const mostrarValor = () => {
        const valor = intervalo(inicio.value, fim.value);

        texto.textContent = valor || gatilho.dataset.placeholder;
        texto.classList.toggle('text-neutral-400', ! valor);
    };

    const abrir = () => {
        calendario.meses = noCelular() ? 1 : 2;
        calendario.definir(inicio.value || null, fim.value || null);
        atualizarRodape();
        painelAberto.abrir();
        gatilho.setAttribute('aria-expanded', 'true');
    };

    function fechar() {
        painelAberto.fechar();
        gatilho.setAttribute('aria-expanded', 'false');
    }

    const gravar = (de, ate) => {
        inicio.value = de ?? '';
        fim.value = ate ?? '';
        mostrarValor();
        avisar(inicio);
        avisar(fim);
    };

    gatilho.addEventListener('click', () => {
        if (painelAberto.aberto) {
            fechar();
        } else {
            abrir();
        }
    });

    gatilho.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowDown' && ! painelAberto.aberto) {
            evento.preventDefault();
            abrir();
            calendario.focar();
        }
    });

    colunaAtalhos.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-atalho]');

        if (! botao) {
            return;
        }

        const atalho = atalhos[Number(botao.dataset.atalho)];
        calendario.definir(atalho.start, atalho.end);
        atualizarRodape();
    });

    rodape.addEventListener('click', (evento) => {
        const acao = evento.target.closest('[data-acao]')?.dataset.acao;

        if (acao === 'aplicar' && calendario.inicio && calendario.fim) {
            gravar(calendario.inicio, calendario.fim);
        } else if (acao === 'limpar') {
            gravar(null, null);
        } else {
            return;
        }

        fechar();
        gatilho.focus();
    });

    mostrarValor();
}

export function ligarPeriodos(raiz = document) {
    raiz.querySelectorAll('[data-periodo]').forEach(montar);
}
