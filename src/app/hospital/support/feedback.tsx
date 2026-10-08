import PhoneHeader from "@/hospital/PhoneHeader";
import FeedbackScreen from "@/component/support/FeedbackScreen";

export default function HospitalFeedback() {
  return (
    <>
      <PhoneHeader title="Support" fallback="/hospital/support" />
      <FeedbackScreen base="/hospital/support" />
    </>
  );
}
