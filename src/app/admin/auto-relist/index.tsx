import CapabilityGate from "@/component/admin-support/CapabilityGate";
import AutoRelistAdmin from "@/component/autoRelist/AutoRelistAdmin";

export default function AdminAutoRelistPage() {
  return (
    <CapabilityGate capability="autoRelist.view">
      <AutoRelistAdmin />
    </CapabilityGate>
  );
}
