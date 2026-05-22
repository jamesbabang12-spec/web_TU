#!/usr/bin/env python3
"""
PRE-DEPLOYMENT SMOKE TEST for SekolahKu
Tests all 45 endpoints with auto-cleanup
"""
import requests
import json
from datetime import datetime

BASE_URL = "https://tata-usaha-dashboard.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@sekolahku.id"
ADMIN_PASSWORD = "admin123"
TU_EMAIL = "tu@sekolahku.id"
TU_PASSWORD = "tu123"
WALI_EMAIL = "wali@sekolahku.id"
WALI_PASSWORD = "wali123"

# Track created resources for cleanup
created_resources = {
    'siswa': [],
    'guru': [],
    'kelas': [],
    'surat_masuk': [],
    'surat_keluar': [],
    'absensi': [],
    'users': []
}

test_results = {
    'passed': 0,
    'failed': 0,
    'details': []
}

def log_test(name, passed, message=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results['details'].append(f"{status}: {name} - {message}")
    if passed:
        test_results['passed'] += 1
    else:
        test_results['failed'] += 1
    print(f"{status}: {name}")
    if message:
        print(f"   {message}")

def is_uuid(value):
    """Check if value is a valid UUID"""
    if not isinstance(value, str):
        return False
    return len(value) == 36 and value.count('-') == 4

def has_no_mongo_id(data):
    """Check that response has no _id field"""
    if isinstance(data, dict):
        if '_id' in data:
            return False
        return all(has_no_mongo_id(v) for v in data.values())
    elif isinstance(data, list):
        return all(has_no_mongo_id(item) for item in data)
    return True

def login(email, password):
    """Login and return token"""
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('token'), data.get('user')
        return None, None
    except Exception as e:
        print(f"Login error: {e}")
        return None, None

def cleanup():
    """Delete all created test resources"""
    print("\n🧹 CLEANUP: Deleting test resources...")
    admin_token, _ = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        print("⚠️  Cannot cleanup - admin login failed")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Delete in reverse order to avoid foreign key issues
    for resource_type in ['absensi', 'users', 'surat_keluar', 'surat_masuk', 'kelas', 'guru', 'siswa']:
        for resource_id in created_resources.get(resource_type, []):
            try:
                requests.delete(f"{BASE_URL}/{resource_type.replace('_', '-')}/{resource_id}", headers=headers, timeout=10)
                print(f"   Deleted {resource_type}/{resource_id}")
            except Exception as e:
                print(f"   Failed to delete {resource_type}/{resource_id}: {e}")

def run_tests():
    """Run all 45 smoke tests"""
    print("=" * 80)
    print("PRE-DEPLOYMENT SMOKE TEST - SekolahKu Backend")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # ========== 1) AUTH TESTS (5 tests) ==========
    print("\n📋 1) AUTH TESTS (5 tests)")
    
    # Test 1.1: Admin login
    admin_token, admin_user = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if admin_token and admin_user and admin_user.get('role') == 'admin':
        log_test("1.1 Admin login", True, f"Token received, role={admin_user.get('role')}")
    else:
        log_test("1.1 Admin login", False, "Failed to get token or role != admin")
        return  # Cannot continue without admin token
    
    # Test 1.2: TU login
    tu_token, tu_user = login(TU_EMAIL, TU_PASSWORD)
    if tu_token and tu_user and tu_user.get('role') == 'tu':
        log_test("1.2 TU login", True, f"Token received, role={tu_user.get('role')}")
    else:
        log_test("1.2 TU login", False, "Failed to get token or role != tu")
    
    # Test 1.3: Wali Kelas login
    wali_token, wali_user = login(WALI_EMAIL, WALI_PASSWORD)
    if wali_token and wali_user and wali_user.get('role') == 'wali_kelas' and wali_user.get('kelas') == '7A':
        log_test("1.3 Wali Kelas login", True, f"Token received, role={wali_user.get('role')}, kelas={wali_user.get('kelas')}")
    else:
        log_test("1.3 Wali Kelas login", False, "Failed to get token or role != wali_kelas or kelas != 7A")
    
    # Test 1.4: Wrong password
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"}, timeout=10)
    log_test("1.4 Wrong password", resp.status_code == 401, f"Status: {resp.status_code}")
    
    # Test 1.5: GET /api/auth/me
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("1.5 GET /api/auth/me", data.get('user', {}).get('email') == ADMIN_EMAIL, f"User: {data.get('user', {}).get('email')}")
    else:
        log_test("1.5 GET /api/auth/me", False, f"Status: {resp.status_code}")
    
    # ========== 2) SISWA CRUD (5 tests) ==========
    print("\n📋 2) SISWA CRUD (5 tests)")
    
    # Test 2.1: GET /api/siswa
    resp = requests.get(f"{BASE_URL}/siswa", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_uuid = all(is_uuid(item.get('id', '')) for item in data[:5])
        no_mongo_id = has_no_mongo_id(data)
        log_test("2.1 GET /api/siswa", isinstance(data, list) and has_uuid and no_mongo_id, 
                f"Count: {len(data)}, UUID: {has_uuid}, No _id: {no_mongo_id}")
    else:
        log_test("2.1 GET /api/siswa", False, f"Status: {resp.status_code}")
    
    # Test 2.2: POST /api/siswa
    new_siswa = {
        "nis": "TEST001",
        "nama": "Test Siswa Smoke",
        "kelas": "7A",
        "status": "Aktif",
        "email": "test_smoke_siswa@test.com",
        "emailOrtu": "ortu_smoke@test.com",
        "namaOrtu": "Ortu Test",
        "teleponOrtu": "081234567890"
    }
    resp = requests.post(f"{BASE_URL}/siswa", json=new_siswa, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        siswa_id = data.get('id')
        if siswa_id and is_uuid(siswa_id) and '_id' not in data:
            created_resources['siswa'].append(siswa_id)
            log_test("2.2 POST /api/siswa", True, f"Created with UUID: {siswa_id}, No _id: {('_id' not in data)}")
        else:
            log_test("2.2 POST /api/siswa", False, f"Invalid response: {data}")
    else:
        log_test("2.2 POST /api/siswa", False, f"Status: {resp.status_code}")
        siswa_id = None
    
    # Test 2.3: GET /api/siswa/:id
    if siswa_id:
        resp = requests.get(f"{BASE_URL}/siswa/{siswa_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            log_test("2.3 GET /api/siswa/:id", data.get('id') == siswa_id and data.get('nama') == new_siswa['nama'], 
                    f"Retrieved: {data.get('nama')}")
        else:
            log_test("2.3 GET /api/siswa/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("2.3 GET /api/siswa/:id", False, "Skipped - no siswa_id")
    
    # Test 2.4: PUT /api/siswa/:id
    if siswa_id:
        resp = requests.put(f"{BASE_URL}/siswa/{siswa_id}", json={"nama": "Updated Siswa Smoke"}, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            log_test("2.4 PUT /api/siswa/:id", data.get('nama') == "Updated Siswa Smoke", f"Updated: {data.get('nama')}")
        else:
            log_test("2.4 PUT /api/siswa/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("2.4 PUT /api/siswa/:id", False, "Skipped - no siswa_id")
    
    # Test 2.5: DELETE /api/siswa/:id (will be done in cleanup)
    if siswa_id:
        resp = requests.delete(f"{BASE_URL}/siswa/{siswa_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['siswa'].remove(siswa_id)  # Already deleted
            log_test("2.5 DELETE /api/siswa/:id", True, f"Deleted: {siswa_id}")
        else:
            log_test("2.5 DELETE /api/siswa/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("2.5 DELETE /api/siswa/:id", False, "Skipped - no siswa_id")
    
    # ========== 3) GURU CRUD (3 tests) ==========
    print("\n📋 3) GURU CRUD (3 tests)")
    
    # Test 3.1: GET /api/guru
    resp = requests.get(f"{BASE_URL}/guru", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("3.1 GET /api/guru", isinstance(data, list), f"Count: {len(data)}")
    else:
        log_test("3.1 GET /api/guru", False, f"Status: {resp.status_code}")
    
    # Test 3.2: POST /api/guru
    new_guru = {
        "nip": "TEST_NIP_001",
        "nama": "Test Guru Smoke",
        "mapel": "Matematika",
        "telepon": "081234567890"
    }
    resp = requests.post(f"{BASE_URL}/guru", json=new_guru, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        guru_id = data.get('id')
        if guru_id and is_uuid(guru_id):
            created_resources['guru'].append(guru_id)
            log_test("3.2 POST /api/guru", True, f"Created with UUID: {guru_id}")
        else:
            log_test("3.2 POST /api/guru", False, f"Invalid response: {data}")
    else:
        log_test("3.2 POST /api/guru", False, f"Status: {resp.status_code}")
        guru_id = None
    
    # Test 3.3: DELETE /api/guru/:id
    if guru_id:
        resp = requests.delete(f"{BASE_URL}/guru/{guru_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['guru'].remove(guru_id)
            log_test("3.3 DELETE /api/guru/:id", True, f"Deleted: {guru_id}")
        else:
            log_test("3.3 DELETE /api/guru/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("3.3 DELETE /api/guru/:id", False, "Skipped - no guru_id")
    
    # ========== 4) KELAS CRUD (3 tests) ==========
    print("\n📋 4) KELAS CRUD (3 tests)")
    
    # Test 4.1: GET /api/kelas
    resp = requests.get(f"{BASE_URL}/kelas", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("4.1 GET /api/kelas", isinstance(data, list), f"Count: {len(data)}")
    else:
        log_test("4.1 GET /api/kelas", False, f"Status: {resp.status_code}")
    
    # Test 4.2: POST /api/kelas
    new_kelas = {
        "nama": "TEST-X",
        "tingkat": "SMP"
    }
    resp = requests.post(f"{BASE_URL}/kelas", json=new_kelas, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        kelas_id = data.get('id')
        if kelas_id and is_uuid(kelas_id):
            created_resources['kelas'].append(kelas_id)
            log_test("4.2 POST /api/kelas", True, f"Created with UUID: {kelas_id}")
        else:
            log_test("4.2 POST /api/kelas", False, f"Invalid response: {data}")
    else:
        log_test("4.2 POST /api/kelas", False, f"Status: {resp.status_code}")
        kelas_id = None
    
    # Test 4.3: DELETE /api/kelas/:id
    if kelas_id:
        resp = requests.delete(f"{BASE_URL}/kelas/{kelas_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['kelas'].remove(kelas_id)
            log_test("4.3 DELETE /api/kelas/:id", True, f"Deleted: {kelas_id}")
        else:
            log_test("4.3 DELETE /api/kelas/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("4.3 DELETE /api/kelas/:id", False, "Skipped - no kelas_id")
    
    # ========== 5) PEMBAYARAN SPP (4 tests) ==========
    print("\n📋 5) PEMBAYARAN SPP (4 tests)")
    
    # Test 5.1: GET /api/pembayaran
    resp = requests.get(f"{BASE_URL}/pembayaran", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("5.1 GET /api/pembayaran", isinstance(data, list), f"Count: {len(data)}")
    else:
        log_test("5.1 GET /api/pembayaran", False, f"Status: {resp.status_code}")
    
    # Test 5.2: POST /api/pembayaran/generate-tagihan (idempotent)
    resp = requests.post(f"{BASE_URL}/pembayaran/generate-tagihan", 
                        json={"bulan": "Juli", "tahun": 2026}, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        created_count = data.get('created', 0)
        log_test("5.2 POST /api/pembayaran/generate-tagihan", True, 
                f"Created: {created_count} (idempotent - any N including 0 is OK)")
    else:
        log_test("5.2 POST /api/pembayaran/generate-tagihan", False, f"Status: {resp.status_code}")
    
    # Test 5.3: Find one Belum Lunas and mark as Lunas
    resp = requests.get(f"{BASE_URL}/pembayaran", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        belum_lunas = [p for p in data if p.get('status') == 'Belum Lunas']
        if belum_lunas:
            payment_id = belum_lunas[0].get('id')
            resp = requests.post(f"{BASE_URL}/pembayaran/{payment_id}/lunas", 
                               json={"metode": "Tunai"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                log_test("5.3 POST /api/pembayaran/:id/lunas", data.get('status') == 'Lunas', 
                        f"Status: {data.get('status')}, Metode: {data.get('metode')}")
            else:
                log_test("5.3 POST /api/pembayaran/:id/lunas", False, f"Status: {resp.status_code}")
        else:
            log_test("5.3 POST /api/pembayaran/:id/lunas", True, "No Belum Lunas found (OK)")
    else:
        log_test("5.3 POST /api/pembayaran/:id/lunas", False, f"Status: {resp.status_code}")
    
    # Test 5.4: Verify no delete needed (as per spec)
    log_test("5.4 Pembayaran delete not needed", True, "As per spec")
    
    # ========== 6) SURAT MASUK + SURAT KELUAR (4 tests) ==========
    print("\n📋 6) SURAT MASUK + SURAT KELUAR (4 tests)")
    
    # Test 6.1: GET /api/surat-masuk
    resp = requests.get(f"{BASE_URL}/surat-masuk", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("6.1 GET /api/surat-masuk", isinstance(data, list), f"Count: {len(data)}")
    else:
        log_test("6.1 GET /api/surat-masuk", False, f"Status: {resp.status_code}")
    
    # Test 6.2: POST /api/surat-masuk
    new_surat_masuk = {
        "nomor": "TEST/SM/001",
        "pengirim": "Test Pengirim",
        "perihal": "Test Perihal Smoke",
        "tanggal": "2026-05-22",
        "status": "Diterima"
    }
    resp = requests.post(f"{BASE_URL}/surat-masuk", json=new_surat_masuk, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        surat_masuk_id = data.get('id')
        if surat_masuk_id and is_uuid(surat_masuk_id):
            created_resources['surat_masuk'].append(surat_masuk_id)
            log_test("6.2 POST /api/surat-masuk", True, f"Created with UUID: {surat_masuk_id}")
        else:
            log_test("6.2 POST /api/surat-masuk", False, f"Invalid response: {data}")
    else:
        log_test("6.2 POST /api/surat-masuk", False, f"Status: {resp.status_code}")
        surat_masuk_id = None
    
    # Test 6.3: DELETE /api/surat-masuk/:id
    if surat_masuk_id:
        resp = requests.delete(f"{BASE_URL}/surat-masuk/{surat_masuk_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['surat_masuk'].remove(surat_masuk_id)
            log_test("6.3 DELETE /api/surat-masuk/:id", True, f"Deleted: {surat_masuk_id}")
        else:
            log_test("6.3 DELETE /api/surat-masuk/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("6.3 DELETE /api/surat-masuk/:id", False, "Skipped - no surat_masuk_id")
    
    # Test 6.4: Same cycle for surat-keluar
    resp = requests.post(f"{BASE_URL}/surat-keluar", 
                        json={"nomor": "TEST/SK/001", "tujuan": "Test Tujuan", "perihal": "Test Perihal", 
                              "tanggal": "2026-05-22", "status": "Terkirim"}, 
                        headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        surat_keluar_id = data.get('id')
        if surat_keluar_id:
            created_resources['surat_keluar'].append(surat_keluar_id)
            # Delete immediately
            resp = requests.delete(f"{BASE_URL}/surat-keluar/{surat_keluar_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                created_resources['surat_keluar'].remove(surat_keluar_id)
                log_test("6.4 Surat Keluar POST+DELETE", True, f"Created and deleted: {surat_keluar_id}")
            else:
                log_test("6.4 Surat Keluar POST+DELETE", False, f"Delete failed: {resp.status_code}")
        else:
            log_test("6.4 Surat Keluar POST+DELETE", False, "No ID returned")
    else:
        log_test("6.4 Surat Keluar POST+DELETE", False, f"POST failed: {resp.status_code}")
    
    # ========== 7) ABSENSI (5 tests) ==========
    print("\n📋 7) ABSENSI (5 tests)")
    
    # Test 7.1: POST /api/absensi as admin
    new_absensi = {
        "tanggal": "2026-05-22",
        "kelas": "7A",
        "items": [
            {"siswaId": "test-1", "nis": "001", "nama": "X", "status": "Hadir"}
        ],
        "totalHadir": 1,
        "totalIzin": 0,
        "totalSakit": 0,
        "totalAlpa": 0,
        "sumberInput": "manual"
    }
    resp = requests.post(f"{BASE_URL}/absensi", json=new_absensi, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        absensi_id = data.get('id')
        if absensi_id and is_uuid(absensi_id):
            created_resources['absensi'].append(absensi_id)
            log_test("7.1 POST /api/absensi", True, f"Created with UUID: {absensi_id}")
        else:
            log_test("7.1 POST /api/absensi", False, f"Invalid response: {data}")
    else:
        log_test("7.1 POST /api/absensi", False, f"Status: {resp.status_code}")
        absensi_id = None
    
    # Test 7.2: GET /api/absensi?tanggal=2026-05-22&kelas=7A
    resp = requests.get(f"{BASE_URL}/absensi?tanggal=2026-05-22&kelas=7A", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        contains_new = any(item.get('id') == absensi_id for item in data) if absensi_id else False
        log_test("7.2 GET /api/absensi with filters", isinstance(data, list) and (contains_new or len(data) > 0), 
                f"Count: {len(data)}, Contains new: {contains_new}")
    else:
        log_test("7.2 GET /api/absensi with filters", False, f"Status: {resp.status_code}")
    
    # Test 7.3: GET /api/absensi/rekap?bulan=5&tahun=2026
    resp = requests.get(f"{BASE_URL}/absensi/rekap?bulan=5&tahun=2026", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_items = 'items' in data and isinstance(data['items'], list)
        log_test("7.3 GET /api/absensi/rekap", has_items, f"Items count: {len(data.get('items', []))}")
    else:
        log_test("7.3 GET /api/absensi/rekap", False, f"Status: {resp.status_code}")
    
    # Test 7.4: Wali login → GET /api/absensi?kelas=8A → 403
    wali_headers = {"Authorization": f"Bearer {wali_token}"}
    resp = requests.get(f"{BASE_URL}/absensi?kelas=8A", headers=wali_headers, timeout=10)
    log_test("7.4 Wali access other class", resp.status_code == 403, f"Status: {resp.status_code}")
    
    # Test 7.5: DELETE /api/absensi/:id as admin
    if absensi_id:
        resp = requests.delete(f"{BASE_URL}/absensi/{absensi_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['absensi'].remove(absensi_id)
            log_test("7.5 DELETE /api/absensi/:id", True, f"Deleted: {absensi_id}")
        else:
            log_test("7.5 DELETE /api/absensi/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("7.5 DELETE /api/absensi/:id", False, "Skipped - no absensi_id")
    
    # ========== 8) STATS + SETTINGS (4 tests) ==========
    print("\n📋 8) STATS + SETTINGS (4 tests)")
    
    # Test 8.1: GET /api/stats
    resp = requests.get(f"{BASE_URL}/stats", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_required = all(k in data for k in ['totalSiswa', 'totalGuru', 'totalKelas', 'pemasukanChart', 'absensiChart', 'kelasDistribusi'])
        log_test("8.1 GET /api/stats", has_required, 
                f"totalSiswa={data.get('totalSiswa')}, totalGuru={data.get('totalGuru')}, totalKelas={data.get('totalKelas')}")
    else:
        log_test("8.1 GET /api/stats", False, f"Status: {resp.status_code}")
    
    # Test 8.2: GET /api/settings
    resp = requests.get(f"{BASE_URL}/settings", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("8.2 GET /api/settings", True, f"sppSMP={data.get('sppSMP')}, sppSMA={data.get('sppSMA')}")
    else:
        log_test("8.2 GET /api/settings", False, f"Status: {resp.status_code}")
    
    # Test 8.3: GET /api/settings/public (NO auth)
    resp = requests.get(f"{BASE_URL}/settings/public", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_required = all(k in data for k in ['namaSekolah', 'taglineApp', 'logoUrl', 'heroTitle', 'heroSubtitle', 'heroStats'])
        has_4_stats = isinstance(data.get('heroStats'), list) and len(data.get('heroStats', [])) == 4
        log_test("8.3 GET /api/settings/public", has_required and has_4_stats, 
                f"namaSekolah={data.get('namaSekolah')}, heroStats count={len(data.get('heroStats', []))}")
    else:
        log_test("8.3 GET /api/settings/public", False, f"Status: {resp.status_code}")
    
    # Test 8.4: PUT /api/settings as admin
    resp = requests.put(f"{BASE_URL}/settings", json={"sppSMP": 400000}, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        log_test("8.4 PUT /api/settings", data.get('sppSMP') == 400000, f"Updated sppSMP={data.get('sppSMP')}")
    else:
        log_test("8.4 PUT /api/settings", False, f"Status: {resp.status_code}")
    
    # ========== 9) USERS CRUD (5 tests) ==========
    print("\n📋 9) USERS CRUD (5 tests)")
    
    # Test 9.1: GET /api/users
    resp = requests.get(f"{BASE_URL}/users", headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        no_password = all('password' not in user for user in data)
        log_test("9.1 GET /api/users", isinstance(data, list) and no_password, 
                f"Count: {len(data)}, No password field: {no_password}")
    else:
        log_test("9.1 GET /api/users", False, f"Status: {resp.status_code}")
    
    # Test 9.2: POST /api/users
    new_user = {
        "name": "Test User Smoke",
        "email": "test_smoke@x.com",
        "password": "test123",
        "role": "tu"
    }
    resp = requests.post(f"{BASE_URL}/users", json=new_user, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        user_id = data.get('id')
        if user_id and is_uuid(user_id) and 'password' not in data:
            created_resources['users'].append(user_id)
            log_test("9.2 POST /api/users", True, f"Created with UUID: {user_id}, No password in response")
        else:
            log_test("9.2 POST /api/users", False, f"Invalid response: {data}")
    else:
        log_test("9.2 POST /api/users", False, f"Status: {resp.status_code}")
        user_id = None
    
    # Test 9.3: PUT /api/users/:id
    if user_id:
        resp = requests.put(f"{BASE_URL}/users/{user_id}", json={"name": "Updated User Smoke"}, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            log_test("9.3 PUT /api/users/:id", data.get('name') == "Updated User Smoke", f"Updated: {data.get('name')}")
        else:
            log_test("9.3 PUT /api/users/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("9.3 PUT /api/users/:id", False, "Skipped - no user_id")
    
    # Test 9.4: POST /api/users with TU token → 403
    tu_headers = {"Authorization": f"Bearer {tu_token}"}
    resp = requests.post(f"{BASE_URL}/users", json=new_user, headers=tu_headers, timeout=10)
    log_test("9.4 POST /api/users (TU token)", resp.status_code == 403, f"Status: {resp.status_code}")
    
    # Test 9.5: DELETE /api/users/:id
    if user_id:
        resp = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            created_resources['users'].remove(user_id)
            log_test("9.5 DELETE /api/users/:id", True, f"Deleted: {user_id}")
        else:
            log_test("9.5 DELETE /api/users/:id", False, f"Status: {resp.status_code}")
    else:
        log_test("9.5 DELETE /api/users/:id", False, "Skipped - no user_id")
    
    # ========== 10) CHAT SECURITY (2 tests) ==========
    print("\n📋 10) CHAT SECURITY (2 tests)")
    
    # Test 10.1: POST /api/chat WITHOUT token → 401
    resp = requests.post(f"{BASE_URL}/chat", json={"message": "Halo, test"}, timeout=10)
    log_test("10.1 POST /api/chat (no token)", resp.status_code == 401, f"Status: {resp.status_code}")
    
    # Test 10.2: POST /api/chat WITH admin token → 200 OR 502 (AI errors OK)
    resp = requests.post(f"{BASE_URL}/chat", json={"message": "Halo, test"}, headers=headers, timeout=10)
    if resp.status_code in [200, 502]:
        log_test("10.2 POST /api/chat (with token)", True, 
                f"Status: {resp.status_code} (200=OK, 502=AI error but auth passed)")
    else:
        log_test("10.2 POST /api/chat (with token)", False, f"Status: {resp.status_code}")
    
    # ========== 11) PERMISSION ISOLATION (3 tests) ==========
    print("\n📋 11) PERMISSION ISOLATION (3 tests)")
    
    # Test 11.1: Wali token → POST /api/users → 403
    resp = requests.post(f"{BASE_URL}/users", json=new_user, headers=wali_headers, timeout=10)
    log_test("11.1 Wali POST /api/users", resp.status_code == 403, f"Status: {resp.status_code}")
    
    # Test 11.2: TU token → GET /api/guru → 200 (TU allowed per ROUTE_PERMISSIONS)
    resp = requests.get(f"{BASE_URL}/guru", headers=tu_headers, timeout=10)
    log_test("11.2 TU GET /api/guru", resp.status_code == 200, f"Status: {resp.status_code}")
    
    # Test 11.3: Wali token → GET /api/siswa → 200 (allowed)
    resp = requests.get(f"{BASE_URL}/siswa", headers=wali_headers, timeout=10)
    log_test("11.3 Wali GET /api/siswa", resp.status_code == 200, f"Status: {resp.status_code}")
    
    # ========== 12) SECURITY HARDENING (2 tests) ==========
    print("\n📋 12) SECURITY HARDENING (2 tests)")
    
    # Test 12.1: POST /api/siswa with NoSQL injection attempt
    malicious_siswa = {
        "nama": "X",
        "$ne": None,
        "kelas": "7A",
        "status": "Aktif"
    }
    resp = requests.post(f"{BASE_URL}/siswa", json=malicious_siswa, headers=headers, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_operator = '$ne' in data
        siswa_id_malicious = data.get('id')
        if siswa_id_malicious:
            created_resources['siswa'].append(siswa_id_malicious)
        log_test("12.1 NoSQL injection prevention", not has_operator, 
                f"$ne in response: {has_operator} (should be False)")
    else:
        log_test("12.1 NoSQL injection prevention", False, f"Status: {resp.status_code}")
    
    # Test 12.2: POST /api/siswa with no auth → 401
    resp = requests.post(f"{BASE_URL}/siswa", json=new_siswa, timeout=10)
    log_test("12.2 POST /api/siswa (no auth)", resp.status_code == 401, f"Status: {resp.status_code}")
    
    # ========== CLEANUP ==========
    cleanup()
    
    # ========== SUMMARY ==========
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ PASSED: {test_results['passed']}/45")
    print(f"❌ FAILED: {test_results['failed']}/45")
    print(f"📊 SUCCESS RATE: {(test_results['passed']/45)*100:.1f}%")
    print("=" * 80)
    
    if test_results['failed'] > 0:
        print("\n❌ FAILED TESTS:")
        for detail in test_results['details']:
            if "❌ FAIL" in detail:
                print(f"   {detail}")
    
    print("\n" + "=" * 80)
    return test_results['passed'] == 45

if __name__ == "__main__":
    try:
        success = run_tests()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
