#!/usr/bin/env python3
"""
Absensi (Attendance) Backend API Test Suite
Tests the new absensi endpoints with role-based permissions
"""

import requests
import json
import sys
from uuid import uuid4

# Base URL from environment
BASE_URL = "https://tata-usaha-dashboard.preview.emergentagent.com/api"

# Test credentials
ADMIN_CREDS = {"email": "admin@sekolahku.id", "password": "admin123"}
TU_CREDS = {"email": "tu@sekolahku.id", "password": "tu123"}
WALI_CREDS = {"email": "wali@sekolahku.id", "password": "wali123"}

# Global tokens and IDs
admin_token = None
tu_token = None
wali_token = None
created_absensi_id_admin = None
created_absensi_id_wali = None

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

def test_login_all_roles():
    """Test 1-3: Login all 3 roles"""
    global admin_token, tu_token, wali_token
    
    # Admin login
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and data["user"].get("role") == "admin":
                admin_token = data["token"]
                log_test("Admin login", True, "Token received, role=admin")
            else:
                log_test("Admin login", False, f"Invalid response: {data}")
                return False
        else:
            log_test("Admin login", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("Admin login", False, f"Exception: {str(e)}")
        return False
    
    # TU login
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=TU_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and data["user"].get("role") == "tu":
                tu_token = data["token"]
                log_test("TU login", True, "Token received, role=tu")
            else:
                log_test("TU login", False, f"Invalid response: {data}")
                return False
        else:
            log_test("TU login", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("TU login", False, f"Exception: {str(e)}")
        return False
    
    # Wali Kelas login
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=WALI_CREDS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "token" in data and data["user"].get("role") == "wali_kelas":
                wali_token = data["token"]
                log_test("Wali Kelas login", True, "Token received, role=wali_kelas")
            else:
                log_test("Wali Kelas login", False, f"Invalid response: {data}")
                return False
        else:
            log_test("Wali Kelas login", False, f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("Wali Kelas login", False, f"Exception: {str(e)}")
        return False
    
    return True

def test_post_absensi_admin():
    """Test 4: POST /api/absensi (Admin) - create new absensi record"""
    global created_absensi_id_admin
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Generate UUIDs for siswa
        siswa_uuid_1 = str(uuid4())
        siswa_uuid_2 = str(uuid4())
        
        new_absensi = {
            "tanggal": "2026-05-22",
            "kelas": "7A",
            "items": [
                {
                    "siswaId": siswa_uuid_1,
                    "nis": "001",
                    "nama": "Budi Santoso",
                    "status": "Hadir"
                },
                {
                    "siswaId": siswa_uuid_2,
                    "nis": "002",
                    "nama": "Siti Aminah",
                    "status": "Izin"
                }
            ],
            "totalHadir": 1,
            "totalIzin": 1,
            "totalSakit": 0,
            "totalAlpa": 0,
            "sumberInput": "manual"
        }
        
        response = requests.post(f"{BASE_URL}/absensi", json=new_absensi, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response has UUID id and no _id
            if "id" not in data:
                return log_test("POST /api/absensi (Admin)", False, "Response missing 'id' field")
            
            if "_id" in data:
                return log_test("POST /api/absensi (Admin)", False, "Response contains '_id' field (should be stripped)")
            
            # Verify UUID format (36 chars, 4 hyphens)
            if len(data["id"]) != 36 or data["id"].count("-") != 4:
                return log_test("POST /api/absensi (Admin)", False, f"Invalid UUID format: {data['id']}")
            
            created_absensi_id_admin = data["id"]
            
            # Verify data integrity
            if data.get("kelas") != "7A" or data.get("tanggal") != "2026-05-22":
                return log_test("POST /api/absensi (Admin)", False, f"Data mismatch: {data}")
            
            return log_test("POST /api/absensi (Admin)", True, f"Created with UUID {data['id'][:8]}..., no _id field")
        else:
            return log_test("POST /api/absensi (Admin)", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("POST /api/absensi (Admin)", False, f"Exception: {str(e)}")

def test_get_absensi_list_admin():
    """Test 5: GET /api/absensi (Admin) - list all absensi records"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/absensi", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if not isinstance(data, list):
                return log_test("GET /api/absensi (Admin)", False, "Response is not an array")
            
            # Check that our created record is in the list
            found = any(item.get("id") == created_absensi_id_admin for item in data)
            
            if not found:
                return log_test("GET /api/absensi (Admin)", False, f"Created record not found in list")
            
            # Verify no _id field in any item
            has_id_field = any("_id" in item for item in data)
            if has_id_field:
                return log_test("GET /api/absensi (Admin)", False, "Response contains _id field (should be stripped)")
            
            return log_test("GET /api/absensi (Admin)", True, f"Retrieved {len(data)} records, includes created record")
        else:
            return log_test("GET /api/absensi (Admin)", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("GET /api/absensi (Admin)", False, f"Exception: {str(e)}")

def test_get_absensi_by_id_admin():
    """Test 6: GET /api/absensi/:id (Admin) - fetch single record"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/absensi/{created_absensi_id_admin}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("id") != created_absensi_id_admin:
                return log_test("GET /api/absensi/:id (Admin)", False, f"ID mismatch: {data.get('id')}")
            
            if "_id" in data:
                return log_test("GET /api/absensi/:id (Admin)", False, "Response contains _id field")
            
            if data.get("kelas") != "7A":
                return log_test("GET /api/absensi/:id (Admin)", False, f"Data mismatch: {data}")
            
            return log_test("GET /api/absensi/:id (Admin)", True, f"Fetched record for kelas {data.get('kelas')}")
        else:
            return log_test("GET /api/absensi/:id (Admin)", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("GET /api/absensi/:id (Admin)", False, f"Exception: {str(e)}")

def test_put_absensi_wali():
    """Test 7: PUT /api/absensi/:id (Wali Kelas) - update record"""
    try:
        headers = {"Authorization": f"Bearer {wali_token}"}
        update_data = {"sumberInput": "scan"}
        
        response = requests.put(f"{BASE_URL}/absensi/{created_absensi_id_admin}", json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("sumberInput") != "scan":
                return log_test("PUT /api/absensi/:id (Wali Kelas)", False, f"sumberInput not updated: {data.get('sumberInput')}")
            
            return log_test("PUT /api/absensi/:id (Wali Kelas)", True, "Updated sumberInput to 'scan'")
        else:
            return log_test("PUT /api/absensi/:id (Wali Kelas)", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("PUT /api/absensi/:id (Wali Kelas)", False, f"Exception: {str(e)}")

def test_post_absensi_wali():
    """Test 8: POST /api/absensi (Wali Kelas) - should be ALLOWED"""
    global created_absensi_id_wali
    try:
        headers = {"Authorization": f"Bearer {wali_token}"}
        
        siswa_uuid_3 = str(uuid4())
        siswa_uuid_4 = str(uuid4())
        
        new_absensi = {
            "tanggal": "2026-05-23",
            "kelas": "7B",
            "items": [
                {
                    "siswaId": siswa_uuid_3,
                    "nis": "003",
                    "nama": "Ahmad Fauzi",
                    "status": "Hadir"
                },
                {
                    "siswaId": siswa_uuid_4,
                    "nis": "004",
                    "nama": "Dewi Lestari",
                    "status": "Sakit"
                }
            ],
            "totalHadir": 1,
            "totalIzin": 0,
            "totalSakit": 1,
            "totalAlpa": 0,
            "sumberInput": "scan"
        }
        
        response = requests.post(f"{BASE_URL}/absensi", json=new_absensi, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if "id" not in data or "_id" in data:
                return log_test("POST /api/absensi (Wali Kelas)", False, "Invalid response format")
            
            created_absensi_id_wali = data["id"]
            
            return log_test("POST /api/absensi (Wali Kelas)", True, f"Wali Kelas allowed to create, UUID {data['id'][:8]}...")
        else:
            return log_test("POST /api/absensi (Wali Kelas)", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("POST /api/absensi (Wali Kelas)", False, f"Exception: {str(e)}")

def test_delete_absensi_wali_forbidden():
    """Test 9: DELETE /api/absensi/:id (Wali Kelas) - should be FORBIDDEN (403)"""
    try:
        headers = {"Authorization": f"Bearer {wali_token}"}
        response = requests.delete(f"{BASE_URL}/absensi/{created_absensi_id_wali}", headers=headers, timeout=10)
        
        if response.status_code == 403:
            return log_test("DELETE /api/absensi/:id (Wali Kelas) - FORBIDDEN", True, "Correctly returned 403")
        else:
            return log_test("DELETE /api/absensi/:id (Wali Kelas) - FORBIDDEN", False, f"Expected 403, got {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("DELETE /api/absensi/:id (Wali Kelas) - FORBIDDEN", False, f"Exception: {str(e)}")

def test_delete_absensi_admin_success():
    """Test 10: DELETE /api/absensi/:id (Admin) - should succeed"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Delete the wali-created record
        response = requests.delete(f"{BASE_URL}/absensi/{created_absensi_id_wali}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test("DELETE /api/absensi/:id (Admin) - wali record", True, "Admin successfully deleted wali's record")
            else:
                return log_test("DELETE /api/absensi/:id (Admin) - wali record", False, f"Response: {data}")
        else:
            return log_test("DELETE /api/absensi/:id (Admin) - wali record", False, f"Status {response.status_code}: {response.text}")
        
        # Delete the admin-created record
        response = requests.delete(f"{BASE_URL}/absensi/{created_absensi_id_admin}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                return log_test("DELETE /api/absensi/:id (Admin) - admin record", True, "Admin successfully deleted own record")
            else:
                return log_test("DELETE /api/absensi/:id (Admin) - admin record", False, f"Response: {data}")
        else:
            return log_test("DELETE /api/absensi/:id (Admin) - admin record", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        return log_test("DELETE /api/absensi/:id (Admin)", False, f"Exception: {str(e)}")

def test_unauthorized_access():
    """Test 11: GET /api/absensi without token - should return 401"""
    try:
        response = requests.get(f"{BASE_URL}/absensi", timeout=10)
        
        if response.status_code == 401:
            return log_test("GET /api/absensi (No token) - UNAUTHORIZED", True, "Correctly returned 401")
        else:
            return log_test("GET /api/absensi (No token) - UNAUTHORIZED", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        return log_test("GET /api/absensi (No token) - UNAUTHORIZED", False, f"Exception: {str(e)}")

def test_no_regression_siswa():
    """Test 12: No regression - GET /api/siswa still works"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/siswa", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                return log_test("No regression - GET /api/siswa", True, f"Retrieved {len(data)} students")
            else:
                return log_test("No regression - GET /api/siswa", False, "Empty or invalid response")
        else:
            return log_test("No regression - GET /api/siswa", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("No regression - GET /api/siswa", False, f"Exception: {str(e)}")

def test_no_regression_stats():
    """Test 13: No regression - GET /api/stats still works"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/stats", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "totalSiswa" in data and "totalGuru" in data:
                return log_test("No regression - GET /api/stats", True, f"Stats working: {data['totalSiswa']} siswa, {data['totalGuru']} guru")
            else:
                return log_test("No regression - GET /api/stats", False, "Missing required fields")
        else:
            return log_test("No regression - GET /api/stats", False, f"Status {response.status_code}")
    except Exception as e:
        return log_test("No regression - GET /api/stats", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all absensi tests in sequence"""
    print("=" * 80)
    print("Absensi (Attendance) Backend API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print("=" * 80)
    print()
    
    print("🔐 AUTHENTICATION TESTS")
    print("-" * 80)
    if not test_login_all_roles():
        print("\n❌ Authentication failed. Cannot proceed with other tests.")
        return False
    print()
    
    print("📋 ABSENSI CRUD TESTS")
    print("-" * 80)
    test_post_absensi_admin()
    test_get_absensi_list_admin()
    test_get_absensi_by_id_admin()
    test_put_absensi_wali()
    test_post_absensi_wali()
    print()
    
    print("🔒 PERMISSION TESTS")
    print("-" * 80)
    test_delete_absensi_wali_forbidden()
    test_delete_absensi_admin_success()
    test_unauthorized_access()
    print()
    
    print("✅ REGRESSION TESTS")
    print("-" * 80)
    test_no_regression_siswa()
    test_no_regression_stats()
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
    else:
        print("🎉 ALL TESTS PASSED!")
        print()
    
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
