/*
 * A data única (<x-ui.date>).
 *
 * O `<input type="date">` nativo continua sendo o campo do formulário; aqui
 * ele fica visualmente escondido (sr-only, para a validação do navegador
 * ainda apontar para ele) e o usuário usa o campo `dd/mm/aaaa` com o
 * calendário. Digitar uma data válida vale igual a clicar.
 */
import { BOTAO_TEXTO, Calendario, avisar, deExibido, exibir, painelDoCalendario } from './calendar.js';

function montar(raiz) {
    if (raiz.dataset.dataLigada) {
        return;
    }

    raiz.dataset.dataLigada = '1';

    const nativo = raiz.querySelector('[data-data-nativo]');
    const campo = raiz.querySelector('[data-data-campo]');
    const texto = raiz.querySelector('[data-data-texto]');
    const botao = raiz.querySelector('[data-data-abrir]');
    const painel = raiz.querySelector('[data-calendario-painel]');
    const { hoje, min = null, max = null } = raiz.dataset;

    raiz.querySelector('[data-data-nativo-caixa]').classList.add('sr-only');
    nativo.tabIndex = -1;
    nativo.setAttribute('aria-hidden', 'true');
    campo.hidden = false;

    // O `id` do nativo pode vir de fora (prop `id`), com qualquer caractere: daí o escape.
    texto.id = `${nativo.id}-texto`;
    raiz.querySelector(`label[for="${CSS.escape(nativo.id)}"]`)?.setAttribute('for', texto.id);
    painel.setAttribute('aria-label', 'Escolher data');

    /*
     * O `autofocus` vem no nativo, que é o que aparece sem JS. Escondido
     * ele, quem recebe o foco é o campo visível — inclusive o do modal,
     * que procura `[autofocus]` ao abrir e acharia o nativo primeiro.
     */
    if (nativo.autofocus) {
        nativo.autofocus = false;
        texto.autofocus = true;

        if (document.activeElement === nativo) {
            texto.focus();
        }
    }

    /*
     * Desligado ou só leitura, o calendário não abre: escolher nele
     * gravaria no nativo por fora da trava. Lido na hora, e não ao
     * montar, porque outro script pode desligar o campo depois.
     */
    const travado = () => nativo.disabled || nativo.readOnly;

    // A trava posta no nativo depois de montado passa ao campo digitável e ao botão do calendário.
    const espelharTrava = () => {
        texto.disabled = nativo.disabled;
        texto.readOnly = nativo.readOnly;
        botao.disabled = travado();
    };

    new MutationObserver(espelharTrava).observe(nativo, { attributes: true, attributeFilter: ['disabled', 'readonly'] });

    const grade = document.createElement('div');
    const rodape = document.createElement('div');
    rodape.className = 'mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800';
    rodape.innerHTML = `<button type="button" data-acao="hoje" class="${BOTAO_TEXTO}">Hoje</button>`
        + `<button type="button" data-acao="limpar" class="${BOTAO_TEXTO}">Limpar</button>`;
    painel.replaceChildren(grade, rodape);

    let ultimoValido = nativo.value;

    const marcarInvalido = (invalido) => {
        if (invalido) {
            texto.setAttribute('aria-invalid', 'true');
        } else {
            texto.removeAttribute('aria-invalid');
        }
    };

    const gravar = (data) => {
        nativo.value = data ?? '';
        ultimoValido = nativo.value;
        texto.value = exibir(data);
        marcarInvalido(false);
        avisar(nativo);
    };

    const calendario = new Calendario(grade, {
        modo: 'unica',
        hoje,
        min,
        max,
        aoEscolher: (data) => {
            gravar(data);
            fechar();
            texto.focus();
        },
    });

    const painelAberto = painelDoCalendario(campo, raiz, painel, () => fechar());

    const abrir = () => {
        if (painelAberto.aberto || travado()) {
            return;
        }

        calendario.definir(nativo.value || null);
        painelAberto.abrir();
        texto.setAttribute('aria-expanded', 'true');
    };

    function fechar() {
        painelAberto.fechar();
        texto.setAttribute('aria-expanded', 'false');
    }

    texto.addEventListener('click', abrir);

    botao.addEventListener('click', () => {
        if (painelAberto.aberto) {
            fechar();
        } else if (! travado()) {
            abrir();
            calendario.focar();
        }
    });

    texto.addEventListener('keydown', (evento) => {
        if ((evento.key === 'ArrowDown' || evento.key === 'Enter') && ! painelAberto.aberto && ! travado()) {
            evento.preventDefault();
            abrir();
            calendario.focar();
        }
    });

    // A máscara formata antes (foi ligada primeiro); aqui só se lê o resultado.
    texto.addEventListener('input', () => {
        if (texto.value === '') {
            nativo.value = '';
            ultimoValido = '';
            marcarInvalido(false);
            avisar(nativo);

            return;
        }

        const data = deExibido(texto.value);

        if (data && ! calendario.bloqueado(data)) {
            nativo.value = data;
            ultimoValido = data;
            marcarInvalido(false);
            avisar(nativo);

            if (painelAberto.aberto) {
                calendario.definir(data);
            }
        } else {
            marcarInvalido(texto.value.length === 10);
        }
    });

    // Outro código pode gravar no nativo e disparar `change` (ex.: o modal
    // de pagamento preenche a data): o campo visível acompanha.
    nativo.addEventListener('change', () => {
        if (nativo.value !== ultimoValido) {
            ultimoValido = nativo.value;
            texto.value = exibir(nativo.value);
            marcarInvalido(false);
        }
    });

    // Ao sair com uma data incompleta ou inválida, volta a última válida.
    texto.addEventListener('blur', () => {
        if (texto.value !== exibir(ultimoValido)) {
            texto.value = exibir(ultimoValido);
            marcarInvalido(false);
        }
    });

    rodape.addEventListener('click', (evento) => {
        const acao = evento.target.closest('[data-acao]')?.dataset.acao;

        if (acao === 'hoje' && ! calendario.bloqueado(hoje)) {
            gravar(hoje);
        } else if (acao === 'limpar') {
            gravar(null);
        } else {
            return;
        }

        fechar();
        texto.focus();
    });
}

export function ligarDatas(raiz = document) {
    raiz.querySelectorAll('[data-data]').forEach(montar);
}
