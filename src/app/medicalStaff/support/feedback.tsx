import { ScreenHeader } from "@/ds/Layout";
import FeedbackScreen from "@/component/support/FeedbackScreen";

export default function StaffFeedback() {
  return (
    <>
      <ScreenHeader title="Support" fallback="/medicalStaff/support" />
      <FeedbackScreen base="/medicalStaff/support" />
    </>
  );
}
