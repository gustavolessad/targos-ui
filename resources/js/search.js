// --- Busca sem acento ---

/*
 * O texto como a busca compara: minúsculo e sem acento. Quem digita
 * "chacara" procura "Chácara", e exigir o acento esconde a opção.
 */
function paraBusca(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export { paraBusca };
