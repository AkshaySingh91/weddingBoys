// JSON is embedded in HTML: escape closing-script delimiters while preserving data.
export function serializeJsonLd(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
