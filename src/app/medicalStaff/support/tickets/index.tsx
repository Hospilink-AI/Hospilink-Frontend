import { ScreenHeader } from "@/ds/Layout";
import TicketList from "@/component/support/TicketList";

export default function StaffTickets() {
  return (
    <>
      <ScreenHeader title="Support" fallback="/medicalStaff/support" />
      <TicketList base="/medicalStaff/support" />
    </>
  );
}
