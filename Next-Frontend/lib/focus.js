/**
 * Cover focus → CSS. `focus` is {x, y} in 0–1 (the worker's attention point, or
 * the one an admin clicked). Used as object-position so a landscape cover cropped
 * to a phone or an ultra-wide frame keeps the couple in shot.
 */
export const focusPosition = (focus) => (Number.isFinite(focus?.x) && Number.isFinite(focus?.y)
    ? `${(focus.x * 100).toFixed(1)}% ${(focus.y * 100).toFixed(1)}%`
    : undefined);

/** Style for an object-cover image/video; also centres any zoom on the subject. */
export const focusStyle = (focus, extra) => {
    const pos = focusPosition(focus);
    if (!pos) return extra;
    return { ...extra, objectPosition: pos, transformOrigin: pos };
};
