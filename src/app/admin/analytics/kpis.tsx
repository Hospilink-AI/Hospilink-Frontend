import CapabilityGate from "@/component/admin-support/CapabilityGate";
import KpiCatalogue from "@/component/analytics/KpiCatalogue";

export default function AdminAnalyticsKpisPage() {
  return (
    <CapabilityGate capability="analytics.view">
      <KpiCatalogue />
    </CapabilityGate>
  );
}
