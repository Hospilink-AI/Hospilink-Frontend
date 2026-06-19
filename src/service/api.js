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
        requestUrl.includes("forgot-password");

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
  cancelPublishedDuty: async (dutyId, reason = 'emergency_resolved') => {
    const response = await api.patch(`/api/duties/${dutyId}/cancel`, { reason });
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
  }

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