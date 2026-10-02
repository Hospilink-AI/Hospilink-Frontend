import CapabilityGate from "@/component/admin-support/CapabilityGate";
import AutoRelistAdmin from "@/component/autoRelist/AutoRelistAdmin";

export default function AdminAutoRelistPage() {
  return (
    <CapabilityGate capability="autoRelist.analytics.view">
      <AutoRelistAdmin />
    </CapabilityGate>
  );
}
