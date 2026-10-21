import React, { useState } from 'react';
import { DualDeviceSimulator } from './components/DualDeviceSimulator';
import { ArchitectureBlueprintView } from './components/ArchitectureBlueprintView';
import { ExeApkBuilderHub } from './components/ExeApkBuilderHub';

type MainWorkspaceView = 'binaries' | 'simulator' | 'architecture';

export default function App() {
  const [workspaceView, setWorkspaceView] = useState<MainWorkspaceView>('binaries');
  const [archSubTab, setArchSubTab] = useState<'overview' | 'folders' | 'protocols' | 'step1'>('overview');

  const navigateToArchitecture = (tab: 'overview' | 'folders' | 'protocols' | 'step1') => {
    setArchSubTab(tab);
    setWorkspaceView('architecture');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setWorkspaceView('binaries');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          QuickShare Connect
        </a>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setWorkspaceView('binaries')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceView === 'binaries' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
            }`}
          >
            EXE &amp; APK Builder
          </button>
          <button
            onClick={() => setWorkspaceView('simulator')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceView === 'simulator' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Dual Simulator
          </button>
          <button
            onClick={() => navigateToArchitecture('overview')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceView === 'architecture' && archSubTab === 'overview'
                ? 'text-blue-600 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Architecture &amp; Roadmap
          </button>
          <button
            onClick={() => navigateToArchitecture('folders')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceView === 'architecture' && archSubTab === 'folders'
                ? 'text-blue-600 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Folder Structure
          </button>
          <button
            onClick={() => navigateToArchitecture('protocols')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceView === 'architecture' && archSubTab === 'protocols'
                ? 'text-blue-600 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Protocols &amp; Security
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setWorkspaceView('binaries')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Get EXE &amp; APK Builder
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Workspace Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Windows 10 (Python + PySide6 + PyInstaller EXE) · Android (Kotlin + Jetpack Compose APK) · Optimized for 4 GB RAM
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              QuickShare Connect — EXE &amp; APK Code Generator &amp; Interactive Studio
            </h1>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg shrink-0">
            <button
              onClick={() => setWorkspaceView('binaries')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                workspaceView === 'binaries'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Click EXE &amp; APK Builder
            </button>
            <button
              onClick={() => setWorkspaceView('simulator')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                workspaceView === 'simulator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual-Device Simulator
            </button>
            <button
              onClick={() => setWorkspaceView('architecture')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                workspaceView === 'architecture'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Architecture (A–H)
            </button>
          </div>
        </div>

        {workspaceView === 'binaries' && <ExeApkBuilderHub />}
        {workspaceView === 'simulator' && <DualDeviceSimulator />}
        {workspaceView === 'architecture' && (
          <ArchitectureBlueprintView activeSubTab={archSubTab} setActiveSubTab={setArchSubTab} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>QuickShare Connect Architecture &amp; Verification Workbench · Local-First Cross-Device File Sharing</div>
        <div>Designed for Windows 10 (4 GB RAM) &amp; Native Android</div>
      </footer>
    </div>
  );
}
