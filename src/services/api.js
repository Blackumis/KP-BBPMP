/**
 * API Service Layer
 * Handles all HTTP requests to the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Generic fetch wrapper with auth
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// ==================== AUTH API ====================
export const authAPI = {
  login: async (username, password) => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.success && response.data.token) {
      setToken(response.data.token);
    }
    return response;
  },

  logout: () => {
    removeToken();
  },

  getProfile: async () => {
    return fetchWithAuth('/auth/profile');
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  getToken,
};

// ==================== EVENTS API ====================
export const eventsAPI = {
  // Get all events (admin)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/events${queryString ? `?${queryString}` : ''}`);
  },

  // Get single event by ID (admin)
  getById: async (id) => {
    return fetchWithAuth(`/events/${id}`);
  },

  // Create new event
  create: async (eventData) => {
    const formData = new FormData();
    
    // Append all fields
    formData.append('nama_kegiatan', eventData.nama_kegiatan);
    formData.append('nomor_surat', eventData.nomor_surat);
    formData.append('tanggal_mulai', eventData.tanggal_mulai);
    formData.append('tanggal_selesai', eventData.tanggal_selesai);
    formData.append('jam_mulai', eventData.jam_mulai);
    formData.append('jam_selesai', eventData.jam_selesai);
    formData.append('batas_waktu_absensi', eventData.batas_waktu_absensi);
    formData.append('form_config', JSON.stringify(eventData.form_config || {}));
    
    // Handle template file
    if (eventData.template instanceof File) {
      formData.append('template', eventData.template);
    }

    return fetchWithAuth('/events', {
      method: 'POST',
      body: formData,
    });
  },

  // Update event
  update: async (id, eventData) => {
    const formData = new FormData();
    
    Object.keys(eventData).forEach(key => {
      if (key === 'form_config') {
        formData.append(key, JSON.stringify(eventData[key]));
      } else if (key === 'template' && eventData[key] instanceof File) {
        formData.append('template', eventData[key]);
      } else if (eventData[key] !== null && eventData[key] !== undefined) {
        formData.append(key, eventData[key]);
      }
    });

    return fetchWithAuth(`/events/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Delete event
  delete: async (id) => {
    return fetchWithAuth(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Generate form link (activate event)
  generateLink: async (id) => {
    return fetchWithAuth(`/events/${id}/generate-link`, {
      method: 'POST',
    });
  },
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  // Get event form (public)
  getEventForm: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/attendance/form/${eventId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load form');
    }
    return data;
  },

  // Submit attendance (public)
  submit: async (eventId, attendanceData) => {
    const response = await fetch(`${API_BASE_URL}/attendance/submit/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendanceData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit attendance');
    }
    return data;
  },

  // Get all attendances for an event (admin)
  getByEvent: async (eventId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/event/${eventId}${queryString ? `?${queryString}` : ''}`);
  },

  // Delete attendance (admin)
  delete: async (id) => {
    return fetchWithAuth(`/attendance/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== REFERENCE DATA API ====================
export const referenceAPI = {
  // Get kabupaten/kota list
  getKabupatenKota: async () => {
    const response = await fetch(`${API_BASE_URL}/reference/kabupaten-kota`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load reference data');
    }
    return data;
  },
};

// ==================== CERTIFICATES API ====================
export const certificatesAPI = {
  // Generate certificates for an event (admin)
  generate: async (eventId) => {
    return fetchWithAuth(`/certificates/generate/${eventId}`, {
      method: 'POST',
    });
  },

  // Send certificates via email (admin)
  send: async (eventId) => {
    return fetchWithAuth(`/certificates/send/${eventId}`, {
      method: 'POST',
    });
  },
};

export default {
  auth: authAPI,
  events: eventsAPI,
  attendance: attendanceAPI,
  reference: referenceAPI,
  certificates: certificatesAPI,
};
