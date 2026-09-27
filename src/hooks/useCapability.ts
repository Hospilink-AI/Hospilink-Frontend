import { useAuth } from '@/context/AuthContext';
import {
    AdminCapability,
    AdminSubRole,
    hasCapability,
} from '@/constant/adminCapabilities';

// usage: const { can } = useCapability(); can('admin.manage')
export function useCapability() {
    const { user } = useAuth();
    const subRole = user?.role === 'admin' ? user.adminSubRole : undefined;

    return {
        subRole: subRole as AdminSubRole | undefined,
        can: (capability: AdminCapability) => hasCapability(subRole, capability),
    };
}
