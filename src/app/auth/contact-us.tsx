import { useState } from "react";
import { Linking, View } from "react-native";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { ListRow } from "@/ds/Layout";
import { Notice } from "@/ds/States";
import { Card, SectionHeader } from "@/ds/Surface";
import Txt from "@/ds/Txt";

const INFO = "info@hospilink.in";
const SUPPORT = "support@hospilink.in";
const PHONE = "+91 95290 11896";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public contact page. There is no enquiry endpoint, so the form writes the email for the visitor.
export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [noMailApp, setNoMailApp] = useState(false);

  const errors = {
    name: !name.trim() ? "Enter your name." : null,
    email: !email.trim() ? "Enter your email." : !EMAIL_RE.test(email.trim()) ? "Enter a valid email, like name@example.com." : null,
    message: message.trim().length < 10 ? "Write a few words about what you need." : null,
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : null);

  const send = async () => {
    setTried(true);
    if (errors.name || errors.email || errors.message) return;
    const subject = `Enquiry from ${name.trim()}${org.trim() ? `, ${org.trim()}` : ""}`;
    const body = `${message.trim()}\n\n${name.trim()}\n${email.trim()}${org.trim() ? `\n${org.trim()}` : ""}`;
    const url = `mailto:${INFO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNoMailApp(false);
    try {
      await Linking.openURL(url);
    } catch {
      setNoMailApp(true);
    }
  };

  return (
    <AuthLayout
      back
      title="Contact us"
      subtitle="We help hospitals and healthcare professionals with staffing. Write to us for support, questions or partnerships."
      testID="contact-us"
    >
      <Card pad={4}>
        <ListRow icon="mail" title="General enquiries" subtitle={INFO} onPress={() => Linking.openURL(`mailto:${INFO}`)} />
        <ListRow icon="support" title="Account and duty support" subtitle={SUPPORT} onPress={() => Linking.openURL(`mailto:${SUPPORT}`)} />
        <ListRow icon="phone" title="Phone" subtitle={PHONE} onPress={() => Linking.openURL(`tel:${PHONE.replace(/\s/g, "")}`)} />
        <ListRow icon="hospital" title="Hospilink Private Limited" subtitle="Mumbai, Maharashtra, India" />
      </Card>

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Send us a message" />
      </View>
      <Card>
        <View style={{ gap: 14 }}>
          <Field label="Name" value={name} onChangeText={setName} autoComplete="name" error={show("name")} testID="contact-name" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={show("email")}
            testID="contact-email"
          />
          <Field label="Hospital or organisation" optional value={org} onChangeText={setOrg} testID="contact-org" />
          <Field label="Message" value={message} onChangeText={setMessage} multiline error={show("message")} testID="contact-message" />
          {noMailApp ? <Notice tone="warning" body={`We couldn't open an email app on this device. Write to us at ${INFO}.`} /> : null}
          <Button label="Write email" icon="mail" onPress={send} full size="lg" testID="contact-send" />
          <Txt v="caption" tone="muted" align="center">
            This opens your email app with the message ready to send to {INFO}.
          </Txt>
        </View>
      </Card>

      <Notice tone="info" icon="help" body="Already using HospiLink? Signed-in users get faster help from Support in the app, with chat and tickets." />
    </AuthLayout>
  );
}
