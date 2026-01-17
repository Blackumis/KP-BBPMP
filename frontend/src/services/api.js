const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (options.body instanceof FormData) delete headers["Content-Type"];

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
const fetchPublic = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const authAPI = {
  login: async (username, password) => {
    const response = await fetchPublic("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (response.success && response.data.token) setToken(response.data.token);
    return response;
  },
  logout: () => removeToken(),
  getProfile: async () => fetchWithAuth("/auth/profile"),
  isAuthenticated: () => !!getToken(),
  getToken,
};

export const eventsAPI = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/events${qs ? `?${qs}` : ""}`);
  },
  getById: async (id) => fetchWithAuth(`/events/${id}`),
  create: async (eventData) => {
    const formData = new FormData();
    formData.append("nama_kegiatan", eventData.nama_kegiatan);
    formData.append("nomor_surat", eventData.nomor_surat);
    formData.append("tanggal_mulai", eventData.tanggal_mulai);
    formData.append("tanggal_selesai", eventData.tanggal_selesai);
    formData.append("jam_mulai", eventData.jam_mulai);
    formData.append("jam_selesai", eventData.jam_selesai);
    formData.append("batas_waktu_absensi", eventData.batas_waktu_absensi);
    formData.append("form_config", JSON.stringify(eventData.form_config || {}));
    if (eventData.template instanceof File) formData.append("template", eventData.template);
    return fetchWithAuth("/events", { method: "POST", body: formData });
  },
  update: async (id, eventData) => {
    const formData = new FormData();
    Object.keys(eventData).forEach((key) => {
      if (key === "form_config") formData.append(key, JSON.stringify(eventData[key]));
      else if (key === "template" && eventData[key] instanceof File) formData.append("template", eventData[key]);
      else if (eventData[key] !== null && eventData[key] !== undefined) formData.append(key, eventData[key]);
    });
    return fetchWithAuth(`/events/${id}`, { method: "PUT", body: formData });
  },
  delete: async (id) => fetchWithAuth(`/events/${id}`, { method: "DELETE" }),
  generateLink: async (id) => fetchWithAuth(`/events/${id}/generate-link`, { method: "POST" }),
  activate: (id) => fetchWithAuth(`/events/${id}/activate`, { method: "PATCH" }),
};

export const attendanceAPI = {
  getEventForm: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/attendance/form/${eventId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load form");
    return data;
  },
  submit: async (eventId, attendanceData) => {
    // Support sending FormData (multipart/form-data) or JSON
    let opts;
    if (attendanceData instanceof FormData) {
      opts = { method: "POST", body: attendanceData };
    } else {
      opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attendanceData) };
    }

    const response = await fetch(`${API_BASE_URL}/attendance/submit/${eventId}`, opts);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to submit attendance");
    return data;
  },
  getByEvent: async (eventId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/event/${eventId}${qs ? `?${qs}` : ""}`);
  },
  delete: async (id) => fetchWithAuth(`/attendance/${id}`, { method: "DELETE" }),
};

export const referenceAPI = {
  getKabupatenKota: async () => {
    const response = await fetch(`${API_BASE_URL}/reference/kabupaten-kota`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load reference data");
    return data;
  },
};

export const certificateAPI = {
  // Single attendance certificate operations
  generateSingle: async (attendanceId) => fetchWithAuth(`/certificates/generate/${attendanceId}`, { method: "POST" }),
  downloadSingle: async (attendanceId) => fetchWithAuth(`/certificates/download/${attendanceId}`, { method: "GET" }),
  sendSingle: async (attendanceId) => fetchWithAuth(`/certificates/send/${attendanceId}`, { method: "POST" }),

  // Event-level certificate operations
  generateEvent: async (eventId) => fetchWithAuth(`/certificates/generate-event/${eventId}`, { method: "POST" }),
  sendEvent: async (eventId) => fetchWithAuth(`/certificates/send-event/${eventId}`, { method: "POST" }),
  getHistory: async (eventId) => fetchWithAuth(`/certificates/history/${eventId}`, { method: "GET" }),
};

export default { auth: authAPI, events: eventsAPI, attendance: attendanceAPI, reference: referenceAPI, certificate: certificateAPI };
