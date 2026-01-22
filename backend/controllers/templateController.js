import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all templates
export const getAllTemplates = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let query = `
      SELECT t.*, a.full_name as created_by_name
      FROM certificate_templates t
      LEFT JOIN admins a ON t.created_by = a.id
    `;
    
    if (active_only === 'true') {
      query += ' WHERE t.is_active = TRUE';
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const [templates] = await pool.query(query);
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [templates] = await pool.query(
      `SELECT t.*, a.full_name as created_by_name
       FROM certificate_templates t
       LEFT JOIN admins a ON t.created_by = a.id
       WHERE t.id = ?`,
      [id]
    );
    
    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      data: templates[0]
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new template
export const createTemplate = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Template image is required'
      });
    }
    
    const image_path = 'uploads/templates/' + req.file.filename;
    
    const [result] = await pool.query(
      `INSERT INTO certificate_templates (name, description, image_path, created_by)
       VALUES (?, ?, ?, ?)`,
      [name, description || null, image_path, req.user.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: {
        id: result.insertId,
        name,
        description,
        image_path
      }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    
    // Check if template exists
    const [existing] = await pool.query(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    let image_path = existing[0].image_path;
    
    // Handle new image upload
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '..', existing[0].image_path);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      image_path = 'uploads/templates/' + req.file.filename;
    }
    
    await pool.query(
      `UPDATE certificate_templates 
       SET name = ?, description = ?, image_path = ?, is_active = ?
       WHERE id = ?`,
      [
        name || existing[0].name,
        description !== undefined ? description : existing[0].description,
        image_path,
        is_active !== undefined ? is_active : existing[0].is_active,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const [existing] = await pool.query(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if template is used by any events (check BOTH template_id and image_path for backward compatibility)
    // Some older events may not have template_id set but still use the template via template_sertifikat path
    const [events] = await pool.query(
      'SELECT COUNT(*) as count FROM events WHERE template_id = ? OR template_sertifikat = ?',
      [id, existing[0].image_path]
    );
    
    if (events[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Template is being used by ${events[0].count} event(s). Please update those events first.`
      });
    }
    
    // Delete template image
    const imagePath = path.join(__dirname, '..', existing[0].image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await pool.query('DELETE FROM certificate_templates WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
