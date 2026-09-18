'use client';

import { useCallback, useState } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * One client's identity and rollup.
 *
 * Counts come from the same aggregation the clients list uses, so a card and
 * the workspace it opens can never report different numbers.
 */
export default function useClientProfile(clientId) {
    const [client, setClient] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const [cRes, sRes] = await Promise.all([
                fetch(`${api_url}/api/admin/client/${clientId}`, { credentials: 'include' }),
                fetch(`${api_url}/api/admin/clients/${clientId}/stats`, { credentials: 'include' }),
            ]);
            if (cRes.ok) setClient((await cRes.json()).clientDetails);
            if (sRes.ok) setStats((await sRes.json()).stats);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    /** Rename the couple, and set, move or clear the map pin. */
    const saveProfile = useCallback(async (patch) => {
        setSaving(true);
        try {
            const res = await fetch(`${api_url}/api/admin/clients/${clientId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not save');
            setClient(data.client);
            fireMessage('Saved', 'success');
            return data.client;
        } catch (err) {
            fireMessage(err.message, 'error');
            return null;
        } finally {
            setSaving(false);
        }
    }, [clientId]);

    return { client, stats, loading, saving, load, saveProfile };
}
