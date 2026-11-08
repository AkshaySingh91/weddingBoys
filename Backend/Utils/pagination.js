export function pagination(values = {}, defaultLimit = 12, maxLimit = 100) {
    const integer = (value, fallback) => {
        const number = Number(value);
        return Number.isSafeInteger(number) && number > 0 ? number : fallback;
    };
    return { page: Math.min(100000, integer(values.page, 1)), limit: Math.min(maxLimit, integer(values.limit, defaultLimit)) };
}
