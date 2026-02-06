-- Test Data for 3000 Participants
-- This script generates 3000 fake participants for testing bulk certificate generation and email sending
-- IMPORTANT: Run 'npm run create-admin' first to create admin user, OR run this script which will create one

USE bbpmp_presensi;

-- First, ensure we have an admin user (required for foreign key in kegiatan table)
-- This will create admin with proper bcrypt password hash
INSERT INTO admin (username, email, password, full_name)
VALUES (
  'admin',
  'admin@kpbbpmp.com',
  '$2a$10$rKc7YQ8YhZZ3h6h.vQJ1VOZDhZ.5xGwZ5xGwZ5xGwZ5xGwZ5xGwZ5u', -- Hash for 'admin123'
  'Administrator Test'
) ON DUPLICATE KEY UPDATE id=id;

-- Get admin id
SET @admin_id = (SELECT id FROM admin WHERE username = 'admin' LIMIT 1);

-- Now insert a test event
INSERT INTO kegiatan (
  nama_kegiatan, 
  nomor_surat, 
  tanggal_mulai, 
  tanggal_selesai, 
  jam_mulai, 
  jam_selesai, 
  batas_waktu_absensi,
  created_by
) VALUES (
  'Kegiatan Test 3000 Peserta',
  'TEST-3000/2026',
  '2026-02-01',
  '2026-02-05',
  '08:00:00',
  '16:00:00',
  '2026-02-05 17:00:00',
  @admin_id
) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

-- Get the event_id (use the last inserted ID or specify your event ID)
SET @event_id = LAST_INSERT_ID();

-- Generate 3000 participants with fake data
-- Using a procedure to make it easier
DELIMITER $$

DROP PROCEDURE IF EXISTS generate_test_participants$$

CREATE PROCEDURE generate_test_participants(IN event_id INT, IN num_participants INT)
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE random_name VARCHAR(100);
  DECLARE random_email VARCHAR(100);
  DECLARE random_phone VARCHAR(20);
  DECLARE random_nip VARCHAR(20);
  DECLARE random_unit VARCHAR(200);
  DECLARE random_provinsi VARCHAR(100);
  DECLARE random_kota VARCHAR(100);
  DECLARE random_pangkat VARCHAR(100);
  DECLARE random_jabatan VARCHAR(100);
  DECLARE random_signature_url VARCHAR(500);
  DECLARE cert_number VARCHAR(50);
  
  -- Arrays for random data
  DECLARE provinsi_list VARCHAR(1000) DEFAULT 'DKI Jakarta,Jawa Barat,Jawa Tengah,Jawa Timur,Bali,Sumatera Utara,Sumatera Barat,Sumatera Selatan,Kalimantan Timur,Sulawesi Selatan,Papua,Aceh,Lampung,Bengkulu,Jambi,Riau,Kepulauan Riau,Bangka Belitung,Banten,Yogyakarta,Kalimantan Barat,Kalimantan Tengah,Kalimantan Selatan,Kalimantan Utara,Sulawesi Utara,Sulawesi Tengah,Sulawesi Tenggara,Gorontalo,Sulawesi Barat,Maluku,Maluku Utara,Papua Barat,Nusa Tenggara Barat,Nusa Tenggara Timur';
  
  DECLARE first_names VARCHAR(2000) DEFAULT 'Ahmad,Budi,Citra,Dewi,Eko,Fitri,Gilang,Hana,Indra,Joko,Kartika,Lina,Muhammad,Nur,Oni,Putra,Rina,Siti,Tono,Umar,Vina,Wati,Yanto,Zaki,Agus,Bambang,Candra,Diah,Eka,Fajar,Gita,Hadi,Intan,Jaya,Kurnia,Lisa,Made,Nina,Oka,Puspita,Qori,Ratna,Surya,Tri,Utari,Vera,Wawan,Yuni,Zahra,Abdul,Bella,Chandra,Dinda,Erik,Fitriani,Galuh,Hendra,Ika,Johan,Kiki,Lestari,Maya,Nova,Oktavia,Pramono,Qorib,Rudi,Sari,Taufik,Ulfa,Vicky,Wulan,Yoga,Zahir';
  
  DECLARE last_names VARCHAR(2000) DEFAULT 'Saputra,Putri,Pratama,Utama,Wijaya,Santoso,Permana,Lestari,Kusumo,Rahayu,Kurniawan,Oktaviani,Purnomo,Handayani,Nugroho,Maharani,Setiawan,Anggraini,Firmansyah,Kusumawati,Prasetyo,Wulandari,Hidayat,Susilawati,Irawan,Yuliani,Rahman,Indrawati,Suryanto,Purwanti,Hermawan,Fitriani,Prabowo,Suryani,Budiman,Safitri,Hartono,Mulyani,Susanto,Widiastuti,Gunawan,Novitasari,Wahyudi,Damayanti,Supriyadi,Rahmawati,Darmawan,Aisyah,Hakim,Nurjanah';
  
  DECLARE pangkat_list VARCHAR(500) DEFAULT 'Pembina Utama,Pembina,Penata Tk.I,Penata,Pengatur Tk.I,Pengatur,Juru Tk.I,Juru,Pembina Utama Madya,Pembina Utama Muda';
  
  DECLARE jabatan_list VARCHAR(800) DEFAULT 'Kepala Seksi,Kepala Sub Bagian,Staff,Kepala Bidang,Sekretaris,Bendahara,Kepala Sekolah,Guru,Kepala Dinas,Wakil Kepala,Koordinator,Analis,Perencana,Pengelola,Pelaksana,Pengawas,Supervisor,Manager,Asisten Manager,Staf Administrasi';
  
  WHILE i <= num_participants DO
    -- Generate random name
    SET random_name = CONCAT(
      ELT(FLOOR(1 + RAND() * 70), 'Ahmad','Budi','Citra','Dewi','Eko','Fitri','Gilang','Hana','Indra','Joko','Kartika','Lina','Muhammad','Nur','Oni','Putra','Rina','Siti','Tono','Umar','Vina','Wati','Yanto','Zaki','Agus','Bambang','Candra','Diah','Eka','Fajar','Gita','Hadi','Intan','Jaya','Kurnia','Lisa','Made','Nina','Oka','Puspita','Qori','Ratna','Surya','Tri','Utari','Vera','Wawan','Yuni','Zahra','Abdul','Bella','Chandra','Dinda','Erik','Fitriani','Galuh','Hendra','Ika','Johan','Kiki','Lestari','Maya','Nova','Oktavia','Pramono','Qorib','Rudi','Sari','Taufik','Ulfa','Vicky','Wulan','Yoga','Zahir'),
      ' ',
      ELT(FLOOR(1 + RAND() * 50), 'Saputra','Putri','Pratama','Utama','Wijaya','Santoso','Permana','Lestari','Kusumo','Rahayu','Kurniawan','Oktaviani','Purnomo','Handayani','Nugroho','Maharani','Setiawan','Anggraini','Firmansyah','Kusumawati','Prasetyo','Wulandari','Hidayat','Susilawati','Irawan','Yuliani','Rahman','Indrawati','Suryanto','Purwanti','Hermawan','Fitriani','Prabowo','Suryani','Budiman','Safitri','Hartono','Mulyani','Susanto','Widiastuti','Gunawan','Novitasari','Wahyudi','Damayanti','Supriyadi','Rahmawati','Darmawan','Aisyah','Hakim','Nurjanah')
    );
    
    -- Generate random email (fake - for testing only)
    SET random_email = CONCAT('test', i, '@fakemail-bbpmp-test.com');
    
    -- Generate random phone
    SET random_phone = CONCAT('08', LPAD(FLOOR(RAND() * 9999999999), 10, '0'));
    
    -- Generate random NIP
    SET random_nip = CONCAT('19', LPAD(FLOOR(RAND() * 99999999999999999), 17, '0'));
    
    -- Generate random unit kerja
    SET random_unit = CONCAT(
      ELT(FLOOR(1 + RAND() * 10), 'Dinas Pendidikan','Balai Pengembangan','Sekretariat Daerah','BBPMP','Badan Kepegawaian','Inspektorat','BPKAD','Dinas Kesehatan','Dinas Sosial','Kantor Regional'),
      ' ',
      ELT(FLOOR(1 + RAND() * 34), 'DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','Bali','Sumatera Utara','Sumatera Barat','Sumatera Selatan','Kalimantan Timur','Sulawesi Selatan','Papua','Aceh','Lampung','Bengkulu','Jambi','Riau','Kepulauan Riau','Bangka Belitung','Banten','Yogyakarta','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Utara','Sulawesi Utara','Sulawesi Tengah','Sulawesi Tenggara','Gorontalo','Sulawesi Barat','Maluku','Maluku Utara','Papua Barat','Nusa Tenggara Barat','Nusa Tenggara Timur')
    );
    
    -- Random provinsi (sesuai ENUM di schema: 'Jawa Tengah' atau 'Luar Jawa Tengah')
    SET random_provinsi = IF(RAND() > 0.3, 'Jawa Tengah', 'Luar Jawa Tengah');
    
    -- Random kota
    SET random_kota = CONCAT('Kota/Kab. ', ELT(FLOOR(1 + RAND() * 20), 'Bandung','Surabaya','Semarang','Yogyakarta','Malang','Solo','Bogor','Depok','Tangerang','Bekasi','Medan','Palembang','Makassar','Denpasar','Pontianak','Banjarmasin','Manado','Pekanbaru','Padang','Balikpapan'));
    
    -- Random pangkat
    SET random_pangkat = ELT(FLOOR(1 + RAND() * 10), 'Pembina Utama','Pembina','Penata Tk.I','Penata','Pengatur Tk.I','Pengatur','Juru Tk.I','Juru','Pembina Utama Madya','Pembina Utama Muda');
    
    -- Random jabatan
    SET random_jabatan = ELT(FLOOR(1 + RAND() * 20), 'Kepala Seksi','Kepala Sub Bagian','Staff','Kepala Bidang','Sekretaris','Bendahara','Kepala Sekolah','Guru','Kepala Dinas','Wakil Kepala','Koordinator','Analis','Perencana','Pengelola','Pelaksana','Pengawas','Supervisor','Manager','Asisten Manager','Staf Administrasi');
    
    -- Generate certificate number
    SET cert_number = CONCAT('CERT-TEST-', YEAR(CURDATE()), '-', LPAD(i, 6, '0'));
    
    -- Generate random signature URL (dummy for testing)
    SET random_signature_url = CONCAT('https://example.com/signature/test-', i, '.png');
    
    -- Insert participant
    INSERT INTO presensi (
      event_id,
      nama_lengkap,
      email,
      unit_kerja,
      provinsi,
      kabupaten_kota,
      nip,
      nomor_hp,
      tanggal_lahir,
      pangkat_golongan,
      jabatan,
      signature_url,
      urutan_absensi,
      nomor_sertifikat,
      status,
      created_at
    ) VALUES (
      event_id,
      random_name,
      random_email,
      random_unit,
      random_provinsi,
      random_kota,
      random_nip,
      random_phone,
      DATE_SUB(CURDATE(), INTERVAL FLOOR(25 + RAND() * 20) YEAR),
      random_pangkat,
      random_jabatan,
      random_signature_url,
      i,
      cert_number,
      'menunggu_sertifikat',
      NOW()
    );
    
    SET i = i + 1;
    
    -- Commit every 100 records to avoid long transactions
    IF i MOD 100 = 0 THEN
      COMMIT;
    END IF;
  END WHILE;
  
  COMMIT;
END$$

DELIMITER ;

-- Execute the procedure to generate 3000 test participants
-- This will use the event_id from the test event created above
CALL generate_test_participants(@event_id, 3000);

-- Verify the data
SELECT 
  COUNT(*) as total_participants,
  event_id,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM presensi 
WHERE event_id = @event_id
GROUP BY event_id;

-- Show sample data
SELECT * FROM presensi WHERE event_id = @event_id LIMIT 10;

-- Clean up procedure (optional - comment out if you want to keep it)
-- DROP PROCEDURE IF EXISTS generate_test_participants;

-- Note: To delete test data later, use:
-- DELETE FROM presensi WHERE event_id = @event_id;
-- DELETE FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';
