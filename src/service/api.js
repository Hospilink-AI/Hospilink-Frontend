import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const AGENT_URL = process.env.EXPO_PUBLIC_AGENT_URL;
console.log("API_URL =", API_URL);
console.log("AGENT_URL =", AGENT_URL);

// Creating an instance of axios with the base URL from env variables

const api = axios.create({
  // baseURL: 'https://api.hospilink.in',
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const apiAgent = axios.create({
  // baseURL: 'https://api.hospilink.in',
  baseURL: AGENT_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Helper functions ─────────────────────────────
const getToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("hospilink_token");
  } else {
    return await AsyncStorage.getItem("hospilink_token");
  }
};

const clearStorage = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem("hospilink_token");
    localStorage.removeItem("hospilink_user");
  } else {
    await AsyncStorage.removeItem("hospilink_token");
    await AsyncStorage.removeItem("hospilink_user");
  }
};

// ─── REQUEST INTERCEPTOR ──────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // ✅ async safe

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiAgent.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // ✅ async safe

    console.log("API AGENT TOKEN:", token);
    console.log("API AGENT URL:", config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);



// ─── RESPONSE INTERCEPTOR ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {

      const requestUrl = error.config?.url || "";

      //  Skip redirect for OTP routes — let the screen handle the error
      const isOtpRoute =
        requestUrl.includes("verify-otp") ||
        requestUrl.includes("resend-otp") ||
        requestUrl.includes("forgot-password")||
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/signup");

      if (isOtpRoute) {
        return Promise.reject(error); // pass error back to the screen's catch block
      }

      //  Token invalid / expired — clear and redirect
      await clearStorage();

      if (Platform.OS === "web") {
        //  Redirect admin vs regular users to the correct login page
        const isAdmin = requestUrl.includes("/admin/");
        window.location.href = isAdmin ? "/auth/admin/login" : "/auth/login?tab=signin";
      } else {
        console.log("Session expired. Redirect to login manually.");
      }
    }

    return Promise.reject(error);
  }
);


apiAgent.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("INTERCEPTOR HIT");
    console.log("STATUS =", error.response?.status);
    console.log("DATA =", error.response?.data);

    if (error.response?.status === 403) {
      const message = error.response?.data?.message || "";

      console.log("403 RESPONSE:", error.response?.data);

      if (message.toLowerCase().includes("suspend")) {
        window.location.replace("/auth/accountsuspended");
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      console.log(
        "Agent API Unauthorized:",
        error.config?.url
      );

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);



// Authentication API calls
export const authAPI = {
  // Sign up
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role, // 'staff' or 'hospital'
    });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/api/auth/verify-otp', {
      email,
      otp,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post('/api/auth/resend-otp', {
      email,
    });
    return response.data;
  },

  // Sign in
  // signin: async (email, password) => {
  //   const response = await api.post('/api/auth/signin', {
  //     email,
  //     password,
  //   });
  //   return response.data;
  // },
  signin: async (email, password) => {
    try {
      const response = await api.post('/api/auth/signin', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.log('Signin Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },


  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  adminLogout: async () => {
    const response = await api.post('api/admin/logout')
    return response.data;
  },

  // Forgot Password — sends reset link to email
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
    // returns: { success: true, message: "If this email is registered, a reset link has been sent." }
  },

  // Reset Password — uses token from email link + new password
  // resetPassword: async (token, newPassword) => {
  //   const response = await api.post('/api/auth/reset-password', { token, newPassword });
  //   return response.data;
  //   // returns: { success: true, message: "Password reset successful. Please sign in with your new password." }
  // },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/api/auth/reset-password', {
      token,
      newPassword,
      confirmPassword  // ← API requires this field
    });
    return response.data;
  }
};

// Profile API's 
export const profileAPI = {

  // POST /api/profile/medical-staff  (with preCapturedLocation)
  // createMedicalStaffProfileWithLocation: async (profileData) => {
  //   const response = await api.post('/api/profile/medical-staff', {
  //     fullName: profileData.fullName,
  //     jobRole: profileData.jobRole,          // snake_case e.g. "general_surgeon"
  //     city: profileData.city,
  //     area: profileData.area,
  //     phoneNumber: profileData.phoneNumber,      // "+91XXXXXXXXXX"
  //     preCapturedLocation: profileData.preCapturedLocation, // { latitude, longitude }
  //   });
  //   return response.data;
  // },



  createMedicalStaffProfileWithLocation: async (profileData) => {
    const response = await api.post('/api/profile/medical-staff', {
      fullName: profileData.fullName,
      jobRole: profileData.jobRole,
      city: profileData.city,
      area: profileData.area,
      phoneNumber: profileData.phoneNumber,
      preCapturedLocation: profileData.preCapturedLocation,
      profileSummary: profileData.profileSummary,
      education: profileData.education,
      skills: profileData.skills,
    });
    return response.data;
  },
  // Create medical staff profile
  createMedicalStaffProfile: async (profileData) => {
    const response = await api.post('/api/profile/medical-staff', profileData);
    return response.data;
  },

  // Create hospital profile
  createHospitalProfile: async (profileData) => {
    const response = await api.post('/api/profile/hospital', profileData);
    return response.data;
  },

  // Get current user profile
  getMyProfile: async () => {
    const response = await api.get('/api/profile/me');
    return response.data;
  },

  // Get Staff overview
  getStaffOverview: async () => {
    const response = await api.get('/api/dashboard/overview');
    return response.data;
  },

  // Update profile
  // updateMyProfile: async (profileData) => {
  //   const response = await api.put('/api/profile/me', profileData);
  //   return response.data;
  // },

  updateMyProfile: async (profileData) => {
    const response = await api.put('/api/profile/me', {
      ...profileData, // spreads everything: fullName, jobRole, city, area, phoneNumber,
      // profileSummary, education, skills
    });
    return response.data;
  },

  // Check profile completion status
  checkProfileStatus: async () => {
    const response = await api.get('/api/profile/status');
    return response.data;
  },

  // Get available services for hospitals
  getAvailableServices: async () => {
    const response = await api.get('/api/profile/services');
    return response.data;
  },

  // Toggle medical staff availability status
  toggleMedicalStaffAvailability: async (isAvailable) => {
    const response = await api.patch('/api/profile/staff-availability', { isAvailable });
    return response.data;
  },

  // Get medical staff statistics
  getStaffStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  // Handles both permissionGranted: true (with coords) and false (without coords)
  checkLocationPermission: async (permissionGranted, latitude = null, longitude = null) => {
    const payload = permissionGranted
      ? { latitude, longitude, permissionGranted: true }
      : { permissionGranted: false };

    const response = await api.post('/api/profile/check-location-permission', payload);
    return response.data;
  },

  // Send dashboard location permission status
  // sendDashboardLocationPermission: async (permissionGranted, latitude = null, longitude = null) => {
  //   const payload = permissionGranted
  //     ? { permissionGranted: true, latitude, longitude }
  //     : { permissionGranted: false };

  //   const response = await api.post('/api/profile/dashboard/location-permission', payload);
  //   return response.data;
  // },

  sendDashboardLocationPermission: async (permissionGranted) => {
    const payload = { permissionGranted };
    const response = await api.post('/api/profile/dashboard/location-permission', payload);
    return response.data;
  },

  // Get earnings data for dashboard
  getEarnings: async () => {
    const response = await api.get('/api/dashboard/earnings');
    return response.data;
  },

  uploadProfilePicture: async (imageUri) => {
    console.log("API CALLED: uploadProfilePicture");

    // 1. Get Token
    const token = Platform.OS === "web"
      ? localStorage.getItem("hospilink_token")
      : await AsyncStorage.getItem("hospilink_token");

    const formData = new FormData();
    const fieldName = "profilePicture"; // Matches your backend / Postman

    // 2. Format File Payload (Web vs Native)
    if (Platform.OS === "web") {
      const res = await fetch(imageUri);
      const rawBlob = await res.blob();
      const mimeType = rawBlob.type || "image/jpeg";
      const ext = mimeType.split("/")[1] || "jpg";

      const correctedBlob = new Blob([rawBlob], { type: mimeType });
      formData.append(fieldName, correctedBlob, `profile.${ext}`);
    } else {
      // Extract filename and type for native
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append(fieldName, {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type: type,
      });
    }

    try {
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const res = await fetch(`${baseUrl}/api/profile/profile-picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw { response: { data } };
      return data;
    } catch (error) {
      throw error;
    }
  },

  // deleteProfilePicture: async () => {
  //   const token = Platform.OS === "web"
  //     ? localStorage.getItem("hospilink_token")
  //     : await AsyncStorage.getItem("hospilink_token");

  //   try {
  //     const res = await fetch(`https://hospilink-backend.vercel.app/api/profile/delete-picture`, {
  //       method: "DELETE",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw { response: { data } };
  //     return data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  deleteProfilePicture: async () => {
    const token = Platform.OS === "web"
      ? localStorage.getItem("hospilink_token")
      : await AsyncStorage.getItem("hospilink_token");

    try {
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const res = await fetch(`${baseUrl}/api/profile/delete-picture`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw { response: { data } };
      return data;
    } catch (error) {
      throw error;
    }
  },

  getStaffAvailability: async () => {
    const response = await api.get('api/hospital-dashboard/staff-stats');
    return response.data;
  },

  getSkills: async () => {
    try {
      const response = await api.get('/api/profile/skills');
      return response.data;
    } catch (error) {
      console.error("Error fetching skills:", error);
      throw error;
    }
  },

  // POST /api/profile/skills 
  // Use this when the user's skill list is currently empty
  addSkills: async (skillsArray) => {
    try {
      const response = await api.post('/api/profile/skills', { skills: skillsArray });
      return response.data;
    } catch (error) {
      console.error("Error adding skills:", error);
      throw error;
    }
  },

  // PATCH /api/profile/skills
  // Use this when the user already has skills and you are adding more
  updateSkills: async (skillsArray) => {
    try {
      const response = await api.patch('/api/profile/skills', { skills: skillsArray });
      return response.data;
    } catch (error) {
      console.error("Error updating skills:", error);
      throw error;
    }
  },

  sendPhoneOTP: async (phoneNumber) => {
    const response = await api.post('/api/profile/send-phone-otp', { phoneNumber });
    return response.data;
  },

  verifyPhoneOTP: async (phoneNumber, otp) => {
    const response = await api.post('/api/profile/verify-phone-otp', { phoneNumber, otp });
    return response.data;
  },

}




// Duty API calls
export const dutyAPI = {
  // Create duty (for hospitals)
  createDuty: async (dutyData) => {
    const response = await api.post('/api/hospitals/current/duties', dutyData);
    console.log(response);
    return response.data;
  },

  requestStartOtp: async (dutyId) => {
    const response = await api.post(`/api/duties/${dutyId}/request-start-otp`);
    return response.data;
  },
 
  // POST /api/duties/:id/verify-start-otp
  // Body: { otp: "123456" }
  // On success, backend should flip duty status to "in-progress".
  verifyStartOtp: async (dutyId, otp) => {
    const response = await api.post(`/api/duties/${dutyId}/verify-start-otp`, {
      otp,
    });
    return response.data;
  },
 
  // POST /api/duties/:id/request-end-otp
  // No body required (per reference: Content-Type "None").
  requestEndOtp: async (dutyId) => {
    const response = await api.post(`/api/duties/${dutyId}/request-end-otp`);
    return response.data;
  },

  // POST /api/duties/:id/verify-end-otp
  // Body: { otp: "123456", paymentMethod: "cash", isPaid: true }
  // On success, backend should flip duty status to "completed".
  verifyEndOtp: async (dutyId, payload) => {
    const response = await api.post(`/api/duties/${dutyId}/verify-end-otp`, payload);
    return response.data;
  },
 

  // resent otp for start duty and end duty 
  resendOtp: async (dutyId, otpType) => {
  const response = await api.post(`/api/duties/${dutyId}/resend-otp`, { otpType });
  return response.data;
},

  getDuty: async (dutyId) => {
    const response = await api.get(`/api/duties/${dutyId}`);
    return response.data;
  },

  // Get duties
  // Fetch available duties for the logged-in staff member

  getAvailableDuties: async () => {
    const getLocation = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ permission: "denied", location: null });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              permission: "granted",
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            });
          },
          () => {
            resolve({ permission: "denied", location: null });
          }
        );
      });
    };

    const { permission, location } = await getLocation();

    const params = { locationPermission: permission };

    if (permission === "granted" && location) {
      params.currentLocation = JSON.stringify(location);
    }

    // const response = await api.get("/api/duties/available", { params });
    const response = await api.get("/api/duties/available");
    return response.data;
  },


  //  For hospitals:Get all duties posted by the logged-in hospital
  getPublishedDuties: async () => {
    const response = await api.get('/api/duties-published');
    return response.data;
  },

  getPublishedDutiesH: async (filters = {}) => {
    // filters could be { status: 'completed', staffRole: 'staff_nurse', page: 1, limit: 10 }
    const response = await api.get('/api/duties/history', { params: filters });
    return response.data;
  },

  // For updating duty, edit duty details (for hospital)
  updatePublishedDuty: async (dutyId, updatedData) => {
    const response = await api.patch(`/api/duties/${dutyId}`, updatedData);
    return response.data;
  },

  // Get my upcoming duties (accepted duties)
  getMyUpcomingDuties: async () => {
    const getLocation = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ permission: "denied", location: null });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              permission: "granted",
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            });
          },
          () => {
            resolve({ permission: "denied", location: null });
          }
        );
      });
    };

    const { permission, location } = await getLocation();

    const params = { locationPermission: permission };

    if (permission === "granted" && location) {
      params.currentLocation = JSON.stringify(location);
    }

    const response = await api.get("/api/duties/my-upcoming");
    return response.data;
  },

  //  For Cancel duty ( for hospital) //
  cancelPublishedDuty: async (dutyId, reason = 'emergency_resolved', reasonText) => {
    const response = await api.patch(`/api/duties/${dutyId}/cancel`, { reason, ...(reasonText && { reasonText }) });
    return response.data;
  },

  submitReview: async (payload) => {
    const response = await api.post('/api/reviews/submit', payload);
    return response.data;
  },


  // Get Ongoing duties
  getOngoingDuties: async () => {
    const res = await api.get("/api/duties/ongoing");
    return res.data;
  },

  // Get ongoing duties
  getActiveDuty: async () => {
    const response = await api.get('/api/duties/ongoing');
    return response.data;
  },

  // Accept duty (for staff)
  acceptDuty: async (dutyId) => {
    // The backend route expects /staff/:id/accept-duty but uses req.user.id from JWT
    // So we can use any placeholder for staff id since it's not used
    const response = await api.post('/api/staff/accept-duty', {
      duty_id: dutyId,
    });
    return response.data;
  },

  // Update duty status (for staff)
  updateDutyStatus: async (dutyId, status) => {
    const response = await api.patch('/api/duties/status', {
      duty_id: dutyId,
      status: status,
    });
    return response.data;
  },

  // Get all completed duty history for staff
  getCompletedDuties: async (params = {}) => {
    const response = await api.get('/api/completed-duties', { params });
    return response.data;
  },

  // Get route for a duty (map navigation)
  // POST /api/duties/:id/route
  // Body: { locationPermission: "granted", currentLocation: { latitude, longitude } }
  getDutyRoute: async (dutyId, currentLocation) => {
    const response = await api.post(`/api/duties/${dutyId}/route`, {
      locationPermission: "granted",
      currentLocation: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
    });
    return response.data;
  },

  // For hospitals for live tracking 
  // getNearbyStaff: async (radiusKm = 5) => {
  //   const response = await api.get(`/api/profile/nearby-staff?radius=${radiusKm}`);
  //   return response.data;
  // },

  getNearbyStaff: async (radius = 5, role = '') => {
    let url = `/api/profile/nearby-staff?radius=${radius}`;
    if (role && role !== '') {
      url += `&role=${role}`;
    }
    const response = await api.get(url);
    return response.data; // returns { success, cached, data: { hospital, staff } }
  },

  // Live location monitoring APIs
  updateLiveLocation: async (latitude, longitude) => {
    const response = await api.post('/api/location/update', { latitude, longitude });
    return response.data;
  },

  startLocationTracking: async (dutyId) => {
    const response = await api.post(`/api/duties/${dutyId}/start-tracking`);
    return response.data;
  },

  stopLocationTracking: async (dutyId) => {
    const response = await api.post(`/api/duties/${dutyId}/stop-tracking`);
    return response.data;
  },

  getStaffLiveLocation: async (staffId) => {
    const response = await api.get(`/api/location/staff/${staffId}`);
    return response.data;
  },

  getHospitalActiveDuties: async ({ params }) => {
    const response = await api.get('api/duties/active-duties', { params })
    return response.data;
  },

  getTrackHospitalStaffLocation: async (dutyId) => {
    const response = await api.get(`api/duties/duty-route-map/${dutyId}`);
    return response.data;
  },

  // PATCH /api/admin/duties/:id/unlock-otp
  // Body: { otpType: "start" | "end", reason: string }
  unlockOtp: async (dutyId, otpType, reason) => {
    const response = await api.patch(`/api/admin/duties/${dutyId}/unlock-otp`, {
      otpType,
      reason,
    });
    return response.data;
  },

  // PATCH /api/admin/duties/:id/admin-override
  // Body: { status: string, reason: string }
  changeAdminStatus: async (dutyId, status, reason) => {
    const response = await api.patch(`/api/admin/duties/${dutyId}/admin-override`, {
      status,
      reason,
    });
    return response.data;
  },


};


// SSE parser helper — extracts the final result event from a stream string
const parseSSEResult = (raw) => {
  const blocks = raw.split(/\n\n/).filter(Boolean);
  for (const block of blocks.reverse()) { // last matching event wins
    const eventLine = block.match(/^event:\s*(.+)/m);
    const dataLine = block.match(/^data:\s*(.+)/m);
    if (eventLine?.[1] === 'result' && dataLine) {
      return JSON.parse(dataLine[1]);
    }
  }
  return null;
};

// Vacancy / Jobs API calls
export const vacancyAPI = {

  // GET /api/agent/v1/jobs — paginated, optional role/location filters
  getJobs: async (params = {}) => {
    const { role = '', location = '', page = 1 } = params;
    const response = await apiAgent.get('/v1/jobs', {
      params: {
        page,
        ...(role.trim() && { role: role.trim() }),
        ...(location.trim() && { location: location.trim() }),
      },
    });
    return response.data;
    // Returns: { status: 'success', data: { pagination: {...}, jobs: [...] } }
  },


  // GET /api/agent/v1/jobs?role=X
  getJobsByRole: async (role, page = 1) => {
    const response = await apiAgent.get('/v1/jobs', {
      params: { role, page },
    });
    return response.data;
  },

  // GET /api/agent/v1/jobs?location=X
  getJobsByLocation: async (location, page = 1) => {
    const response = await apiAgent.get('/api/agent/v1/jobs', {
      params: { location, page },
    });
    return response.data;
  },

  // GET /api/agent/v1/jobs?role=X&location=Y
  getJobsByRoleAndLocation: async (role, location, page = 1) => {
    const response = await apiAgent.get('/api/agent/v1/jobs', {
      params: { role, location, page },
    });
    return response.data;
  },

  // GET /api/agent/v1/search/stream?role=X&location=Y
  // SSE stream — returns aggregated result when complete

  // GET /api/agent/v1/search/stream — AI-powered SSE, parses final result event
  getSearchStream: async (role, location) => {
    const response = await api.get('/api/agent/v1/search/stream', {
      params: { role, location },
      timeout: 60000,        // stream takes longer than default 30s
      responseType: 'text',  // treat SSE as raw text, not JSON
    });
    const result = parseSSEResult(response.data);
    if (!result) throw new Error('Stream ended without a result event');
    return result;
    // Returns parsed data from the final SSE `event: result` block
  },

};

// Permanent jobs - hospital-posted vacancies, applications and interviews
export const jobAPI = {

  // ─── Vacancies ────────────────────────────────────────────

  // POST /api/vacancy
  // Body: { title, specialty, experience?, education?, skills?, location?, salary?, description }
  createVacancy: async (payload) => {
    const response = await api.post('/api/vacancy', payload);
    return response.data;
  },

  // GET /api/vacancies/posted - hospital's own, including closed
  getPostedVacancies: async (page = 1, limit = 10) => {
    const response = await api.get('/api/vacancies/posted', { params: { page, limit } });
    return response.data;
  },

  // GET /api/vacancies - match-sorted for staff
  getVacancies: async (params = {}) => {
    const { specialty, location, page = 1, limit = 10 } = params;
    const response = await api.get('/api/vacancies', {
      params: { page, limit, ...(specialty && { specialty }), ...(location && { location }) },
    });
    return response.data;
  },

  // GET /api/vacancies/:id
  getVacancy: async (vacancyId) => {
    const response = await api.get(`/api/vacancies/${vacancyId}`);
    return response.data;
  },

  // PATCH /api/vacancies/:id - partial edit
  updateVacancy: async (vacancyId, payload) => {
    const response = await api.patch(`/api/vacancies/${vacancyId}`, payload);
    return response.data;
  },

  // PATCH /api/vacancies/:id/close - 409 if an interview is confirmed
  closeVacancy: async (vacancyId) => {
    const response = await api.patch(`/api/vacancies/${vacancyId}/close`);
    return response.data;
  },

  // ─── Applications ─────────────────────────────────────────

  // POST /api/vacancies/:id/apply - no body, uses the resume on file
  apply: async (vacancyId) => {
    const response = await api.post(`/api/vacancies/${vacancyId}/apply`);
    return response.data;
  },

  // GET /api/vacancies/:id/applications
  getApplicants: async (vacancyId, params = {}) => {
    const { status, page = 1, limit = 10 } = params;
    const response = await api.get(`/api/vacancies/${vacancyId}/applications`, {
      params: { page, limit, ...(status && { status }) },
    });
    return response.data;
  },

  // GET /api/applications/mine
  getMyApplications: async (params = {}) => {
    const { status, page = 1, limit = 10 } = params;
    const response = await api.get('/api/applications/mine', {
      params: { page, limit, ...(status && { status }) },
    });
    return response.data;
  },

  // GET /api/applications/:applicationId
  getApplication: async (applicationId) => {
    const response = await api.get(`/api/applications/${applicationId}`);
    return response.data;
  },

  // GET /api/applications/:applicationId/resume - 422 if no masked preview
  getResume: async (applicationId) => {
    const response = await api.get(`/api/applications/${applicationId}/resume`);
    return response.data;
  },

  // PATCH /api/applications/:applicationId/status
  // Body: { status: under_review | shortlisted | rejected, reason?, reasonText? }
  updateStatus: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/status`, payload);
    return response.data;
  },

  // PATCH /api/applications/:applicationId/withdraw - Body: { reason, reasonText? }
  withdraw: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/withdraw`, payload);
    return response.data;
  },

  // ─── Interview ────────────────────────────────────────────

  // POST .../interview/offer-slots - Body: { slots: [{ start, end }], durationMinutes? }
  offerSlots: async (applicationId, payload) => {
    const response = await api.post(`/api/applications/${applicationId}/interview/offer-slots`, payload);
    return response.data;
  },

  // PATCH .../slots/select - Body: { picks: [{ start, end }] }
  selectSlots: async (applicationId, picks) => {
    const response = await api.patch(`/api/applications/${applicationId}/slots/select`, { picks });
    return response.data;
  },

  // POST .../interview/confirm
  // Body: { slotStart, slotEnd, meetingLink, interviewerName, interviewerDesignation }
  // 409: { blockedSlot, remainingPicks, needsReoffer }
  confirmInterview: async (applicationId, payload) => {
    const response = await api.post(`/api/applications/${applicationId}/interview/confirm`, payload);
    return response.data;
  },

  // PATCH .../interview/cancel-offer - Body: { reason, reasonText? }
  cancelOffer: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/interview/cancel-offer`, payload);
    return response.data;
  },

  // GET /api/interview/config - staff or hospital. Live interview rules (slot counts, windows, caps)
  getInterviewConfig: async () => {
    const response = await api.get('/api/interview/config');
    return response.data;
  },

  // PATCH .../interview/reschedule - Body: { slots, durationMinutes?, reason, reasonText? }
  reschedule: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/interview/reschedule`, payload);
    return response.data;
  },

  // PATCH .../interview/cancel - staff or hospital. Body: { reason, reasonText? }
  cancelInterview: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/interview/cancel`, payload);
    return response.data;
  },

  // PATCH .../interview/reschedule-request - staff. Body: { reason, reasonText? }
  requestReschedule: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/interview/reschedule-request`, payload);
    return response.data;
  },

  // PATCH .../interview/meeting-link
  // Body: { meetingLink, interviewerName?, interviewerDesignation? }
  updateMeetingLink: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/interview/meeting-link`, payload);
    return response.data;
  },

  // PATCH .../outcome - Body: { result: offer | reject, reason?, reasonText? }
  recordOutcome: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/outcome`, payload);
    return response.data;
  },

  // PATCH .../no-show/mark - hospital. Body: { reoffer, newSlots?, durationMinutes? }
  markNoShow: async (applicationId, payload) => {
    const response = await api.patch(`/api/applications/${applicationId}/no-show/mark`, payload);
    return response.data;
  },

  // PATCH .../no-show/report - staff, no body
  reportNoShow: async (applicationId) => {
    const response = await api.patch(`/api/applications/${applicationId}/no-show/report`);
    return response.data;
  },

  // PATCH .../offer/respond - Body: { accept }
  respondToOffer: async (applicationId, accept) => {
    const response = await api.patch(`/api/applications/${applicationId}/offer/respond`, { accept });
    return response.data;
  },

};


// Multipart POST for evidence files. files: [{ uri, name, mimeType }] from the document picker.
const postMultipart = async (path, fields = {}, files = []) => {
  const token = await getToken();
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") formData.append(key, String(value));
  });
  for (const file of files) {
    const type = file.mimeType ?? "application/octet-stream";
    if (Platform.OS === "web") {
      const blob = file.file ?? (await (await fetch(file.uri)).blob());
      formData.append("files", new Blob([blob], { type }), file.name);
    } else {
      formData.append("files", { uri: file.uri, name: file.name, type });
    }
  }
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { response: { status: res.status, data } };
  return data;
};

export const chatbotAPI = {
  // GET /api/chatbot/conversations/active - null when there is none
  getActive: async () => {
    const response = await api.get('/api/chatbot/conversations/active');
    return response.data;
  },

  // POST /api/chatbot/message - multipart. Fields: text?, selectedButton?, conversationId?, language? (first message only)
  // Returns { conversation } with the full message list
  send: async (fields, files = []) => postMultipart('/api/chatbot/message', fields, files),
};

export const ticketAPI = {
  // POST /api/tickets - staff or hospital. Body: { category, subjectType?, subjectId?, text }
  // For subjectType INTERVIEW the server works out who it's against.
  create: async (payload) => {
    const response = await api.post('/api/tickets', payload);
    return response.data;
  },

  // GET /api/tickets/mine?category=&status=&page=&limit=
  getMine: async (params = {}) => {
    const response = await api.get('/api/tickets/mine', { params });
    return response.data;
  },

  // GET /api/tickets/against-me?page=&limit=
  getAgainstMe: async (params = {}) => {
    const response = await api.get('/api/tickets/against-me', { params });
    return response.data;
  },

  // GET /api/tickets/:id - raiser, respondent or admin
  getById: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  // PATCH /api/tickets/:id/withdraw - Body: { reason? }
  withdraw: async (ticketId, reason) => {
    const response = await api.patch(`/api/tickets/${ticketId}/withdraw`, reason ? { reason } : {});
    return response.data;
  },

  // POST /api/tickets/:id/respond - respondent. Body: { text }
  respond: async (ticketId, text) => {
    const response = await api.post(`/api/tickets/${ticketId}/respond`, { text });
    return response.data;
  },

  // POST /api/tickets/:id/appeal - Body: { reasonText }
  appeal: async (ticketId, reasonText) => {
    const response = await api.post(`/api/tickets/${ticketId}/appeal`, { reasonText });
    return response.data;
  },

  // POST /api/tickets/:id/evidence - multipart, up to 5 files
  addEvidence: async (ticketId, files) => postMultipart(`/api/tickets/${ticketId}/evidence`, {}, files),

  // GET /api/tickets/:id/chat - own thread with the support agent
  getChat: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}/chat`);
    return response.data;
  },

  // POST /api/tickets/:id/chat - multipart. Fields: text?; files attach to the ticket as evidence
  sendChat: async (ticketId, text, files = []) => postMultipart(`/api/tickets/${ticketId}/chat`, { text }, files),

  // GET /api/tickets/:id/evidence/:evidenceId -> { url } short-lived link (admins, and each side for its own files)
  getEvidenceUrl: async (ticketId, evidenceId) => {
    const response = await api.get(`/api/tickets/${ticketId}/evidence/${evidenceId}`);
    return response.data;
  },
};

export const feedbackAPI = {
  // POST /api/support/feedback - Body: { text, area? }
  submit: async (payload) => {
    const response = await api.post('/api/support/feedback', payload);
    return response.data;
  },

  // GET /api/support/feedback/mine
  getMine: async () => {
    const response = await api.get('/api/support/feedback/mine');
    return response.data;
  },
};

export const accountStandingAPI = {
  // GET /api/account/pattern-flags - every flag on the caller's account
  getFlags: async () => {
    const response = await api.get('/api/account/pattern-flags');
    return response.data;
  },

  // PATCH /api/account/suspension-proposals/:id/respond - Body: { text }
  respondToProposal: async (flagId, text) => {
    const response = await api.patch(`/api/account/suspension-proposals/${flagId}/respond`, { text });
    return response.data;
  },
};

export const adminTicketAPI = {
  // GET /api/admin/tickets?status=&queue=&domain=&category=&priority=&page=&limit=
  // Without status it leaves out NEW and TRIAGE; pass status: 'NEW' for unclaimed tickets.
  getQueue: async (params = {}) => {
    const response = await api.get('/api/admin/tickets', { params });
    return response.data;
  },

  // GET /api/admin/tickets/triage - low-confidence bot tickets
  getTriage: async (params = {}) => {
    const response = await api.get('/api/admin/tickets/triage', { params });
    return response.data;
  },

  // GET /api/admin/tickets/approval-queue - decisions waiting for a second admin
  getApprovalQueue: async (params = {}) => {
    const response = await api.get('/api/admin/tickets/approval-queue', { params });
    return response.data;
  },

  // GET /api/tickets/:id - admin gets the full record
  getById: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/claim
  claim: async (ticketId) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/claim`);
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/reassign - Body: { to, reason }
  reassign: async (ticketId, to, reason) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/reassign`, { to, reason });
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/recategorize - Body: { category, reason }
  recategorize: async (ticketId, category, reason) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/recategorize`, { category, reason });
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/priority-override - Body: { value, reason? } (reason required when lowering)
  overridePriority: async (ticketId, value, reason) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/priority-override`, { value, ...(reason && { reason }) });
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/request-info - Body: { message }
  requestInfo: async (ticketId, message) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/request-info`, { message });
    return response.data;
  },

  // GET /api/admin/tickets/:id/chat?party=raiser|respondent
  getChat: async (ticketId, party) => {
    const response = await api.get(`/api/admin/tickets/${ticketId}/chat`, { params: party ? { party } : {} });
    return response.data;
  },

  // POST /api/admin/tickets/:id/chat - multipart. Fields: text?, party?
  sendChat: async (ticketId, text, party, files = []) =>
    postMultipart(`/api/admin/tickets/${ticketId}/chat`, { text, party }, files),

  // POST /api/admin/tickets/:id/decision
  // Body: { resolutionOutcome, resolutionActions: [{ action, details? }], note?, evidenceReliedOn?: [evidenceId] }
  decide: async (ticketId, payload) => {
    const response = await api.post(`/api/admin/tickets/${ticketId}/decision`, payload);
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/approve - second admin signs off
  approve: async (ticketId) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/approve`);
    return response.data;
  },

  // PATCH /api/admin/tickets/:id/return-for-review - Body: { reason }
  returnForReview: async (ticketId, reason) => {
    const response = await api.patch(`/api/admin/tickets/${ticketId}/return-for-review`, { reason });
    return response.data;
  },

  // GET /api/admin/tickets/:id/conversation -> { conversation: { language, botCategory, botConfidence, messages } | null }
  getConversation: async (ticketId) => {
    const response = await api.get(`/api/admin/tickets/${ticketId}/conversation`);
    return response.data;
  },

  // GET /api/admin/tickets/:id/history -> earlier tickets between the same two people
  getHistory: async (ticketId) => {
    const response = await api.get(`/api/admin/tickets/${ticketId}/history`);
    return response.data;
  },
};

export const adminPatternAPI = {
  // GET /api/admin/patterns?status=&raises=&page=&limit=
  getPatterns: async (params = {}) => {
    const response = await api.get('/api/admin/patterns', { params });
    return response.data;
  },

  // GET /api/admin/patterns/:id
  getPattern: async (flagId) => {
    const response = await api.get(`/api/admin/patterns/${flagId}`);
    return response.data;
  },

  // GET /api/admin/suspension-proposals?page=&limit=
  getProposals: async (params = {}) => {
    const response = await api.get('/api/admin/suspension-proposals', { params });
    return response.data;
  },

  // PATCH /api/admin/suspension-proposals/:id/decide - Body: { decision: suspend | no_action, decisionReason }
  decideProposal: async (flagId, decision, decisionReason) => {
    const response = await api.patch(`/api/admin/suspension-proposals/${flagId}/decide`, { decision, decisionReason });
    return response.data;
  },
};

export const adminFeedbackAPI = {
  // GET /api/admin/feedback?area=&sentiment=&page=&limit=
  list: async (params = {}) => {
    const response = await api.get('/api/admin/feedback', { params });
    return response.data;
  },

  // PATCH /api/admin/feedback/:id/override-sentiment - Body: { sentiment }
  overrideSentiment: async (feedbackId, sentiment) => {
    const response = await api.patch(`/api/admin/feedback/${feedbackId}/override-sentiment`, { sentiment });
    return response.data;
  },
};

export const knowledgeBaseAPI = {
  // GET /api/admin/knowledge-base?category=&isActive=&page=&limit=
  list: async (params = {}) => {
    const response = await api.get('/api/admin/knowledge-base', { params });
    return response.data;
  },

  // POST /api/admin/knowledge-base - Body: { question, answer, category?, keywords? }
  create: async (payload) => {
    const response = await api.post('/api/admin/knowledge-base', payload);
    return response.data;
  },

  // PATCH /api/admin/knowledge-base/:id - same body as create
  update: async (articleId, payload) => {
    const response = await api.patch(`/api/admin/knowledge-base/${articleId}`, payload);
    return response.data;
  },

  // PATCH /api/admin/knowledge-base/:id/deactivate | /reactivate
  setActive: async (articleId, active) => {
    const response = await api.patch(`/api/admin/knowledge-base/${articleId}/${active ? 'reactivate' : 'deactivate'}`);
    return response.data;
  },
};

// Auto-relist (backend PR #105). Screens stay hidden until EXPO_PUBLIC_AUTO_RELIST=on.
export const autoRelistAPI = {
  // Hospital ----------------------------------------------------------------
  // PATCH /api/duties/:id/auto-relist - Body: { enabled }. Available or assigned duties only.
  setEnabled: async (dutyId, enabled) => {
    const response = await api.patch(`/api/duties/${dutyId}/auto-relist`, { enabled });
    return response.data;
  },

  // GET /api/duties/auto-relist/finding-cover -> { duties: [{ dutyId, staffRole, date, startTime, endTime, relistCount,
  //   lastCancelledAt, reason, reasonText, urgency, originalUrgency, rate, originalRate, rateBoosted, state }] }
  getFindingCover: async () => {
    const response = await api.get('/api/duties/auto-relist/finding-cover');
    return response.data;
  },

  // GET /api/duties/auto-relist/month-to-date -> { dutiesRelisted, dutiesRefilled, extraPaid }
  getMonthToDate: async () => {
    const response = await api.get('/api/duties/auto-relist/month-to-date');
    return response.data;
  },

  // Staff -------------------------------------------------------------------
  // PATCH /api/duties/:id/cancel - Body: { reason, reasonText? }
  // reason: emergency | illness | scheduling_conflict | transportation_issue | other_staff
  cancelAsStaff: async (dutyId, reason, reasonText) => {
    const response = await api.patch(`/api/duties/${dutyId}/cancel`, { reason, ...(reasonText && { reasonText }) });
    return response.data;
  },

  // Admin (every rate is a 0-1 fraction, or null when there is nothing to divide by) --------------
  // GET /api/admin/auto-relist/tiles -> { relists: { today, last7Days, last30Days },
  //   refillRate: { boosted, unboosted }, controlComparison: { featureOn, featureOff }  (each { filled, total, rate }),
  //   medianTimeToRefillMinutes, byReason: { reason: count } }
  getTiles: async () => {
    const response = await api.get('/api/admin/auto-relist/tiles');
    return response.data;
  },

  // GET /api/admin/auto-relist/trend?days= -> { series: [{ date, relistsCount, refilledCount, extraPaid }] }
  getTrend: async (days = 30) => {
    const response = await api.get('/api/admin/auto-relist/trend', { params: { days } });
    return response.data;
  },

  // GET /api/admin/auto-relist/boost-spend (Super Admin) -> { platformTotal, perHospital: [{ hospitalName, extraPaid }] }
  getSpend: async () => {
    const response = await api.get('/api/admin/auto-relist/boost-spend');
    return response.data;
  },

  // GET /api/admin/auto-relist/cap-reached -> { duties: [{ dutyId, hospitalName, staffRole, date, startTime, endTime, urgency, rate, relistCount }] }
  getCapReached: async () => {
    const response = await api.get('/api/admin/auto-relist/cap-reached');
    return response.data;
  },

  // GET /api/admin/auto-relist/staff-watchlist -> { staff: [{ fullName, jobRole, lateCancellationCount }] }
  getStaffWatchlist: async () => {
    const response = await api.get('/api/admin/auto-relist/staff-watchlist');
    return response.data;
  },

  // GET /api/admin/auto-relist/pair-watchlist -> { pairs: [{ hospitalName, cancelledByName, acceptedByName, recurrenceCount }] }
  getPairWatchlist: async () => {
    const response = await api.get('/api/admin/auto-relist/pair-watchlist');
    return response.data;
  },

  // GET /api/admin/auto-relist/hospital-watchlist -> { hospitals: [{ hospitalName, relists, totalDuties, relistRate, platformAverageRate }] }
  getHospitalWatchlist: async () => {
    const response = await api.get('/api/admin/auto-relist/hospital-watchlist');
    return response.data;
  },

  // GET /api/admin/auto-relist/duties/:dutyId/history?ticketId= (Tech Support must pass the open ticket)
  // -> { dutyId, staffRole, relistCount, rateBoostApplied, history: [{ timestamp, cancelledByName, reason, reasonText,
  //      minutesBeforeStart, urgencyBefore, urgencyAfter, rateBefore, rateAfter }] }
  getDutyHistory: async (dutyId, ticketId) => {
    const response = await api.get(`/api/admin/auto-relist/duties/${dutyId}/history`, { params: ticketId ? { ticketId } : {} });
    return response.data;
  },

  // GET /api/admin/auto-relist/config (Super Admin) -> { config: [{ key, value, history }] }
  getConfig: async () => {
    const response = await api.get('/api/admin/auto-relist/config');
    return response.data;
  },

  // PATCH /api/admin/auto-relist/config - one key at a time. Body: { key, value, effectiveFrom? }
  updateConfig: async (key, value) => {
    const response = await api.patch('/api/admin/auto-relist/config', { key, value });
    return response.data;
  },
};

export const ratingOverrideAPI = {
  // POST /api/admin/rating-overrides - proposed, not built yet (see Backend-Notes-27Sep.txt)
  // Body: { profileType: 'hospital' | 'staff', profileId, value, reason, expiresAt? }
  // Returns { ticket } in PENDING_APPROVAL; a second admin approves it like any other decision.
  propose: async (payload) => {
    const response = await api.post('/api/admin/rating-overrides', payload);
    return response.data;
  },
};

export const reviewAPI = {
  // GET /api/reviews/hospital/:hospitalId - staff reviews of a hospital, only ones already revealed
  // Returns { reviews: [{ rating, review, createdAt, medicalStaff: { fullName, jobRole }, duty? }] }
  getForHospital: async (hospitalId) => {
    const response = await api.get(`/api/reviews/hospital/${hospitalId}`);
    return response.data;
  },

  // GET /api/reviews/staff/:staffId - hospital reviews of a staff member, only ones already revealed
  getForStaff: async (staffId) => {
    const response = await api.get(`/api/reviews/staff/${staffId}`);
    return response.data;
  },
};

export const documentAPI = {

  // ✅ GET — { success, documents: [{ documentId, documentType, verificationStatus, uploadedAt, updatedAt, url, fileName }], pagination }
  getDocuments: async () => {
    const response = await api.get("/api/documents");
    return response.data;
  },


  uploadDocument: async (documentType, fileUri, mimeType) => {
    console.log("API CALLED");

    const token = Platform.OS === "web"
      ? localStorage.getItem("hospilink_token")
      : await AsyncStorage.getItem("hospilink_token");

    const formData = new FormData();

    // Backend expects field name = documentType value (e.g. "pan-card")
    // No separate documentType field, no "file" field name
    if (Platform.OS === "web") {
      const res = await fetch(fileUri);
      const rawBlob = await res.blob();
      // Re-wrap with correct mimeType and filename so backend S3 can identify the file
      const correctedBlob = new Blob([rawBlob], {
        type: mimeType ?? rawBlob.type ?? "image/jpeg"
      });
      const ext = (mimeType ?? "image/jpeg").split("/")[1] ?? "jpg";
      formData.append(documentType, correctedBlob, `upload.${ext}`);
    } else {
      formData.append(documentType, {
        uri: fileUri,
        name: `upload.${(mimeType ?? "image/jpeg").split("/")[1]}`,
        type: mimeType ?? "image/jpeg",
      });
    }

    try {
      console.log("Uploading:", { fileUri, documentType });

      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const res = await fetch(`${baseUrl}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // NO Content-Type — browser sets multipart/form-data + boundary automatically
        },
        body: formData,
      });

      const data = await res.json();
      console.log("SUCCESS:", data);

      if (!res.ok) throw { response: { data } };
      return data;
    } catch (error) {
      console.log("ERROR FULL:", error);
      console.log("ERROR RESPONSE:", error?.response);
      throw error;
    }
  },

  //  DELETE — { success: true, message: "Document deleted" }
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },

  // GET /api/documents/:documentId — returns { success, data: { documentId, url, ... } }
  getDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },
};



export const adminAPI = {

  // Step 1: Admin enters email + password → OTP is sent to that email
  // POST /api/admin/signin
  // Body: { email, password }
  // Returns: { success, message, userId, email }
  signin: async (email, password) => {
    const response = await api.post('/api/admin/signin', { email, password });
    return response.data;
  },

  // Step 2: Admin enters 6-digit OTP from email → gets token + user
  // POST /api/admin/signin/verify-otp
  // Body: { email, otp }
  // Returns: { success, message, token, user: { id, name, email, role } }
  verifyOTP: async (email, otp) => {
    const response = await api.post('/api/admin/signin/verify-otp', { email, otp });
    return response.data;
  },

  // Step 3 (optional): Resend OTP if it expired
  // POST /api/admin/signin/resend-otp
  // Body: { email }
  // Returns: { success, message }
  resendOTP: async (email) => {
    const response = await api.post('/api/admin/signin/resend-otp', { email });
    return response.data;
  },


  // ─── Document APIs ────────────────────────────────────────────────────────

  // GET /api/admin/documents?page=1
  // GET /api/admin/documents?status=pending&page=1
  // GET /api/admin/documents?status=manual-pending-verification&page=1
  // GET /api/admin/documents?userRole=staff&page=1
  // GET /api/admin/documents?userRole=hospital&page=1
  // getDocuments: async () => {
  // const response = await api.get('/api/admin/documents');
  // return response.data;
  // },

  getDocuments: async (status = '', userRole = '', page = 1) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (userRole) params.append('userRole', userRole);
    params.append('page', page);

    const response = await api.get(`/api/admin/documents?${params.toString()}`);
    return response.data;
  },

  // PUT /api/admin/documents/:documentId/verify
  // No body needed
  // Returns: { success, message, data: { documentId, documentType,
  //            verificationStatus: "verified", verifiedBy, verifiedAt,
  //            userId, userName, userEmail } }
  verifyDocument: async (documentId) => {
    const response = await api.put(`/api/admin/documents/${documentId}/verify`);
    return response.data;
  },

  // PUT /api/admin/documents/:documentId/reject
  // Body: { reason: string }
  // Returns: { success, message, data: { documentId, documentType,
  //            verificationStatus: "rejected", rejectionReason,
  //            verifiedBy, verifiedAt, userId, userName, userEmail } }
  rejectDocument: async (documentId, reason) => {
    const response = await api.put(`/api/admin/documents/${documentId}/reject`, { reason });
    return response.data;
  },

  getDocumentStats: async () => {
    const response = await api.get('api/admin/documents/stats');
    return response.data.data; // returns { total, approved, pending, rejected, approvedPct, pendingPct, rejectedPct, recentActions }
  },

  getHospitals: async (params = {}) => {
    const query = {};
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status; // e.g. "Verified", "Rejected", "Pending"
    if (params.city) query.city = params.city;
    if (params.page) query.page = params.page;
    return await api.get('api/admin/hospitals', { params: query }).then(res => res.data);
  },

  getHospitalById: async (hospitalId) => {
    const response = await api.get(`/api/admin/hospitals/${hospitalId}`);
    return response.data;
  },

  getHospitalByName: async (name) => {
    const response = await api.get(`/api/admin/hospitals?name=/${name}`);
    return response.data;
  },

  getHospitalByStatus: async (name) => {
    const response = await api.get(`/api/admin/hospitals?status=/${name}`);
    return response.data;
  },

  getHospitalByCity: async (name) => {
    const response = await api.get(`/api/admin/hospitals?city=/${name}`);
    return response.data;
  },

  verifyHospital: async (id) => {
    // PATCH request to /api/admin/hospitals/:id/verify
    const response = await api.patch(`/api/admin/hospitals/${id}/verify`);
    return response.data;
  },

  rejectHospital: async (id, reason) => {
    // PATCH request to /api/admin/hospitals/:id/reject with the reason payload
    const response = await api.patch(`/api/admin/hospitals/${id}/reject`, {
      reason: reason
    });
    return response.data;
  },

  suspendHospital: async (hospitalId, reason) => {
    const response = await api.patch(`/api/admin/hospitals/${hospitalId}/suspend`, { reason });
    return response.data;
  },

  unsuspendHospital: async (hospitalId) => {
    const response = await api.patch(`/api/admin/hospitals/${hospitalId}/unsuspend`);
    return response.data;
  },


  getStatsAdminDashboard: async () => {
    const response = await api.get('/api/admin/dashboard-stats');
    return response.data;
  },

  getStaffStatsDashboard: async () => {
    const response = await api.get('/api/admin/staff-stats');
    return response.data;
  },

  // Get medical staff statistics (from /stats endpoint)
  getMedicalStaffStats: async () => {
    const response = await api.get('/api/admin/medical-staff/stats');
    return response.data;
  },

  // Get all medical staff (supports pagination/queries based on your screenshots)

  // service/api.js

  getMedicalStaffForAssign: async ({ search, page = 1, city, jobRole } = {}) => {
    const params = { page };
    if (search) params.search = search;
    if (city) params.city = city;
    if (jobRole) params.jobRole = jobRole;
    const response = await api.get('/api/admin/medical-staff-list', { params });
    return response.data;
  },


  // Get a single medical staff member by their ID
  getMedicalStaffById: async (id) => {
    const response = await api.get(`/api/admin/medical-staff/${id}`);
    return response.data;
  },

  // Verify a medical staff member
  verifyMedicalStaff: async (id) => {
    const response = await api.patch(`/api/admin/medical-staff/${id}/verify`);
    return response.data;
  },

  // Reject a medical staff member with a reason
  rejectMedicalStaff: async (id, reason) => {
    const response = await api.patch(`/api/admin/medical-staff/${id}/reject`, {
      reason: reason
    });
    return response.data;
  },

  suspendMedicalStaff: async (staffId, reason) => {
    const response = await api.patch(`/api/admin/medical-staff/${staffId}/suspend`, { reason });
    return response.data;
  },

  unsuspendMedicalStaff: async (staffId) => {
    const response = await api.patch(`/api/admin/medical-staff/${staffId}/unsuspend`);
    return response.data;
  },

  // Get a simplified list of hospitals (supports search via params e.g., { name: 'ci' })
  // Corresponds to /api/admin/hospitals-list and /api/admin/hospitals-list?name=ci
  getHospitalsList: async (params = {}) => {
    const response = await api.get('/api/admin/hospitals-list', { params });
    return response.data;
  },

  // Get nearby medical staff for a specific hospital based on distance
  // Corresponds to /api/admin/nearby-staff?hospital_id=...&distance=...
  // getNearbyStaff: async (hospitalId, distance) => {
  //   const response = await api.get('/api/admin/nearby-staff', {
  //     params: {
  //       hospital_id: hospitalId,
  //       distance: distance
  //     }
  //   });
  //   return response.data;
  // },
  // Update your API file to accept the 3rd parameter
  // getNearbyStaff: async (hospitalId, distance, role) => {
  //   const params = {
  //     hospital_id: hospitalId,
  //     distance: distance
  //   };

  //   // Pass role only if it's explicitly selected (not empty string / default option)
  //   if (role && role !== '') {
  //     params.role = role;
  //   }

  //   const response = await api.get('/api/admin/nearby-staff', { params });
  //   return response.data;
  // },

  getNearbyStaff: async (hospitalId, radius, role) => {
    const params = { hospital_id: hospitalId, radius };
    if (role && role !== '') params.role = role;

    console.log('Sending params:', params);
    const response = await api.get('/api/admin/nearby-staff', { params });
    return response.data;
  },

  createDuty: async (payload) => {
    const response = await api.post('/api/admin/create-duty', payload);
    return response.data;
  },


  // ─── Hospitals List (For Dropdown Search) ──────────────────────────────
  getHospitalsList: async (params = {}) => {
    const response = await api.get('/api/admin/hospitals-list', { params });
    return response.data;
  },


  getDuty: async (dutyId) => {
    const response = await api.get(`/api/admin/duties/${dutyId}`);
    return response.data;
  },
  updatePublishedDuty: async (dutyId, payload) => {
    const response = await api.patch(`/api/admin/duties/${dutyId}`, payload);
    return response.data;
  },

  getActiveDuties: async ({ params }) => {
    const response = await api.get('/api/admin/active-duties', { params });
    return response.data;
  },
  getActiveDutiesDT: async () => {
    const response = await api.get('/api/admin/active-duties');
    return response.data;
  },




  getTrackStaffLocation: async (dutyId) => {
    const response = await api.get(`/api/admin/duty-route-map/${dutyId}`);
    return response.data;
  },

  getLiveStaffLocation: async (staffId) => {
    const response = await api.get(`/api/admin/staff-location/${staffId}`);
    return response.data;
  },

  getDutyLiveTracking: async (dutyId) => {
    const response = await api.get(`/api/admin/duties/${dutyId}/live-tracking`);
    return response.data;
  },

  getOvernightDuties: async () => {
    const response = await api.get('/api/admin/overnight-duties')
    return response.data;
  },

  // getDutyHistory :async () => {
  //   const response = await api.get('/api/admin/duty-history')
  //   return response.data;
  // },

  getDutyHistory: async (params = {}) => {
    // Pass the params object as the second argument to api.get
    const response = await api.get('/api/admin/duty-history', { params });
    return response.data;
  },




  // ─── Activity Logs APIs ────────────────────────────────────────────────────

  // 1. Get all logs (with optional filters)
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/api/admin/activity-logs', { params });
    // Return response.data to match the { success, data, pagination, filters } structure
    return response.data;
  },

  // 2. Get single log by ID
  getActivityLogById: async (id) => {
    const response = await api.get(`/api/admin/activity-logs/${id}`);
    return response.data;
  },

  // 3. Search logs (requires q or search param)
  searchActivityLogs: async (params = {}) => {
    const response = await api.get('/api/admin/activity-logs/search', { params });
    return response.data;
  },

  // 4.export Activit Logs

  exportActivityLogs: async (params = {}) => {
    const response = await api.get('/api/admin/activity-logs/export', {
      params,
      responseType: 'blob', // IMPORTANT: This tells axios to treat the response as a file
    });
    return response.data;
  },

  // GET /api/notifications?limit=50&skip=0
  getNotifications: async (params) => {
    const { limit = 50, skip = 0 } = params;
    const response = await api.get(`/api/notifications`);
    return response.data; // { success, count, data: Notification[] }
  },

  // GET /api/notifications/unread-count
  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data; // { success, count: number }
  },

  // PUT /api/notifications/:id/read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data; // { success, message, data: Notification }
  },

  // PUT /api/notifications/read-all
  markAllAsRead: async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data; // { success, message }
  },

  // PUT /api/notifications/read-multiple
  markMultipleAsRead: async (ids) => {
    const response = await api.put('/api/notifications/read-multiple', { ids });
    return response.data; // { success, message }
  },


  // Get Active Emergency Requests
  getEmergencyDashboard: async (page = 1) => {
    const response = await api.get(`/api/admin/emergency-dashboard?page=${page}`);
    return response.data;
  },

  // Get Medical Staff List
  // getMedicalStaff: async (search = '', page = 1) => {
  //   const response = await api.get(`/api/admin/medical-staff?search=${search}&page=${page}`);
  //   return response.data;
  // },

  //   getMedicalStaff: async (params = {}) => {
  //   // You can pass { page, limit, status, etc. } as params if your API supports it
  //   const response = await api.get('/api/admin/medical-staff', { params });
  //   return response.data;
  // },

  // getMedicalStaff: async (search = '', page = 1, role = '') => {
  //   const roleQuery = role ? `&role=${role}` : '';
  //   const response = await api.get(`/api/admin/medical-staff?search=${search}&page=${page}${roleQuery}`);
  //   return response.data;
  // },
  // getMedicalStaff: async (search = '', page = 1, role = '', status = '', location = '') => {
  // const roleQuery = role ? `&role=${role}` : '';
  // const statusQuery = status ? `&status=${status}` : '';
  // const locationQuery = location && location !== 'All Cities' ? `&location=${encodeURIComponent(location)}` : '';
  // const response = await api.get(
  //   `/api/admin/medical-staff?search=${search}&page=${page}${roleQuery}${statusQuery}${locationQuery}`
  // );
  // return response.data;
  // },

  getMedicalStaff: async (search = '', page = 1, role = '', status = '', location = '') => {
    const roleQuery = role ? `&role=${role}` : '';

    // Only send status if it's a valid verification value
    const validStatuses = ['verified', 'pending', 'rejected', 'auto-verified'];
    const statusQuery = status && validStatuses.includes(status) ? `&status=${status}` : '';

    const locationQuery = location && location !== 'All Cities'
      ? `&location=${encodeURIComponent(location)}`
      : '';

    const response = await api.get(
      `/api/admin/medical-staff?search=${search}&page=${page}${roleQuery}${statusQuery}${locationQuery}`
    );
    return response.data;
  },

  // Assign Staff to Duty
  // assignDuty: async (hospitalId, dutyId, staffId) => {
  //   const response = await api.post('/api/admin/assign-duty', { hospitalId, dutyId, staffId });
  //   return response.data;
  // },

  assignDuty: async (hospitalId, dutyId, staffId) => {
    const response = await api.post('/api/admin/assign-duty', {
      hospital_id: hospitalId,
      duty_id: dutyId,
      staff_id: staffId,
    });
    return response.data;
  },

  recentAction: async () => {
    const response = await api.get('/api/admin/documents/stats');
    return response.data;
  },

  getHospitalManagementStats: async () => {
    const response = await api.get('/api/admin/hospitals/stats')
    return response.data
  },

  // ─── Admin Management (Admin Logs page) APIs ──────────────────────────────

  // GET /api/admin/admin-list
  getAdminList: async (params = {}) => {
    const response = await api.get('/api/admin/admin-list', { params });
    return response.data;
  },

  // GET /api/admin/admin-detail/:adminId
  getAdminDetail: async (adminId) => {
    const response = await api.get(`/api/admin/admin-detail/${adminId}`);
    return response.data;
  },

  // POST /api/admin/create-admin
  // Body: { name, email, password, adminSubRole }
  createAdmin: async (payload) => {
    const response = await api.post('/api/admin/create-admin', payload);
    return response.data;
  },

  // DELETE /api/admin/deactivate-admin/:adminId
  deactivateAdmin: async (adminId) => {
    const response = await api.delete(`/api/admin/deactivate-admin/${adminId}`);
    return response.data;
  },

  // PATCH /api/admin/activate-admin/:adminId
  activateAdmin: async (adminId) => {
    const response = await api.patch(`/api/admin/activate-admin/${adminId}`);
    return response.data;
  },

  // GET /api/admin/profile
  // Returns: { success, data: { id, name, email, role, adminSubRole } }
  getProfile: async () => {
    const response = await api.get('/api/admin/profile');
    return response.data;
  },

  // ─── Update Admin Role - two-step, OTP confirmed ──────────────────────────
  // All three share one rate limit: 3 requests per 15 minutes combined.

  // Step 1 - PATCH /api/admin/update-admin-role/:adminId
  // Body: { adminSubRole: 'super_admin' | 'operations_manager' | 'tech_support' }
  // Stages the change and emails a 6-digit OTP to the ACTING admin, not the target.
  // Returns: { success, message, data: { targetAdminId, targetName, targetEmail, requestedSubRole } }
  initiateRoleChange: async (adminId, adminSubRole) => {
    const response = await api.patch(`/api/admin/update-admin-role/${adminId}`, { adminSubRole });
    return response.data;
  },

  // Step 2 - POST /api/admin/update-admin-role/verify-otp
  // Body: { otp } only - the staged change is held server-side against the acting
  // admin, so the target id is not resent. Applies the change and drops the
  // target's session immediately.
  // OTP is valid ~10 minutes; 5 failed attempts discard the staged change and
  // the flow must restart from step 1.
  verifyRoleChangeOtp: async (otp) => {
    const response = await api.post('/api/admin/update-admin-role/verify-otp', { otp });
    return response.data;
  },

  // POST /api/admin/update-admin-role/resend-otp - no body
  resendRoleChangeOtp: async () => {
    const response = await api.post('/api/admin/update-admin-role/resend-otp');
    return response.data;
  },

}

export const notificationAPI = {
  // POST /api/auth/fcm-token
  // Body: { fcmToken, deviceId, platform }
  // Returns: { success: true, message: "FCM token registered" } (assumed)
  registerFCMToken: async (fcmToken, deviceId, platform) => {
    const response = await api.post('/api/auth/fcm-token', {
      fcmToken,
      deviceId,
      platform,
    });
    return response.data;
  },

  // DELETE /api/auth/fcm-token
  // Body: { fcmToken }
  // Returns: { success: true, message: "FCM token removed" } (assumed)
  deleteFCMToken: async (fcmToken) => {
    const response = await api.delete('/api/auth/fcm-token', {
      data: { fcmToken },
    });
    return response.data;
  },
}



export default api;