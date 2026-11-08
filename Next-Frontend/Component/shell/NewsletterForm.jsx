import Link from 'next/link';

export default function NewsletterForm({ className = '' }) {
    return <Link href="/blogs" className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 ${className}`}>
        Read the latest wedding stories
    </Link>;
}
