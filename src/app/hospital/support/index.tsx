import PhoneHeader from "@/hospital/PhoneHeader";
import SupportHome from "@/component/support/SupportHome";

export default function HospitalSupport() {
  return (
    <>
      <PhoneHeader title="Help and support" fallback="/hospital/profile" />
      <SupportHome base="/hospital/support" />
    </>
  );
}
