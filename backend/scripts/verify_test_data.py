"""
Helper script to verify test data after import
Run this after importing test-3000-participants.sql
"""

import mysql.connector
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Update with your password
    'database': 'bbpmp_presensi'
}

def verify_test_data():
    """Verify the test data import"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        print("=" * 60)
        print("VERIFICATION: Test Data Import")
        print("=" * 60)
        print()
        
        # Get test event info
        cursor.execute("""
            SELECT * FROM kegiatan 
            WHERE nomor_surat = 'TEST-3000/2026'
        """)
        event = cursor.fetchone()
        
        if not event:
            print("❌ Test event not found!")
            print("Please run: mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql")
            return
        
        print(f"✅ Test Event Found")
        print(f"   ID: {event['id']}")
        print(f"   Name: {event['nama_kegiatan']}")
        print(f"   Number: {event['nomor_surat']}")
        print()
        
        # Count participants
        cursor.execute("""
            SELECT COUNT(*) as total FROM presensi 
            WHERE event_id = %s
        """, (event['id'],))
        result = cursor.fetchone()
        total = result['total']
        
        print(f"✅ Total Participants: {total}")
        
        if total != 3000:
            print(f"⚠️  Warning: Expected 3000 participants, found {total}")
        print()
        
        # Sample data
        cursor.execute("""
            SELECT nama_lengkap, email, unit_kerja, provinsi, nomor_sertifikat
            FROM presensi 
            WHERE event_id = %s 
            LIMIT 5
        """, (event['id'],))
        samples = cursor.fetchall()
        
        print("📋 Sample Participants:")
        print("-" * 60)
        for i, sample in enumerate(samples, 1):
            print(f"{i}. {sample['nama_lengkap']}")
            print(f"   Email: {sample['email']}")
            print(f"   Unit: {sample['unit_kerja']}")
            print(f"   Province: {sample['provinsi']}")
            print(f"   Certificate #: {sample['nomor_sertifikat']}")
            print()
        
        # Check email distribution
        cursor.execute("""
            SELECT 
                SUBSTRING_INDEX(email, '@', -1) as domain,
                COUNT(*) as count
            FROM presensi 
            WHERE event_id = %s 
            GROUP BY domain
        """, (event['id'],))
        domains = cursor.fetchall()
        
        print("📧 Email Domains:")
        for domain in domains:
            print(f"   {domain['domain']}: {domain['count']} participants")
        print()
        
        # Province distribution
        cursor.execute("""
            SELECT provinsi, COUNT(*) as count
            FROM presensi 
            WHERE event_id = %s 
            GROUP BY provinsi
            ORDER BY count DESC
            LIMIT 5
        """, (event['id'],))
        provinces = cursor.fetchall()
        
        print("🌏 Top 5 Provinces:")
        for prov in provinces:
            print(f"   {prov['provinsi']}: {prov['count']} participants")
        print()
        
        print("=" * 60)
        print("✅ Verification Complete!")
        print()
        print("Next steps:")
        print("1. Start Redis: docker run -d -p 6379:6379 --name redis redis:alpine")
        print("2. Start backend: cd backend && npm run dev")
        print("3. Access queue dashboard: http://localhost:5000/admin/queues")
        print(f"4. Generate certificates: POST /api/certificates/generate-event/{event['id']}")
        print("=" * 60)
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
    except Exception as e:
        print(f"❌ Error: {e}")

def cleanup_test_data():
    """Clean up test data"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id FROM kegiatan 
            WHERE nomor_surat = 'TEST-3000/2026'
        """)
        event = cursor.fetchone()
        
        if not event:
            print("No test event found to clean up.")
            return
        
        event_id = event['id']
        
        # Get count before deletion
        cursor.execute("""
            SELECT COUNT(*) as total FROM presensi 
            WHERE event_id = %s
        """, (event_id,))
        result = cursor.fetchone()
        total = result['total']
        
        confirm = input(f"Are you sure you want to delete {total} test participants? (yes/no): ")
        
        if confirm.lower() == 'yes':
            # Delete participants
            cursor.execute("DELETE FROM presensi WHERE event_id = %s", (event_id,))
            # Delete event
            cursor.execute("DELETE FROM kegiatan WHERE id = %s", (event_id,))
            conn.commit()
            
            print(f"✅ Deleted {total} participants and test event.")
        else:
            print("Cleanup cancelled.")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        cleanup_test_data()
    else:
        verify_test_data()
        print()
        print("To cleanup test data, run: python verify_test_data.py cleanup")
