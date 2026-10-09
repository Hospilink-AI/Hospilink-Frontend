import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import AuthLayout, { HOSPITAL_POINTS } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import { ProgressBar } from "@/ds/Controls";
import Txt from "@/ds/Txt";
import { ThemeProvider } from "@/ds/theme";
import DocumentList, { HOSPITAL_DOCS } from "@/doctor/components/DocumentList";

// Last step of hospital sign-up. Sign-in keeps coming back here until every required document is in.
function HospitalDocumentsStep() {
  const router = useRouter();
  const { logout } = useAuth();
  const [progress, setProgress] = useState<{ uploaded: number; needed: number } | null>(null);
  const ready = !!progress && progress.uploaded >= progress.needed;

  return (
    <AuthLayout
      step={{ at: 4, of: 4 }}
      title="Add your documents"
      subtitle="HospiLink checks these before you post your first duty. Clear photos or PDFs, up to 5 MB each."
      points={HOSPITAL_POINTS}
      testID="hospital-documents-step"
      footer={
        <View style={{ gap: 8 }}>
          <Button label="Go to HospiLink" onPress={() => router.replace("/hospital/dashboard" as any)} disabled={!ready} full size="lg" iconRight="forward" />
          <Button
            label="Sign out and finish later"
            variant="text"
            full
            onPress={async () => {
              await logout();
              router.replace("/" as any);
            }}
          />
        </View>
      }
    >
      {progress ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Txt v="label" tone="soft">
              {ready ? "All required documents are in" : "Required documents"}
            </Txt>
            <Txt v="label" tone={ready ? "success" : "primary"} style={{ fontVariant: ["tabular-nums"] }}>
              {progress.uploaded} of {progress.needed}
            </Txt>
          </View>
          <ProgressBar value={progress.needed ? progress.uploaded / progress.needed : 0} tone={ready ? "success" : "primary"} />
        </View>
      ) : null}
      <DocumentList slots={HOSPITAL_DOCS} compact onProgress={(uploaded, needed) => setProgress({ uploaded, needed })} />
    </AuthLayout>
  );
}

export default function HospitalDocumentsRoute() {
  return (
    <ThemeProvider name="v2">
      <HospitalDocumentsStep />
    </ThemeProvider>
  );
}
