import { Redirect } from "expo-router";

// Past duties live in Duties > History now.
export default function HistoryRedirect() {
  return <Redirect href={"/medicalStaff/duties?tab=history" as any} />;
}
