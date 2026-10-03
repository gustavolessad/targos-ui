// --- Dropdown ---

/* Precisa bater com a `duration-150` do <x-ui.dropdown>. */
const SAIDA_DO_MENU = 150;

/* A distância entre o botão e a lista (o `mt-1.5` do componente). */
const FOLGA = 6;

/* O quanto a lista fica longe da borda da janela. */
const MARGEM = 8;

/**
 * Para que lado a lista abre: o lado pedido (`natural`), salvo quando
 * ela não cabe ali e do outro lado há mais espaço.
 *
 * `acima` e `abaixo` são o espaço livre na janela, a partir do botão.
 */
export function ladoDoMenu({ natural, altura, acima, abaixo }) {
    const precisa = altura + FOLGA + MARGEM;

    if (natural === 'bottom') {
        return abaixo < precisa && acima > abaixo ? 'top' : 'bottom';
    }

    return acima < precisa && abaixo > acima ? 'bottom' : 'top';
}

/*
 * Vira a lista para o lado onde ela cabe.
 *
 * O lado de origem vem do CSS (`side` do <x-ui.dropdown>, ou as classes
 * de quem escreveu o menu à mão). No pé da janela, a lista que abre
 * para baixo nasceria fora dela e esticaria a página; aqui ela passa a
 * abrir para cima do botão — e o contrário no alto da janela.
 *
 * A posição é em pixels, medida a partir do botão: o envelope do menu
 * nem sempre é justo ao botão (o atalho da barra lateral tem margem em
 * volta), e `bottom: 100%` encostaria a lista no envelope, não nele.
 */
function virarSePreciso(menu, gatilho) {
    // Volta ao lado de origem antes de medir: a janela pode ter rolado desde a última abertura.
    for (const propriedade of ['top', 'bottom', 'marginTop', 'marginBottom', 'transformOrigin']) {
        menu.style[propriedade] = '';
    }

    const envelope = menu.offsetParent;

    if (! envelope) {
        return;
    }

    const botao = gatilho.getBoundingClientRect();
    const caixa = menu.getBoundingClientRect();
    const natural = caixa.top >= botao.top ? 'bottom' : 'top';

    const lado = ladoDoMenu({
        natural,
        // `offsetHeight` e não a caixa: a lista fechada está encolhida a 95% pela animação.
        altura: menu.offsetHeight,
        acima: botao.top,
        abaixo: window.innerHeight - botao.bottom,
    });

    if (lado === natural) {
        return;
    }

    const moldura = envelope.getBoundingClientRect();

    // A lista cresce do canto colado ao botão: o horizontal fica, o vertical troca.
    const [origemHorizontal] = getComputedStyle(menu).transformOrigin.split(' ');

    menu.style.marginTop = '0';
    menu.style.marginBottom = '0';

    if (lado === 'top') {
        menu.style.top = 'auto';
        menu.style.bottom = `${moldura.bottom - botao.top + FOLGA}px`;
        menu.style.transformOrigin = `${origemHorizontal} 100%`;
    } else {
        menu.style.bottom = 'auto';
        menu.style.top = `${botao.bottom - moldura.top + FOLGA}px`;
        menu.style.transformOrigin = `${origemHorizontal} 0`;
    }
}

function abrirMenu(menu, gatilho) {
    menu.classList.remove('hidden');

    // Já visível, para ter altura; ainda sem `data-aberto`, para a animação partir do lado certo.
    virarSePreciso(menu, gatilho);

    /*
     * O quadro seguinte, não este: marcar `data-aberto` junto com a
     * remocao do `hidden` faria o navegador pintar ja no estado final,
     * sem transicao nenhuma.
     */
    requestAnimationFrame(() => {
        menu.dataset.aberto = '';
    });
}

function fecharMenu(menu) {
    delete menu.dataset.aberto;

    // O `hidden` só entra depois da animação de saída terminar.
    setTimeout(() => {
        if (! ('aberto' in menu.dataset)) {
            menu.classList.add('hidden');
        }
    }, SAIDA_DO_MENU);
}

// --- Menu montado no clique (<x-ui.dropdown template> + <x-ui.dropdown-template>) ---

/** O valor de `chave` ou `chave.campo` nos valores da linha; `undefined` se não houver. */
export function valorDoCaminho(valores, caminho) {
    return caminho.split('.').reduce((atual, parte) => (atual === null || atual === undefined ? undefined : atual[parte]), valores);
}

/** A chave vale para a linha? null, false e texto vazio dizem que não. */
export function temValor(valor) {
    return valor !== null && valor !== undefined && valor !== false && valor !== '';
}

/**
 * Troca cada `{chave}` (ou `{chave.campo}`) do texto pelo valor da linha;
 * a chave sem valor vira vazio. Chave que os valores não conhecem fica
 * como está: uma chave escrita num texto qualquer não some.
 */
export function preencherTexto(texto, valores) {
    return texto.replace(/\{([\w-]+(?:\.[\w-]+)*)\}/g, (marca, caminho) => {
        if (! Object.hasOwn(valores, caminho.split('.')[0])) {
            return marca;
        }

        const valor = valorDoCaminho(valores, caminho);

        if (! temValor(valor)) {
            return '';
        }

        // Um objeto ou lista vira JSON: é o que `data-form-valores` espera na linha.
        return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    });
}

/**
 * Os separadores que sobram depois de sair o que não vale para a linha:
 * os do começo, os do fim e o segundo de dois seguidos. Recebe, na ordem,
 * se cada item do menu é separador; devolve as posições a tirar.
 */
export function separadoresSobrando(ehSeparador) {
    const tirar = [];
    let ultimoQueFica = null;

    ehSeparador.forEach((separador, posicao) => {
        if (separador && (ultimoQueFica === null || ehSeparador[ultimoQueFica])) {
            tirar.push(posicao);

            return;
        }

        ultimoQueFica = posicao;
    });

    if (ultimoQueFica !== null && ehSeparador[ultimoQueFica]) {
        tirar.push(ultimoQueFica);
    }

    return tirar;
}

/** Um código novo para o campo `data-codigo-unico`: a cópia não pode repetir o do modelo. */
function codigoNovo() {
    return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Preenche a cópia do modelo com os valores da linha: tira o que não vale
 * (`data-mostra-se`), troca as `{chaves}` nos atributos e nos textos,
 * renova os códigos únicos e arruma os separadores.
 */
export function montarMenu(fragmento, valores) {
    fragmento.querySelectorAll('[data-mostra-se]').forEach((elemento) => {
        if (! temValor(valorDoCaminho(valores, elemento.dataset.mostraSe))) {
            elemento.remove();
        }
    });

    fragmento.querySelectorAll('*').forEach((elemento) => {
        for (const atributo of elemento.attributes) {
            if (atributo.value.includes('{')) {
                atributo.value = preencherTexto(atributo.value, valores);
            }
        }
    });

    const textos = document.createTreeWalker(fragmento, NodeFilter.SHOW_TEXT);

    for (let texto = textos.nextNode(); texto; texto = textos.nextNode()) {
        if (texto.nodeValue.includes('{')) {
            texto.nodeValue = preencherTexto(texto.nodeValue, valores);
        }
    }

    fragmento.querySelectorAll('[data-codigo-unico]').forEach((campo) => {
        campo.value = codigoNovo();
    });

    const itens = [...fragmento.children];
    separadoresSobrando(itens.map((item) => item.hasAttribute('data-separador'))).forEach((posicao) => itens[posicao].remove());

    return fragmento;
}

/**
 * Na primeira abertura do menu de uma linha (`data-monta-menu`), a cópia
 * do modelo da página entra na lista, já preenchida. Antes de abrir: a
 * lista é medida para decidir o lado, então tem de estar cheia.
 */
function montarSePreciso(menu, gatilho) {
    const nome = gatilho.dataset.montaMenu;

    if (! nome || 'montado' in menu.dataset) {
        return;
    }

    const modelo = document.querySelector(`template[data-modelo-menu="${CSS.escape(nome)}"]`);

    if (! modelo) {
        return;
    }

    menu.append(montarMenu(modelo.content.cloneNode(true), JSON.parse(gatilho.dataset.menuValores || '{}')));
    menu.dataset.montado = '';
}

function ligarDropdowns() {
    document.addEventListener('click', (evento) => {
        const gatilho = evento.target.closest('[data-abre-menu]');

        // Um clique fora fecha todos os menus abertos.
        document.querySelectorAll('[data-menu][data-aberto]').forEach((menu) => {
            if (menu.id !== gatilho?.dataset.abreMenu) {
                fecharMenu(menu);
            }
        });

        if (! gatilho) {
            return;
        }

        evento.preventDefault();

        const menu = document.getElementById(gatilho.dataset.abreMenu);

        if (! menu) {
            return;
        }

        if ('aberto' in menu.dataset) {
            fecharMenu(menu);
        } else {
            montarSePreciso(menu, gatilho);
            abrirMenu(menu, gatilho);
        }
    });
}

export { ligarDropdowns };
