import CapabilityGate from "@/component/admin-support/CapabilityGate";
import AutoRelistSettings from "@/component/autoRelist/AutoRelistSettings";

export default function AdminAutoRelistSettingsPage() {
  return (
    <CapabilityGate capability="autoRelist.configure">
      <AutoRelistSettings />
    </CapabilityGate>
  );
}
