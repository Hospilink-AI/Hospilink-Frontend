import BottomTab from "@/component/layout/BottomTab";
import Header from "@/component/layout/Header";
import Sidebar from "@/component/layout/SideBar";
import { adminLandingRoute, adminRouteCapability } from "@/constant/adminCapabilities";
import { useCapability } from "@/hooks/useCapability";
import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function Layout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  useProtectedRoute('admin');

  // pages this admin role can't open go back to the role's landing page
  const router = useRouter();
  const pathname = usePathname();
  const { can, subRole } = useCapability();
  const needed = adminRouteCapability(pathname);
  const blocked = !!subRole && !!needed && !can(needed);
  useEffect(() => {
    if (blocked) router.replace(adminLandingRoute(subRole) as any);
  }, [blocked, subRole]);

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.main}>
        {!isMobile && <Sidebar />}
        <View style={styles.content}>
          {!blocked && <Slot />}
        </View>
      </View>
      {isMobile && <BottomTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  main: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
});