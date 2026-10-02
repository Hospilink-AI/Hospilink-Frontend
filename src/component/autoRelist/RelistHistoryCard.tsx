import AutoRelistCard from "@/component/autoRelist/AutoRelistCard";
import { AUTO_RELIST_ENABLED } from "@/constant/autoRelist";
import { autoRelistAPI } from "@/service/api";
import React, { useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";

// Admin: re-post history for one duty. Tech Support only gets it with an open ticket about the duty.
export default function RelistHistoryCard({
  dutyId,
  ticketId,
  style,
}: {
  dutyId?: string | null;
  ticketId?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!AUTO_RELIST_ENABLED || !dutyId) return;
    let active = true;
    autoRelistAPI
      .getDutyHistory(dutyId, ticketId)
      .then((res: any) => active && setData(res))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, [dutyId, ticketId]);

  if (!data || !(data.relistCount > 0)) return null;

  const duty = {
    _id: data.dutyId ?? dutyId,
    autoRelist: { relistCount: data.relistCount, rateBoostApplied: data.rateBoostApplied, history: data.history ?? [] },
  };
  return <AutoRelistCard duty={duty} viewer="readonly" style={style} />;
}
