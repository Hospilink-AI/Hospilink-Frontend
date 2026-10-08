import { ScreenHeader } from "@/ds/Layout";
import TicketDetail from "@/component/support/TicketDetail";

export default function StaffTicketDetail() {
  return (
    <>
      <ScreenHeader title="My Tickets" fallback="/medicalStaff/support/tickets" />
      <TicketDetail base="/medicalStaff/support" />
    </>
  );
}
