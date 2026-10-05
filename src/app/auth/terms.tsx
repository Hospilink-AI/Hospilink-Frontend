import LegalPage from "@/component/legal/LegalPage";
import { TERMS_OF_USE } from "@/constant/legal/termsOfUse";

export default function AuthTermsPage() {
  return <LegalPage doc={TERMS_OF_USE} />;
}
