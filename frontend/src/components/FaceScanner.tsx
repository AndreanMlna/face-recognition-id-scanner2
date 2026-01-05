import { useEffect, useRef, useState } from 'react';
import { verifyAttendance } from '../services/permission';

// 1. Tambahkan Interface untuk Props agar TypeScript tidak error di AdminDashboard
interface FaceScannerProps {
  onScanSuccess?: () => void;
}

export default function FaceScanner({ onScanSuccess }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isScanning = true; 
  const [statusMessage, setStatusMessage] = useState("Mencari wajah...");
  const [statusType, setStatusType] = useState<"neutral" | "success" | "error">("neutral");

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();

    intervalRef.current = window.setInterval(() => {
        if (isScanning) {
            captureAndSend();
        }
    }, 3000); 

    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal akses kamera:", err);
      setStatusMessage("Gagal mengakses kamera. Pastikan izin diberikan.");
      setStatusType("error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        // Jangan set statusMessage "Memproses" di sini agar UI tidak kedap-kedip
        try {
          const result = await verifyAttendance(blob);

          if (result.status === "success") {
             const name = result.data.name;
             const dist = result.data.distance;
             
             if (name !== "unknown") {
                 setStatusMessage(`✅ Halo, ${name}! (${dist.toFixed(2)})`);
                 setStatusType("success");

                 // 2. PERBAIKAN: Panggil fungsi refresh dari parent (AdminDashboard)
                 if (onScanSuccess) {
                    onScanSuccess();
                 }
             } else {
                 setStatusMessage("❌ Wajah tidak dikenali.");
                 setStatusType("error");
             }
          } else {
             setStatusMessage("Mencari wajah...");
             setStatusType("neutral");
          }
        } catch (error) {
          console.error("Scanner error:", error);
          setStatusMessage("⚠️ Gangguan koneksi ke AI.");
          setStatusType("error");
        }
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="face-scanner-container" style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', borderRadius: '8px', border: statusType === 'success' ? '4px solid #4caf50' : '2px solid #ccc' }} 
      />
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
          marginTop: '10px',
          padding: '12px',
          backgroundColor: statusType === 'success' ? '#e8f5e9' : statusType === 'error' ? '#ffebee' : '#f5f5f5',
          color: statusType === 'success' ? '#2e7d32' : statusType === 'error' ? '#c62828' : '#333',
          borderRadius: '8px',
          fontWeight: 'bold',
          textAlign: 'center',
          transition: 'all 0.3s ease'
      }}>
          {statusMessage}
      </div>
    </div>
  );
}