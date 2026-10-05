import { Redirect } from "expo-router";

// This page only ever showed sample requests and doctors. The live list is Emergency Requests.
export default function ActiveEmergencyRequestPage() {
  return <Redirect href={"/admin/emergency-request-all" as any} />;
}
