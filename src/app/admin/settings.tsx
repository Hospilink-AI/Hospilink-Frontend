import CapabilityGate from "@/component/admin-support/CapabilityGate";
import PlatformSettings from "@/component/admin-settings/PlatformSettings";

export default function AdminPlatformSettingsPage() {
  return (
    <CapabilityGate capability="settings.manage">
      <PlatformSettings />
    </CapabilityGate>
  );
}
