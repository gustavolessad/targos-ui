/*
 * A cor (<x-ui.color>).
 *
 * O campo de texto com o código (`#rrggbb`, ou `#rrggbbaa` com
 * transparência) é o campo do formulário: sem JS, ele continua
 * digitável, com a amostra desenhada pelo servidor. Aqui ganha o painel
 * — a área de saturação e brilho, a barra do matiz e, com `alpha`, a da
 * opacidade —, as cores prontas (`swatches`), o conta-gotas do navegador
 * que o tiver e o "Limpar".
 *
 * O painel é a caixa do calendário (`painelDoCalendario`): flutuante no
 * computador, folha por baixo no celular.
 *
 * O estado do painel é HSV, e não a cor: de um código só não se sabe o
 * matiz do preto nem do cinza, e o marcador da barra pularia para o
 * vermelho ao arrastar até o canto escuro da área.
 */
import { BOTAO_TEXTO, avisar, painelDoCalendario } from './calendar.js';

/** O xadrez que aparece por trás da cor transparente — o mesmo do Blade (`x-ui.color`). */
export const XADREZ = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px';

const ARCO_IRIS = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';

const MARCADOR = 'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/25';
const BARRA = 'relative h-3 w-full cursor-pointer touch-none rounded-full ring-1 ring-inset ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60';
const AMOSTRA_PRONTA = 'size-6 cursor-pointer rounded-md ring-1 ring-inset ring-black/15 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60';

const limitar = (numero, minimo = 0, maximo = 1) => Math.min(maximo, Math.max(minimo, numero));
const byte = (numero) => Math.round(limitar(numero, 0, 255)).toString(16).padStart(2, '0');

/**
 * O código lido: `#rgb`, `#rrggbb` e — com `alfa` — `#rgba` e
 * `#rrggbbaa`, com ou sem o `#`, em maiúsculas ou não. A opacidade (`a`)
 * vai de 0 a 1. O que não for cor é null.
 */
export function lerCor(texto, { alfa = false } = {}) {
    const limpo = String(texto ?? '').trim().replace(/^#/, '').toLowerCase();
    const tamanhos = alfa ? [3, 4, 6, 8] : [3, 6];

    if (! /^[0-9a-f]+$/.test(limpo) || ! tamanhos.includes(limpo.length)) {
        return null;
    }

    const cheio = limpo.length <= 4 ? [...limpo].map((digito) => digito + digito).join('') : limpo;
    const parte = (inicio) => Number.parseInt(cheio.slice(inicio, inicio + 2), 16);

    return {
        r: parte(0),
        g: parte(2),
        b: parte(4),
        a: cheio.length === 8 ? parte(6) / 255 : 1,
    };
}

/**
 * O código da cor, em minúsculas: `#rrggbb`, e `#rrggbbaa` só com `alfa`
 * e opacidade abaixo de 100% — a cor cheia sai com seis dígitos, a
 * mesma de quem não usa transparência.
 */
export function hexDe({ r, g, b, a = 1 }, { alfa = false } = {}) {
    const opacidade = Math.round(limitar(a) * 255);
    const base = `#${byte(r)}${byte(g)}${byte(b)}`;

    return alfa && opacidade < 255 ? base + byte(opacidade) : base;
}

/** O código escrito do jeito do campo (`#ABC` → `#aabbcc`), ou null se não for cor. */
export function normalizarCor(texto, opcoes = {}) {
    const cor = lerCor(texto, opcoes);

    return cor ? hexDe(cor, opcoes) : null;
}

/** RGB (0–255) para HSV: matiz de 0 a 360, saturação e brilho de 0 a 1. */
export function rgbParaHsv({ r, g, b }) {
    const [vr, vg, vb] = [r / 255, g / 255, b / 255];
    const maior = Math.max(vr, vg, vb);
    const diferenca = maior - Math.min(vr, vg, vb);

    let h = 0;

    if (diferenca > 0) {
        if (maior === vr) {
            h = ((vg - vb) / diferenca) % 6;
        } else if (maior === vg) {
            h = (vb - vr) / diferenca + 2;
        } else {
            h = (vr - vg) / diferenca + 4;
        }
    }

    return {
        h: (h * 60 + 360) % 360,
        s: maior === 0 ? 0 : diferenca / maior,
        v: maior,
    };
}

/** HSV para RGB (0–255, inteiros). */
export function hsvParaRgb({ h, s, v }) {
    const canal = (n) => {
        const k = (n + h / 60) % 6;

        return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
    };

    return { r: canal(5), g: canal(3), b: canal(1) };
}

/** O `background` da amostra: a cor por cima do xadrez, que só aparece onde ela é transparente. Vazia, só o xadrez. */
export function fundoDaAmostra(hex) {
    return hex ? `linear-gradient(${hex}, ${hex}), ${XADREZ}` : XADREZ;
}

/**
 * Arrastar dentro de um elemento: o ponteiro vira uma posição de 0 a 1
 * em cada eixo. Captura o ponteiro, para o arraste continuar fora da
 * área; `aoSoltar` é a hora do `change`.
 */
function arrastavel(elemento, aoMover, aoSoltar) {
    elemento.addEventListener('pointerdown', (evento) => {
        if (evento.button !== 0) {
            return;
        }

        evento.preventDefault();
        elemento.focus({ preventScroll: true });

        // Sem a captura, o arraste só acompanha enquanto o ponteiro está em cima — ruim, mas não quebra.
        try {
            elemento.setPointerCapture(evento.pointerId);
        } catch {
            // Ponteiro que o navegador já não conhece.
        }

        const mover = (movimento) => {
            const caixa = elemento.getBoundingClientRect();

            aoMover(
                limitar((movimento.clientX - caixa.left) / caixa.width),
                limitar((movimento.clientY - caixa.top) / caixa.height),
            );
        };

        const soltar = () => {
            elemento.removeEventListener('pointermove', mover);
            elemento.removeEventListener('pointerup', soltar);
            elemento.removeEventListener('pointercancel', soltar);
            aoSoltar();
        };

        mover(evento);
        elemento.addEventListener('pointermove', mover);
        elemento.addEventListener('pointerup', soltar);
        elemento.addEventListener('pointercancel', soltar);
    });
}

function controle(rotulo, classe) {
    const elemento = document.createElement('div');
    elemento.className = classe;
    elemento.tabIndex = 0;
    elemento.setAttribute('role', 'slider');
    elemento.setAttribute('aria-label', rotulo);

    const marcador = document.createElement('span');
    marcador.className = MARCADOR;
    elemento.append(marcador);

    return { elemento, marcador };
}

function montar(raiz) {
    if (raiz.dataset.corLigada) {
        return;
    }

    raiz.dataset.corLigada = '1';

    const alfa = raiz.hasAttribute('data-cor-alfa');
    const opcoes = { alfa };
    const texto = raiz.querySelector('[data-cor-texto]');
    const botao = raiz.querySelector('[data-cor-abrir]');
    const amostra = raiz.querySelector('[data-cor-amostra]');
    const painel = raiz.querySelector('[data-cor-painel]');
    const prontas = JSON.parse(raiz.dataset.corAmostras || '[]');

    painel.setAttribute('aria-label', 'Escolher cor');

    // --- O painel ---

    const area = controle('Saturação e brilho', 'relative h-40 w-full cursor-crosshair touch-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 sm:h-36');
    const matiz = controle('Matiz', BARRA);
    const opacidade = alfa ? controle('Opacidade', BARRA) : null;

    matiz.elemento.style.background = ARCO_IRIS;
    matiz.elemento.setAttribute('aria-valuemin', '0');
    matiz.elemento.setAttribute('aria-valuemax', '360');

    opacidade?.elemento.setAttribute('aria-valuemin', '0');
    opacidade?.elemento.setAttribute('aria-valuemax', '100');

    const conteudo = document.createElement('div');
    conteudo.className = 'w-full space-y-3 sm:w-60';
    conteudo.append(area.elemento, matiz.elemento);

    if (opacidade) {
        conteudo.append(opacidade.elemento);
    }

    if (prontas.length > 0) {
        const grade = document.createElement('div');
        grade.className = 'flex flex-wrap gap-1.5';
        grade.setAttribute('aria-label', 'Cores prontas');

        prontas.forEach((hex) => {
            const pronta = document.createElement('button');
            pronta.type = 'button';
            pronta.className = AMOSTRA_PRONTA;
            pronta.dataset.corPronta = hex;
            pronta.title = hex;
            pronta.setAttribute('aria-label', `Usar ${hex}`);
            pronta.style.background = fundoDaAmostra(hex);
            grade.append(pronta);
        });

        conteudo.append(grade);
    }

    // O conta-gotas só onde o navegador tem (o Chrome e o Edge, no computador).
    const temContaGotas = typeof window !== 'undefined' && 'EyeDropper' in window;
    const podeLimpar = ! texto.required;

    if (temContaGotas || podeLimpar) {
        const rodape = document.createElement('div');
        rodape.className = 'flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800';
        rodape.innerHTML = (temContaGotas ? `<button type="button" data-acao="conta-gotas" class="${BOTAO_TEXTO}">Conta-gotas</button>` : '<span></span>')
            + (podeLimpar ? `<button type="button" data-acao="limpar" class="${BOTAO_TEXTO}">Limpar</button>` : '');
        conteudo.append(rodape);
    }

    painel.replaceChildren(conteudo);

    // --- O estado ---

    // O que veio do servidor e não é cor (o digitado que voltou com erro) não conta como válido.
    let ultimoValido = normalizarCor(texto.value, opcoes) ?? '';
    const estado = { h: 0, s: 0, v: 0, a: 1 };

    const definir = (hex) => {
        const cor = lerCor(hex, opcoes);

        if (! cor) {
            return;
        }

        const hsv = rgbParaHsv(cor);

        // Sem saturação ou sem brilho, o matiz não existe: fica o que estava, e o marcador da barra não pula.
        estado.h = hsv.s === 0 || hsv.v === 0 ? estado.h : hsv.h;
        estado.s = hsv.v === 0 ? estado.s : hsv.s;
        estado.v = hsv.v;
        estado.a = cor.a;
    };

    const atual = () => hexDe({ ...hsvParaRgb(estado), a: estado.a }, opcoes);

    const pintarAmostra = (hex) => {
        amostra.style.background = fundoDaAmostra(hex);
    };

    const marcarInvalido = (invalido) => {
        if (invalido) {
            texto.setAttribute('aria-invalid', 'true');
        } else {
            texto.removeAttribute('aria-invalid');
        }
    };

    const pintarPainel = () => {
        const { r, g, b } = hsvParaRgb(estado);
        const pura = `hsl(${Math.round(estado.h)} 100% 50%)`;

        area.elemento.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pura})`;
        area.marcador.style.left = `${estado.s * 100}%`;
        area.marcador.style.top = `${(1 - estado.v) * 100}%`;
        area.marcador.style.backgroundColor = `rgb(${r} ${g} ${b})`;
        area.elemento.setAttribute('aria-valuetext', `Saturação ${Math.round(estado.s * 100)}%, brilho ${Math.round(estado.v * 100)}%`);

        matiz.marcador.style.left = `${(estado.h / 360) * 100}%`;
        matiz.marcador.style.top = '50%';
        matiz.marcador.style.backgroundColor = pura;
        matiz.elemento.setAttribute('aria-valuenow', String(Math.round(estado.h)));

        if (opacidade) {
            const porcento = Math.round(estado.a * 100);

            opacidade.elemento.style.background = `linear-gradient(to right, rgb(${r} ${g} ${b} / 0), rgb(${r} ${g} ${b})), ${XADREZ}`;
            opacidade.marcador.style.left = `${estado.a * 100}%`;
            opacidade.marcador.style.top = '50%';
            opacidade.marcador.style.background = fundoDaAmostra(atual());
            opacidade.elemento.setAttribute('aria-valuenow', String(porcento));
            opacidade.elemento.setAttribute('aria-valuetext', `${porcento}%`);
        }
    };

    /*
     * Grava no campo o que o painel mostra. Ao arrastar, só o `input` (a
     * prévia da tela acompanha); ao soltar, o `change` também.
     */
    const gravar = (hex, { final = true } = {}) => {
        texto.value = hex;
        ultimoValido = hex;
        marcarInvalido(false);
        pintarAmostra(hex);

        if (final) {
            avisar(texto);
        } else {
            texto.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    const mexeu = (final) => {
        pintarPainel();
        gravar(atual(), { final });
    };

    arrastavel(area.elemento, (x, y) => {
        estado.s = x;
        estado.v = 1 - y;
        mexeu(false);
    }, () => avisar(texto));

    arrastavel(matiz.elemento, (x) => {
        estado.h = x * 360;
        mexeu(false);
    }, () => avisar(texto));

    if (opacidade) {
        arrastavel(opacidade.elemento, (x) => {
            estado.a = x;
            mexeu(false);
        }, () => avisar(texto));
    }

    /*
     * O teclado nos controles: as setas andam 1%, com Shift 10%. Na
     * área, ← e → são a saturação, ↑ e ↓ o brilho. Home e End vão às
     * pontas das barras.
     */
    const passo = (evento) => (evento.shiftKey ? 0.1 : 0.01);
    const delta = (evento, menos, mais) => (evento.key === menos ? -passo(evento) : (evento.key === mais ? passo(evento) : 0));

    area.elemento.addEventListener('keydown', (evento) => {
        const ds = delta(evento, 'ArrowLeft', 'ArrowRight');
        const dv = delta(evento, 'ArrowDown', 'ArrowUp');

        if (ds === 0 && dv === 0) {
            return;
        }

        evento.preventDefault();
        estado.s = limitar(estado.s + ds);
        estado.v = limitar(estado.v + dv);
        mexeu(true);
    });

    const teclasDaBarra = (barra, ler, escrever) => {
        barra.addEventListener('keydown', (evento) => {
            let valor = null;

            if (evento.key === 'Home') {
                valor = 0;
            } else if (evento.key === 'End') {
                valor = 1;
            } else {
                const d = delta(evento, 'ArrowLeft', 'ArrowRight') || delta(evento, 'ArrowDown', 'ArrowUp');

                valor = d === 0 ? null : limitar(ler() + d);
            }

            if (valor === null) {
                return;
            }

            evento.preventDefault();
            escrever(valor);
            mexeu(true);
        });
    };

    teclasDaBarra(matiz.elemento, () => estado.h / 360, (valor) => {
        // O fim da barra é o mesmo vermelho do começo; 359,9 deixa o marcador lá, em vez de pular de volta.
        estado.h = Math.min(valor * 360, 359.9);
    });

    if (opacidade) {
        teclasDaBarra(opacidade.elemento, () => estado.a, (valor) => {
            estado.a = valor;
        });
    }

    // --- Abrir e fechar ---

    const travado = () => texto.disabled || texto.readOnly;

    const espelharTrava = () => {
        botao.disabled = travado();
    };

    new MutationObserver(espelharTrava).observe(texto, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
    espelharTrava();

    const painelAberto = painelDoCalendario(raiz.querySelector('[data-cor-campo]'), raiz, painel, () => {
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

        definir(ultimoValido || '#000000');
        painelAberto.abrir();
        pintarPainel();
        texto.setAttribute('aria-expanded', 'true');
    };

    function fechar() {
        painelAberto.fechar();
        texto.setAttribute('aria-expanded', 'false');
    }

    botao.addEventListener('click', () => {
        if (painelAberto.aberto) {
            fechar();
        } else if (! travado()) {
            abrir();
            area.elemento.focus({ preventScroll: true });
        }
    });

    texto.addEventListener('click', abrir);

    texto.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowDown' && ! painelAberto.aberto && ! travado()) {
            evento.preventDefault();
            abrir();
            area.elemento.focus({ preventScroll: true });
        }
    });

    // Digitar um código que é cor vale igual a escolher no painel; o meio do caminho não mexe em nada.
    texto.addEventListener('input', (evento) => {
        // O `input` que o próprio painel disparou já está pintado.
        if (! evento.isTrusted) {
            return;
        }

        if (texto.value.trim() === '') {
            ultimoValido = '';
            marcarInvalido(false);
            pintarAmostra('');

            return;
        }

        const hex = normalizarCor(texto.value, opcoes);

        if (! hex) {
            marcarInvalido(texto.value.replace('#', '').length >= 6);

            return;
        }

        ultimoValido = hex;
        marcarInvalido(false);
        pintarAmostra(hex);

        if (painelAberto.aberto) {
            definir(hex);
            pintarPainel();
        }
    });

    // Ao sair, o código fica escrito do jeito do campo (`#ABC` → `#aabbcc`); o que não é cor volta ao último válido.
    texto.addEventListener('blur', () => {
        if (texto.value === ultimoValido) {
            return;
        }

        const hex = texto.value.trim() === '' ? '' : normalizarCor(texto.value, opcoes);

        texto.value = hex ?? ultimoValido;
        marcarInvalido(false);
        pintarAmostra(texto.value);
    });

    // Outro código pode gravar no campo e disparar `change` (o modal preenchido pela linha): a amostra acompanha.
    texto.addEventListener('change', (evento) => {
        if (evento.isTrusted) {
            return;
        }

        const hex = texto.value === '' ? '' : normalizarCor(texto.value, opcoes);

        if (hex !== null && hex !== ultimoValido) {
            ultimoValido = hex;
            texto.value = hex;
            pintarAmostra(hex);
        }
    });

    painel.addEventListener('click', (evento) => {
        const pronta = evento.target.closest('[data-cor-pronta]');

        if (pronta) {
            definir(pronta.dataset.corPronta);
            pintarPainel();
            gravar(atual());

            return;
        }

        const acao = evento.target.closest('[data-acao]')?.dataset.acao;

        if (acao === 'limpar') {
            gravar('');
            fechar();
            texto.focus();
        } else if (acao === 'conta-gotas') {
            // A janela some enquanto a pessoa escolhe; cancelar (Esc) rejeita, e nada muda.
            new window.EyeDropper().open().then(({ sRGBHex }) => {
                const cor = lerCor(sRGBHex);

                if (cor) {
                    definir(hexDe({ ...cor, a: estado.a }, opcoes));
                    pintarPainel();
                    gravar(atual());
                }
            }).catch(() => {});
        }
    });
}

export function ligarCores(raiz = document) {
    raiz.querySelectorAll('[data-cor]').forEach(montar);
}
