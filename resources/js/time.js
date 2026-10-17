/*
 * A hora (<x-ui.time>).
 *
 * Como a data: o `<input type="time">` nativo continua sendo o campo do
 * formulário, em `HH:mm`; aqui ele fica visualmente escondido (sr-only,
 * para a validação do navegador ainda apontar para ele) e o usuário usa o
 * campo `hh:mm` digitável, com o painel de duas colunas — hora e minuto —
 * que rolam cada uma. Digitar uma hora válida vale igual a clicar.
 *
 * O painel é a caixa do calendário (`painelDoCalendario`): flutuante no
 * computador, folha por baixo no celular.
 */
import { BOTAO_TEXTO, avisar, painelDoCalendario } from './calendar.js';

const PASSO_PADRAO = 5;

// `scroll-discreto`: a barra fina do tema (resources/css/theme.css), e não a do sistema, com setas.
const COLUNA = 'scroll-discreto relative h-56 w-20 space-y-1 overflow-y-auto overscroll-contain p-0.5 sm:h-48 sm:w-16';
const ITEM = 'flex h-11 w-full items-center justify-center rounded-lg text-sm tabular-nums transition sm:h-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50';
const ESCOLHIDO = 'bg-primary-600 font-semibold text-primary-contrast';
const LIVRE = 'cursor-pointer text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800';
const FORA = 'cursor-not-allowed text-neutral-300 line-through dark:text-neutral-700';
const TITULO_DA_COLUNA = 'pb-1 text-xs font-medium text-neutral-400 dark:text-neutral-500';

const dois = (numero) => String(numero).padStart(2, '0');

/** O que se digitou, em `HH:mm`, se for uma hora de verdade; senão, null. */
export function deDigitado(texto) {
    const achado = /^(\d{2}):(\d{2})$/.exec(String(texto ?? ''));

    if (! achado) {
        return null;
    }

    return Number(achado[1]) < 24 && Number(achado[2]) < 60 ? `${achado[1]}:${achado[2]}` : null;
}

/** Os minutos da coluna: de `passo` em `passo` a partir do zero. Passo inválido é o de 5. */
export function minutosDaColuna(passo) {
    const numero = Number.parseInt(passo, 10);
    const valido = Number.isInteger(numero) && numero > 0 ? numero : PASSO_PADRAO;
    const minutos = [];

    for (let minuto = 0; minuto < 60; minuto += valido) {
        minutos.push(minuto);
    }

    return minutos;
}

/** A hora (`HH:mm`) fica antes do `min` ou depois do `max`. Os dois valem inclusive; `HH:mm` se compara como texto. */
export function foraDosLimites(hora, { min = null, max = null } = {}) {
    return (!! min && hora < min) || (!! max && hora > max);
}

/** Nenhum minuto da hora cabe nos limites: a hora inteira fica de fora. */
export function horaSemMinutoLivre(hora, { min = null, max = null } = {}) {
    return foraDosLimites(`${dois(hora)}:59`, { min }) || foraDosLimites(`${dois(hora)}:00`, { max });
}

/** A hora do relógio, em `HH:mm`. */
export function agoraDe(data = new Date()) {
    return `${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

/** Rola a coluna só o necessário para o botão aparecer inteiro. */
function mostrar(coluna, botao) {
    if (botao.offsetTop < coluna.scrollTop) {
        coluna.scrollTop = botao.offsetTop;
    } else if (botao.offsetTop + botao.offsetHeight > coluna.scrollTop + coluna.clientHeight) {
        coluna.scrollTop = botao.offsetTop + botao.offsetHeight - coluna.clientHeight;
    }
}

/** Rola a coluna até o botão ficar no meio dela, sem mexer na página. */
function centralizar(coluna, botao) {
    if (botao) {
        coluna.scrollTop = botao.offsetTop - (coluna.clientHeight - botao.offsetHeight) / 2;
    }
}

function coluna(titulo, valores) {
    const envelope = document.createElement('div');
    envelope.className = 'flex flex-col items-center';

    const rotulo = document.createElement('span');
    rotulo.className = TITULO_DA_COLUNA;
    rotulo.textContent = titulo;

    const lista = document.createElement('div');
    lista.className = COLUNA;
    lista.setAttribute('role', 'listbox');
    lista.setAttribute('aria-label', titulo);

    lista.append(...valores.map((valor) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.setAttribute('role', 'option');
        botao.dataset.valor = String(valor);
        botao.textContent = dois(valor);

        return botao;
    }));

    envelope.append(rotulo, lista);

    return { envelope, lista };
}

function montar(raiz) {
    if (raiz.dataset.horarioLigado) {
        return;
    }

    raiz.dataset.horarioLigado = '1';

    const nativo = raiz.querySelector('[data-horario-nativo]');
    const campo = raiz.querySelector('[data-horario-campo]');
    const texto = raiz.querySelector('[data-horario-texto]');
    const botao = raiz.querySelector('[data-horario-abrir]');
    const painel = raiz.querySelector('[data-horario-painel]');

    raiz.querySelector('[data-horario-nativo-caixa]').classList.add('sr-only');
    nativo.tabIndex = -1;
    nativo.setAttribute('aria-hidden', 'true');
    campo.hidden = false;

    // O `id` do nativo pode vir de fora (prop `id`), com qualquer caractere: daí o escape.
    texto.id = `${nativo.id}-texto`;
    raiz.querySelector(`label[for="${CSS.escape(nativo.id)}"]`)?.setAttribute('for', texto.id);
    painel.setAttribute('aria-label', 'Escolher hora');

    // O `autofocus` vem no nativo, que é o que aparece sem JS: escondido ele, passa ao campo visível.
    if (nativo.autofocus) {
        nativo.autofocus = false;
        texto.autofocus = true;

        if (document.activeElement === nativo) {
            texto.focus();
        }
    }

    // Lidos na hora de usar, e não ao montar: a tela pode mudar os limites depois (o fim depois do início).
    const limites = () => ({ min: raiz.dataset.min || null, max: raiz.dataset.max || null });

    // Desligado ou só leitura, o painel não abre: escolher nele gravaria no nativo por fora da trava.
    const travado = () => nativo.disabled || nativo.readOnly;

    const espelharTrava = () => {
        texto.disabled = nativo.disabled;
        texto.readOnly = nativo.readOnly;
        botao.disabled = travado();
    };

    new MutationObserver(espelharTrava).observe(nativo, { attributes: true, attributeFilter: ['disabled', 'readonly'] });

    const horas = coluna('Hora', Array.from({ length: 24 }, (_, hora) => hora));
    const minutos = coluna('Minuto', minutosDaColuna(raiz.dataset.passo));

    const colunas = document.createElement('div');
    colunas.className = 'flex justify-center gap-3';
    colunas.append(horas.envelope, minutos.envelope);

    const rodape = document.createElement('div');
    rodape.className = 'mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800';
    rodape.innerHTML = `<button type="button" data-acao="agora" class="${BOTAO_TEXTO}">Agora</button>`
        + `<button type="button" data-acao="limpar" class="${BOTAO_TEXTO}">Limpar</button>`;
    painel.replaceChildren(colunas, rodape);

    let ultimoValido = nativo.value.slice(0, 5);
    const escolha = { hora: null, minuto: null };

    const marcarInvalido = (invalido) => {
        if (invalido) {
            texto.setAttribute('aria-invalid', 'true');
        } else {
            texto.removeAttribute('aria-invalid');
        }
    };

    const gravar = (hora) => {
        nativo.value = hora ?? '';
        ultimoValido = nativo.value;
        texto.value = ultimoValido;
        marcarInvalido(false);
        avisar(nativo);
    };

    // A hora e o minuto escolhidos no painel, quando os dois existem e cabem nos limites.
    const combinada = () => {
        if (escolha.hora === null || escolha.minuto === null) {
            return null;
        }

        const hora = `${dois(escolha.hora)}:${dois(escolha.minuto)}`;

        return foraDosLimites(hora, limites()) ? null : hora;
    };

    const definir = (hora) => {
        const valida = deDigitado(hora);

        escolha.hora = valida ? Number(valida.slice(0, 2)) : null;
        escolha.minuto = valida ? Number(valida.slice(3)) : null;
    };

    const pintar = (item, escolhido, fora) => {
        item.className = `${ITEM} ${escolhido && ! fora ? ESCOLHIDO : (fora ? FORA : LIVRE)}`;
        item.disabled = fora;
        item.setAttribute('aria-selected', escolhido && ! fora ? 'true' : 'false');
    };

    // Um botão por coluna entra no Tab: o escolhido, ou o primeiro livre.
    const tabular = (lista) => {
        const itens = [...lista.querySelectorAll('button')];
        const daVez = itens.find((item) => item.getAttribute('aria-selected') === 'true') ?? itens.find((item) => ! item.disabled);

        itens.forEach((item) => {
            item.tabIndex = item === daVez ? 0 : -1;
        });
    };

    const atualizar = () => {
        const agoraLimites = limites();

        horas.lista.querySelectorAll('button').forEach((item) => {
            const hora = Number(item.dataset.valor);

            pintar(item, hora === escolha.hora, horaSemMinutoLivre(hora, agoraLimites));
        });

        minutos.lista.querySelectorAll('button').forEach((item) => {
            const minuto = Number(item.dataset.valor);
            const fora = escolha.hora !== null && foraDosLimites(`${dois(escolha.hora)}:${dois(minuto)}`, agoraLimites);

            pintar(item, minuto === escolha.minuto, fora);
        });

        tabular(horas.lista);
        tabular(minutos.lista);
    };

    const daVez = (lista) => lista.querySelector('button[tabindex="0"]');

    const painelAberto = painelDoCalendario(campo, raiz, painel, () => {
        const focoDentro = painel.contains(document.activeElement);

        fechar();

        if (focoDentro) {
            texto.focus();
        }
    });

    const abrir = () => {
        if (painelAberto.aberto || travado()) {
            return;
        }

        definir(nativo.value.slice(0, 5));
        painelAberto.abrir();
        atualizar();
        texto.setAttribute('aria-expanded', 'true');

        // Sem hora escolhida, a coluna das horas abre na hora do relógio, que é por onde se costuma começar.
        const horaDoRelogio = horas.lista.querySelector(`[data-valor="${new Date().getHours()}"]`);

        centralizar(horas.lista, horas.lista.querySelector('[aria-selected="true"]') ?? horaDoRelogio);
        centralizar(minutos.lista, minutos.lista.querySelector('[aria-selected="true"]'));
    };

    function fechar() {
        painelAberto.fechar();
        texto.setAttribute('aria-expanded', 'false');
    }

    const focarPainel = () => {
        (daVez(horas.lista) ?? daVez(minutos.lista))?.focus({ preventScroll: true });
    };

    texto.addEventListener('click', abrir);

    botao.addEventListener('click', () => {
        if (painelAberto.aberto) {
            fechar();
        } else if (! travado()) {
            abrir();
            focarPainel();
        }
    });

    texto.addEventListener('keydown', (evento) => {
        if ((evento.key === 'ArrowDown' || evento.key === 'Enter') && ! painelAberto.aberto && ! travado()) {
            evento.preventDefault();
            abrir();
            focarPainel();
        }
    });

    // A hora grava já, se o minuto também está escolhido, e o painel fica aberto para o minuto.
    horas.lista.addEventListener('click', (evento) => {
        const item = evento.target.closest('button[data-valor]');

        if (! item || item.disabled) {
            return;
        }

        escolha.hora = Number(item.dataset.valor);

        const hora = combinada();

        if (hora) {
            gravar(hora);
        }

        atualizar();
    });

    // O minuto, com a hora escolhida, grava e fecha.
    minutos.lista.addEventListener('click', (evento) => {
        const item = evento.target.closest('button[data-valor]');

        if (! item || item.disabled) {
            return;
        }

        escolha.minuto = Number(item.dataset.valor);

        const hora = combinada();

        if (hora) {
            gravar(hora);
            fechar();
            texto.focus();

            return;
        }

        atualizar();
        daVez(horas.lista)?.focus({ preventScroll: true });
    });

    // ↑ e ↓ andam na coluna; ← e → trocam de coluna. Enter e espaço são o clique do próprio botão.
    painel.addEventListener('keydown', (evento) => {
        const item = evento.target.closest?.('button[data-valor]');

        if (! item) {
            return;
        }

        const lista = item.parentElement;

        if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
            evento.preventDefault();

            const livres = [...lista.querySelectorAll('button:not(:disabled)')];
            const proximo = livres[livres.indexOf(item) + (evento.key === 'ArrowDown' ? 1 : -1)];

            if (proximo) {
                proximo.focus({ preventScroll: true });
                mostrar(lista, proximo);
            }
        } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight') {
            evento.preventDefault();

            const outra = lista === horas.lista ? minutos.lista : horas.lista;
            const alvo = daVez(outra);

            if (alvo) {
                alvo.focus({ preventScroll: true });
                mostrar(outra, alvo);
            }
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

        const hora = deDigitado(texto.value);

        if (hora && ! foraDosLimites(hora, limites())) {
            nativo.value = hora;
            ultimoValido = hora;
            marcarInvalido(false);
            avisar(nativo);

            if (painelAberto.aberto) {
                definir(hora);
                atualizar();
            }
        } else {
            marcarInvalido(texto.value.length === 5);
        }
    });

    // Outro código pode gravar no nativo e disparar `change` (o modal preenchido pela linha): o visível acompanha.
    nativo.addEventListener('change', () => {
        const hora = nativo.value.slice(0, 5);

        if (hora !== ultimoValido) {
            ultimoValido = hora;
            texto.value = hora;
            marcarInvalido(false);
        }
    });

    // Ao sair com uma hora incompleta ou inválida, volta a última válida.
    texto.addEventListener('blur', () => {
        if (texto.value !== ultimoValido) {
            texto.value = ultimoValido;
            marcarInvalido(false);
        }
    });

    rodape.addEventListener('click', (evento) => {
        const acao = evento.target.closest('[data-acao]')?.dataset.acao;

        if (acao === 'agora') {
            const agora = agoraDe();

            if (foraDosLimites(agora, limites())) {
                return;
            }

            gravar(agora);
        } else if (acao === 'limpar') {
            gravar(null);
        } else {
            return;
        }

        fechar();
        texto.focus();
    });
}

export function ligarHoras(raiz = document) {
    raiz.querySelectorAll('[data-horario]').forEach(montar);
}
