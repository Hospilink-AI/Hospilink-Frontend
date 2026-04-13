// import { Slot } from "expo-router";
// import { StyleSheet, useWindowDimensions, View } from "react-native";

// import BottomTab from "@/component/layout/BottomTab";
// import Header from "@/component/layout/Header";
// import Sidebar from "@/component/layout/SideBar";

// export default function Layout() {
//   const { width } = useWindowDimensions();
//   const isMobile = width < 768;

//   return (
//     <View style={{ flex: 1 }}>
//       <Header />

//       <View style={styles.main}>
//         {!isMobile && <Sidebar />}

//         <View style={{ flex: 1 }}>
//           <Slot />
//         </View>
//       </View>

//       {isMobile && <BottomTab />}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   main: {
//     flex: 1,
//     flexDirection: "row",
//   },
// });

// Commented by me .............................................................


import BottomTab from "@/component/layout/BottomTab";
import Header from "@/component/layout/Header";
import Sidebar from "@/component/layout/SideBar";
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { dutyAPI } from '@/service/api';
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

interface ActiveDuty {
  _id: string;
  assignedTo: string;
  hospitalId: string;
  status: string;
}

export default function Layout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  useProtectedRoute('staff');

  const [activeDuty, setActiveDuty] = useState<ActiveDuty | null>(null);

  useEffect(() => {
    const fetchOngoing = async () => {
      try {
        const res = await dutyAPI.getOngoingDuties();
        const active = (res.data || []).find(
          (job: any) => job.status === 'enroute' || job.status === 'in-progress'
        );
        if (active) {
          setActiveDuty({
            _id: active._id,
            assignedTo: active.assignedTo,
            hospitalId: active.hospital?.user?._id ?? '',
            status: active.status,
          });
        }
      } catch (e) {
        console.warn('⚠️ [Layout] Failed to fetch ongoing duties:', e);
      }
    };
    fetchOngoing();
  }, []);

  useLocationTracker({
    dutyId: activeDuty?._id ?? '',
    staffId: activeDuty?.assignedTo ?? '',
    hospitalId: activeDuty?.hospitalId ?? '',
    active: !!activeDuty && (activeDuty.status === 'enroute' || activeDuty.status === 'in-progress'),
  });

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