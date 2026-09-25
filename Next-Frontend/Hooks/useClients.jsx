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
     * @param {(msg: string) => boolean | { purgeMedia?: boolean, confirmForce?: (msg: string) => boolean }} confirmForceOrOptions
     */
    /**
     * Delete a wedding. Never forces on its own: when published work would be
     * pulled off the site the server answers 409, and this returns
     * `{ forceRequired: message }` so the caller can ask the admin to type the
     * couple's names before retrying with `force: true`.
     *
     * @returns {Promise<true | false | { forceRequired: string }>}
     */
    const remove = useCallback(async (clientId, { purgeMedia = false, force = false } = {}) => {
        setBusyId(clientId);
        const params = new URLSearchParams();
        if (force) params.set('force', 'true');
        if (purgeMedia) params.set('purge', 'true');
        const qs = params.toString() ? `?${params}` : '';

        try {
            const res = await fetch(`${api_url}/api/admin/clients/${clientId}${qs}`, { method: 'DELETE', credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 && data.requiresForce) return { forceRequired: data.message };
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
