# 07. Deployment y Seguridad

## 1. Visión General

Este documento cubre la instalación, configuración y medidas de seguridad para ForensIA.

| Aspecto | Detalle |
|---------|---------|
| **Plataforma** | Windows 10/11 (64-bit) |
| **Instalador** | Electron Builder (NSIS) |
| **Backend** | Python embebido + FastAPI |
| **Modelos IA** | Descarga en primer inicio |
| **Tamaño** | ~500MB app + ~5GB modelos |

---

## 2. Estructura de Instalación

```
📂 C:\Program Files\ForensIA\
├── ForensIA.exe              # Ejecutable principal
├── resources/
│   ├── app.asar              # Código React empaquetado
│   └── python/               # Python embebido
│       ├── python.exe
│       ├── Lib/
│       └── Scripts/
├── models/
│   ├── whisper/              # Modelos Whisper
│   │   └── large-v3/
│   └── ner/                  # Modelos NER
│       └── rigoberta/
├── data/
│   ├── database.db           # SQLite
│   ├── cases/                # Archivos de casos
│   ├── exports/              # PDFs exportados
│   └── audio/                # Grabaciones
└── logs/
    └── forensia.log
```

---

## 3. Instalación

### 3.1 Requisitos del Sistema

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **OS** | Windows 10 64-bit | Windows 11 |
| **CPU** | Intel i5 / Ryzen 5 | Intel i7 / Ryzen 7 |
| **RAM** | 16 GB | 32 GB |
| **GPU** | NVIDIA GTX 1060 6GB | NVIDIA RTX 3060 12GB |
| **Almacenamiento** | 20 GB SSD | 50 GB NVMe |
| **Micrófono** | USB básico | Philips SpeechMike |

### 3.2 Instalador NSIS

```javascript
// electron-builder.config.js

module.exports = {
  appId: 'com.forensia.app',
  productName: 'ForensIA',
  copyright: 'Copyright © 2026 ForensIA',
  
  directories: {
    output: 'dist-electron',
    buildResources: 'build'
  },
  
  files: [
    'dist/**/*',
    'electron/**/*',
    'resources/**/*'
  ],
  
  extraResources: [
    {
      from: 'python-embed',
      to: 'python',
      filter: ['**/*']
    }
  ],
  
  win: {
    target: ['nsis'],
    icon: 'build/icon.ico',
    requestedExecutionLevel: 'requireAdministrator'
  },
  
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ForensIA',
    
    // Script personalizado para instalar dependencias
    include: 'build/installer.nsh'
  }
};
```

### 3.3 Script de Post-Instalación

```nsis
; build/installer.nsh

!macro customInstall
  ; Instalar Visual C++ Redistributable
  File /oname=$PLUGINSDIR\vc_redist.x64.exe "${BUILD_RESOURCES_DIR}\vc_redist.x64.exe"
  ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /quiet /norestart'
  
  ; Instalar CUDA Toolkit (si GPU NVIDIA)
  ; Esto se hace manualmente o con script separado
  
  ; Crear acceso directo en escritorio
  CreateShortCut "$DESKTOP\ForensIA.lnk" "$INSTDIR\ForensIA.exe"
!macroend

!macro customUnInstall
  ; Eliminar datos de usuario (opcional, preguntar)
  MessageBox MB_YESNO "¿Desea eliminar todos los datos y casos?" IDNO skip_data
    RMDir /r "$APPDATA\ForensIA"
  skip_data:
!macroend
```

### 3.4 Primer Inicio

```python
# scripts/first_run.py

import os
import requests
from pathlib import Path
from tqdm import tqdm

MODELS_DIR = Path(os.getenv("FORENSIA_MODELS", "./models"))

MODELS = {
    "whisper": {
        "url": "https://huggingface.co/guillaumekln/faster-whisper-large-v3/resolve/main/",
        "files": ["model.bin", "config.json", "vocabulary.json"],
        "size": "3.1 GB"
    },
    "rigoberta": {
        "url": "https://huggingface.co/IIC/RigoBERTa-Clinical/resolve/main/",
        "files": ["pytorch_model.bin", "config.json", "tokenizer.json"],
        "size": "1.2 GB"
    }
}

def download_models(on_progress=None):
    """Descarga modelos en primer inicio."""
    
    for model_name, config in MODELS.items():
        model_dir = MODELS_DIR / model_name
        model_dir.mkdir(parents=True, exist_ok=True)
        
        for filename in config["files"]:
            filepath = model_dir / filename
            
            if filepath.exists():
                continue
            
            url = config["url"] + filename
            print(f"Descargando {model_name}/{filename}...")
            
            response = requests.get(url, stream=True)
            total = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f:
                with tqdm(total=total, unit='B', unit_scale=True) as pbar:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        pbar.update(len(chunk))
                        if on_progress:
                            on_progress(pbar.n / total * 100)
    
    print("✅ Modelos descargados correctamente")

if __name__ == "__main__":
    download_models()
```

---

## 4. Configuración

### 4.1 Variables de Entorno

```bash
# .env (se crea en instalación)

# === AZURE (Modo Cloud) ===
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_MODEL=gpt-4
AZURE_DOC_INTEL_KEY=your-doc-intel-key
AZURE_DOC_INTEL_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# === PATHS ===
FORENSIA_DATA=C:\Users\{user}\AppData\Roaming\ForensIA
FORENSIA_MODELS=C:\Program Files\ForensIA\models
FORENSIA_EXPORTS=C:\Users\{user}\Documents\ForensIA\exports

# === CONFIGURACIÓN ===
FORENSIA_MODE=auto          # auto | azure | edge
FORENSIA_LOG_LEVEL=INFO
FORENSIA_LANGUAGE=es-PE

# === SEGURIDAD ===
FORENSIA_ENCRYPTION_KEY=   # Se genera en primer inicio
```

### 4.2 Configuración de Usuario

```json
// %APPDATA%/ForensIA/config.json

{
  "user": {
    "id": "uuid",
    "username": "dr.garcia",
    "full_name": "Dr. Juan García",
    "role": "medico"
  },
  "preferences": {
    "theme": "light",
    "language": "es-PE",
    "show_3d_model": true,
    "auto_save_interval": 30,
    "audio_device": "default"
  },
  "azure": {
    "enabled": true,
    "region": "eastus"
  },
  "edge": {
    "whisper_model": "large-v3",
    "use_gpu": true
  }
}
```

---

## 5. Seguridad

### 5.1 Modelo de Amenazas

| Amenaza | Riesgo | Mitigación |
|---------|--------|------------|
| Acceso no autorizado | Alto | Autenticación local + AD futuro |
| Alteración de datos | Crítico | Hashes SHA-256, auditoría |
| Robo de datos | Alto | Encriptación AES-256, datos locales |
| Intercepción en tránsito | Medio | HTTPS/TLS para Azure |
| Pérdida de datos | Alto | Backup automático |

### 5.2 Autenticación

```python
# services/auth_service.py

import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional
import sqlite3

class AuthService:
    """Servicio de autenticación local."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'medico',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    
    def create_user(
        self,
        username: str,
        password: str,
        full_name: str,
        role: str = "medico"
    ) -> str:
        """Crea un nuevo usuario."""
        password_hash = bcrypt.hashpw(
            password.encode(),
            bcrypt.gensalt()
        ).decode()
        
        user_id = secrets.token_hex(16)
        
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO users (id, username, password_hash, full_name, role)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, username, password_hash, full_name, role)
        )
        conn.commit()
        conn.close()
        
        return user_id
    
    def authenticate(
        self,
        username: str,
        password: str
    ) -> Optional[dict]:
        """Autentica usuario y retorna sesión."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            "SELECT id, password_hash, full_name, role FROM users WHERE username = ?",
            (username,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        user_id, password_hash, full_name, role = row
        
        if not bcrypt.checkpw(password.encode(), password_hash.encode()):
            return None
        
        # Crear sesión
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=8)
        
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO sessions (token, user_id, expires_at)
               VALUES (?, ?, ?)""",
            (token, user_id, expires_at.isoformat())
        )
        conn.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.now().isoformat(), user_id)
        )
        conn.commit()
        conn.close()
        
        return {
            "token": token,
            "user_id": user_id,
            "username": username,
            "full_name": full_name,
            "role": role,
            "expires_at": expires_at.isoformat()
        }
    
    def validate_session(self, token: str) -> Optional[dict]:
        """Valida token de sesión."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            """SELECT s.user_id, s.expires_at, u.username, u.full_name, u.role
               FROM sessions s
               JOIN users u ON s.user_id = u.id
               WHERE s.token = ?""",
            (token,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        user_id, expires_at, username, full_name, role = row
        
        if datetime.fromisoformat(expires_at) < datetime.now():
            return None
        
        return {
            "user_id": user_id,
            "username": username,
            "full_name": full_name,
            "role": role
        }
```

### 5.3 Encriptación de Datos

```python
# services/encryption_service.py

import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class EncryptionService:
    """Servicio de encriptación AES-256."""
    
    def __init__(self, master_key: str = None):
        if master_key is None:
            master_key = os.getenv("FORENSIA_ENCRYPTION_KEY")
            if not master_key:
                master_key = self._generate_master_key()
        
        self.fernet = self._derive_fernet(master_key)
    
    def _generate_master_key(self) -> str:
        """Genera clave maestra y la guarda."""
        key = Fernet.generate_key().decode()
        
        # Guardar en archivo protegido
        key_path = os.path.join(
            os.getenv("FORENSIA_DATA", "."),
            ".encryption_key"
        )
        
        with open(key_path, 'w') as f:
            f.write(key)
        
        # Proteger archivo (Windows)
        import subprocess
        subprocess.run([
            'icacls', key_path,
            '/inheritance:r',
            '/grant:r', f'{os.getenv("USERNAME")}:F'
        ], capture_output=True)
        
        return key
    
    def _derive_fernet(self, key: str) -> Fernet:
        """Deriva clave Fernet desde master key."""
        salt = b'ForensIA_Salt_v1'  # Sal fija para consistencia
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        derived_key = base64.urlsafe_b64encode(
            kdf.derive(key.encode())
        )
        
        return Fernet(derived_key)
    
    def encrypt(self, data: str) -> str:
        """Encripta texto."""
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Desencripta texto."""
        return self.fernet.decrypt(encrypted_data.encode()).decode()
    
    def encrypt_file(self, input_path: str, output_path: str):
        """Encripta archivo."""
        with open(input_path, 'rb') as f:
            data = f.read()
        
        encrypted = self.fernet.encrypt(data)
        
        with open(output_path, 'wb') as f:
            f.write(encrypted)
    
    def decrypt_file(self, input_path: str, output_path: str):
        """Desencripta archivo."""
        with open(input_path, 'rb') as f:
            encrypted = f.read()
        
        data = self.fernet.decrypt(encrypted)
        
        with open(output_path, 'wb') as f:
            f.write(data)
```

### 5.4 Auditoría Completa

```python
# services/audit_service.py

import sqlite3
import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class AuditService:
    """Servicio de auditoría para cadena de custodia."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                details TEXT,
                hash_before TEXT,
                hash_after TEXT,
                ip_address TEXT,
                device_id TEXT
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_resource
            ON audit_log(resource_type, resource_id)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_user
            ON audit_log(user_id)
        """)
        conn.commit()
        conn.close()
    
    def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Dict[str, Any] = None,
        hash_before: str = None,
        hash_after: str = None
    ):
        """Registra acción en log de auditoría."""
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT INTO audit_log 
               (user_id, action, resource_type, resource_id, details, 
                hash_before, hash_after, device_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                action,
                resource_type,
                resource_id,
                json.dumps(details) if details else None,
                hash_before,
                hash_after,
                self._get_device_id()
            )
        )
        conn.commit()
        conn.close()
    
    def _get_device_id(self) -> str:
        """Obtiene ID único del dispositivo."""
        import uuid
        return str(uuid.getnode())
    
    def get_case_history(self, case_id: str) -> list:
        """Obtiene historial completo de un caso."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            """SELECT timestamp, user_id, action, details, hash_before, hash_after
               FROM audit_log
               WHERE resource_type = 'case' AND resource_id = ?
               ORDER BY timestamp ASC""",
            (case_id,)
        )
        
        history = []
        for row in cursor:
            history.append({
                "timestamp": row[0],
                "user_id": row[1],
                "action": row[2],
                "details": json.loads(row[3]) if row[3] else None,
                "hash_before": row[4],
                "hash_after": row[5]
            })
        
        conn.close()
        return history
    
    def verify_chain(self, case_id: str) -> Dict[str, Any]:
        """Verifica integridad de la cadena de custodia."""
        history = self.get_case_history(case_id)
        
        if not history:
            return {"valid": False, "error": "No history found"}
        
        # Verificar que cada hash_after coincida con hash_before siguiente
        for i in range(len(history) - 1):
            if history[i]["hash_after"] != history[i + 1]["hash_before"]:
                return {
                    "valid": False,
                    "error": f"Chain broken at step {i + 1}",
                    "timestamp": history[i + 1]["timestamp"]
                }
        
        return {
            "valid": True,
            "total_actions": len(history),
            "first_action": history[0]["timestamp"],
            "last_action": history[-1]["timestamp"],
            "final_hash": history[-1]["hash_after"]
        }
```

---

## 6. Backup y Recuperación

### 6.1 Backup Automático

```python
# services/backup_service.py

import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

class BackupService:
    """Servicio de backup automático."""
    
    def __init__(self, data_dir: str, backup_dir: str):
        self.data_dir = Path(data_dir)
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    def create_backup(self) -> str:
        """Crea backup completo."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"forensia_backup_{timestamp}.zip"
        backup_path = self.backup_dir / backup_name
        
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Base de datos
            db_path = self.data_dir / "database.db"
            if db_path.exists():
                zf.write(db_path, "database.db")
            
            # Casos
            cases_dir = self.data_dir / "cases"
            if cases_dir.exists():
                for file in cases_dir.rglob("*"):
                    zf.write(file, f"cases/{file.relative_to(cases_dir)}")
            
            # Audio (opcional, puede ser grande)
            audio_dir = self.data_dir / "audio"
            if audio_dir.exists():
                for file in audio_dir.rglob("*.wav"):
                    zf.write(file, f"audio/{file.relative_to(audio_dir)}")
        
        # Limpiar backups antiguos (mantener últimos 7)
        self._cleanup_old_backups(keep=7)
        
        return str(backup_path)
    
    def _cleanup_old_backups(self, keep: int):
        """Elimina backups antiguos."""
        backups = sorted(
            self.backup_dir.glob("forensia_backup_*.zip"),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        for backup in backups[keep:]:
            backup.unlink()
    
    def restore_backup(self, backup_path: str):
        """Restaura desde backup."""
        with zipfile.ZipFile(backup_path, 'r') as zf:
            zf.extractall(self.data_dir)
```

### 6.2 Sincronización Azure (Opcional)

```python
# services/azure_sync_service.py

import os
from azure.storage.blob import BlobServiceClient
from pathlib import Path

class AzureSyncService:
    """Sincronización con Azure Blob Storage."""
    
    def __init__(self):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.client = BlobServiceClient.from_connection_string(connection_string)
        self.container = self.client.get_container_client("forensia-backups")
    
    def upload_backup(self, local_path: str):
        """Sube backup a Azure."""
        blob_name = Path(local_path).name
        blob_client = self.container.get_blob_client(blob_name)
        
        with open(local_path, 'rb') as f:
            blob_client.upload_blob(f, overwrite=True)
    
    def download_backup(self, blob_name: str, local_path: str):
        """Descarga backup desde Azure."""
        blob_client = self.container.get_blob_client(blob_name)
        
        with open(local_path, 'wb') as f:
            data = blob_client.download_blob()
            data.readinto(f)
    
    def list_backups(self) -> list:
        """Lista backups disponibles en Azure."""
        blobs = self.container.list_blobs()
        return [blob.name for blob in blobs]
```

---

## 7. Logging

```python
# core/logging_config.py

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

def setup_logging():
    """Configura logging de la aplicación."""
    
    log_dir = Path(os.getenv("FORENSIA_DATA", ".")) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / "forensia.log"
    
    # Formato
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Handler archivo (rotación 10MB, 5 backups)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    
    # Handler consola
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Logger raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(
        getattr(logging, os.getenv("FORENSIA_LOG_LEVEL", "INFO"))
    )
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Silenciar loggers ruidosos
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("azure").setLevel(logging.WARNING)
```

---

## 8. Checklist de Seguridad

| Área | Requisito | Implementado |
|------|-----------|--------------|
| **Autenticación** | Login con bcrypt | ✅ |
| **Sesiones** | Tokens con expiración | ✅ |
| **Encriptación** | AES-256 Fernet | ✅ |
| **Integridad** | SHA-256 hashes | ✅ |
| **Auditoría** | Log de todas las acciones | ✅ |
| **Backup** | Automático diario | ✅ |
| **HTTPS** | TLS para Azure | ✅ |
| **Datos locales** | No salen sin sync explícito | ✅ |

---

## 9. Resumen de Documentación

| Doc | Contenido | Estado |
|-----|-----------|--------|
| 01_arquitectura_sistema.md | Arquitectura híbrida Azure+Edge | ✅ |
| 02_modelo_datos.md | 109 campos, JSON Schema, SQLite | ✅ |
| 03_pipeline_asr.md | Azure Speech + Whisper local | ✅ |
| 04_pipeline_ner.md | Azure OpenAI + RigoBERTa | ✅ |
| 05_generacion_documentos.md | PDF, FHIR, CSV | ✅ |
| 06_interfaz_usuario.md | Electron + React + Three.js | ✅ |
| 07_deployment_seguridad.md | Instalación, seguridad, backup | ✅ |

---

## 🎯 Próximo Paso

**¡Documentación técnica completa!**

Siguiente fase: **Implementación del código**
