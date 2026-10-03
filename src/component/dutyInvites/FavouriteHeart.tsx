import { DUTY_INVITES_ENABLED } from "@/constant/dutyInvites";
import { apiError } from "@/constant/jobs";
import { inviteAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from "react-native";

// Hospital only: add or remove a doctor from the hospital's favourites.
export default function FavouriteHeart({
  staffId,
  value,
  onChange,
  onError,
  size = 20,
  style,
}: {
  staffId: string;
  value: boolean;
  onChange?: (next: boolean) => void;
  onError?: (message: string) => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => setOn(value), [value]);

  if (!DUTY_INVITES_ENABLED || !staffId) return null;

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      if (next) await inviteAPI.addFavourite(staffId);
      else await inviteAPI.removeFavourite(staffId);
      onChange?.(next);
    } catch (err: any) {
      setOn(!next);
      onError?.(apiError(err, next ? "Couldn't add to favourites." : "Couldn't remove from favourites."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={(e: any) => {
        e?.stopPropagation?.();
        if (!busy) toggle();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={on ? "Remove from favourites" : "Add to favourites"}
      accessibilityState={{ checked: on }}
      style={style}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#E11D48" />
      ) : (
        <Ionicons name={on ? "heart" : "heart-outline"} size={size} color={on ? "#E11D48" : "#94A3B8"} />
      )}
    </Pressable>
  );
}
