// Utilidades de dinero. El backend trabaja SIEMPRE en centavos enteros (unidad menor).
// Este módulo es el único puente entre la unidad de presentación (pesos, con
// decimales) y la unidad de almacenamiento/cálculo (centavos enteros).

/**
 * Convierte un valor ingresado por el usuario (pesos; string o número) a centavos
 * enteros. Acepta coma o punto como separador decimal. Devuelve 0 si no es válido.
 */
export function toCents(value) {
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
    const pesos = parseFloat(normalized);
    if (!Number.isFinite(pesos)) return 0;
    return Math.round(pesos * 100);
}

/** Convierte centavos enteros a un número en pesos (para editar en un input). */
export function fromCents(cents) {
    return (Number(cents) || 0) / 100;
}

/**
 * Formatea centavos enteros como texto localizado en pesos.
 * No fuerza decimales: $1.000,00 se muestra como "1.000" y $33,33 como "33,33".
 */
export function formatMoney(cents) {
    return fromCents(cents).toLocaleString(undefined, {
        maximumFractionDigits: 2
    });
}
