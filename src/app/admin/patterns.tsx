import CapabilityGate from "@/component/admin-support/CapabilityGate";
import PatternsScreen from "@/component/admin-support/PatternsScreen";

export default function AdminPatterns() {
  return (
    <CapabilityGate capability="pattern.view">
      <PatternsScreen />
    </CapabilityGate>
  );
}
