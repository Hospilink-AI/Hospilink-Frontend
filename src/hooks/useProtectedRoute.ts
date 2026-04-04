import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useProtectedRoute(allowedRole: 'staff' | 'hospital' | 'admin') {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!token || !user) {
            // Not signed in → send to login
            const loginPath = allowedRole === 'admin' ? '/auth/admin/login' : '/auth/login';
            router.replace(loginPath);
            return;
        }

        // Signed in but wrong role → send to their own dashboard
        if (user.role !== allowedRole) {
            const roleRoutes = {
                staff: '/medicalStaff/dashboard',
                hospital: '/hospital/dashboard',
                admin: '/admin/dashboard',
            };
            //   router.replace(roleRoutes[user.role]);
            const destination = roleRoutes[user.role] ?? '/auth/login';
            router.replace(destination as any);
        }
    }, [user, token, isLoading]);
}