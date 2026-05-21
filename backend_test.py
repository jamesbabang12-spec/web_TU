#!/usr/bin/env python3
"""
Backend API Test Suite for SekolahKu School Administration System
Tests all API endpoints with authentication, CRUD operations, and business logic
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://tata-usaha-dashboard.preview.emergentagent.com/api"

# Test credentials
ADMIN_CREDS = {"email": "admin@sekolahku.id", "password": "admin123"}
TU_CREDS = {"email": "tu@sekolahku.id", "password": "tu123"}
WALI_CREDS = {"email": "wali@sekolahku.id", "password": "wali123"}
WRONG_CREDS = {"email": "admin@sekolahku.id", "password": "wrongpassword"}
NONEXISTENT_CREDS = {"email": "nonexistent@test.id", "password": "test123"}

# Global tokens
admin_token = None
tu_token = None
wali_token = None

# Test results
test_results = []

def log_test(test_name, passed, message=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} - {test_name}"
    if message:
        result += f": {message}"
    print(result)
    test_results.append({"test": test_name, "passed": passed, "message": message})
    return passed

def test_auth_admin_login():
    """Test 1: Admin login should return 200 with token and role=admin"""
    global admin_token
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                admin_token = data["token"]
                if data["user"].get("role") == "admin":
                    return log_test("Admin login", True, f"Token received, role=admin")
                else:
                    return log_test("Admin login", False, f"Role is {data['user'].get('role')}, expected admin")
            else:
                return log_test("Admin login", False, "Missing token or user in response")
        else:
            return log_test("Admin login", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("Admin login", False, f"Exception: {str(e)}")

def test_auth_tu_login():
    """Test 2: TU login should return 200 with role=tu"""
    global tu_token
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=TU_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                tu_token = data["token"]
                if data["user"].get("role") == "tu":
                    return log_test("TU login", True, f"Token received, role=tu")
                else:
                    return log_test("TU login", False, f"Role is {data['user'].get('role')}, expected tu")
            else:
                return log_test("TU login", False, "Missing token or user in response")
        else:
            return log_test("TU login", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("TU login", False, f"Exception: {str(e)}")

def test_auth_wali_login():
    """Test 3: Wali Kelas login should return 200 with role=wali_kelas"""
    global wali_token
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=WALI_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                wali_token = data["token"]
                if data["user"].get("role") == "wali_kelas":
                    return log_test("Wali Kelas login", True, f"Token received, role=wali_kelas")
                else:
                    return log_test("Wali Kelas login", False, f"Role is {data['user'].get('role')}, expected wali_kelas")
            else:
                return log_test("Wali Kelas login", False, "Missing token or user in response")
        else:
            return log_test("Wali Kelas login", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("Wali Kelas login", False, f"Exception: {str(e)}")

def test_auth_wrong_password():
    """Test 4: Login with wrong password should return 401"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=WRONG_CREDS, timeout=10)
        if response.status_code == 401:
            return log_test("Wrong password returns 401", True)
        else:
            return log_test("Wrong password returns 401", False, f"Got status {response.status_code}")
    except Exception as e:
        return log_test("Wrong password returns 401", False, f"Exception: {str(e)}")

def test_auth_nonexistent_email():
    """Test 5: Login with non-existent email should return 401"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=NONEXISTENT_CREDS, timeout=10)
        if response.status_code == 401:
            return log_test("Non-existent email returns 401", True)
        else:
            return log_test("Non-existent email returns 401", False, f"Got status {response.status_code}")
    except Exception as e:
        return log_test("Non-existent email returns 401", False, f"Exception: {str(e)}")

def test_protected_route_no_token():
    """Test 6: GET /api/siswa without token should return 401"""
    try:
        response = requests.get(f"{BASE_URL}/siswa", timeout=10)
        if response.status_code == 401:
            return log_test("Protected route without token returns 401", True)
        else:
            return log_test("Protected route without token returns 401", False, f"Got status {response.status_code}")
    except Exception as e:
        return log_test("Protected route without token returns 401", False, f"Exception: {str(e)}")

def test_protected_route_with_token():
    """Test 7: GET /api/siswa with admin token should return array"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/siswa", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Check that no _id field exists in any item
                has_id_field = any("_id" in item for item in data)
                if has_id_field:
                    return log_test("GET /api/siswa with token", False, f"Response contains _id field (should be stripped)")
                return log_test("GET /api/siswa with token", True, f"Returned {len(data)} students, no _id field")
            else:
                return log_test("GET /api/siswa with token", False, "Response is not an array")
        else:
            return log_test("GET /api/siswa with token", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("GET /api/siswa with token", False, f"Exception: {str(e)}")

def test_crud_siswa_list():
    """Test 8: GET /api/siswa - list students"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/siswa", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                return log_test("GET /api/siswa list", True, f"Retrieved {len(data)} students")
            else:
                return log_test("GET /api/siswa list", False, "Empty or invalid response")
        else:
            return log_test("GET /api/siswa list", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("GET /api/siswa list", False, f"Exception: {str(e)}")

def test_crud_siswa_create():
    """Test 9: POST /api/siswa - create student with UUID, no _id"""
    global created_siswa_id
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        new_siswa = {
            "nis": "99999999",
            "nama": "Ahmad Rizki Pratama",
            "kelas": "7A",
            "jenisKelamin": "Laki-laki",
            "alamat": "Jl. Merdeka No. 45, Jakarta Selatan",
            "telepon": "08123456789",
            "email": "ahmad.rizki@student.sekolahku.id",
            "status": "Aktif"
        }
        response = requests.post(f"{BASE_URL}/siswa", json=new_siswa, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "_id" not in data:
                created_siswa_id = data["id"]
                # Verify it's a UUID format
                if len(data["id"]) == 36 and data["id"].count("-") == 4:
                    return log_test("POST /api/siswa create", True, f"Created with UUID {data['id'][:8]}..., no _id")
                else:
                    return log_test("POST /api/siswa create", False, f"ID format invalid: {data['id']}")
            else:
                return log_test("POST /api/siswa create", False, f"Missing id or has _id: {data}")
        else:
            return log_test("POST /api/siswa create", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("POST /api/siswa create", False, f"Exception: {str(e)}")

def test_crud_siswa_update():
    """Test 10: PUT /api/siswa/:id - update student"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        update_data = {"nama": "Ahmad Rizki Pratama (Updated)"}
        response = requests.put(f"{BASE_URL}/siswa/{created_siswa_id}", json=update_data, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("nama") == "Ahmad Rizki Pratama (Updated)":
                return log_test("PUT /api/siswa update", True, "Name updated successfully")
            else:
                return log_test("PUT /api/siswa update", False, f"Name not updated: {data.get('nama')}")
        else:
            return log_test("PUT /api/siswa update", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("PUT /api/siswa update", False, f"Exception: {str(e)}")

def test_crud_siswa_delete():
    """Test 11: DELETE /api/siswa/:id - delete student"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BASE_URL}/siswa/{created_siswa_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                return log_test("DELETE /api/siswa", True, "Deleted successfully")
            else:
                return log_test("DELETE /api/siswa", False, f"Response: {data}")
        else:
            return log_test("DELETE /api/siswa", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("DELETE /api/siswa", False, f"Exception: {str(e)}")

def test_crud_guru():
    """Test 12: CRUD for /api/guru"""
    global created_guru_id
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create
        new_guru = {
            "nip": "198501012010011001",
            "nama": "Dr. Siti Nurhaliza, M.Pd",
            "mapel": "Matematika",
            "jenisKelamin": "Perempuan",
            "telepon": "08198765432",
            "email": "siti.nurhaliza@sekolahku.id",
            "status": "Aktif"
        }
        response = requests.post(f"{BASE_URL}/guru", json=new_guru, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/guru", False, f"Create failed: {response.status_code}")
        
        data = response.json()
        if "id" not in data or "_id" in data:
            return log_test("CRUD /api/guru", False, "Create: missing id or has _id")
        
        created_guru_id = data["id"]
        
        # Update
        update_data = {"nama": "Dr. Siti Nurhaliza, M.Pd (Updated)"}
        response = requests.put(f"{BASE_URL}/guru/{created_guru_id}", json=update_data, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/guru", False, f"Update failed: {response.status_code}")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/guru/{created_guru_id}", headers=headers, timeout=10)
        if response.status_code != 200 or not response.json().get("ok"):
            return log_test("CRUD /api/guru", False, f"Delete failed")
        
        return log_test("CRUD /api/guru", True, "Create, Update, Delete all successful")
    except Exception as e:
        return log_test("CRUD /api/guru", False, f"Exception: {str(e)}")

def test_crud_kelas():
    """Test 13: CRUD for /api/kelas"""
    global created_kelas_id
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create
        new_kelas = {
            "nama": "7Z",
            "tingkat": "7",
            "waliKelas": "Pak Budi",
            "ruangan": "R-101",
            "jumlahSiswa": 30
        }
        response = requests.post(f"{BASE_URL}/kelas", json=new_kelas, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/kelas", False, f"Create failed: {response.status_code}")
        
        data = response.json()
        if "id" not in data or "_id" in data:
            return log_test("CRUD /api/kelas", False, "Create: missing id or has _id")
        
        created_kelas_id = data["id"]
        
        # Update
        update_data = {"jumlahSiswa": 32}
        response = requests.put(f"{BASE_URL}/kelas/{created_kelas_id}", json=update_data, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/kelas", False, f"Update failed: {response.status_code}")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/kelas/{created_kelas_id}", headers=headers, timeout=10)
        if response.status_code != 200 or not response.json().get("ok"):
            return log_test("CRUD /api/kelas", False, f"Delete failed")
        
        return log_test("CRUD /api/kelas", True, "Create, Update, Delete all successful")
    except Exception as e:
        return log_test("CRUD /api/kelas", False, f"Exception: {str(e)}")

def test_crud_surat_masuk():
    """Test 14: CRUD for /api/surat-masuk"""
    global created_surat_masuk_id
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create
        new_surat = {
            "nomor": "001/SM/TEST/2025",
            "tanggal": "2025-01-15",
            "pengirim": "Dinas Pendidikan Jakarta",
            "perihal": "Undangan Rapat Koordinasi",
            "status": "Belum Dibaca"
        }
        response = requests.post(f"{BASE_URL}/surat-masuk", json=new_surat, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/surat-masuk", False, f"Create failed: {response.status_code}")
        
        data = response.json()
        if "id" not in data or "_id" in data:
            return log_test("CRUD /api/surat-masuk", False, "Create: missing id or has _id")
        
        created_surat_masuk_id = data["id"]
        
        # Update
        update_data = {"status": "Sudah Dibaca"}
        response = requests.put(f"{BASE_URL}/surat-masuk/{created_surat_masuk_id}", json=update_data, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/surat-masuk", False, f"Update failed: {response.status_code}")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/surat-masuk/{created_surat_masuk_id}", headers=headers, timeout=10)
        if response.status_code != 200 or not response.json().get("ok"):
            return log_test("CRUD /api/surat-masuk", False, f"Delete failed")
        
        return log_test("CRUD /api/surat-masuk", True, "Create, Update, Delete all successful")
    except Exception as e:
        return log_test("CRUD /api/surat-masuk", False, f"Exception: {str(e)}")

def test_crud_surat_keluar():
    """Test 15: CRUD for /api/surat-keluar"""
    global created_surat_keluar_id
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create
        new_surat = {
            "nomor": "001/SK/TEST/2025",
            "tanggal": "2025-01-15",
            "tujuan": "Orang Tua Siswa Kelas 7A",
            "perihal": "Undangan Pertemuan Wali Murid",
            "status": "Draft"
        }
        response = requests.post(f"{BASE_URL}/surat-keluar", json=new_surat, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/surat-keluar", False, f"Create failed: {response.status_code}")
        
        data = response.json()
        if "id" not in data or "_id" in data:
            return log_test("CRUD /api/surat-keluar", False, "Create: missing id or has _id")
        
        created_surat_keluar_id = data["id"]
        
        # Update
        update_data = {"status": "Terkirim"}
        response = requests.put(f"{BASE_URL}/surat-keluar/{created_surat_keluar_id}", json=update_data, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("CRUD /api/surat-keluar", False, f"Update failed: {response.status_code}")
        
        # Delete
        response = requests.delete(f"{BASE_URL}/surat-keluar/{created_surat_keluar_id}", headers=headers, timeout=10)
        if response.status_code != 200 or not response.json().get("ok"):
            return log_test("CRUD /api/surat-keluar", False, f"Delete failed")
        
        return log_test("CRUD /api/surat-keluar", True, "Create, Update, Delete all successful")
    except Exception as e:
        return log_test("CRUD /api/surat-keluar", False, f"Exception: {str(e)}")

def test_pembayaran_list():
    """Test 16: GET /api/pembayaran - list payments"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/pembayaran", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                return log_test("GET /api/pembayaran list", True, f"Retrieved {len(data)} payments")
            else:
                return log_test("GET /api/pembayaran list", False, "Response is not an array")
        else:
            return log_test("GET /api/pembayaran list", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("GET /api/pembayaran list", False, f"Exception: {str(e)}")

def test_pembayaran_generate_tagihan():
    """Test 17: POST /api/pembayaran/generate-tagihan - idempotent"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        tagihan_data = {"bulan": "Juli", "tahun": 2025}
        
        # First call
        response1 = requests.post(f"{BASE_URL}/pembayaran/generate-tagihan", json=tagihan_data, headers=headers, timeout=10)
        if response1.status_code != 200:
            return log_test("POST /api/pembayaran/generate-tagihan", False, f"First call failed: {response1.status_code}")
        
        data1 = response1.json()
        if not data1.get("ok") or "created" not in data1:
            return log_test("POST /api/pembayaran/generate-tagihan", False, f"Invalid response: {data1}")
        
        created_count = data1["created"]
        
        # Second call (should be idempotent)
        response2 = requests.post(f"{BASE_URL}/pembayaran/generate-tagihan", json=tagihan_data, headers=headers, timeout=10)
        if response2.status_code != 200:
            return log_test("POST /api/pembayaran/generate-tagihan", False, f"Second call failed: {response2.status_code}")
        
        data2 = response2.json()
        if data2.get("created") == 0:
            return log_test("POST /api/pembayaran/generate-tagihan", True, f"First call created {created_count}, second call created 0 (idempotent)")
        else:
            return log_test("POST /api/pembayaran/generate-tagihan", False, f"Not idempotent: second call created {data2.get('created')}")
    except Exception as e:
        return log_test("POST /api/pembayaran/generate-tagihan", False, f"Exception: {str(e)}")

def test_pembayaran_mark_lunas():
    """Test 18: POST /api/pembayaran/:id/lunas - mark payment as paid"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get list of unpaid payments
        response = requests.get(f"{BASE_URL}/pembayaran", headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("POST /api/pembayaran/:id/lunas", False, "Failed to get payment list")
        
        payments = response.json()
        unpaid = [p for p in payments if p.get("status") == "Belum Lunas"]
        
        if not unpaid:
            return log_test("POST /api/pembayaran/:id/lunas", False, "No unpaid payments found to test")
        
        payment_id = unpaid[0]["id"]
        
        # Mark as paid
        response = requests.post(f"{BASE_URL}/pembayaran/{payment_id}/lunas", json={"metode": "Tunai"}, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("POST /api/pembayaran/:id/lunas", False, f"Failed: {response.status_code}")
        
        data = response.json()
        if data.get("status") == "Lunas" and data.get("tanggalBayar"):
            today = datetime.now().strftime("%Y-%m-%d")
            if data["tanggalBayar"].startswith(today):
                return log_test("POST /api/pembayaran/:id/lunas", True, f"Marked as Lunas with today's date")
            else:
                return log_test("POST /api/pembayaran/:id/lunas", True, f"Marked as Lunas (date: {data['tanggalBayar']})")
        else:
            return log_test("POST /api/pembayaran/:id/lunas", False, f"Status not updated: {data}")
    except Exception as e:
        return log_test("POST /api/pembayaran/:id/lunas", False, f"Exception: {str(e)}")

def test_stats_endpoint():
    """Test 19: GET /api/stats - returns populated stats"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/stats", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ["totalSiswa", "totalGuru", "totalKelas", "pembayaranHariIni", "pemasukanChart", "absensiChart", "kelasDistribusi"]
            missing = [f for f in required_fields if f not in data]
            if missing:
                return log_test("GET /api/stats", False, f"Missing fields: {missing}")
            
            # Verify data types
            if not isinstance(data["pemasukanChart"], list):
                return log_test("GET /api/stats", False, "pemasukanChart is not an array")
            if not isinstance(data["absensiChart"], list):
                return log_test("GET /api/stats", False, "absensiChart is not an array")
            if not isinstance(data["kelasDistribusi"], list):
                return log_test("GET /api/stats", False, "kelasDistribusi is not an array")
            
            return log_test("GET /api/stats", True, f"All fields present: siswa={data['totalSiswa']}, guru={data['totalGuru']}, kelas={data['totalKelas']}")
        else:
            return log_test("GET /api/stats", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("GET /api/stats", False, f"Exception: {str(e)}")

def test_settings_get():
    """Test 20: GET /api/settings - returns school settings"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/settings", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "sppSMP" in data and "sppSMA" in data:
                return log_test("GET /api/settings", True, f"sppSMP={data['sppSMP']}, sppSMA={data['sppSMA']}")
            else:
                return log_test("GET /api/settings", False, "Missing sppSMP or sppSMA fields")
        else:
            return log_test("GET /api/settings", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("GET /api/settings", False, f"Exception: {str(e)}")

def test_settings_update():
    """Test 21: PUT /api/settings - update settings"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current settings
        response = requests.get(f"{BASE_URL}/settings", headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("PUT /api/settings", False, "Failed to get current settings")
        
        original = response.json()
        
        # Update
        update_data = {"sppSMP": 450000}
        response = requests.put(f"{BASE_URL}/settings", json=update_data, headers=headers, timeout=10)
        if response.status_code != 200:
            return log_test("PUT /api/settings", False, f"Update failed: {response.status_code}")
        
        data = response.json()
        if data.get("sppSMP") == 450000:
            # Restore original
            requests.put(f"{BASE_URL}/settings", json={"sppSMP": original.get("sppSMP", 400000)}, headers=headers, timeout=10)
            return log_test("PUT /api/settings", True, "Updated sppSMP to 450000")
        else:
            return log_test("PUT /api/settings", False, f"sppSMP not updated: {data.get('sppSMP')}")
    except Exception as e:
        return log_test("PUT /api/settings", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests in sequence"""
    print("=" * 80)
    print("SekolahKu Backend API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print("=" * 80)
    print()
    
    print("🔐 AUTHENTICATION TESTS")
    print("-" * 80)
    test_auth_admin_login()
    test_auth_tu_login()
    test_auth_wali_login()
    test_auth_wrong_password()
    test_auth_nonexistent_email()
    print()
    
    print("🔒 PROTECTED ROUTE TESTS")
    print("-" * 80)
    test_protected_route_no_token()
    test_protected_route_with_token()
    print()
    
    print("📚 CRUD TESTS - SISWA")
    print("-" * 80)
    test_crud_siswa_list()
    test_crud_siswa_create()
    test_crud_siswa_update()
    test_crud_siswa_delete()
    print()
    
    print("👨‍🏫 CRUD TESTS - GURU, KELAS, SURAT")
    print("-" * 80)
    test_crud_guru()
    test_crud_kelas()
    test_crud_surat_masuk()
    test_crud_surat_keluar()
    print()
    
    print("💰 PEMBAYARAN SPP TESTS")
    print("-" * 80)
    test_pembayaran_list()
    test_pembayaran_generate_tagihan()
    test_pembayaran_mark_lunas()
    print()
    
    print("📊 STATS & SETTINGS TESTS")
    print("-" * 80)
    test_stats_endpoint()
    test_settings_get()
    test_settings_update()
    print()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print()
    
    if failed > 0:
        print("❌ FAILED TESTS:")
        for r in test_results:
            if not r["passed"]:
                print(f"  - {r['test']}: {r['message']}")
        print()
    
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
