import CapabilityGate from "@/component/admin-support/CapabilityGate";
import CalendarSettings from "@/component/dutyCalendar/CalendarSettings";

export default function AdminCalendarSettingsPage() {
  return (
    <CapabilityGate capability="calendar.config.manage">
      <CalendarSettings />
    </CapabilityGate>
  );
}
