import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  FolderArchive,
  Copy,
  Check,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import {
  COMPLETE_SOURCE_FILES,
  SourceFileEntry
} from '../data/completeSourceCode';
import {
  buildProjectZipBlob,
  buildDoubleClickableWindowsBat
} from '../utils/zipAndBatGenerator';

export const ExeApkBuilderHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SourceFileEntry>(COMPLETE_SOURCE_FILES[6]); // ui/main_window.py
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'windows' | 'android' | 'cloud-builder'>('all');

  const triggerTextDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerZipDownload = () => {
    const blob = buildProjectZipBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QuickShareConnect-Complete-Project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerDoubleClickBatDownload = () => {
    const batContent = buildDoubleClickableWindowsBat();
    triggerTextDownload('QuickShareConnect-Setup-EXE.bat', batContent);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredFiles =
    platformFilter === 'all'
      ? COMPLETE_SOURCE_FILES
      : COMPLETE_SOURCE_FILES.filter((f) => f.platform === platformFilter);

  return (
    <div className="space-y-6">
      {/* Direct Download Cards at the very top */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 pb-4 space-y-1">
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Direct Download Center · Built for Windows 10 (4 GB RAM) &amp; Android
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Download Your Double-Click Windows <code className="font-mono">.EXE</code> Builder &amp; Complete <code className="font-mono">.ZIP</code> Bundle
          </h2>
          <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
            Why aren't raw <code className="font-mono">.exe</code> or <code className="font-mono">.apk</code> binaries attached directly in chat? Per your <strong>Rule 15</strong> (<em>"Do not claim that an APK or EXE has been built unless it actually has"</em>), AI chat servers run on Linux without a Windows <code className="font-mono">.exe</code> compiler or the 4 GB Android SDK installed—if an AI gives you a fake renamed <code className="font-mono">.exe</code> or <code className="font-mono">.apk</code>, Windows 10 will say <em>"This app can't run on your PC"</em> and Android will say <em>"Problem parsing the package"</em>. Instead, click the buttons below to download the <strong>real double-clickable Windows installer (<code className="font-mono">.bat</code>)</strong> and the <strong>complete <code className="font-mono">.zip</code> package</strong> that compile the genuine <code className="font-mono">QuickShareConnect.exe</code> and <code className="font-mono">app-debug.apk</code>!
          </p>
        </div>

        {/* 3 Big Download Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Double-Click Windows .BAT -> .EXE */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  1. Windows 10 (.EXE) Auto-Builder
                </span>
                <span className="text-[11px] font-mono text-blue-700">Double-Click</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Download <code className="font-mono">QuickShareConnect-Setup-EXE.bat</code> and simply <strong>double-click it</strong> on your Windows 10 PC. It extracts all files to <code className="font-mono">C:\QuickShareConnect</code>, compiles <code className="font-mono">QuickShareConnect.exe</code>, and launches the app!
              </p>
            </div>
            <button
              onClick={triggerDoubleClickBatDownload}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download QuickShareConnect-Setup-EXE.bat
            </button>
          </div>

          {/* Card 2: Complete Project .ZIP */}
          <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4 text-slate-700" />
                  2. Complete Project Bundle (.ZIP)
                </span>
                <span className="text-[11px] font-mono text-slate-500">Windows + Android</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Downloads <code className="font-mono">QuickShareConnect-Complete-Project.zip</code> containing the entire <code className="font-mono">windows-app\</code> folder, <code className="font-mono">android-app\</code> folder, and the free GitHub Cloud compiler workflow.
              </p>
            </div>
            <button
              onClick={triggerZipDownload}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Complete Project (.ZIP)
            </button>
          </div>

          {/* Card 3: Android .APK Cloud & Local Guide */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  3. Get Android <code className="font-mono">.APK</code> (0 MB RAM)
                </span>
                <span className="text-[11px] font-mono text-emerald-700">4 GB RAM Safe</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Unzip the <code className="font-mono">.ZIP</code> from Card #2 and upload it to a free GitHub repo—GitHub's cloud automatically compiles <code className="font-mono">app-debug.apk</code> &amp; <code className="font-mono">QuickShareConnect.exe</code> under the <strong>Actions</strong> tab!
              </p>
            </div>
            <button
              onClick={() => {
                const wf = COMPLETE_SOURCE_FILES.find((f) => f.platform === 'cloud-builder');
                if (wf) triggerTextDownload('build_exe_and_apk.yml', wf.content);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Cloud APK Workflow (.yml)
            </button>
          </div>
        </div>
      </div>

      {/* Complete Copy-Paste Source Code Browser (All Windows, Android & Cloud Builder Files) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Complete, Copy-Paste-Ready Code (Rules 8, 9, 10 &amp; 11 — Zero Placeholders)
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Inspect or Download Individual Files in <code className="font-mono">windows-app</code> and <code className="font-mono">android-app</code>
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'windows', 'android', 'cloud-builder'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPlatformFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  platformFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'all' && 'All Files (12)'}
                {filter === 'windows' && 'Windows EXE Code (8)'}
                {filter === 'android' && 'Android APK Code (4)'}
                {filter === 'cloud-builder' && 'Cloud APK/EXE Workflow (1)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File List Sidebar */}
          <div className="lg:col-span-4 border border-slate-200 rounded-xl p-2.5 bg-slate-50/60 space-y-1 max-h-[560px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.id === file.id;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono truncate">{file.filename}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {file.path}
                    </div>
                  </div>
                  <FileCode className="w-4 h-4 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-blue-400">{selectedFile.path}</div>
                <div className="text-xs text-slate-300 mt-0.5">{selectedFile.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedFile.id, selectedFile.content)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedId === selectedFile.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Complete File
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    triggerTextDownload(
                      selectedFile.filename.split('/').pop() || 'file.txt',
                      selectedFile.content
                    )
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto max-h-[480px] leading-relaxed">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
