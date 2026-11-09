/*
 * O erro de um campo escrito pelo JavaScript.
 *
 * O servidor desenha o erro de validação embaixo do campo quando o
 * formulário volta. O que acontece sem recarregar — uma máscara que
 * recusa o dígito verificador, um 422 de um `fetch` — precisa do mesmo
 * desenho, no mesmo lugar, e vem daqui.
 *
 * O `<p data-erro-js>` entra no fim do envelope do campo (o `.group`
 * do input, o `[data-dinheiro]` do valor, o `[data-data]` da data, o
 * `[data-horario]` da hora, o `[data-seletor-cor]` da cor…),
 * que é onde o Blade põe o dele.
 */

const CLASSES_DO_ERRO = 'mt-1.5 text-sm text-danger-600 dark:text-danger-400';

/** `items.0.price` (como o Laravel nomeia o erro) → `items[0][price]` (como o campo se chama no HTML). */
export function nomeHtml(chave) {
    const partes = String(chave).split('.');

    return partes[0] + partes.slice(1).map((parte) => `[${parte}]`).join('');
}

/** O envelope de um campo: a caixa que o Blade desenhou em volta dele. */
export function envelopeDe(campo) {
    return campo.closest('[data-dinheiro], [data-data], [data-horario], [data-seletor-cor], [data-periodo], [data-seletor], [data-numero], [data-percentual], .group')
        ?? campo.parentElement;
}

/**
 * O campo de um formulário pelo nome do erro.
 *
 * Aceita o nome do HTML (`items[0][price]`) ou o do Laravel
 * (`items.0.price`). Para o valor, a data e o select, o que tem o nome
 * é o nativo escondido — e é ele que se acha.
 */
export function campoDe(formulario, chave) {
    const nome = chave.includes('.') ? nomeHtml(chave) : chave;
    const escapado = CSS.escape(nome);
    const campo = formulario.querySelector(`[name="${escapado}"], [name="${escapado}[]"]`);

    if (campo) {
        return campo;
    }

    /*
     * `roles.1` é o item 1 de uma lista: não há campo com esse nome, o
     * que há é o `roles[]` (um select múltiplo, um grupo de caixas). O
     * erro vai para o campo da lista.
     */
    const partes = String(chave).split('.');

    if (partes.length > 1 && /^\d+$/.test(partes.at(-1))) {
        return campoDe(formulario, partes.slice(0, -1).join('.'));
    }

    return null;
}

/** Escreve o erro embaixo do campo (trocando o anterior, se houver). */
export function mostrarErroNoCampo(campo, texto) {
    const envelope = envelopeDe(campo);

    limparErroDoCampo(campo);

    const erro = document.createElement('p');
    erro.className = CLASSES_DO_ERRO;
    erro.dataset.erroJs = '';
    erro.textContent = texto;

    envelope.append(erro);
    campo.setAttribute('aria-invalid', 'true');
}

/** Tira o erro que o JavaScript escreveu (o do servidor fica). */
export function limparErroDoCampo(campo) {
    envelopeDe(campo)?.querySelectorAll(':scope > [data-erro-js]').forEach((erro) => erro.remove());
    campo.removeAttribute('aria-invalid');
}

/**
 * Escreve os erros de um 422 nos campos do formulário.
 *
 * `erros` é o `errors` do Laravel: `{ campo: ['mensagem'] }` (ou a
 * mensagem direta). Devolve as mensagens cujo campo não existe no
 * formulário, para quem chamou mostrá-las num toast.
 */
export function mostrarErros(formulario, erros) {
    limparErros(formulario);

    const semCampo = [];

    Object.entries(erros ?? {}).forEach(([chave, mensagens]) => {
        const texto = Array.isArray(mensagens) ? mensagens[0] : mensagens;
        const campo = campoDe(formulario, chave);

        if (campo) {
            mostrarErroNoCampo(campo, texto);
        } else {
            semCampo.push(texto);
        }
    });

    return semCampo;
}

/** Tira todos os erros que o JavaScript escreveu no formulário. */
export function limparErros(formulario) {
    formulario.querySelectorAll('[data-erro-js]').forEach((erro) => erro.remove());
    formulario.querySelectorAll('[aria-invalid="true"]').forEach((campo) => campo.removeAttribute('aria-invalid'));
}

/*
 * A borda vermelha que o Blade desenha no campo com erro, e a de sempre que
 * a substitui quando o erro sai. São as classes dos campos do pacote
 * (`x-ui.input`, `x-ui.select`, `x-ui.money`…): `border-danger-400` com o
 * foco e o tema escuro em vermelho.
 */
const BORDA_DE_ERRO = {
    'border-danger-400': 'border-neutral-300',
    'focus:border-danger-500': 'focus:border-primary-500',
    'focus:ring-danger-500/20': 'focus:ring-primary-500/20',
    'dark:border-danger-500': 'dark:border-neutral-700',
    'aria-expanded:border-danger-500': 'aria-expanded:border-primary-500',
    'aria-expanded:ring-danger-500/20': 'aria-expanded:ring-primary-500/20',
};

/** As classes de um campo com erro → as do campo sem erro; as outras ficam. */
export function classesSemErro(classes) {
    return [...classes].map((classe) => BORDA_DE_ERRO[classe] ?? classe);
}

/**
 * Tira todos os erros do formulário: os que o servidor desenhou (o
 * `<p data-erro-servidor>` e a borda vermelha) e os do JavaScript.
 *
 * O erro do servidor é de uma tentativa que já passou. O modal que serve a
 * várias linhas o mostrava na linha seguinte — o "nome repetido" da marca A
 * aparecia na edição da Nike —, e o que a pessoa fechou desistindo voltava
 * com ele (teste no navegador do meu-sistema2, 09/11/2026).
 */
export function limparErrosDoFormulario(formulario) {
    formulario.querySelectorAll('[data-erro-js], [data-erro-servidor]').forEach((erro) => erro.remove());

    formulario.querySelectorAll('.border-danger-400').forEach((campo) => {
        campo.className = classesSemErro(campo.classList).join(' ');
    });

    formulario.querySelectorAll('[aria-invalid="true"]').forEach((campo) => campo.removeAttribute('aria-invalid'));
}
