import PhoneHeader from "@/hospital/PhoneHeader";
import HospitalCalendar from "@/component/dutyCalendar/HospitalCalendar";

export default function HospitalCalendarPage() {
  return (
    <>
      <PhoneHeader title="Calendar" fallback="/hospital/live-monitoring" />
      <HospitalCalendar compact />
    </>
  );
}
