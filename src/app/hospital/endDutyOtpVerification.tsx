import { Redirect, useLocalSearchParams } from "expo-router";

// The end code is entered on the duty itself now; old links land there.
export default function EndCodeRedirect() {
  const { dutyId } = useLocalSearchParams<{ dutyId?: string }>();
  return <Redirect href={(dutyId ? `/hospital/dutyDetails/${dutyId}` : "/hospital/live-monitoring") as any} />;
}
