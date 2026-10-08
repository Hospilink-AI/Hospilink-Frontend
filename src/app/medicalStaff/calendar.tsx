import DoctorCalendar from "@/component/dutyCalendar/DoctorCalendar";
import { ScreenHeader } from "@/ds/Layout";

// Opened from reminders and links (?mode=availability&edit=weekly); the Duties tab has the same calendar.
export default function DoctorCalendarPage() {
  return (
    <>
      <ScreenHeader title="Calendar" fallback="/medicalStaff/duties" />
      <DoctorCalendar />
    </>
  );
}
