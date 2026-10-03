import { KpiInfo, SectionData, SectionInfo } from "@/constant/analytics";
import { apiError } from "@/constant/jobs";
import { analyticsAPI } from "@/service/api";
import { useCallback, useEffect, useState } from "react";

// Sections the backend builds today; used if the catalogue can't be loaded
export const FALLBACK_SECTIONS: SectionInfo[] = [
  { key: "overview", label: "Overview", availability: "available" },
  { key: "marketplace", label: "Marketplace health", availability: "available" },
  { key: "execution", label: "Duty execution", availability: "available" },
  { key: "money", label: "Money", availability: "available" },
];

let catalogueCache: { sections: SectionInfo[]; kpis: KpiInfo[] } | null = null;

export function useCatalogue(enabled: boolean) {
  const [catalogue, setCatalogue] = useState(catalogueCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || catalogueCache) return;
    analyticsAPI
      .getCatalogue()
      .then((res: any) => {
        catalogueCache = { sections: res?.sections ?? [], kpis: res?.kpis ?? [] };
        setCatalogue(catalogueCache);
      })
      .catch((err: any) => setError(apiError(err, "Couldn't load the KPI list.")));
  }, [enabled]);

  return { catalogue, error };
}

// The server caches sections for about 5 minutes; so does this, per query
const SECTION_TTL_MS = 5 * 60 * 1000;
const sectionCache = new Map<string, { at: number; data: SectionData }>();

export function useSection(section: string | null, params: Record<string, string | undefined>, enabled: boolean) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>;
  const key = section ? `${section}?${new URLSearchParams(clean).toString()}` : "";
  const cached = sectionCache.get(key);
  const [data, setData] = useState<SectionData | null>(cached && Date.now() - cached.at < SECTION_TTL_MS ? cached.data : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!section) return;
      const hit = sectionCache.get(key);
      if (!force && hit && Date.now() - hit.at < SECTION_TTL_MS) {
        setData(hit.data);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsAPI.getSection(section, clean);
        sectionCache.set(key, { at: Date.now(), data: res });
        setData(res);
      } catch (err: any) {
        setError({ status: err?.response?.status, message: apiError(err, "Couldn't load analytics.") });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  useEffect(() => {
    if (enabled) load(false);
  }, [load, enabled]);

  return { data: data?.section === section ? data : null, loading, error, reload: () => load(true) };
}
