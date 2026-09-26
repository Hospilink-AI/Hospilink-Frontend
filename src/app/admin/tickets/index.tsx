import CapabilityGate from "@/component/admin-support/CapabilityGate";
import TicketQueue from "@/component/admin-support/TicketQueue";

export default function AdminTickets() {
  return (
    <CapabilityGate capability="ticket.view">
      <TicketQueue />
    </CapabilityGate>
  );
}
