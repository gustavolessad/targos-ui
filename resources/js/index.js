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
import { ligarDicas } from './tooltip.js';
import { ligarCopiar, ligarImprimir } from './copy.js';
import { ligarAlternancias } from './alternancia.js';
import { ligarConfirmacoes } from './confirm.js';
import { ligarEnvios } from './submit.js';

export { MASCARAS, aplicarMascara, ligarMascaras } from './masks.js';
export { ligarCamadas, abrirCamada, fecharCamada } from './layers.js';
export { ligarAbas } from './tabs.js';
export { ligarSeletores } from './select.js';
export { ligarLinhasClicaveis } from './table-row.js';
export { ligarTema } from './theme.js';
export { ligarDropdowns } from './dropdown.js';
export { ligarOlhoDaSenha } from './password.js';
export { ligarToasts } from './toast.js';
export { ligarDatas } from './date.js';
export { ligarPeriodos } from './date-range.js';
export { formatarCentavos, reais, centavosColados, ligarDinheiro } from './money.js';
export { ligarDicas } from './tooltip.js';
export { ligarCopiar, ligarImprimir } from './copy.js';
export { ligarAlternancias } from './alternancia.js';
export { marcarCarregando, desmarcarCarregando, ligarEnvios } from './submit.js';
export { painelFlutuante } from './floating.js';
export { paraBusca } from './search.js';
export { ligarConfirmacoes } from './confirm.js';

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
    ligarDicas();
    ligarPeriodos();
    ligarConfirmacoes();

    antesDosEnvios();

    ligarEnvios();
}
