import CapabilityGate from "@/component/admin-support/CapabilityGate";
import AnalyticsScreen from "@/component/analytics/AnalyticsScreen";

export default function AdminAnalyticsPage() {
  return (
    <CapabilityGate capability="analytics.view">
      <AnalyticsScreen />
    </CapabilityGate>
  );
}
