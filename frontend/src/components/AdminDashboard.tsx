/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList'; 

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getAllPermissionsAdmin,
  updatePermissionStatus,
  getRecentScanLogs,
} from '../services/permission';
import type { Permissions, ScanLog } from '../services/permission';
import { logout } from '../services/auth';
import FaceScanner from './FaceScanner'; 

export default function AdminDashboard() {
  // 1. Variabel 'events' sekarang digunakan oleh komponen <EventList />
  const { events } = useOutletContext<DashboardOutletContext>();
  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const navigate = useNavigate();

  // --- STATE UNTUK SCANNER ---
  const [showGateScanner, setShowGateScanner] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]); 
  const pollingRef = useRef<number | null>(null);

  // 2. State 'eventForm' sekarang digunakan di formulir input
  const [eventForm, setEventForm] = useState({ name: '', details: '' });

  async function load() {
    try {
      const [historyData, logsData] = await Promise.all([
        getAllPermissionsAdmin(),
        getRecentScanLogs()
      ]);
      setPermissions(Array.isArray(historyData) ? historyData : []);
      setScanLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error("Gagal refresh data:", error);
    }
  }

  useEffect(() => {
    if (showGateScanner) {
      load();
      pollingRef.current = window.setInterval(load, 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showGateScanner]);

  useEffect(() => {
    load();
  }, []);

  // 3. Fungsi 'submitEvent' sekarang menangani pembuatan event baru
  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Mempublikasikan Event:", eventForm);
    // Di sini Anda bisa menambahkan API call untuk menyimpan event ke database
    alert(`Event "${eventForm.name}" berhasil dipublikasikan!`);
    setEventForm({ name: '', details: '' });
  };

  async function onApprove(id: number) {
    await updatePermissionStatus(id, 'accepted');
    await load();
  }

  async function onDeny(id: number) {
    await updatePermissionStatus(id, 'denied');
    await load();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const waiting = permissions.filter((p) => p.status === 'waiting');

  return (
    <div className="content-area active">
      {/* Tombol Kontrol Atas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: '10px' }}>
        <button 
          onClick={() => setShowGateScanner(!showGateScanner)} 
          className="submit-btn"
          style={{ 
            backgroundColor: showGateScanner ? '#f44336' : '#ff9800', 
            width: 'auto',
            fontWeight: 'bold'
          }}
        >
          {showGateScanner ? '✖ Tutup Scanner' : '🚧 Buka Gate Scanner'}
        </button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* SECTION 1: SCANNER WAJAH */}
      {showGateScanner && (
        <section className="card" style={{ border: '2px solid #ff9800', padding: '25px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
            <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px' }}>📸 Kamera Pemantau Gerbang</h3>
              <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000' }}>
                <FaceScanner onScanSuccess={load} />
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '600px', background: '#fdfdfd', padding: '20px', borderRadius: '16px', border: '1px solid #eee' }}>
              <h3 style={{ borderBottom: '2px solid #ff9800', paddingBottom: '10px' }}>📋 Log Aktivitas Terakhir</h3>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {scanLogs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>Menunggu deteksi wajah...</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {scanLogs.map((log) => {
                      const logDate = new Date(log.timestamp);
                      const timeString = isNaN(logDate.getTime()) ? "Waktu tidak valid" : logDate.toLocaleTimeString();
                      return (
                        <li key={log.id} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{log.type === 'IN' ? '📥' : '📤'}</span>
                              <strong style={{ color: '#2c3e50' }}>{log.student_name || `Mhs ID: ${log.user_id}`}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginLeft: '32px' }}>
                               {log.student_nim ? `${log.student_nim} • ` : ''} {timeString}
                            </div>
                          </div>
                          <span className={`status-badge status-badge--${log.type === 'IN' ? 'pending' : 'accepted'}`} style={{ fontWeight: 'bold' }}>
                            {log.type === 'IN' ? 'MASUK' : 'KELUAR'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: MANAJEMEN EVENT (FITUR BARU YANG DIAKTIFKAN) */}
      <section className="card" style={{ marginBottom: '30px', borderLeft: '5px solid #2196F3' }}>
        <h2>🗓️ Tambah Kegiatan Kampus (Event)</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Publikasikan acara agar mahasiswa tahu ada agenda penting di kampus.
        </p>
        <form onSubmit={submitEvent}>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label>Nama Acara:</label>
            <input 
              type="text" 
              className="form-control"
              value={eventForm.name} 
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label>Detail / Lokasi:</label>
            <textarea 
              className="form-control"
              value={eventForm.details} 
              onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })} 
              required 
            />
          </div>
          <button className="submit-btn" type="submit" style={{ width: 'auto', backgroundColor: '#2196F3' }}>
            Publish Event
          </button>
        </form>
      </section>

      {/* SECTION 3: DAFTAR EVENT BERJALAN */}
      <section className="card" style={{ marginBottom: '30px' }}>
        <h2>📣 Agenda Kampus Saat Ini</h2>
        <EventList events={events} />
      </section>

      {/* SECTION 4: PERIZINAN PENDING */}
      <section className="card" style={{ marginBottom: '30px' }}>
        <h2>📥 Pending Applications</h2>
        <table>
          <thead>
            <tr><th>Nama</th><th>NIM</th><th>Tanggal</th><th>Keperluan</th><th>Action</th></tr>
          </thead>
          <tbody>
            {waiting.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No pending applications.</td></tr>
            ) : (
              waiting.map((app) => (
                <tr key={app.id}>
                  <td>{app.student_name}</td><td>{app.student_nim}</td>
                  <td>{new Date(app.start_time).toLocaleString()}</td><td>{app.reason}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => onApprove(app.id)}>Approve</button>
                      <button className="action-btn action-btn--deny" onClick={() => onDeny(app.id)}>Deny</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* SECTION 5: HISTORY PERIZINAN */}
      <section className="card">
        <h2>📜 Status History Perizinan Mahasiswa</h2>
        <table>
          <thead>
            <tr><th>Nama</th><th>NIM</th><th>Alasan</th><th>Jadwal</th><th>Waktu IN</th><th>Waktu OUT</th><th>Status</th></tr>
          </thead>
          <tbody>
            {permissions.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Belum ada history perizinan.</td></tr>
            ) : (
              permissions.map((perm) => (
                <tr key={perm.id}>
                  <td>{perm.student_name || '-'}</td><td>{perm.student_nim || '-'}</td><td>{perm.reason}</td>
                  <td>{new Date(perm.start_time).toLocaleDateString()}</td>
                  <td>{perm.check_in ? new Date(perm.check_in).toLocaleTimeString() : '-'}</td>
                  <td>{perm.check_out ? new Date(perm.check_out).toLocaleTimeString() : '-'}</td>
                  <td><span className={`status-badge status-badge--${perm.attendance_status || perm.status}`}>{perm.attendance_status || perm.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}