/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getMyPermissionHistory,
  requestPermission,
} from '../services/permission';
import type { Permissions } from '../services/permission';
import HistoryTable from './HistoryTable';
import { logout } from '../services/auth';

function minutesBetween(startISO: string, endISO: string) {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();

  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
  return Math.round((e - s) / 60000);
}

export default function StudentDashboard() {
  const { events } = useOutletContext<DashboardOutletContext>();

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Permissions[]>([]);

  const [form, setForm] = useState({
    purpose: '',
    start_time: '',
    end_time: '',
  });

  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getMyPermissionHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const duration = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    return minutesBetween(form.start_time, form.end_time);
  }, [form.start_time, form.end_time]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.purpose || !form.start_time || !form.end_time) {
      alert('Lengkapi alasan, waktu mulai, dan waktu selesai');
      return;
    }
    if (duration <= 0) {
      alert('Waktu selesai harus lebih besar dari waktu mulai');
      return;
    }

    await requestPermission({
      reason: form.purpose,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      duration,
    });

    setForm({ purpose: '', start_time: '', end_time: '' });
    alert('Pengajuan perizinan berhasil dikirim');
    load();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="content-area active">
      {/* HEADER ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* --- FORM PENGAJUAN IZIN --- */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div style={{ borderBottom: '2px solid #2196F3', marginBottom: 20, paddingBottom: 10 }}>
          <h2 style={{ margin: 0 }}>📝 New License Request</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
            Isi formulir di bawah untuk mengajukan izin keluar lingkungan.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label style={{ fontWeight: 'bold' }}>Keperluan / Alasan:</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Contoh : Membeli charger laptop"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: 15 }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold' }}>Waktu Berangkat:</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold' }}>Waktu Pulang:</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 'bold' }}>Estimasi Durasi (Menit):</label>
            <input 
              type="text" 
              value={duration} 
              readOnly 
              style={{ 
                backgroundColor: '#f5f5f5', 
                fontWeight: 'bold', 
                color: '#2196F3',
                cursor: 'not-allowed'
              }} 
            />
          </div>

          <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: 10 }}>
            Kirim Pengajuan Izin
          </button>
        </form>
      </section>

      {/* --- TABEL RIWAYAT --- */}
      <div style={{ marginBottom: 24 }}>
        <HistoryTable applications={history} loading={loading} />
      </div>

      {/* --- EVENT LIST --- */}
      <EventList events={events} />
    </div>
  );
}