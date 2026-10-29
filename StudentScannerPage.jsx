import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  History,
  Sparkles
} from 'lucide-react';
import QRScanner from '../../components/qr/QRScanner';
import { processCheckIn, processCheckOut, decodeAndValidateToken } from '../../services/attendanceService';
import { useAuth } from '../../app/providers';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function StudentScannerPage() {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanSuccess = async (rawToken) => {
    setErrorMessage(null);
    setScanResult(null);
    setIsProcessing(true);

    try {
      // 1. Decode token payload to inspect action (check-in or check-out)
      const payload = decodeAndValidateToken(rawToken);

      let response;
      if (payload.action === 'check-out') {
        response = await processCheckOut({
          tokenString: rawToken,
          student: user || { uid: 'demo_student_01', fullName: 'Student', email: 'aditya.21cs@apex.edu.in' }
        });
        setScanResult({
          type: 'checkout',
          title: 'Check-Out Verified!',
          message: response.message,
          details: response.record || response
        });
      } else {
        // Default check-in
        response = await processCheckIn({
          tokenString: rawToken,
          student: user || { uid: 'demo_student_01', fullName: 'Student', email: 'aditya.21cs@apex.edu.in' }
        });
        setScanResult({
          type: 'checkin',
          title: 'Check-In Confirmed!',
          message: response.message,
          details: response.record || response
        });
      }
    } catch (err) {
      console.error('Scan processing error:', err);
      setErrorMessage(err.message || 'Verification failed. Please check with your event coordinator.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Attendance Scanner</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Scan the rotating dynamic QR code projected by your event coordinator at check-in and check-out.
        </p>
      </div>

      {/* Success Notification Card */}
      {scanResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">{scanResult.title}</h3>
              <p className="text-xs text-emerald-700 mt-0.5">{scanResult.message}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">Record successfully committed to Cloud Firestore.</span>
            <Link to="/student/attendance">
              <Button size="xs" variant="primary" icon={History}>
                View Hours
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Error Notification Card */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attendance Verification Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Camera / Manual Token Scanner Component */}
      <QRScanner
        onScanSuccess={handleScanSuccess}
        isLoading={isProcessing}
      />

      {/* Verification Instructions and Physical Presence Disclaimer */}
      <Card className="bg-slate-50/70 border-slate-200">
        <div className="space-y-3 text-xs text-slate-600">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            Attendance Verification Protocol
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
            <li><strong>Step 1 (Check-In):</strong> Scan the coordinator's QR code upon arrival to start your verified participation timer.</li>
            <li><strong>Step 2 (Check-Out):</strong> Scan the concluding QR code before leaving the venue to record your departure timestamp.</li>
            <li><strong>Step 3 (Duration Calculation):</strong> The cloud backend calculates <code>Verified Duration = Check-Out Time - Check-In Time</code> and computes attendance percentage.</li>
          </ol>
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Academic Integrity Notice:</strong> QR scanning alone does not establish physical presence. Coordinators and proctors conduct spot verification audits in compliance with college academic regulations.
          </div>
        </div>
      </Card>
    </div>
  );
}
