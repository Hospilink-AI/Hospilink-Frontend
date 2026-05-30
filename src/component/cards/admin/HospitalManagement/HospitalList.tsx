import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { adminAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type LicenseStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'AUTO_VERIFIED' | 'MANUAL_PENDING';
type DocStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'AUTO_VERIFIED' | 'MANUAL_PENDING';

interface HospitalDocument {
  id: string;
  title: string;
  docType: string;
  status: DocStatus;
  statusNote: string;
  icon: string;
  docNumber?: string;
  issuedBy?: string;
  issuedTo?: string;
  issuedDate?: string;
  expiryDate?: string;
  description?: string;
  pages?: number;
  fileSize?: string;
  url?: string;

}

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

interface Hospital {
  id: string;
  name: string;
  hospitalId: string;
  location: string;
  city: string;
  totalStaff: number;
  staffLabel: string;
  dutyPercent: number;
  dutyLabel: string;
  licenseStatus: LicenseStatus;
  verificationStatus: string;
  iconBg: string;
  iconEmoji: string;
  legalName: string;
  currentAddress: string;
  staffCount: string;
  totalDuties: number;
  occupiedDuties: number;
  documents: HospitalDocument[];
  servicesAvailable?: string[];
  profilePictureUrl: string | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────
const safeStr = (val: any, fallback = '—'): string =>
  val !== null && val !== undefined && String(val).trim() !== '' ? String(val) : fallback;

const parseStaff = (staff: string): number => {
  if (!staff || staff === '0') return 0;
  if (staff === '100+') return 100;
  if (staff.includes('-')) return parseInt(staff.split('-')[1]) || 0;
  return parseInt(staff) || 0;
};

const toLicenseStatus = (raw: string): LicenseStatus => {
  const s = (raw ?? '').toLowerCase().replace(/[_\s-]/g, '');
  if (s === 'verified') return 'VERIFIED';
  if (s === 'rejected') return 'REJECTED';
  if (s === 'autoverified') return 'AUTO_VERIFIED';
  if (s === 'manualpending' || s === 'manualpendingverification') return 'MANUAL_PENDING';
  return 'PENDING';
};

const formatDocType = (docType: string): string =>
  docType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const mapDoc = (d: any): HospitalDocument => {
  const rawDocStatus = safeStr(d?.status ?? d?.verificationStatus, 'pending').toLowerCase();
  const docStatus: DocStatus =
    rawDocStatus === 'verified' ? 'VERIFIED' :
      rawDocStatus === 'auto-verified' || rawDocStatus === 'autoverified' ? 'AUTO_VERIFIED' :
        rawDocStatus === 'rejected' ? 'REJECTED' :
          rawDocStatus === 'manual-pending-verification' || rawDocStatus === 'manualpending' ? 'MANUAL_PENDING' :
            'PENDING';

  return {
    id: safeStr(d?._id ?? d?.id, String(Math.random())),
    title: safeStr(d?.title ?? d?.documentType ?? d?.name, 'Document'),
    url: safeStr(d?.url ?? d?.fileUrl, ''),
    docType: safeStr(d?.documentType ?? d?.docType, 'unknown'),
    status: docStatus,
    statusNote: safeStr(
      d?.statusNote ?? d?.note,
      docStatus === 'VERIFIED' ? 'Document verified' :
        docStatus === 'AUTO_VERIFIED' ? 'Auto-verified by system' :
          docStatus === 'REJECTED' ? 'Document rejected' :
            docStatus === 'MANUAL_PENDING' ? 'Awaiting manual review' :
              'Awaiting review',
    ),
    icon: safeStr(d?.icon, '📄'),
    docNumber: safeStr(d?.documentNumber ?? d?.docNumber),
    issuedBy: safeStr(d?.issuedBy),
    issuedTo: safeStr(d?.issuedTo),
    issuedDate: safeStr(d?.issuedDate),
    expiryDate: safeStr(d?.expiryDate),
    description: safeStr(d?.description, ''),
    pages: Number(d?.pages) || 1,
    fileSize: safeStr(d?.fileSize),
  };
};

const mapHospital = (h: any): Hospital => {
  const rawStatus = safeStr(h?.verificationStatus, 'pending').toLowerCase();
  const licenseStatus = toLicenseStatus(rawStatus);
  const totalDuties = Number(h?.totalDuties) || 0;
  const occupiedDuties = Number(h?.occupiedDuties) || 0;
  const dutyPercent = totalDuties > 0 ? Math.round((occupiedDuties / totalDuties) * 100) : 0;
  const pic = h?.profilePicture;
  const profilePictureUrl =
    typeof pic === 'string' ? pic :          // direct URL string
      pic?.url ? pic.url :                     // object with url field
        pic?.s3Key ? `https://YOUR-BUCKET.s3.amazonaws.com/${pic.s3Key}` : // construct from s3Key
          null;

  return {
    id: safeStr(h?._id ?? h?.id, 'unknown'),
    name: safeStr(h?.hospitalLegalName ?? h?.user?.name, 'Unknown Hospital'),
    legalName: safeStr(h?.hospitalLegalName ?? h?.user?.name, 'Unknown Hospital'),
    hospitalId: `ID: ${safeStr(h?._id ?? h?.id, '------').slice(-6).toUpperCase()}`,
    // location: safeStr(h?.location),
    location: safeStr(h?.currentAddress ?? h?.location),
    // city: safeStr(h?.location, 'Unknown'),
    city: safeStr(h?.city ?? h?.location, 'Unknown'),
    currentAddress: safeStr(h?.currentAddress ?? h?.address),
    staffCount: safeStr(h?.staffCount, '0'),
    totalStaff: parseStaff(safeStr(h?.staffCount, '0')),
    staffLabel: 'Staff',
    dutyPercent,
    dutyLabel: `${occupiedDuties}/${totalDuties} Active`,
    licenseStatus,
    verificationStatus: rawStatus,
    iconBg: '#EEF2FF',
    iconEmoji: '🏥',
    totalDuties,
    occupiedDuties,
    documents: Array.isArray(h?.documents) ? h.documents.map(mapDoc) : [],
    profilePictureUrl,
  };
};

const mapHospitalDetail = (data: any): Partial<Hospital> => ({
  legalName: safeStr(data?.hospitalLegalName ?? data?.name),
  // currentAddress: safeStr(data?.currentAddress),
  currentAddress: [
    data?.currentAddress,
    data?.city,
    data?.state,
    data?.pincode,
  ].filter(Boolean).join(', '),
  // location: safeStr(
  //   data?.location ??
  //   [data?.city, data?.state, data?.pincode].filter(Boolean).join(', ')
  // ),
  staffCount: safeStr(data?.staffCount, '0'),
  servicesAvailable: Array.isArray(data?.servicesAvailable) ? data.servicesAvailable : [],
  documents: Array.isArray(data?.documents) ? data.documents.map(mapDoc) : [],
});

const toApiStatus = (s: string): string | undefined => {
  if (!s || s === 'All Statuses') return undefined;
  return s.toLowerCase();
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_STATUSES: Array<'All Statuses' | LicenseStatus> = [
  'All Statuses', 'VERIFIED', 'PENDING', 'REJECTED', 'AUTO_VERIFIED', 'MANUAL_PENDING',
];

const LICENSE_BADGE: Record<LicenseStatus, { bg: string; text: string; dot: string }> = {
  VERIFIED: { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  PENDING: { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  REJECTED: { bg: '#FFF1F2', text: '#BE123C', dot: '#FB7185' },
  AUTO_VERIFIED: { bg: '#ECFDF5', text: '#15803D', dot: '#34D399' },
  MANUAL_PENDING: { bg: '#EFF6FF', text: '#2563EB', dot: '#60A5FA' },
};

const DOC_STATUS_CFG: Record<DocStatus, { bg: string; text: string; border: string }> = {
  VERIFIED: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  AUTO_VERIFIED: { bg: '#ECFDF5', text: '#15803D', border: '#86EFAC' },
  MANUAL_PENDING: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  PENDING: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  REJECTED: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

// ─── Status Tab Config ─────────────────────────────────────────────────────────
type TabKey = 'ALL' | LicenseStatus;

interface TabConfig {
  key: TabKey;
  label: string;
}

const STATUS_TABS: TabConfig[] = [
  { key: 'ALL', label: 'All Hospitals' },
  { key: 'PENDING', label: 'Pending Verification' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
];

const MAHARASHTRA_CITIES = [
  'All Cities',
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad',
  'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli',
  'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Dhule',
  'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Karad',
  'Satara', 'Ratnagiri', 'Osmanabad', 'Bhiwandi', 'Thane',
];

// ─── Status Tab Bar ────────────────────────────────────────────────────────────
interface StatusTabBarProps {
  activeTab: TabKey;
  counts: Partial<Record<TabKey, number>>;
  onSelect: (tab: TabKey) => void;
  locationFilter: string;
  onLocationChange: (val: string) => void;
  onApplyFilter: () => void;
}

interface LocationDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

function LocationDropdown({ value, onChange }: LocationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [anchorLayout, setAnchorLayout] = useState<{
    y: number; rightOffset: number; width: number;
  } | null>(null);
  const triggerRef = useRef<any>(null);

  const handleOpen = () => {
    triggerRef.current?.measure(
      (_fx: number, _fy: number, width: number, height: number, px: number, py: number) => {
        const screenWidth = Dimensions.get('window').width;
        setAnchorLayout({
          y: py + height + 4,
          rightOffset: screenWidth - (px + width), // ✅ right-edge aligned
          width,
        });
        setOpen(true);
      }
    );
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setSearchText('');
  };

  const handleClose = () => {
    setOpen(false);
    setSearchText('');
  };

  const filtered = MAHARASHTRA_CITIES.filter(city =>
    city.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View>
      {/* ── Trigger ── */}
      <TouchableOpacity
        ref={triggerRef}
        style={ld.trigger}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <Text style={ld.triggerIcon}>📍</Text>
        <Text
          style={[ld.triggerTxt, value === 'All Cities' && ld.placeholder]}
          numberOfLines={1}
        >
          {value === 'All Cities' ? 'Location' : value}
        </Text>
        {value !== 'All Cities' ? (
          <TouchableOpacity
            onPress={() => onChange('All Cities')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={ld.clearX}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={ld.chevron}>{open ? '▴' : '▾'}</Text>
        )}
      </TouchableOpacity>

      {/* ── Anchored Popover ── */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Full-screen backdrop */}
        <TouchableOpacity
          style={ld.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        {anchorLayout && (
          <View
            style={[
              ld.sheet,
              {
                position: 'absolute',
                top: anchorLayout.y,
                right: anchorLayout.rightOffset, // ✅ drops right below trigger
                width: 210,
              },
            ]}
          >
            {/* Search */}
            <View style={ld.searchBox}>
              <Text style={ld.searchIcon}>🔍</Text>
              <TextInput
                style={ld.searchInput}
                placeholder="Search cities..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={open}
                underlineColorAndroid="transparent"
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={ld.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* City list */}
            <ScrollView
              style={ld.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {filtered.length === 0 ? (
                <View style={ld.emptyWrap}>
                  <Text style={ld.emptyTxt}>No cities found</Text>
                </View>
              ) : (
                filtered.map(city => {
                  const isSelected = city === value;
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[ld.option, isSelected && ld.optionActive]}
                      onPress={() => handleSelect(city)}
                      activeOpacity={0.7}
                    >
                      <View style={ld.optionLeft}>
                        <Text style={ld.optionPin}>
                          {city === 'All Cities' ? '🗺️' : '📍'}
                        </Text>
                        <Text
                          style={[
                            ld.optionTxt,
                            isSelected && ld.optionTxtActive,
                            city === 'All Cities' && ld.allCitiesTxt,
                          ]}
                          numberOfLines={1}
                        >
                          {city}
                        </Text>
                      </View>
                      {isSelected && <Text style={ld.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const ld = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 10, height: 36, minWidth: 150,
  },
  triggerIcon: { fontSize: 12 },
  triggerTxt: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '600' },
  placeholder: { color: '#94A3B8', fontWeight: '500' },
  clearX: { fontSize: 9, color: '#94A3B8', fontWeight: '800', paddingHorizontal: 2 },
  chevron: { fontSize: 10, color: '#94A3B8' },

  // Full-screen invisible backdrop
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },

  // Popover card — anchored via top + right
  sheet: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.12,
        shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
      default: { boxShadow: '0 6px 20px rgba(0,0,0,0.10)' } as any,
    }),
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    margin: 8, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 8, paddingHorizontal: 8, height: 36,
  },
  searchIcon: { fontSize: 12 },
  searchInput: {
    flex: 1, fontSize: 13, color: '#334155', fontWeight: '500',
    outlineWidth: 0, outlineStyle: 'none', borderWidth: 0,
  } as any,
  searchClear: { fontSize: 9, color: '#94A3B8', fontWeight: '800' },

  list: { maxHeight: 260 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  optionActive: { backgroundColor: '#EFF6FF' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  optionPin: { fontSize: 11 },
  optionTxt: { fontSize: 13, color: '#334155', fontWeight: '500', flex: 1 },
  optionTxtActive: { color: '#2563EB', fontWeight: '700' },
  allCitiesTxt: { fontWeight: '700', color: '#0F172A' },
  checkMark: { fontSize: 13, color: '#2563EB', fontWeight: '800', marginLeft: 6 },

  emptyWrap: { alignItems: 'center', paddingVertical: 20 },
  emptyTxt: { fontSize: 12, color: '#94A3B8' },
});



// function StatusTabBar({ activeTab, counts, onSelect }: StatusTabBarProps) {
//   return (
//     <View style={stb.wrap}>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={stb.scrollContent}
//       >
//         {STATUS_TABS.map(tab => {
//           const isActive = activeTab === tab.key;
//           const count = counts[tab.key];
//           return (
//             <TouchableOpacity
//               key={tab.key}
//               style={[stb.tab, isActive && stb.tabActive]}
//               onPress={() => onSelect(tab.key)}
//               activeOpacity={0.75}
//             >
//               <Text style={[stb.tabTxt, isActive && stb.tabTxtActive]}>
//                 {tab.label}
//               </Text>

//             </TouchableOpacity>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// }

function StatusTabBar({ activeTab, counts, onSelect, locationFilter, onLocationChange, onApplyFilter }: StatusTabBarProps) {
  return (
    <View style={stb.wrap}>
      {/* LEFT: Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stb.scrollContent}
        style={{ flex: 1 }}
      >
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[stb.tab, isActive && stb.tabActive]}
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[stb.tabTxt, isActive && stb.tabTxtActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* RIGHT: Location dropdown + Apply Filter */}
      <View style={stb.rightRow}>
        <LocationDropdown
          value={locationFilter}
          onChange={onLocationChange}
        />
        <TouchableOpacity style={stb.applyBtn} onPress={onApplyFilter} activeOpacity={0.85}>
          <Text style={stb.applyTxt}>Apply Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}



const stb = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECF0',
    paddingHorizontal: 16,
    flexDirection: 'row',        // ← change to row
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
  },
  
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    flexShrink: 0,
  },
  locationTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
    minWidth: 140,
  },
  locationIcon: { fontSize: 12 },
  locationInput: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    outlineWidth: 0,
  } as any,
  clearX: { fontSize: 9, color: '#94A3B8', fontWeight: '800' },
  chevron: { fontSize: 10, color: '#94A3B8' },
  applyBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
  },
  applyTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTxtActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  badgeTxtActive: {
    color: '#fff',
  },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.min(Math.max(percent, 0), 100)}%` as any }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 99 },
});

// ─── License Badge ────────────────────────────────────────────────────────────
const BADGE_LABELS: Record<LicenseStatus, string> = {
  VERIFIED: 'VERIFIED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  AUTO_VERIFIED: 'AUTO VERIFIED',
  MANUAL_PENDING: 'MANUAL PENDING',
};

function LicenseBadge({ status }: { status: LicenseStatus }) {
  const cfg = LICENSE_BADGE[status] ?? LICENSE_BADGE['PENDING'];
  return (
    <View style={[lbdg.wrap, { backgroundColor: cfg.bg }]}>
      <View style={[lbdg.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[lbdg.txt, { color: cfg.text }]} numberOfLines={1}>
        {BADGE_LABELS[status] ?? status}
      </Text>
    </View>
  );
}
const lbdg = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  dot: { width: 6, height: 6, borderRadius: 99 },
  txt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── Dropdown ─────────────────────────────────────────────────────────────────
interface DropdownProps {
  label: string; value: string; options: string[];
  onSelect: (val: string) => void; flat?: boolean;
}
function Dropdown({ label, value, options, onSelect, flat }: DropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={flat ? { flex: 1 } : dd.container}>
      {!flat && <Text style={dd.label}>{label}</Text>}
      <TouchableOpacity style={dd.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={dd.value} numberOfLines={1}>{value}</Text>
        <Text style={dd.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={dd.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={dd.sheet}>
            <Text style={dd.sheetTitle}>{label}</Text>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[dd.option, opt === value && dd.optionActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[dd.optionTxt, opt === value && dd.optionTxtActive]}>{opt}</Text>
                {opt === value && <Text style={dd.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const dd = StyleSheet.create({
  container: { flex: 1, minWidth: 120, gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 42, gap: 6 },
  value: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  chevron: { fontSize: 11, color: '#94A3B8' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, width: '100%', maxWidth: 320, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 10 } }) },
  sheetTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  optionActive: { backgroundColor: '#F0F9FF' },
  optionTxt: { fontSize: 14, color: '#334155', fontWeight: '500' },
  optionTxtActive: { color: '#2563EB', fontWeight: '700' },
  check: { fontSize: 14, color: '#2563EB', fontWeight: '700' },
});

// ─── Filter Bar ───────────────────────────────────────────────────────────────
interface FilterBarProps {
  search: string; setSearch: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  city: string; setCity: (v: string) => void;
  onApply: () => void; onClear: () => void;
  hasActiveFilters: boolean;
}
function FilterBar({ search, setSearch, status, setStatus, city, setCity, onApply, onClear, hasActiveFilters }: FilterBarProps) {
  return (
    <View style={fb.wrap}>
      <View style={fb.row}>
        <View style={fb.group}>
          <Text style={fb.label}>SEARCH HOSPITAL</Text>
          <View style={fb.inputBox}>
            <Text style={fb.icon}>🔍</Text>
            <TextInput
              style={fb.input} placeholder="Name or ID..."
              placeholderTextColor="#9CA3AF" value={search}
              onChangeText={setSearch} returnKeyType="search"
              onSubmitEditing={onApply} underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={fb.clearX}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={fb.divider} />
        {/* <View style={fb.group}>
          <Text style={fb.label}>CURRENT STATUS</Text>
          <Dropdown label="CURRENT STATUS" value={status} options={ALL_STATUSES} onSelect={setStatus} flat />
        </View> */}
        <View style={fb.divider} />
        <View style={fb.group}>
          <Text style={fb.label}>CITY/REGION</Text>
          <View style={fb.inputBox}>
            <Text style={fb.icon}>📍</Text>
            <TextInput
              style={fb.input} placeholder="City or Region..."
              placeholderTextColor="#9CA3AF"
              value={city === 'All Cities' ? '' : city}
              onChangeText={t => setCity(t || 'All Cities')}
              returnKeyType="search" onSubmitEditing={onApply}
              underlineColorAndroid="transparent"
            />
            {city !== 'All Cities' && city !== '' && (
              <TouchableOpacity onPress={() => setCity('All Cities')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={fb.clearX}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={fb.btnWrap}>
          {hasActiveFilters && (
            <TouchableOpacity style={fb.clearBtn} onPress={onClear}>
              <Text style={fb.clearBtnTxt}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={fb.applyBtn} onPress={onApply} activeOpacity={0.85}>
            <Text style={fb.applyTxt}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const fb = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 0 },
  group: { flex: 1, minWidth: 120, gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 42, gap: 8 },
  icon: { fontSize: 13, color: '#94A3B8' },
  input: { flex: 1, fontSize: 13, fontWeight: '500', borderWidth: 0, outlineWidth: 0 } as any,
  clearX: { fontSize: 10, color: '#94A3B8', fontWeight: '800' },
  divider: { width: 1, height: 42, backgroundColor: '#E9ECF0', alignSelf: 'flex-end', marginHorizontal: 10 },
  btnWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingLeft: 10 },
  clearBtn: { height: 42, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  clearBtnTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  applyBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 18, height: 42, justifyContent: 'center' },
  applyTxt: { fontSize: 12, color: '#fff', fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Table Header ─────────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <View style={th.row}>
      <Text style={[th.cell, th.colName]}>HOSPITAL NAME</Text>
      <Text style={[th.cell, th.colLoc]}>LOCATION</Text>
      <Text style={[th.cell, th.colStaff, { textAlign: 'center' }]}>{'TOTAL\nSTAFF'}</Text>
      <Text style={[th.cell, th.colDuty]}>OCCUPIED DUTIES</Text>
      <Text style={[th.cell, th.colStatus, { textAlign: 'center' }]}>LICENSE STATUS</Text>
      <Text style={[th.cell, th.colAction, { textAlign: 'center' }]}>ACTIONS</Text>
    </View>
  );
}
const th = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E9ECF0' },
  cell: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.7, lineHeight: 14 },
  colName: { flex: 2 },
  colLoc: { flex: 1.8 },
  colStaff: { flex: 1 },
  colDuty: { flex: 2.2 },
  colStatus: { flex: 1.6 },
  colAction: { flex: 0.6, minWidth: 60 },
});

// ─── Document Viewer Modal ────────────────────────────────────────────────────
interface DocViewerProps {
  visible: boolean;
  doc: HospitalDocument | null;
  hospitalName: string;
  onClose: () => void;
}
function DocumentViewerModal({ visible, doc, hospitalName, onClose }: DocViewerProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  const handleClose = () => {
    setDecision(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={dv.overlay}>
        <View style={dv.sheet}>
          <View style={dv.handle} />
          <TouchableOpacity style={dv.closeBtn} onPress={handleClose}>
            <Text style={dv.closeX}>✕</Text>
          </TouchableOpacity>

          {decision ? (
            <View style={dv.resultWrap}>
              <View style={[dv.resultIcon, decision === 'approved' ? dv.resultIconGreen : dv.resultIconRed]}>
                <Text style={[dv.resultCheck, { color: decision === 'approved' ? '#16A34A' : '#DC2626' }]}>
                  {decision === 'approved' ? '✓' : '✕'}
                </Text>
              </View>
              <Text style={dv.resultTitle}>
                {decision === 'approved' ? 'Document Approved' : 'Document Rejected'}
              </Text>
              <Text style={dv.resultSub}>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{doc?.title ?? 'Document'}</Text>
                {'\n'}has been {decision === 'approved' ? 'approved and verified.' : 'rejected. The hospital will be notified.'}
              </Text>
              <TouchableOpacity style={dv.doneBtn} onPress={handleClose}>
                <Text style={dv.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={dv.previewBg}>

                {/* <View style={dv.docPage}> */}
                {/* <View style={dv.docTopRow}>
                    <View style={dv.docLogoBox}>
                      <Text style={dv.docLogoEmoji}>{doc?.icon ?? '📄'}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[dv.line, { width: '90%', height: 8 }]} />
                      <View style={[dv.line, { width: '55%', height: 7 }]} />
                    </View>
                  </View>
                  <View style={dv.docDivider} />
                  {[100, 96, 100, 85, 100, 78, 100, 90, 66, 100, 80].map((w, i) => (
                    <View key={i} style={[dv.line, { width: `${w}%` as any, marginBottom: 6 }]} />
                  ))}
                  <View style={dv.stampRow}>
                    <View style={dv.stamp}>
                      <Text style={dv.stampTxt}>OFFICIAL</Text>
                    </View>
                  </View>
                </View> */}
                {doc?.url ? (
                  // ✅ Show actual document image
                  <View style={dv.docImageWrap}>
                    <Image
                      source={{ uri: doc.url }}
                      style={dv.docImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  // existing skeleton fallback
                  <View style={dv.docPage}>
                    {/* ...existing skeleton lines... */}
                  </View>
                )}
                <Text style={dv.pageNote}>Page 1 of {doc?.pages ?? 1}</Text>
              </View>

              <View style={dv.body}>
                <View style={dv.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={dv.docTitle}>{doc?.title ?? '—'}</Text>
                    <Text style={dv.docSubtitle}>{hospitalName}</Text>
                  </View>
                  {doc && (
                    <View style={[dv.statusPill, { backgroundColor: DOC_STATUS_CFG[doc.status].bg, borderColor: DOC_STATUS_CFG[doc.status].border }]}>
                      <Text style={[dv.statusPillTxt, { color: DOC_STATUS_CFG[doc.status].text }]}>
                        {doc.status}
                      </Text>
                    </View>
                  )}
                </View>

                {doc?.description ? <Text style={dv.description}>{doc.description}</Text> : null}

              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
const dv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: '#fff', borderRadius: 18, maxHeight: '80%', width: '55%', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: -8 } }, android: { elevation: 20 } }) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 30, height: 30, borderRadius: 99, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  previewBg: { backgroundColor: '#F1F5F9', paddingVertical: 24, alignItems: 'center' },
  docPage: { backgroundColor: '#fff', borderRadius: 8, width: '80%', padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  docTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  docLogoBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docLogoEmoji: { fontSize: 18 },
  docDivider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 12 },
  line: { height: 6, borderRadius: 3, backgroundColor: '#EEF2F7' },
  stampRow: { marginTop: 14, alignItems: 'flex-end' },
  stamp: { borderWidth: 2, borderColor: '#BFDBFE', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  stampTxt: { fontSize: 9, fontWeight: '800', color: '#93C5FD', letterSpacing: 2 },
  pageNote: { fontSize: 11, color: '#94A3B8', marginTop: 10 },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  docTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', lineHeight: 22 },
  docSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, flexShrink: 0, marginTop: 2 },
  statusPillTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  description: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  metaCell: { width: '50%', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  metaCellLeft: { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  metaCellRight: { borderRightWidth: 0 },
  metaCellBottom: { borderBottomWidth: 0 },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  metaValue: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' },
  rejectBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  rejectBtnTxt: { fontSize: 13, color: '#DC2626', fontWeight: '700' },
  approveBtn: { flex: 2, height: 46, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  approveBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  resultWrap: { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 24 },
  resultIcon: { width: 68, height: 68, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resultIconGreen: { backgroundColor: '#DCFCE7' },
  resultIconRed: { backgroundColor: '#FEE2E2' },
  resultCheck: { fontSize: 30, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  resultSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 36, paddingVertical: 13 },
  doneBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  docImageWrap: {
    width: '80%', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  docImage: {
    width: '100%', height: 300,
  },
});

// ─── Hospital Review Modal ────────────────────────────────────────────────────
interface HospitalReviewModalProps {
  visible: boolean;
  hospital: Hospital | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function HospitalReviewModal({ visible, hospital, onClose, onApprove, onReject }: HospitalReviewModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<HospitalDocument | null>(null);
  const [docViewerVisible, setDocViewerVisible] = useState(false);
  const [detailData, setDetailData] = useState<Partial<Hospital> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionDecision, setActionDecision] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (visible && hospital?.id) {
      setDetailData(null);
      setDetailLoading(true);
      setActionDecision(null);
      adminAPI
        .getHospitalById(hospital.id)
        .then((res: any) => {
          const data = res?.data ?? res;
          setDetailData(mapHospitalDetail(data));
        })
        .catch(() => { })
        .finally(() => setDetailLoading(false));
    }
  }, [visible, hospital?.id]);

  const handleClose = () => {
    setSelectedDoc(null);
    setDetailData(null);
    setActionDecision(null);
    onClose();
  };

  if (!hospital) return null;

  const legalName = safeStr(detailData?.legalName ?? hospital.legalName, 'Unknown Hospital');
  const currentAddress = safeStr(detailData?.currentAddress ?? hospital.currentAddress);
  const location = safeStr(detailData?.location ?? hospital.location);
  const staffCount = safeStr(detailData?.staffCount ?? hospital.staffCount, '0');
  const docs = detailData?.documents ?? hospital.documents ?? [];

  const isVerified = hospital.licenseStatus === 'VERIFIED' || hospital.licenseStatus === 'AUTO_VERIFIED';
  const isRejected = hospital.licenseStatus === 'REJECTED';

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={rm.overlay}>
          <View style={rm.sheet}>
            <View style={rm.handle} />
            <TouchableOpacity style={rm.closeBtn} onPress={handleClose}>
              <Text style={rm.closeX}>✕</Text>
            </TouchableOpacity>

            {actionDecision ? (
              <View style={rm.resultWrap}>
                <View style={[rm.resultIcon, actionDecision === 'approved' ? rm.resultIconGreen : rm.resultIconRed]}>
                  <Text style={[rm.resultCheck, { color: actionDecision === 'approved' ? '#16A34A' : '#DC2626' }]}>
                    {actionDecision === 'approved' ? '✓' : '✕'}
                  </Text>
                </View>
                <Text style={rm.resultTitle}>
                  {actionDecision === 'approved' ? 'Hospital Approved' : 'Hospital Rejected'}
                </Text>
                <Text style={rm.resultSub}>
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>{legalName}</Text>
                  {'\n'}has been {actionDecision === 'approved' ? 'approved and verified.' : 'rejected. The hospital will be notified.'}
                </Text>
                <TouchableOpacity style={rm.doneBtn} onPress={handleClose}>
                  <Text style={rm.doneBtnTxt}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                <View style={rm.section}>
                  <View style={rm.mainInfoCard}>
                    <View style={rm.infoRow}>
                      <Text style={rm.detailFieldLabel}>HOSPITAL LEGAL NAME</Text>
                      <Text style={rm.detailFieldValueLegal}>{legalName}</Text>
                    </View>
                    <View style={rm.twoColRow}>
                      <View style={rm.twoColCell}>
                        <Text style={rm.detailFieldLabel}>ADDRESS</Text>
                        <Text style={rm.detailFieldValue}>{currentAddress}</Text>
                      </View>
                      {/* <View style={rm.twoColCell}>
                        <Text style={rm.detailFieldLabel}>LOCATION</Text>
                        <Text style={rm.detailFieldValue}>{location}</Text>
                      </View> */}
                      <View style={rm.twoColCell}>
                        {(detailData?.servicesAvailable ?? []).length > 0 && (
                          <View style={rm.infoRow}>
                            <Text style={rm.detailFieldLabel}>SERVICES AVAILABLE</Text>
                            <View style={rm.servicesWrap}>
                              {(detailData?.servicesAvailable ?? []).map((s, i) => (
                                <View key={i} style={rm.serviceChip}>
                                  <Text style={rm.serviceChipTxt}>{s}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={rm.twoColRow}>
                      <View style={rm.twoColCell}>
                        <Text style={rm.detailFieldLabel}>STAFF COUNT</Text>
                        <View style={rm.staffCountRow}>
                          <Text style={rm.staffIcon}>👥</Text>
                          <Text style={rm.detailFieldValue}>{staffCount}</Text>
                        </View>
                      </View>
                      <View style={rm.twoColCell}>
                        <Text style={rm.detailFieldLabel}>DUTIES</Text>
                        <Text style={rm.detailFieldValue}>
                          {hospital.occupiedDuties}/{hospital.totalDuties} Occupied
                        </Text>
                      </View>
                    </View>
                    <View style={rm.infoRowLast}>
                      <Text style={rm.detailFieldLabel}>VERIFICATION STATUS</Text>
                      <LicenseBadge status={hospital.licenseStatus} />
                    </View>
                  </View>
                </View>

                <View style={rm.section}>
                  <Text style={rm.sectionLabel}>LIST OF DOCUMENTS</Text>

                  {detailLoading ? (
                    <View style={rm.loadingWrap}>
                      <ActivityIndicator size="small" color="#2563EB" />
                      <Text style={rm.loadingTxt}>Loading documents…</Text>
                    </View>
                  ) : docs.length === 0 ? (
                    <View style={rm.noDocsWrap}>
                      <Text style={rm.noDocsIcon}>📂</Text>
                      <Text style={rm.noDocsTxt}>No documents submitted yet</Text>
                    </View>
                  ) : (
                    docs.map((doc, idx) => {
                      const cfg = DOC_STATUS_CFG[doc.status] ?? DOC_STATUS_CFG['PENDING'];
                      return (
                        <View
                          key={doc.id}
                          style={[
                            rm.docCard,
                            { borderLeftColor: cfg.text, borderLeftWidth: 3 },
                            idx < docs.length - 1 && rm.docCardGap,
                          ]}
                        >
                          <View style={rm.docCardTop}>
                            <View style={[rm.docIconBox, { backgroundColor: cfg.bg }]}>
                              <Text style={rm.docIconEmoji}>{doc.icon}</Text>
                            </View>
                            <View style={[rm.docStatusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                              <Text style={[rm.docStatusTxt, { color: cfg.text }]}>{doc.status}</Text>
                            </View>
                          </View>
                          <Text style={rm.docTitle}>{doc.title}</Text>
                          <Text style={[rm.docNote, {
                            color: doc.status === 'REJECTED' ? '#DC2626' :
                              doc.status === 'MANUAL_PENDING' ? '#2563EB' : '#64748B',
                          }]}>
                            {doc.statusNote}
                          </Text>
                          <TouchableOpacity
                            style={rm.viewDocBtn}
                            onPress={() => { setSelectedDoc(doc); setDocViewerVisible(true); }}
                            activeOpacity={0.75}
                          >
                            <Text style={rm.viewDocBtnTxt}>● VIEW DOCUMENT</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>

                {!isVerified && (
                  <View style={dv.footer}>
                    {isRejected ? (
                      <TouchableOpacity
                        style={[dv.approveBtn, { flex: 1 }]}
                        onPress={() => { setActionDecision('approved'); onApprove(); }}
                        activeOpacity={0.85}
                      >
                        <Text style={dv.approveBtnTxt}>✓   Approve Hospital</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={dv.rejectBtn}
                          onPress={() => { setActionDecision('rejected'); onReject(); }}
                          activeOpacity={0.85}
                        >
                          <Text style={dv.rejectBtnTxt}>✕   Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dv.approveBtn}
                          onPress={() => { setActionDecision('approved'); onApprove(); }}
                          activeOpacity={0.85}
                        >
                          <Text style={dv.approveBtnTxt}>✓   Approve</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <DocumentViewerModal
        visible={docViewerVisible}
        doc={selectedDoc}
        hospitalName={legalName}
        onClose={() => { setDocViewerVisible(false); setSelectedDoc(null); }}
      />
    </>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: '#fff', borderRadius: 16, width: '50%', maxHeight: '85%', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: -8 } }, android: { elevation: 20 } }) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 30, height: 30, borderRadius: 99, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  mainInfoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#5c81a7', padding: 20, marginBottom: 10 },
  infoRow: { marginBottom: 20 },
  infoRowLast: { marginBottom: 0 },
  detailFieldLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  detailFieldValueLegal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  detailFieldValue: { fontSize: 14, fontWeight: '500', color: '#334155', lineHeight: 22 },
  twoColRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  twoColCell: { flex: 1, paddingRight: 12 },
  staffCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  staffIcon: { fontSize: 14 },
  docCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E9ECF0', padding: 14 },
  docCardGap: { marginBottom: 12 },
  docCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  docIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docIconEmoji: { fontSize: 20 },
  docStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  docStatusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  docTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  docNote: { fontSize: 12, fontWeight: '500', lineHeight: 18, marginBottom: 12 },
  viewDocBtn: { flexDirection: 'row', alignItems: 'center' },
  viewDocBtnTxt: { fontSize: 12, fontWeight: '700', color: '#16A34A', letterSpacing: 0.2 },
  noDocsWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  noDocsIcon: { fontSize: 28 },
  noDocsTxt: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
  loadingTxt: { fontSize: 13, color: '#94A3B8' },
  resultWrap: { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 24 },
  resultIcon: { width: 68, height: 68, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resultIconGreen: { backgroundColor: '#DCFCE7' },
  resultIconRed: { backgroundColor: '#FEE2E2' },
  resultCheck: { fontSize: 30, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  resultSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 36, paddingVertical: 13 },
  servicesWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6,
  },
  serviceChip: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    paddingHorizontal: 2, paddingVertical: 4, borderRadius: 99,
  },
  serviceChipTxt: {
    fontSize: 8, fontWeight: '600', color: '#2563EB', textAlign: 'center',
  },
  doneBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
});

// ─── Action Menu ──────────────────────────────────────────────────────────────
interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onReview: () => void;
  onVerify: () => void;
  onReject: () => void;
  anchorY: number;
  anchorX: number;
  hospitalStatus: LicenseStatus;
}
function ActionMenu({ visible, onClose, onReview, onVerify, onReject, anchorY, anchorX, hospitalStatus }: ActionMenuProps) {
  const MENU_WIDTH = 160;
  const screenWidth = Dimensions.get('window').width;
  const left = Math.max(8, anchorX - MENU_WIDTH + 30);

  const isVerified = hospitalStatus === 'VERIFIED' || hospitalStatus === 'AUTO_VERIFIED';
  const isRejected = hospitalStatus === 'REJECTED';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={am.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[am.menu, { top: anchorY + 8, left: Math.min(left, screenWidth - MENU_WIDTH - 8) }]}>
          <TouchableOpacity style={am.item} onPress={() => { onClose(); setTimeout(onReview, 100); }} activeOpacity={0.75}>
            <Text style={am.itemIcon}>📝</Text>
            <Text style={am.itemTxt}>Review</Text>
          </TouchableOpacity>

          {!isVerified && (
            <>
              <View style={am.sep} />
              <TouchableOpacity style={am.item} onPress={() => { onVerify(); onClose(); }} activeOpacity={0.75}>
                <Text style={am.itemIcon}>✅</Text>
                <Text style={[am.itemTxt, { color: '#16A34A' }]}>
                  {isRejected ? 'Approve' : 'Verify'}
                </Text>
              </TouchableOpacity>

              {!isRejected && (
                <>
                  <View style={am.sep} />
                  <TouchableOpacity style={am.item} onPress={() => { onReject(); onClose(); }} activeOpacity={0.75}>
                    <Text style={am.itemIcon}>🚫</Text>
                    <Text style={[am.itemTxt, { color: '#DC2626' }]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const am = StyleSheet.create({
  overlay: { flex: 1 },
  menu: { position: 'absolute', width: 160, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#E9ECF0', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 10 }, default: { boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } as any }) },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  itemIcon: { fontSize: 14 },
  itemTxt: { fontSize: 13, fontWeight: '600', color: '#334155' },
  sep: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 10 },
});

// ─── Hospital Row ─────────────────────────────────────────────────────────────
interface HospitalRowProps {
  h: Hospital;
  onDotsPress: (h: Hospital, pageY: number, pageX: number) => void;
}
function HospitalRow({ h, onDotsPress }: HospitalRowProps) {
  const dotsRef = useRef<any>(null);
  const handleDotsPress = () => {
    dotsRef.current?.measure((_fx: number, _fy: number, _w: number, height: number, px: number, py: number) => {
      onDotsPress(h, py + height, px);
    });
  };
  return (
    <View style={hr.row}>
      <View style={[hr.cell, hr.colName, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={[hr.iconBox, { backgroundColor: h.iconBg }]}>
          {h.profilePictureUrl ? (
            <Image
              source={{ uri: h.profilePictureUrl }}
              style={{ width: 44, height: 44, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={hr.iconTxt}>{h.iconEmoji}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hr.name} numberOfLines={1}>{h.name}</Text>
          <Text style={hr.hid}>{h.hospitalId}</Text>
        </View>
      </View>
      <View style={[hr.cell, hr.colLoc, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
        <View style={hr.pinDot} />
        <Text style={hr.loc} numberOfLines={1}>{h.location}</Text>
      </View>
      <View style={[hr.cell, hr.colStaff, { alignItems: 'center' }]}>
        <Text style={hr.staffNum} numberOfLines={1}>{h.staffCount}</Text>
        <Text style={hr.staffLbl}>{h.staffLabel}</Text>
      </View>
      <View style={[hr.cell, hr.colDuty, { gap: 6, justifyContent: 'center' }]}>
        <ProgressBar percent={h.dutyPercent} />
        <Text style={hr.dutyLbl}>{h.dutyLabel}</Text>
      </View>
      <View style={[hr.cell, hr.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
        <LicenseBadge status={h.licenseStatus} />
      </View>
      <View style={[hr.cell, hr.colAction, { alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity ref={dotsRef} style={hr.actionBtn} onPress={handleDotsPress} activeOpacity={0.6}>
          <Text style={hr.dots}>•••</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const hr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  cell: { overflow: 'hidden' },
  colName: { flex: 2 },
  colLoc: { flex: 1.8 },
  colStaff: { flex: 1 },
  colDuty: { flex: 2.2 },
  colStatus: { flex: 1.6 },
  colAction: { flex: 0.6, minWidth: 60 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconTxt: { fontSize: 20 },
  name: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  hid: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  pinDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#F43F5E', flexShrink: 0 },
  loc: { fontSize: 12, color: '#334155', fontWeight: '500', flex: 1 },
  staffNum: { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  staffLbl: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  dutyLbl: { fontSize: 11, color: '#64748B' },
  actionBtn: { padding: 8, borderRadius: 8 },
  dots: { fontSize: 13, color: '#94A3B8', letterSpacing: 2 },
});

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonBox({ width, height = 10, style }: { width: string | number; height?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const p = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    p.start();
    return () => p.stop();
  }, []);
  return <Animated.View style={[{ width, height, borderRadius: 6, backgroundColor: '#E9ECF0', opacity }, style]} />;
}
function SkeletonRow() {
  return (
    <View style={sk.row}>
      <View style={[sk.cell, sk.colName, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <SkeletonBox width={44} height={44} style={{ borderRadius: 12, flexShrink: 0 }} />
        <View style={{ flex: 1, gap: 7 }}>
          <SkeletonBox width="75%" height={11} />
          <SkeletonBox width="45%" height={9} />
        </View>
      </View>
      <View style={[sk.cell, sk.colLoc, { gap: 7 }]}>
        <SkeletonBox width="80%" height={10} />
        <SkeletonBox width="50%" height={9} />
      </View>
      <View style={[sk.cell, sk.colStaff, { alignItems: 'center', gap: 6 }]}>
        <SkeletonBox width={56} height={14} style={{ borderRadius: 6 }} />
        <SkeletonBox width={28} height={8} />
      </View>
      <View style={[sk.cell, sk.colDuty, { gap: 7, justifyContent: 'center' }]}>
        <SkeletonBox width="100%" height={7} style={{ borderRadius: 99 }} />
        <SkeletonBox width="40%" height={9} />
      </View>
      <View style={[sk.cell, sk.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
        <SkeletonBox width={72} height={24} style={{ borderRadius: 99 }} />
      </View>
      <View style={[sk.cell, sk.colAction, { alignItems: 'center', justifyContent: 'center' }]}>
        <SkeletonBox width={28} height={28} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  cell: { overflow: 'hidden' },
  colName: { flex: 2 },
  colLoc: { flex: 1.8 },
  colStaff: { flex: 1 },
  colDuty: { flex: 2.2 },
  colStatus: { flex: 1.6 },
  colAction: { flex: 0.6, minWidth: 60 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <View style={es.wrap}>
      <Text style={es.icon}>🔍</Text>
      <Text style={es.title}>No hospitals found</Text>
      <Text style={es.sub}>Try adjusting your search or filters</Text>
      <TouchableOpacity style={es.btn} onPress={onClear}>
        <Text style={es.btnTxt}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );
}
const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  icon: { fontSize: 32 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 13, color: '#94A3B8' },
  btn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F1F5F9', borderRadius: 10 },
  btnTxt: { fontSize: 13, color: '#334155', fontWeight: '600' },
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <View style={[ts.wrap, type === 'success' ? ts.success : ts.error]}>
      <Text style={ts.icon}>{type === 'success' ? '✅' : '🚫'}</Text>
      <Text style={ts.txt}>{message}</Text>
    </View>
  );
}
const ts = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginHorizontal: 16, marginBottom: 10 },
  success: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  error: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  icon: { fontSize: 14 },
  txt: { fontSize: 12, fontWeight: '600', color: '#334155', flex: 1 },
});

// ─── Reject Reason Modal ──────────────────────────────────────────────────────
interface RejectReasonModalProps {
  visible: boolean;
  hospitalName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}
function RejectReasonModal({ visible, hospitalName, onConfirm, onCancel }: RejectReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={rr.overlay}>
        <View style={rr.sheet}>
          <View style={rr.iconCircle}>
            <Text style={rr.iconEmoji}>🚫</Text>
          </View>
          <Text style={rr.title}>Reject Hospital</Text>
          <Text style={rr.sub}>
            You are about to reject{' '}
            <Text style={rr.subBold}>{hospitalName}</Text>.{'\n'}
            Please provide a rejection reason.
          </Text>
          <View style={rr.inputWrap}>
            <TextInput
              style={rr.input}
              placeholder="e.g. Expired license, Invalid documents, Missing registration..."
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            {reason.length > 0 && (
              <Text style={rr.charCount}>{reason.length} chars</Text>
            )}
          </View>
          <View style={rr.btnRow}>
            <TouchableOpacity style={rr.cancelBtn} onPress={handleCancel} activeOpacity={0.75}>
              <Text style={rr.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rr.confirmBtn, !reason.trim() && rr.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!reason.trim()}
              activeOpacity={0.85}
            >
              <Text style={rr.confirmTxt}>✕  Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const rr = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 12 } }) },
  iconCircle: { width: 60, height: 60, borderRadius: 99, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 26 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  subBold: { fontWeight: '700', color: '#0F172A' },
  inputWrap: { width: '100%', marginBottom: 20, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12 },
  input: { fontSize: 13, color: '#0F172A', lineHeight: 20, minHeight: 72 },
  charCount: { fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  confirmBtn: { flex: 2, height: 46, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  confirmBtnDisabled: { backgroundColor: '#FCA5A5' },
  confirmTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
});

// ─── Stats Row ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string; iconBg: string; iconColor: string;
  badge: string; badgeColor: string;
  value: string; label: string;
}
function StatCard({ icon, iconBg, iconColor, badge, badgeColor, value, label }: StatCardProps) {
  return (
    <View style={sc.card}>
      <View style={sc.topRow}>
        <View style={[sc.iconBox, { backgroundColor: iconBg }]}>
          <Text style={[sc.iconTxt, { color: iconColor }]}>{icon}</Text>
        </View>
        <Text style={[sc.badge, { color: badgeColor }]}>{badge}</Text>
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E9ECF0', padding: 14, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconTxt: { fontSize: 18 },
  badge: { fontSize: 11, fontWeight: '700' },
  value: { fontSize: 26, fontWeight: '800', color: '#0F172A', lineHeight: 30 },
  label: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HospitalListSection() {
  // ── Draft filter state ────────────────────────────────────────────────────
  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('All Statuses');
  const [cityDraft, setCityDraft] = useState('All Cities');

  // ── Applied filter state ──────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [city, setCity] = useState('All Cities');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Status tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]); // full list for tab counts
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [tabLocationFilter, setTabLocationFilter] = useState('All Cities');

  // ── Modal / menu ──────────────────────────────────────────────────────────
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchorY, setMenuAnchorY] = useState(0);
  const [menuAnchorX, setMenuAnchorX] = useState(0);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [rejectReasonVisible, setRejectReasonVisible] = useState(false);
  const [pendingRejectTarget, setPendingRejectTarget] = useState<Hospital | null>(null);

  // const [stats, setStats] = useState({
  //   totalStaff: 0,
  //   pendingVerification: 0,
  //   approvedClinicians: 0,
  //   onDuty: 0,
  // });
  const [stats, setStats] = useState({
    totalHospitals: 0,
    pendingVerification: 0,
    verifiedHospitals: 0,
  });

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Tab counts derived from allHospitals ──────────────────────────────────
  const tabCounts = useCallback((): Partial<Record<TabKey, number>> => {
    const counts: Partial<Record<TabKey, number>> = {};
    counts['ALL'] = allHospitals.length;
    for (const tab of STATUS_TABS) {
      if (tab.key !== 'ALL') {
        const c = allHospitals.filter(h => h.licenseStatus === tab.key).length;
        counts[tab.key] = c;
      }
    }
    return counts;
  }, [allHospitals]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchHospitals = useCallback(async (opts?: {
    search?: string; status?: string; city?: string;
    page?: number; tabStatus?: TabKey;
  }) => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (opts?.search) params.search = opts.search;

      // Tab status overrides the dropdown status filter
      const tabKey = opts?.tabStatus ?? activeTab;
      if (tabKey && tabKey !== 'ALL') {
        params.status = tabKey.toLowerCase().replace('_', '-');
      } else if (opts?.status && opts.status !== 'All Statuses') {
        params.status = toApiStatus(opts.status);
      }

      if (opts?.city && opts.city !== 'All Cities') params.city = opts.city;
      if (opts?.page && opts.page > 1) params.page = opts.page;

      const res = await adminAPI.getHospitals(params);
      const list = res?.data?.hospitals ?? res?.hospitals ?? res?.data ?? [];
      const mapped: Hospital[] = Array.isArray(list) ? list.map(mapHospital) : [];

      // Keep a full unfiltered copy for tab counts (only on initial / no-tab fetch)
      if (!opts?.tabStatus && (!opts?.status || opts.status === 'All Statuses')) {
        setAllHospitals(mapped);
      }
      setHospitals(mapped);
      setPagination(res?.data?.pagination ?? res?.pagination ?? null);
    } catch {
      showToast('Failed to load hospitals', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getHospitalManagementStats();
      const data = res?.data ?? res;
      setStats({
        totalHospitals: Number(data?.totalHospitals) || 0,
        pendingVerification: Number(data?.pendingVerification) || 0,
        verifiedHospitals: Number(data?.verifiedHospitals) || 0,
      });
    } catch {
      // silently fail — stats are non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHospitals();
    fetchStats();
  }, [fetchHospitals, fetchStats]);

  // Refetch when tab changes
  const handleTabSelect = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    fetchHospitals({ search, status, city, page: 1, tabStatus: tab });
  };

  const hasActiveFilters = search !== '' || status !== 'All Statuses' || city !== 'All Cities';

  // ── Apply / Clear ─────────────────────────────────────────────────────────
  const handleApply = () => {
    setSearch(searchDraft);
    setStatus(statusDraft);
    setCity(cityDraft);
    setCurrentPage(1);
    fetchHospitals({ search: searchDraft, status: statusDraft, city: cityDraft, page: 1, tabStatus: activeTab });
  };

  const handleClear = () => {
    setSearchDraft(''); setStatusDraft('All Statuses'); setCityDraft('All Cities');
    setSearch(''); setStatus('All Statuses'); setCity('All Cities');
    setCurrentPage(1);
    fetchHospitals({ tabStatus: activeTab });
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePrevPage = () => {
    if (!pagination?.hasPrevPage) return;
    const page = currentPage - 1;
    setCurrentPage(page);
    fetchHospitals({ search, status, city, page, tabStatus: activeTab });
  };

  const handleNextPage = () => {
    if (!pagination?.hasNextPage) return;
    const page = currentPage + 1;
    setCurrentPage(page);
    fetchHospitals({ search, status, city, page, tabStatus: activeTab });
  };

  // ── Action menu ───────────────────────────────────────────────────────────
  const handleDotsPress = (h: Hospital, pageY: number, pageX: number) => {
    setActiveHospital(h);
    setMenuAnchorY(pageY);
    setMenuAnchorX(pageX);
    setMenuVisible(true);
  };

  const handleVerify = async (h: Hospital | null = activeHospital) => {
    if (!h) return;
    try {
      await adminAPI.verifyHospital(h.id);
      showToast(`${h.name} has been verified`, 'success');
      fetchHospitals({ search, status, city, page: currentPage, tabStatus: activeTab });
    } catch {
      showToast('Verification failed', 'error');
    }
  };

  const handleReject = (h: Hospital | null = activeHospital) => {
    if (!h) return;
    setPendingRejectTarget(h);
    setMenuVisible(false);
    setRejectReasonVisible(true);
  };

  const handleConfirmReject = async (reason: string) => {
    setRejectReasonVisible(false);
    if (!pendingRejectTarget) return;
    try {
      await adminAPI.rejectHospital(pendingRejectTarget.id, reason);
      showToast(`${pendingRejectTarget.name} has been rejected`, 'error');
      fetchHospitals({ search, status, city, page: currentPage, tabStatus: activeTab });
    } catch {
      showToast('Rejection failed', 'error');
    } finally {
      setPendingRejectTarget(null);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? hospitals.length;
  const displayCount = hospitals.length;
  const counts = tabCounts();

  return (
    <View style={s.card}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Hospital Management</Text>
          <Text style={s.subtitle}>
            Centralized directory of all healthcare facilities integrated with Hospilink+.
            Monitor verification status, staff density, and operational logs.
          </Text>
        </View>
        <TouchableOpacity style={s.exportBtn}>
          <Text style={s.exportIcon}>↑</Text>
          <Text style={s.exportTxt}>Export Hospital Data</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Bar ── */}
      <View style={s.filterCard}>
        <FilterBar
          search={searchDraft} setSearch={setSearchDraft}
          status={statusDraft} setStatus={setStatusDraft}
          city={cityDraft} setCity={setCityDraft}
          onApply={handleApply} onClear={handleClear}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      {/* ── Active Filter Chips ── */}
      {hasActiveFilters && (
        <View style={s.chipsRow}>
          <Text style={s.chipsLabel}>Active:</Text>
          {search !== '' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>"{search}"</Text>
              <TouchableOpacity
                onPress={() => { setSearch(''); setSearchDraft(''); fetchHospitals({ status, city, page: 1, tabStatus: activeTab }); }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {status !== 'All Statuses' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>{status}</Text>
              <TouchableOpacity
                onPress={() => { setStatus('All Statuses'); setStatusDraft('All Statuses'); fetchHospitals({ search, city, page: 1, tabStatus: activeTab }); }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {city !== 'All Cities' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>{city}</Text>
              <TouchableOpacity
                onPress={() => { setCity('All Cities'); setCityDraft('All Cities'); fetchHospitals({ search, status, page: 1, tabStatus: activeTab }); }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Stat Cards ── */}
      <View style={s.statsRow}>
        <StatCard
          icon="🏥" iconBg="#EEF2FF" iconColor="#4F46E5"
          badge="+12%" badgeColor="#16A34A"
          value={stats.totalHospitals.toLocaleString()} label="Total Hospitals"
        />
        <StatCard
          icon="⚠️" iconBg="#FEF3C7" iconColor="#D97706"
          badge="Action Req." badgeColor="#D97706"
          value={String(stats.pendingVerification)} label="Pending Verification"
        />
        <StatCard
          icon="✅" iconBg="#ECFDF5" iconColor="#16A34A"
          badge={`${stats.totalHospitals > 0 ? Math.round((stats.verifiedHospitals / stats.totalHospitals) * 100) : 0}% Verified`}
          badgeColor="#16A34A"
          value={stats.verifiedHospitals.toLocaleString()} label="Approved Hospitals"
        />
      </View>

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* ── Status Tab Bar ── */}
      <StatusTabBar
        activeTab={activeTab}
        counts={counts}
        onSelect={handleTabSelect}
        locationFilter={tabLocationFilter}
        onLocationChange={setTabLocationFilter}
        onApplyFilter={() => {
          fetchHospitals({
            search,
            status,
            city: tabLocationFilter,  
            page: 1,
            tabStatus: activeTab,
          });
        }}
      />

      {/* ── Table ── */}
      {loading ? (
        <View style={{ width: '100%' }}>
          <TableHeader />
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          <View style={s.skeletonFooter}>
            <SkeletonBox width={160} height={10} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <SkeletonBox width={28} height={28} style={{ borderRadius: 6 }} />
              <SkeletonBox width={28} height={28} style={{ borderRadius: 6 }} />
            </View>
          </View>
        </View>
      ) : hospitals.length === 0 ? (
        <EmptyState onClear={handleClear} />
      ) : (
        <View style={{ width: '100%' }}>
          <TableHeader />
          {hospitals.map(h => (
            <HospitalRow key={h.id} h={h} onDotsPress={handleDotsPress} />
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>
          Showing {displayCount} of {totalItems} hospitals
          {totalPages > 1 ? ` · Page ${currentPage} / ${totalPages}` : ''}
        </Text>
        <View style={s.navRow}>
          <TouchableOpacity
            style={[s.navBtn, !pagination?.hasPrevPage && s.navDisabled]}
            onPress={handlePrevPage}
            disabled={!pagination?.hasPrevPage}
          >
            <Text style={[s.navTxt, !pagination?.hasPrevPage && { color: '#CBD5E1' }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, pagination?.hasNextPage && s.navActive]}
            onPress={handleNextPage}
            disabled={!pagination?.hasNextPage}
          >
            <Text style={[s.navTxt, pagination?.hasNextPage ? { color: '#2563EB' } : { color: '#CBD5E1' }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Action Menu ── */}
      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorY={menuAnchorY}
        anchorX={menuAnchorX}
        hospitalStatus={activeHospital?.licenseStatus ?? 'PENDING'}
        onReview={() => setReviewVisible(true)}
        onVerify={() => handleVerify(activeHospital)}
        onReject={() => handleReject(activeHospital)}
      />

      {/* ── Hospital Review Modal ── */}
      <HospitalReviewModal
        visible={reviewVisible}
        hospital={activeHospital}
        onClose={() => setReviewVisible(false)}
        onApprove={() => handleVerify(activeHospital)}
        onReject={() => handleReject(activeHospital)}
      />

      <RejectReasonModal
        visible={rejectReasonVisible}
        hospitalName={pendingRejectTarget?.name ?? ''}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setRejectReasonVisible(false);
          setPendingRejectTarget(null);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 4 } }) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  headerLeft: { gap: 4, flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 11, color: '#64748B', lineHeight: 17 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  exportIcon: { fontSize: 12, color: '#fff', fontWeight: '700' },
  exportTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },
  filterCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E9ECF0', paddingTop: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  chipsLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  chipX: { fontSize: 9, color: '#2563EB', fontWeight: '800' },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerTxt: { fontSize: 11, color: '#94A3B8' },
  navRow: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  navActive: { borderColor: '#BFDBFE' },
  navDisabled: { opacity: 0.4 },
  navTxt: { fontSize: 15, color: '#64748B', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
});