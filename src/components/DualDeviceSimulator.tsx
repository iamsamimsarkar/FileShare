import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Upload,
  Download,
  FileText,
  Camera,
  Usb,
  History,
  Settings,
  LayoutDashboard,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ClipboardPaste,
  Trash2,
  ShieldCheck,
  Wifi,
  Smartphone,
  Monitor,
  StopCircle,
  Play,
  Save,
  RotateCcw,
  FolderOpen,
  Terminal,
  Lock
} from 'lucide-react';
import { generateQrMatrix } from '../utils/qrRenderer';

type WinTab =
  | 'dashboard'
  | 'qr'
  | 'send'
  | 'receive'
  | 'text'
  | 'camera'
  | 'usb'
  | 'history'
  | 'settings';

type AndroidTab =
  | 'dashboard'
  | 'scan'
  | 'send'
  | 'receive'
  | 'text'
  | 'camera'
  | 'usb'
  | 'history'
  | 'settings';

export interface TransferItem {
  id: string;
  fileName: string;
  savedAs: string;
  sizeBytes: number;
  direction: 'PC_TO_ANDROID' | 'ANDROID_TO_PC';
  transport: 'WIFI' | 'USB_ADB';
  progress: number;
  speedMbps: number;
  status: 'PENDING_APPROVAL' | 'TRANSFERRING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  timestamp: string;
  wasRenamed: boolean;
}

export interface WireLogEntry {
  id: string;
  time: string;
  channel: 'HTTP' | 'WS' | 'ADB' | 'SECURITY';
  direction: 'PC -> Phone' | 'Phone -> PC' | 'Local OS';
  summary: string;
  payload: string;
}

const SAMPLE_PC_FILES = [
  { name: 'Project_Architecture_Notes.pdf', size: 2_450_000, type: 'Document' },
  { name: 'Vacation_Clip_1080p.mp4', size: 48_200_000, type: 'Video' },
  { name: 'Desktop_Screenshot.png', size: 1_840_000, type: 'Image' },
  { name: 'Podcast_Episode_Draft.mp3', size: 14_600_000, type: 'Audio' }
];

const SAMPLE_ANDROID_FILES = [
  { name: 'IMG_20261021_1420.jpg', size: 4_120_000, type: 'Image' },
  { name: 'VID_20261021_Family.mp4', size: 64_500_000, type: 'Video' },
  { name: 'Voice_Memo_04.m4a', size: 3_200_000, type: 'Audio' },
  { name: 'Scanned_Receipt.pdf', size: 950_000, type: 'Document' }
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const DualDeviceSimulator: React.FC = () => {
  // Navigation tabs for both simulated applications
  const [winTab, setWinTab] = useState<WinTab>('qr');
  const [androidTab, setAndroidTab] = useState<AndroidTab>('scan');

  // Connection & Pairing State
  const [networkMode, setNetworkMode] = useState<'LAN_WIFI' | 'WIN_HOTSPOT'>('LAN_WIFI');
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTED_WIFI' | 'CONNECTED_USB'>('DISCONNECTED');
  const [tokenExpiryConfig, setTokenExpiryConfig] = useState<number>(120);
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [pairToken, setPairToken] = useState<string>('qsc_pair_9f8a7d6c5b4e3f2a1d0c');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Settings & Security
  const [downloadFolder, setDownloadFolder] = useState<string>('C:\\Users\\Student\\Downloads\\QuickShareConnect');
  const [requireReceiverApproval, setRequireReceiverApproval] = useState<boolean>(true);
  const [clipboardSyncEnabled, setClipboardSyncEnabled] = useState<boolean>(false);
  const [existingPcFiles, setExistingPcFiles] = useState<string[]>(['Desktop_Screenshot.png']);
  const [existingAndroidFiles, setExistingAndroidFiles] = useState<string[]>(['Project_Architecture_Notes.pdf']);

  // Text Share State
  const [pcText, setPcText] = useState<string>('https://developer.android.com/training/camerax\nMeeting code: 842-991');
  const [androidText, setAndroidText] = useState<string>(' Grocery List:\n- AA Batteries\n- USB-C Data Cable');
  const [lastSyncedNotice, setLastSyncedNotice] = useState<string>('Ready to share text bidirectionally.');

  // File Transfers State
  const [transfers, setTransfers] = useState<TransferItem[]>([
    {
      id: 'tx-init-1',
      fileName: 'QuickShare_Welcome_Guide.pdf',
      savedAs: 'QuickShare_Welcome_Guide.pdf',
      sizeBytes: 1_240_000,
      direction: 'PC_TO_ANDROID',
      transport: 'WIFI',
      progress: 100,
      speedMbps: 18.4,
      status: 'COMPLETED',
      timestamp: '10:14:22',
      wasRenamed: false
    }
  ]);

  // Remote Camera State
  const [cameraStatus, setCameraStatus] = useState<
    'IDLE' | 'AWAITING_ANDROID_PERMISSION' | 'STREAMING_PREVIEW' | 'PHOTO_CAPTURED'
  >('IDLE');
  const [capturedPhotoTime, setCapturedPhotoTime] = useState<string | null>(null);
  const [cameraSceneSubject, setCameraSceneSubject] = useState<'DOCUMENT' | 'WORKBENCH' | 'OUTDOOR'>('DOCUMENT');

  // USB Mode State
  const [usbCablePlugged, setUsbCablePlugged] = useState<boolean>(false);
  const [usbDebuggingAuthorized, setUsbDebuggingAuthorized] = useState<boolean>(false);
  const [adbTunnelActive, setAdbTunnelActive] = useState<boolean>(false);

  // Wire Inspector Logs
  const [wireLogs, setWireLogs] = useState<WireLogEntry[]>([
    {
      id: 'log-1',
      time: nowTime(),
      channel: 'HTTP',
      direction: 'Local OS',
      summary: 'FastAPI Uvicorn server listening on 0.0.0.0:8765 (64 KB streaming chunks)',
      payload: '{"host":"192.168.1.45","port":8765,"max_ram_buffer_kb":64}'
    }
  ]);

  const activeHostIp = networkMode === 'LAN_WIFI' ? '192.168.1.45' : '192.168.137.1';

  const qrPayload = JSON.stringify({
    v: 1,
    ip: activeHostIp,
    port: 8765,
    token: pairToken,
    exp: secondsLeft,
    pc: 'WIN10-DESKTOP'
  });

  const qrMatrix = generateQrMatrix(qrPayload);

  const addLog = (
    channel: WireLogEntry['channel'],
    direction: WireLogEntry['direction'],
    summary: string,
    payload: string
  ) => {
    setWireLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: nowTime(),
        channel,
        direction,
        summary,
        payload
      },
      ...prev.slice(0, 24)
    ]);
  };

  // QR Countdown Timer
  useEffect(() => {
    if (connectionState !== 'DISCONNECTED') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextToken = `qsc_pair_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36).slice(-4)}`;
          setPairToken(nextToken);
          return tokenExpiryConfig;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionState, tokenExpiryConfig]);

  // Progress animation for active transfers
  useEffect(() => {
    const active = transfers.some((t) => t.status === 'TRANSFERRING');
    if (!active) return;

    const interval = setInterval(() => {
      setTransfers((prev) =>
        prev.map((item) => {
          if (item.status !== 'TRANSFERRING') return item;
          const step = item.transport === 'USB_ADB' ? 28 : 20;
          const nextProgress = Math.min(100, item.progress + step);
          if (nextProgress >= 100) {
            // Register file in destination list
            if (item.direction === 'ANDROID_TO_PC') {
              setExistingPcFiles((files) => (files.includes(item.savedAs) ? files : [...files, item.savedAs]));
            } else {
              setExistingAndroidFiles((files) => (files.includes(item.savedAs) ? files : [...files, item.savedAs]));
            }
            return { ...item, progress: 100, status: 'COMPLETED' };
          }
          return { ...item, progress: nextProgress };
        })
      );
    }, 450);

    return () => clearInterval(interval);
  }, [transfers]);

  const regenerateQrCode = () => {
    const nextToken = `qsc_pair_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36).slice(-4)}`;
    setPairToken(nextToken);
    setSecondsLeft(tokenExpiryConfig);
    addLog(
      'SECURITY',
      'Local OS',
      'Generated fresh 256-bit temporary pairing token',
      JSON.stringify({ token: nextToken, ttl_seconds: tokenExpiryConfig })
    );
  };

  const simulateQrScanFromAndroid = () => {
    if (secondsLeft <= 0) {
      addLog('SECURITY', 'Phone -> PC', 'QR Pairing rejected: Token expired', '{"error":"TOKEN_EXPIRED"}');
      return;
    }
    const newSession = `sess_bearer_${Math.random().toString(36).slice(2, 14)}`;
    setSessionToken(newSession);
    setConnectionState('CONNECTED_WIFI');
    addLog(
      'HTTP',
      'Phone -> PC',
      'POST /api/v1/pair — Validated temporary QR token & issued session bearer token',
      JSON.stringify({
        client: 'Android 14 (Pixel 7a)',
        pairToken,
        issuedSessionToken: newSession
      })
    );
    addLog(
      'WS',
      'Phone -> PC',
      'WebSocket /ws/control connected with Authorization: Bearer ' + newSession.slice(0, 16) + '...',
      '{"type":"SESSION_ESTABLISHED","device":"Pixel 7a","mode":"WIFI"}'
    );
  };

  const disconnectSession = () => {
    setConnectionState('DISCONNECTED');
    setSessionToken(null);
    setCameraStatus('IDLE');
    setAdbTunnelActive(false);
    regenerateQrCode();
    addLog('WS', 'Local OS', 'Session closed cleanly. Active camera and tokens invalidated.', '{"type":"DISCONNECT"}');
  };

  // Safe non-overwriting file name resolver
  const resolveSafeFilename = (rawName: string, targetList: string[]): { safeName: string; renamed: boolean } => {
    // Strip any path traversal like ../../
    const cleanBase = rawName.split(/[\\/]/).pop() || 'transferred_file';
    if (!targetList.includes(cleanBase)) {
      return { safeName: cleanBase, renamed: false };
    }
    const dotIndex = cleanBase.lastIndexOf('.');
    const stem = dotIndex > 0 ? cleanBase.slice(0, dotIndex) : cleanBase;
    const ext = dotIndex > 0 ? cleanBase.slice(dotIndex) : '';
    let counter = 1;
    let candidate = `${stem} (${counter})${ext}`;
    while (targetList.includes(candidate)) {
      counter++;
      candidate = `${stem} (${counter})${ext}`;
    }
    return { safeName: candidate, renamed: true };
  };

  const initiateFileTransfer = (
    file: { name: string; size: number },
    direction: 'PC_TO_ANDROID' | 'ANDROID_TO_PC'
  ) => {
    if (connectionState === 'DISCONNECTED') {
      setWinTab('qr');
      setAndroidTab('scan');
      addLog('SECURITY', 'Local OS', 'Transfer blocked: Pair devices via QR or USB first.', '{"error":"UNAUTHORIZED"}');
      return;
    }

    const targetFiles = direction === 'ANDROID_TO_PC' ? existingPcFiles : existingAndroidFiles;
    const { safeName, renamed } = resolveSafeFilename(file.name, targetFiles);
    const transport = connectionState === 'CONNECTED_USB' ? 'USB_ADB' : 'WIFI';
    const speed = transport === 'USB_ADB' ? 34.8 : 21.6;
    const initialStatus = requireReceiverApproval ? 'PENDING_APPROVAL' : 'TRANSFERRING';

    const newItem: TransferItem = {
      id: `tx-${Date.now()}`,
      fileName: file.name,
      savedAs: safeName,
      sizeBytes: file.size,
      direction,
      transport,
      progress: 0,
      speedMbps: speed,
      status: initialStatus,
      timestamp: nowTime(),
      wasRenamed: renamed
    };

    setTransfers((prev) => [newItem, ...prev]);

    if (renamed) {
      addLog(
        'SECURITY',
        direction === 'PC_TO_ANDROID' ? 'PC -> Phone' : 'Phone -> PC',
        `Collision prevented: "${file.name}" auto-renamed to "${safeName}" so existing file is never overwritten`,
        JSON.stringify({ original: file.name, resolved: safeName })
      );
    }

    addLog(
      'HTTP',
      direction === 'PC_TO_ANDROID' ? 'PC -> Phone' : 'Phone -> PC',
      `${initialStatus === 'PENDING_APPROVAL' ? 'Transfer offer sent (awaiting receiver confirmation)' : 'Chunked HTTP stream started (64 KB buffer)'}: ${safeName}`,
      JSON.stringify({
        file: safeName,
        bytes: file.size,
        chunkSize: 65536,
        transport
      })
    );

    if (requireReceiverApproval) {
      if (direction === 'PC_TO_ANDROID') {
        setAndroidTab('receive');
      } else {
        setWinTab('receive');
      }
    }
  };

  const approveTransfer = (id: string) => {
    setTransfers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'TRANSFERRING', progress: 15 } : item))
    );
    addLog('WS', 'Local OS', `Receiver accepted file transfer (${id}). Streaming 64 KB chunks...`, '{"type":"TRANSFER_ACCEPTED"}');
  };

  const cancelOrRejectTransfer = (id: string, mode: 'CANCELLED' | 'REJECTED') => {
    setTransfers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: mode } : item))
    );
    addLog(
      'HTTP',
      'Local OS',
      `Transfer ${mode.toLowerCase()} safely. Partial temp file (.part) deleted.`,
      JSON.stringify({ transferId: id, status: mode })
    );
  };

  // Text Sharing Actions
  const sendTextToAndroid = () => {
    if (connectionState === 'DISCONNECTED') {
      setLastSyncedNotice('Connect devices via QR or USB first to send text.');
      return;
    }
    setAndroidText(pcText);
    setLastSyncedNotice(`Sent ${pcText.length} characters from Windows to Android at ${nowTime()}`);
    addLog(
      'WS',
      'PC -> Phone',
      'WS FRAME: TEXT_SHARE payload delivered to Android',
      JSON.stringify({ type: 'TEXT_SHARE', length: pcText.length, autoClipboard: clipboardSyncEnabled })
    );
  };

  const sendTextToPc = () => {
    if (connectionState === 'DISCONNECTED') {
      setLastSyncedNotice('Connect devices via QR or USB first to send text.');
      return;
    }
    setPcText(androidText);
    setLastSyncedNotice(`Sent ${androidText.length} characters from Android to Windows at ${nowTime()}`);
    addLog(
      'WS',
      'Phone -> PC',
      'WS FRAME: TEXT_SHARE payload delivered to Windows',
      JSON.stringify({ type: 'TEXT_SHARE', length: androidText.length, autoClipboard: clipboardSyncEnabled })
    );
  };

  // Remote Camera Workflow
  const requestCameraFromWindows = () => {
    if (connectionState === 'DISCONNECTED') {
      setWinTab('qr');
      setAndroidTab('scan');
      return;
    }
    setCameraStatus('AWAITING_ANDROID_PERMISSION');
    setAndroidTab('camera');
    addLog(
      'WS',
      'PC -> Phone',
      'WS FRAME: CAMERA_PERMISSION_REQUEST — Waiting for explicit user approval on Android',
      '{"type":"CAMERA_REQUEST","fps":10,"resolution":"640x480_preview"}'
    );
  };

  const grantCameraPermissionOnAndroid = () => {
    setCameraStatus('STREAMING_PREVIEW');
    addLog(
      'SECURITY',
      'Phone -> PC',
      'Android user granted Camera permission. Streaming lightweight JPEG preview frames (10 FPS).',
      '{"type":"CAMERA_START_ACK","indicator":"VISIBLE_ON_PHONE"}'
    );
  };

  const stopCameraSession = (source: 'Windows' | 'Android') => {
    setCameraStatus('IDLE');
    setCapturedPhotoTime(null);
    addLog(
      'SECURITY',
      source === 'Windows' ? 'PC -> Phone' : 'Phone -> PC',
      `Camera session stopped immediately by ${source}. CameraX unbound on Android.`,
      '{"type":"CAMERA_STOP"}'
    );
  };

  const captureRemotePhoto = () => {
    const stamp = nowTime();
    setCameraStatus('PHOTO_CAPTURED');
    setCapturedPhotoTime(stamp);
    addLog(
      'WS',
      'PC -> Phone',
      'WS FRAME: CAMERA_CAPTURE_COMMAND -> Android CameraX ImageCapture triggered',
      '{"type":"CAPTURE_PHOTO","quality":92}'
    );
  };

  const saveCapturedPhotoToPc = () => {
    const rawName = `QuickShare_Cam_${new Date().toISOString().slice(0, 10)}.jpg`;
    const { safeName, renamed } = resolveSafeFilename(rawName, existingPcFiles);
    setExistingPcFiles((prev) => [...prev, safeName]);
    const item: TransferItem = {
      id: `cam-${Date.now()}`,
      fileName: rawName,
      savedAs: safeName,
      sizeBytes: 3_480_000,
      direction: 'ANDROID_TO_PC',
      transport: connectionState === 'CONNECTED_USB' ? 'USB_ADB' : 'WIFI',
      progress: 100,
      speedMbps: 24.5,
      status: 'COMPLETED',
      timestamp: nowTime(),
      wasRenamed: renamed
    };
    setTransfers((prev) => [item, ...prev]);
    addLog(
      'HTTP',
      'Phone -> PC',
      `Saved remote camera photo to ${downloadFolder}\\${safeName}`,
      JSON.stringify({ file: safeName, bytes: 3480000 })
    );
    setCameraStatus('STREAMING_PREVIEW');
  };

  // USB ADB Workflow
  const activateUsbTunnel = () => {
    if (!usbCablePlugged || !usbDebuggingAuthorized) return;
    setAdbTunnelActive(true);
    const usbSession = `sess_usb_${Math.random().toString(36).slice(2, 12)}`;
    setSessionToken(usbSession);
    setConnectionState('CONNECTED_USB');
    addLog(
      'ADB',
      'Local OS',
      'Executed: adb forward tcp:8765 tcp:8765 -> Localhost USB tunnel established',
      '{"command":"adb forward tcp:8765 tcp:8765","device":"R58N204X91A\tdevice","bind":"127.0.0.1:8765"}'
    );
  };

  const winNavItems: { id: WinTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'qr', label: 'Connect & QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'send', label: 'Send Files', icon: <Upload className="w-4 h-4" /> },
    {
      id: 'receive',
      label: 'Receive Files',
      icon: <Download className="w-4 h-4" />,
      count: transfers.filter((t) => t.direction === 'ANDROID_TO_PC' && t.status === 'PENDING_APPROVAL').length
    },
    { id: 'text', label: 'Text Share', icon: <FileText className="w-4 h-4" /> },
    { id: 'camera', label: 'Camera Capture', icon: <Camera className="w-4 h-4" /> },
    { id: 'usb', label: 'USB Mode', icon: <Usb className="w-4 h-4" /> },
    { id: 'history', label: 'Transfer History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const androidNavItems: { id: AndroidTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'scan', label: 'Scan PC QR', icon: <QrCode className="w-3.5 h-3.5" /> },
    { id: 'send', label: 'Send to PC', icon: <Upload className="w-3.5 h-3.5" /> },
    {
      id: 'receive',
      label: 'Receive',
      icon: <Download className="w-3.5 h-3.5" />,
      count: transfers.filter((t) => t.direction === 'PC_TO_ANDROID' && t.status === 'PENDING_APPROVAL').length
    },
    { id: 'text', label: 'Text Share', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'camera', label: 'Camera', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'usb', label: 'USB Mode', icon: <Usb className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Guided Interactive Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-slate-500">
            Interactive Architecture Sandbox · Test both applications before writing a single line of code
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Live Dual-Device Simulator (Windows 10 PySide6 App + Android Kotlin Compose App)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {connectionState === 'DISCONNECTED' ? (
            <button
              onClick={simulateQrScanFromAndroid}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              Simulate Scanning PC QR on Phone
            </button>
          ) : (
            <button
              onClick={disconnectSession}
              className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Disconnect Session
            </button>
          )}
        </div>
      </div>

      {/* Main Side-by-Side Split: Windows Desktop App (7 cols) + Android Native App (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: WINDOWS 10 PYSIDE6 DESKTOP SIMULATOR */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col">
          {/* Windows 10 Native Title Bar */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold tracking-tight">
                QuickShare Connect — Windows 10 Desktop (Python + PySide6)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              {connectionState === 'DISCONNECTED' && (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
              {connectionState === 'CONNECTED_WIFI' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Wi-Fi Paired (Pixel 7a)
                </span>
              )}
              {connectionState === 'CONNECTED_USB' && (
                <span className="text-blue-300 flex items-center gap-1">
                  <Usb className="w-3.5 h-3.5" /> USB ADB Tunnel Active
                </span>
              )}
            </div>
          </div>

          {/* Windows Body: Sidebar + Main Stacked Widget */}
          <div className="flex flex-1 min-h-[510px]">
            {/* PySide6 QListWidget Sidebar */}
            <div className="w-48 bg-slate-50 border-r border-slate-200 p-2.5 flex flex-col justify-between shrink-0">
              <div className="space-y-1">
                {winNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setWinTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      winTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.count && item.count > 0 ? (
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                          winTab === item.id ? 'bg-white text-blue-700 font-bold' : 'bg-amber-100 text-amber-800 font-semibold'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 px-2 space-y-1 text-[11px] text-slate-500">
                <div className="font-medium text-slate-700">RAM Footprint</div>
                <div className="font-mono text-slate-600">~64 MB (64KB Stream)</div>
                <div className="font-mono text-slate-500 truncate">{activeHostIp}:8765</div>
              </div>
            </div>

            {/* PySide6 QStackedWidget Content Area */}
            <div className="flex-1 p-5 overflow-y-auto">
              {winTab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Windows Dashboard</h4>
                      <p className="text-xs text-slate-500">
                        Local server running on {activeHostIp}:8765 · No internet or cloud required
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-600">
                      {connectionState === 'DISCONNECTED' ? 'Awaiting Pairing' : 'Authenticated Session'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                      <div className="text-xs text-slate-500">Connection Mode</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {connectionState === 'CONNECTED_WIFI'
                          ? 'Local Wi-Fi'
                          : connectionState === 'CONNECTED_USB'
                          ? 'USB ADB Cable'
                          : 'Not Paired'}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                      <div className="text-xs text-slate-500">Completed Transfers</div>
                      <div className="text-sm font-semibold font-mono text-slate-900 mt-1 tabular-nums">
                        {transfers.filter((t) => t.status === 'COMPLETED').length} files
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                      <div className="text-xs text-slate-500">Remote Camera</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {cameraStatus === 'STREAMING_PREVIEW' ? 'Live On' : 'Standby'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-800">Quick Actions</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setWinTab('qr')}
                        className="p-3 border border-slate-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-blue-600" /> Show Pairing QR Code
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pair phone over home Wi-Fi or Windows Mobile Hotspot
                        </p>
                      </button>
                      <button
                        onClick={() => setWinTab('send')}
                        className="p-3 border border-slate-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-blue-600" /> Send Files to Phone
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Stream photos, videos, audio, and docs in 64 KB chunks
                        </p>
                      </button>
                      <button
                        onClick={() => setWinTab('camera')}
                        className="p-3 border border-slate-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-blue-600" /> Remote Camera Capture
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Preview phone camera on PC and snap high-res scans
                        </p>
                      </button>
                      <button
                        onClick={() => setWinTab('usb')}
                        className="p-3 border border-slate-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Usb className="w-4 h-4 text-blue-600" /> USB Cable Mode (ADB)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Zero-Wi-Fi transfer over USB debugging port forward
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {winTab === 'qr' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Connect Phone via QR Code</h4>
                      <p className="text-xs text-slate-500">
                        Temporary token expires automatically to prevent unauthorized local access
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setNetworkMode('LAN_WIFI')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          networkMode === 'LAN_WIFI'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Home Wi-Fi (192.168.1.45)
                      </button>
                      <button
                        onClick={() => setNetworkMode('WIN_HOTSPOT')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          networkMode === 'WIN_HOTSPOT'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PC Hotspot (192.168.137.1)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Crisp SVG QR Code */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl bg-white">
                      <svg
                        viewBox="0 0 27 27"
                        className="w-36 h-36 border border-slate-100 rounded p-1 bg-white"
                        aria-label="QuickShare Connect Pairing QR Code"
                      >
                        {qrMatrix.map((row, rIdx) =>
                          row.map((cell, cIdx) =>
                            cell ? (
                              <rect
                                key={`${rIdx}-${cIdx}`}
                                x={cIdx + 1}
                                y={rIdx + 1}
                                width={1}
                                height={1}
                                fill="#0F172A"
                              />
                            ) : null
                          )
                        )}
                      </svg>
                      <div className="mt-2 text-[11px] font-mono text-slate-600 tabular-nums">
                        Expires in <span className="font-semibold text-blue-600">{secondsLeft}s</span>
                      </div>
                    </div>

                    {/* Connection & Payload Details */}
                    <div className="sm:col-span-7 space-y-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-700">
                          Encoded QR Connection Payload
                        </div>
                        <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto leading-relaxed">
                          {JSON.stringify(
                            {
                              ip: activeHostIp,
                              port: 8765,
                              token: pairToken,
                              expiresInSec: secondsLeft
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={regenerateQrCode}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate Token
                        </button>
                        {connectionState === 'DISCONNECTED' ? (
                          <button
                            onClick={simulateQrScanFromAndroid}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Smartphone className="w-3.5 h-3.5" /> Scan with Android Simulator
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Phone Authenticated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {winTab === 'send' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Send Files (Windows to Android)</h4>
                      <p className="text-xs text-slate-500">
                        Select a file to stream in 64 KB chunks over {connectionState === 'CONNECTED_USB' ? 'USB ADB' : 'Local Wi-Fi'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {SAMPLE_PC_FILES.map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="text-xs font-semibold text-slate-900 truncate">{f.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {f.type} · {formatBytes(f.size)}
                          </div>
                        </div>
                        <button
                          onClick={() => initiateFileTransfer(f, 'PC_TO_ANDROID')}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          <Upload className="w-3.5 h-3.5" /> Send to Phone
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Active outbound transfers */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-700">Outbound Progress</div>
                    {transfers
                      .filter((t) => t.direction === 'PC_TO_ANDROID')
                      .slice(0, 3)
                      .map((t) => (
                        <div key={t.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 truncate">{t.savedAs}</span>
                            <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                              {t.status === 'PENDING_APPROVAL'
                                ? 'Waiting on Phone Approval...'
                                : `${t.progress}% · ${t.speedMbps} MB/s`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-600'
                                  : t.status === 'CANCELLED' || t.status === 'REJECTED'
                                  ? 'bg-red-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {formatBytes(t.sizeBytes)} · {t.status}
                              {t.wasRenamed ? ' · Auto-renamed (Safe Non-Overwrite)' : ''}
                            </span>
                            {(t.status === 'TRANSFERRING' || t.status === 'PENDING_APPROVAL') && (
                              <button
                                onClick={() => cancelOrRejectTransfer(t.id, 'CANCELLED')}
                                className="text-red-600 hover:underline font-medium cursor-pointer"
                              >
                                Cancel Transfer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {winTab === 'receive' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h4 className="text-sm font-semibold text-slate-900">Receive Files on Windows</h4>
                    <p className="text-xs text-slate-500">
                      Destination: <span className="font-mono">{downloadFolder}</span>
                    </p>
                  </div>

                  {transfers.filter((t) => t.direction === 'ANDROID_TO_PC').length === 0 ? (
                    <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                      <p className="text-xs text-slate-600">
                        No incoming files from Android yet. Use the Android simulator on the right ("Send to PC") to test!
                      </p>
                      <button
                        onClick={() => setAndroidTab('send')}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                      >
                        Open Android "Send to PC" Screen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {transfers
                        .filter((t) => t.direction === 'ANDROID_TO_PC')
                        .map((t) => (
                          <div key={t.id} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50/70">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{t.savedAs}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {formatBytes(t.sizeBytes)} · From Android · {t.status}
                                </div>
                              </div>
                              {t.status === 'PENDING_APPROVAL' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => approveTransfer(t.id)}
                                    className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                                  >
                                    Accept & Save
                                  </button>
                                  <button
                                    onClick={() => cancelOrRejectTransfer(t.id, 'REJECTED')}
                                    className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  t.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${t.progress}%` }}
                              />
                            </div>
                            {t.wasRenamed && (
                              <div className="text-[11px] text-amber-700">
                                Existing file protected: automatically renamed from {t.fileName} to {t.savedAs}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {winTab === 'text' && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Bidirectional Text & Link Share</h4>
                      <p className="text-xs text-slate-500">Send notes, URLs, or code snippets instantly over WebSocket</p>
                    </div>
                  </div>

                  <textarea
                    value={pcText}
                    onChange={(e) => setPcText(e.target.value)}
                    rows={5}
                    className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    placeholder="Type or paste text on Windows..."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigator.clipboard?.writeText(pcText)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                      <button
                        onClick={() => setPcText((prev) => prev + '\n[Pasted from Windows Clipboard]')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5" /> Paste
                      </button>
                      <button
                        onClick={() => setPcText('')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    </div>

                    <button
                      onClick={sendTextToAndroid}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Send Text to Android →
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                    Status: {lastSyncedNotice}
                  </div>
                </div>
              )}

              {winTab === 'camera' && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Remote Camera Capture</h4>
                      <p className="text-xs text-slate-500">
                        Requires explicit Android camera permission & shows visible recording indicator on phone
                      </p>
                    </div>
                    {cameraStatus !== 'IDLE' && (
                      <button
                        onClick={() => stopCameraSession('Windows')}
                        className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <StopCircle className="w-3.5 h-3.5" /> Stop Camera
                      </button>
                    )}
                  </div>

                  {cameraStatus === 'IDLE' && (
                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-3">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-900">
                          Camera Session Inactive (Privacy First)
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Clicking below sends a permission request to the paired Android phone. The camera never turns on silently.
                        </p>
                      </div>
                      <button
                        onClick={requestCameraFromWindows}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Request Remote Camera Preview
                      </button>
                    </div>
                  )}

                  {cameraStatus === 'AWAITING_ANDROID_PERMISSION' && (
                    <div className="p-6 border border-amber-200 bg-amber-50/60 rounded-xl text-center space-y-2">
                      <div className="text-xs font-semibold text-amber-900">
                        Waiting for User Approval on Android Phone...
                      </div>
                      <p className="text-xs text-amber-800">
                        Look at the Android Simulator on the right and click <strong>"Allow Camera Session"</strong>.
                      </p>
                    </div>
                  )}

                  {(cameraStatus === 'STREAMING_PREVIEW' || cameraStatus === 'PHOTO_CAPTURED') && (
                    <div className="space-y-3">
                      {/* Simulated Live Viewfinder */}
                      <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 h-48 flex flex-col justify-between p-3 text-white">
                        <div className="flex items-center justify-between text-[11px] font-mono z-10">
                          <span className="bg-black/60 px-2 py-0.5 rounded">
                            {cameraStatus === 'STREAMING_PREVIEW'
                              ? 'LIVE PREVIEW · 640x480 · 10 FPS MJPEG'
                              : `CAPTURED STILL · 4032x3024 (${capturedPhotoTime})`}
                          </span>
                          <div className="flex items-center gap-1">
                            {(['DOCUMENT', 'WORKBENCH', 'OUTDOOR'] as const).map((scene) => (
                              <button
                                key={scene}
                                onClick={() => setCameraSceneSubject(scene)}
                                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                                  cameraSceneSubject === scene ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
                                }`}
                              >
                                {scene}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Simulated Visual Target inside Viewfinder */}
                        <div className="my-auto mx-auto text-center space-y-1">
                          <div className="inline-block border border-dashed border-emerald-400/80 px-6 py-4 rounded-lg bg-slate-800/80">
                            <div className="text-xs font-mono text-emerald-300">
                              {cameraSceneSubject === 'DOCUMENT' && '[ A4 Invoice / Handwritten Notes Page ]'}
                              {cameraSceneSubject === 'WORKBENCH' && '[ Electronics PCB & Multimeter Setup ]'}
                              {cameraSceneSubject === 'OUTDOOR' && '[ Garden Serial Number Plate ]'}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">
                              Android CameraX Rear Lens · Auto-Focus Locked
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 z-10">
                          <span>RAM Buffer: 180 KB</span>
                          <span>Explicit Android Consent: Active</span>
                        </div>
                      </div>

                      {/* Capture, Retake, and Save Action Bar */}
                      <div className="flex items-center justify-between gap-2">
                        {cameraStatus === 'STREAMING_PREVIEW' ? (
                          <button
                            onClick={captureRemotePhoto}
                            className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" /> Capture High-Res Photo from Phone
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => setCameraStatus('STREAMING_PREVIEW')}
                              className="flex-1 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Retake
                            </button>
                            <button
                              onClick={saveCapturedPhotoToPc}
                              className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Photo to Windows
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {winTab === 'usb' && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h4 className="text-sm font-semibold text-slate-900">USB Cable Mode (ADB TCP Port Forwarding)</h4>
                    <p className="text-xs text-slate-500">
                      Requires a one-time Developer Options & USB Debugging setup on your Android phone
                    </p>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="font-semibold text-slate-800">Step-by-Step USB Readiness Check</div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span>1. Physical USB Data Cable Connected</span>
                      <button
                        onClick={() => setUsbCablePlugged((v) => !v)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                          usbCablePlugged ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {usbCablePlugged ? 'Plugged In' : 'Simulate Plugging In Cable'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span>2. Android "Allow USB Debugging" RSA Popup Approved</span>
                      <button
                        onClick={() => setUsbDebuggingAuthorized((v) => !v)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                          usbDebuggingAuthorized ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {usbDebuggingAuthorized ? 'Authorized (device)' : 'Authorize on Phone'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span>3. Run `adb forward tcp:8765 tcp:8765` Tunnel</span>
                      <button
                        disabled={!usbCablePlugged || !usbDebuggingAuthorized}
                        onClick={activateUsbTunnel}
                        className={`px-3 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                          adbTunnelActive
                            ? 'bg-blue-600 text-white'
                            : usbCablePlugged && usbDebuggingAuthorized
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {adbTunnelActive ? 'Tunnel Active (127.0.0.1:8765)' : 'Activate USB Tunnel'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-1">
                    <div className="text-slate-400">C:\QuickShareConnect\platform-tools&gt; adb devices</div>
                    <div>List of devices attached</div>
                    {usbCablePlugged ? (
                      <div className={usbDebuggingAuthorized ? 'text-emerald-400' : 'text-amber-300'}>
                        R58N204X91A &nbsp;&nbsp;&nbsp;&nbsp;{usbDebuggingAuthorized ? 'device' : 'unauthorized'}
                      </div>
                    ) : (
                      <div className="text-slate-500">(no USB devices detected)</div>
                    )}
                  </div>
                </div>
              )}

              {winTab === 'history' && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Transfer History</h4>
                    <span className="text-xs font-mono text-slate-500">{transfers.length} entries</span>
                  </div>
                  <div className="space-y-2">
                    {transfers.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-900 truncate">{t.savedAs}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {t.direction === 'PC_TO_ANDROID' ? 'Windows → Android' : 'Android → Windows'} ·{' '}
                            {formatBytes(t.sizeBytes)} · {t.transport} · {t.timestamp}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-semibold shrink-0 ${
                            t.status === 'COMPLETED'
                              ? 'text-emerald-700'
                              : t.status === 'TRANSFERRING'
                              ? 'text-blue-700'
                              : 'text-red-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {winTab === 'settings' && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h4 className="text-sm font-semibold text-slate-900">Windows Settings</h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Designated Download Folder</label>
                      <input
                        type="text"
                        value={downloadFolder}
                        onChange={(e) => setDownloadFolder(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono text-xs border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <div>
                        <div className="font-medium text-slate-800">QR Code Expiration Timer</div>
                        <div className="text-[11px] text-slate-500">Automatically rotates un-scanned tokens</div>
                      </div>
                      <select
                        value={tokenExpiryConfig}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTokenExpiryConfig(val);
                          setSecondsLeft(val);
                        }}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg font-mono text-xs"
                      >
                        <option value={60}>60 seconds</option>
                        <option value={120}>120 seconds</option>
                        <option value={300}>300 seconds</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <div>
                        <div className="font-medium text-slate-800">Ask Before Accepting Incoming Files</div>
                        <div className="text-[11px] text-slate-500">
                          Requires receiver confirmation before saving to disk
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireReceiverApproval}
                        onChange={(e) => setRequireReceiverApproval(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium text-slate-800">Optional Clipboard Auto-Copy</div>
                        <div className="text-[11px] text-slate-500">
                          Respects OS permissions; off by default so clipboard is never overwritten unexpectedly
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={clipboardSyncEnabled}
                        onChange={(e) => setClipboardSyncEnabled(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: ANDROID JETPACK COMPOSE APPLICATION SIMULATOR */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col">
          {/* Android Top Status & App Bar */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-tight">
                QuickShare Connect — Android (Kotlin + Compose)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {connectionState === 'DISCONNECTED' ? 'Unpaired' : 'Connected to PC'}
            </span>
          </div>

          {/* Persistent Camera Privacy Alert Banner on Android whenever camera is active */}
          {cameraStatus !== 'IDLE' && (
            <div className="bg-amber-500 text-slate-950 px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                {cameraStatus === 'AWAITING_ANDROID_PERMISSION'
                  ? 'Windows PC is requesting Camera Access'
                  : 'Camera Live Streaming to Windows PC'}
              </span>
              <button
                onClick={() => stopCameraSession('Android')}
                className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] cursor-pointer"
              >
                Stop Now
              </button>
            </div>
          )}

          {/* Android Navigation Chip Bar (All 9 Screens) */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap gap-1">
            {androidNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setAndroidTab(item.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  androidTab === item.id
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count && item.count > 0 ? (
                  <span className="bg-amber-300 text-slate-900 font-mono text-[10px] px-1 rounded font-bold">
                    {item.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Android Screen Viewport */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {androidTab === 'dashboard' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500">Current Session Status</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {connectionState === 'DISCONNECTED'
                      ? 'Not Connected — Scan PC QR Code to Pair'
                      : `Connected to WIN10-DESKTOP (${activeHostIp})`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setAndroidTab('scan')}
                    className="p-3 border border-slate-200 rounded-xl text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-700 mb-1" />
                    <div className="text-xs font-semibold text-slate-900">Scan PC QR</div>
                    <div className="text-[11px] text-slate-500">CameraX + ML Kit</div>
                  </button>
                  <button
                    onClick={() => setAndroidTab('send')}
                    className="p-3 border border-slate-200 rounded-xl text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-700 mb-1" />
                    <div className="text-xs font-semibold text-slate-900">Send Files to PC</div>
                    <div className="text-[11px] text-slate-500">Photos, Videos, Docs</div>
                  </button>
                  <button
                    onClick={() => setAndroidTab('text')}
                    className="p-3 border border-slate-200 rounded-xl text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-700 mb-1" />
                    <div className="text-xs font-semibold text-slate-900">Text Share</div>
                    <div className="text-[11px] text-slate-500">Instant notes & links</div>
                  </button>
                  <button
                    onClick={() => setAndroidTab('camera')}
                    className="p-3 border border-slate-200 rounded-xl text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-700 mb-1" />
                    <div className="text-xs font-semibold text-slate-900">Camera Control</div>
                    <div className="text-[11px] text-slate-500">Permission & Stop</div>
                  </button>
                </div>
              </div>
            )}

            {androidTab === 'scan' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Scan Windows PC QR Code</h4>
                <div className="p-5 bg-slate-900 text-white rounded-xl text-center space-y-3 border border-slate-800">
                  <div className="w-32 h-32 mx-auto border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-center bg-slate-800/80 p-2">
                    <QrCode className="w-12 h-12 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono text-slate-300">CameraX Viewfinder</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Point your phone camera at the QR code shown on the Windows application.
                  </p>
                  <button
                    onClick={simulateQrScanFromAndroid}
                    className="w-full py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                  >
                    {connectionState === 'DISCONNECTED'
                      ? 'Scan QR & Pair with Windows Now'
                      : 'Re-Scan / Refresh Session Token'}
                  </button>
                </div>

                {sessionToken && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-mono text-emerald-900">
                    Authenticated Session Token: {sessionToken}
                  </div>
                )}
              </div>
            )}

            {androidTab === 'send' && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Send Files to Windows PC</h4>
                  <p className="text-xs text-slate-500">Pick media or documents via Android Storage Access Framework</p>
                </div>
                <div className="space-y-2">
                  {SAMPLE_ANDROID_FILES.map((f) => (
                    <div
                      key={f.name}
                      className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-900 truncate">{f.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {f.type} · {formatBytes(f.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => initiateFileTransfer(f, 'ANDROID_TO_PC')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        Send to PC
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {androidTab === 'receive' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Receive Files from PC</h4>
                {transfers.filter((t) => t.direction === 'PC_TO_ANDROID').length === 0 ? (
                  <div className="p-5 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                    No files sent from PC yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transfers
                      .filter((t) => t.direction === 'PC_TO_ANDROID')
                      .map((t) => (
                        <div key={t.id} className="p-2.5 border border-slate-200 rounded-lg space-y-2 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{t.savedAs}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {formatBytes(t.sizeBytes)} · {t.status}
                              </div>
                            </div>
                            {t.status === 'PENDING_APPROVAL' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => approveTransfer(t.id)}
                                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => cancelOrRejectTransfer(t.id, 'REJECTED')}
                                  className="px-2 py-1 text-[11px] font-medium bg-red-100 text-red-700 rounded cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {androidTab === 'text' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Text Share (Android)</h4>
                <textarea
                  value={androidText}
                  onChange={(e) => setAndroidText(e.target.value)}
                  rows={5}
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigator.clipboard?.writeText(androidText)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setAndroidText('')}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={sendTextToPc}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    ← Send Text to PC
                  </button>
                </div>
              </div>
            )}

            {androidTab === 'camera' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Android Camera Control & Consent</h4>
                {cameraStatus === 'IDLE' && (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-2">
                    <p>
                      Camera is currently <strong>OFF</strong>. The Windows PC cannot access your camera unless you explicitly approve a session request here.
                    </p>
                    <button
                      onClick={requestCameraFromWindows}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg cursor-pointer"
                    >
                      Simulate Request from Windows PC
                    </button>
                  </div>
                )}

                {cameraStatus === 'AWAITING_ANDROID_PERMISSION' && (
                  <div className="p-4 border-2 border-amber-400 bg-amber-50 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      Allow WIN10-DESKTOP to view live camera preview and take photos?
                    </div>
                    <p className="text-xs text-slate-700">
                      You can stop sharing at any time with a single tap.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={grantCameraPermissionOnAndroid}
                        className="flex-1 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg cursor-pointer"
                      >
                        Allow Camera Session
                      </button>
                      <button
                        onClick={() => stopCameraSession('Android')}
                        className="flex-1 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg cursor-pointer"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                )}

                {(cameraStatus === 'STREAMING_PREVIEW' || cameraStatus === 'PHOTO_CAPTURED') && (
                  <div className="p-4 border border-emerald-300 bg-emerald-50/60 rounded-xl space-y-3">
                    <div className="text-xs font-semibold text-emerald-950">
                      CameraX Active — Streaming Preview to Windows PC
                    </div>
                    <p className="text-xs text-emerald-900">
                      Keep this screen visible so you are always aware the camera is active.
                    </p>
                    <button
                      onClick={() => stopCameraSession('Android')}
                      className="w-full py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                    >
                      Stop Camera Immediately
                    </button>
                  </div>
                )}
              </div>
            )}

            {androidTab === 'usb' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">USB Debugging & ADB Status</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-slate-800">How to enable on your real Android phone:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Open Android <strong>Settings → About Phone</strong></li>
                    <li>Tap <strong>Build Number</strong> 7 times to unlock Developer Options</li>
                    <li>Go to <strong>System → Developer Options</strong> and enable <strong>USB Debugging</strong></li>
                    <li>Plug phone into PC and tap <strong>Allow</strong> on the RSA fingerprint popup</li>
                  </ol>
                </div>
              </div>
            )}

            {androidTab === 'history' && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Android Transfer History</h4>
                {transfers.map((t) => (
                  <div key={t.id} className="p-2 border border-slate-200 rounded-lg text-xs flex justify-between">
                    <span className="truncate font-medium">{t.savedAs}</span>
                    <span className="font-mono text-[11px] text-slate-600">{t.status}</span>
                  </div>
                ))}
              </div>
            )}

            {androidTab === 'settings' && (
              <div className="space-y-3 text-xs">
                <h4 className="text-sm font-semibold text-slate-900">Android Settings</h4>
                <div className="p-3 border border-slate-200 rounded-lg space-y-1">
                  <div className="font-medium text-slate-800">Save Location</div>
                  <div className="font-mono text-slate-600">/storage/emulated/0/Download/QuickShareConnect</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Live Protocol & Security Wire Log */}
      <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Live Protocol, Security & Chunked Streaming Inspector</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            HTTP REST (Port 8765) + WebSocket (/ws/control)
          </span>
        </div>
        <div className="p-3 max-h-44 overflow-y-auto space-y-1.5 font-mono text-xs">
          {wireLogs.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 px-2 rounded bg-slate-800/60 border border-slate-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-400 text-[11px] shrink-0">{entry.time}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    entry.channel === 'SECURITY'
                      ? 'bg-emerald-900/80 text-emerald-300'
                      : entry.channel === 'ADB'
                      ? 'bg-purple-900/80 text-purple-300'
                      : entry.channel === 'WS'
                      ? 'bg-blue-900/80 text-blue-300'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {entry.channel}
                </span>
                <span className="text-slate-300 text-[11px] shrink-0">{entry.direction}:</span>
                <span className="text-white truncate">{entry.summary}</span>
              </div>
              <code className="text-[11px] text-slate-400 truncate max-w-xs shrink-0">{entry.payload}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
