import { Redirect } from "expo-router";

// Documents moved to /medicalStaff/documents.
export default function DocumentManagerRedirect() {
  return <Redirect href={"/medicalStaff/documents" as any} />;
}
