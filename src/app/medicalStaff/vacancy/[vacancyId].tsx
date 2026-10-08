import { ApplicationStatus, STAFF_STATUS_LABELS, TERMINAL_STATUSES, apiError, roleLabel } from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import Button from "@/ds/Button";
import { ActionBar, ListRow, Screen, ScreenHeader } from "@/ds/Layout";
import { CardSkeleton, EmptyState, Notice, Skeleton } from "@/ds/States";
import { Card } from "@/ds/Surface";
import { Meta, Tag } from "@/ds/Tag";
import Txt from "@/ds/Txt";
import { APP_TONE } from "@/doctor/components/VacancyCards";
import { dateOf, salaryText } from "@/doctor/format";

type Gate = { message: string; action: "profile" | "resume" } | null;

export default function StaffVacancyDetail() {
  const router = useRouter();
  const { vacancyId } = useLocalSearchParams<{ vacancyId: string }>();

  const [vacancy, setVacancy] = useState<any>(null);
  const [existing, setExisting] = useState<{ id: string; status: ApplicationStatus } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, mine] = await Promise.all([jobAPI.getVacancy(vacancyId), jobAPI.getMyApplications({ page: 1, limit: 50 }).catch(() => null)]);
      setVacancy(v.vacancy);
      const active = (mine?.data ?? []).find(
        (a: any) => (a.vacancy?._id ?? a.vacancy) === vacancyId && (!TERMINAL_STATUSES.includes(a.status) || a.status === "hired")
      );
      setExisting(active ? { id: active._id, status: active.status } : null);
    } catch (err: any) {
      setError(err?.response?.status === 404 ? "This vacancy is no longer open." : apiError(err, "Could not load this vacancy."));
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    setGate(null);
    try {
      const res = await jobAPI.apply(vacancyId);
      router.replace(`/medicalStaff/applications/${res.application._id}` as any);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = apiError(err, "Could not submit your application.");
      if (status === 422) {
        const code = err?.response?.data?.code;
        const isResume = code ? code === "RESUME_REQUIRED_FOR_APPLICATION" : /resume/i.test(message);
        setGate({ message, action: isResume ? "resume" : "profile" });
      } else if (status === 409) {
        setApplyError(message);
        load();
      } else {
        setApplyError(message);
      }
    } finally {
      setApplying(false);
    }
  };

  const header = <ScreenHeader title="Vacancy" subtitle={vacancy?.hospitalName} fallback="/medicalStaff/vacancies" />;

  if (loading && !vacancy) {
    return (
      <>
        {header}
        <Screen>
          <Skeleton height={28} width="70%" />
          <CardSkeleton />
        </Screen>
      </>
    );
  }

  if (error || !vacancy) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState icon="vacancies" title={error ?? "Vacancy not found."} action="Back to vacancies" onAction={() => router.replace("/medicalStaff/vacancies" as any)} />
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <Screen
        footer={
          <ActionBar>
            {existing ? (
              <Button label="View application" variant="secondary" full size="lg" onPress={() => router.push(`/medicalStaff/applications/${existing.id}` as any)} />
            ) : (
              <>
                <Button label="Apply" onPress={handleApply} loading={applying} full size="lg" />
                <Txt v="caption" tone="muted" align="center">
                  {applying ? "Sending your application. This can take a few seconds." : "We'll send the resume already on your profile."}
                </Txt>
              </>
            )}
          </ActionBar>
        }
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Tag label={roleLabel(vacancy.specialty)} tone="neutral" icon="role" />
            {existing ? <Tag label={STAFF_STATUS_LABELS[existing.status]} tone={APP_TONE[existing.status]} icon={null} /> : null}
          </View>
          <Txt v="h1">{vacancy.title}</Txt>
          <Txt v="bodySm" tone="muted">
            Posted {dateOf(vacancy.createdAt)}
          </Txt>
        </View>

        {applyError ? <Notice tone="danger" body={applyError} /> : null}
        {gate ? (
          <Notice tone="warning" title={gate.action === "resume" ? "Add your resume first" : "Finish your profile first"} body={gate.message}>
            <Button
              label={gate.action === "resume" ? "Upload Resume" : "Complete Profile"}
              size="sm"
              variant="dark"
              iconRight="forward"
              onPress={() => router.push((gate.action === "resume" ? "/medicalStaff/documents" : "/medicalStaff/edit-profile") as any)}
              style={{ marginTop: 8 }}
            />
          </Notice>
        ) : null}

        <Card>
          <View style={{ gap: 12 }}>
            {vacancy.salary ? <Meta icon="rupee" text={salaryText(vacancy.salary)} tone="ink" /> : null}
            {vacancy.experience ? <Meta icon="role" text={vacancy.experience} /> : null}
            {vacancy.education ? <Meta icon="education" text={vacancy.education} /> : null}
            {vacancy.location ? <Meta icon="nearby" text={vacancy.location} /> : null}
          </View>
        </Card>

        {vacancy.description ? (
          <Card>
            <View style={{ gap: 8 }}>
              <Txt v="overline" tone="muted">About the role</Txt>
              <Txt v="body" tone="soft">{vacancy.description}</Txt>
            </View>
          </Card>
        ) : null}

        {vacancy.skills?.length ? (
          <Card>
            <View style={{ gap: 10 }}>
              <Txt v="overline" tone="muted">Skills they're looking for</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {vacancy.skills.map((s: string) => (
                  <Tag key={s} label={s} tone="info" icon={null} />
                ))}
              </View>
            </View>
          </Card>
        ) : null}

        <Card>
          <View style={{ gap: 4 }}>
            <Txt v="overline" tone="muted" style={{ marginBottom: 4 }}>About the hospital</Txt>
            <ListRow icon="hospital" title={vacancy.hospitalName || "Hospital"} subtitle={vacancy.location} chevron={false} />
          </View>
        </Card>
      </Screen>
    </>
  );
}
