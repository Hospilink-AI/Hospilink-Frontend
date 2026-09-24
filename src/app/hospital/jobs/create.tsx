import { COLORS } from "@/constant/colors";
import { JOB_ROLES, apiError } from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

type FormState = {
  title: string;
  specialty: string;
  experience: string;
  education: string;
  skills: string;
  salary: string;
  location: string;
  description: string;
};

const EMPTY: FormState = {
  title: "",
  specialty: "",
  experience: "",
  education: "",
  skills: "",
  salary: "",
  location: "",
  description: "",
};

const DESCRIPTION_MAX = 3000;

const toSkills = (text: string) =>
  text.split(",").map((s) => s.trim()).filter(Boolean);

export default function CreateVacancy() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [useHospitalAddress, setUseHospitalAddress] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await jobAPI.getVacancy(id);
        const v = res.vacancy;
        const loaded: FormState = {
          title: v.title ?? "",
          specialty: v.specialty ?? "",
          experience: v.experience ?? "",
          education: v.education ?? "",
          skills: (v.skills ?? []).join(", "),
          salary: v.salary ?? "",
          location: v.location ?? "",
          description: v.description ?? "",
        };
        setForm(loaded);
        setOriginal(loaded);
        setUseHospitalAddress(false);
      } catch (err: any) {
        setSubmitError(apiError(err, "Could not load this vacancy."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Job title is required";
    if (!form.specialty) next.specialty = "Pick a specialty";
    if (!form.description.trim()) next.description = "Description is required";
    if (!useHospitalAddress && !form.location.trim() && !isEdit) next.location = "Enter a location or use your hospital's address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {
      title: form.title.trim(),
      specialty: form.specialty,
      description: form.description.trim(),
      skills: toSkills(form.skills),
    };
    if (form.experience.trim()) payload.experience = form.experience.trim();
    if (form.education.trim()) payload.education = form.education.trim();
    if (form.salary.trim()) payload.salary = form.salary.trim();
    // Left out entirely so the backend fills it from the hospital's address.
    if (!useHospitalAddress && form.location.trim()) payload.location = form.location.trim();
    return payload;
  };

  // Edit sends only what changed - the endpoint rejects an empty body.
  const buildEditPayload = () => {
    if (!original) return {};
    const full = buildPayload();
    const changed: Record<string, any> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (form[key].trim() === original[key].trim()) return;
      changed[key] = key === "skills" ? toSkills(form.skills) : full[key] ?? form[key].trim();
    });
    return changed;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit) {
        const payload = buildEditPayload();
        if (Object.keys(payload).length === 0) {
          router.back();
          return;
        }
        await jobAPI.updateVacancy(id, payload);
        router.back();
      } else {
        const res = await jobAPI.createVacancy(buildPayload());
        router.replace(`/hospital/jobs/${res.vacancy._id}` as any);
      }
    } catch (err: any) {
      setSubmitError(apiError(err, isEdit ? "Could not save changes." : "Could not create the vacancy."));
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof FormState,
    label: string,
    placeholder: string,
    opts: { required?: boolean; multiline?: boolean; maxLength?: number } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {opts.required && <Text style={{ color: COLORS.red }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, opts.multiline && styles.textArea, errors[key] && styles.inputError]}
        value={form[key]}
        onChangeText={set(key)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={opts.multiline}
        maxLength={opts.maxLength}
      />
      {!!errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to job posting</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEdit ? "Edit Vacancy" : "Create Vacancy"}</Text>
      <Text style={styles.subtitle}>
        Define the role and requirements to find the right healthcare professional.
      </Text>

      <View style={styles.card}>
        <View style={[styles.grid, isMobile && styles.gridMobile]}>
          {field("title", "Job Title", "e.g. Senior Emergency Nurse", { required: true, maxLength: 200 })}

          <View style={styles.field}>
            <Text style={styles.label}>
              Specialty<Text style={{ color: COLORS.red }}> *</Text>
            </Text>
            <Dropdown
              style={[styles.input, errors.specialty && styles.inputError]}
              placeholderStyle={styles.placeholder}
              selectedTextStyle={styles.dropdownText}
              inputSearchStyle={styles.dropdownText}
              data={JOB_ROLES}
              search
              searchPlaceholder="Search specialty"
              labelField="label"
              valueField="value"
              placeholder="Select specialty"
              value={form.specialty}
              onChange={(item) => set("specialty")(item.value)}
            />
            {!!errors.specialty && <Text style={styles.errorText}>{errors.specialty}</Text>}
          </View>

          {field("experience", "Experience", "e.g. 3+ years", { maxLength: 50 })}
          {field("education", "Education", "e.g. B.Sc Nursing, MBBS", { maxLength: 200 })}
          {field("skills", "Skills", "Separate with commas, e.g. Triage, ACLS")}
          {field("salary", "Salary", "e.g. ₹30,000 – ₹40,000 per month", { maxLength: 100 })}
        </View>

        <View style={styles.addressRow}>
          <Switch
            value={useHospitalAddress}
            onValueChange={setUseHospitalAddress}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
          />
          <Text style={styles.addressText}>Use my hospital's address as the job location</Text>
        </View>
        {!useHospitalAddress && field("location", "Location", "e.g. Kothrud, Pune", { maxLength: 200 })}

        {field("description", "Description", "Describe the role, shifts and responsibilities", {
          required: true,
          multiline: true,
          maxLength: DESCRIPTION_MAX,
        })}
        <Text style={styles.counter}>
          {form.description.length} / {DESCRIPTION_MAX}
        </Text>
      </View>

      {!!submitError && <Text style={[styles.errorText, styles.submitError]}>{submitError}</Text>}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isMobile && { flex: 1 }, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isEdit ? "Save Changes" : "Create Vacancy"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 24 },
  gridMobile: { flexDirection: "column" },
  field: { flexGrow: 1, flexBasis: "45%", minWidth: 240, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: { height: 120, paddingTop: 10, textAlignVertical: "top" },
  inputError: { borderColor: COLORS.red },
  placeholder: { fontSize: 13, color: "#9CA3AF" },
  dropdownText: { fontSize: 13, color: COLORS.text },
  errorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },
  submitError: { fontSize: 13, marginTop: 12 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  addressText: { fontSize: 13, color: COLORS.text, flex: 1 },
  counter: { fontSize: 11, color: COLORS.subText, textAlign: "right", marginTop: -8 },
  footer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 160,
  },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
