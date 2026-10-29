import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

export default function QRScanner({ onScanSuccess, isLoading = false }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'

  const html5QrCodeRef = useRef(null);
  const readerElementId = 'qr-camera-stream';

  // Initialize and list available cameras
  useEffect(() => {
    let mounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (mounted && devices && devices.length) {
          setCameras(devices);
          // Prefer environment/back camera on mobile
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera access unavailable or permission denied:', err);
        if (mounted) {
          setCameraError('Camera access not permitted or not supported on this device. Please use the Manual Token Entry tab.');
          setActiveTab('manual');
        }
      });

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId);
      }

      const cameraId = selectedCameraId || { facingMode: "environment" };

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Prevent multiple trigger on same frame
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {
          // Frame scan failures are normal between detections
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR camera:', err);
      setCameraError(err.message || 'Unable to access camera stream. Note: Modern browsers require HTTPS or localhost for camera access.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    onScanSuccess(manualToken.trim());
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-md mx-auto">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => { setActiveTab('camera'); stopScanner(); }}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'camera'
              ? 'border-primary-600 text-primary-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" /> Live Camera Scan
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('manual'); stopScanner(); }}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-primary-600 text-primary-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Manual / Test Token
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'camera' ? (
          <div className="space-y-4">
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Camera Notice</p>
                  <p className="mt-0.5">{cameraError}</p>
                </div>
              </div>
            )}

            {cameras.length > 1 && !isScanning && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Select Camera</label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${cam.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Video Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center border border-slate-800">
              <div id={readerElementId} className="w-full h-full" />
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/90 text-white">
                  <Camera className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold">Camera is Ready</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Point your camera at the attendance QR code displayed by your event coordinator.
                  </p>
                </div>
              )}
            </div>

            {/* Camera Actions */}
            <div className="flex gap-2">
              {!isScanning ? (
                <Button
                  className="w-full"
                  variant="primary"
                  icon={Camera}
                  onClick={startScanner}
                  disabled={isLoading}
                >
                  Start Camera Scanner
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="danger"
                  icon={CameraOff}
                  onClick={stopScanner}
                >
                  Stop Scanner
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Manual Token entry fallback for testing without camera */
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-600" />
                Testing Mode / Desktop Scanner
              </p>
              <p>
                If your testing device does not have a connected webcam, paste the raw QR token string copied from the coordinator screen here.
              </p>
            </div>

            <Input
              label="Enter Attendance QR Token"
              placeholder="Paste cryptographically signed token string..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              variant="primary"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Verify Attendance Token
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
