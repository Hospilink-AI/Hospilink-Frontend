import { COLORS } from "@/constant/colors";
import { availabilityBadge, cardFromNearby, InviteCard, InviteGroups, MAX_INVITEES } from "@/constant/dutyInvites";
import { apiError, roleLabel } from "@/constant/jobs";
import { adminAPI, inviteAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import FavouriteHeart from "./FavouriteHeart";
import PersonActions from "@/component/safety/PersonActions";

export type PickerSource = { kind: "hospital" } | { kind: "admin"; hospitalId: string };

// Admins pick from the hospital's nearby doctors (the admin map endpoint), up to the widest ring
const ADMIN_RADIUS_KM = 75;

const GROUPS: { key: keyof InviteGroups; title: string; empty: string }[] = [
  { key: "favourites", title: "Favourites", empty: "No favourite doctors in this role yet. Tap the heart on a doctor to add one." },
  { key: "workedWithYou", title: "Worked with you", empty: "Nobody in this role has completed a duty with you yet." },
  { key: "nearby", title: "Nearby", empty: "No other verified doctors in this role nearby." },
];

export default function InvitePicker({
  visible,
  onClose,
  source,
  role,
  date,
  startTime,
  endTime,
  selected,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  source: PickerSource;
  role: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  selected: InviteCard[];
  onDone: (cards: InviteCard[]) => void;
}) {
  const [groups, setGroups] = useState<InviteGroups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<InviteCard[]>(selected);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const hospitalId = source.kind === "admin" ? source.hospitalId : null;

  useEffect(() => {
    if (!visible) return;
    setPicked(selected);
    setQuery("");
    setNote(null);
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (source.kind === "hospital") {
          const params: Record<string, string> = { role };
          if (date) params.date = date;
          if (startTime && endTime) {
            params.start_time = startTime;
            params.end_time = endTime;
          }
          const res = await inviteAPI.getCandidates(params);
          setGroups({ favourites: res?.favourites ?? [], workedWithYou: res?.workedWithYou ?? [], nearby: res?.nearby ?? [] });
        } else {
          const res = await adminAPI.getNearbyStaff(hospitalId, ADMIN_RADIUS_KM, role, date);
          const cards: InviteCard[] = (res?.data?.staff ?? []).map(cardFromNearby);
          setGroups({
            favourites: cards.filter((c) => c.isFavourite),
            workedWithYou: cards.filter((c) => !c.isFavourite && (c.dutiesWithYou ?? 0) > 0).sort((a, b) => (b.dutiesWithYou ?? 0) - (a.dutiesWithYou ?? 0)),
            nearby: cards.filter((c) => !c.isFavourite && !(c.dutiesWithYou ?? 0)),
          });
        }
      } catch (err: any) {
        setError(err?.response?.status === 404 ? "Inviting isn't available on this server yet." : apiError(err, "Couldn't load doctors."));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, role, date, startTime, endTime, hospitalId]);

  const q = query.trim().toLowerCase();
  const match = (c: InviteCard) => !q || c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
  const isPicked = (id: string) => picked.some((p) => p.staffId === id);

  const toggle = (c: InviteCard) => {
    setNote(null);
    if (isPicked(c.staffId)) setPicked((p) => p.filter((x) => x.staffId !== c.staffId));
    else if (picked.length >= MAX_INVITEES) setNote(`You can invite up to ${MAX_INVITEES} doctors.`);
    else setPicked((p) => [...p, c]);
  };

  // a heart tapped here moves the doctor between Favourites and the other groups next time; mark it now
  const setFavourite = (id: string, on: boolean) =>
    setGroups((g) =>
      g
        ? (Object.fromEntries(
            Object.entries(g).map(([k, list]) => [k, (list as InviteCard[]).map((c) => (c.staffId === id ? { ...c, isFavourite: on } : c))])
          ) as InviteGroups)
        : g
    );

  // a blocked doctor can't be invited: drop them from the lists and the picks
  const removeBlocked = (id: string) => {
    setPicked((p) => p.filter((x) => x.staffId !== id));
    setGroups((g) =>
      g
        ? (Object.fromEntries(Object.entries(g).map(([k, list]) => [k, (list as InviteCard[]).filter((c) => c.staffId !== id)])) as InviteGroups)
        : g
    );
  };

  const total = useMemo(() => (groups ? groups.favourites.length + groups.workedWithYou.length + groups.nearby.length : 0), [groups]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Invite doctors</Text>
              <Text style={s.sub}>
                {roleLabel(role)} · {picked.length} of {MAX_INVITEES} chosen
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={COLORS.subText} />
            </TouchableOpacity>
          </View>

          <View style={s.search}>
            <Ionicons name="search" size={15} color={COLORS.subText} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or city"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingBottom: 8, gap: 14 }}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : error ? (
              <Text style={s.error}>{error}</Text>
            ) : total === 0 ? (
              <Text style={s.muted}>No verified doctors in this role to invite yet.</Text>
            ) : (
              GROUPS.map((g) => {
                const list = (groups?.[g.key] ?? []).filter(match);
                return (
                  <View key={g.key} style={{ gap: 6 }}>
                    <Text style={s.groupTitle}>
                      {g.title} <Text style={s.groupCount}>{(groups?.[g.key] ?? []).length}</Text>
                    </Text>
                    {list.length === 0 ? (
                      <Text style={s.muted}>{q ? "No match." : g.empty}</Text>
                    ) : (
                      list.map((c) => (
                        <DoctorRow
                          key={`${g.key}-${c.staffId}`}
                          card={c}
                          on={isPicked(c.staffId)}
                          onPress={() => toggle(c)}
                          heart={source.kind === "hospital"}
                          onFavourite={(v) => setFavourite(c.staffId, v)}
                          onError={setNote}
                          onBlocked={source.kind === "hospital" ? removeBlocked : undefined}
                        />
                      ))
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {!!note && <Text style={s.note}>{note}</Text>}
          <View style={s.footer}>
            <TouchableOpacity style={s.secondary} onPress={() => setPicked([])} disabled={!picked.length}>
              <Text style={[s.secondaryText, !picked.length && { opacity: 0.4 }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.primary}
              onPress={() => {
                onDone(picked);
                onClose();
              }}
            >
              <Text style={s.primaryText}>{picked.length ? `Invite ${picked.length}` : "Done"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DoctorRow({
  card,
  on,
  onPress,
  heart,
  onFavourite,
  onError,
  onBlocked,
}: {
  card: InviteCard;
  on: boolean;
  onPress: () => void;
  heart?: boolean;
  onFavourite?: (v: boolean) => void;
  onError?: (m: string) => void;
  // hospitals only: adds Block / Report
  onBlocked?: (staffId: string) => void;
}) {
  const badge = availabilityBadge(card);
  const rating = typeof card.effectiveRating === "number" ? `★ ${card.effectiveRating.toFixed(1)}` : "Unrated";
  const meta = [
    card.city,
    card.experience !== undefined && card.experience !== null && card.experience !== "" ? `${card.experience} yrs` : null,
    typeof card.distanceKm === "number" ? `${card.distanceKm} km` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable style={[s.row, on && s.rowOn]} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={card.name}>
      <Ionicons name={on ? "checkbox" : "square-outline"} size={20} color={on ? COLORS.primary : "#94A3B8"} />
      {card.profilePicture ? (
        <Image source={{ uri: card.profilePicture }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.initials]}>
          <Text style={s.initialsText}>{(card.name || "?").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={s.name} numberOfLines={1}>
          {card.name}
        </Text>
        {!!meta && (
          <Text style={s.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
        <View style={s.badges}>
          <Text style={s.meta}>{rating}</Text>
          {(card.dutiesWithYou ?? 0) > 0 && <Text style={s.meta}>· {card.dutiesWithYou} with you</Text>}
          {!!badge && (
            <View style={[s.badge, { backgroundColor: badge.bg }]}>
              <Text style={[s.badgeText, { color: badge.fg }]}>{badge.label}</Text>
            </View>
          )}
          {card.hasClash && (
            <View style={[s.badge, { backgroundColor: "#FEF2F2" }]}>
              <Text style={[s.badgeText, { color: "#B91C1C" }]}>Booked at this time</Text>
            </View>
          )}
        </View>
      </View>
      {heart && <FavouriteHeart staffId={card.staffId} value={!!card.isFavourite} onChange={onFavourite} onError={onError} />}
      {onBlocked && <PersonActions kind="staff" id={card.staffId} name={card.name} onBlocked={() => onBlocked(card.staffId)} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    gap: 10,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: COLORS.text },
  groupTitle: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  groupCount: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  error: { fontSize: 13, color: COLORS.red, paddingVertical: 12 },
  note: { fontSize: 12, color: "#92400E" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10 },
  rowOn: { borderColor: COLORS.primary, backgroundColor: "#F8FBFF" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border },
  initials: { alignItems: "center", justifyContent: "center", backgroundColor: "#DBEAFE" },
  initialsText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.subText },
  badges: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  footer: { flexDirection: "row", gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  secondary: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  secondaryText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  primary: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
