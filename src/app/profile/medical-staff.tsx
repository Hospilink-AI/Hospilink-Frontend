import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { JOB_ROLES } from "@/constant/jobs";
import { useAuth } from "@/context/AuthContext";
import { profileAPI } from "@/service/api";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import Icon from "@/ds/Icon";
import OtpInput from "@/ds/OtpInput";
import { Notice } from "@/ds/States";
import { Card } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import { color } from "@/ds/tokens";
import {
  Address,
  AddressFields,
  cleanEducation,
  Education,
  EducationEditor,
  educationError,
  EXPERIENCE_OPTIONS,
  SelectField,
  SkillsEditor,
} from "@/doctor/forms";
import { apiMessage } from "@/doctor/format";

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return d.startsWith("91") && d.length === 12 ? `+${d}` : `+91${d}`;
};

function Locked({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.locked}>
      <Icon name={icon} size={20} color={color.inkMuted} />
      <View style={{ flex: 1 }}>
        <Txt v="caption" tone="muted">
          {label}
        </Txt>
        <Txt v="title" numberOfLines={1}>
          {value || "—"}
        </Txt>
      </View>
      <Icon name="lock" size={16} color={color.inkFaint} />
    </View>
  );
}

function PhoneVerify({ phone, setPhone, verified, setVerified, error }: { phone: string; setPhone: (p: string) => void; verified: boolean; setVerified: (v: boolean) => void; error?: string }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async () => {
    if (phone.replace(/\D/g, "").length !== 10) {
      setMsg("Enter your 10-digit mobile number.");
      return;
    }
    setBusy("send");
    setMsg(null);
    try {
      await profileAPI.sendPhoneOTP(formatPhone(phone));
      setSent(true);
      setCode("");
      setState("idle");
      setWait(45);
    } catch (e) {
      setMsg(apiMessage(e, "The code wasn't sent. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const verify = async (v = code) => {
    if (v.length !== 6) return;
    setBusy("verify");
    setMsg(null);
    try {
      const r = await profileAPI.verifyPhoneOTP(formatPhone(phone), v);
      if (r?.success === false) throw { response: { data: r } };
      setVerified(true);
      setState("success");
    } catch (e) {
      setState("error");
      setMsg(apiMessage(e, "That code didn't work."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Mobile number"
        prefix="+91"
        value={phone}
        onChangeText={(t) => {
          setPhone(t.replace(/\D/g, "").slice(0, 10));
          if (verified || sent) {
            setVerified(false);
            setSent(false);
          }
        }}
        keyboardType="phone-pad"
        autoComplete="tel"
        error={error}
        success={verified}
        hint={verified ? "Verified" : "Hospitals call this number about your duties. We'll text you a code."}
        right={
          !verified ? (
            <View style={styles.prefixWrap}>
              <Button label={sent ? (wait > 0 ? `0:${String(wait).padStart(2, "0")}` : "Resend") : "Send code"} size="sm" variant="tonal" onPress={send} loading={busy === "send"} disabled={sent && wait > 0} />
            </View>
          ) : undefined
        }
      />
      {sent && !verified ? (
        <View style={{ gap: 8 }}>
          <Txt v="label" tone="soft" align="center">
            Enter the code we texted to +91 {phone}
          </Txt>
          <OtpInput value={code} onChange={(v) => { setCode(v); if (state !== "idle") setState("idle"); }} onComplete={verify} state={state} autoFocus label="Phone code" />
          <Button label="Verify number" onPress={() => verify()} loading={busy === "verify"} disabled={code.length !== 6} variant="secondary" full />
        </View>
      ) : null}
      {msg ? <Notice tone="danger" body={msg} /> : null}
    </View>
  );
}

export default function DoctorProfileWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ prefillName?: string; prefillEmail?: string; signupName?: string; email?: string }>();
  const name = params.prefillName || params.signupName || user?.name || "";
  const email = params.prefillEmail || params.email || user?.email || "";

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [phoneOk, setPhoneOk] = useState(false);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [address, setAddress] = useState<Address>({ currentAddress: "", city: "", state: "", pincode: "" });
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checkStep = (n: number) => {
    const e: Record<string, string> = {};
    if (n === 1) {
      if (!phoneOk) e.phone = "Verify your mobile number to continue.";
      if (!role) e.role = "Choose your role.";
      if (!experience) e.experience = "Choose your experience.";
    }
    if (n === 2) {
      if (!address.currentAddress.trim()) e.currentAddress = "Enter your address.";
      if (!address.city.trim()) e.city = "Enter your city.";
      if (!address.state) e.state = "Choose your state.";
      if (!/^[1-9]\d{5}$/.test(address.pincode)) e.pincode = "Enter a 6-digit pincode.";
    }
    if (n === 3) {
      const ed = educationError(education);
      if (ed) e.education = ed;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!checkStep(3)) return;
    setSaving(true);
    setGeneral(null);
    try {
      const ed = cleanEducation(education);
      await profileAPI.createMedicalStaffProfile({
        fullName: name.trim(),
        email: email.trim(),
        phoneNumber: formatPhone(phone),
        jobRole: role,
        experience,
        currentAddress: address.currentAddress.trim(),
        city: address.city.trim(),
        state: address.state,
        pincode: address.pincode,
        ...(summary.trim() ? { profileSummary: summary.trim() } : {}),
        ...(ed.length ? { education: ed } : {}),
        ...(skills.length ? { skills } : {}),
      });
      router.replace("/profile/ready" as any);
    } catch (e: any) {
      const m = apiMessage(e, "Your profile wasn't saved. Try again.");
      // a profile made earlier: carry on to the next step
      if (e?.response?.status === 409 && /already exists/i.test(m)) router.replace("/profile/ready" as any);
      else setGeneral(m);
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!checkStep(step)) return;
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const titles = [
    { t: "Let's set up your profile", s: "Hospitals see this when they look at who's coming. Three short steps." },
    { t: "Where do you live?", s: "Duty offers start from hospitals near this address when the app is closed." },
    { t: "Qualifications and skills", s: "Optional now. They help when you apply for permanent vacancies." },
  ][step - 1];

  return (
    <AuthLayout
      back={step > 1 ? () => setStep(step - 1) : () => router.replace("/auth/role-choice")}
      step={{ at: step, of: 3 }}
      title={titles.t}
      subtitle={titles.s}
      testID="profile-wizard"
      footer={
        <View style={{ gap: 8 }}>
          <Button label={step < 3 ? "Continue" : "Save profile"} onPress={next} loading={saving} full size="lg" iconRight={step < 3 ? "forward" : undefined} />
          {step === 3 && !education.length && !skills.length ? (
            <Txt v="caption" tone="muted" align="center">
              You can add these later from your profile.
            </Txt>
          ) : null}
        </View>
      }
    >
      {general ? <Notice tone="danger" body={general} /> : null}

      {step === 1 ? (
        <>
          <Card tone="flat" pad={6}>
            <Locked label="Name" value={name} icon="profile" />
            <Locked label="Email" value={email} icon="mail" />
          </Card>
          <PhoneVerify phone={phone} setPhone={setPhone} verified={phoneOk} setVerified={setPhoneOk} error={phoneOk ? undefined : errors.phone} />
          <SelectField label="Your role" value={role} options={JOB_ROLES} onChange={setRole} error={errors.role} icon="role" placeholder="Choose your role" />
          <SelectField
            label="Experience"
            value={experience}
            options={EXPERIENCE_OPTIONS.map((x) => ({ label: x, value: x }))}
            onChange={setExperience}
            error={errors.experience}
            icon="time"
            placeholder="How many years?"
          />
        </>
      ) : step === 2 ? (
        <AddressFields value={address} onChange={setAddress} errors={errors as any} />
      ) : (
        <>
          {errors.education ? <Notice tone="danger" body={errors.education} /> : null}
          <Txt v="h3">Qualifications</Txt>
          <EducationEditor items={education} onChange={setEducation} />
          <Txt v="h3" style={{ marginTop: 8 }}>Skills</Txt>
          <SkillsEditor skills={skills} onChange={setSkills} />
          <Field label="Short summary" optional value={summary} onChangeText={setSummary} multiline maxLength={500} placeholder="A line or two about your experience" />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  locked: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  prefixWrap: { marginRight: -6 },
});
