import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/service/api';
import { Dialog } from '@/ds/Overlay';

/** One log-out for the doctor app: confirm, tell the server, clear the session, back to the start. */
export function useLogout() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await authAPI.logout();
    } catch {
      // the session ends locally either way
    }
    try {
      await logout();
    } finally {
      setBusy(false);
      setOpen(false);
      router.replace('/');
    }
  };

  const dialog = (
    <Dialog
      visible={open}
      onClose={() => setOpen(false)}
      icon="logout"
      tone="danger"
      title="Log out?"
      body="Are you sure you want to log out of your account?"
      actions={[
        { label: 'Log Out', variant: 'danger', onPress: confirm, loading: busy },
        { label: 'Cancel', variant: 'secondary', onPress: () => setOpen(false) },
      ]}
    />
  );

  return { ask: () => setOpen(true), dialog };
}
