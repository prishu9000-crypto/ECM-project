import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { RefreshCw, Clock, ShieldCheck, Copy, Check } from 'lucide-react';
import Button from '../common/Button';

export default function QRDisplay({
  token,
  action = 'check-in',
  expirySeconds = 60,
  onRefresh,
  isSessionActive = true
}) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Render QR Code onto canvas
  useEffect(() => {
    if (!token || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      token,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#1e1b4b', // deep navy
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      },
      (error) => {
        if (error) {
          console.error('QR rendering error:', error);
          setQrError('Failed to render QR Code image.');
        } else {
          setQrError(null);
        }
      }
    );

    setTimeLeft(expirySeconds);
  }, [token, expirySeconds]);

  // Expiry Countdown timer
  useEffect(() => {
    if (!isSessionActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSessionActive]);

  const progressPercent = Math.max(0, (timeLeft / expirySeconds) * 100);
  const isExpired = timeLeft === 0;

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm mx-auto">
      {/* Session Action Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
          action === 'check-in' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {action === 'check-in' ? 'Check-In QR Token' : 'Check-Out QR Token'}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cryptographically Signed
        </span>
      </div>

      {/* QR Code Canvas */}
      <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-inner">
        <canvas ref={canvasRef} className={`rounded-lg ${isExpired ? 'opacity-20 blur-[1px]' : ''}`} />

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-white/80 rounded-xl">
            <Clock className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
            <p className="text-sm font-bold text-slate-800">QR Code Expired</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">Tokens rotate automatically to prevent screenshots.</p>
            <Button size="sm" variant="primary" icon={RefreshCw} onClick={onRefresh}>
              Generate Fresh QR
            </Button>
          </div>
        )}
      </div>

      {/* Timer Bar */}
      <div className="w-full mt-4 space-y-1.5">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className="text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Token Validity:
          </span>
          <span className={timeLeft <= 10 ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}>
            {timeLeft}s remaining
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 10 ? 'bg-rose-500' : (timeLeft <= 25 ? 'bg-amber-500' : 'bg-indigo-600')
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Manual refresh and testing controls */}
      <div className="flex items-center gap-2 mt-5 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          icon={RefreshCw}
          onClick={onRefresh}
          disabled={!isSessionActive}
        >
          Refresh Token
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
          title="Copy raw token string for testing without camera"
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-3">
        Students scan this QR code with their mobile device to record verified attendance.
      </p>
    </div>
  );
}
