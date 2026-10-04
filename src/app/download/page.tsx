'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
  Radio,
  Zap,
  Copy,
  Check,
  Globe,
  WifiOff,
  FileCheck,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { toast } from 'sonner';

const APK_SHA256 = '2137a5536396b9790072918b73555ce7a2198cf58c9ec9f701fb1b6c324e15b8';
const CERT_FINGERPRINT = '1A:6D:AF:71:40:7C:84:65:E0:BD:1C:3D:FB:0D:87:5B:FC:DB:93:29:09:03:33:AA:E0:C1:56:BF:EC:03:16:CD';

export default function DownloadPage() {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedCert, setCopiedCert] = useState(false);

  const copyToClipboard = (text: string, type: 'sha' | 'cert') => {
    navigator.clipboard.writeText(text);
    sound.playPop(480);
    if (type === 'sha') {
      setCopiedSha(true);
      toast.success('SHA-256 checksum copied!');
      setTimeout(() => setCopiedSha(false), 2000);
    } else {
      setCopiedCert(true);
      toast.success('Certificate fingerprint copied!');
      setTimeout(() => setCopiedCert(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between z-10">
        <Link
          href="/radar"
          onClick={() => sound.playPop(300)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Radar</span>
        </Link>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-neutral-300 font-mono">
          v1.0.0.2 (Release Build)
        </span>
      </header>

      {/* Main Download Card */}
      <main className="max-w-md w-full mx-auto my-auto z-10 text-center py-6">
        <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto shadow-2xl ring-4 ring-white/10 mb-5 animate-pulse border border-white/10">
          <img src="/brand/logo-icon-512.png" alt="Phryvos" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Phryvos for Android
        </h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Where Strangers Become Stories. Install the official native Android app for fullscreen radar, instant notifications, and zero browser bars.
        </p>

        {/* Action Button */}
        <div className="mt-6 space-y-3">
          <a
            href="/download/Phryvos.apk"
            download="Phryvos.apk"
            onClick={() => sound.playPop(520)}
            className="w-full py-4 px-6 rounded-2xl phryvos-gradient text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Download Phryvos.apk</span>
            <span className="text-xs font-normal opacity-80">(2.7 MB)</span>
          </a>

          <p className="text-[11px] text-neutral-500">
            Package: <code className="text-primary font-mono">in.phryvos.app</code> • Pure Native TWA • 100% Free
          </p>
        </div>

        {/* Security & Checksums Box */}
        <div className="mt-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Checksum:</span>
            </span>
            <button
              onClick={() => copyToClipboard(APK_SHA256, 'sha')}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSha ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-mono text-[10px] text-neutral-400 break-all bg-black/40 p-2 rounded-lg border border-white/5">
            {APK_SHA256}
          </p>

          <div className="flex items-center justify-between text-neutral-300 font-semibold pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Digital Asset Links Fingerprint:</span>
            </span>
            <button
              onClick={() => copyToClipboard(CERT_FINGERPRINT, 'cert')}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              {copiedCert ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCert ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-mono text-[10px] text-neutral-400 break-all bg-black/40 p-2 rounded-lg border border-white/5">
            {CERT_FINGERPRINT}
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 text-left">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Radio className="w-4 h-4 text-primary mb-1" />
            <h4 className="text-xs font-semibold text-neutral-200">Fullscreen Radar</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">True immersive discovery without browser chrome.</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <h4 className="text-xs font-semibold text-neutral-200">Deep Link Support</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Seamlessly open phryvos.in links directly in the app.</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Smartphone className="w-4 h-4 text-emerald-400 mb-1" />
            <h4 className="text-xs font-semibold text-neutral-200">Native Hardware</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Voice notes & camera integration built-in.</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <WifiOff className="w-4 h-4 text-purple-400 mb-1" />
            <h4 className="text-xs font-semibold text-neutral-200">PWA Offline Mode</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Safe offline fallback while keeping private DMs secure.</p>
          </div>
        </div>

        {/* Install instructions */}
        <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-400 text-left space-y-1.5">
          <div className="font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            How to Install:
          </div>
          <p>1. Tap the download button above or open your phone&apos;s <strong>Downloads</strong> folder.</p>
          <p>2. Tap <strong>Phryvos.apk</strong>.</p>
          <p>3. If prompted, allow <em>Install unknown apps</em> for your browser/files app.</p>
          <p>4. Tap <strong>Install</strong> and start discovering strangers!</p>
        </div>
      </main>

      <footer className="text-center text-[11px] text-neutral-600 mt-4">
        Phryvos Core v1.0.0.2 • Verified Android Package & PWA Pipeline
      </footer>
    </div>
  );
}
