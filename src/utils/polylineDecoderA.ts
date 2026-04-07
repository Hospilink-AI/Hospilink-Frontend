export const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: '#94A3B8',
    posted: '#94A3B8',
    assigned: '#3B82F6',
    enroute: '#F59E0B',
    'in-progress': '#10B981',
    completed: '#6366F1',
  };
  return colors[status?.toLowerCase()] ?? '#94A3B8';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: 'Available',
    posted: 'Posted',
    assigned: 'Assigned',
    enroute: 'En Route',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[status?.toLowerCase()] ?? status;
};

export const getUrgencyColor = (urgency: string): string => {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  };
  return colors[urgency?.toLowerCase()] ?? '#94A3B8';
};

export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (time: string | Date): string =>
  new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export const formatCurrency = (amount: number, currency = '₹'): string =>
  `${currency}${amount.toLocaleString('en-IN')}`;

export const calculateETA = (durationMinutes: number): Date =>
  new Date(Date.now() + durationMinutes * 60000);

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} mins`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getTimeAgo = (timestamp: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const isValidCoordinate = (lat: number, lng: number): boolean =>
  typeof lat === 'number' && typeof lng === 'number' &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export const getCenterPoint = (lat1: number, lng1: number, lat2: number, lng2: number): [number, number] =>
  [(lat1 + lat2) / 2, (lng1 + lng2) / 2];

export const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const formatRole = (role: string): string =>
  role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const getStatusSteps = (): string[] =>
  ['available', 'assigned', 'enroute', 'in-progress', 'completed'];

export const getStatusIndex = (status: string): number =>
  getStatusSteps().indexOf(status?.toLowerCase());

export const isStatusCompleted = (currentStatus: string, checkStatus: string): boolean =>
  getStatusIndex(currentStatus) >= getStatusIndex(checkStatus);

export const generateId = (length = 8): string =>
  Math.random().toString(36).substring(2, 2 + length).toUpperCase();

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const checkIsWeb = (): boolean =>
  typeof window !== 'undefined' && !!window.document;

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91'))
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  return phone;
};

export const truncateText = (text: string, maxLength = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const sortDuties = (duties: any[]): any[] => {
  const urgencyWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const statusWeight: Record<string, number> = {
    'in-progress': 4, enroute: 3, assigned: 2, available: 1, completed: 0,
  };
  return [...duties].sort((a, b) => {
    const statusDiff = (statusWeight[b.status?.status] ?? 0) - (statusWeight[a.status?.status] ?? 0);
    if (statusDiff !== 0) return statusDiff;
    return (urgencyWeight[b.timing?.urgency] ?? 0) - (urgencyWeight[a.timing?.urgency] ?? 0);
  });
};

export default {
  decodePolyline, calculateDistance, getStatusColor, getStatusLabel,
  getUrgencyColor, formatDate, formatTime, formatCurrency, calculateETA,
  formatDuration, getTimeAgo, isValidCoordinate, getCenterPoint, debounce,
  formatRole, getStatusSteps, getStatusIndex, isStatusCompleted, generateId,
  deepClone, isMobile, checkIsWeb, formatPhoneNumber, truncateText, sortDuties,
};
