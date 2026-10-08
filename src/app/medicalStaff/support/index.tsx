import { ScreenHeader } from "@/ds/Layout";
import SupportHome from "@/component/support/SupportHome";

export default function StaffSupport() {
  return (
    <>
      <ScreenHeader title="Help and support" fallback="/medicalStaff/profile" />
      <SupportHome base="/medicalStaff/support" />
    </>
  );
}
