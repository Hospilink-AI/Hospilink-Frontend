import { Redirect, useLocalSearchParams } from "expo-router";

// One duty screen for every state; old links still land on it.
export default function HistoryDetailsRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={(id ? `/medicalStaff/dutyDetails/${id}` : "/medicalStaff/duties?tab=history") as any} />;
}
