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
    formData.append("template_source", eventData.template_source || "upload");
    if (eventData.official_id) {
      formData.append("official_id", eventData.official_id);
    }
    if (eventData.certificate_layout) {
      formData.append("certificate_layout", JSON.stringify(eventData.certificate_layout));
    }
    if (eventData.template_source === "template" && eventData.template_id) {
      formData.append("template_id", eventData.template_id);
    } else if (eventData.template instanceof File) {
      formData.append("template", eventData.template);
    }
    return fetchWithAuth("/events", { method: "POST", body: formData });
  },
  update: async (id, eventData) => {
    const formData = new FormData();
    Object.keys(eventData).forEach((key) => {
      if (key === "form_config") formData.append(key, JSON.stringify(eventData[key]));
      else if (key === "certificate_layout") formData.append(key, JSON.stringify(eventData[key]));
      else if (key === "template" && eventData[key] instanceof File) formData.append("template", eventData[key]);
      else if (eventData[key] !== null && eventData[key] !== undefined) formData.append(key, eventData[key]);
    });
    return fetchWithAuth(`/events/${id}`, { method: "PUT", body: formData });
  },
  delete: async (id) => fetchWithAuth(`/events/${id}`, { method: "DELETE" }),
  generateLink: async (id) => fetchWithAuth(`/events/${id}/generate-link`, { method: "POST" }),
  activate: (id) => fetchWithAuth(`/events/${id}/activate`, { method: "PATCH" }),
};

export const templatesAPI = {
  getAll: async (activeOnly = true) => {
    return fetchWithAuth(`/templates?active_only=${activeOnly}`);
  },
  getById: async (id) => fetchWithAuth(`/templates/${id}`),
  create: async (templateData) => {
    const formData = new FormData();
    formData.append("name", templateData.name);
    if (templateData.description) formData.append("description", templateData.description);
    if (templateData.image instanceof File) formData.append("image", templateData.image);
    return fetchWithAuth("/templates", { method: "POST", body: formData });
  },
  update: async (id, templateData) => {
    const formData = new FormData();
    if (templateData.name) formData.append("name", templateData.name);
    if (templateData.description !== undefined) formData.append("description", templateData.description);
    if (templateData.is_active !== undefined) formData.append("is_active", templateData.is_active);
    if (templateData.image instanceof File) formData.append("image", templateData.image);
    return fetchWithAuth(`/templates/${id}`, { method: "PUT", body: formData });
  },
  delete: async (id) => fetchWithAuth(`/templates/${id}`, { method: "DELETE" }),
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
export const reportAPI = {
  generateEventAttendance: async (eventId) =>
    fetchWithAuth(`/attendance/events/${eventId}/attendance-report`, {
      method: "GET",
    }),
};

export const referenceAPI = {
  getKabupatenKota: async () => {
    const response = await fetch(`${API_BASE_URL}/reference/kabupaten-kota`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load reference data");
    return data;
  },
};

export const kopSuratAPI = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/kop-surat${qs ? `?${qs}` : ""}`);
  },

  getById: async (id) => fetchWithAuth(`/kop-surat/${id}`),

  create: async (kopSuratData) => {
    const formData = new FormData();
    formData.append("nama_data", kopSuratData.nama_data);
    formData.append("periode_mulai", kopSuratData.periode_mulai);
    formData.append("periode_selesai", kopSuratData.periode_selesai);
    formData.append("jenis_ttd", kopSuratData.jenis_ttd || "QR");
    formData.append("is_active", kopSuratData.is_active !== undefined ? kopSuratData.is_active : true);

    if (kopSuratData.kop_image instanceof File) {
      formData.append("kop_image", kopSuratData.kop_image);
    }

    return fetchWithAuth("/kop-surat", { method: "POST", body: formData });
  },

  update: async (id, kopSuratData) => {
    const formData = new FormData();
    formData.append("nama_data", kopSuratData.nama_data);
    formData.append("periode_mulai", kopSuratData.periode_mulai);
    formData.append("periode_selesai", kopSuratData.periode_selesai);
    formData.append("jenis_ttd", kopSuratData.jenis_ttd || "QR");
    formData.append("is_active", kopSuratData.is_active !== undefined ? kopSuratData.is_active : true);

    if (kopSuratData.kop_image instanceof File) {
      formData.append("kop_image", kopSuratData.kop_image);
    }

    return fetchWithAuth(`/kop-surat/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: async (id) => fetchWithAuth(`/kop-surat/${id}`, { method: "DELETE" }),

  // 🔥 INI YANG TADI HILANG
  activate: async (id) => fetchWithAuth(`/kop-surat/${id}/activate`, { method: "PATCH" }),

  deactivate: async (id) => fetchWithAuth(`/kop-surat/${id}/deactivate`, { method: "PATCH" }),
};

export const certificateAPI = {
  // Single attendance certificate operations
  generateSingle: async (attendanceId) => fetchWithAuth(`/certificates/generate/${attendanceId}`, { method: "POST" }),

  // Download certificate by certificate number (public endpoint, returns blob)
  downloadByCertificateNumber: async (certificateNumber) => {
    const encodedCertNumber = encodeURIComponent(certificateNumber);
    const response = await fetch(`${API_BASE_URL}/certificates/download/${encodedCertNumber}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to download certificate");
    }
    return await response.blob();
  },

  sendSingle: async (attendanceId) => fetchWithAuth(`/certificates/send/${attendanceId}`, { method: "POST" }),

  // Event-level certificate operations
  generateEvent: async (eventId) => fetchWithAuth(`/certificates/generate-event/${eventId}`, { method: "POST" }),
  sendEvent: async (eventId) => fetchWithAuth(`/certificates/send-event/${eventId}`, { method: "POST" }),
  getHistory: async (eventId) => fetchWithAuth(`/certificates/history/${eventId}`, { method: "GET" }),

  // Validate certificate (public endpoint)
  validate: async (certificateNumber) => fetchPublic(`/certificates/validate/${certificateNumber}`),
};

export const officialsAPI = {
  getAll: async () => fetchWithAuth("/officials"),
  getActive: async () => fetchWithAuth("/officials/active"),
  getById: async (id) => fetchWithAuth(`/officials/${id}`),
  create: async (officialData) => {
    const formData = new FormData();
    formData.append("name", officialData.name);
    formData.append("position", officialData.position);
    if (officialData.is_active !== undefined) formData.append("is_active", officialData.is_active);
    if (officialData.signature instanceof File) formData.append("signature", officialData.signature);
    return fetchWithAuth("/officials", { method: "POST", body: formData });
  },
  update: async (id, officialData) => {
    const formData = new FormData();
    if (officialData.name) formData.append("name", officialData.name);
    if (officialData.position) formData.append("position", officialData.position);
    if (officialData.is_active !== undefined) formData.append("is_active", officialData.is_active);
    if (officialData.signature instanceof File) formData.append("signature", officialData.signature);
    return fetchWithAuth(`/officials/${id}`, { method: "PUT", body: formData });
  },
  delete: async (id) => fetchWithAuth(`/officials/${id}`, { method: "DELETE" }),
};

export const settingsAPI = {
  getSmtp: async () => fetchWithAuth("/settings/smtp"),
  updateSmtp: async (settings) => fetchWithAuth("/settings/smtp", { method: "PUT", body: JSON.stringify(settings) }),
  testSmtp: async (settings) => fetchWithAuth("/settings/smtp/test", { method: "POST", body: JSON.stringify(settings) }),
};

export default { auth: authAPI, events: eventsAPI, attendance: attendanceAPI, reference: referenceAPI, kopSurat: kopSuratAPI, certificate: certificateAPI, templates: templatesAPI, officials: officialsAPI, settings: settingsAPI };
