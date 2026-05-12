export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH";
export type DutyStatus = "ACCEPTED" | "PENDING" | "COMPLETED" | "ENROUTE";

export interface DutyCard {
  id: string;
  staffRole: string;
  doctorName: string;
  status: DutyStatus;
  urgency: UrgencyLevel;
  distance: string;
  startTime: string;
  endTime: string;
  rate: string;
  date: string;
  hospitalName: string;
  hospitalAddress: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export interface DutyRouteApiResponse {
  success: boolean;
  job: {
    id: string;
    staffRole: string;
    date: string;
    startTime: string;
    endTime: string;
    urgency: string;
    description: string;
    offeredRate: number;
  };
  hospital: {
    id: string;
    name: string;
    address: string;
    location: { latitude: number; longitude: number };
  };
  staffLocation: { latitude: number; longitude: number };
  route: {
    overviewPolyline: string;
    stepPolylines: string[];
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
    steps: RouteStep[];
  };
  tracking: {
    sessionId: string;
    websocketRoom: string;
    hospitalTrackingRoom: string;
    updateInterval: number;
    arrivalThreshold: number;
  };
}


// For map view 
// src/types/doctor.types.ts

export type RangeKm = 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 100 ;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: GeoLocation;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience: number;       // years
  rating: number;           // out of 5.0
  reviewCount: number;
  available: boolean;       // true = available right now
  consultationFee: number;  // INR
  phone: string;
   email: string;  
  location: GeoLocation;

}

/** Doctor enriched with computed distance — used in UI */
export interface DoctorWithDistance extends Doctor {
  distanceKm: number;
  distanceText: string;
}



//for hopital side live tracking
// API response types — match exactly what backend returns
export interface StaffLocation {
  latitude: number;
  longitude: number;
}

export interface StaffUser {
  _id: string;
  name: string;
  role: string;
  email: string;
  isEmailVerified: boolean;
}

export interface StaffMember {
  // _id: string;
  // user: StaffUser;
  // fullName: string;
  // jobRole: string;
  // city: string;
  // area: string;
  // phoneNumber: string;
  // isAvailable: boolean;
  // distance: number;          // already in km — comes from API
  // averageRating?: number;
  // location: StaffLocation;

  _id: string;
  user: { _id: string; name: string; email: string } | null;  // ← must allow null
  fullName: string;
  jobRole: string;
  phoneNumber: string;
  isAvailable: boolean;
  distance: number;
  location: { latitude: number; longitude: number };
  coordinates: { type: string; coordinates: { latitude: number; longitude: number } };
  city: string;
  state: string;
  pincode: string;
  averageRating: number;
}

// export interface NearbyStaffResponse {
//   // success: boolean;
//   // hospital: {
//   //   name: string;
//   //   location: StaffLocation;
//   // };
//   // searchRadius: number;
//   // totalStaffFound: number;
//   // staff: StaffMember[];
//   // message: string;
//   success: boolean;
//   hospital: {
//     name: string;
//     location: { latitude: number; longitude: number };
//     address: { currentAddress: string; city: string; state: string; pincode: string };
//   };
//   staff: StaffMember[];
//   totalStaffFound: number;   
//   searchRadius: number;
//   message: string;
// }

// ── Nearby Staff API (profile side) ──────────────────────────────────────────

export interface NearbyStaffMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  phone: string;
  rating: number;
  isAvailable: boolean;
  verificationStatus: string;
  distance: number;           // km
  distanceText: string;       // e.g. "6.7 km"
  estimatedTime: number;      // minutes
  estimatedTimeText: string;  // e.g. "15 mins"
  availabilityStatus: string;
  hasActiveDuty: boolean;
  hasUpcomingDuty: boolean;
  address: {
    currentAddress: string;
    city: string;
    state: string;
    pincode: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface NearbyStaffResponse {
  success: boolean;
  cached: boolean;
  data: {
    hospital: {
      id: string;
      name: string;
      address: {
        currentAddress: string;
        city: string;
        state: string;
        pincode: string;
      };
      location: {
        latitude: number;
        longitude: number;
      };
    };
    search: {
      radius: number;
      roleFilter: string;
      totalFound: number;
    };
    staff: NearbyStaffMember[];
    summary: {
      totalStaff: number;
      fullyAvailable: number;
      hasUpcomingDuties: number;
      hasActiveDuties: number;
    };
  };
  message: string;
  timestamp: string;
}