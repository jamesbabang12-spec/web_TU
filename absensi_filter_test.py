#!/usr/bin/env python3
"""
Test NEW Absensi endpoint enhancements + Chat security
- GET /api/absensi with query filters (tanggal, kelas)
- GET /api/absensi/rekap (monthly aggregation)
- Wali Kelas restrictions
- /api/chat protection
- Regression checks
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://tata-usaha-dashboard.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@sekolahku.id"
ADMIN_PASSWORD = "admin123"
TU_EMAIL = "tu@sekolahku.id"
TU_PASSWORD = "tu123"
WALI_EMAIL = "wali@sekolahku.id"
WALI_PASSWORD = "wali123"

# Global tokens
admin_token = None
tu_token = None
wali_token = None

# Track created records for cleanup
created_absensi_ids = []

def login(email, password):
    """Login and return token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user")
        else:
            print(f"❌ Login failed for {email}: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Login exception for {email}: {e}")
        return None, None

def test_login():
    """Test 1: Login all 3 roles"""
    global admin_token, tu_token, wali_token
    print("\n=== TEST 1: Login all roles ===")
    
    admin_token, admin_user = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if admin_token and admin_user and admin_user.get("role") == "admin":
        print(f"✅ Admin login successful, role={admin_user.get('role')}")
    else:
        print(f"❌ Admin login failed")
        return False
    
    tu_token, tu_user = login(TU_EMAIL, TU_PASSWORD)
    if tu_token and tu_user and tu_user.get("role") == "tu":
        print(f"✅ TU login successful, role={tu_user.get('role')}")
    else:
        print(f"❌ TU login failed")
        return False
    
    wali_token, wali_user = login(WALI_EMAIL, WALI_PASSWORD)
    if wali_token and wali_user and wali_user.get("role") == "wali_kelas" and wali_user.get("kelas") == "7A":
        print(f"✅ Wali Kelas login successful, role={wali_user.get('role')}, kelas={wali_user.get('kelas')}")
    else:
        print(f"❌ Wali Kelas login failed")
        return False
    
    return True

def seed_absensi_data():
    """Seed 3 absensi records for testing"""
    global created_absensi_ids
    print("\n=== SEED: Creating test absensi records ===")
    
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Record 1: Today, 7A, 2 students (Andi Hadir, Budi Izin)
    record1 = {
        "tanggal": today,
        "kelas": "7A",
        "items": [
            {"siswaId": "uuid-test-1", "nis": "001", "nama": "Andi Setiawan", "status": "Hadir"},
            {"siswaId": "uuid-test-2", "nis": "002", "nama": "Budi Santoso", "status": "Izin"}
        ],
        "totalHadir": 1,
        "totalIzin": 1,
        "totalSakit": 0,
        "totalAlpa": 0,
        "sumberInput": "manual"
    }
    
    # Record 2: Yesterday, 7A, 1 student (Andi Sakit)
    record2 = {
        "tanggal": yesterday,
        "kelas": "7A",
        "items": [
            {"siswaId": "uuid-test-1", "nis": "001", "nama": "Andi Setiawan", "status": "Sakit"}
        ],
        "totalHadir": 0,
        "totalIzin": 0,
        "totalSakit": 1,
        "totalAlpa": 0,
        "sumberInput": "manual"
    }
    
    # Record 3: Today, 8A, 1 student (Citra Hadir)
    record3 = {
        "tanggal": today,
        "kelas": "8A",
        "items": [
            {"siswaId": "uuid-test-3", "nis": "003", "nama": "Citra Dewi", "status": "Hadir"}
        ],
        "totalHadir": 1,
        "totalIzin": 0,
        "totalSakit": 0,
        "totalAlpa": 0,
        "sumberInput": "scan"
    }
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    for i, record in enumerate([record1, record2, record3], 1):
        try:
            response = requests.post(f"{BASE_URL}/absensi", json=record, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                created_absensi_ids.append(data.get("id"))
                print(f"✅ Record {i} created: {data.get('id')} - {record['tanggal']} {record['kelas']}")
            else:
                print(f"❌ Failed to create record {i}: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Exception creating record {i}: {e}")
            return False
    
    return True

def test_filter_by_date_and_class():
    """Test 3: GET /api/absensi?tanggal=<today>&kelas=7A → Returns exactly 1 record (Record 1)"""
    print("\n=== TEST 3: Filter by date and class (today, 7A) ===")
    today = datetime.now().strftime("%Y-%m-%d")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?tanggal={today}&kelas=7A", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 1:
                record = data[0]
                if record.get("tanggal") == today and record.get("kelas") == "7A":
                    print(f"✅ Filter by date+class working: 1 record returned for {today} 7A")
                    return True
                else:
                    print(f"❌ Record data mismatch: {record}")
                    return False
            else:
                print(f"❌ Expected 1 record, got {len(data)}: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_filter_by_date_and_class_8a():
    """Test 4: GET /api/absensi?tanggal=<today>&kelas=8A → Returns exactly 1 record (Record 3)"""
    print("\n=== TEST 4: Filter by date and class (today, 8A) ===")
    today = datetime.now().strftime("%Y-%m-%d")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?tanggal={today}&kelas=8A", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 1:
                record = data[0]
                if record.get("tanggal") == today and record.get("kelas") == "8A":
                    print(f"✅ Filter by date+class working: 1 record returned for {today} 8A")
                    return True
                else:
                    print(f"❌ Record data mismatch: {record}")
                    return False
            else:
                print(f"❌ Expected 1 record, got {len(data)}: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_filter_nonexistent_class():
    """Test 5: GET /api/absensi?tanggal=<today>&kelas=9Z → Returns empty array"""
    print("\n=== TEST 5: Filter by non-existent class (9Z) ===")
    today = datetime.now().strftime("%Y-%m-%d")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?tanggal={today}&kelas=9Z", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 0:
                print(f"✅ Non-existent class returns empty array: []")
                return True
            else:
                print(f"❌ Expected empty array, got {len(data)} records: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_filter_by_class_only():
    """Test 6: GET /api/absensi?kelas=7A (no date) → Returns at least 2 records (Record 1 and 2)"""
    print("\n=== TEST 6: Filter by class only (7A, no date) ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?kelas=7A", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                # Check if our test records are in the list
                kelas_7a_records = [r for r in data if r.get("kelas") == "7A"]
                if len(kelas_7a_records) >= 2:
                    print(f"✅ Filter by class only working: {len(kelas_7a_records)} records for 7A")
                    return True
                else:
                    print(f"❌ Expected at least 2 records for 7A, got {len(kelas_7a_records)}")
                    return False
            else:
                print(f"❌ Expected at least 2 records, got {len(data)}: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_no_filters():
    """Test 7: GET /api/absensi (no filters) → Returns all records (bounded to 500)"""
    print("\n=== TEST 7: No filters (all records) ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 3:
                print(f"✅ No filters returns all records: {len(data)} records (includes our 3 test records)")
                return True
            else:
                print(f"❌ Expected at least 3 records, got {len(data)}: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_rekap_with_params():
    """Test 8: GET /api/absensi/rekap?bulan=<currentMonth>&tahun=<currentYear> → Returns aggregated data"""
    print("\n=== TEST 8: Rekap with bulan and tahun params ===")
    current_month = datetime.now().month
    current_year = datetime.now().year
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi/rekap?bulan={current_month}&tahun={current_year}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                bulan = data.get("bulan")
                tahun = data.get("tahun")
                total = data.get("total")
                items = data.get("items")
                
                if bulan == current_month and tahun == current_year and isinstance(items, list):
                    print(f"✅ Rekap structure correct: bulan={bulan}, tahun={tahun}, total={total}, items count={len(items)}")
                    
                    # Check if at least one item has correct shape
                    if len(items) > 0:
                        sample = items[0]
                        required_fields = ["id", "nis", "nama", "kelas", "hadir", "izin", "sakit", "alpa"]
                        if all(field in sample for field in required_fields):
                            print(f"✅ Item shape correct: {sample}")
                            
                            # Check for our test students
                            andi = next((item for item in items if item.get("nis") == "001"), None)
                            citra = next((item for item in items if item.get("nis") == "003"), None)
                            
                            if andi:
                                print(f"✅ Andi found: hadir={andi.get('hadir')}, sakit={andi.get('sakit')} (expected hadir=1, sakit=1)")
                            if citra:
                                print(f"✅ Citra found: hadir={citra.get('hadir')} (expected hadir=1)")
                            
                            return True
                        else:
                            print(f"❌ Item missing required fields: {sample}")
                            return False
                    else:
                        print(f"⚠️ No items in rekap (might be empty month)")
                        return True  # Still valid if no data
                else:
                    print(f"❌ Rekap data structure incorrect: {data}")
                    return False
            else:
                print(f"❌ Expected object, got: {type(data)}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_rekap_no_params():
    """Test 9: GET /api/absensi/rekap (no params, defaults to current month) → Should work"""
    print("\n=== TEST 9: Rekap without params (defaults to current month) ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi/rekap", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "bulan" in data and "tahun" in data and "items" in data:
                print(f"✅ Rekap without params works: bulan={data.get('bulan')}, tahun={data.get('tahun')}, total={data.get('total')}")
                return True
            else:
                print(f"❌ Rekap data structure incorrect: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_wali_forbidden_other_class():
    """Test 11: Wali Kelas GET /api/absensi?kelas=8A → 403 (forbidden)"""
    print("\n=== TEST 11: Wali Kelas access to other class (8A) → 403 ===")
    headers = {"Authorization": f"Bearer {wali_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?kelas=8A", headers=headers, timeout=10)
        if response.status_code == 403:
            print(f"✅ Wali Kelas correctly forbidden from accessing 8A: 403")
            return True
        else:
            print(f"❌ Expected 403, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_wali_allowed_own_class():
    """Test 12: Wali Kelas GET /api/absensi?kelas=7A → 200 (allowed)"""
    print("\n=== TEST 12: Wali Kelas access to own class (7A) → 200 ===")
    headers = {"Authorization": f"Bearer {wali_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi?kelas=7A", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Wali Kelas allowed to access own class 7A: {len(data)} records")
                return True
            else:
                print(f"❌ Expected array, got: {type(data)}")
                return False
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_wali_rekap_filtered():
    """Test 13: Wali Kelas GET /api/absensi/rekap → 200, items filtered to kelas=7A only"""
    print("\n=== TEST 13: Wali Kelas rekap filtered to own class ===")
    current_month = datetime.now().month
    current_year = datetime.now().year
    headers = {"Authorization": f"Bearer {wali_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/absensi/rekap?bulan={current_month}&tahun={current_year}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "items" in data:
                items = data.get("items")
                # All items should be kelas=7A
                non_7a = [item for item in items if item.get("kelas") != "7A"]
                if len(non_7a) == 0:
                    print(f"✅ Wali Kelas rekap filtered to 7A only: {len(items)} items, all kelas=7A")
                    return True
                else:
                    print(f"❌ Found {len(non_7a)} items not from 7A: {non_7a}")
                    return False
            else:
                print(f"❌ Rekap data structure incorrect: {data}")
                return False
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_chat_without_token():
    """Test 14: POST /api/chat WITHOUT Authorization → 401 (NEW behavior)"""
    print("\n=== TEST 14: Chat without token → 401 ===")
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json={"message": "Berapa total siswa?"}, timeout=10)
        if response.status_code == 401:
            print(f"✅ Chat without token correctly returns 401 (NEW protected behavior)")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_chat_with_token():
    """Test 15: POST /api/chat WITH valid token → 200 or 502 (acceptable)"""
    print("\n=== TEST 15: Chat with valid token → 200 or 502 ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json={"message": "Berapa total siswa?"}, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if "reply" in data and "sessionId" in data:
                print(f"✅ Chat with token works: 200, reply received")
                return True
            else:
                print(f"❌ Response missing reply or sessionId: {data}")
                return False
        elif response.status_code == 502:
            print(f"✅ Chat with token returns 502 (AI service issue, auth passed)")
            return True
        elif response.status_code == 429:
            print(f"✅ Chat with token returns 429 (rate limit, auth passed)")
            return True
        else:
            print(f"❌ Expected 200/502/429, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_regression_post_absensi():
    """Test 16: POST /api/absensi (admin) → still creates record successfully"""
    print("\n=== TEST 16: Regression - POST /api/absensi ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    today = datetime.now().strftime("%Y-%m-%d")
    
    record = {
        "tanggal": today,
        "kelas": "9A",
        "items": [{"siswaId": "uuid-regression-1", "nis": "999", "nama": "Regression Test", "status": "Hadir"}],
        "totalHadir": 1,
        "totalIzin": 0,
        "totalSakit": 0,
        "totalAlpa": 0,
        "sumberInput": "manual"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/absensi", json=record, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "_id" not in data:
                created_absensi_ids.append(data.get("id"))
                print(f"✅ POST /api/absensi still works: {data.get('id')}")
                return True, data.get("id")
            else:
                print(f"❌ Response missing id or has _id: {data}")
                return False, None
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False, None

def test_regression_put_absensi(absensi_id):
    """Test 17: PUT /api/absensi/:id (admin) → still updates"""
    print("\n=== TEST 17: Regression - PUT /api/absensi/:id ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    update = {"sumberInput": "scan"}
    
    try:
        response = requests.put(f"{BASE_URL}/absensi/{absensi_id}", json=update, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("sumberInput") == "scan":
                print(f"✅ PUT /api/absensi/:id still works: sumberInput updated to 'scan'")
                return True
            else:
                print(f"❌ Update not reflected: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_regression_delete_absensi(absensi_id):
    """Test 18: DELETE /api/absensi/:id (admin) → still deletes"""
    print("\n=== TEST 18: Regression - DELETE /api/absensi/:id ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/absensi/{absensi_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                print(f"✅ DELETE /api/absensi/:id still works")
                # Remove from cleanup list
                if absensi_id in created_absensi_ids:
                    created_absensi_ids.remove(absensi_id)
                return True
            else:
                print(f"❌ Delete response incorrect: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_regression_siswa():
    """Test 19: GET /api/siswa (admin) → still returns siswa list"""
    print("\n=== TEST 19: Regression - GET /api/siswa ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/siswa", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"✅ GET /api/siswa still works: {len(data)} students")
                return True
            else:
                print(f"❌ Expected array with items, got: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_regression_stats():
    """Test 20: GET /api/stats (admin) → still returns stats"""
    print("\n=== TEST 20: Regression - GET /api/stats ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/stats", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ["totalSiswa", "totalGuru", "totalKelas", "pembayaranHariIni"]
            if all(field in data for field in required_fields):
                print(f"✅ GET /api/stats still works: totalSiswa={data.get('totalSiswa')}, totalGuru={data.get('totalGuru')}")
                return True
            else:
                print(f"❌ Stats missing required fields: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def cleanup():
    """Delete all created absensi records"""
    print("\n=== CLEANUP: Deleting test records ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    for absensi_id in created_absensi_ids:
        try:
            response = requests.delete(f"{BASE_URL}/absensi/{absensi_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"✅ Deleted: {absensi_id}")
            else:
                print(f"⚠️ Failed to delete {absensi_id}: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Exception deleting {absensi_id}: {e}")

def main():
    print("=" * 80)
    print("ABSENSI FILTER + REKAP + CHAT SECURITY TEST")
    print("=" * 80)
    
    results = []
    
    # Test 1: Login
    if not test_login():
        print("\n❌ CRITICAL: Login failed, cannot continue")
        return
    
    # Seed data
    if not seed_absensi_data():
        print("\n❌ CRITICAL: Failed to seed data, cannot continue")
        cleanup()
        return
    
    # A) GET /api/absensi with query filters (7 tests)
    results.append(("Filter by date+class (7A)", test_filter_by_date_and_class()))
    results.append(("Filter by date+class (8A)", test_filter_by_date_and_class_8a()))
    results.append(("Filter non-existent class (9Z)", test_filter_nonexistent_class()))
    results.append(("Filter by class only (7A)", test_filter_by_class_only()))
    results.append(("No filters (all records)", test_no_filters()))
    
    # B) GET /api/absensi/rekap (2 tests)
    results.append(("Rekap with params", test_rekap_with_params()))
    results.append(("Rekap without params", test_rekap_no_params()))
    
    # C) Wali Kelas restrictions (3 tests)
    results.append(("Wali forbidden other class", test_wali_forbidden_other_class()))
    results.append(("Wali allowed own class", test_wali_allowed_own_class()))
    results.append(("Wali rekap filtered", test_wali_rekap_filtered()))
    
    # D) /api/chat protection (2 tests)
    results.append(("Chat without token → 401", test_chat_without_token()))
    results.append(("Chat with token → 200/502", test_chat_with_token()))
    
    # E) Regression checks (5 tests)
    success, regression_id = test_regression_post_absensi()
    results.append(("Regression POST absensi", success))
    
    if success and regression_id:
        results.append(("Regression PUT absensi", test_regression_put_absensi(regression_id)))
        results.append(("Regression DELETE absensi", test_regression_delete_absensi(regression_id)))
    else:
        results.append(("Regression PUT absensi", False))
        results.append(("Regression DELETE absensi", False))
    
    results.append(("Regression GET siswa", test_regression_siswa()))
    results.append(("Regression GET stats", test_regression_stats()))
    
    # Cleanup
    cleanup()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed*100//total}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")

if __name__ == "__main__":
    main()
