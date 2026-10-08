import InAppCenter from "@/component/inAppNotifications/InAppCenter";
import { ScreenHeader } from "@/ds/Layout";

// Doctors always get the in-app notification centre.
export default function StaffNotifications() {
  return (
    <>
      <ScreenHeader title="Notifications" fallback="/medicalStaff/dashboard" />
      <InAppCenter />
    </>
  );
}
