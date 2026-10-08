import PhoneHeader from "@/hospital/PhoneHeader";
import TicketList from "@/component/support/TicketList";

export default function HospitalTickets() {
  return (
    <>
      <PhoneHeader title="Support" fallback="/hospital/support" />
      <TicketList base="/hospital/support" />
    </>
  );
}
