import LegalPage from "@/component/legal/LegalPage";
import { TERMS_OF_USE } from "@/constant/legal/termsOfUse";

// Public link for the store listings and the app (hospilink.in/terms)
export default function TermsPage() {
  return <LegalPage doc={TERMS_OF_USE} />;
}
