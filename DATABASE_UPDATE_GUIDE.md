# Panduan Update Database Schema

## Perubahan yang Dibuat
Foreign key constraints pada tabel `pejabat`, `kegiatan`, dan `template_sertif` diubah dari `ON DELETE CASCADE` menjadi `ON DELETE RESTRICT`. Ini mencegah penghapusan data cascade ketika admin dihapus.

## Opsi 1: Update Manual dengan ALTER TABLE (Recommended untuk Production)

Jalankan query SQL berikut di MySQL untuk mengupdate constraint tanpa menghapus data:

```sql
-- 1. Drop foreign key constraints yang lama
ALTER TABLE pejabat DROP FOREIGN KEY pejabat_ibfk_1;
ALTER TABLE kegiatan DROP FOREIGN KEY kegiatan_ibfk_1;
ALTER TABLE template_sertif DROP FOREIGN KEY template_sertif_ibfk_1;

-- 2. Tambahkan foreign key constraints yang baru dengan RESTRICT
ALTER TABLE pejabat 
ADD CONSTRAINT pejabat_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE RESTRICT;

ALTER TABLE kegiatan 
ADD CONSTRAINT kegiatan_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE RESTRICT;

ALTER TABLE template_sertif 
ADD CONSTRAINT template_sertif_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE RESTRICT;
```

### Cara Menjalankan:
1. Buka MySQL client (phpMyAdmin, MySQL Workbench, atau command line)
2. Pilih database yang digunakan (biasanya `kp_bbpmp` atau sesuai config)
3. Copy-paste dan jalankan query di atas
4. Verifikasi dengan: `SHOW CREATE TABLE pejabat;` untuk melihat constraint baru

## Opsi 2: Drop dan Recreate (Hanya untuk Development/Testing)

⚠️ **PERINGATAN: Ini akan menghapus semua data!**

Jika Anda masih dalam tahap development dan tidak ada data penting:

### Di Windows (PowerShell):
```powershell
cd backend
# Pastikan MySQL sudah running
# Login ke MySQL dan jalankan:
mysql -u root -p < database/schema.sql
```

### Di Linux/Mac:
```bash
cd backend
# Pastikan MySQL sudah running
mysql -u root -p kp_bbpmp < database/schema.sql
```

Atau manual:
1. Drop database yang ada
2. Buat database baru
3. Jalankan file `backend/database/schema.sql`

## Verifikasi

Setelah update, coba hapus admin. Sistem seharusnya memberikan error jika masih ada data di tabel lain yang menggunakan admin tersebut:

```sql
-- Test (jangan jalankan ini di production!)
DELETE FROM admin WHERE id = 1;
-- Akan error jika masih ada data di pejabat/kegiatan/template_sertif yang dibuat oleh admin id=1
```

## Rollback (Jika Diperlukan)

Jika ingin kembali ke CASCADE delete:

```sql
ALTER TABLE pejabat DROP FOREIGN KEY pejabat_ibfk_1;
ALTER TABLE kegiatan DROP FOREIGN KEY kegiatan_ibfk_1;
ALTER TABLE template_sertif DROP FOREIGN KEY template_sertif_ibfk_1;

ALTER TABLE pejabat 
ADD CONSTRAINT pejabat_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE;

ALTER TABLE kegiatan 
ADD CONSTRAINT kegiatan_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE;

ALTER TABLE template_sertif 
ADD CONSTRAINT template_sertif_ibfk_1 
FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE;
```

## Catatan

- **RESTRICT**: Mencegah penghapusan parent row jika ada child row yang reference ke parent
- **CASCADE**: Otomatis menghapus semua child row ketika parent row dihapus
- Pastikan backup database sebelum melakukan perubahan di production!
