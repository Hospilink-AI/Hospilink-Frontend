// src/utils/distanceDecoder.ts

import { Doctor, DoctorWithDistance, Hospital, RangeKm } from '../types/duty';
import { StaffMember } from '../types/duty'; 
import { NearbyStaffMember } from '../types/duty';
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
  .map((doc) => {
    const distanceKm = getDistanceKm(
      hospital.location.latitude,
      hospital.location.longitude,
      doc.location.latitude,
      doc.location.longitude,
    );
    return {
      ...doc,
      distanceKm,
      distanceText: `${distanceKm.toFixed(1)} km`, // ✅ added
    };
  })
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


export function adaptStaffToDoctor(staff: NearbyStaffMember): DoctorWithDistance {
  return {
    id: staff.id,
    name: staff.name,
    specialty: staff.formattedRole || staff.role,
    phone: staff.phone ?? '',
    email: staff.email ?? '',
    contactHidden: !!staff.contactHidden,
    approximate: !!staff.location.approximate,
    precisionKm: staff.location.precisionKm,
    available: staff.isAvailable === true,
    distanceKm: staff.distance,
    distanceText: staff.distanceText,
    location: {
      latitude: staff.location.latitude,
      longitude: staff.location.longitude,
      // the street address is hidden while positions are rounded: show the area instead
      address: staff.address?.currentAddress || [staff.address?.city, staff.address?.pincode].filter(Boolean).join(' '),
    },
    // Doctor base fields — set defaults since API doesn't return these
    qualification: '',
    experience: 0,
    rating: staff.rating,
    reviewCount: 0,
    consultationFee: 0,
  };
}

/** "lab_technician" → "Lab Technician" */
function formatJobRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}


/**
 * Slightly offset markers sharing identical coordinates
 * so they fan out and stay individually clickable on the map.
 */

type WithLocation = {
  location: { latitude: number; longitude: number };
  approximate?: boolean;
};

export function jitterDuplicates<T extends WithLocation>(items: T[]): T[] {
  const seen = new Map<string, number>();

  return items.map((item) => {
    // rounded positions are shared on purpose; the map groups them into one area instead
    if (item.approximate) return item;
    const key = `${item.location.latitude.toFixed(6)},${item.location.longitude.toFixed(6)}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);

    if (count === 0) return item;

    const angle = (count * 137.5 * Math.PI) / 180;
    const radius = 0.00015 * count;

    return {
      ...item,
      location: {
        ...item.location,
        latitude:  item.location.latitude  + radius * Math.cos(angle),
        longitude: item.location.longitude + radius * Math.sin(angle),
      },
    };
  });
}