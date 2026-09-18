'use client';

import { useCallback, useState } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * The wedding list, with its rollup.
 *
 * Each row carries the same `stats` the single-client view uses — both come
 * from `Services/clientStats.js` on the server — so a card and the page it
 * opens can never disagree.
 */
export default function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${api_url}/api/admin/clients`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not load weddings');
            setClients(data.clientDetails || []);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Delete a wedding. The server refuses while published work exists unless
     * forced, so the caller is asked twice: once for the delete, and again to
     * confirm pulling live work off the public site.
     *
     * @param {(msg: string) => boolean} confirmForce asked only on a 409
     */
    const remove = useCallback(async (clientId, confirmForce) => {
        setBusyId(clientId);
        try {
            let res = await fetch(`${api_url}/api/admin/clients/${clientId}`, { method: 'DELETE', credentials: 'include' });
            let data = await res.json();

            if (res.status === 409 && data.requiresForce) {
                if (!confirmForce?.(data.message)) return false;
                res = await fetch(`${api_url}/api/admin/clients/${clientId}?force=true`, { method: 'DELETE', credentials: 'include' });
                data = await res.json();
            }
            if (!res.ok) throw new Error(data.message || 'Could not delete');

            setClients((prev) => prev.filter((c) => c.clientId !== clientId));
            fireMessage(data.message, 'success');
            return true;
        } catch (err) {
            fireMessage(err.message, 'error');
            return false;
        } finally {
            setBusyId(null);
        }
    }, []);

    return { clients, loading, busyId, load, remove };
}
