'use client';

import { useEffect } from 'react';
import useClients from '@/Hooks/useClients.jsx';
import { Select } from '@/app/admin/components/ui/Select.jsx';

const nameOf = (c) => [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ') || 'Unnamed';

/**
 * Which wedding a review belongs to (plan phase 7). A linked review also
 * shows on that wedding's story page; "None" keeps it on the home page only.
 */
export default function WeddingSelect({ value, onChange }) {
    const { clients, load } = useClients();
    useEffect(() => { load(); }, [load]);
    return (
        <Select
            label="Wedding (shows the review on its story page)"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            options={[
                { value: '', label: 'None' },
                ...clients.map((c) => ({ value: c.clientId, label: nameOf(c) })),
            ]}
        />
    );
}
