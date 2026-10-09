import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { JOB_ROLES } from "@/constant/jobs";
import { useAuth } from "@/context/AuthContext";
import { profileAPI } from "@/service/api";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";
import { Card } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import {
  Address,
  AddressFields,
  cleanEducation,
  Education,
  EducationEditor,
  educationError,
  EXPERIENCE_OPTIONS,
  formatPhone,
  Locked,
  PhoneVerify,
  SelectField,
  SkillsEditor,
} from "@/doctor/forms";
import { apiMessage } from "@/doctor/format";

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

