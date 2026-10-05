import LegalPage from "@/component/legal/LegalPage";
import { PRIVACY_POLICY } from "@/constant/legal/privacyPolicy";

// Public link for the store listings and the app (hospilink.in/privacy-policy)
export default function PrivacyPolicyPage() {
  return <LegalPage doc={PRIVACY_POLICY} />;
}
