import React, { useState } from 'react';
import { Cloud, Info, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';
import { isConfigured, firebaseConfig } from '../../lib/firebase';
import Modal from './Modal';
import Button from './Button';

export default function ConfigBanner() {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const envSample = `VITE_FIREBASE_API_KEY=AIzaSyYourRealKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-college-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-college-project
VITE_FIREBASE_STORAGE_BUCKET=your-college-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456`;

  const copyConfig = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`text-xs py-2 px-4 transition-colors ${
        isConfigured
          ? 'bg-emerald-50 border-b border-emerald-100 text-emerald-800'
          : 'bg-indigo-50 border-b border-indigo-100 text-indigo-900'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">
                  <strong>Cloud Backend Connected:</strong> Live Firestore project <code>{firebaseConfig.projectId}</code>
                </span>
              </>
            ) : (
              <>
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  <strong>Academic Demonstration Mode:</strong> Running with standard college demo dataset. Connect your real Firebase project via <code>.env</code>.
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="font-semibold underline hover:opacity-80 transition-opacity ml-auto"
          >
            {isConfigured ? 'View Cloud Configuration' : 'Setup Real Firebase Cloud'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isConfigured ? "Firebase Cloud Configuration" : "Firebase Cloud Setup Guide"}
        maxWidth="max-w-xl"
        footer={<Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>}
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Event Cloud Manager uses <strong>Google Cloud Firestore</strong>, <strong>Firebase Authentication</strong>, and <strong>Cloud Functions</strong>.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Required .env Variables</span>
              <button
                onClick={copyConfig}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Template'}
              </button>
            </div>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto font-mono">
              {envSample}
            </pre>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-slate-800">Quick Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Create a Firebase Project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">console.firebase.google.com</a>.</li>
              <li>Enable <strong>Email/Password</strong> under Authentication &rarr; Sign-in method.</li>
              <li>Create a <strong>Cloud Firestore</strong> database in test or production mode.</li>
              <li>Register a Web App in Project Settings, copy the configuration keys into <code>.env</code>, and restart Vite.</li>
              <li>To run local emulators: run <code>firebase emulators:start</code> and set <code>VITE_USE_FIREBASE_EMULATOR=true</code>.</li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  );
}
