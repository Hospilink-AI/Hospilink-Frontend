import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { dutyAPI } from '../../service/api';

// ─── Types ────────────────────────────────────────────────
type FormState = {
  staffRole: string;
  urgencyLevel: string;
  startingDate: string;
  endingDate: string;
  startTime: string;
  endTime: string;
  overtimeDuty: boolean;
  offerRate: string;
  dutyDescription: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

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

// ─── Validation ───────────────────────────────────────────
function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.staffRole) errors.staffRole = 'Please select a staff role.';
  if (!form.startingDate) errors.startingDate = 'Please enter a starting date.';
  if (!form.startTime) errors.startTime = 'Please enter a start time.';
  if (!form.endTime) errors.endTime = 'Please enter an end time.';
  if (!form.offerRate) {
    errors.offerRate = 'Please enter an offer rate.';
  } else if (isNaN(Number(form.offerRate)) || Number(form.offerRate) <= 0) {
    errors.offerRate = 'Rate must be a valid positive number.';
  }
  if (!form.dutyDescription) errors.dutyDescription = 'Please add a duty description.';
  return errors;
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
  const dateOnly = val.split('T')[0];
  const [y, m, d] = dateOnly.split('-');
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

// ─── Inline Dropdown ──────────────────────────────────────
type DropdownProps = {
  selectedValue: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
};

function InlineDropdown({ selectedValue, options, onSelect, placeholder, error }: DropdownProps) {
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
    <View ref={triggerRef} collapsable={false}>
      <TouchableOpacity
        style={[styles.dropdown, open && styles.dropdownFocused, error && styles.inputErrorBorder]}
        onPress={open ? () => setOpen(false) : openDropdown}
        activeOpacity={0.85}
      >
        <Text style={[styles.dropdownText, isPlaceholder && styles.dropdownPlaceholder]} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#6B7280" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

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
                  {isSelected && <Ionicons name="checkmark" size={14} color="#EF4444" style={{ marginLeft: 6 }} />}
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
function DatePickerField({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; error?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handlePress = () => {
    setTempDate(value ? parseDateString(value) : new Date());
    setShowPicker(true);
  };

  const renderInput = () => {
    if (Platform.OS === 'web') {
      const htmlValue = (() => {
        if (!value) return '';
        const [m, d, y] = value.split('/');
        return `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`;
      })();
      return (
        <View style={[styles.inputWrap, error && styles.inputErrorBorder]}>
          <Ionicons name="calendar-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
          {/* @ts-ignore */}
          <input
            type="date"
            value={htmlValue}
            onChange={(e: any) => {
              const raw = e.target.value;
              if (raw) { const [y, m, d] = raw.split('-'); onChange(`${m}/${d}/${y}`); }
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
      <TouchableOpacity style={[styles.inputWrap, error && styles.inputErrorBorder]} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
        <Text style={[styles.input, !value && { color: '#9CA3AF' }]}>{value || placeholder}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {renderInput()}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={(_e: any, date?: Date) => { setShowPicker(false); if (date) onChange(formatDateDisplay(date)); }}
        />
      )}

      <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
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
    </View>
  );
}

// ─── Time Picker Field ────────────────────────────────────
function TimePickerField({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; error?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const inputRef = useRef<any>(null);

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
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.showPicker?.()}>
          <View style={[styles.inputWrap, error && styles.inputErrorBorder]}>
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
                pointerEvents: 'none',
              }}
            />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={[styles.inputWrap, error && styles.inputErrorBorder]} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="time-outline" size={15} color="#9CA3AF" style={{ marginRight: 6 }} />
        <Text style={[styles.input, !value && { color: '#9CA3AF' }]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {renderInput()}
      {error && <Text style={styles.errorText}>{error}</Text>}

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

      <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalBox}>
            <View style={styles.dateModalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.dateModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.dateModalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => { onChange(formatTime(tempTime)); setShowPicker(false); }}>
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
    </View>
  );
}

// ─── Small Helpers ────────────────────────────────────────
function SectionHeader({ icon, label, color, rightElement }: { icon: string; label: string; color: string; rightElement?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      {rightElement}
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
    </Text>
  );
}

function InputField({ placeholder, value, onChangeText, prefix, multiline, keyboardType, error }: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
  prefix?: string; multiline?: boolean; keyboardType?: any; error?: string;
}) {
  return (
    <View>
      <View style={[styles.inputWrap, multiline && { alignItems: 'flex-start' }, error && styles.inputErrorBorder]}>
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function CreateDutyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const { dutyId, mode } = useLocalSearchParams<{ dutyId: string; mode: string }>();
  const isEditMode = mode === 'edit';

  const [form, setForm] = useState<FormState>({
    staffRole: '', urgencyLevel: 'emergency', startingDate: '', endingDate: '',
    startTime: '', endTime: '', overtimeDuty: false, offerRate: '', dutyDescription: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>('');

  const [publishing, setPublishing] = useState(false);
  const [loadingDuty, setLoadingDuty] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const set = (key: keyof FormState) => (val: any) => {
    // ── urgencyLevel is locked — never allow changes
    if (key === 'urgencyLevel') return;
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

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
        setApiError('');
        const res = await dutyAPI.getDuty(dutyId);
        const d = res?.data ?? res?.duty ?? res;

        if (!d || !d._id) {
          setApiError('Duty data not found. Please try again.');
          return;
        }

        setForm({
          staffRole: d.staff_role ?? d.staffRole ?? '',
          urgencyLevel: 'emergency', // always locked
          startingDate: fromAPIDate(d.date ?? ''),
          endingDate: fromAPIDate(d.end_date ?? d.endDate ?? ''),
          startTime: d.start_time ?? d.startTime ?? '',
          endTime: d.end_time ?? d.endTime ?? '',
          overtimeDuty: d.is_overnight_duty ?? d.isOvernightDuty ?? false,
          offerRate: String(d.offered_rate ?? d.offeredRate ?? ''),
          dutyDescription: d.description ?? '',
        });
      } catch (err: any) {
        setApiError(err?.response?.data?.message ?? err?.message ?? 'Failed to load duty details.');
      } finally {
        setLoadingDuty(false);
      }
    })();
  }, [dutyId, isEditMode]);

  const handleSubmit = async () => {
    setApiError('');
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      staff_role: form.staffRole,
      date: toAPIDate(form.startingDate),
      end_date: form.endingDate ? toAPIDate(form.endingDate) : undefined,
      start_time: form.startTime,
      end_time: form.endTime,
      urgency: form.urgencyLevel,
      description: form.dutyDescription,
      offered_rate: Number(form.offerRate),
      is_overnight_duty: form.overtimeDuty,
    };

    try {
      setPublishing(true);
      if (isEditMode && dutyId) {
        await dutyAPI.updatePublishedDuty(dutyId, payload);
        showToast('Duty updated successfully!');
        setTimeout(() => router.push('/hospital/dashboard'), 1800);
      } else {
        await dutyAPI.createDuty(payload);
        showToast('Duty created successfully!');
        setTimeout(() => router.push('/hospital/dashboard'), 1800);
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to submit duty. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (!form.startingDate || !form.endingDate) return;
    const start = parseDateString(form.startingDate);
    const end = parseDateString(form.endingDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const shouldBeOvernight = end > start;
    if (shouldBeOvernight !== form.overtimeDuty) {
      setForm(prev => ({ ...prev, overtimeDuty: shouldBeOvernight }));
    }
  }, [form.startingDate, form.endingDate]);

  if (loadingDuty) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading duty details…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => isEditMode ? router.back() : router.push('/hospital/dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.pageTitle}>
              {isEditMode ? 'Edit Emergency Duty' : 'Create Emergency Duty'}
            </Text>
            <Text style={styles.pageSubtitle}>
              {isEditMode
                ? 'Update the shift details below. Changes will reflect immediately after saving.'
                : 'Specify details for the upcoming hospital shift and assign requirements.'}
            </Text>
          </View>

          <View style={styles.actions}>
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

        {/* Global API Error Banner */}
        {apiError ? (
          <View style={styles.apiErrorBanner}>
            <Ionicons name="warning" size={18} color="#B91C1C" />
            <Text style={styles.apiErrorBannerText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={[styles.mainGrid, isTablet && styles.mainGridTablet]}>

          <View style={[styles.column, isTablet && { flex: 1.1 }]}>

            <View style={styles.card}>
              <SectionHeader icon="list-outline" label="Duty Specifications" color="#EF4444" />
              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Staff Role" required />
                  <InlineDropdown
                    selectedValue={form.staffRole}
                    options={ROLES}
                    onSelect={set('staffRole')}
                    placeholder="Select Role"
                    error={errors.staffRole}
                  />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="Urgency Level" />
                  {/* ── Locked to Emergency — not editable ── */}
                  <View style={styles.urgencyLocked}>
                    <Ionicons name="flash" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.urgencyLockedText}>Emergency</Text>
                    <Ionicons name="lock-closed" size={12} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="calendar-outline"
                label="Schedule Details"
                color="#EF4444"
                rightElement={
                  <View style={styles.overtimePill}>
                    <Ionicons name="moon" size={14} color="#6B7280" />
                    <Text style={styles.overtimePillText}>Overnight Duty</Text>
                    <Switch
                      value={form.overtimeDuty}
                      onValueChange={set('overtimeDuty')}
                      trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                      thumbColor={form.overtimeDuty ? '#fff' : '#fff'}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>
                }
              />
              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Starting Date" required />
                  <DatePickerField
                    value={form.startingDate}
                    onChange={set('startingDate')}
                    placeholder="dd-mm-yyyy"
                    error={errors.startingDate}
                  />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="Ending Date" />
                  <DatePickerField
                    value={form.endingDate}
                    onChange={set('endingDate')}
                    placeholder="dd-mm-yyyy"
                    error={errors.endingDate}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.col}>
                  <FieldLabel label="Start Time" required />
                  <TimePickerField
                    value={form.startTime}
                    onChange={set('startTime')}
                    placeholder="--:--"
                    error={errors.startTime}
                  />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="End Time" required />
                  <TimePickerField
                    value={form.endTime}
                    onChange={set('endTime')}
                    placeholder="--:--"
                    error={errors.endTime}
                  />
                </View>
              </View>
            </View>

          </View>

          <View style={[styles.column, isTablet && { flex: 0.9 }]}>

            <View style={styles.card}>
              <SectionHeader icon="document-text-outline" label="Terms & Description" color="#EF4444" />
              <FieldLabel label="Offer Rate per Hour (₹)" required />
              <InputField
                placeholder="0.00"
                value={form.offerRate}
                onChangeText={set('offerRate')}
                prefix="₹"
                keyboardType="decimal-pad"
                error={errors.offerRate}
              />

              <View style={{ height: 16 }} />

              <FieldLabel label="Duty Description" required />
              <InputField
                placeholder="Briefly describe the responsibilities, department specifics..."
                value={form.dutyDescription}
                onChangeText={set('dutyDescription')}
                multiline
                error={errors.dutyDescription}
              />
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.infoText}>
                {isEditMode
                  ? 'Editing this duty will update it for all staff members who can see it. Changes take effect immediately.'
                  : "Once published, this duty will be visible to all eligible staff members in the Hospilink Staff app. You can edit or retract the duty as long as it hasn't been claimed."}
              </Text>
            </View>

          </View>
        </View>

      </ScrollView>
      <Toast visible={toastVisible} message={toastMsg} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FB', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },

  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  headerTextCol: { flex: 1, minWidth: 200 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#9CA3AF' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EF4444', minWidth: 120, alignItems: 'center' },
  publishText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // API Error Banner
  apiErrorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', marginBottom: 20 },
  apiErrorBannerText: { flex: 1, fontSize: 14, color: '#B91C1C', fontWeight: '500' },

  mainGrid: { flexDirection: 'column', gap: 20 },
  mainGridTablet: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, gap: 20 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  overtimePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 6 },
  overtimePillText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  row2: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  col: { flex: 1 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 8 },

  // ── Locked urgency field ──
  urgencyLocked: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FEF2F2',
  },
  urgencyLockedText: { fontSize: 13, fontWeight: '600', color: '#EF4444', flex: 1 },

  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  dropdownFocused: { borderColor: '#EF4444' },
  dropdownText: { fontSize: 13, color: '#111827', flex: 1, marginRight: 6 },
  dropdownPlaceholder: { color: '#9CA3AF' },

  dropdownList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 12, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, height: 44, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemActive: { backgroundColor: '#FEF2F2' },
  dropdownItemText: { fontSize: 13, color: '#374151', flex: 1 },
  dropdownItemTextActive: { color: '#EF4444', fontWeight: '700' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#fff' },
  inputPrefix: { fontSize: 13, color: '#6B7280', marginRight: 4 },
  input: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: Platform.OS === 'ios' ? 12 : 10, ...Platform.select({ web: { outlineWidth: 0 } as any }) },
  inputMulti: { minHeight: 140, paddingTop: 12 },

  inputErrorBorder: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 },

  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dateModalBox: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dateModalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dateModalCancel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  dateModalDone: { fontSize: 14, color: '#EF4444', fontWeight: '700' },

  infoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#EF4444', borderRadius: 8, padding: 16, alignItems: 'center' },
  infoIconWrap: { width: 24, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: '#fff', lineHeight: 20 },

  toast: { position: 'absolute', bottom: 36, left: 20, right: 20, backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 8 },
  toastText: { fontSize: 14, color: '#fff', fontWeight: '600', flex: 1 },
});