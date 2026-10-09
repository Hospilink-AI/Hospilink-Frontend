import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { profileAPI } from "@/service/api";
import AuthLayout, { HOSPITAL_POINTS } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";
import { Card } from "@/ds/Surface";
import { Chip } from "@/ds/Tag";
import Txt from "@/ds/Txt";
import { Address, AddressFields, formatPhone, Locked, PhoneVerify, SelectField } from "@/doctor/forms";
import { apiMessage } from "@/doctor/format";
import { HOSPITAL_SERVICES, STAFF_COUNT_OPTIONS } from "@/hospital/onboarding";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Hospital sign-up, after the email code: details, address, services. Documents come next.
export default function HospitalProfileWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const email = one(params.prefillEmail as any) || one(params.email as any) || user?.email || "";

  const [step, setStep] = useState(1);
  const [name, setName] = useState(one(params.prefillName as any) || one(params.signupName as any) || user?.name || "");
  const [phone, setPhone] = useState("");
  const [phoneOk, setPhoneOk] = useState(false);
  const [staffCount, setStaffCount] = useState("");
  const [address, setAddress] = useState<Address>({ currentAddress: "", city: "", state: "", pincode: "" });
  const [services, setServices] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checkStep = (n: number) => {
    const e: Record<string, string> = {};
    if (n === 1) {
      if (!name.trim()) e.name = "Enter the hospital's registered name.";
      if (!phoneOk) e.phone = "Verify the hospital's mobile number to continue.";
      if (!staffCount) e.staffCount = "Choose how many staff you have.";
    }
    if (n === 2) {
      if (!address.currentAddress.trim()) e.currentAddress = "Enter the hospital's address.";
      if (!address.city.trim()) e.city = "Enter the city.";
      if (!address.state) e.state = "Choose the state.";
      if (!/^[1-9]\d{5}$/.test(address.pincode)) e.pincode = "Enter a 6-digit pincode.";
    }
    if (n === 3 && !services.length) e.services = "Choose at least one service.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!checkStep(3)) return;
    setSaving(true);
    setGeneral(null);
    try {
      await profileAPI.createHospitalProfile({
        hospitalLegalName: name.trim(),
        email: email.trim(),
        phoneNumber: formatPhone(phone),
        // the full line, as sign-up has always sent it (the server finds the hospital from it)
        currentAddress: [address.currentAddress.trim(), address.city.trim(), address.state].filter(Boolean).join(", "),
        city: address.city.trim(),
        state: address.state,
        pincode: address.pincode,
        servicesAvailable: services,
        staffCount,
        description: about.trim(),
      });
      router.replace("/profile/upload-document" as any);
    } catch (e: any) {
      const m = apiMessage(e, "Your hospital's details weren't saved. Try again.");
      // a profile made earlier: carry on to documents
      if (e?.response?.status === 409 && /already exists/i.test(m)) router.replace("/profile/upload-document" as any);
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
    { t: "Tell us about your hospital", s: "Staff see these details on every duty you post." },
    { t: "Where is the hospital?", s: "Duties go to staff near this address, and staff check in here when a duty starts." },
    { t: "What does it offer?", s: "Pick every department that's running. You can change these later." },
  ][step - 1];

  return (
    <AuthLayout
      back={step > 1 ? () => setStep(step - 1) : () => router.replace({ pathname: "/auth/welcome-choice", params: { email, signupName: name, accountType: "hospital" } })}
      step={{ at: step, of: 4 }}
      title={titles.t}
      subtitle={titles.s}
      points={HOSPITAL_POINTS}
      testID="hospital-wizard"
      footer={<Button label={step < 3 ? "Continue" : "Save and add documents"} onPress={next} loading={saving} full size="lg" iconRight="forward" />}
    >
      {general ? <Notice tone="danger" body={general} /> : null}

      {step === 1 ? (
        <>
          <Card tone="flat" pad={6}>
            <Locked label="Account email" value={email} icon="mail" />
          </Card>
          <Field
            label="Registered hospital name"
            hint="As it appears on your registration and GST certificates."
            icon="hospital"
            value={name}
            onChangeText={setName}
            error={errors.name}
            maxLength={150}
            autoComplete="organization"
          />
          <PhoneVerify
            phone={phone}
            setPhone={setPhone}
            verified={phoneOk}
            setVerified={setPhoneOk}
            error={phoneOk ? undefined : errors.phone}
            label="Hospital mobile number"
            hint="A number someone at the hospital answers. We'll text it a code."
          />
          <SelectField label="Staff at the hospital" value={staffCount} options={STAFF_COUNT_OPTIONS} onChange={setStaffCount} error={errors.staffCount} icon="users" placeholder="How many staff?" />
        </>
      ) : step === 2 ? (
        <AddressFields value={address} onChange={setAddress} errors={errors as any} place="hospital" />
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <View style={styles.servicesHead}>
              <Txt v="h3">Services</Txt>
              <Txt v="label" tone={services.length ? "primary" : "muted"} style={{ fontVariant: ["tabular-nums"] }}>
                {services.length} chosen
              </Txt>
            </View>
            {errors.services ? <Notice tone="danger" body={errors.services} /> : null}
            <View style={styles.chips} accessibilityRole="list">
              {HOSPITAL_SERVICES.map((s) => (
                <Chip key={s} label={s} selected={services.includes(s)} onPress={() => setServices((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))} />
              ))}
            </View>
          </View>
          <Field
            label="About the hospital"
            optional
            value={about}
            onChangeText={setAbout}
            multiline
            maxLength={1000}
            placeholder="Beds, specialities, what staff should know before a duty"
          />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  servicesHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
