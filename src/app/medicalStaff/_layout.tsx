import { Slot } from 'expo-router';
import DoctorShell from '@/doctor/shell/DoctorShell';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function Layout() {
  useProtectedRoute('staff');
  return (
    <DoctorShell>
      <Slot />
    </DoctorShell>
  );
}
