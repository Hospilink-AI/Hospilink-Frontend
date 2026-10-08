import { Redirect } from "expo-router";

// Documents are no longer an onboarding step: a new doctor goes to Home and uploads from there.
export default function DoctorDocumentUpload() {
  return <Redirect href={"/medicalStaff/documents" as any} />;
}
