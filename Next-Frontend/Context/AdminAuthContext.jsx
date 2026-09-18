'use client';

import { useContext, useEffect, useState, createContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, api_url } from '@/lib/apiClient.js';

// Guards the admin route tree and exposes the signed-in user (incl. RBAC role)
// to any descendant. Tokens are HttpOnly cookies — never readable from JS here.
const adminAuthContext = createContext(null);

export default function AdminAuthProvider(props) {
    const [user, setUser] = useState(null);
    const [isAdminValid, setIsAdminValid] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const checkUserAuth = async () => {
            try {
                // apiFetch transparently refreshes an expired access token once.
                const res = await apiFetch('/api/admin/auth/me', { method: 'GET' });
                const data = await res.json().catch(() => null);

                if (cancelled) return;

                if (res.ok && data?.user) {
                    setUser(data.user);
                    setIsAdminValid(true);
                } else {
                    setIsAdminValid(false);
                    router.push('/admin/login');
                }
            } catch {
                if (!cancelled) {
                    setIsAdminValid(false);
                    router.push('/admin/login');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkUserAuth();
        return () => { cancelled = true; };
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${api_url}/api/admin/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch { /* clear client state regardless */ }
        setUser(null);
        setIsAdminValid(false);
        router.push('/admin/login');
    }, [router]);

    const value = {
        // new shape
        user,
        role: user?.role || null,
        isSuperAdmin: user?.role === 'SuperAdmin',
        logout,
        // back-compat with existing consumers
        isAdminValid,
        loading,
        name: user?.name || null,
        email: user?.email || null,
        phone: user?.phone || null,
        setIsAdminValid,
        setAdminName: (n) => setUser((p) => ({ ...(p || {}), name: n })),
        setAdminEmail: (e) => setUser((p) => ({ ...(p || {}), email: e })),
        setAdminPhone: (p2) => setUser((p) => ({ ...(p || {}), phone: p2 })),
    };

    return (
        <adminAuthContext.Provider value={value}>
            {props.children}
        </adminAuthContext.Provider>
    );
}

export const useAuth = () => useContext(adminAuthContext);
