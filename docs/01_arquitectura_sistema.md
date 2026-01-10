# 01. Arquitectura del Sistema ForensIA

## 1. Visión General

ForensIA es una aplicación de escritorio **híbrida Azure + Edge** que permite a médicos forenses dictar informes de autopsia, procesándolos con IA para estructurar los hallazgos en el formato oficial del IMLCF Perú.

### 🔷 Servicios Azure AI (Requisito Imagine Cup)

| Servicio Azure | Uso | Requisito IC |
|----------------|-----|--------------|
| **Azure AI Speech** | Transcripción de voz en español | ✅ Servicio 1 |
| **Azure OpenAI (GPT-4)** | Estructuración de hallazgos a campos | ✅ Servicio 2 |
| **Azure Document Intelligence** | Generación de PDFs estructurados | ✅ Servicio 3 |
| **Azure Blob Storage** | Almacenamiento de audios y documentos | Complementario |

### 🔄 Arquitectura Híbrida

```
                    ┌─────────────────────────────────────┐
                    │         ¿HAY CONEXIÓN?              │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 │                 ▼
        ┌───────────────────┐         │     ┌───────────────────┐
        │   MODO CLOUD      │         │     │   MODO OFFLINE    │
        │   (Azure AI)      │         │     │   (Edge AI)       │
        ├───────────────────┤         │     ├───────────────────┤
        │ • Azure Speech    │         │     │ • Whisper Local   │
        │ • Azure OpenAI    │         │     │ • RigoBERTa Local │
        │ • Doc Intelligence│         │     │ • PDF Local       │
        │ • Mejor precisión │         │     │ • Sin internet    │
        └───────────────────┘         │     └───────────────────┘
                    │                 │                 │
                    └─────────────────┴─────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   MISMA INTERFAZ, MISMOS DATOS      │
                    └─────────────────────────────────────┘
```

> **Nota**: El modo Cloud (Azure) es el **predeterminado** cuando hay conexión.
> El modo Edge es el **fallback** para morgues sin conectividad.

### 1.1 Principios de Diseño

| Principio | Descripción | Justificación |
|-----------|-------------|---------------|
| **Offline-First** | Funciona sin internet | Morgues tienen conectividad limitada |
| **Edge AI** | Procesamiento local en GPU | Soberanía de datos, baja latencia |
| **Modular** | Componentes desacoplados | Mantenibilidad, testing independiente |
| **Interoperable** | Exporta en formatos estándar | Integración con sistemas legados |
| **Seguro** | Encriptación + cadena custodia | Datos forenses son evidencia legal |

### 1.2 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ESTACIÓN FORENSE                              │
│                        (PC con GPU NVIDIA)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────────────────────────────────────┐  │
│  │  MICRÓFONO   │───▶│              CAPA DE ENTRADA                 │  │
│  │  (Audio)     │    │  - Captura de audio (sounddevice)            │  │
│  └──────────────┘    │  - VAD (silero-vad)                          │  │
│                      │  - Buffer de streaming                        │  │
│                      └──────────────────┬───────────────────────────┘  │
│                                         │                               │
│                      ┌──────────────────┴───────────────────┐          │
│                      │         SELECTOR DE MODO             │          │
│                      │   (¿Hay conexión a Azure?)           │          │
│                      └─────────────┬─────────────┬──────────┘          │
│                                    │             │                      │
│              ┌─────────────────────┘             └─────────────────────┐│
│              ▼                                                         ▼│
│  ┌─────────────────────────┐                   ┌─────────────────────┐ │
│  │     MODO AZURE ☁️       │                   │   MODO EDGE 💻      │ │
│  │     (Predeterminado)    │                   │   (Sin internet)    │ │
│  ├─────────────────────────┤                   ├─────────────────────┤ │
│  │                         │                   │                     │ │
│  │  ┌─────────────────┐    │                   │  ┌───────────────┐  │ │
│  │  │ Azure AI Speech │    │                   │  │ Whisper Local │  │ │
│  │  │ (STT español)   │    │                   │  │ (Faster-W V3) │  │ │
│  │  └────────┬────────┘    │                   │  └───────┬───────┘  │ │
│  │           │             │                   │          │          │ │
│  │           ▼             │                   │          ▼          │ │
│  │  ┌─────────────────┐    │                   │  ┌───────────────┐  │ │
│  │  │ Azure OpenAI    │    │                   │  │ RigoBERTa     │  │ │
│  │  │ GPT-4 (NER+Map) │    │                   │  │ Clinical NER  │  │ │
│  │  └────────┬────────┘    │                   │  └───────┬───────┘  │ │
│  │           │             │                   │          │          │ │
│  │           ▼             │                   │          ▼          │ │
│  │  ┌─────────────────┐    │                   │  ┌───────────────┐  │ │
│  │  │ Azure Doc Intel │    │                   │  │ WeasyPrint    │  │ │
│  │  │ (PDF gen)       │    │                   │  │ (PDF local)   │  │ │
│  │  └─────────────────┘    │                   │  └───────────────┘  │ │
│  │                         │                   │                     │ │
│  └───────────┬─────────────┘                   └──────────┬──────────┘ │
│              │                                            │            │
│              └────────────────────┬───────────────────────┘            │
│                                   │                                     │
│                                   ▼                                     │
│                      ┌──────────────────────────────────────────────┐  │
│                      │           CAPA DE APLICACIÓN                  │  │
│                      │  - FastAPI (Backend local)                    │  │
│                      │  - React + Electron (Frontend)                │  │
│                      │  - Modelo 3D anatómico (Three.js)             │  │
│                      └──────────────────┬───────────────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│                      ┌──────────────────────────────────────────────┐  │
│                      │           CAPA DE DATOS                       │  │
│                      │  - SQLite (casos locales)                     │  │
│                      │  - Azure Blob Storage (backup cuando hay red) │  │
│                      │  - Logs de auditoría                          │  │
│                      └──────────────────┬───────────────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│                      ┌──────────────────────────────────────────────┐  │
│                      │           CAPA DE EXPORTACIÓN                 │  │
│                      │  - PDF (formato IMLCF)                        │  │
│                      │  - JSON (FHIR DiagnosticReport)               │  │
│                      │  - CSV (importación Forensys)                 │  │
│                      └──────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes Detallados

### 2.1 Capa de Entrada (Audio)

| Componente | Tecnología | Función |
|------------|------------|---------|
| **Captura** | `sounddevice` (Python) | Grabación de audio del micrófono |
| **VAD** | `silero-vad` | Detectar cuándo hay voz vs silencio |
| **Buffer** | `queue.Queue` | Almacenar chunks de audio para streaming |
| **Formato** | WAV 16kHz mono | Formato óptimo para Whisper |

**Flujo de Audio**:
```
Micrófono → Buffer (chunks 30ms) → VAD → Whisper
                                    ↓
                              (si silencio > 2s)
                                    ↓
                            Fin de utterance
```

### 2.2 Capa ASR (Reconocimiento de Voz)

#### Modo Azure (Predeterminado) ☁️

| Componente | Tecnología | Especificación |
|------------|------------|----------------|
| **Servicio** | Azure AI Speech | Speech-to-Text, español (es-PE) |
| **Modelo** | Whisper via Azure OpenAI | Alta precisión multilingüe |
| **Latencia** | ~300ms | Streaming real-time |
| **Vocabulario** | Phrase list personalizada | Términos forenses |

**Código Azure Speech**:
```python
import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"),
    region="eastus"
)
speech_config.speech_recognition_language = "es-PE"

# Añadir vocabulario forense
phrase_list = speechsdk.PhraseListGrammar.from_recognizer(recognizer)
phrase_list.addPhrase("livideces")
phrase_list.addPhrase("rigidez cadavérica")
phrase_list.addPhrase("esquimosis")
# ... más términos
```

#### Modo Edge (Fallback Offline) 💻

| Componente | Tecnología | Especificación |
|------------|------------|----------------|
| **Modelo** | Whisper Large V3 | 1.5B parámetros, local |
| **Runtime** | Faster-Whisper (CTranslate2) | 4x más rápido |
| **Cuantización** | FP16 | GPU NVIDIA requerida |

**Código Whisper Local**:
```python
from faster_whisper import WhisperModel

model = WhisperModel(
    "large-v3",
    device="cuda",
    compute_type="float16"
)

# Prompt con vocabulario forense
initial_prompt = """
Transcripción de autopsia médico-legal. Términos frecuentes:
livideces, rigidez cadavérica, esquimosis, cianosis, petequias,
herida contusa, herida cortante, proyectil, orificio de entrada.
"""
```

### 2.3 Capa NLP (Procesamiento de Lenguaje)

#### Modo Azure (Predeterminado) ☁️

| Componente | Tecnología | Función |
|------------|------------|---------|
| **LLM** | Azure OpenAI GPT-4 | Extracción + estructuración |
| **Prompt** | System + User | Mapeo directo a campos |
| **Output** | JSON estructurado | 109 campos del protocolo |

**Código Azure OpenAI**:
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT_FORENSE},
        {"role": "user", "content": transcripcion}
    ],
    response_format={"type": "json_object"}
)
```

**System Prompt Forense**:
```
Eres un asistente de documentación médico-legal. Dado un dictado de 
autopsia, extrae y estructura los hallazgos en formato JSON siguiendo
el protocolo de necropsia del IMLCF Perú (109 campos).

Entidades a extraer:
- ORGAN: órganos mencionados
- BODY_SITE: regiones anatómicas
- LESION_TYPE: tipo de lesión
- MEASUREMENT: medidas y pesos
- CONDITION: estados patológicos
- CADAVERIC_SIGN: fenómenos cadavéricos
...
```

#### Modo Edge (Fallback Offline) 💻

| Componente | Tecnología | Función |
|------------|------------|---------|
| **NER Base** | RigoBERTa Clinical | Extracción de entidades |
| **Mapeo** | Reglas + Llama-3-8B local | Entidad → Campo |
| **Fine-tuning** | LoRA | Adaptación a dominio forense |

**Entidades a Extraer**:
```
ENTIDADES FORENSES:
├── ORGAN          → "pulmón derecho", "hígado", "encéfalo"
├── BODY_SITE      → "región frontal", "hemitórax izquierdo"
├── LESION_TYPE    → "herida contusa", "laceración", "equimosis"
├── MEASUREMENT    → "3 por 2 centímetros", "450 gramos"
├── CONDITION      → "congestivo", "pálido", "edematoso"
├── CADAVERIC_SIGN → "livideces dorsales", "rigidez generalizada"
├── TIME_INTERVAL  → "12 a 18 horas post-mortem"
├── WEAPON         → "proyectil", "arma blanca", "objeto contuso"
└── SAMPLE         → "muestra de sangre", "contenido gástrico"
```

### 2.4 Capa de Aplicación

#### 2.4.1 Backend (FastAPI)

```
📂 /backend
├── main.py                 # Entrada principal
├── routers/
│   ├── audio.py            # Endpoints de grabación
│   ├── transcription.py    # Endpoints ASR
│   ├── cases.py            # CRUD de casos
│   └── export.py           # Generación de documentos
├── services/
│   ├── whisper_service.py  # Lógica ASR
│   ├── ner_service.py      # Lógica NLP
│   └── document_service.py # Generación PDF/FHIR
├── models/
│   ├── case.py             # Modelo de caso
│   ├── finding.py          # Modelo de hallazgo
│   └── protocol.py         # Modelo protocolo 109 campos
└── core/
    ├── config.py           # Configuración
    ├── security.py         # Autenticación
    └── database.py         # Conexión SQLite
```

#### 2.4.2 Frontend (Electron + React)

```
📂 /frontend
├── public/
│   └── electron.js         # Main process Electron
├── src/
│   ├── App.tsx             # Entrada React
│   ├── pages/
│   │   ├── Login.tsx       # Autenticación
│   │   ├── CaseList.tsx    # Lista de casos
│   │   ├── Dictation.tsx   # Pantalla principal de dictado
│   │   └── Review.tsx      # Revisión antes de exportar
│   ├── components/
│   │   ├── AudioRecorder/  # Controles de grabación
│   │   ├── Transcript/     # Vista de transcripción
│   │   ├── ProtocolForm/   # Formulario 109 campos
│   │   └── BodyModel3D/    # Modelo anatómico Three.js
│   └── services/
│       └── api.ts          # Comunicación con backend
└── package.json
```

### 2.5 Capa de Datos

#### 2.5.1 Base de Datos Local (SQLite)

```sql
-- Tabla principal de casos
CREATE TABLE cases (
    id TEXT PRIMARY KEY,           -- UUID
    protocol_number TEXT,          -- Nº Protocolo IMLCF
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    status TEXT,                   -- draft, completed, exported
    deceased_name TEXT,
    deceased_age INTEGER,
    deceased_sex TEXT,
    -- ... campos 1-20 del protocolo
    findings_json TEXT,            -- Hallazgos estructurados
    audio_path TEXT,               -- Ruta al archivo de audio
    hash_audio TEXT,               -- SHA-256 del audio
    hash_transcript TEXT,          -- SHA-256 de la transcripción
    exported_pdf_path TEXT,
    exported_at TIMESTAMP
);

-- Tabla de auditoría (cadena de custodia digital)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY,
    case_id TEXT,
    action TEXT,                   -- created, edited, exported
    timestamp TIMESTAMP,
    user_id TEXT,
    hash_before TEXT,
    hash_after TEXT,
    details TEXT
);
```

### 2.6 Capa de Exportación

#### 2.6.1 Formatos de Salida

| Formato | Uso | Tecnología |
|---------|-----|------------|
| **PDF** | Impresión, archivo físico | WeasyPrint / ReportLab |
| **JSON FHIR** | Interoperabilidad futura | Modelo DiagnosticReport |
| **CSV** | Importación a Forensys | Mapeo de campos |

#### 2.6.2 Integración con Forensys

Forensys **no tiene API pública**. Estrategia de integración:

| Fase | Método | Descripción |
|------|--------|-------------|
| **MVP** | Exportación manual | PDF + CSV que el usuario importa |
| **V2** | Clipboard automation | Copiar campos al portapapeles |
| **V3** | RPA (Selenium/PyAutoGUI) | Automatizar llenado de formularios |
| **Ideal** | Acceso BD | Si IMLCF da acceso a PostgreSQL/Oracle |

**Flujo de Integración MVP**:
```
ForensIA genera PDF + CSV
         ↓
Usuario abre Forensys manualmente
         ↓
Usuario copia/pega datos o importa CSV
         ↓
Forensys guarda en sistema oficial
```

---

## 3. Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FLUJO DE UNA SESIÓN DE DICTADO                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. INICIO                                                              │
│     └─ Usuario se autentica (login local)                               │
│     └─ Crea nuevo caso o abre existente                                 │
│     └─ Sistema carga protocolo vacío (109 campos)                       │
│                                                                         │
│  2. DICTADO                                                             │
│     └─ Usuario presiona "Iniciar Dictado"                               │
│     └─ Audio capturado → Buffer → VAD                                   │
│     └─ Chunks enviados a Whisper (streaming)                            │
│     └─ Texto parcial aparece en pantalla (200ms latencia)               │
│                                                                         │
│  3. PROCESAMIENTO                                                       │
│     └─ Al detectar pausa (>2s silencio):                                │
│         └─ Utterance completo enviado a NER                             │
│         └─ Entidades extraídas                                          │
│         └─ Mapeo a campos del protocolo                                 │
│         └─ UI actualiza formulario + modelo 3D                          │
│                                                                         │
│  4. REVISIÓN                                                            │
│     └─ Usuario pausa dictado                                            │
│     └─ Revisa campos completados                                        │
│     └─ Corrige errores (verbal o teclado)                               │
│     └─ Continúa dictado si necesario                                    │
│                                                                         │
│  5. CIERRE                                                              │
│     └─ Usuario finaliza caso                                            │
│     └─ Sistema genera hashes (audio + texto)                            │
│     └─ Guarda en SQLite con auditoría                                   │
│     └─ Exporta PDF + CSV                                                │
│                                                                         │
│  6. SINCRONIZACIÓN (opcional, cuando hay red)                           │
│     └─ Backup a servidor central                                        │
│     └─ Usuario importa manualmente a Forensys                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Requisitos de Hardware

### 4.1 Estación Mínima

| Componente | Especificación | Costo Aprox. |
|------------|----------------|--------------|
| **GPU** | NVIDIA RTX 3060 12GB | $300 |
| **CPU** | Intel i5-12400 / Ryzen 5 5600 | $150 |
| **RAM** | 16GB DDR4 | $50 |
| **SSD** | NVMe 512GB | $50 |
| **Micrófono** | USB con cancelación ruido | $50 |
| **Total** | | **~$600** |

### 4.2 Estación Recomendada

| Componente | Especificación | Costo Aprox. |
|------------|----------------|--------------|
| **GPU** | NVIDIA RTX 4060 Ti 16GB | $400 |
| **CPU** | Intel i7-13700 / Ryzen 7 7700 | $300 |
| **RAM** | 32GB DDR5 | $100 |
| **SSD** | NVMe 1TB Gen4 | $80 |
| **Micrófono** | Philips SpeechMike Premium | $250 |
| **Total** | | **~$1,130** |

### 4.3 Consumo de Recursos

| Modelo | VRAM | RAM | Latencia |
|--------|------|-----|----------|
| Whisper Large V3 (FP16) | ~5GB | ~4GB | ~500ms/chunk |
| RigoBERTa Clinical | ~2GB | ~1GB | ~50ms/texto |
| **Total simultáneo** | **~7GB** | **~8GB** | - |

---

## 5. Seguridad y Cadena de Custodia

### 5.1 Autenticación

| Mecanismo | Descripción |
|-----------|-------------|
| **Local** | Usuario/contraseña almacenados con bcrypt |
| **Futuro** | Integración con Active Directory de IMLCF |

### 5.2 Integridad de Datos

| Dato | Protección |
|------|------------|
| **Audio original** | Hash SHA-256, archivo inmutable |
| **Transcripción** | Hash SHA-256, versionado |
| **Caso completo** | Firma digital del médico |

### 5.3 Auditoría

Cada acción queda registrada:
```json
{
  "action": "case_modified",
  "case_id": "uuid-123",
  "user": "dr.garcia",
  "timestamp": "2026-01-07T21:30:00Z",
  "field_changed": "findings.external.head",
  "hash_before": "abc123...",
  "hash_after": "def456..."
}
```

---

## 6. Tecnologías y Versiones

### 6.1 Stack Azure (Modo Cloud)

| Servicio | Uso | SKU Recomendado |
|----------|-----|-----------------|
| **Azure AI Speech** | Transcripción español | Standard S0 |
| **Azure OpenAI** | GPT-4 para estructuración | Standard |
| **Azure Document Intelligence** | Generación de PDFs | S0 |
| **Azure Blob Storage** | Backup de audios | Standard LRS |
| **Azure Key Vault** | Gestión de secretos | Standard |

### 6.2 Stack Local (Modo Edge)

| Categoría | Tecnología | Versión | Licencia |
|-----------|------------|---------|----------|
| **ASR Local** | Faster-Whisper | 1.0+ | MIT |
| **NER Local** | Transformers (HuggingFace) | 4.40+ | Apache 2.0 |
| **Backend** | FastAPI | 0.110+ | MIT |
| **Frontend** | React | 18+ | MIT |
| **Desktop** | Electron | 30+ | MIT |
| **3D** | Three.js | r160+ | MIT |
| **DB** | SQLite | 3.40+ | Public Domain |
| **PDF** | WeasyPrint | 60+ | BSD |
| **Python** | Python | 3.11+ | PSF |
| **Node** | Node.js | 20 LTS | MIT |

### 6.3 Costos Estimados Azure (Mensual)

| Servicio | Uso Estimado | Costo/Mes |
|----------|--------------|-----------|
| Azure AI Speech | 100 horas | $100 |
| Azure OpenAI GPT-4 | 500K tokens | $15 |
| Azure Document Intelligence | 1000 docs | $10 |
| Azure Blob Storage | 100 GB | $2 |
| **Total** | | **~$127/mes** |

> Nota: Con Azure for Students se obtienen $100 en créditos mensuales.

---

## 7. Consideraciones de Despliegue

### 7.1 Instalación

1. **Instalador Windows** (.exe con NSIS o Electron Builder)
2. Incluye Python embebido + modelos de IA
3. Tamaño estimado: ~8GB (modelos incluidos)

### 7.2 Actualizaciones

| Componente | Método |
|------------|--------|
| **Aplicación** | Descarga manual de nueva versión |
| **Modelos IA** | Descarga opcional cuando hay red |
| **Vocabulario** | Archivo de texto editable |

### 7.3 Backup

- Carpeta de datos exportable
- Sincronización opcional a servidor IMLCF

---

## 8. Próximos Documentos

1. ✅ `01_arquitectura_sistema.md` (este documento)
2. ⏳ `02_modelo_datos.md` - Esquema de 109 campos
3. ⏳ `03_pipeline_asr.md` - Configuración Whisper
4. ⏳ `04_pipeline_ner.md` - Entidades y mapeo
5. ⏳ `05_generacion_documentos.md` - PDF y FHIR
6. ⏳ `06_interfaz_usuario.md` - UI/UX
7. ⏳ `07_deployment_seguridad.md` - Instalación y seguridad
