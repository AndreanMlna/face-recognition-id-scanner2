// import type { PermissionList } from '../types/api';
import api from './api';

const ML_API_URL = "https://andrerean-face-rec.hf.space";

export type PermissionStatus = 'waiting' | 'accepted' | 'denied' | 'violation';
export type AttendanceStatus = 'waiting' | 'accepted' | 'denied' | 'violation' | 'pending' | 'out' | 'completed';

export interface Permissions {
  id: number;
  user_id: number;
  reason: string;
  duration: number | null;
  start_time: string;
  end_time: string;
  status: PermissionStatus;

  student_name?: string;
  student_nim?: string;
  student_prodi?: string;
  student_semester?: number;

  check_in?: string | null;
  check_out?: string | null;
  attendance_status?: AttendanceStatus;
}

// --- PERBAIKAN DI SINI ---
// Sesuaikan dengan data JSON database: [{"id":1,"permission_id":1,"user_id":7,"type":"OUT","timestamp":"..."}]
export interface ScanLog {
  id: number;
  user_id: number;
  permission_id: number;
  type: 'IN' | 'OUT'; // Sesuai kolom 'type' di database
  timestamp: string;  // Sesuai kolom 'timestamp' di database
  
  // Tambahkan ini agar tidak error saat AdminDashboard mencoba akses nama
  student_name?: string; 
  student_nim?: string;
}
// -------------------------

// --- STUDENT PERMISSIONS ---
export async function getMyPermissionHistory(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/my-history');
  return res.data;
}

export async function requestPermission(payload: {
  reason: string;
  start_time: string;
  end_time: string;
  duration?: number;
}) {
  const res = await api.post('/api/permission/request', payload);
  return res.data;
}

// --- ADMIN PERMISSIONS ---
export async function getAllPermissionsAdmin(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/admin/all');
  return res.data;
}

export async function updatePermissionStatus(
  id: number,
  status: 'accepted' | 'denied'
) {
  const res = await api.patch(`/api/permission/admin/status/${id}`, { status });
  return res.data;
}

// --- FUNGSI FETCH LOG SCANNER (ADMIN) ---
export async function getRecentScanLogs(): Promise<ScanLog[]> {
  const res = await api.get('/api/attendance/recent');
  // Jika backend Anda mengirimkan data dalam bentuk { status: 'success', data: [...] }
  // Pastikan return mengarah ke array-nya.
  return Array.isArray(res.data) ? res.data : (res.data as any).data || []; 
}

// --- FACE RECOGNITION SERVICE (PYTHON) ---
export async function verifyAttendance(imageBlob: Blob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'capture.jpg'); 

  try {
    const response = await fetch(`${ML_API_URL}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ML Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error verifying attendance:", error);
    throw error;
  }
}