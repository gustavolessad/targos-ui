/*
 * O calendário do design system, usado por ui/date.js (data única) e
 * ui/date-range.js (período).
 *
 * Datas são texto `Y-m-d`, sem hora nem fuso: comparar é comparar texto,
 * e o "hoje" vem do servidor (data-hoje). As contas de mês e dia usam
 * Date.UTC só como calculadora, para o horário de verão não pular um dia.
 */
import { painelFlutuante } from './floating.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = [['D', 'domingo'], ['S', 'segunda-feira'], ['T', 'terça-feira'], ['Q', 'quarta-feira'], ['Q', 'quinta-feira'], ['S', 'sexta-feira'], ['S', 'sábado']];

const SETA_ESQUERDA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const SETA_DIREITA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

const BOTAO_SETA = 'flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white';
const BOTAO_TITULO = 'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800';
const BOTAO_GRADE = 'flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm transition';

export const BOTAO_TEXTO = 'cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white';

// --- Datas como texto ---

const doisDigitos = (n) => String(n).padStart(2, '0');

export function iso(ano, mes, dia) {
    return `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(dia)}`;
}

export function partes(texto) {
    const [ano, mes, dia] = texto.split('-').map(Number);

    return { ano, mes: mes - 1, dia };
}

function diasNoMes(ano, mes) {
    return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

export function somarDias(texto, dias) {
    const { ano, mes, dia } = partes(texto);
    const data = new Date(Date.UTC(ano, mes, dia + dias));

    return iso(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

/** Soma meses sem estourar o mês: 31/01 + 1 mês = 28/02. */
export function somarMeses(texto, meses) {
    const { ano, mes, dia } = partes(texto);
    const alvo = new Date(Date.UTC(ano, mes + meses, 1));
    const novoAno = alvo.getUTCFullYear();
    const novoMes = alvo.getUTCMonth();

    return iso(novoAno, novoMes, Math.min(dia, diasNoMes(novoAno, novoMes)));
}

export function exibir(texto) {
    if (! texto) {
        return '';
    }

    const { ano, mes, dia } = partes(texto);

    return `${doisDigitos(dia)}/${doisDigitos(mes + 1)}/${ano}`;
}

/** `dd/mm/aaaa` → `Y-m-d`, ou null se não for uma data que existe. */
export function deExibido(texto) {
    const achado = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto ?? '');

    if (! achado) {
        return null;
    }

    const [, dia, mes, ano] = achado.map(Number);

    if (mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes - 1)) {
        return null;
    }

    return iso(ano, mes - 1, dia);
}

function porExtenso(texto) {
    const { ano, mes, dia } = partes(texto);

    return `${dia} de ${MESES[mes]} de ${ano}`;
}

function nomeDoMes(ano, mes) {
    const nome = MESES[mes];

    return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** As 42 datas (6 semanas, começando no domingo) que a grade do mês mostra. */
export function grade(ano, mes) {
    const primeiro = iso(ano, mes, 1);
    const diaDaSemana = new Date(Date.UTC(ano, mes, 1)).getUTCDay();
    const inicio = somarDias(primeiro, -diaDaSemana);

    return Array.from({ length: 42 }, (_, indice) => somarDias(inicio, indice));
}

// --- O calendário ---

/**
 * Desenha e controla o calendário dentro de `raiz`.
 *
 * `modo`: 'unica' (um clique escolhe) ou 'periodo' (dois cliques; o
 * segundo antes do primeiro inverte). `aoEscolher` recebe a data (única)
 * ou `{ inicio, fim }` (período).
 */
export class Calendario {
    constructor(raiz, { modo = 'unica', meses = 1, hoje, min = null, max = null, aoEscolher = () => {} }) {
        Object.assign(this, { raiz, modo, meses, hoje, min, max, aoEscolher });

        this.inicio = null;
        this.fim = null;
        this.previa = null;
        this.visao = 'dias';
        this.foco = hoje;

        const { ano, mes } = partes(hoje);
        this.ano = ano;
        this.mes = mes;

        raiz.addEventListener('click', (evento) => this.aoClicar(evento));
        raiz.addEventListener('keydown', (evento) => this.aoTeclar(evento));
        raiz.addEventListener('mouseover', (evento) => this.aoPassar(evento));
    }

    /** Define a seleção e mostra o mês dela (ou o de hoje). */
    definir(inicio, fim = null) {
        this.inicio = inicio;
        this.fim = fim;
        this.previa = null;
        this.foco = inicio ?? this.hoje;
        this.irPara(this.foco);
    }

    irPara(texto) {
        const { ano, mes } = partes(texto);
        this.ano = ano;
        this.mes = mes;
        this.visao = 'dias';
        this.desenhar();
    }

    bloqueado(texto) {
        return Boolean((this.min && texto < this.min) || (this.max && texto > this.max));
    }

    focar() {
        this.raiz.querySelector('[tabindex="0"]')?.focus();
    }

    escolher(texto) {
        if (this.bloqueado(texto)) {
            return;
        }

        this.foco = texto;

        if (this.modo === 'unica') {
            this.inicio = texto;
            this.desenhar();
            this.aoEscolher(texto);

            return;
        }

        if (! this.inicio || this.fim) {
            this.inicio = texto;
            this.fim = null;
        } else if (texto < this.inicio) {
            this.fim = this.inicio;
            this.inicio = texto;
        } else {
            this.fim = texto;
        }

        this.previa = null;
        this.desenhar();
        this.aoEscolher({ inicio: this.inicio, fim: this.fim });
    }

    // --- Eventos ---

    aoClicar(evento) {
        const alvo = evento.target.closest('button');

        if (! alvo || ! this.raiz.contains(alvo)) {
            return;
        }

        if (alvo.dataset.dia) {
            this.escolher(alvo.dataset.dia);
            this.focar();
        } else if (alvo.dataset.navegar) {
            const passo = Number(alvo.dataset.navegar);
            const meses = { dias: passo, meses: passo * 12, anos: passo * 144 }[this.visao];
            const destino = partes(somarMeses(iso(this.ano, this.mes, 1), meses));
            this.ano = destino.ano;
            this.mes = destino.mes;
            this.desenhar();
        } else if (alvo.dataset.visao) {
            this.visao = alvo.dataset.visao;
            this.desenhar();
        } else if (alvo.dataset.mes) {
            this.mes = Number(alvo.dataset.mes);
            this.visao = 'dias';
            this.desenhar();
        } else if (alvo.dataset.ano) {
            this.ano = Number(alvo.dataset.ano);
            this.visao = 'meses';
            this.desenhar();
        }
    }

    aoPassar(evento) {
        const dia = evento.target.closest('[data-dia]')?.dataset.dia;

        if (this.modo !== 'periodo' || ! this.inicio || this.fim || ! dia || dia === this.previa) {
            return;
        }

        this.previa = dia;
        this.desenhar();
    }

    aoTeclar(evento) {
        if (! evento.target.dataset.dia) {
            return;
        }

        const semana = partes(this.foco);
        const diaDaSemana = new Date(Date.UTC(semana.ano, semana.mes, semana.dia)).getUTCDay();

        const movimentos = {
            ArrowLeft: () => somarDias(this.foco, -1),
            ArrowRight: () => somarDias(this.foco, 1),
            ArrowUp: () => somarDias(this.foco, -7),
            ArrowDown: () => somarDias(this.foco, 7),
            Home: () => somarDias(this.foco, -diaDaSemana),
            End: () => somarDias(this.foco, 6 - diaDaSemana),
            PageUp: () => somarMeses(this.foco, evento.shiftKey ? -12 : -1),
            PageDown: () => somarMeses(this.foco, evento.shiftKey ? 12 : 1),
        };

        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            this.escolher(this.foco);
            this.focar();

            return;
        }

        if (! movimentos[evento.key]) {
            return;
        }

        evento.preventDefault();
        this.foco = movimentos[evento.key]();
        this.mostrarFoco();
        this.desenhar();
        this.focar();
    }

    /** Garante que o dia em foco está num dos meses à vista. */
    mostrarFoco() {
        const primeiro = iso(this.ano, this.mes, 1);
        const ultimo = somarMeses(primeiro, this.meses - 1);
        const mesDoFoco = this.foco.slice(0, 7);

        if (mesDoFoco < primeiro.slice(0, 7)) {
            ({ ano: this.ano, mes: this.mes } = partes(this.foco));
        } else if (mesDoFoco > ultimo.slice(0, 7)) {
            ({ ano: this.ano, mes: this.mes } = partes(somarMeses(this.foco, -(this.meses - 1))));
        }
    }

    // --- Desenho ---

    desenhar() {
        if (this.visao === 'meses') {
            this.raiz.innerHTML = this.htmlMeses();
        } else if (this.visao === 'anos') {
            this.raiz.innerHTML = this.htmlAnos();
        } else {
            this.raiz.innerHTML = `<div class="flex flex-col gap-4 sm:flex-row">${
                Array.from({ length: this.meses }, (_, indice) => this.htmlMes(indice)).join('')
            }</div>`;
        }
    }

    cabecalho(titulo, visaoDoTitulo, esquerda = true, direita = true) {
        const seta = (passo, rotulo, icone, mostrar) => (mostrar
            ? `<button type="button" data-navegar="${passo}" aria-label="${rotulo}" class="${BOTAO_SETA}">${icone}</button>`
            : '<span class="size-8"></span>');

        const meio = visaoDoTitulo
            ? `<button type="button" data-visao="${visaoDoTitulo}" class="${BOTAO_TITULO}">${titulo}</button>`
            : `<span class="px-2 py-1 text-sm font-semibold text-neutral-900 dark:text-white">${titulo}</span>`;

        return `<div class="mb-2 flex items-center justify-between">${
            seta(-1, 'Anterior', SETA_ESQUERDA, esquerda)}${meio}${seta(1, 'Próximo', SETA_DIREITA, direita)}</div>`;
    }

    htmlMes(indice) {
        const { ano, mes } = partes(somarMeses(iso(this.ano, this.mes, 1), indice));
        const dias = grade(ano, mes);
        const titulo = nomeDoMes(ano, mes);

        // O foco itinerante: um dia só com tabindex 0 — o em foco, se estiver à vista.
        const visiveis = dias.filter((d) => partes(d).mes === mes);
        const primeiro = iso(this.ano, this.mes, 1).slice(0, 7);
        const ultimo = somarMeses(iso(this.ano, this.mes, 1), this.meses - 1).slice(0, 7);
        const focoAVista = this.foco && this.foco.slice(0, 7) >= primeiro && this.foco.slice(0, 7) <= ultimo;
        const focavel = visiveis.includes(this.foco) ? this.foco : (indice === 0 && ! focoAVista ? visiveis[0] : null);

        const cabecalhoDaSemana = SEMANA.map(([letra, nome]) => `<div role="columnheader" aria-label="${nome}" class="py-1 text-xs font-medium text-neutral-400 dark:text-neutral-500">${letra}</div>`).join('');

        const semanas = Array.from({ length: 6 }, (_, s) => `<div role="row" class="contents">${
            dias.slice(s * 7, s * 7 + 7).map((dia) => this.htmlDia(dia, mes, dia === focavel)).join('')
        }</div>`).join('');

        return `<div class="w-full sm:w-64">${
            this.cabecalho(titulo, 'meses', indice === 0, indice === this.meses - 1)
        }<div role="grid" aria-label="${titulo}" class="grid grid-cols-7 gap-y-1 text-center"><div role="row" class="contents">${cabecalhoDaSemana}</div>${semanas}</div></div>`;
    }

    htmlDia(dia, mes, focavel) {
        const { mes: mesDoDia, dia: numero } = partes(dia);
        const foraDoMes = mesDoDia !== mes;
        const fimDoIntervalo = this.fim ?? this.previa;
        const [de, ate] = [this.inicio, fimDoIntervalo].sort();
        // Dias de fora do mês (as pontas cinzas da grade) não se marcam: com
        // dois meses à vista, o mesmo dia apareceria escolhido duas vezes.
        const ehInicio = ! foraDoMes && dia === this.inicio;
        const ehFim = ! foraDoMes && this.modo === 'periodo' && dia === fimDoIntervalo;
        const dentro = ! foraDoMes && this.modo === 'periodo' && this.inicio && fimDoIntervalo && dia > de && dia < ate;
        const escolhido = ehInicio || ehFim;
        const bloqueado = this.bloqueado(dia);

        const classes = ['mx-auto flex size-11 items-center justify-center text-sm transition sm:size-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50'];

        // As pontas do intervalo ocupam a coluna toda e só arredondam o lado
        // de fora, para emendar com os dias do meio numa faixa contínua.
        const temFaixa = this.modo === 'periodo' && this.inicio && fimDoIntervalo && de !== ate;

        if (dentro) {
            classes.push('w-full rounded-none bg-primary-50 text-primary-800 dark:bg-primary-500/15 dark:text-primary-200');
        } else if (temFaixa && dia === de) {
            classes.push('w-full rounded-s-lg rounded-e-none');
        } else if (temFaixa && dia === ate) {
            classes.push('w-full rounded-e-lg rounded-s-none');
        } else {
            classes.push('rounded-lg');
        }

        if (escolhido) {
            classes.push('bg-primary-600 font-semibold text-primary-contrast');
        } else if (bloqueado) {
            classes.push('cursor-not-allowed text-neutral-300 line-through dark:text-neutral-700');
        } else if (foraDoMes && ! dentro) {
            classes.push('cursor-pointer text-neutral-300 hover:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-800');
        } else if (! dentro) {
            classes.push('cursor-pointer text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800');
        }

        if (dia === this.hoje && ! escolhido && ! foraDoMes) {
            classes.push('font-semibold ring-1 ring-inset ring-primary-400');
        }

        return `<button type="button" role="gridcell" data-dia="${dia}" tabindex="${focavel ? 0 : -1}"`
            + ` aria-label="${porExtenso(dia)}"${escolhido ? ' aria-selected="true"' : ''}`
            + `${bloqueado ? ' aria-disabled="true"' : ''}${dia === this.hoje ? ' aria-current="date"' : ''}`
            + ` class="${classes.join(' ')}">${numero}</button>`;
    }

    htmlMeses() {
        const atual = this.inicio ? partes(this.inicio) : null;

        const botoes = MESES_CURTOS.map((nome, indice) => {
            const escolhido = atual && atual.ano === this.ano && atual.mes === indice;
            const cor = escolhido
                ? 'bg-primary-600 font-semibold text-primary-contrast'
                : 'text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800';

            return `<button type="button" data-mes="${indice}" aria-label="${MESES[indice]} de ${this.ano}" class="${BOTAO_GRADE} ${cor}">${nome}</button>`;
        }).join('');

        return `<div class="w-full sm:w-64">${this.cabecalho(String(this.ano), 'anos')}<div class="grid grid-cols-3 gap-2">${botoes}</div></div>`;
    }

    htmlAnos() {
        const primeiro = this.ano - (this.ano % 12);
        const atual = this.inicio ? partes(this.inicio).ano : null;

        const botoes = Array.from({ length: 12 }, (_, indice) => {
            const ano = primeiro + indice;
            const cor = ano === atual
                ? 'bg-primary-600 font-semibold text-primary-contrast'
                : 'text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800';

            return `<button type="button" data-ano="${ano}" class="${BOTAO_GRADE} ${cor}">${ano}</button>`;
        }).join('');

        return `<div class="w-full sm:w-64">${this.cabecalho(`${primeiro} – ${primeiro + 11}`, null)}<div class="grid grid-cols-3 gap-2">${botoes}</div></div>`;
    }
}

// --- O painel ---

// `animate-surgir`: a entrada do design system (resources/css/app.css), a mesma do dropdown.
const CAIXA_DO_PAINEL = 'rounded-xl bg-white p-3 shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800 origin-top animate-surgir';
const FOLHA_DO_CELULAR = 'fixed inset-x-0 bottom-0 z-[65] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-xl dark:bg-neutral-900 origin-bottom animate-surgir';

export const noCelular = () => window.matchMedia('(max-width: 639px)').matches;

/**
 * Abre o painel do calendário: flutuante junto do campo no computador,
 * folha por baixo (com fundo escurecido) no celular. `aoFecharFora` é
 * chamado no clique fora e no Esc.
 */
export function painelDoCalendario(ancora, raiz, painel, aoFecharFora) {
    const flutuante = painelFlutuante(ancora, painel, { larguraPropria: true });
    const origem = painel.parentElement;
    let fundo = null;
    let aberto = false;

    painel.setAttribute('role', 'dialog');

    const cliqueFora = (evento) => {
        if (aberto && ! raiz.contains(evento.target) && ! painel.contains(evento.target)) {
            aoFecharFora();
        }
    };

    const tecla = (evento) => {
        if (aberto && evento.key === 'Escape') {
            evento.preventDefault();
            aoFecharFora();
        }
    };

    return {
        get aberto() {
            return aberto;
        },

        abrir() {
            if (aberto) {
                return;
            }

            aberto = true;

            if (noCelular()) {
                painel.className = FOLHA_DO_CELULAR;
                fundo = document.createElement('div');
                fundo.className = 'fixed inset-0 z-60 bg-neutral-900/50';
                document.body.append(fundo, painel);
                painel.hidden = false;
            } else {
                painel.className = CAIXA_DO_PAINEL;
                flutuante.abrir();
            }

            document.addEventListener('mousedown', cliqueFora);
            document.addEventListener('keydown', tecla);
        },

        fechar() {
            if (! aberto) {
                return;
            }

            aberto = false;
            document.removeEventListener('mousedown', cliqueFora);
            document.removeEventListener('keydown', tecla);

            if (fundo) {
                fundo.remove();
                fundo = null;
                painel.hidden = true;
                painel.removeAttribute('style');
                origem.append(painel);
            } else {
                flutuante.fechar();
            }
        },
    };
}

/** Avisa quem escuta o campo nativo, como a escolha no select faz. */
export function avisar(campo) {
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
}
