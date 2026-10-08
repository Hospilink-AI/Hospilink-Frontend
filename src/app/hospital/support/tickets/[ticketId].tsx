import PhoneHeader from "@/hospital/PhoneHeader";
import TicketDetail from "@/component/support/TicketDetail";

export default function HospitalTicketDetail() {
  return (
    <>
      <PhoneHeader title="My Tickets" fallback="/hospital/support/tickets" />
      <TicketDetail base="/hospital/support" />
    </>
  );
}
