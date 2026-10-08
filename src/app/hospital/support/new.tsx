import PhoneHeader from "@/hospital/PhoneHeader";
import RaiseTicketForm from "@/component/support/RaiseTicketForm";

export default function HospitalRaiseTicket() {
  return (
    <>
      <PhoneHeader title="Support" fallback="/hospital/support" />
      <RaiseTicketForm base="/hospital/support" role="hospital" />
    </>
  );
}
