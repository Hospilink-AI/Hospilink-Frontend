import { Slot } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import HospitalShell from '@/hospital/shell/HospitalShell';
import PortalShell from '@/hospital/portal/PortalShell';

// Phones get the app shell (top bar and bottom navigation); larger screens get the hospital portal.
export default function Layout() {
  const { width } = useWindowDimensions();
  useProtectedRoute('hospital');
  const Shell = width < 768 ? HospitalShell : PortalShell;
  return (
    <Shell>
      <Slot />
    </Shell>
  );
}
