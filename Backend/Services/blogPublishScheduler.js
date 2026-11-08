import { revalidateBlogs } from './revalidate.js';
import BlogPost from '../Models/blogPost.js';
import BlogPostRevision from '../Models/BlogPostRevision.js';

let schedulerInterval = null;

/**
 * Runs a periodic check (every 60s) for scheduled blog stories
 * whose scheduled time has arrived, flips them to Published, and
 * invalidates the ISR cache.
 */
export function startBlogPublishScheduler() {
    if (schedulerInterval) return;

    console.log('⏰ [Scheduler] Blog publishing background service initialized (60s tick)');

    schedulerInterval = setInterval(async () => {
        try {
            const now = new Date();
            const duePosts = await BlogPost.find({
                status: 'Scheduled',
                scheduledFor: { $lte: now },
            });

            if (duePosts.length === 0) return;

            for (const post of duePosts) {
                console.log(`🚀 [Scheduler] Publishing scheduled post: "${post.title}" (${post.slug})`);

                post.status = 'Published';
                post.publishedAt = post.scheduledFor || now;
                await post.save();

                // Create publish-snapshot revision
                if (post.contentJson) {
                    await new BlogPostRevision({
                        blogPost: post._id,
                        title: post.title,
                        contentJson: post.contentJson,
                        excerpt: post.excerpt,
                        template: post.template,
                        editedBy: post.author,
                        reason: 'scheduled-publish-auto',
                    }).save().catch(() => { });
                }

                revalidateBlogs(post.slug);
            }
        } catch (err) {
            console.error('❌ [Scheduler] Error during scheduled blog publish tick:', err);
        }
    }, 60 * 1000);
}

export function stopBlogPublishScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('⏹ [Scheduler] Blog publishing background service stopped');
    }
}
