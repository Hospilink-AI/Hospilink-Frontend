import { ScreenHeader, Screen } from '@/ds/Layout';
import Txt from '@/ds/Txt';
import { useDoctor } from '@/doctor/DoctorContext';
import DocumentList from '@/doctor/components/DocumentList';

export default function Documents() {
  const { refreshVerify } = useDoctor();
  return (
    <>
      <ScreenHeader title="Documents" fallback="/medicalStaff/profile" />
      <Screen testID="doctor-documents">
        <Txt v="bodySm" tone="muted">
          We check these once, before your first duty. Keep your licence up to date here when it renews.
        </Txt>
        <DocumentList onChange={refreshVerify} />
      </Screen>
    </>
  );
}
