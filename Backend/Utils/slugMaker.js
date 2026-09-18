import slugify from 'slugify';

// Generate a URL-safe, collision-free slug for a blog post.
// `excludeId` lets an update keep its own slug without colliding with itself.
export async function makeUniqueSlug(Model, source, excludeId = null) {
    const base = slugify(source || 'post', {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
    }) || 'post';

    let slug = base;
    let n = 2;

    // Loop until we find a slug not already taken by a different document.
    // eslint-disable-next-line no-await-in-loop
    while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
        slug = `${base}-${n}`;
        n += 1;
    }

    return slug;
}

export default makeUniqueSlug;
