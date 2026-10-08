import PhoneHeader from "@/hospital/PhoneHeader";
import AccountSettingsScreen from "@/component/account/AccountSettingsScreen";

export default function HospitalAccount() {
  return (
    <>
      <PhoneHeader title="Account" fallback="/hospital/profile" />
      <AccountSettingsScreen role="hospital" embedded />
    </>
  );
}
