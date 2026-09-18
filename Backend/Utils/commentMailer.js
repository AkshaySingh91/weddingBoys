import { sendMail } from './mailer.js';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const STUDIO_EMAIL = process.env.STUDIO_NOTIFICATION_EMAIL || process.env.EMAIL_USERNAME;

/**
 * Send an email notification to the studio admin when a new comment is submitted.
 */
export async function notifyStudioNewComment({ blogPost, comment }) {
    if (!STUDIO_EMAIL) return;

    const postTitle = blogPost?.title || 'Wedding Story';
    const postSlug = blogPost?.slug || '';
    const adminCommentsUrl = `${SITE_URL}/admin/blogs/comments`;
    const publicStoryUrl = `${SITE_URL}/blogs/${postSlug}`;

    const subject = `New Comment on "${postTitle}" — The Wedding Boys`;
    const html = `
    <!doctype html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; padding: 24px; color: #1c1917;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd5; border-radius: 8px; overflow: hidden;">
          <div style="background: #1c1917; color: #f7f4ef; padding: 18px 24px;">
            <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #c29555;">Editorial Journal</div>
            <h2 style="margin: 4px 0 0; font-size: 18px; font-weight: 500;">New Reader Comment Received</h2>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #78716c;">
              A reader left a new response on <a href="${publicStoryUrl}" style="color: #8c532b; text-decoration: underline;"><strong>${postTitle}</strong></a>:
            </p>
            <div style="background: #f7f4ef; border-left: 3px solid #8c532b; padding: 14px 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #1c1917;">
                ${comment.author.name} <span style="font-weight: 400; color: #78716c;">(${comment.author.email})</span>
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #44403c; white-space: pre-wrap;">${comment.body}</p>
            </div>
            <div style="margin-top: 24px;">
              <a href="${adminCommentsUrl}" style="display: inline-block; background: #1c1917; color: #f7f4ef; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 500; border-radius: 6px;">
                Open Comment Moderation Queue →
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    return sendMail({
        to: STUDIO_EMAIL,
        subject,
        html,
        text: `New comment on "${postTitle}" by ${comment.author.name} (${comment.author.email}):\n\n"${comment.body}"\n\nReview at: ${adminCommentsUrl}`
    });
}

/**
 * Send an email notification to a parent commenter when their comment receives a reply.
 */
export async function notifyCommenterReply({ blogPost, parentComment, replyComment }) {
    if (!parentComment?.author?.email) return;

    const postTitle = blogPost?.title || 'Wedding Story';
    const postSlug = blogPost?.slug || '';
    const replierName = replyComment.isStudioReply ? 'The Wedding Boys Studio' : (replyComment.author?.name || 'A reader');
    const commentAnchorUrl = `${SITE_URL}/blogs/${postSlug}#comment-${replyComment._id}`;

    const subject = `${replierName} replied to your comment on "${postTitle}"`;
    const html = `
    <!doctype html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; padding: 24px; color: #1c1917;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd5; border-radius: 8px; overflow: hidden;">
          <div style="background: #1c1917; color: #f7f4ef; padding: 18px 24px;">
            <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #c29555;">The Wedding Boys Journal</div>
            <h2 style="margin: 4px 0 0; font-size: 18px; font-weight: 500;">Someone Replied to Your Comment</h2>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #44403c;">
              Hi ${parentComment.author.name || 'there'},
            </p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #44403c;">
              <strong>${replierName}</strong> just replied to your comment on <strong>${postTitle}</strong>:
            </p>
            <div style="background: #f7f4ef; border-left: 3px solid #c29555; padding: 14px 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1c1917; white-space: pre-wrap;">${replyComment.body}</p>
            </div>
            <div style="margin-top: 24px;">
              <a href="${commentAnchorUrl}" style="display: inline-block; background: #8c532b; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 500; border-radius: 6px;">
                View Conversation on Story →
              </a>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #a8a29e;">
              You received this because you shared a comment on The Wedding Boys. We respect your privacy — your email is never shown publicly.
            </p>
          </div>
        </div>
      </body>
    </html>
    `;

    return sendMail({
        to: parentComment.author.email,
        subject,
        html,
        text: `Hi ${parentComment.author.name},\n\n${replierName} replied to your comment on "${postTitle}":\n\n"${replyComment.body}"\n\nRead more at: ${commentAnchorUrl}`
    });
}
