import BottomTab from "@/component/layout/BottomTab";
import Header from "@/component/layout/Header";
import Sidebar from "@/component/layout/SideBar";
import { Slot } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function Layout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  useProtectedRoute('admin');

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.main}>
        {!isMobile && <Sidebar />}
        <View style={styles.content}>
          <Slot />
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