import { Redirect, useLocalSearchParams } from "expo-router";

// Hospital sign-up starts at the welcome screen now; old links land there.
export default function OldHospitalOnboarding() {
  const { prefillName, prefillEmail, accountType } = useLocalSearchParams<{ prefillName?: string; prefillEmail?: string; accountType?: string }>();
  return <Redirect href={{ pathname: "/auth/welcome-choice", params: { signupName: prefillName ?? "", email: prefillEmail ?? "", accountType: accountType ?? "hospital" } } as any} />;
}
