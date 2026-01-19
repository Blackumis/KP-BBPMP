import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create event
export const createEvent = async (req, res) => {
  try {
    const {
      nama_kegiatan,
      nomor_surat,
      tanggal_mulai,
      tanggal_selesai,
      jam_mulai,
      jam_selesai,
      batas_waktu_absensi,
      form_config
    } = req.body;

    // Validation
    if (!nama_kegiatan || !nomor_surat || !tanggal_mulai || !tanggal_selesai || 
        !jam_mulai || !jam_selesai || !batas_waktu_absensi) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Check if nomor_surat exists
    const [existing] = await pool.query(
      'SELECT id FROM events WHERE nomor_surat = ?',
      [nomor_surat]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Nomor surat already exists'
      });
    }

    // Handle template source (upload or template)
    const { template_source = 'upload', template_id } = req.body;
    let template_path = null;
    let final_template_id = null;

    if (template_source === 'upload' && req.file) {
      template_path = 'uploads/templates/' + req.file.filename;
    } else if (template_source === 'template' && template_id) {
      // Verify template exists
      const [templateCheck] = await pool.query(
        'SELECT id, image_path FROM certificate_templates WHERE id = ? AND is_active = TRUE',
        [template_id]
      );
      if (templateCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected template not found or inactive'
        });
      }
      final_template_id = template_id;
      template_path = templateCheck[0].image_path;
    }

    // Insert event
    const [result] = await pool.query(
      `INSERT INTO events 
       (nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, 
        batas_waktu_absensi, template_sertifikat, template_id, template_source, form_config, created_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai,
        jam_mulai, jam_selesai, batas_waktu_absensi, template_path,
        final_template_id, template_source,
        JSON.stringify(form_config || {}), req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: result.insertId,
        nama_kegiatan,
        nomor_surat
      }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, a.full_name as created_by_name,
             (SELECT COUNT(*) FROM attendances WHERE event_id = e.id) as total_attendances
      FROM events e
      LEFT JOIN admins a ON e.created_by = a.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE e.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [events] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM events';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const [countResult] = await pool.query(countQuery, status ? [status] : []);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.query(
      `SELECT e.*, a.full_name as created_by_name,
              (SELECT COUNT(*) FROM attendances WHERE event_id = e.id) as total_attendances
       FROM events e
       LEFT JOIN admins a ON e.created_by = a.id
       WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: events[0]
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_kegiatan,
      nomor_surat,
      tanggal_mulai,
      tanggal_selesai,
      jam_mulai,
      jam_selesai,
      batas_waktu_absensi,
      form_config,
      status
    } = req.body;

    // Check if event exists
    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Handle template source (upload or template)
    const { template_source, template_id } = req.body;
    let template_path = existing[0].template_sertifikat;
    let final_template_id = existing[0].template_id;
    let final_template_source = template_source || existing[0].template_source || 'upload';

    if (template_source === 'upload' && req.file) {
      // Delete old uploaded template if it was an upload (not from template library)
      if (existing[0].template_source === 'upload' && existing[0].template_sertifikat) {
        const oldPath = path.join(__dirname, '..', existing[0].template_sertifikat);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      template_path = 'uploads/templates/' + req.file.filename;
      final_template_id = null;
    } else if (template_source === 'template' && template_id) {
      // Verify template exists
      const [templateCheck] = await pool.query(
        'SELECT id, image_path FROM certificate_templates WHERE id = ? AND is_active = TRUE',
        [template_id]
      );
      if (templateCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected template not found or inactive'
        });
      }
      // Delete old uploaded template if switching from upload to template
      if (existing[0].template_source === 'upload' && existing[0].template_sertifikat) {
        const oldPath = path.join(__dirname, '..', existing[0].template_sertifikat);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      final_template_id = template_id;
      template_path = templateCheck[0].image_path;
    }

    // Update event
    await pool.query(
      `UPDATE events SET 
       nama_kegiatan = ?, nomor_surat = ?, tanggal_mulai = ?, tanggal_selesai = ?,
       jam_mulai = ?, jam_selesai = ?, batas_waktu_absensi = ?, template_sertifikat = ?,
       template_id = ?, template_source = ?, form_config = ?, status = ?
       WHERE id = ?`,
      [
        nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai,
        jam_mulai, jam_selesai, batas_waktu_absensi, template_path,
        final_template_id, final_template_source,
        JSON.stringify(form_config || {}), status || existing[0].status, id
      ]
    );

    res.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const [existing] = await pool.query('SELECT template_sertifikat FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete template file if exists
    if (existing[0].template_sertifikat) {
      const templatePath = path.join(__dirname, '..', existing[0].template_sertifikat);
      if (fs.existsSync(templatePath)) {
        fs.unlinkSync(templatePath);
      }
    }

    // Delete event (cascade will delete related attendances)
    await pool.query('DELETE FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const activateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM events WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await pool.query(
      "UPDATE events SET status = 'active' WHERE id = ?",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Activate event error:', err);
    res.status(500).json({ success: false });
  }
};

// Generate attendance form link
export const generateFormLink = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const [events] = await pool.query('SELECT id, nama_kegiatan, status FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update status to active if draft
    if (events[0].status === 'draft') {
      await pool.query('UPDATE events SET status = ? WHERE id = ?', ['active', id]);
    }

    // Generate link
    const formLink = `${process.env.FRONTEND_URL}/attendance/${id}`;

    res.json({
      success: true,
      message: 'Form link generated successfully',
      data: {
        link: formLink,
        event_id: id,
        nama_kegiatan: events[0].nama_kegiatan
      }
    });

  } catch (error) {
    console.error('Generate form link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
