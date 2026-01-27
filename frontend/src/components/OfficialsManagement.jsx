import React, { useState, useEffect } from "react";
import { officialsAPI } from "../services/api";
import { showNotification } from "./Notification";

const OfficialsManagement = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    signature: null,
    is_active: true,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, official: null });
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadOfficials();
  }, []);

  const loadOfficials = async () => {
    try {
      setLoading(true);
      const response = await officialsAPI.getAll();
      setOfficials(response.data || []);
    } catch (err) {
      console.error("Error loading officials:", err);
      showNotification(err.message || "Gagal memuat data pejabat", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (official = null) => {
    if (official) {
      setEditingOfficial(official);
      setFormData({
        name: official.name,
        position: official.position,
        signature: null,
        is_active: official.is_active,
      });
      if (official.signature_image_path) {
        setPreviewImage(`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${official.signature_image_path}`);
      }
    } else {
      setEditingOfficial(null);
      setFormData({
        name: "",
        position: "",
        signature: null,
        is_active: true,
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOfficial(null);
    setFormData({ name: "", position: "", signature: null, is_active: true });
    setPreviewImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, signature: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingOfficial) {
        await officialsAPI.update(editingOfficial.id, formData);
        showNotification("Pejabat berhasil diperbarui", "success");
      } else {
        await officialsAPI.create(formData);
        showNotification("Pejabat berhasil ditambahkan", "success");
      }
      await loadOfficials();
      handleCloseModal();
    } catch (err) {
      showNotification(err.message || "Terjadi kesalahan saat menyimpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await officialsAPI.delete(deleteConfirm.official.id);
      showNotification("Pejabat berhasil dihapus", "success");
      await loadOfficials();
      setDeleteConfirm({ show: false, official: null });
    } catch (err) {
      showNotification(err.message || "Gagal menghapus pejabat", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="officials-management">
      <div className="officials-header">
        <h2>Manajemen Pejabat Penandatangan</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Tambah Pejabat
        </button>
      </div>

      {loading && !showModal && <div className="loading">Memuat data...</div>}

      <div className="officials-table-container">
        <table className="officials-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jabatan</th>
              <th>QR Tanda Tangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {officials.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  Belum ada data pejabat
                </td>
              </tr>
            ) : (
              officials.map((official) => (
                <tr key={official.id}>
                  <td>{official.name}</td>
                  <td>{official.position}</td>
                  <td className="text-center">
                    {official.signature_qr_path ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${official.signature_qr_path}`}
                        alt="QR Code"
                        style={{ width: "60px", height: "60px" }}
                      />
                    ) : (
                      "Tidak ada"
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleOpenModal(official)}>
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteConfirm({ show: true, official })}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="modal-icon">
                  {editingOfficial ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon-add" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3>{editingOfficial ? "Edit Data Pejabat" : "Tambah Pejabat Baru"}</h3>
                  <p className="modal-subtitle">
                    {editingOfficial ? "Perbarui informasi pejabat penandatangan" : "Tambahkan pejabat penandatangan sertifikat"}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={handleCloseModal} type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <svg xmlns="http://www.w3.org/2000/svg" className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nama Lengkap
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Contoh: Dr. John Doe, M.Si"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <svg xmlns="http://www.w3.org/2000/svg" className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Jabatan
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Contoh: Kepala Dinas Pendidikan"
                  />
                </div>
              </div>

              <div className="form-group signature-upload-group">
                <label className="form-label">
                  <svg xmlns="http://www.w3.org/2000/svg" className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Tanda Tangan Digital
                  {!editingOfficial && <span className="optional-badge">Opsional</span>}
                </label>
                
                <div className="upload-container">
                  {previewImage ? (
                    <div className="preview-section">
                      <div className="preview-image-wrapper">
                        <img src={previewImage} alt="Preview" className="preview-image" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            setPreviewImage(null);
                            setFormData({ ...formData, signature: null });
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="preview-info">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Gambar siap diupload
                      </p>
                    </div>
                  ) : (
                    <label className="upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                        className="file-input-hidden"
                      />
                      <div className="upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="upload-text">
                        <span className="upload-title">Klik untuk upload gambar</span>
                        <span className="upload-hint">atau drag & drop file ke sini</span>
                      </div>
                      <div className="upload-requirements">
                        <span>JPG, PNG</span>
                        <span>•</span>
                        <span>Maks 5MB</span>
                      </div>
                    </label>
                  )}
                </div>
                <p className="info-text">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  QR code akan otomatis di-generate dari gambar tanda tangan
                </p>
              </div>

              <div className="form-group-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    <strong>Status Aktif</strong>
                    <small>Pejabat dapat dipilih saat membuat kegiatan</small>
                  </span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingOfficial ? "Perbarui Data" : "Simpan Pejabat"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ show: false, official: null })}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Konfirmasi Hapus</h3>
            </div>
            <div className="modal-body">
              <p>
                Apakah Anda yakin ingin menghapus pejabat <strong>{deleteConfirm.official?.name}</strong>?
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirm({ show: false, official: null })}
              >
                Batal
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={loading}>
                {loading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .officials-management {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .officials-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .officials-header h2 {
          margin: 0;
          color: #1a202c;
          font-size: 28px;
          font-weight: 700;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .officials-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .officials-table {
          width: 100%;
          border-collapse: collapse;
        }

        .officials-table thead {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .officials-table th,
        .officials-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .officials-table th {
          font-weight: 600;
          color: #495057;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .officials-table tbody tr {
          transition: all 0.2s;
        }

        .officials-table tbody tr:hover {
          background: #f8f9fa;
        }

        .text-center {
          text-align: center !important;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-delete {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-edit {
          background: #ffc107;
          color: #000;
        }

        .btn-edit:hover {
          background: #ffb300;
          transform: translateY(-1px);
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
          background: #c82333;
          transform: translateY(-1px);
        }

        /* Modern Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content.modern-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content.confirm-dialog {
          max-width: 440px;
          border-radius: 12px;
        }

        .modal-header {
          padding: 24px 28px;
          border-bottom: 1px solid #e9ecef;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 16px 16px 0 0;
        }

        .modal-title-section {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .modal-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-edit {
          width: 28px;
          height: 28px;
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          padding: 10px;
          border-radius: 12px;
        }

        .icon-add {
          width: 28px;
          height: 28px;
          color: #48bb78;
          background: rgba(72, 187, 120, 0.1);
          padding: 10px;
          border-radius: 12px;
        }

        .modal-title-section h3 {
          margin: 0 0 4px 0;
          color: #1a202c;
          font-size: 22px;
          font-weight: 700;
        }

        .modal-subtitle {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        .modal-close {
          background: #f7fafc;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          position: absolute;
          right: 20px;
          top: 20px;
        }

        .modal-close:hover {
          background: #e2e8f0;
          color: #2d3748;
        }

        .modal-close svg {
          width: 20px;
          height: 20px;
          stroke-width: 2.5;
        }

        .modal-body {
          padding: 28px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        .label-icon {
          width: 18px;
          height: 18px;
          color: #667eea;
          stroke-width: 2;
        }

        .required {
          color: #e53e3e;
          margin-left: 2px;
        }

        .optional-badge {
          background: #e2e8f0;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input::placeholder {
          color: #cbd5e0;
        }

        .signature-upload-group {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .upload-container {
          margin-top: 12px;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          background: #f7fafc;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-area:hover {
          border-color: #667eea;
          background: #edf2f7;
        }

        .file-input-hidden {
          display: none;
        }

        .upload-icon {
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .upload-icon svg {
          width: 32px;
          height: 32px;
          color: #667eea;
          stroke-width: 2;
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .upload-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 15px;
        }

        .upload-hint {
          color: #718096;
          font-size: 13px;
        }

        .upload-requirements {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          color: #a0aec0;
          font-size: 12px;
        }

        .preview-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .preview-image-wrapper {
          position: relative;
          max-width: 300px;
          width: 100%;
        }

        .preview-image {
          width: 100%;
          max-height: 250px;
          object-fit: contain;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #f7fafc;
          padding: 12px;
        }

        .remove-image-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #fff;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          color: #e53e3e;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .remove-image-btn:hover {
          background: #e53e3e;
          color: white;
        }

        .remove-image-btn svg {
          width: 18px;
          height: 18px;
          stroke-width: 2;
        }

        .preview-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #48bb78;
          font-size: 14px;
          font-weight: 500;
        }

        .preview-info svg {
          width: 20px;
          height: 20px;
          stroke-width: 2;
        }

        .info-text {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 12px;
          background: #ebf8ff;
          border-radius: 8px;
          color: #2c5282;
          font-size: 13px;
          line-height: 1.5;
        }

        .info-text svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          margin-top: 1px;
          stroke-width: 2;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 16px;
          background: #f7fafc;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e0;
          border-radius: 4px;
          background: white;
          flex-shrink: 0;
          position: relative;
          transition: all 0.2s;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #667eea;
          border-color: #667eea;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .checkbox-text strong {
          color: #2d3748;
          font-size: 14px;
        }

        .checkbox-text small {
          color: #718096;
          font-size: 12px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 28px;
          border-top: 1px solid #e9ecef;
          background: #f7fafc;
          border-radius: 0 0 16px 16px;
        }

        .btn-secondary {
          background: white;
          color: #4a5568;
          padding: 11px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .btn-secondary svg {
          width: 18px;
          height: 18px;
          stroke-width: 2;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary svg {
          width: 18px;
          height: 18px;
          stroke-width: 2;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-danger {
          background: #e53e3e;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #c53030;
        }

        .notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 20px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
          max-width: 400px;
          border-left: 4px solid;
        }

        .notification.success {
          border-left-color: #48bb78;
          color: #22543d;
        }

        .notification.error {
          border-left-color: #e53e3e;
          color: #742a2a;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
          font-size: 15px;
        }

        .error-message {
          background: #fff5f5;
          border: 1px solid #feb2b2;
          color: #742a2a;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default OfficialsManagement;
