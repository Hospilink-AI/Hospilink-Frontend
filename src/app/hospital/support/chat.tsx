import PhoneHeader from "@/hospital/PhoneHeader";
import ChatbotScreen from "@/component/support/ChatbotScreen";

export default function HospitalSupportChat() {
  return (
    <>
      <PhoneHeader title="Chat with Support" fallback="/hospital/support" />
      <ChatbotScreen base="/hospital/support" />
    </>
  );
}
