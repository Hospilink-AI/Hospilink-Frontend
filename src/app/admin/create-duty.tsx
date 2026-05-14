import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminAPI } from '../../service/api';

// ─── Types ────────────────────────────────────────────────
type FormState = {
  hospitalId: string;
  hospitalName: string;
  staffRole: string;
  urgencyLevel: string;
  startingDate: string;
  endingDate: string;
  startTime: string;
  endTime: string;
  overtimeDuty: boolean;
  offerRate: string;
  dutyDescription: string;
  staffCount: string;
};

interface Hospital {
  id: string;
  name: string;
  location: string;
}

// ─── Dropdown Options ─────────────────────────────────────
const ROLES: { label: string; value: string }[] = [
  { label: 'Select Role', value: '' },
  { label: 'RMO (Resident Medical Officer)', value: 'rmo' },
  { label: 'Duty Medical Officer (DMO)', value: 'dmo' },
  { label: 'General Physician', value: 'general_physician' },
  { label: 'Intensivist / ICU Doctor', value: 'intensivist' },
  { label: 'Emergency Medicine Doctor', value: 'emergency_doctor' },
  { label: 'Anesthetist', value: 'anesthetist' },
  { label: 'Pediatrician (NICU/PICU)', value: 'pediatrician' },
  { label: 'Gynecologist (On-call)', value: 'gynecologist' },
  { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
  { label: 'General Surgeon', value: 'general_surgeon' },
  { label: 'Radiologist', value: 'radiologist' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'Staff Nurse (Ward)', value: 'staff_nurse' },
  { label: 'ICU Nurse', value: 'icu_nurse' },
  { label: 'Emergency Nurse', value: 'emergency_nurse' },
  { label: 'OT Nurse', value: 'ot_nurse' },
  { label: 'Dialysis Nurse', value: 'dialysis_nurse' },
  { label: 'NICU / PICU Nurse', value: 'nicu_nurse' },
  { label: 'Lab Technician', value: 'lab_technician' },
  { label: 'Radiology Technician', value: 'radiology_technician' },
  { label: 'OT Technician', value: 'ot_technician' },
  { label: 'Dialysis Technician', value: 'dialysis_technician' },
  { label: 'Cath Lab Technician', value: 'cath_lab_technician' },
  { label: 'ICU Technician', value: 'icu_technician' },
  { label: 'Ward Boy', value: 'ward_boy' },
  { label: 'Ayah / Female Attendant', value: 'ayah' },
  { label: 'OPD Attendant', value: 'opd_attendant' },
  { label: 'Emergency Attendant', value: 'emergency_attendant' },
  { label: 'Patient Care Taker', value: 'patient_care_taker' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer', value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff', value: 'housekeeping_staff' },
  { label: 'Security Guard', value: 'security_guard' },
  { label: 'Ambulance Driver', value: 'ambulance_driver' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Billing Executive', value: 'billing_executive' },
  { label: 'Medical Records Staff', value: 'medical_records_staff' },
  { label: 'HR & Accounts', value: 'hr_accounts' },
];

const URGENCY: { label: string; value: string }[] = [
  { label: 'Low Priority', value: 'low' },
  { label: 'Medium Priority', value: 'medium' },
  { label: 'High Priority', value: 'high' },
  { label: 'Emergency', value: 'emergency' },
];

// ─── Validation ───────────────────────────────────────────
function validate(form: FormState): string | null {
  if (!form.hospitalId) return 'Please select a hospital.';
  if (!form.staffRole) return 'Please select a staff role.';
  if (!form.startingDate) return 'Please enter a starting date.';
  if (!form.startTime) return 'Please enter a start time.';
  if (!form.endTime) return 'Please enter an end time.';
  if (!form.offerRate) return 'Please enter an offer rate.';
  if (isNaN(Number(form.offerRate)) || Number(form.offerRate) <= 0)
    return 'Offer rate must be a valid positive number.';
  if (!form.dutyDescription) return 'Please add a duty description.';
  return null;
}

// ─── Date Format Helpers ──────────────────────────────────
function toAPIDate(val: string): string {
  const parts = val.split('/');
  if (parts.length === 3)
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  return val;
}

function fromAPIDate(val: string): string {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

function parseDateString(str: string): Date {
  if (!str) return new Date();
  const [m, d, y] = str.split('/');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date.getTime()) ? new Date() : date;
}

function formatDateDisplay(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── Toast ────────────────────────────────────────────────
function Toast({ visible, message }: { visible: boolean; message: string }) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: visible ? 0 : 100, duration: visible ? 300 : 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: visible ? 300 : 250, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }], opacity }]} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={20} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Searchable Hospital Dropdown ─────────────────────────
type SearchableDropdownProps = {
  selectedValue: string;
  selectedLabel: string;
  onSelect: (id: string, name: string) => void;
  placeholder?: string;
};

function SearchableHospitalDropdown({ selectedValue, selectedLabel, onSelect, placeholder }: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 200 });
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<View>(null);

  const ITEM_H = 50;
  const MAX_ITEMS = 5;
  const listH = Math.max(Math.min(hospitals.length, MAX_ITEMS) * ITEM_H, 100);

  const fetchHospitals = async (query: string) => {
    setLoading(true);
    try {
      const res = await adminAPI.getHospitalsList(query ? { name: query } : {});
      if (res.success) {
        setHospitals(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHospitals(searchQuery);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      fetchHospitals(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const openDropdown = () => {
    setSearchQuery('');
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setRect({ x, y: y + height + 2, w: width });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  return (
    <View ref={triggerRef} collapsable={false} style={{ zIndex: 100 }}>
      <TouchableOpacity
        style={[styles.dropdown, open && styles.dropdownFocused]}
        onPress={open ? () => setOpen(false) : openDropdown}
        activeOpacity={0.85}
      >
        <Text style={[styles.dropdownText, !selectedValue && styles.dropdownPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder || 'Select Hospital'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'search-outline'} size={15} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setOpen(false)} />
        <View
          style={[styles.dropdownList, { position: 'absolute', top: rect.y, left: rect.x, width: rect.w, height: listH + 50 }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchDropdownInput}
              placeholder="Search hospital by name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : hospitals.length === 0 ? (
            <Text style={{ padding: 16, color: '#6B7280', textAlign: 'center', fontSize: 13 }}>No hospitals found</Text>
          ) : (
            <FlatList
              data={hospitals}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.id === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive, { height: ITEM_H, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }]}
                    onPress={() => { onSelect(item.id, item.name); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>{item.location}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Inline Dropdown ──────────────────────────────────────
type DropdownProps = {
  selectedValue: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

function InlineDropdown({ selectedValue, options, onSelect, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 200 });
  const triggerRef = useRef<View>(null);

  const activeOption = options.find(o => o.value === selectedValue);
  const displayLabel = activeOption ? activeOption.label : (placeholder ?? 'Select');
  const isPlaceholder = !selectedValue;
  const filtered = options.filter(o => o.value !== '');

  const ITEM_H = 44;
  const MAX_ITEMS = 6;
  const listH = Math.min(filtered.length, MAX_ITEMS) * ITEM_H;

  const openDropdown = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setRect({ x, y: y + height + 2, w: width });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  return (
    <View ref={triggerRef} collapsable={false} style={{ zIndex: 90 }}>
      <TouchableOpacity
        style={[styles.dropdown, open && styles.dropdownFocused]}
        onPress={open ? () => setOpen(false) : openDropdown}
        activeOpacity={0.85}
      >
        <Text style={[styles.dropdownText, isPlaceholder && styles.dropdownPlaceholder]} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setOpen(false)} />
        <View
          style={[styles.dropdownList, { position: 'absolute', top: rect.y, left: rect.x, width: rect.w, maxHeight: listH }]}
          onStartShouldSetResponder={() => true}
        >
          <FlatList
            data={filtered}
            keyExtractor={item => item.value}
            showsVerticalScrollIndicator={filtered.length > MAX_ITEMS}
            nestedScrollEnabled
            getItemLayout={(_d, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
            renderItem={({ item, index }) => {
              const isSelected = item.value === selectedValue;
              const isLast = index === filtered.length - 1;
              return (
                <TouchableOpacity
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#F97316" style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Date Picker Field ────────────────────────────────────
function DatePickerField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handlePress = () => {
    setTempDate(value ? parseDateString(value) : new Date());
    setShowPicker(true);
  };

  if (Platform.OS === 'web') {
    const htmlValue = (() => {
      if (!value) return '';
      const [m, d, y] = value.split('/');
      return `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`;
    })();
    return (
      <View style={styles.inputWrap}>
        <Ionicons name="calendar-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
        <input
          type="date"
          value={htmlValue}
          onChange={(e: any) => {
            const raw = e.target.value;
            if (raw) {
              const [y, m, d] = raw.split('-');
              onChange(`${m}/${d}/${y}`);
            }
            else onChange('');
          }}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13,
            color: value ? '#111827' : '#9CA3AF', background: 'transparent',
            paddingTop: 9, paddingBottom: 9, cursor: 'pointer',
            fontFamily: 'inherit', minWidth: 0, width: '100%',
          }}
        />
      </View>
    );
  }

  return (
    <View>
      {/* Click trigger moved to the wrapper for full-box interaction */}
      <TouchableOpacity
        style={styles.inputWrap}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
        <Text style={[styles.input, !value && { color: '#9CA3AF' }]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={(_e: any, date?: Date) => {
            setShowPicker(false);
            if (date) onChange(formatDateDisplay(date));
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalBox}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.dateModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => { onChange(formatDateDisplay(tempDate)); setShowPicker(false); }}>
                  <Text style={styles.dateModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(_e: any, d?: Date) => { if (d) setTempDate(d); }}
                style={{ backgroundColor: '#fff' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/// ─── Time Picker Field ────────────────────────────────────
// ─── Time Picker Field ────────────────────────────────────
function TimePickerField({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; error?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const inputRef = useRef<any>(null); // Added ref for web interaction

  const handlePress = () => {
    if (value) {
      const [h, m] = value.split(':');
      const d = new Date();
      d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
      setTempTime(d);
    } else {
      setTempTime(new Date());
    }
    setShowPicker(true);
  };

  const formatTime = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const renderInput = () => {
    if (Platform.OS === 'web') {
      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.showPicker?.()} // Triggers the browser's native picker
        >
          <View style={[styles.inputWrap]}>
            <Ionicons name="time-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
            {/* @ts-ignore */}
            <input
              ref={inputRef}
              type="time"
              value={value || ''}
              onChange={(e: any) => onChange(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 13,
                color: value ? '#111827' : '#9CA3AF', background: 'transparent',
                paddingTop: 9, paddingBottom: 9, cursor: 'pointer',
                fontFamily: 'inherit', minWidth: 0, width: '100%',
                pointerEvents: 'none', // Prevents the native input from blocking the TouchableOpacity
              }}
            />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.inputWrap]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* pointerEvents="none" makes the touch go "through" the icon/text to the wrapper */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} pointerEvents="none">
          <Ionicons name="time-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
          <Text style={[styles.input, !value && { color: '#9CA3AF' }]}>
            {value || placeholder}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {renderInput()}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="clock"
          is24Hour={true}
          onChange={(_e: any, date?: Date) => {
            setShowPicker(false);
            if (date) onChange(formatTime(date));
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalBox}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.dateModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>Select Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    onChange(formatTime(tempTime));
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.dateModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                is24Hour={true}
                onChange={(_e: any, d?: Date) => { if (d) setTempTime(d); }}
                style={{ backgroundColor: '#fff' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Small Helpers ────────────────────────────────────────
function SectionHeader({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={{ color: '#2563EB' }}> *</Text>}
    </Text>
  );
}

function InputField({ placeholder, value, onChangeText, prefix, multiline, keyboardType }: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
  prefix?: string; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={[styles.inputWrap, multiline && { alignItems: 'flex-start' }]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}

      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function CreateDutyScreen() {
  const router = useRouter();

  const { dutyId, mode } = useLocalSearchParams<{ dutyId: string; mode: string }>();
  const isEditMode = mode === 'edit';

  const [form, setForm] = useState<FormState>({
    hospitalId: '', hospitalName: '', staffRole: '', urgencyLevel: 'medium',
    startingDate: '', endingDate: '', startTime: '', endTime: '',
    overtimeDuty: false, offerRate: '', dutyDescription: '', staffCount: '',
  });

  const [publishing, setPublishing] = useState(false);
  const [loadingDuty, setLoadingDuty] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const set = (key: keyof FormState) => (val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  useEffect(() => {
    if (!isEditMode || !dutyId) return;

    (async () => {
      try {
        setLoadingDuty(true);
        const res = await adminAPI.getDuty(dutyId);
        const d = res?.data ?? res?.duty ?? res;

        if (!d || !d._id) {
          Alert.alert('Error', 'Duty data not found. Please try again.');
          return;
        }

        setForm({
          hospitalId: d.hospital_id ?? d.hospitalId ?? '',
          hospitalName: d.hospital_name ?? d.hospitalName ?? 'Selected Hospital',
          staffRole: d.staff_role ?? d.staffRole ?? '',
          urgencyLevel: d.urgency ?? 'medium',
          startingDate: fromAPIDate(d.date ?? ''),
          endingDate: fromAPIDate(d.end_date ?? d.endDate ?? ''),
          startTime: d.start_time ?? d.startTime ?? '',
          endTime: d.end_time ?? d.endTime ?? '',
          overtimeDuty: d.is_overnight_duty ?? d.isOvernightDuty ?? false,
          offerRate: String(d.offered_rate ?? d.offeredRate ?? ''),
          dutyDescription: d.description ?? '',
          staffCount: String(d.staff_count ?? d.staffCount ?? ''),
        });
      } catch (err: any) {
        Alert.alert(
          'Error',
          err?.response?.data?.message ?? err?.message ?? 'Failed to load duty details.',
        );
      } finally {
        setLoadingDuty(false);
      }
    })();
  }, [dutyId, isEditMode]);

  const handleSubmit = async () => {
    const error = validate(form);
    if (error) {
      Alert.alert('Missing Info', error);
      return;
    }

    const payload = {
      hospital_id: form.hospitalId,
      staff_role: form.staffRole,
      date: toAPIDate(form.startingDate),
      start_time: form.startTime,
      end_time: form.endTime,
      urgency: form.urgencyLevel,
      description: form.dutyDescription,
      offered_rate: Number(form.offerRate),
      is_overnight_duty: form.overtimeDuty,
      staff_count: form.staffCount ? Number(form.staffCount) : undefined,
    };

    try {
      setPublishing(true);

      if (isEditMode && dutyId) {
        await adminAPI.updatePublishedDuty(dutyId, payload);
        showToast('Duty updated successfully!');
        setTimeout(() => router.back(), 1800);
      } else {
        await adminAPI.createDuty(payload);
        showToast('Duty created successfully!');
        setTimeout(() => router.push('/admin/dashboard'), 1800);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (loadingDuty) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading duty details…</Text>
      </View>
    );
  }


  // ─── AUTO-TOGGLE OVERNIGHT LOGIC ───
  useEffect(() => {
    if (!form.startingDate || !form.endingDate) return;

    const start = parseDateString(form.startingDate);
    const end = parseDateString(form.endingDate);

    // Set hours to 0 to compare the calendar dates only
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // If End Date is later than Start Date, it is an overnight shift
    const isNextDay = end > start;

    if (isNextDay !== form.overtimeDuty) {
      setForm(prev => ({ ...prev, overtimeDuty: isNextDay }));
    }
  }, [form.startingDate, form.endingDate]);

  return (
    <View style={styles.screen}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => isEditMode ? router.back() : router.push('/hospital/dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={styles.backText}>
            {isEditMode ? 'Back' : 'Back to Dashboard'}
          </Text>
        </TouchableOpacity>

        {/* Action buttons in header (right side) */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => isEditMode ? router.back() : router.push('/hospital/dashboard')}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.publishBtn, publishing && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={publishing}
          >
            {publishing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.publishText}>
                {isEditMode ? 'Save Changes' : 'Publish Duty'}
              </Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page Title ── */}
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle}>
            {isEditMode ? 'Edit Duty' : 'Create Duty'}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isEditMode
              ? 'Update the shift details below. Changes will reflect immediately after saving.'
              : 'Specify details for the upcoming hospital shift and assign requirements.'}
          </Text>
        </View>

        {/* ── Two-column layout ── */}
        <View style={styles.twoColRow}>

          {/* LEFT column: Duty Specifications + Terms & Description stacked */}
          <View style={styles.colLeft}>

            {/* Duty Specifications card */}
            <View style={styles.card}>
              <SectionHeader icon="list-outline" label="Duty Specifications" color="#2563EB" />

              {/* Hospital Name — full width, alone in its row */}
              <View style={styles.fieldBlock}>
                <FieldLabel label="Hospital Name" required />
                <SearchableHospitalDropdown
                  selectedValue={form.hospitalId}
                  selectedLabel={form.hospitalName}
                  onSelect={(id, name) => {
                    setForm(prev => ({ ...prev, hospitalId: id, hospitalName: name }));
                  }}
                />
              </View>

              {/* Staff Role + Urgency Level — two columns */}
              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Staff Role" required />
                  <InlineDropdown
                    selectedValue={form.staffRole}
                    options={ROLES}
                    onSelect={set('staffRole')}
                    placeholder="Select Role"
                  />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="Urgency Level" required />
                  <InlineDropdown
                    selectedValue={form.urgencyLevel}
                    options={URGENCY}
                    onSelect={set('urgencyLevel')}
                  />
                </View>
              </View>
              {/* Staff Count */}
              <View style={{ marginTop: 4 }}>
                <FieldLabel label="Number of Staff Required" />
                <InputField
                  placeholder="e.g. 2"
                  value={form.staffCount}
                  onChangeText={set('staffCount')}
                  keyboardType="number-pad"
                  // error={errors.staffCount}
                />
              </View>
            </View>

            {/* Terms & Description card */}
            <View style={styles.card}>
              <SectionHeader icon="document-text-outline" label="Terms & Description" color="#2563EB" />

              <FieldLabel label="Offer Rate per Hour (₹)" required />
              <InputField
                placeholder="0.00"
                value={form.offerRate}
                onChangeText={set('offerRate')}
                prefix="₹"
                keyboardType="decimal-pad"
              />

              <View style={{ height: 14 }} />

              <FieldLabel label="Duty Description" required />
              <InputField
                placeholder="Briefly describe the responsibilities, department requirements, and specific instructions for this shift..."
                value={form.dutyDescription}
                onChangeText={set('dutyDescription')}
                multiline
              />
            </View>

          </View>

          {/* RIGHT column: Schedule Details */}
          <View style={styles.colRight}>
            <View style={styles.card}>
              <SectionHeader icon="calendar-outline" label="Schedule Details" color="#2563EB" />

              {/* Starting Date + Ending Date */}
              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Starting Date" required />
                  <DatePickerField value={form.startingDate} onChange={set('startingDate')} placeholder="dd-mm-yyyy" />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="Ending Date" required />
                  <DatePickerField value={form.endingDate} onChange={set('endingDate')} placeholder="dd-mm-yyyy" />
                </View>
              </View>

              {/* Start Time + End Time */}
              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Start Time" required />
                  <TimePickerField
                    value={form.startTime}
                    onChange={set('startTime')}
                    placeholder="-- : --"
                  />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="End Time" required />
                  <TimePickerField
                    value={form.endTime}
                    onChange={set('endTime')}
                    placeholder="-- : --"
                  />
                </View>
              </View>

              {/* Overnight Duty toggle */}
              <View style={styles.overtimeBox}>
                <View style={styles.overtimeLeft}>
                  <Text style={styles.overtimeTitle}>Overnight Duty</Text>
                  <Text style={styles.overtimeSub}>Enable if shift extends past midnight into the next calendar day.</Text>
                </View>
                <Switch
                  value={form.overtimeDuty}
                  onValueChange={set('overtimeDuty')}
                  trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                  thumbColor={form.overtimeDuty ? '#2563EB' : '#fff'}
                />
              </View>

              {/* Info box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>
                  {isEditMode
                    ? 'Editing this duty will update it for all staff members who can see it. Changes take effect immediately.'
                    : "Once published, this duty will be visible to all eligible staff members in the HospiLink Staff App. You can edit or retract the duty as long as it hasn't been claimed."}
                </Text>
              </View>
            </View>
          </View>

        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMsg} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  cancelText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  publishBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 130,
    alignItems: 'center',
  },
  publishText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  // ── Scroll / content ──
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Page title row ──
  pageTitleRow: { marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 3 },
  pageSubtitle: { fontSize: 13, color: '#6B7280' },

  // ── Two-column row ──
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 0,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  // Left column — stacks Duty Specifications + Terms & Description
  colLeft: { flex: 1, minWidth: 280 },
  // Right column — Schedule Details card
  colRight: { flex: 1, minWidth: 280 },

  // ── Cards ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },

  // ── Section header ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sectionIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // ── Field rows ──
  fieldBlock: { marginBottom: 14 },
  row2: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  col: { flex: 1 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },

  // ── Dropdowns ──
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
  },
  dropdownFocused: { borderColor: '#2563EB' },
  dropdownText: { fontSize: 13, color: '#111827', flex: 1, marginRight: 6 },
  dropdownPlaceholder: { color: '#9CA3AF' },

  dropdownList: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 12, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, height: 44, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: { backgroundColor: '#FFF4ED' },
  dropdownItemText: { fontSize: 13, color: '#374151', flex: 1 },
  dropdownItemTextActive: { color: '#2563EB', fontWeight: '700' },

  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchDropdownInput: {
    flex: 1, marginLeft: 8, fontSize: 13, color: '#111827',
    outlineWidth: 0, paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },

  // ── Text inputs ──
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, backgroundColor: '#fff',
  },
  inputPrefix: { fontSize: 13, color: '#6B7280', marginRight: 4 },
  input: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: Platform.OS === 'ios' ? 12 : 10, ...Platform.select({ web: { outlineWidth: 0 } as any }), },
  inputRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  inputInner: {
    backgroundColor: "transparent",
    ...Platform.select({
      web: { outlineStyle: "none" }
    })
  },
  inputMulti: { minHeight: 110, paddingTop: 10 },

  // ── Date/Time modal ──
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dateModalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  dateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dateModalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dateModalCancel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  dateModalDone: { fontSize: 14, color: '#2563EB', fontWeight: '700' },

  // ── Overnight duty ──
  overtimeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14,
  },
  overtimeLeft: { flex: 1, marginRight: 12 },
  overtimeTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  overtimeSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  // ── Info box ──
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF',
    borderRadius: 10, padding: 14, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: '#1D4ED8', lineHeight: 18 },

  // ── Toast ──
  toast: {
    position: 'absolute', bottom: 36, left: 20, right: 20,
    backgroundColor: '#16A34A', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 8,
  },
  toastText: { fontSize: 14, color: '#fff', fontWeight: '600', flex: 1 },
});