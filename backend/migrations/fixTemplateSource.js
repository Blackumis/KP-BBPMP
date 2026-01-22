import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Fix template_source column for existing events
 * 
 * This migration fixes the template tracking issue where template_source was not
 * properly set for events, causing library template files to be accidentally deleted
 * when events are updated or deleted.
 * 
 * The fix:
 * 1. Sets template_source = 'template' for events where template_sertifikat matches
 *    a certificate_templates.image_path
 * 2. Sets template_source = 'upload' for events with custom uploaded templates
 * 3. Sets template_id for events using library templates
 */
async function fixTemplateSource() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kp_bbpmp_db',
    });

    console.log('Connected to MySQL server');
    console.log('Starting template_source fix migration...\n');

    // Step 1: Check if template_source column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'template_source'
    `, [process.env.DB_NAME || 'kp_bbpmp_db']);

    if (columns.length === 0) {
      console.log('⚠ template_source column does not exist. Running addTemplates migration first...');
      console.log('Please run: npm run migrate:templates');
      process.exit(1);
    }

    // Step 2: Get all events with their template info
    const [events] = await connection.query(`
      SELECT e.id, e.template_sertifikat, e.template_id, e.template_source
      FROM events e
      WHERE e.template_sertifikat IS NOT NULL
    `);

    console.log(`Found ${events.length} events with templates to check\n`);

    // Step 3: Get all certificate templates
    const [templates] = await connection.query(`
      SELECT id, image_path FROM certificate_templates
    `);

    // Create a map of image_path to template id for quick lookup
    const templateMap = new Map();
    templates.forEach(t => {
      templateMap.set(t.image_path, t.id);
    });

    console.log(`Found ${templates.length} library templates\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    // Step 4: Fix each event
    for (const event of events) {
      const isLibraryTemplate = templateMap.has(event.template_sertifikat);
      const expectedSource = isLibraryTemplate ? 'template' : 'upload';
      const expectedTemplateId = isLibraryTemplate ? templateMap.get(event.template_sertifikat) : null;

      // Check if fix is needed
      const needsFix = event.template_source !== expectedSource || 
                       (isLibraryTemplate && event.template_id !== expectedTemplateId);

      if (needsFix) {
        await connection.query(`
          UPDATE events 
          SET template_source = ?, template_id = ?
          WHERE id = ?
        `, [expectedSource, expectedTemplateId, event.id]);

        console.log(`✓ Fixed event ID ${event.id}: set template_source='${expectedSource}', template_id=${expectedTemplateId}`);
        fixedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log(`✓ Fixed: ${fixedCount} events`);
    console.log(`→ Already correct: ${alreadyCorrectCount} events`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTemplateSource();
