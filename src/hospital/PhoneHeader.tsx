import { ScreenHeader } from '@/ds/Layout';

/** Header for hospital screens built on shared components: an app bar on phones, a page header in the portal. */
export default function PhoneHeader({ title, fallback }: { title: string; fallback: string }) {
  return <ScreenHeader title={title} fallback={fallback} />;
}
