/*
 * O JavaScript do design system.
 *
 * Sem framework: tudo funciona por atributo `data-*` no HTML, e cada
 * comportamento vive num módulo desta pasta.
 *
 * O projeto que não tem ordem própria a respeitar chama `ligarUi()` no
 * `DOMContentLoaded`. O que precisa intercalar os próprios módulos
 * importa as funções uma a uma, daqui mesmo.
 */
import { ligarMascaras } from './masks.js';
import { ligarCamadas } from './layers.js';
import { ligarAbas } from './tabs.js';
import { ligarSeletores } from './select.js';
import { ligarLinhasClicaveis } from './table-row.js';
import { ligarTema } from './theme.js';
import { ligarDropdowns } from './dropdown.js';
import { ligarOlhoDaSenha } from './password.js';
import { ligarToasts } from './toast.js';
import { ligarDatas } from './date.js';
import { ligarPeriodos } from './date-range.js';
import { ligarDinheiro } from './money.js';
import { ligarNumeros } from './number.js';
import { ligarPercentuais } from './percent.js';
import { ligarDicas } from './tooltip.js';
import { ligarCopiar, ligarImprimir } from './copy.js';
import { ligarAlternancias } from './alternancia.js';
import { ligarConfirmacoes } from './confirm.js';
import { ligarMenuLateral } from './nav.js';
import { ligarBarraLateral } from './sidebar.js';
import { ligarGraficos } from './chart.js';
import { ligarRepetidores } from './repeater.js';
import { ligarArquivos } from './file.js';
import { ligarImagens } from './image.js';
import { ligarFiltros } from './filters.js';
import { ligarPreenchimentos } from './form-fill.js';
import { ligarEnvios } from './submit.js';

export { MASCARAS, aplicarMascara, ligarMascaras, valorLimpo, mensagemInvalida, validarCpf, validarCnpj, validarTelefone, validarCep } from './masks.js';
export { mostrarErros, limparErros, mostrarErroNoCampo, limparErroDoCampo, campoDe, nomeHtml } from './errors.js';
export { requisicaoJson, mensagemDe, xsrfToken, ErroDeRequisicao } from './fetch.js';
export { ligarCamadas, abrirCamada, fecharCamada } from './layers.js';
export { ligarAbas } from './tabs.js';
export { ligarSeletores, escolhaDe } from './select.js';
export { ligarLinhasClicaveis } from './table-row.js';
export { ligarTema } from './theme.js';
export { ligarDropdowns, montarMenu } from './dropdown.js';
export { ligarOlhoDaSenha } from './password.js';
export { ligarToasts } from './toast.js';
export { ligarDatas } from './date.js';
export { ligarPeriodos } from './date-range.js';
export { formatarCentavos, textoDeCentavos, reais, centavosColados, centavosDe, decimalDeCentavos, lerDigitado, ligarDinheiro } from './money.js';
export { ajustar, somarPasso, limparDigitado, ligarNumeros } from './number.js';
export { centesimosDe, decimalDePercentual, centesimosColados, ligarPercentuais } from './percent.js';
export { ligarDicas } from './tooltip.js';
export { ligarCopiar, ligarImprimir } from './copy.js';
export { ligarAlternancias } from './alternancia.js';
export { marcarCarregando, desmarcarCarregando, ligarEnvios } from './submit.js';
export { painelFlutuante } from './floating.js';
export { paraBusca } from './search.js';
export { ligarConfirmacoes, confirmar } from './confirm.js';
export { ligarMenuLateral } from './nav.js';
export { ligarBarraLateral } from './sidebar.js';
export { ligarGraficos } from './chart.js';
export { ligarRepetidores, adicionarLinha, substituirIndice, proximoIndice, podeRemover, podeAdicionar } from './repeater.js';
export { tamanhoLegivel, aceita, resumoDosArquivos, conferirArquivos, ligarArquivos } from './file.js';
export { ligarImagens } from './image.js';
export { ligarFiltros, camposForaDaUrl, enviaAoMudar } from './filters.js';
export { ligarPreenchimentos, preencherFormulario, escreverNoCampo } from './form-fill.js';

/**
 * Liga tudo, na ordem certa.
 *
 * `antesDosEnvios` é onde o projeto liga os próprios módulos: quem
 * segura um envio para perguntar antes (uma confirmação, por exemplo)
 * já tem de estar escutando quando `ligarEnvios` entra, e por isso ele
 * é sempre o último.
 */
export function ligarUi(antesDosEnvios = () => {}) {
    ligarMascaras();
    ligarCamadas();
    ligarTema();
    ligarAbas();
    ligarSeletores();
    ligarLinhasClicaveis();
    ligarDropdowns();
    ligarOlhoDaSenha();
    ligarToasts();
    ligarCopiar();
    ligarImprimir();
    ligarAlternancias();
    ligarDatas();
    ligarDinheiro();
    ligarNumeros();
    ligarPercentuais();
    ligarDicas();
    ligarPeriodos();
    ligarConfirmacoes();
    ligarMenuLateral();
    ligarBarraLateral();
    ligarGraficos();
    ligarRepetidores();
    ligarArquivos();
    ligarImagens();
    ligarFiltros();
    ligarPreenchimentos();

    antesDosEnvios();

    ligarEnvios();
}
