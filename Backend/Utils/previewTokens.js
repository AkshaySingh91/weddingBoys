import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

function previewSecret() {
    if (process.env.BLOG_PREVIEW_SECRET) return process.env.BLOG_PREVIEW_SECRET;
    // A purpose-specific key derived from the existing private auth secret.
    if (!process.env.JWT_SECRET_KEY) throw new Error('Blog preview signing is not configured');
    return crypto.createHmac('sha256', process.env.JWT_SECRET_KEY).update('weddingboys:blog-preview:v1').digest('hex');
}

export function signPreviewToken(post) {
    return jwt.sign({ postId: String(post._id), slug: post.slug, purpose: 'blog-preview' }, previewSecret(), {
        algorithm: 'HS256', audience: 'blog-preview', issuer: 'weddingboys', expiresIn: '24h',
    });
}

export function verifyPreviewToken(token) {
    const claim = jwt.verify(token, previewSecret(), { algorithms: ['HS256'], audience: 'blog-preview', issuer: 'weddingboys' });
    if (claim.purpose !== 'blog-preview' || typeof claim.postId !== 'string') throw new Error('Invalid preview token');
    return claim;
}
