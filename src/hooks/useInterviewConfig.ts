import { INTERVIEW_DEFAULTS, InterviewConfig } from '@/constant/jobs';
import { jobAPI } from '@/service/api';
import { useEffect, useState } from 'react';

let cached: InterviewConfig | null = null;

// Only takes the keys the screens use, and only if they are numbers.
const merge = (config: any): InterviewConfig => {
    const next = { ...INTERVIEW_DEFAULTS };
    (Object.keys(next) as (keyof InterviewConfig)[]).forEach((key) => {
        if (typeof config?.[key] === 'number') next[key] = config[key];
    });
    return next;
};

// Live interview rules from the server, falls back to INTERVIEW_DEFAULTS.
// Refetched on each mount so an admin change shows up on the next screen load.
export function useInterviewConfig(): InterviewConfig {
    const [config, setConfig] = useState<InterviewConfig>(cached ?? INTERVIEW_DEFAULTS);

    useEffect(() => {
        let active = true;
        jobAPI
            .getInterviewConfig()
            .then((res: any) => {
                cached = merge(res?.config);
                if (active) setConfig(cached);
            })
            .catch(() => {
                // keep the last known values
            });
        return () => {
            active = false;
        };
    }, []);

    return config;
}
