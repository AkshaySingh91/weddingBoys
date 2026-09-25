/**
 * The map pin as the API should receive it: both coordinates real numbers in
 * range, or no pin. `Number('')` is 0, so a blank field used to pin the couple
 * at (0, 0). The API applies the same rule and answers 400.
 *
 * @returns {{ ok: false } | { ok: true, isInMap: boolean, coordinate: {latitude:number, longitute:number} | null }}
 */
export function pinFromForm(isInMap, coordinate) {
    if (!isInMap) return { ok: true, isInMap: false, coordinate: null };
    const num = (v) => (String(v ?? '').trim() === '' ? NaN : Number(v));
    const latitude = num(coordinate?.latitude);
    const longitute = num(coordinate?.longitute);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitute)
        || Math.abs(latitude) > 90 || Math.abs(longitute) > 180) {
        return { ok: false };
    }
    return { ok: true, isInMap: true, coordinate: { latitude, longitute } };
}

export const PIN_ERROR = 'Enter both latitude and longitude as numbers, or switch the map pin off';
