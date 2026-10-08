import { Screen, ScreenHeader } from '@/ds/Layout';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import DocumentList, { HOSPITAL_DOCS } from '@/doctor/components/DocumentList';

// The hospital's verification documents (same list and upload as the doctor's, hospital set).
export default function HospitalDocuments() {
  return (
    <ThemeProvider name="v2">
      <ScreenHeader title="Documents" fallback="/hospital/profile" />
      <Screen center testID="hospital-documents">
        <Txt v="bodySm" tone="muted">
          HospiLink checks these before you can post duties. Keep them up to date when they renew.
        </Txt>
        <DocumentList slots={HOSPITAL_DOCS} />
      </Screen>
    </ThemeProvider>
  );
}
