import { ScreenHeader } from "@/ds/Layout";
import AccountStanding from "@/component/support/AccountStanding";

export default function StaffAccountStanding() {
  return (
    <>
      <ScreenHeader title="Support" fallback="/medicalStaff/support" />
      <AccountStanding base="/medicalStaff/support" />
    </>
  );
}
