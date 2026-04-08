// src/utils/distanceDecoder.ts

import { Doctor, DoctorWithDistance, Hospital, RangeKm } from '../types/duty';
import { StaffMember } from '../types/duty'; 
/**
 * Haversine formula — returns straight-line distance in km
 * between two lat/lng coordinates.
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Filter doctors within `rangeKm` of the hospital
 * and attach the computed distance to each result.
 */
export function filterDoctorsByRange(
  doctors: Doctor[],
  hospital: Hospital,
  rangeKm: RangeKm,
): DoctorWithDistance[] {
  return doctors
    .map((doc) => ({
      ...doc,
      distanceKm: getDistanceKm(
        hospital.location.latitude,
        hospital.location.longitude,
        doc.location.latitude,
        doc.location.longitude,
      ),
    }))
    .filter((doc) => doc.distanceKm <= rangeKm)
    .sort((a, b) => a.distanceKm - b.distanceKm); // closest first
}

/** Get initials from a doctor's name for avatar fallback */
export function getInitials(name: string): string {
  return name
    .replace('Dr. ', '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}



export function adaptStaffToDoctor(staff: StaffMember): DoctorWithDistance {
  return {
    id: staff._id,
    name: staff.fullName,
    specialty: formatJobRole(staff.jobRole),
    qualification: '',
    experience: 0,
    rating: staff.averageRating ?? 0,
    reviewCount: 0,
    available: staff.isAvailable,
    consultationFee: 0,
    phone: staff.phoneNumber,
    distanceKm: staff.distance,  // ✅ API already sends km directly
    email:staff.user.email,
    location: {
      latitude: staff.location.latitude,
      longitude: staff.location.longitude,
      address: `${staff.area}, ${staff.city}`,
    },
  };
}

/** "lab_technician" → "Lab Technician" */
function formatJobRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}