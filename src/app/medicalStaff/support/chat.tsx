import { ScreenHeader } from "@/ds/Layout";
import ChatbotScreen from "@/component/support/ChatbotScreen";

export default function StaffSupportChat() {
  return (
    <>
      <ScreenHeader title="Chat with Support" fallback="/medicalStaff/support" />
      <ChatbotScreen base="/medicalStaff/support" />
    </>
  );
}
