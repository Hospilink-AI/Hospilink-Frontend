import { Redirect } from "expo-router";

// My applications live in Vacancies > My applications.
export default function ApplicationsRedirect() {
  return <Redirect href={"/medicalStaff/vacancies?tab=mine" as any} />;
}
