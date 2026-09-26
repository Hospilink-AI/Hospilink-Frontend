import AdminTicketDetail from "@/component/admin-support/AdminTicketDetail";
import CapabilityGate from "@/component/admin-support/CapabilityGate";

export default function AdminTicket() {
  return (
    <CapabilityGate capability="ticket.view">
      <AdminTicketDetail />
    </CapabilityGate>
  );
}
