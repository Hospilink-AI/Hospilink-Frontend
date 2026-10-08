import PhoneHeader from "@/hospital/PhoneHeader";
import AccountStanding from "@/component/support/AccountStanding";

export default function HospitalAccountStanding() {
  return (
    <>
      <PhoneHeader title="Support" fallback="/hospital/support" />
      <AccountStanding base="/hospital/support" />
    </>
  );
}
