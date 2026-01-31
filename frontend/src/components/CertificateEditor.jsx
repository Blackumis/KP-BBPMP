import React, { useState, useRef, useEffect } from "react";

const CertificateEditor = ({ templatePreview, onLayoutChange, initialLayout, formConfig }) => {
  // Generate default fields based on formConfig
  const generateDefaultFields = () => {
    const defaultFields = [
      {
        id: "title",
        label: "Judul Sertifikat",
        type: "text",
        content: "SERTIFIKAT",
        x: 50,
        y: 15,
        width: 60,
        height: 8,
        fontSize: 28,
        fontWeight: "bold",
        fontFamily: "Times-Roman",
        textAlign: "center",
        wordWrap: false,
      },
      {
        id: "subtitle",
        label: "Subjudul",
        type: "text",
        content: "Diberikan kepada:",
        x: 50,
        y: 25,
        width: 40,
        height: 5,
        fontSize: 14,
        fontWeight: "normal",
        fontFamily: "Times-Roman",
        textAlign: "center",
        wordWrap: false,
      },
    ];

    // Add dynamic fields based on form config
    // Always add participant name
    defaultFields.push({
      id: "participant_name",
      label: "Nama Peserta",
      type: "dynamic",
      field: "nama_lengkap",
      x: 50,
      y: 32,
      width: 60,
      height: 6,
      fontSize: 24,
      fontWeight: "bold",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    // Only add optional fields if they're required
    if (formConfig?.requireUnit === true) {
      defaultFields.push({
        id: "unit",
        label: "Unit Kerja",
        type: "dynamic",
        field: "unit_kerja",
        x: 50,
        y: 40,
        width: 50,
        height: 5,
        fontSize: 12,
        fontWeight: "normal",
        fontFamily: "Times-Roman",
        textAlign: "center",
        wordWrap: true,
      });
    }

    if (formConfig?.requireCity === true) {
      defaultFields.push({
        id: "city",
        label: "Kabupaten/Kota",
        type: "dynamic",
        field: "kabupaten_kota",
        x: 50,
        y: 46,
        width: 40,
        height: 4,
        fontSize: 12,
        fontWeight: "normal",
        fontFamily: "Times-Roman",
        textAlign: "center",
        wordWrap: false,
      });
    }

    // NIP field removed - tidak ditampilkan di certificate editor

    if (formConfig?.requireRank === true) {
      defaultFields.push({
        id: "rank",
        label: "Pangkat/Golongan",
        type: "dynamic",
        field: "pangkat_golongan",
        x: 15,
        y: 90,
        width: 30,
        height: 4,
        fontSize: 10,
        fontWeight: "normal",
        fontFamily: "Times-Roman",
        textAlign: "left",
        wordWrap: false,
      });
    }

    if (formConfig?.requirePosition === true) {
      defaultFields.push({
        id: "position",
        label: "Jabatan",
        type: "dynamic",
        field: "jabatan",
        x: 15,
        y: 94,
        width: 30,
        height: 4,
        fontSize: 10,
        fontWeight: "normal",
        fontFamily: "Times-Roman",
        textAlign: "left",
        wordWrap: true,
      });
    }

    defaultFields.push({
      id: "event_text",
      label: "Teks Kegiatan",
      type: "text",
      content: "Telah mengikuti kegiatan:",
      x: 50,
      y: 52,
      width: 40,
      height: 5,
      fontSize: 14,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    defaultFields.push({
      id: "event_name",
      label: "Nama Kegiatan",
      type: "dynamic",
      field: "nama_kegiatan",
      x: 50,
      y: 58,
      width: 70,
      height: 8,
      fontSize: 18,
      fontWeight: "bold",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: true,
    });

    defaultFields.push({
      id: "event_date",
      label: "Tanggal Kegiatan",
      type: "dynamic",
      field: "tanggal",
      x: 50,
      y: 68,
      width: 50,
      height: 5,
      fontSize: 12,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    defaultFields.push({
      id: "certificate_number",
      label: "Nomor Sertifikat",
      type: "dynamic",
      field: "nomor_sertifikat",
      x: 50,
      y: 75,
      width: 40,
      height: 4,
      fontSize: 10,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    // QR Code for validation
    defaultFields.push({
      id: "qr_validation",
      label: "QR Validasi",
      type: "qr",
      field: "validation_url",
      x: 85,
      y: 85,
      width: 10,
      height: 10,
      fontSize: 8,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    // QR Code for signature
    defaultFields.push({
      id: "qr_signature",
      label: "QR TTD Atasan",
      type: "qr",
      field: "signature_authority",
      x: 13,
      y: 85,
      width: 10,
      height: 10,
      fontSize: 8,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    });

    return defaultFields;
  };

  const [fields, setFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPositions, setInitialPositions] = useState({});
  const containerRef = useRef(null);

  // Initialize fields on mount
  useEffect(() => {
    if (initialLayout && Array.isArray(initialLayout) && initialLayout.length > 0) {
      setFields(initialLayout);
    } else {
      const newFields = generateDefaultFields();
      setFields(newFields);
    }
  }, []);

  // Update fields when formConfig changes (untuk filter field yang tidak diperlukan)
  useEffect(() => {
    if (!initialLayout || initialLayout.length === 0) {
      // Only regenerate if we're not using saved layout
      setFields(prevFields => {
        // Keep custom text fields
        const customFields = prevFields.filter(f => f.id.startsWith('custom_text_'));
        // Regenerate default fields based on new formConfig
        const newDefaultFields = generateDefaultFields();
        // Merge: default fields + existing custom fields
        return [...newDefaultFields, ...customFields];
      });
    }
  }, [formConfig?.requireUnit, formConfig?.requireCity, formConfig?.requireNIP, formConfig?.requireRank, formConfig?.requirePosition]);

  // Notify parent of layout changes
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(fields);
    }
  }, [fields]);

  const handleMouseDown = (e, field, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Multi-select with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      if (selectedFields.includes(field.id)) {
        setSelectedFields(selectedFields.filter(id => id !== field.id));
      } else {
        setSelectedFields([...selectedFields, field.id]);
      }
      return;
    }
    
    // Single select
    if (!selectedFields.includes(field.id)) {
      setSelectedFields([field.id]);
    }

    const rect = containerRef.current.getBoundingClientRect();
    const fieldX = (field.x / 100) * rect.width;
    const fieldY = (field.y / 100) * rect.height;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragOffset({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      // Store initial positions for all selected fields
      const positions = {};
      selectedFields.forEach(id => {
        const f = fields.find(field => field.id === id);
        if (f) {
          positions[id] = { x: f.x, y: f.y };
        }
      });
      setInitialPositions(positions);
      setDragOffset({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (selectedFields.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const primaryField = fields.find((f) => f.id === selectedFields[0]);
    if (!primaryField) return;

    if (isDragging) {
      // Calculate delta movement without rounding for smooth drag
      const deltaX = ((e.clientX - dragOffset.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragOffset.y) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) => {
          if (selectedFields.includes(f.id) && initialPositions[f.id]) {
            const newX = initialPositions[f.id].x + deltaX;
            const newY = initialPositions[f.id].y + deltaY;
            
            // Constrain without rounding for free positioning
            const constrainedX = Math.max(0, Math.min(100, newX));
            const constrainedY = Math.max(0, Math.min(100, newY));
            
            return { ...f, x: constrainedX, y: constrainedY };
          }
          return f;
        })
      );
    } else if (isResizing && resizeHandle && selectedFields.length === 1) {
      // Only resize if single field is selected
      const deltaX = ((e.clientX - dragOffset.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragOffset.y) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) => {
          if (f.id === selectedFields[0]) {
            let newWidth = f.width;
            let newHeight = f.height;
            let newX = f.x;
            let newY = f.y;

            // For QR fields, maintain square aspect ratio
            const isQRField = f.type === "qr";

            if (isQRField) {
              // For QR, use the larger absolute delta to maintain square
              const absDeltaX = Math.abs(deltaX);
              const absDeltaY = Math.abs(deltaY);
              const maxDelta = Math.max(absDeltaX, absDeltaY);
              
              // Determine if we're expanding or contracting based on handle
              let sizeDelta = 0;
              
              // East and South handles: positive movement = expand
              if (resizeHandle === "e" || resizeHandle === "se" || resizeHandle === "s") {
                sizeDelta = (deltaX > 0 || deltaY > 0) ? maxDelta : -maxDelta;
              }
              // West and North handles: positive movement = contract (opposite)
              else if (resizeHandle === "w" || resizeHandle === "nw" || resizeHandle === "n") {
                sizeDelta = (deltaX < 0 || deltaY < 0) ? maxDelta : -maxDelta;
              }
              // Northeast: right-up expands
              else if (resizeHandle === "ne") {
                sizeDelta = (deltaX > 0 || deltaY < 0) ? maxDelta : -maxDelta;
              }
              // Southwest: left-down expands
              else if (resizeHandle === "sw") {
                sizeDelta = (deltaX < 0 || deltaY > 0) ? maxDelta : -maxDelta;
              }

              // Apply size change while keeping position fixed
              newWidth = Math.max(5, f.width + sizeDelta);
              newHeight = newWidth; // Keep square
              // x and y remain unchanged
            } else {
              // Normal resize for non-QR fields
              if (resizeHandle.includes("e")) {
                newWidth = Math.max(5, f.width + deltaX);
              }
              if (resizeHandle.includes("s")) {
                newHeight = Math.max(3, f.height + deltaY);
              }
              if (resizeHandle.includes("w")) {
                newWidth = Math.max(5, f.width - deltaX);
                newX = f.x + deltaX;
              }
              if (resizeHandle.includes("n")) {
                newHeight = Math.max(3, f.height - deltaY);
                newY = f.y + deltaY;
              }
            }

            return { ...f, width: newWidth, height: newHeight, x: newX, y: newY };
          }
          return f;
        })
      );

      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, selectedFields, dragOffset, resizeHandle, initialPositions]);

  const updateField = (id, updates) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const addCustomTextField = () => {
    const newId = `custom_text_${Date.now()}`;
    const newField = {
      id: newId,
      label: "Text Kustom",
      type: "text",
      content: "Teks kustom Anda di sini",
      x: 50,
      y: 50,
      width: 40,
      height: 5,
      fontSize: 14,
      fontWeight: "normal",
      fontFamily: "Times-Roman",
      textAlign: "center",
      wordWrap: false,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFields([newId]);
  };

  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedFields((prev) => prev.filter((fid) => fid !== id));
  };
  
  const deleteSelectedFields = () => {
    const customFields = selectedFields.filter(id => {
      const field = fields.find(f => f.id === id);
      return field && field.type === "text" && field.id.startsWith("custom_text_");
    });
    
    if (customFields.length > 0) {
      if (confirm(`Hapus ${customFields.length} field kustom yang dipilih?`)) {
        setFields((prev) => prev.filter((f) => !customFields.includes(f.id)));
        setSelectedFields([]);
      }
    }
  };

  const getFieldDisplayText = (field) => {
    if (field.type === "text") {
      return field.content;
    } else if (field.type === "dynamic") {
      const placeholders = {
        nama_lengkap: "[Nama Peserta]",
        unit_kerja: "[Unit Kerja]",
        kabupaten_kota: "[Kabupaten/Kota]",
        nama_kegiatan: "[Nama Kegiatan]",
        tanggal: "[Tanggal Kegiatan]",
        nomor_sertifikat: "[No. Sertifikat]",
        nip: "[NIP]",
        pangkat_golongan: "[Pangkat/Gol]",
        jabatan: "[Jabatan]",
      };
      return placeholders[field.field] || `[${field.field}]`;
    } else if (field.type === "qr") {
      return "QR";
    }
    return "";
  };

  const getFontFamilyStyle = (fontFamily) => {
    const fontMap = {
      "Times-Roman": "'Times New Roman', Times, serif",
      "Times-Bold": "'Times New Roman', Times, serif",
      "Helvetica": "Helvetica, Arial, sans-serif",
      "Helvetica-Bold": "Helvetica, Arial, sans-serif",
      "Courier": "'Courier New', Courier, monospace",
      "Courier-Bold": "'Courier New', Courier, monospace",
    };
    return fontMap[fontFamily] || "'Times New Roman', Times, serif";
  };

  const selectedFieldData = selectedFields.length === 1 ? fields.find((f) => f.id === selectedFields[0]) : null;

  // Safety check
  if (!templatePreview) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-yellow-700 font-medium">Template sertifikat belum dipilih</p>
            <p className="text-yellow-600 text-sm mt-1">Silakan kembali ke tab "Atur Absensi" dan upload atau pilih template terlebih dahulu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="text-md font-bold text-blue-800 mb-2">Editor Layout Sertifikat</h3>
        <p className="text-sm text-blue-700">
          <strong>Drag</strong> field untuk pindahkan. <strong>Drag sudut/sisi</strong> untuk resize. <strong>Klik</strong> untuk edit. <strong>Ctrl+Klik</strong> untuk pilih beberapa field.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
            <div
              ref={containerRef}
              className="relative bg-white shadow-lg mx-auto overflow-hidden"
              style={{
                width: "100%",
                paddingBottom: "70.7%",
                backgroundImage: templatePreview ? `url(${templatePreview})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {fields.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                const isQR = field.type === "qr";

                return (
                  <div
                    key={field.id}
                    onMouseDown={(e) => handleMouseDown(e, field)}
                    className={`absolute border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-100/30 z-20"
                        : "border-transparent hover:border-blue-300 hover:bg-blue-50/20 z-10"
                    } ${isQR ? "flex items-center justify-center bg-gray-200" : ""}`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      transform: field.textAlign === "center" ? "translateX(-50%)" : field.textAlign === "right" ? "translateX(-100%)" : "none",
                      transition: "none",
                      cursor: isDragging ? "grabbing" : "grab",
                    }}
                  >
                    {!isQR && (
                      <div
                        className="w-full h-full flex items-center px-2"
                        style={{
                          fontSize: `${field.fontSize * 0.6}px`,
                          fontWeight: field.fontWeight,
                          fontFamily: getFontFamilyStyle(field.fontFamily || "Times-Roman"),
                          textAlign: field.textAlign || "left",
                          justifyContent: field.textAlign === "center" ? "center" : field.textAlign === "right" ? "flex-end" : "flex-start",
                          wordWrap: field.wordWrap ? "break-word" : "normal",
                          whiteSpace: field.wordWrap ? "normal" : "nowrap",
                          overflow: "hidden",
                          lineHeight: "1.2",
                        }}
                      >
                        {getFieldDisplayText(field)}
                      </div>
                    )}
                    
                    {isQR && (
                      <div className="text-gray-600 font-bold" style={{ fontSize: `${field.fontSize}px` }}>
                        {field.label}
                      </div>
                    )}

                    {isSelected && selectedFields.length === 1 && (
                      <>
                        {/* Resize Handles */}
                        <div
                          className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "nw")}
                        />
                        <div
                          className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "ne")}
                        />
                        <div
                          className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "sw")}
                        />
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "se")}
                        />
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-n-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "n")}
                        />
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-s-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "s")}
                        />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-w-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "w")}
                        />
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-e-resize"
                          onMouseDown={(e) => handleMouseDown(e, field, "e")}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            * Preview ini hanya menunjukkan posisi relatif. Ukuran dan wrapping akan menyesuaikan di PDF final.
          </p>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4 max-h-150 overflow-y-auto">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center sticky top-0 bg-white pb-2">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Field Settings
            </h4>

            {selectedFields.length > 1 ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    {selectedFields.length} Field Dipilih
                  </p>
                  <p className="text-xs text-blue-600 mb-3">
                    Ctrl+Click untuk memilih/membatalkan. Drag untuk memindahkan bersama.
                  </p>
                  <button
                    type="button"
                    onClick={deleteSelectedFields}
                    className="w-full px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : selectedFieldData ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Field</label>
                  <div className="text-sm font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded border">
                    {selectedFieldData.label}
                  </div>
                </div>

                {selectedFieldData.type === "text" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Konten</label>
                    <textarea
                      value={selectedFieldData.content}
                      onChange={(e) => updateField(selectedFieldData.id, { content: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows="2"
                    />
                  </div>
                )}

                {selectedFieldData.type !== "qr" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Font Family</label>
                      <select
                        value={selectedFieldData.fontFamily || "Times-Roman"}
                        onChange={(e) => updateField(selectedFieldData.id, { fontFamily: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Times-Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier">Courier</option>
                        <option value="Times-Bold">Times Bold</option>
                        <option value="Helvetica-Bold">Helvetica Bold</option>
                        <option value="Courier-Bold">Courier Bold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Ukuran Font</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="8"
                          max="36"
                          value={selectedFieldData.fontSize}
                          onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-700 w-10">{selectedFieldData.fontSize}px</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Font Weight</label>
                      <select
                        value={selectedFieldData.fontWeight}
                        onChange={(e) => updateField(selectedFieldData.id, { fontWeight: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Text Align</label>
                      <div className="flex gap-1">
                        {["left", "center", "right"].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateField(selectedFieldData.id, { textAlign: align })}
                            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition ${
                              selectedFieldData.textAlign === align
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {align === "left" && "←"}
                            {align === "center" && "↔"}
                            {align === "right" && "→"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center text-xs font-semibold text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedFieldData.wordWrap}
                          onChange={(e) => updateField(selectedFieldData.id, { wordWrap: e.target.checked })}
                          className="mr-2"
                        />
                        Word Wrap (Auto line break)
                      </label>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">X (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={selectedFieldData.x.toFixed(1)}
                      onChange={(e) => updateField(selectedFieldData.id, { x: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Y (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={selectedFieldData.y.toFixed(1)}
                      onChange={(e) => updateField(selectedFieldData.id, { y: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Width (%)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      step="0.1"
                      value={selectedFieldData.width.toFixed(1)}
                      onChange={(e) => updateField(selectedFieldData.id, { width: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Height (%)</label>
                    <input
                      type="number"
                      min="3"
                      max="50"
                      step="0.1"
                      value={selectedFieldData.height.toFixed(1)}
                      onChange={(e) => updateField(selectedFieldData.id, { height: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                {/* Delete Field Button */}
                {selectedFieldData.type === "text" && selectedFieldData.id.startsWith("custom_text_") && (
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus field "${selectedFieldData.label}"?`)) {
                          deleteField(selectedFieldData.id);
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                    >
                      🗑️ Hapus Field
                    </button>
                  </div>
                )}              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-sm">Klik field untuk edit</p>
              </div>
            )}
          </div>

          {/* Field List */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Daftar Field ({fields.length})
              </div>
            </h4>
            
            {/* Add Custom Text Button */}
            <button
              type="button"
              onClick={addCustomTextField}
              className="w-full mb-3 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Text Box Kosong
            </button>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      if (selectedFields.includes(field.id)) {
                        setSelectedFields(selectedFields.filter(id => id !== field.id));
                      } else {
                        setSelectedFields([...selectedFields, field.id]);
                      }
                    } else {
                      setSelectedFields([field.id]);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                    selectedFields.includes(field.id)
                      ? "bg-blue-100 text-blue-800 font-semibold border border-blue-300"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{field.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      field.type === "dynamic" ? "bg-green-100 text-green-700" :
                      field.type === "qr" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {field.type === "dynamic" ? "Auto" : field.type === "qr" ? "QR" : "Static"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateEditor;
