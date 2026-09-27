import CapabilityGate from "@/component/admin-support/CapabilityGate";
import FeedbackBoard from "@/component/admin-support/FeedbackBoard";

export default function AdminFeedback() {
  return (
    <CapabilityGate capability="feedback.view">
      <FeedbackBoard />
    </CapabilityGate>
  );
}
