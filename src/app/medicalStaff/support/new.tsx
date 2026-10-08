import { ScreenHeader } from "@/ds/Layout";
import RaiseTicketForm from "@/component/support/RaiseTicketForm";

export default function StaffRaiseTicket() {
  return (
    <>
      <ScreenHeader title="Support" fallback="/medicalStaff/support" />
      <RaiseTicketForm base="/medicalStaff/support" role="staff" />
    </>
  );
}
