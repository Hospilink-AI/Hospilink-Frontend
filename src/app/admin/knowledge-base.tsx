import CapabilityGate from "@/component/admin-support/CapabilityGate";
import KnowledgeBaseScreen from "@/component/admin-support/KnowledgeBaseScreen";

export default function AdminKnowledgeBase() {
  return (
    <CapabilityGate capability="knowledgeBase.manage">
      <KnowledgeBaseScreen />
    </CapabilityGate>
  );
}
