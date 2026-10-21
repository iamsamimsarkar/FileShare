export interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  stage: number;
  summary: string;
  responsibilities?: string[];
  techNotes?: string;
  children?: FolderNode[];
}

export interface RoadmapStage {
  stage: number;
  title: string;
  subtitle: string;
  ramImpact: string;
  goal: string;
  deliverables: string[];
  verificationSteps: string[];
}

export const FOLDER_STRUCTURE_WINDOWS: FolderNode = {
  name: 'windows-app',
  path: 'QuickShareConnect/windows-app',
  type: 'folder',
  stage: 1,
  summary: 'Python 3.11+ & PySide6 desktop application and embedded local HTTP/WebSocket server.',
  children: [
    {
      name: 'requirements.txt',
      path: 'QuickShareConnect/windows-app/requirements.txt',
      type: 'file',
      stage: 1,
      summary: 'Pinned Python packages required for the Windows desktop app.',
      responsibilities: [
        'Lists PySide6 for the native Windows GUI',
        'Lists fastapi, uvicorn, and websockets for the local transfer & signaling server',
        'Lists qrcode[pil] and Pillow for generating pairing QR images',
        'Lists python-multipart and aiofiles for memory-safe chunked file uploads (critical for 4 GB RAM)'
      ],
      techNotes: 'Never loads a whole large video file into RAM; streams in 64 KB chunks.'
    },
    {
      name: 'main.py',
      path: 'QuickShareConnect/windows-app/main.py',
      type: 'file',
      stage: 1,
      summary: 'Application entry point that launches the PySide6 UI and background server thread.',
      responsibilities: [
        'Initializes QApplication and applies the clean light/slate theme',
        'Starts the local FastAPI/Uvicorn server on a background QThread',
        'Ensures clean shutdown of network sockets and ADB tunnels when the window closes'
      ]
    },
    {
      name: 'config.py',
      path: 'QuickShareConnect/windows-app/config.py',
      type: 'file',
      stage: 1,
      summary: 'User settings, default ports, token expiration timer, and safe download directory.',
      responsibilities: [
        'Stores default port (8765), QR token TTL (default 120 seconds), and chunk size (65536 bytes)',
        'Manages ~/Downloads/QuickShareConnect folder creation',
        'Persists settings to a lightweight local settings.json file'
      ]
    },
    {
      name: 'core',
      path: 'QuickShareConnect/windows-app/core',
      type: 'folder',
      stage: 1,
      summary: 'Core networking, security, QR generation, and USB ADB modules.',
      children: [
        {
          name: 'network_utils.py',
          path: 'QuickShareConnect/windows-app/core/network_utils.py',
          type: 'file',
          stage: 1,
          summary: 'Detects local LAN IPv4 and Windows Mobile Hotspot adapter IP addresses.',
          responsibilities: [
            'Finds active local IPv4 address (e.g., 192.168.1.45 or hotspot 192.168.137.1)',
            'Filters out loopback (127.0.0.1) and virtual adapters when in Wi-Fi mode',
            'Supports binding to 127.0.0.1 exclusively when in USB ADB tunnel mode'
          ]
        },
        {
          name: 'security.py',
          path: 'QuickShareConnect/windows-app/core/security.py',
          type: 'file',
          stage: 1,
          summary: 'Token generation, session authentication, path traversal prevention, and safe file naming.',
          responsibilities: [
            'Generates 256-bit cryptographic pairing tokens using secrets.token_urlsafe(32)',
            'Enforces QR token expiration timestamps',
            'Issues session bearer tokens after successful QR handshake',
            'Sanitizes filenames with os.path.basename() and resolves non-overwriting names like photo (1).jpg'
          ]
        },
        {
          name: 'qr_service.py',
          path: 'QuickShareConnect/windows-app/core/qr_service.py',
          type: 'file',
          stage: 1,
          summary: 'Encodes connection JSON payload into a PySide6-compatible QPixmap QR image.',
          responsibilities: [
            'Serializes { ip, port, pairToken, expiresAt, deviceName, version } into compact JSON',
            'Renders high-contrast QR code image in memory without writing temporary files'
          ]
        },
        {
          name: 'server.py',
          path: 'QuickShareConnect/windows-app/core/server.py',
          type: 'file',
          stage: 2,
          summary: 'Local FastAPI HTTP + WebSocket server running in a background thread.',
          responsibilities: [
            'Exposes POST /api/v1/pair for QR token exchange',
            'Exposes WebSocket /ws/control for real-time status, text sharing, and camera signaling',
            'Exposes POST /api/v1/files/upload and GET /api/v1/files/download/{file_id} for chunked transfers',
            'Emits Qt Signals to update the Windows GUI thread safely'
          ]
        },
        {
          name: 'transfer_manager.py',
          path: 'QuickShareConnect/windows-app/core/transfer_manager.py',
          type: 'file',
          stage: 3,
          summary: 'Tracks active uploads/downloads, calculates speed (MB/s), and handles cancellation.',
          responsibilities: [
            'Streams files in 64 KB chunks so a 2 GB movie uses less than 5 MB of RAM',
            'Calculates live transfer percentage, speed, and ETA',
            'Supports immediate cancellation token to abort mid-transfer cleanly and delete partial temp files'
          ]
        },
        {
          name: 'camera_receiver.py',
          path: 'QuickShareConnect/windows-app/core/camera_receiver.py',
          type: 'file',
          stage: 5,
          summary: 'Receives lightweight JPEG preview frames and full-resolution captured photos from Android.',
          responsibilities: [
            'Requests camera permission from Android over WebSocket',
            'Decodes incoming preview frames into QPixmap for the live viewfinder',
            'Sends CAPTURE_PHOTO command and handles Retake / Save actions on Windows'
          ]
        },
        {
          name: 'adb_bridge.py',
          path: 'QuickShareConnect/windows-app/core/adb_bridge.py',
          type: 'file',
          stage: 6,
          summary: 'Modular USB mode wrapper around Google platform-tools (adb.exe).',
          responsibilities: [
            'Runs "adb devices" to detect connected Android phones and check authorization status',
            'Executes "adb forward tcp:8765 tcp:8765" to tunnel all HTTP/WebSocket traffic over USB cable',
            'Allows the exact same transfer, text, and camera code to run over USB with zero internet/Wi-Fi'
          ]
        }
      ]
    },
    {
      name: 'ui',
      path: 'QuickShareConnect/windows-app/ui',
      type: 'folder',
      stage: 1,
      summary: 'PySide6 user interface views matching the 9 required navigation screens.',
      children: [
        {
          name: 'main_window.py',
          path: 'QuickShareConnect/windows-app/ui/main_window.py',
          type: 'file',
          stage: 1,
          summary: 'Main sidebar navigation window and top connection status bar.'
        },
        {
          name: 'views.py',
          path: 'QuickShareConnect/windows-app/ui/views.py',
          type: 'file',
          stage: 2,
          summary: 'Contains the 9 clean views: Dashboard, Connect/QR, Send, Receive, Text, Camera, USB, History, Settings.'
        }
      ]
    }
  ]
};

export const FOLDER_STRUCTURE_ANDROID: FolderNode = {
  name: 'android-app',
  path: 'QuickShareConnect/android-app',
  type: 'folder',
  stage: 2,
  summary: 'Native Kotlin + Jetpack Compose + CameraX Android application.',
  children: [
    {
      name: 'build.gradle.kts',
      path: 'QuickShareConnect/android-app/app/build.gradle.kts',
      type: 'file',
      stage: 2,
      summary: 'Module-level Gradle configuration with CameraX, ML Kit Barcode, OkHttp, and Compose dependencies.',
      techNotes: 'Configured with org.gradle.jvmargs=-Xmx1024m in gradle.properties so it builds smoothly on 4 GB RAM.'
    },
    {
      name: 'AndroidManifest.xml',
      path: 'QuickShareConnect/android-app/app/src/main/AndroidManifest.xml',
      type: 'file',
      stage: 2,
      summary: 'Declares permissions (INTERNET,ACCESS_WIFI_STATE, CAMERA) and local network cleartext traffic config.'
    },
    {
      name: 'MainActivity.kt',
      path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/MainActivity.kt',
      type: 'file',
      stage: 2,
      summary: 'Single-activity Jetpack Compose host and bottom/drawer navigation controller.'
    },
    {
      name: 'network',
      path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/network',
      type: 'folder',
      stage: 2,
      summary: 'OkHttp client, WebSocket manager, and chunked file uploader/downloader.',
      children: [
        {
          name: 'QuickShareClient.kt',
          path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/network/QuickShareClient.kt',
          type: 'file',
          stage: 2,
          summary: 'Handles QR pairing POST request, stores session token, and maintains the WebSocket connection.'
        },
        {
          name: 'FileTransferWorker.kt',
          path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/network/FileTransferWorker.kt',
          type: 'file',
          stage: 3,
          summary: 'Streams files from Android ContentResolver URI to Windows in 64 KB chunks with progress callbacks.'
        }
      ]
    },
    {
      name: 'camera',
      path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/camera',
      type: 'folder',
      stage: 2,
      summary: 'CameraX QR scanner and Remote Camera preview/capture controller.',
      children: [
        {
          name: 'QrScannerAnalyzer.kt',
          path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/camera/QrScannerAnalyzer.kt',
          type: 'file',
          stage: 2,
          summary: 'Uses CameraX ImageAnalysis + ML Kit Barcode Scanning to read the Windows QR code.'
        },
        {
          name: 'RemoteCameraManager.kt',
          path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/camera/RemoteCameraManager.kt',
          type: 'file',
          stage: 5,
          summary: 'Streams lightweight JPEG preview frames (10-12 FPS) to Windows and takes high-res photos via ImageCapture.'
        }
      ]
    },
    {
      name: 'ui',
      path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/ui',
      type: 'folder',
      stage: 2,
      summary: 'Jetpack Compose screens for all 9 Android views.',
      children: [
        {
          name: 'AppNavigation.kt',
          path: 'QuickShareConnect/android-app/app/src/main/java/com/quickshare/connect/ui/AppNavigation.kt',
          type: 'file',
          stage: 2,
          summary: 'Navigation host connecting Dashboard, Scan PC QR, Send, Receive, Text, Camera, USB, History, Settings.'
        }
      ]
    }
  ]
};

export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    stage: 1,
    title: 'Stage 1: Windows Skeleton, Local Server & Expiring QR Generator',
    subtitle: 'Build and test on Windows first using only Python (~65 MB RAM)',
    ramImpact: 'Very Low (~65 MB RAM)',
    goal: 'Create the Windows project folder, set up a Python virtual environment, launch a PySide6 window displaying a real expiring QR code, and verify the embedded FastAPI server in your browser.',
    deliverables: [
      'Folder structure created at C:\\QuickShareConnect\\windows-app',
      'PySide6 Main Window with sidebar navigation and status header',
      'Local IP detector (LAN Wi-Fi + Windows Mobile Hotspot support)',
      'Cryptographic QR code generator with 120-second countdown timer'
    ],
    verificationSteps: [
      'Run python main.py in Command Prompt',
      'Open http://localhost:8765/api/v1/health in your PC browser or phone browser on the same Wi-Fi',
      'Watch the QR code automatically regenerate when the countdown reaches 0'
    ]
  },
  {
    stage: 2,
    title: 'Stage 2: Android App Skeleton, QR Scanner & Authenticated Pairing',
    subtitle: 'Connect your real Android phone to the Windows app over Wi-Fi',
    ramImpact: 'Low-Medium (Command-line Gradle capped at 1 GB RAM; NO Android Emulator)',
    goal: 'Build the minimal Android Kotlin + Compose app, scan the Windows QR code using CameraX, validate the temporary token, and establish a live WebSocket connection.',
    deliverables: [
      'Android project in C:\\QuickShareConnect\\android-app configured for low-RAM builds',
      'CameraX + ML Kit QR Code Scanner screen on Android',
      'Token exchange endpoint (POST /api/v1/pair) + WebSocket session handshake',
      'Synchronized "Connected to [Device]" banner on both Windows and Android'
    ],
    verificationSteps: [
      'Scan the Windows screen QR code with the Android app',
      'Confirm both devices turn green ("Connected") within 1 second',
      'Test scanning an expired QR code and verify it is safely rejected'
    ]
  },
  {
    stage: 3,
    title: 'Stage 3: Bidirectional Text Share & Safe File Transfer over Wi-Fi',
    subtitle: 'Send texts, photos, videos, and documents both ways with progress & cancel',
    ramImpact: 'Low (64 KB chunked streaming keeps memory flat for any file size)',
    goal: 'Implement instant text sharing and chunked HTTP file transfers (Windows <-> Android) with progress bars, speed calculation, cancellation, and overwrite protection.',
    deliverables: [
      'Text Share screen on both devices with Copy, Paste, and Clear buttons',
      'Send & Receive Files screens with live progress, speed (MB/s), and Cancel button',
      'Safe filename sanitizer (blocks "../" path traversal) and auto-renaming (e.g. "report (1).pdf")',
      'Optional Ask-Before-Accept prompt on the receiving device'
    ],
    verificationSteps: [
      'Send a text snippet from PC to Phone and Phone to PC',
      'Transfer a 100 MB video file and test the Cancel button mid-transfer',
      'Send the same file twice and confirm the first file is never silently overwritten'
    ]
  },
  {
    stage: 4,
    title: 'Stage 4: Transfer History, Settings & Offline Hotspot Workflow',
    subtitle: 'Persistent history logs, custom download folder, and router-free hotspot guide',
    ramImpact: 'Negligible (< 5 MB)',
    goal: 'Add Transfer History logging, customizable Settings (download folder, token expiry, overwrite prompt), and verify offline transfers using Windows Mobile Hotspot or Phone Hotspot.',
    deliverables: [
      'Transfer History table on Windows and Android with Open Folder action',
      'Settings screen to configure Download Directory, Token Expiry (60s-300s), and Approval mode',
      'Network adapter selector in Windows Connect view so users can pick their Hotspot IP with one click'
    ],
    verificationSteps: [
      'Disconnect from home router, turn on Windows Mobile Hotspot, connect phone, and transfer a file completely offline'
    ]
  },
  {
    stage: 5,
    title: 'Stage 5: Remote Camera Preview & Photo Capture Workflow',
    subtitle: 'Live Android camera viewfinder on Windows with Capture, Retake & Save',
    ramImpact: 'Low (Uses lightweight WebSocket JPEG frame streaming instead of heavy WebRTC)',
    goal: 'Allow Windows to request camera access, require explicit user approval on Android, show a live preview on Windows, and capture + transfer full-resolution photos.',
    deliverables: [
      'Permission request handshake + visible "Camera Active" banner and Stop button on Android',
      'Live viewfinder on Windows (10-12 FPS JPEG frames over WebSocket)',
      'Capture, Retake, and Save buttons on Windows triggering CameraX ImageCapture on Android'
    ],
    verificationSteps: [
      'Click "Request Camera" on Windows, approve on Android, see live preview on PC',
      'Click "Capture", review high-res photo on Windows, test "Retake" and "Save to PC"',
      'Click "Stop Camera" on either device and verify camera turns off immediately'
    ]
  },
  {
    stage: 6,
    title: 'Stage 6: Modular USB Mode via ADB Port Forwarding',
    subtitle: 'Cable-based bidirectional transfer without Wi-Fi using Android Platform Tools',
    ramImpact: 'Very Low (~15 MB for adb.exe daemon)',
    goal: 'Add a dedicated USB Mode that uses "adb forward tcp:8765 tcp:8765" to tunnel our exact same HTTP + WebSocket server over a standard USB cable.',
    deliverables: [
      'core/adb_bridge.py module that detects USB devices, checks USB Debugging authorization, and opens the TCP tunnel',
      'Step-by-step interactive guide in both apps explaining how to enable Developer Options & USB Debugging',
      'One-click "Connect via USB" button that pairs over localhost:8765'
    ],
    verificationSteps: [
      'Turn off Wi-Fi on phone, plug in USB cable, authorize USB debugging popup on phone',
      'Click "Activate USB Tunnel" on Windows and transfer files at fast USB 2.0/3.0 speeds'
    ]
  }
];
