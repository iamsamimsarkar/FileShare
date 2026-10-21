import { COMPLETE_SOURCE_FILES } from '../data/completeSourceCode';

/**
 * Pure TypeScript standards-compliant PKZIP generator (Store method 0 with valid CRC32).
 * Produces a real .zip binary Blob that Windows 10 Explorer and Android can extract natively.
 */
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function buildProjectZipBlob(): Blob {
  const encoder = new TextEncoder();
  const files: { nameBytes: Uint8Array; dataBytes: Uint8Array; crc: number; offset: number }[] = [];

  // Add a clear README.txt at the root of the ZIP
  const readmeContent = [
    '====================================================================',
    'QUICKSHARE CONNECT — COMPLETE WINDOWS (.EXE) & ANDROID (.APK) BUNDLE',
    '====================================================================',
    '',
    'HOW TO GET THE WINDOWS .EXE FILE (Takes ~1 minute on Windows 10):',
    '1. Extract this ZIP folder anywhere on your PC (e.g., C:\\QuickShareConnect).',
    '2. Open the "windows-app" folder.',
    '3. Double-click "build_windows_exe.bat".',
    '4. It will automatically compile and open:',
    '   windows-app\\dist\\QuickShareConnect.exe',
    '',
    'HOW TO GET THE ANDROID .APK FILE (2 Options for 4 GB RAM PCs):',
    'Option A (Zero RAM Usage - Free GitHub Cloud Compiler):',
    '1. Upload this extracted folder to a free GitHub repository.',
    '2. Click the "Actions" tab on GitHub.',
    '3. Download the compiled "QuickShareConnect-Android-APK" (app-debug.apk)',
    '   and "QuickShareConnect-Windows-EXE" directly from GitHub Actions!',
    '',
    'Option B (Local Build on Windows 10):',
    '1. Open Command Prompt inside the "android-app" folder.',
    '2. Run: gradle assembleDebug',
    '3. Your APK will be created at:',
    '   android-app\\app\\build\\outputs\\apk\\debug\\app-debug.apk',
    ''
  ].join('\r\n');

  const rawEntries: { relPath: string; content: string }[] = [
    { relPath: 'README_HOW_TO_BUILD_EXE_AND_APK.txt', content: readmeContent }
  ];

  for (const f of COMPLETE_SOURCE_FILES) {
    let relPath = f.path.replace('C:\\QuickShareConnect\\', '').replace(/\\/g, '/');
    if (f.platform === 'cloud-builder') {
      relPath = '.github/workflows/build_exe_and_apk.yml';
    }
    rawEntries.push({ relPath, content: f.content.replace(/\r?\n/g, '\r\n') });
  }

  const localChunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const entry of rawEntries) {
    const nameBytes = encoder.encode(entry.relPath);
    const dataBytes = encoder.encode(entry.content);
    const fileCrc = crc32(dataBytes);

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method (0 = Store)
    view.setUint16(10, 0, true);         // Last mod file time
    view.setUint16(12, 0x5421, true);    // Last mod file date
    view.setUint32(14, fileCrc, true);   // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true);         // Extra field length
    header.set(nameBytes, 30);

    files.push({
      nameBytes,
      dataBytes,
      crc: fileCrc,
      offset: currentOffset
    });

    localChunks.push(header, dataBytes);
    currentOffset += header.length + dataBytes.length;
  }

  const centralChunks: Uint8Array[] = [];
  let centralSize = 0;

  for (const f of files) {
    const cdfh = new Uint8Array(46 + f.nameBytes.length);
    const view = new DataView(cdfh.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed
    view.setUint16(8, 0, true);          // Flags
    view.setUint16(10, 0, true);         // Compression method (0 = Store)
    view.setUint16(12, 0, true);         // Time
    view.setUint16(14, 0x5421, true);    // Date
    view.setUint32(16, f.crc, true);     // CRC-32
    view.setUint32(20, f.dataBytes.length, true); // Compressed size
    view.setUint32(24, f.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, f.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, f.offset, true);  // Relative offset of local header
    cdfh.set(f.nameBytes, 46);

    centralChunks.push(cdfh);
    centralSize += cdfh.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, files.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, files.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralSize, true);  // Size of central directory
  eocdView.setUint32(16, currentOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true);         // Comment length

  return new Blob([...localChunks, ...centralChunks, eocd], {
    type: 'application/zip'
  });
}

/**
 * Generates a double-clickable Windows .BAT file (QuickShareConnect-Setup-EXE.bat).
 * Unlike .ps1 files (which open in Notepad when double-clicked), a .bat file
 * executes immediately when double-clicked on Windows 10!
 */
export function buildDoubleClickableWindowsBat(): string {
  const psLines: string[] = [
    '$ErrorActionPreference = "Stop"',
    '$BaseDir = "C:\\QuickShareConnect"',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\windows-app\\core" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\windows-app\\ui" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\android-app\\app\\src\\main\\java\\com\\quickshare\\connect" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\.github\\workflows" | Out-Null'
  ];

  for (const file of COMPLETE_SOURCE_FILES) {
    let relPath = file.path.replace('C:\\QuickShareConnect\\', '');
    if (file.platform === 'cloud-builder') {
      relPath = '.github\\workflows\\build_exe_and_apk.yml';
    }
    const b64 = btoa(unescape(encodeURIComponent(file.content)));
    psLines.push(
      `$f = Join-Path $BaseDir "${relPath}"; $d = Split-Path $f -Parent; if (!(Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }; [System.IO.File]::WriteAllText($f, [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${b64}")))`
    );
  }

  const encodedPs = btoa(unescape(encodeURIComponent(psLines.join('\r\n'))));

  const batContent = [
    '@echo off',
    'title QuickShare Connect - Automatic Windows .EXE Installer & Builder',
    'color 0B',
    'echo ============================================================================',
    'echo   QUICKSHARE CONNECT - AUTOMATIC WINDOWS 10 .EXE BUILDER (4 GB RAM SAFE)',
    'echo ============================================================================',
    'echo.',
    'echo [Step 1/4] Checking if Python is installed on your Windows 10 PC...',
    'python --version >nul 2>&1',
    'if %errorlevel% neq 0 (',
    '    color 0C',
    '    echo [ERROR] Python is not installed or not added to PATH!',
    '    echo Please install Python 3.11 or 3.12 from https://www.python.org/downloads/',
    '    echo IMPORTANT: Check the box "Add python.exe to PATH" at the bottom of the installer!',
    '    pause',
    '    exit /b 1',
    ')',
    'echo [OK] Python detected!',
    'echo.',
    'echo [Step 2/4] Extracting all Windows and Android project files to C:\\QuickShareConnect ...',
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "$script = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedPs}')); Invoke-Expression $script"`,
    'if %errorlevel% neq 0 (',
    '    color 0C',
    '    echo [ERROR] Failed to extract project files.',
    '    pause',
    '    exit /b 1',
    ')',
    'echo [OK] All files extracted to C:\\QuickShareConnect!',
    'echo.',
    'echo [Step 3/4] Installing PySide6, FastAPI, QR Generator, and PyInstaller...',
    'cd /d C:\\QuickShareConnect\\windows-app',
    'if not exist "venv\\Scripts\\activate.bat" (',
    '    python -m venv venv',
    ')',
    'call venv\\Scripts\\activate.bat',
    'python -m pip install --upgrade pip',
    'pip install -r requirements.txt',
    'echo.',
    'echo [Step 4/4] Compiling standalone QuickShareConnect.exe ...',
    'pyinstaller --noconfirm --onefile --windowed --name "QuickShareConnect" main.py',
    'echo.',
    'if exist "C:\\QuickShareConnect\\windows-app\\dist\\QuickShareConnect.exe" (',
    '    color 0A',
    '    echo ============================================================================',
    '    echo   SUCCESS! YOUR EXE IS READY AT:',
    '    echo   C:\\QuickShareConnect\\windows-app\\dist\\QuickShareConnect.exe',
    '    echo ============================================================================',
    '    explorer.exe "C:\\QuickShareConnect\\windows-app\\dist"',
    '    start "" "C:\\QuickShareConnect\\windows-app\\dist\\QuickShareConnect.exe"',
    ') else (',
    '    echo [NOTE] Starting QuickShare Connect directly via Python...',
    '    python main.py',
    ')',
    'pause'
  ].join('\r\n');

  return batContent;
}
