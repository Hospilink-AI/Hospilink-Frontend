import { PermanentVacancy } from '@/component/cards/jobs/PermanentVacancyCard';
import { ApplicationStatus } from '@/constant/jobs';
import { jobAPI } from '@/service/api';
import { useCallback, useEffect, useState } from 'react';

// Hospital-posted vacancies for the staff Vacancies screen, plus the user's
// latest application status per vacancy so cards can show "Applied" etc.
export function usePermanentVacancies() {
    const [vacancies, setVacancies] = useState<PermanentVacancy[]>([]);
    const [statusByVacancy, setStatusByVacancy] = useState<Record<string, ApplicationStatus>>({});
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const [list, mine] = await Promise.all([
                jobAPI.getVacancies({ page: 1, limit: 50 }),
                jobAPI.getMyApplications({ page: 1, limit: 50 }).catch(() => null),
            ]);
            setVacancies(list?.data ?? []);

            // Newest first, so the first row per vacancy is the latest one.
            // Rejected/withdrawn are skipped - the backend allows applying again.
            const map: Record<string, ApplicationStatus> = {};
            (mine?.data ?? []).forEach((a: any) => {
                const id = a.vacancy?._id ?? a.vacancy;
                if (!id || map[id] || a.status === 'rejected' || a.status === 'withdrawn') return;
                map[id] = a.status;
            });
            setStatusByVacancy(map);
        } catch {
            // Agent jobs still render on their own if this fails.
            setVacancies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return { vacancies, statusByVacancy, loading, reload };
}

export const matchesSearch = (v: PermanentVacancy, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [v.title, v.hospitalName, v.location, v.specialty.replace(/_/g, ' ')]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
};
