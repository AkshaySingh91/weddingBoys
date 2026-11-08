'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleNotch, BookOpenText, ArrowLeft } from '@phosphor-icons/react';
import BlogForm from '../../_components/BlogForm.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function EditBlogPage() {
    const { id } = useParams();
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${api_url}/api/admin/blogs/${id}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await res.json();
                if (res.status >= 300) {
                    setNotFound(true);
                    return fireMessage(data.error || 'Post not found', 'error');
                }
                setPost(data);
            } catch (err) {
                setNotFound(true);
                fireMessage(err.message, 'error');
            }
        }
        load();
    }, [id]);

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 font-sans text-center">
                <div className="w-12 h-12 rounded-full bg-ground-sunk flex items-center justify-center text-ink-muted border border-edge-subtle">
                    <BookOpenText size={24} />
                </div>
                <h3 className="text-sm font-bold text-ink">Article Not Found</h3>
                <p className="text-xs text-ink-muted max-w-sm">
                    The requested blog post could not be loaded or may have been deleted.
                </p>
                <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.push('/admin/blogs')}>
                    Return to Articles
                </Button>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 font-sans">
                <CircleNotch size={28} className="animate-spin text-ink-secondary" />
                <p className="text-xs text-ink-muted font-medium">Loading article details...</p>
            </div>
        );
    }

    return <BlogForm mode="edit" initial={post} postId={id} />;
}
