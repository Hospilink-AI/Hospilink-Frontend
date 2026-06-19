import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { profileAPI } from "@/service/api";

export default function Index() {
  const router = useRouter();
  const { isLoading, token, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace(Platform.OS === "web" ? "/auth/home" : "/auth/role-choice");
      return;
    }

    const role = user.role;

    if (!user.isEmailVerified) {
      router.replace({
        pathname: "/auth/verify-otp",
        params: {
          email: user.email ?? "",
          accountType: role === "staff" ? "medical" : "hospital",
        },
      });
      return;
    }

    const resolveDashboard = async () => {
      let profileComplete = false;
      let documentsUploaded = false;

      try {
        const profileRes = await profileAPI.getMyProfile();
        profileComplete = profileRes?.isProfileComplete ?? profileRes?.profile?.isProfileComplete ?? false;
        documentsUploaded = profileRes?.isDocumentsUploaded ?? profileRes?.profile?.isDocumentsUploaded ?? false;
      } catch (e) {
        // Token may be invalid/expired — the api interceptor already clears storage
        // and (on web) redirects to login. On native, fall back to role-choice.
        if (Platform.OS !== "web") {
          router.replace("/auth/role-choice");
        }
        return;
      }

      if (role === "staff") {
        if (!profileComplete) router.replace("/profile/medical-staff");
        else if (!documentsUploaded) router.replace("/profile/document-upload");
        else router.replace("/medicalStaff/dashboard");
      } else if (role === "hospital") {
        if (!profileComplete) router.replace("/profile/hospital");
        else if (!documentsUploaded) router.replace("/profile/upload-document");
        else router.replace("/hospital/dashboard");
      } else if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/profile/medical-staff");
      }
    };

    resolveDashboard();
  }, [isLoading, token, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#dce6f5" }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
