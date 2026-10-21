import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Cpu,
  Shield,
  Wifi,
  Camera,
  Usb,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ChevronRight,
  AlertCircle,
  Layers
} from 'lucide-react';
import {
  FOLDER_STRUCTURE_WINDOWS,
  FOLDER_STRUCTURE_ANDROID,
  ROADMAP_STAGES,
  FolderNode
} from '../data/architectureData';

interface Props {
  activeSubTab: 'overview' | 'folders' | 'protocols' | 'step1';
  setActiveSubTab: (tab: 'overview' | 'folders' | 'protocols' | 'step1') => void;
}

export const ArchitectureBlueprintView: React.FC<Props> = ({ activeSubTab, setActiveSubTab }) => {
  const [selectedNode, setSelectedNode] = useState<FolderNode>(
    FOLDER_STRUCTURE_WINDOWS.children![3].children![1] // security.py by default
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});

  const copyCommand = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const renderTree = (node: FolderNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNode.path === node.path;
    return (
      <div key={node.path}>
        <button
          onClick={() => setSelectedNode(node)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`w-full text-left py-1.5 pr-3 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
            isSelected
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            {node.type === 'folder' ? (
              <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
            ) : (
              <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
            )}
            <span className="font-mono truncate">{node.name}</span>
          </span>
          <span
            className={`text-[10px] font-mono shrink-0 ${
              isSelected ? 'text-blue-100' : 'text-slate-400'
            }`}
          >
            Stage {node.stage}
          </span>
        </button>
        {node.children && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar for Architecture Sections A-H */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            A, C & D. System Architecture, 4 GB RAM Stack & Roadmap
          </button>
          <button
            onClick={() => setActiveSubTab('folders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'folders'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            B. Project Folder Structure Explorer
          </button>
          <button
            onClick={() => setActiveSubTab('protocols')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'protocols'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            E, F & G. QR Pairing, Remote Camera & USB Protocols
          </button>
          <button
            onClick={() => setActiveSubTab('step1')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'step1'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            H. Exact First Step to Perform Now
          </button>
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE, 4GB RAM SURVIVAL STRATEGY & STAGED ROADMAP */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 GB RAM Windows 10 Golden Rules */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-blue-700">
                  Hardware-Constrained Engineering · Tailored for Windows 10 with 4 GB RAM
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  A & C. System Architecture & Lightweight Software Stack
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-600">
                Target Idle RAM: &lt; 85 MB on Windows
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Rule 1: Never Run Android Emulator</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The Android Emulator + full Android Studio GUI consumes <strong>3.2 GB to 4.5 GB of RAM</strong>, which will freeze a 4 GB Windows 10 PC. Instead, we write code in lightweight <strong>VS Code</strong> (or Notepad++) and test directly on your <strong>real Android phone</strong> over Wi-Fi or USB.
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Rule 2: 64 KB Chunked File Streaming</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Beginners often use <code className="font-mono">file.read()</code> which loads a whole 1.5 GB movie into RAM and crashes with <code className="font-mono">MemoryError</code>. QuickShare Connect streams every upload and download in <strong>64 KB chunks</strong> so RAM stays flat at ~65 MB.
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Rule 3: WebSocket MJPEG vs WebRTC</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full WebRTC video stacks (<code className="font-mono">aiortc</code> + FFmpeg + STUN/ICE) add heavy C++ dependencies and high CPU load. For a remote camera viewfinder, sending <strong>10–12 FPS compressed JPEG frames over our existing WebSocket</strong> + full-res HTTP photo capture is 10x simpler and lighter.
                </p>
              </div>
            </div>

            {/* System Architecture Diagram in Clean Structured Columns */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                How the Two Separate Applications Communicate
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
                {/* Windows App Box */}
                <div className="lg:col-span-4 border border-slate-300 rounded-xl p-4 bg-white space-y-2.5">
                  <div className="text-xs font-mono text-blue-700 font-semibold">
                    APPLICATION 1: WINDOWS DESKTOP (SERVER / HOST)
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Python 3.11+ &amp; PySide6 Desktop App
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>Main GUI Thread (PySide6):</strong> Renders the 9 screens, QR code pixmap, progress bars, and camera viewfinder.
                    </li>
                    <li>
                      <strong>Background Worker Thread (FastAPI + Uvicorn):</strong> Listens on port <code className="font-mono">8765</code> for HTTP file chunks and WebSocket commands.
                    </li>
                    <li>
                      <strong>ADB Bridge Module:</strong> Wraps <code className="font-mono">adb.exe</code> for optional USB cable tunneling.
                    </li>
                  </ul>
                </div>

                {/* Transport Bridge Box */}
                <div className="lg:col-span-3 border border-blue-200 rounded-xl p-4 bg-blue-50/40 flex flex-col justify-center space-y-2">
                  <div className="text-xs font-mono text-center font-semibold text-blue-900">
                    LOCAL TRANSPORT LAYER
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-slate-900">1. Control &amp; Text (WebSocket)</div>
                    <div className="font-mono text-[11px] text-slate-600">ws://&lt;PC_IP&gt;:8765/ws/control</div>
                    <div className="text-[11px] text-slate-500">
                      Instant pairing status, text share, transfer approval prompts, camera shutter commands.
                    </div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-slate-900">2. Bulk Data (HTTP 1.1 Stream)</div>
                    <div className="font-mono text-[11px] text-slate-600">http://&lt;PC_IP&gt;:8765/api/v1/files/*</div>
                    <div className="text-[11px] text-slate-500">
                      64 KB chunked upload/download with Bearer session header. Works identically over Wi-Fi, Hotspot, or <code className="font-mono">adb forward</code> USB!
                    </div>
                  </div>
                </div>

                {/* Android App Box */}
                <div className="lg:col-span-4 border border-slate-300 rounded-xl p-4 bg-white space-y-2.5">
                  <div className="text-xs font-mono text-emerald-700 font-semibold">
                    APPLICATION 2: ANDROID NATIVE APP (CLIENT)
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Kotlin, Jetpack Compose &amp; CameraX
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>Compose UI Layer:</strong> 9 clean screens matching the Windows navigation layout.
                    </li>
                    <li>
                      <strong>CameraX + ML Kit Barcode:</strong> Scans the PC QR code and handles Remote Camera preview + high-res photo capture.
                    </li>
                    <li>
                      <strong>OkHttp3 Engine:</strong> Connects to the PC's WebSocket and streams files via Android <code className="font-mono">ContentResolver</code>.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Staged Development Roadmap */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Section D · Incremental Build &amp; Verification Plan
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                6-Stage Development Roadmap (Small, Verifiable Steps)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROADMAP_STAGES.map((st) => (
                <div key={st.stage} className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700">STAGE 0{st.stage}</span>
                    <span className="text-[11px] font-mono text-slate-500">{st.ramImpact}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.goal}</p>
                  <div className="pt-1 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-800">How we verify it works:</div>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                      {st.verificationSteps.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE FOLDER STRUCTURE EXPLORER */}
      {activeSubTab === 'folders' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Section B · Strict Separation of Windows and Android Projects
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Complete Project Folder Structure &amp; Component Responsibilities
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any folder or file below to inspect its exact path, implementation stage, and beginner-friendly explanation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Tree */}
            <div className="lg:col-span-5 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-4 max-h-[520px] overflow-y-auto">
              <div>
                <div className="text-[11px] font-mono font-semibold text-slate-500 px-2 mb-1">
                  1. WINDOWS DESKTOP PROJECT
                </div>
                {renderTree(FOLDER_STRUCTURE_WINDOWS)}
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-mono font-semibold text-slate-500 px-2 mb-1">
                  2. ANDROID NATIVE PROJECT
                </div>
                {renderTree(FOLDER_STRUCTURE_ANDROID)}
              </div>
            </div>

            {/* Right Inspector */}
            <div className="lg:col-span-7 border border-slate-200 rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-mono text-blue-600">{selectedNode.path}</div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNode.name}</h4>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  Introduced in Stage {selectedNode.stage}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">Purpose in Simple Language</div>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedNode.summary}</p>
              </div>

              {selectedNode.responsibilities && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800">Key Responsibilities</div>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    {selectedNode.responsibilities.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNode.techNotes && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-950">
                  <strong>4 GB RAM Optimization Note:</strong> {selectedNode.techNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROTOCOLS (E, F, G) */}
      {activeSubTab === 'protocols' && (
        <div className="space-y-6">
          {/* E. QR Pairing & Local Communication Protocol */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              E. Proposed QR Pairing &amp; Authenticated Session Protocol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  1. QR Code JSON Payload (Generated by Windows)
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "v": 1,
  "ip": "192.168.1.45",
  "port": 8765,
  "pair_token": "qsc_pair_8f9d2a7b...",
  "expires_at": 1761037200,
  "pc_name": "DESKTOP-WIN10"
}`}
                </pre>
                <p className="text-xs text-slate-600">
                  The QR code never exposes permanent credentials. Its <code className="font-mono">pair_token</code> is single-use and expires after 120 seconds (configurable in Settings).
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  2. Handshake Request &amp; Session Token Exchange
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`// Android POSTs to http://192.168.1.45:8765/api/v1/pair
{
  "pair_token": "qsc_pair_8f9d2a7b...",
  "device_name": "Pixel 7a",
  "android_version": "14"
}
// Windows validates expiry & returns Bearer token:
{
  "status": "paired",
  "session_token": "sess_bearer_9941a8c2..."
}`}
                </pre>
                <p className="text-xs text-slate-600">
                  Every subsequent HTTP file transfer and WebSocket connection must include <code className="font-mono">Authorization: Bearer &lt;session_token&gt;</code>.
                </p>
              </div>
            </div>
          </div>

          {/* F & G: Camera Workflow & USB ADB Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                F. Remote Camera Control &amp; Image Transfer Workflow
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Why we choose <strong>WebSocket JPEG Frame Streaming + HTTP High-Res Capture</strong> over WebRTC for a 4 GB RAM PC:
              </p>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Explicit Consent Gate:</strong> Windows sends <code className="font-mono">{`{"type":"CAMERA_REQUEST"}`}</code>. Android displays a full-screen permission prompt. Nothing streams until the user taps <strong>Allow</strong> on the phone.
                </li>
                <li>
                  <strong>Lightweight Live Preview (10 FPS):</strong> Android's <code className="font-mono">CameraX ImageAnalysis</code> compresses 640×480 preview frames to ~25 KB JPEGs and sends them over the active WebSocket. Windows displays them in a <code className="font-mono">QLabel</code> viewfinder using almost zero CPU.
                </li>
                <li>
                  <strong>High-Resolution Still Capture:</strong> When you click <strong>Capture</strong> on Windows, Android triggers <code className="font-mono">ImageCapture.takePicture()</code> at full sensor resolution and uploads the crisp JPEG via HTTP so you can <strong>Save</strong> or <strong>Retake</strong>.
                </li>
              </ol>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                G. Modular USB Architecture (ADB Port Forwarding)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Writing custom Windows USB drivers or raw MTP code is brittle and complex. Instead, we use Google's official 8 MB standalone <strong>Android Platform Tools (<code className="font-mono">adb.exe</code>)</strong>:
              </p>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Honest Configuration Requirement:</strong> USB mode does <em>not</em> work magically without setup. You must enable <strong>Developer Options → USB Debugging</strong> on your phone once and tap "Allow" on the phone's popup when plugged in.
                </li>
                <li>
                  <strong>How the Tunnel Works:</strong> Windows runs <code className="font-mono">adb forward tcp:8765 tcp:8765</code> (or <code className="font-mono">adb reverse tcp:8765 tcp:8765</code>).
                </li>
                <li>
                  <strong>100% Code Reuse:</strong> Once the tunnel is active, Android connects to <code className="font-mono">http://127.0.0.1:8765</code> over the physical USB wire! File transfer, text share, and remote camera work identically with zero Wi-Fi.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXACT FIRST STEP TO PERFORM NOW (SECTION H) */}
      {activeSubTab === 'step1' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-semibold text-blue-600">
              Section H · Beginner-Friendly Action Plan for Windows 10 (4 GB RAM)
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Your Exact First Step: Create the Project Folders &amp; Verify Python
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              We will build and verify Stage 1 (the Windows Desktop App + Local Server + QR Code Generator) first before installing any Android tools. Follow these 4 simple commands in Windows PowerShell or Command Prompt.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'cmd-1',
                title: 'Step 1.1 — Open Command Prompt and check if Python 3.10+ is installed',
                cmd: 'python --version',
                explanation:
                  'Press the Windows Key, type cmd, and press Enter. Type the command above. If it says Python 3.10.x, 3.11.x, or 3.12.x, you are ready! (If not, download the official 25 MB installer from python.org and check the box "Add python.exe to PATH" during installation).'
              },
              {
                id: 'cmd-2',
                title: 'Step 1.2 — Create our clean two-folder workspace on your C: drive',
                cmd: 'mkdir C:\\QuickShareConnect\\windows-app\\core C:\\QuickShareConnect\\windows-app\\ui C:\\QuickShareConnect\\android-app',
                explanation:
                  'This creates the separate folders for our Windows app and Android app so they never get mixed up.'
              },
              {
                id: 'cmd-3',
                title: 'Step 1.3 — Create an isolated Python virtual environment for the Windows app',
                cmd: 'cd C:\\QuickShareConnect\\windows-app && python -m venv venv && venv\\Scripts\\activate',
                explanation:
                  'A virtual environment ("venv") keeps our QuickShare packages tidy inside C:\\QuickShareConnect\\windows-app\\venv without cluttering your Windows system.'
              },
              {
                id: 'cmd-4',
                title: 'Step 1.4 — Install the lightweight Windows app libraries',
                cmd: 'pip install PySide6 fastapi uvicorn websockets qrcode[pil] Pillow python-multipart aiofiles',
                explanation:
                  'This installs the PySide6 desktop GUI framework, the FastAPI/Uvicorn local server, and the QR code image generator.'
              }
            ].map((step) => (
              <div key={step.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!completedChecks[step.id]}
                      onChange={(e) =>
                        setCompletedChecks((prev) => ({ ...prev, [step.id]: e.target.checked }))
                      }
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span>{step.title}</span>
                  </label>
                  <button
                    onClick={() => copyCommand(step.id, step.cmd)}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedId === step.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Command
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-xs overflow-x-auto">
                  {step.cmd}
                </pre>

                <p className="text-xs text-slate-600 leading-relaxed">{step.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
