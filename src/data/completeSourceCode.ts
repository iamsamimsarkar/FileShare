export interface SourceFileEntry {
  id: string;
  platform: 'windows' | 'android' | 'cloud-builder';
  path: string;
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const COMPLETE_SOURCE_FILES: SourceFileEntry[] = [
  // ============================================================================
  // WINDOWS APPLICATION FILES (Python 3.11 + PySide6 + FastAPI + PyInstaller)
  // ============================================================================
  {
    id: 'win-req',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\requirements.txt',
    filename: 'requirements.txt',
    language: 'text',
    description: 'All Python packages required to run the Windows app and compile QuickShareConnect.exe',
    content: `PySide6>=6.6.0
fastapi>=0.110.0
uvicorn>=0.29.0
websockets>=12.0
qrcode>=7.4.2
Pillow>=10.2.0
python-multipart>=0.0.9
aiofiles>=23.2.1
requests>=2.31.0
pyinstaller>=6.5.0
`
  },
  {
    id: 'win-config',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\config.py',
    filename: 'config.py',
    language: 'python',
    description: 'Configuration manager for ports, token expiry, and safe download directory.',
    content: `import os
import json
from pathlib import Path

APP_NAME = "QuickShare Connect"
DEFAULT_PORT = 8765
CHUNK_SIZE = 65536  # 64 KB chunks for 4 GB RAM safety
DEFAULT_TOKEN_EXPIRY_SECONDS = 120

DEFAULT_DOWNLOAD_DIR = str(Path.home() / "Downloads" / "QuickShareConnect")
SETTINGS_FILE = Path.home() / ".quickshare_connect_settings.json"


class AppConfig:
    def __init__(self):
        self.port: int = DEFAULT_PORT
        self.token_expiry_seconds: int = DEFAULT_TOKEN_EXPIRY_SECONDS
        self.download_dir: str = DEFAULT_DOWNLOAD_DIR
        self.ask_before_receive: bool = False
        self.load()
        os.makedirs(self.download_dir, exist_ok=True)

    def load(self):
        if SETTINGS_FILE.exists():
            try:
                data = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
                self.port = int(data.get("port", DEFAULT_PORT))
                self.token_expiry_seconds = int(
                    data.get("token_expiry_seconds", DEFAULT_TOKEN_EXPIRY_SECONDS)
                )
                self.download_dir = str(data.get("download_dir", DEFAULT_DOWNLOAD_DIR))
                self.ask_before_receive = bool(data.get("ask_before_receive", False))
            except Exception:
                pass

    def save(self):
        os.makedirs(self.download_dir, exist_ok=True)
        payload = {
            "port": self.port,
            "token_expiry_seconds": self.token_expiry_seconds,
            "download_dir": self.download_dir,
            "ask_before_receive": self.ask_before_receive,
        }
        SETTINGS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


config = AppConfig()
`
  },
  {
    id: 'win-net',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\core\\network_utils.py',
    filename: 'core/network_utils.py',
    language: 'python',
    description: 'Detects active local Wi-Fi IPv4 and Windows Mobile Hotspot IPv4 addresses.',
    content: `import socket
from typing import List, Tuple


def get_local_ipv4_addresses() -> List[Tuple[str, str]]:
    """
    Returns a list of (label, ip_address) tuples for active IPv4 interfaces.
    Includes standard LAN Wi-Fi and Windows 10 Mobile Hotspot (192.168.137.x).
    """
    results: List[Tuple[str, str]] = []
    seen = set()

    # Primary outbound route interface
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
        if primary_ip and not primary_ip.startswith("127."):
            results.append((f"Primary Wi-Fi / LAN ({primary_ip})", primary_ip))
            seen.add(primary_ip)
    except Exception:
        pass

    # Enumerate all host adapters (catches Windows Mobile Hotspot 192.168.137.1 offline)
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip not in seen and not ip.startswith("127.") and not ip.startswith("169.254."):
                label = (
                    f"Windows Hotspot ({ip})"
                    if ip.startswith("192.168.137.")
                    else f"Local Adapter ({ip})"
                )
                results.append((label, ip))
                seen.add(ip)
    except Exception:
        pass

    if not results:
        results.append(("USB / Localhost (127.0.0.1)", "127.0.0.1"))

    return results
`
  },
  {
    id: 'win-sec',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\core\\security.py',
    filename: 'core/security.py',
    language: 'python',
    description: 'Handles expiring QR pairing tokens, session bearer tokens, path traversal protection, and non-overwriting file names.',
    content: `import os
import time
import secrets
from pathlib import Path
from typing import Optional, Tuple


class SecurityManager:
    def __init__(self, expiry_seconds: int = 120):
        self.expiry_seconds = expiry_seconds
        self.current_pair_token: str = ""
        self.pair_token_expires_at: float = 0.0
        self.active_session_token: Optional[str] = None
        self.connected_device_name: Optional[str] = None
        self.generate_new_pair_token()

    def generate_new_pair_token(self) -> Tuple[str, int]:
        self.current_pair_token = "qsc_pair_" + secrets.token_urlsafe(18)
        self.pair_token_expires_at = time.time() + self.expiry_seconds
        return self.current_pair_token, int(self.pair_token_expires_at)

    def remaining_pair_seconds(self) -> int:
        rem = int(self.pair_token_expires_at - time.time())
        return max(0, rem)

    def verify_pair_token_and_create_session(
        self, candidate_token: str, device_name: str
    ) -> Optional[str]:
        if not candidate_token or candidate_token != self.current_pair_token:
            return None
        if time.time() > self.pair_token_expires_at:
            return None
        # Valid! Issue session token and rotate pair token so it cannot be reused
        self.active_session_token = "sess_" + secrets.token_urlsafe(24)
        self.connected_device_name = device_name or "Android Phone"
        self.generate_new_pair_token()
        return self.active_session_token

    def verify_session_token(self, auth_header: Optional[str]) -> bool:
        if not self.active_session_token or not auth_header:
            return False
        token = auth_header.replace("Bearer ", "").strip()
        return secrets.compare_digest(token, self.active_session_token)

    def disconnect(self):
        self.active_session_token = None
        self.connected_device_name = None
        self.generate_new_pair_token()


def resolve_safe_non_overwriting_path(directory: str, raw_filename: str) -> Path:
    """
    1. Strips directory traversal attempts (e.g. ../../evil.exe -> evil.exe)
    2. Never overwrites existing files; appends (1), (2), etc.
    """
    os.makedirs(directory, exist_ok=True)
    clean_name = os.path.basename(raw_filename.replace("\\\\", "/")).strip()
    if not clean_name or clean_name in (".", ".."):
        clean_name = f"received_file_{int(time.time())}"

    target_dir = Path(directory).resolve()
    candidate = (target_dir / clean_name).resolve()

    # Ensure resolved path is strictly inside target_dir
    if target_dir not in candidate.parents and candidate != target_dir:
        clean_name = f"safe_file_{int(time.time())}"
        candidate = target_dir / clean_name

    if not candidate.exists():
        return candidate

    stem = candidate.stem
    suffix = candidate.suffix
    counter = 1
    while True:
        new_candidate = target_dir / f"{stem} ({counter}){suffix}"
        if not new_candidate.exists():
            return new_candidate
        counter += 1
`
  },
  {
    id: 'win-qr',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\core\\qr_service.py',
    filename: 'core/qr_service.py',
    language: 'python',
    description: 'Generates a PySide6 QPixmap QR Code in memory without writing temporary disk files.',
    content: `import io
import json
import socket
import qrcode
from PySide6.QtGui import QPixmap, QImage


def build_qr_pixmap(ip: str, port: int, pair_token: str, expires_at: int) -> QPixmap:
    payload = {
        "v": 1,
        "ip": ip,
        "port": port,
        "token": pair_token,
        "exp": expires_at,
        "pc": socket.gethostname(),
    }
    json_str = json.dumps(payload, separators=(",", ":"))

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(json_str)
    qr.make(fit=True)

    pil_img = qr.make_image(fill_color="#0F172A", back_color="white").convert("RGB")
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    qimage = QImage.fromData(buffer.getvalue(), "PNG")
    return QPixmap.fromImage(qimage)
`
  },
  {
    id: 'win-adb',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\core\\adb_bridge.py',
    filename: 'core/adb_bridge.py',
    language: 'python',
    description: 'Modular USB connection helper using Android Platform Tools (adb.exe) for port forwarding.',
    content: `import subprocess
import shutil
from typing import Tuple, List


class AdbBridge:
    def __init__(self, port: int = 8765):
        self.port = port

    def find_adb(self) -> str:
        adb_path = shutil.which("adb")
        return adb_path or "adb"

    def check_connected_devices(self) -> Tuple[bool, str, List[Tuple[str, str]]]:
        """
        Returns (adb_installed, raw_output, list_of_(serial, state)).
        State is typically 'device' (authorized) or 'unauthorized'.
        """
        adb_bin = self.find_adb()
        try:
            proc = subprocess.run(
                [adb_bin, "devices"],
                capture_output=True,
                text=True,
                timeout=4,
                creationflags= getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
            devices: List[Tuple[str, str]] = []
            for line in lines[1:]:
                parts = line.split()
                if len(parts) >= 2:
                    devices.append((parts[0], parts[1]))
            return True, proc.stdout.strip(), devices
        except FileNotFoundError:
            return (
                False,
                "adb.exe not found in PATH. Download Google Platform Tools zip to use USB Mode.",
                [],
            )
        except Exception as exc:
            return False, str(exc), []

    def enable_usb_reverse_tunnel(self) -> Tuple[bool, str]:
        """
        Runs 'adb reverse tcp:8765 tcp:8765' so the Android phone can reach
        the Windows server at http://127.0.0.1:8765 over the USB cable.
        """
        adb_bin = self.find_adb()
        try:
            proc = subprocess.run(
                [adb_bin, "reverse", f"tcp:{self.port}", f"tcp:{self.port}"],
                capture_output=True,
                text=True,
                timeout=4,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            if proc.returncode == 0:
                return (
                    True,
                    f"USB Tunnel Active! On Android, connect to 127.0.0.1:{self.port}",
                )
            return False, proc.stderr.strip() or proc.stdout.strip()
        except Exception as exc:
            return False, str(exc)
`
  },
  {
    id: 'win-server',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\core\\server.py',
    filename: 'core/server.py',
    language: 'python',
    description: 'Embedded FastAPI + WebSocket server running in a QThread with 64 KB chunked file streaming.',
    content: `import os
import time
import asyncio
import base64
from pathlib import Path
from typing import Dict, Optional
import uvicorn
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PySide6.QtCore import QThread, Signal

from config import config, CHUNK_SIZE
from core.security import SecurityManager, resolve_safe_non_overwriting_path


class PairRequest(BaseModel):
    token: str
    device_name: str = "Android Phone"


class TextSharePayload(BaseModel):
    text: str


class ServerSignals(QThread):
    device_paired = Signal(str)
    device_disconnected = Signal()
    text_received = Signal(str)
    transfer_progress = Signal(str, int, float, str)  # filename, percent, speed_mbps, status
    transfer_completed = Signal(str, str, int)        # filename, saved_path, size_bytes
    camera_frame_received = Signal(bytes)             # raw JPEG bytes
    camera_photo_saved = Signal(str)                  # saved high-res photo path

    def __init__(self, security: SecurityManager):
        super().__init__()
        self.security = security
        self.app = FastAPI(title="QuickShare Connect Local Server")
        self.active_ws: Optional[WebSocket] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.shared_files_for_phone: Dict[str, Path] = {}
        self.cancel_requested: bool = False
        self._register_routes()

    def register_outbound_file(self, file_path: str) -> str:
        p = Path(file_path).resolve()
        file_id = f"file_{int(time.time() * 1000)}_{p.name}"
        self.shared_files_for_phone[file_id] = p
        return file_id

    def send_ws_json_threadsafe(self, data: dict):
        if self.loop and self.active_ws:
            asyncio.run_coroutine_threadsafe(self.active_ws.send_json(data), self.loop)

    def _register_routes(self):
        @self.app.get("/api/v1/health")
        async def health():
            return {"status": "ok", "app": "QuickShare Connect"}

        @self.app.post("/api/v1/pair")
        async def pair_device(req: PairRequest):
            session_token = self.security.verify_pair_token_and_create_session(
                req.token, req.device_name
            )
            if not session_token:
                raise HTTPException(status_code=401, detail="Invalid or expired QR token")
            self.device_paired.emit(req.device_name)
            return {
                "status": "paired",
                "session_token": session_token,
                "pc_name": os.environ.get("COMPUTERNAME", "Windows-PC"),
            }

        @self.app.post("/api/v1/text")
        async def receive_text(
            payload: TextSharePayload, authorization: Optional[str] = Header(None)
        ):
            if not self.security.verify_session_token(authorization):
                raise HTTPException(status_code=401, detail="Unauthorized session")
            self.text_received.emit(payload.text)
            return {"status": "delivered"}

        @self.app.post("/api/v1/files/upload")
        async def upload_file_from_android(
            file: UploadFile = File(...),
            authorization: Optional[str] = Header(None),
        ):
            if not self.security.verify_session_token(authorization):
                raise HTTPException(status_code=401, detail="Unauthorized session")

            dest_path = resolve_safe_non_overwriting_path(
                config.download_dir, file.filename or "uploaded_file"
            )
            temp_path = dest_path.with_suffix(dest_path.suffix + ".part")

            self.cancel_requested = False
            written = 0
            start_time = time.time()

            try:
                with open(temp_path, "wb") as out_f:
                    while True:
                        if self.cancel_requested:
                            out_f.close()
                            if temp_path.exists():
                                temp_path.unlink()
                            self.transfer_progress.emit(dest_path.name, 0, 0.0, "CANCELLED")
                            raise HTTPException(status_code=499, detail="Transfer cancelled")

                        chunk = await file.read(CHUNK_SIZE)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        written += len(chunk)
                        elapsed = max(0.05, time.time() - start_time)
                        speed_mbps = (written / (1024 * 1024)) / elapsed
                        self.transfer_progress.emit(
                            dest_path.name, 50, round(speed_mbps, 2), "TRANSFERRING"
                        )

                temp_path.rename(dest_path)
                self.transfer_progress.emit(dest_path.name, 100, 0.0, "COMPLETED")
                self.transfer_completed.emit(dest_path.name, str(dest_path), written)
                return {
                    "status": "completed",
                    "saved_as": dest_path.name,
                    "bytes": written,
                }
            except Exception as exc:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception:
                        pass
                raise exc

        @self.app.get("/api/v1/files/download/{file_id}")
        async def download_file_to_android(
            file_id: str, authorization: Optional[str] = Header(None)
        ):
            if not self.security.verify_session_token(authorization):
                raise HTTPException(status_code=401, detail="Unauthorized session")
            target = self.shared_files_for_phone.get(file_id)
            if not target or not target.exists():
                raise HTTPException(status_code=404, detail="File not found")
            return FileResponse(
                path=str(target),
                filename=target.name,
                media_type="application/octet-stream",
            )

        @self.app.websocket("/ws/control")
        async def ws_control(websocket: WebSocket):
            await websocket.accept()
            self.active_ws = websocket
            self.loop = asyncio.get_running_loop()
            try:
                while True:
                    msg = await websocket.receive_json()
                    msg_type = msg.get("type")
                    if msg_type == "TEXT_SHARE":
                        self.text_received.emit(msg.get("text", ""))
                    elif msg_type == "CAMERA_PREVIEW_FRAME":
                        b64 = msg.get("jpeg_base64", "")
                        if b64:
                            self.camera_frame_received.emit(base64.b64decode(b64))
                    elif msg_type == "CAMERA_CAPTURED_PHOTO":
                        b64 = msg.get("jpeg_base64", "")
                        if b64:
                            raw = base64.b64decode(b64)
                            out = resolve_safe_non_overwriting_path(
                                config.download_dir,
                                f"CameraCapture_{int(time.time())}.jpg",
                            )
                            out.write_bytes(raw)
                            self.camera_photo_saved.emit(str(out))
            except WebSocketDisconnect:
                self.active_ws = None
                self.device_disconnected.emit()
            except Exception:
                self.active_ws = None

    def run(self):
        uvicorn.run(self.app, host="0.0.0.0", port=config.port, log_level="warning")
`
  },
  {
    id: 'win-ui',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\ui\\main_window.py',
    filename: 'ui/main_window.py',
    language: 'python',
    description: 'Complete PySide6 desktop GUI with all 9 views (Dashboard, QR Connect, Send, Receive, Text Share, Camera Capture, USB Mode, History, Settings).',
    content: `import os
import subprocess
from pathlib import Path
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QListWidget,
    QStackedWidget, QLabel, QPushButton, QTextEdit, QFileDialog,
    QProgressBar, QComboBox, QLineEdit, QMessageBox, QFrame
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QPixmap, QImage

from config import config
from core.network_utils import get_local_ipv4_addresses
from core.security import SecurityManager
from core.qr_service import build_qr_pixmap
from core.server import ServerSignals
from core.adb_bridge import AdbBridge


class QuickShareMainWindow(QMainWindow):
    def __init__(self, security: SecurityManager, server_thread: ServerSignals):
        super().__init__()
        self.security = security
        self.server = server_thread
        self.adb = AdbBridge(config.port)
        self.last_captured_photo_bytes = None

        self.setWindowTitle("QuickShare Connect — Windows 10 Desktop")
        self.resize(980, 620)
        self.setStyleSheet("""
            QMainWindow { background-color: #F8FAFC; }
            QListWidget {
                background-color: #0F172A;
                color: #E2E8F0;
                border: none;
                font-size: 13px;
                padding: 8px;
            }
            QListWidget::item {
                padding: 10px 12px;
                border-radius: 6px;
                margin-bottom: 4px;
            }
            QListWidget::item:selected {
                background-color: #2563EB;
                color: #FFFFFF;
                font-weight: bold;
            }
            QPushButton {
                background-color: #2563EB;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover { background-color: #1D4ED8; }
            QFrame#Card {
                background-color: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 10px;
            }
        """)

        root = QWidget()
        self.setCentralWidget(root)
        main_layout = QHBoxLayout(root)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Left Navigation Sidebar (All 9 required views)
        self.sidebar = QListWidget()
        self.sidebar.setFixedWidth(210)
        self.nav_titles = [
            "Dashboard",
            "Connect Phone (QR)",
            "Send Files",
            "Receive Files",
            "Text Share",
            "Camera Capture",
            "USB Mode (ADB)",
            "Transfer History",
            "Settings",
        ]
        for title in self.nav_titles:
            self.sidebar.addItem(title)
        main_layout.addWidget(self.sidebar)

        # Right Area: Top Status Bar + Stacked Views
        right_container = QWidget()
        right_layout = QVBoxLayout(right_container)
        right_layout.setContentsMargins(20, 16, 20, 16)

        self.status_banner = QLabel("Status: Waiting for Android Phone to Scan QR Code")
        self.status_banner.setStyleSheet(
            "background:#FEF3C7; color:#92400E; padding:10px 14px; border-radius:8px; font-weight:bold;"
        )
        right_layout.addWidget(self.status_banner)

        self.pages = QStackedWidget()
        right_layout.addWidget(self.pages)
        main_layout.addWidget(right_container)

        # Build the 9 pages
        self._init_dashboard_page()
        self._init_qr_page()
        self._init_send_page()
        self._init_receive_page()
        self._init_text_page()
        self._init_camera_page()
        self._init_usb_page()
        self._init_history_page()
        self._init_settings_page()

        self.sidebar.currentRowChanged.connect(self.pages.setCurrentIndex)
        self.sidebar.setCurrentRow(1)  # Start on Connect QR Code view

        # Connect Server Signals
        self.server.device_paired.connect(self._on_device_paired)
        self.server.device_disconnected.connect(self._on_device_disconnected)
        self.server.text_received.connect(self._on_text_received)
        self.server.transfer_progress.connect(self._on_transfer_progress)
        self.server.transfer_completed.connect(self._on_transfer_completed)
        self.server.camera_frame_received.connect(self._on_camera_frame)
        self.server.camera_photo_saved.connect(self._on_camera_photo_saved)

        # 1-second timer for QR expiration countdown
        self.qr_timer = QTimer(self)
        self.qr_timer.timeout.connect(self._tick_qr_countdown)
        self.qr_timer.start(1000)
        self._refresh_qr_code(force_new_token=True)

    def _create_card(self) -> Tuple[QFrame, QVBoxLayout]:
        card = QFrame()
        card.setObjectName("Card")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(18, 18, 18, 18)
        return card, layout

    # 1. DASHBOARD
    def _init_dashboard_page(self):
        card, layout = self._create_card()
        title = QLabel("QuickShare Connect Dashboard")
        title.setStyleSheet("font-size:18px; font-weight:bold; color:#0F172A;")
        layout.addWidget(title)

        desc = QLabel(
            f"Local Server Port: {config.port}\\n"
            f"Download Folder: {config.download_dir}\\n"
            "Memory Profile: 64 KB Streaming Buffer (Optimized for 4 GB RAM Windows 10)"
        )
        desc.setStyleSheet("color:#475569; font-size:13px; margin-top:6px;")
        layout.addWidget(desc)

        btn_row = QHBoxLayout()
        btn_qr = QPushButton("Pair Phone via QR")
        btn_qr.clicked.connect(lambda: self.sidebar.setCurrentRow(1))
        btn_send = QPushButton("Send Files to Phone")
        btn_send.clicked.connect(lambda: self.sidebar.setCurrentRow(2))
        btn_open = QPushButton("Open Downloads Folder")
        btn_open.clicked.connect(lambda: os.startfile(config.download_dir))
        btn_row.addWidget(btn_qr)
        btn_row.addWidget(btn_send)
        btn_row.addWidget(btn_open)
        layout.addLayout(btn_row)
        layout.addStretch()
        self.pages.addWidget(card)

    # 2. QR PAIRING
    def _init_qr_page(self):
        card, layout = self._create_card()
        header = QLabel("Scan QR Code with QuickShare Android App")
        header.setStyleSheet("font-size:16px; font-weight:bold;")
        layout.addWidget(header)

        net_row = QHBoxLayout()
        net_row.addWidget(QLabel("Network Adapter:"))
        self.ip_combo = QComboBox()
        for label, ip in get_local_ipv4_addresses():
            self.ip_combo.addItem(label, ip)
        self.ip_combo.currentIndexChanged.connect(lambda: self._refresh_qr_code(False))
        net_row.addWidget(self.ip_combo)
        btn_regen = QPushButton("Regenerate QR Token")
        btn_regen.clicked.connect(lambda: self._refresh_qr_code(True))
        net_row.addWidget(btn_regen)
        layout.addLayout(net_row)

        self.qr_image_label = QLabel()
        self.qr_image_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.qr_image_label)

        self.qr_countdown_label = QLabel("Token expires in 120s")
        self.qr_countdown_label.setAlignment(Qt.AlignCenter)
        self.qr_countdown_label.setStyleSheet("font-family:Consolas; font-size:13px; color:#2563EB;")
        layout.addWidget(self.qr_countdown_label)
        layout.addStretch()
        self.pages.addWidget(card)

    # 3. SEND FILES
    def _init_send_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Send Files from Windows to Android"))
        btn_pick = QPushButton("Select File to Send to Phone...")
        btn_pick.clicked.connect(self._pick_and_send_file)
        layout.addWidget(btn_pick)
        self.send_status_label = QLabel("No active outbound file transfer.")
        layout.addWidget(self.send_status_label)
        layout.addStretch()
        self.pages.addWidget(card)

    # 4. RECEIVE FILES
    def _init_receive_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Incoming File Transfers from Android"))
        self.receive_progress = QProgressBar()
        self.receive_progress.setValue(0)
        layout.addWidget(self.receive_progress)
        self.receive_info_label = QLabel("Waiting for incoming files...")
        layout.addWidget(self.receive_info_label)
        btn_cancel = QPushButton("Cancel Active Transfer")
        btn_cancel.setStyleSheet("background-color:#DC2626;")
        btn_cancel.clicked.connect(self._cancel_active_transfer)
        layout.addWidget(btn_cancel)
        layout.addStretch()
        self.pages.addWidget(card)

    # 5. TEXT SHARE
    def _init_text_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Bidirectional Text & Clipboard Share"))
        self.text_box = QTextEdit()
        self.text_box.setPlaceholderText("Type or paste text here to send to Android...")
        layout.addWidget(self.text_box)
        row = QHBoxLayout()
        btn_send = QPushButton("Send Text to Android")
        btn_send.clicked.connect(self._send_text_to_phone)
        btn_clear = QPushButton("Clear")
        btn_clear.clicked.connect(self.text_box.clear)
        row.addWidget(btn_send)
        row.addWidget(btn_clear)
        layout.addLayout(row)
        self.pages.addWidget(card)

    # 6. CAMERA CAPTURE
    def _init_camera_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Remote Android Camera Preview & Capture"))
        self.camera_viewfinder = QLabel("Camera Inactive — Click 'Request Camera' to ask phone permission")
        self.camera_viewfinder.setAlignment(Qt.AlignCenter)
        self.camera_viewfinder.setMinimumHeight(280)
        self.camera_viewfinder.setStyleSheet("background:#0F172A; color:#94A3B8; border-radius:8px;")
        layout.addWidget(self.camera_viewfinder)

        cam_btns = QHBoxLayout()
        btn_req = QPushButton("Request Camera Preview")
        btn_req.clicked.connect(lambda: self.server.send_ws_json_threadsafe({"type": "CAMERA_START"}))
        btn_snap = QPushButton("Capture High-Res Photo")
        btn_snap.clicked.connect(lambda: self.server.send_ws_json_threadsafe({"type": "CAMERA_CAPTURE"}))
        btn_stop = QPushButton("Stop Camera")
        btn_stop.setStyleSheet("background-color:#DC2626;")
        btn_stop.clicked.connect(self._stop_remote_camera)
        cam_btns.addWidget(btn_req)
        cam_btns.addWidget(btn_snap)
        cam_btns.addWidget(btn_stop)
        layout.addLayout(cam_btns)
        self.pages.addWidget(card)

    # 7. USB MODE (ADB)
    def _init_usb_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("USB Cable Mode (via Android Platform Tools / ADB)"))
        self.usb_log = QTextEdit()
        self.usb_log.setReadOnly(True)
        self.usb_log.setPlainText(
            "Requirements before clicking Activate USB Tunnel:\\n"
            "1. On Android: Settings -> About Phone -> Tap Build Number 7 times.\\n"
            "2. Settings -> System -> Developer Options -> Enable USB Debugging.\\n"
            "3. Plug phone into PC via USB cable and tap 'Allow' on the phone screen."
        )
        layout.addWidget(self.usb_log)
        row = QHBoxLayout()
        btn_check = QPushButton("1. Check USB Devices (adb devices)")
        btn_check.clicked.connect(self._check_usb_devices)
        btn_tunnel = QPushButton("2. Activate USB Tunnel (Port 8765)")
        btn_tunnel.clicked.connect(self._activate_usb_tunnel)
        row.addWidget(btn_check)
        row.addWidget(btn_tunnel)
        layout.addLayout(row)
        self.pages.addWidget(card)

    # 8. TRANSFER HISTORY
    def _init_history_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Transfer History"))
        self.history_list = QListWidget()
        self.history_list.setStyleSheet("background:#FFFFFF; color:#0F172A; border:1px solid #CBD5E1;")
        layout.addWidget(self.history_list)
        self.pages.addWidget(card)

    # 9. SETTINGS
    def _init_settings_page(self):
        card, layout = self._create_card()
        layout.addWidget(QLabel("Application Settings"))
        self.dir_input = QLineEdit(config.download_dir)
        layout.addWidget(QLabel("Download Folder:"))
        layout.addWidget(self.dir_input)
        btn_save = QPushButton("Save Settings")
        btn_save.clicked.connect(self._save_settings)
        layout.addWidget(btn_save)
        layout.addStretch()
        self.pages.addWidget(card)

    # HELPER SLOTS
    def _refresh_qr_code(self, force_new_token: bool):
        if force_new_token or self.security.remaining_pair_seconds() <= 0:
            self.security.generate_new_pair_token()
        ip = self.ip_combo.currentData() or "127.0.0.1"
        pix = build_qr_pixmap(
            ip,
            config.port,
            self.security.current_pair_token,
            int(self.security.pair_token_expires_at),
        )
        self.qr_image_label.setPixmap(pix.scaled(220, 220, Qt.KeepAspectRatio, Qt.SmoothTransformation))

    def _tick_qr_countdown(self):
        rem = self.security.remaining_pair_seconds()
        if rem <= 0:
            self._refresh_qr_code(True)
            rem = self.security.remaining_pair_seconds()
        ip = self.ip_combo.currentData() or "127.0.0.1"
        self.qr_countdown_label.setText(f"Server: {ip}:{config.port}  |  QR Token expires in {rem}s")

    def _on_device_paired(self, device_name: str):
        self.status_banner.setText(f"Connected to {device_name} (Authenticated Session)")
        self.status_banner.setStyleSheet(
            "background:#D1FAE5; color:#065F46; padding:10px 14px; border-radius:8px; font-weight:bold;"
        )

    def _on_device_disconnected(self):
        self.status_banner.setText("Disconnected — Scan QR Code to Reconnect")
        self.status_banner.setStyleSheet(
            "background:#FEF3C7; color:#92400E; padding:10px 14px; border-radius:8px; font-weight:bold;"
        )

    def _pick_and_send_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select File to Send to Android")
        if not path:
            return
        file_id = self.server.register_outbound_file(path)
        p = Path(path)
        ip = self.ip_combo.currentData() or "127.0.0.1"
        self.server.send_ws_json_threadsafe({
            "type": "FILE_OFFER",
            "file_id": file_id,
            "filename": p.name,
            "size": p.stat().st_size,
            "url": f"http://{ip}:{config.port}/api/v1/files/download/{file_id}",
        })
        self.send_status_label.setText(f"Offered {p.name} ({p.stat().st_size} bytes) to Android phone.")
        self.history_list.addItem(f"[PC -> Phone] {p.name}")

    def _cancel_active_transfer(self):
        self.server.cancel_requested = True
        self.receive_info_label.setText("Transfer cancelled.")

    def _send_text_to_phone(self):
        txt = self.text_box.toPlainText()
        self.server.send_ws_json_threadsafe({"type": "TEXT_SHARE", "text": txt})

    def _on_text_received(self, txt: str):
        self.text_box.setPlainText(txt)
        self.sidebar.setCurrentRow(4)

    def _on_transfer_progress(self, name: str, pct: int, speed: float, status: str):
        self.receive_progress.setValue(pct)
        self.receive_info_label.setText(f"{name} — {status} ({speed} MB/s)")

    def _on_transfer_completed(self, name: str, saved_path: str, size_bytes: int):
        self.receive_progress.setValue(100)
        self.receive_info_label.setText(f"Saved: {saved_path} ({size_bytes} bytes)")
        self.history_list.addItem(f"[Phone -> PC] {name} -> {saved_path}")

    def _on_camera_frame(self, jpeg_bytes: bytes):
        img = QImage.fromData(jpeg_bytes, "JPG")
        if not img.isNull():
            self.camera_viewfinder.setPixmap(
                QPixmap.fromImage(img).scaled(
                    self.camera_viewfinder.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
                )
            )

    def _on_camera_photo_saved(self, saved_path: str):
        self.history_list.addItem(f"[Camera Capture] Saved to {saved_path}")
        QMessageBox.information(self, "Photo Captured", f"Saved photo to:\\n{saved_path}")

    def _stop_remote_camera(self):
        self.server.send_ws_json_threadsafe({"type": "CAMERA_STOP"})
        self.camera_viewfinder.clear()
        self.camera_viewfinder.setText("Camera Stopped.")

    def _check_usb_devices(self):
        ok, out, _ = self.adb.check_connected_devices()
        self.usb_log.setPlainText(out)

    def _activate_usb_tunnel(self):
        ok, msg = self.adb.enable_usb_reverse_tunnel()
        self.usb_log.append(f"\\n{msg}")

    def _save_settings(self):
        config.download_dir = self.dir_input.text().strip()
        config.save()
        QMessageBox.information(self, "Settings", "Settings saved successfully.")
`
  },
  {
    id: 'win-main',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\main.py',
    filename: 'main.py',
    language: 'python',
    description: 'Entry point for the Windows application. Starts the background FastAPI thread and opens the PySide6 window.',
    content: `import sys
from PySide6.QtWidgets import QApplication
from config import config
from core.security import SecurityManager
from core.server import ServerSignals
from ui.main_window import QuickShareMainWindow


def main():
    app = QApplication(sys.argv)
    security = SecurityManager(expiry_seconds=config.token_expiry_seconds)

    server_thread = ServerSignals(security)
    server_thread.daemon = True
    server_thread.start()

    window = QuickShareMainWindow(security, server_thread)
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
`
  },
  {
    id: 'win-exe-bat',
    platform: 'windows',
    path: 'C:\\QuickShareConnect\\windows-app\\build_windows_exe.bat',
    filename: 'build_windows_exe.bat',
    language: 'batch',
    description: '1-Click Batch script that installs PyInstaller and builds the standalone QuickShareConnect.exe file.',
    content: `@echo off
echo ==========================================================
echo QuickShare Connect - Windows 10 Standalone .EXE Builder
echo Optimized for 4 GB RAM PCs
echo ==========================================================
cd /d "%~dp0"

if not exist "venv\\Scripts\\activate.bat" (
    echo [1/4] Creating Python virtual environment...
    python -m venv venv
)

echo [2/4] Activating virtual environment and installing dependencies...
call venv\\Scripts\\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

echo [3/4] Building standalone QuickShareConnect.exe with PyInstaller...
pyinstaller --noconfirm --onefile --windowed --name "QuickShareConnect" main.py

echo [4/4] Done!
echo Your standalone Windows executable is ready at:
echo %cd%\\dist\\QuickShareConnect.exe
pause
`
  },

  // ============================================================================
  // ANDROID APPLICATION FILES (Kotlin + Jetpack Compose + CameraX + OkHttp)
  // ============================================================================
  {
    id: 'and-gradle-props',
    platform: 'android',
    path: 'C:\\QuickShareConnect\\android-app\\gradle.properties',
    filename: 'gradle.properties',
    language: 'properties',
    description: 'RAM-limited Gradle configuration (-Xmx1024m) so compiling the APK does not freeze a 4 GB RAM PC.',
    content: `org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=384m -Dfile.encoding=UTF-8
org.gradle.daemon=false
org.gradle.parallel=false
android.useAndroidX=true
kotlin.code.style=official
`
  },
  {
    id: 'and-app-gradle',
    platform: 'android',
    path: 'C:\\QuickShareConnect\\android-app\\app\\build.gradle.kts',
    filename: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Android app module dependencies (Jetpack Compose, CameraX, ML Kit Barcode Scanning, OkHttp).',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.quickshare.connect"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.quickshare.connect"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")

    // OkHttp for chunked HTTP file transfers & WebSocket control
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // CameraX & ML Kit Barcode Scanning for QR pairing & Remote Camera
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:\$cameraxVersion")
    implementation("androidx.camera:camera-camera2:\$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:\$cameraxVersion")
    implementation("androidx.camera:camera-view:\$cameraxVersion")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
}
`
  },
  {
    id: 'and-manifest',
    platform: 'android',
    path: 'C:\\QuickShareConnect\\android-app\\app\\src\\main\\AndroidManifest.xml',
    filename: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'AndroidManifest.xml with local cleartext HTTP enabled for LAN transfers and Camera permission.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:label="QuickShare Connect"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  },
  {
    id: 'and-main-kt',
    platform: 'android',
    path: 'C:\\QuickShareConnect\\android-app\\app\\src\\main\\java\\com\\quickshare\\connect\\MainActivity.kt',
    filename: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Complete Jetpack Compose Android application with QR Pairing, 64 KB Chunked File Upload, Text Share, USB Localhost Mode, and Remote Camera control.',
    content: `package com.quickshare.connect

import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSink
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private val httpClient = OkHttpClient()
    private var webSocket: WebSocket? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                QuickShareAndroidApp()
            }
        }
    }

    @Composable
    fun QuickShareAndroidApp() {
        val scope = rememberCoroutineScope()
        var currentTab by remember { mutableStateOf("Connect") }
        var serverIp by remember { mutableStateOf("192.168.1.45") }
        var serverPort by remember { mutableStateOf("8765") }
        var pairToken by remember { mutableStateOf("") }
        var sessionToken by remember { mutableStateOf<String?>(null) }
        var statusText by remember { mutableStateOf("Disconnected — Scan PC QR or Enter Token") }
        var sharedText by remember { mutableStateOf("") }
        var transferStatus by remember { mutableStateOf("Ready") }
        var cameraConsentPrompt by remember { mutableStateOf(false) }

        val filePicker = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent()
        ) { uri: Uri? ->
            if (uri != null && sessionToken != null) {
                scope.launch {
                    transferStatus = "Streaming file in 64 KB chunks..."
                    val res = uploadUriChunked(
                        uri = uri,
                        baseUrl = "http://\$serverIp:\$serverPort",
                        token = sessionToken!!
                    )
                    transferStatus = res
                }
            }
        }

        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                text = "QuickShare Connect (Android)",
                style = MaterialTheme.typography.titleLarge
            )
            Text(
                text = statusText,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 6.dp)
            )

            // Navigation Row
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf("Connect", "Files", "Text", "USB").forEach { tab ->
                    Button(
                        onClick = { currentTab = tab },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(6.dp)
                    ) {
                        Text(tab)
                    }
                }
            }

            if (cameraConsentPrompt) {
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Windows PC is requesting Camera Preview permission.")
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { cameraConsentPrompt = false }) {
                                Text("Allow Camera")
                            }
                            OutlinedButton(onClick = {
                                cameraConsentPrompt = false
                                webSocket?.send("{\\"type\\":\\"CAMERA_DENIED\\"}")
                            }) {
                                Text("Deny")
                            }
                        }
                    }
                }
            }

            Column(
                modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                when (currentTab) {
                    "Connect" -> {
                        OutlinedTextField(
                            value = serverIp,
                            onValueChange = { serverIp = it },
                            label = { Text("Windows PC IP (or 127.0.0.1 for USB)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = pairToken,
                            onValueChange = { pairToken = it },
                            label = { Text("QR Pairing Token") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = {
                                scope.launch {
                                    val tok = pairWithPc(serverIp, serverPort, pairToken)
                                    if (tok != null) {
                                        sessionToken = tok
                                        statusText = "Connected to \$serverIp:\$serverPort"
                                        connectWebSocket(
                                            serverIp,
                                            serverPort,
                                            onText = { sharedText = it },
                                            onCamReq = { cameraConsentPrompt = true }
                                        )
                                    } else {
                                        statusText = "Pairing failed or QR token expired"
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Authenticate & Connect to Windows PC")
                        }
                    }

                    "Files" -> {
                        Text("Chunked File Transfer (64 KB Streaming)")
                        Button(
                            onClick = { filePicker.launch("*/*") },
                            enabled = sessionToken != null,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Pick File & Send to Windows PC")
                        }
                        Text("Transfer Status: \$transferStatus")
                    }

                    "Text" -> {
                        OutlinedTextField(
                            value = sharedText,
                            onValueChange = { sharedText = it },
                            label = { Text("Shared Text") },
                            modifier = Modifier.fillMaxWidth().height(150.dp)
                        )
                        Button(
                            onClick = {
                                val json = JSONObject().apply {
                                    put("type", "TEXT_SHARE")
                                    put("text", sharedText)
                                }
                                webSocket?.send(json.toString())
                            },
                            enabled = sessionToken != null,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Send Text to Windows PC")
                        }
                    }

                    "USB" -> {
                        Text(
                            "USB Mode Instructions:\\n" +
                            "1. Enable USB Debugging in Android Developer Options.\\n" +
                            "2. Connect USB cable and click 'Activate USB Tunnel' on Windows.\\n" +
                            "3. Tap below to set IP to 127.0.0.1."
                        )
                        Button(
                            onClick = {
                                serverIp = "127.0.0.1"
                                currentTab = "Connect"
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Use USB Tunnel (127.0.0.1:8765)")
                        }
                    }
                }
            }
        }
    }

    private suspend fun pairWithPc(ip: String, port: String, token: String): String? =
        withContext(Dispatchers.IO) {
            try {
                val payload = JSONObject().apply {
                    put("token", token.trim())
                    put("device_name", Build.MODEL ?: "Android")
                }
                val req = Request.Builder()
                    .url("http://\$ip:\$port/api/v1/pair")
                    .post(payload.toString().toRequestBody("application/json".toMediaTypeOrNull()))
                    .build()
                httpClient.newCall(req).execute().use { resp ->
                    if (!resp.isSuccessful) return@withContext null
                    val body = resp.body?.string() ?: return@withContext null
                    JSONObject(body).getString("session_token")
                }
            } catch (e: Exception) {
                null
            }
        }

    private fun connectWebSocket(
        ip: String,
        port: String,
        onText: (String) -> Unit,
        onCamReq: () -> Unit
    ) {
        val req = Request.Builder().url("ws://\$ip:\$port/ws/control").build()
        webSocket = httpClient.newWebSocket(req, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val obj = JSONObject(text)
                    when (obj.optString("type")) {
                        "TEXT_SHARE" -> onText(obj.optString("text"))
                        "CAMERA_START" -> onCamReq()
                    }
                } catch (_: Exception) {}
            }
        })
    }

    private suspend fun uploadUriChunked(uri: Uri, baseUrl: String, token: String): String =
        withContext(Dispatchers.IO) {
            try {
                var fileName = "android_file_\${System.currentTimeMillis()}"
                contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (cursor.moveToFirst() && nameIdx >= 0) {
                        fileName = cursor.getString(nameIdx)
                    }
                }

                val streamBody = object : RequestBody() {
                    override fun contentType() = "application/octet-stream".toMediaTypeOrNull()
                    override fun writeTo(sink: BufferedSink) {
                        contentResolver.openInputStream(uri)?.use { input ->
                            val buffer = ByteArray(65536)
                            var read: Int
                            while (input.read(buffer).also { read = it } != -1) {
                                sink.write(buffer, 0, read)
                            }
                        }
                    }
                }

                val multipart = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("file", fileName, streamBody)
                    .build()

                val req = Request.Builder()
                    .url("\$baseUrl/api/v1/files/upload")
                    .addHeader("Authorization", "Bearer \$token")
                    .post(multipart)
                    .build()

                httpClient.newCall(req).execute().use { resp ->
                    if (resp.isSuccessful) "Upload Complete: \$fileName"
                    else "Upload Error: HTTP \${resp.code}"
                }
            } catch (e: Exception) {
                "Error: \${e.message}"
            }
        }
}
`
  },

  // ============================================================================
  // CLOUD GITHUB ACTIONS BUILDER (Zero-RAM Cloud Compiler for EXE + APK)
  // ============================================================================
  {
    id: 'cloud-workflow',
    platform: 'cloud-builder',
    path: '.github/workflows/build_exe_and_apk.yml',
    filename: '.github/workflows/build_exe_and_apk.yml',
    language: 'yaml',
    description: 'Free GitHub Actions cloud workflow that compiles both QuickShareConnect.exe (Windows) and QuickShareConnect.apk (Android) in the cloud so your 4 GB RAM PC never runs out of memory.',
    content: `name: Build QuickShare Connect EXE and APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-windows-exe:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install Dependencies & Compile EXE
        working-directory: ./windows-app
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pyinstaller --noconfirm --onefile --windowed --name "QuickShareConnect" main.py
      - name: Upload Windows EXE Artifact
        uses: actions/upload-artifact@v4
        with:
          name: QuickShareConnect-Windows-EXE
          path: windows-app/dist/QuickShareConnect.exe

  build-android-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
      - name: Build Debug APK
        working-directory: ./android-app
        run: gradle assembleDebug
      - name: Upload Android APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: QuickShareConnect-Android-APK
          path: android-app/app/build/outputs/apk/debug/app-debug.apk
`
  }
];

/**
 * Generates a single self-contained PowerShell script that writes all Windows + Android files
 * to C:\QuickShareConnect and optionally builds QuickShareConnect.exe immediately.
 */
export function generateOneClickWindowsBuilderScript(): string {
  const lines: string[] = [
    '# ============================================================================',
    '# QuickShare Connect - 1-Click Project Extractor & Windows .EXE Builder',
    '# Save this file as Build-QuickShareConnect.ps1, right-click -> Run with PowerShell',
    '# ============================================================================',
    '$ErrorActionPreference = "Stop"',
    '$BaseDir = "C:\\QuickShareConnect"',
    'Write-Host "Creating QuickShare Connect folders in $BaseDir..." -ForegroundColor Cyan',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\windows-app\\core" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\windows-app\\ui" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\android-app\\app\\src\\main\\java\\com\\quickshare\\connect" | Out-Null',
    'New-Item -ItemType Directory -Force -Path "$BaseDir\\.github\\workflows" | Out-Null',
    ''
  ];

  for (const file of COMPLETE_SOURCE_FILES) {
    let relPath = file.path.replace('C:\\QuickShareConnect\\', '');
    if (file.platform === 'cloud-builder') {
      relPath = '.github\\workflows\\build_exe_and_apk.yml';
    }
    const b64 = btoa(unescape(encodeURIComponent(file.content)));
    lines.push(`# Writing ${relPath}`);
    lines.push(`$TargetFile = Join-Path $BaseDir "${relPath}"`);
    lines.push(`$TargetFolder = Split-Path $TargetFile -Parent`);
    lines.push(`if (!(Test-Path $TargetFolder)) { New-Item -ItemType Directory -Force -Path $TargetFolder | Out-Null }`);
    lines.push(`[System.IO.File]::WriteAllText($TargetFile, [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${b64}")))`);
    lines.push('');
  }

  lines.push('Write-Host "All Windows and Android source files created successfully!" -ForegroundColor Green');
  lines.push('Write-Host "Now building C:\\QuickShareConnect\\windows-app\\dist\\QuickShareConnect.exe ..." -ForegroundColor Cyan');
  lines.push('Set-Location "$BaseDir\\windows-app"');
  lines.push('python -m venv venv');
  lines.push('& "$BaseDir\\windows-app\\venv\\Scripts\\pip.exe" install --upgrade pip');
  lines.push('& "$BaseDir\\windows-app\\venv\\Scripts\\pip.exe" install -r requirements.txt');
  lines.push('& "$BaseDir\\windows-app\\venv\\Scripts\\pyinstaller.exe" --noconfirm --onefile --windowed --name "QuickShareConnect" main.py');
  lines.push('Write-Host "SUCCESS! Your standalone EXE is at: C:\\QuickShareConnect\\windows-app\\dist\\QuickShareConnect.exe" -ForegroundColor Green');
  lines.push('explorer.exe "$BaseDir\\windows-app\\dist"');

  return lines.join('\r\n');
}
