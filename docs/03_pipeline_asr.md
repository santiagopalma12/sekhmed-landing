# 03. Pipeline ASR (Reconocimiento de Voz)

## 1. Visión General

El pipeline ASR convierte la voz del médico forense en texto estructurado. Opera en dos modos:

| Modo | Tecnología | Uso |
|------|------------|-----|
| **Azure** ☁️ | Azure AI Speech | Cuando hay conexión (predeterminado) |
| **Edge** 💻 | Whisper Local | Sin internet (fallback) |

---

## 2. Modo Azure (Predeterminado)

### 2.1 Servicio: Azure AI Speech

| Aspecto | Configuración |
|---------|---------------|
| **Servicio** | Azure Cognitive Services - Speech |
| **SKU** | Standard S0 |
| **Idioma** | es-PE (Español Perú) |
| **Modelo** | Whisper (vía Azure OpenAI) o Neural STT |
| **Streaming** | Sí, tiempo real |

### 2.2 Configuración del Recurso Azure

```bash
# Crear recurso Azure AI Speech
az cognitiveservices account create \
  --name forensia-speech \
  --resource-group forensia-rg \
  --kind SpeechServices \
  --sku S0 \
  --location eastus \
  --yes

# Obtener claves
az cognitiveservices account keys list \
  --name forensia-speech \
  --resource-group forensia-rg
```

### 2.3 Implementación Python

```python
# services/azure_speech_service.py

import os
import azure.cognitiveservices.speech as speechsdk
from typing import Callable, Optional

class AzureSpeechService:
    """Servicio de reconocimiento de voz usando Azure AI Speech."""
    
    def __init__(self):
        self.speech_config = speechsdk.SpeechConfig(
            subscription=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus")
        )
        
        # Configurar idioma español Perú
        self.speech_config.speech_recognition_language = "es-PE"
        
        # Optimizar para dictado médico
        self.speech_config.set_property(
            speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
            "5000"
        )
        self.speech_config.set_property(
            speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
            "2000"
        )
        
        self.recognizer: Optional[speechsdk.SpeechRecognizer] = None
        self.phrase_list: Optional[speechsdk.PhraseListGrammar] = None
    
    def _add_forensic_vocabulary(self):
        """Añade vocabulario forense para mejorar precisión."""
        if not self.phrase_list:
            return
            
        # Fenómenos cadavéricos
        cadaveric_terms = [
            "livideces", "livideces dorsales", "livideces modificables",
            "rigidez cadavérica", "rigidez generalizada",
            "putrefacción", "fauna cadavérica",
            "enfriamiento", "deshidratación"
        ]
        
        # Lesiones
        lesion_terms = [
            "herida contusa", "herida cortante", "herida punzante",
            "herida incisa", "herida contuso cortante",
            "equimosis", "esquimosis", "hematoma", "excoriación",
            "laceración", "avulsión", "abrasión",
            "orificio de entrada", "orificio de salida",
            "tatuaje de pólvora", "anillo de fish"
        ]
        
        # Órganos y anatomía
        anatomy_terms = [
            "encéfalo", "meninges", "duramadre", "aracnoides",
            "pulmón derecho", "pulmón izquierdo",
            "pericardio", "miocardio", "endocardio",
            "hígado", "bazo", "páncreas",
            "peritoneo", "epiplón", "mesenterio",
            "hemitórax", "hemicráneo"
        ]
        
        # Condiciones patológicas
        pathology_terms = [
            "congestivo", "edematoso", "antracosis",
            "atelectasia", "enfisema", "hemorragia",
            "hemorragia subaracnoidea", "hematoma subdural",
            "infarto", "necrosis", "cirrosis"
        ]
        
        all_terms = cadaveric_terms + lesion_terms + anatomy_terms + pathology_terms
        
        for term in all_terms:
            self.phrase_list.addPhrase(term)
    
    def start_continuous_recognition(
        self,
        on_recognizing: Callable[[str], None],
        on_recognized: Callable[[str], None],
        on_error: Callable[[str], None]
    ):
        """Inicia reconocimiento continuo con streaming."""
        
        # Usar micrófono por defecto
        audio_config = speechsdk.AudioConfig(use_default_microphone=True)
        
        self.recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config,
            audio_config=audio_config
        )
        
        # Configurar phrase list
        self.phrase_list = speechsdk.PhraseListGrammar.from_recognizer(
            self.recognizer
        )
        self._add_forensic_vocabulary()
        
        # Callbacks
        def handle_recognizing(evt):
            """Texto parcial mientras habla."""
            on_recognizing(evt.result.text)
        
        def handle_recognized(evt):
            """Texto final después de pausa."""
            if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                on_recognized(evt.result.text)
            elif evt.result.reason == speechsdk.ResultReason.NoMatch:
                on_error("No se detectó habla")
        
        def handle_canceled(evt):
            """Manejo de errores."""
            if evt.reason == speechsdk.CancellationReason.Error:
                on_error(f"Error: {evt.error_details}")
        
        self.recognizer.recognizing.connect(handle_recognizing)
        self.recognizer.recognized.connect(handle_recognized)
        self.recognizer.canceled.connect(handle_canceled)
        
        # Iniciar
        self.recognizer.start_continuous_recognition()
    
    def stop_recognition(self):
        """Detiene el reconocimiento."""
        if self.recognizer:
            self.recognizer.stop_continuous_recognition()
            self.recognizer = None
```

### 2.4 Uso con Azure OpenAI Whisper

```python
# Alternative: Azure OpenAI Whisper for batch transcription

from openai import AzureOpenAI
import base64

class AzureWhisperService:
    """Transcripción usando Whisper vía Azure OpenAI."""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_KEY"),
            api_version="2024-02-01",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
    
    def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe un archivo de audio completo."""
        
        with open(audio_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="es",
                prompt=self._get_forensic_prompt()
            )
        
        return transcript.text
    
    def _get_forensic_prompt(self) -> str:
        return """
        Transcripción de autopsia médico-legal en español.
        Términos frecuentes: livideces, rigidez cadavérica, 
        esquimosis, herida contusa, herida cortante, proyectil,
        orificio de entrada, orificio de salida, antracosis,
        congestión pulmonar, edema cerebral, hemorragia.
        """
```

---

## 3. Modo Edge (Fallback Offline)

### 3.1 Tecnología: Faster-Whisper

| Aspecto | Configuración |
|---------|---------------|
| **Modelo** | Whisper Large V3 |
| **Runtime** | Faster-Whisper (CTranslate2) |
| **Cuantización** | FP16 (GPU) o INT8 (CPU) |
| **VRAM requerida** | ~5GB |

### 3.2 Instalación

```bash
# Instalar faster-whisper
pip install faster-whisper

# Descargar modelo (primera vez)
python -c "from faster_whisper import WhisperModel; WhisperModel('large-v3')"
```

### 3.3 Implementación Python

```python
# services/whisper_local_service.py

import os
import queue
import threading
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
from typing import Callable, Optional

class WhisperLocalService:
    """Servicio de reconocimiento de voz local con Whisper."""
    
    def __init__(self, model_size: str = "large-v3"):
        # Determinar dispositivo
        self.device = "cuda" if self._has_gpu() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        
        print(f"Cargando Whisper {model_size} en {self.device}...")
        self.model = WhisperModel(
            model_size,
            device=self.device,
            compute_type=self.compute_type,
            download_root="./models/whisper"
        )
        print("Modelo cargado.")
        
        # Prompt con vocabulario forense
        self.initial_prompt = """
        Transcripción de autopsia médico-legal en español peruano.
        Términos frecuentes: livideces, rigidez cadavérica, esquimosis,
        cianosis, petequias, herida contusa, herida cortante, proyectil,
        orificio de entrada, orificio de salida, trayectoria, antracosis,
        congestión pulmonar, edema cerebral, hemorragia subaracnoidea.
        """
        
        # Audio config
        self.sample_rate = 16000
        self.channels = 1
        self.audio_queue = queue.Queue()
        self.is_recording = False
        self.recording_thread: Optional[threading.Thread] = None
    
    def _has_gpu(self) -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False
    
    def _audio_callback(self, indata, frames, time, status):
        """Callback para captura de audio."""
        if status:
            print(f"Audio status: {status}")
        self.audio_queue.put(indata.copy())
    
    def start_continuous_recognition(
        self,
        on_recognizing: Callable[[str], None],
        on_recognized: Callable[[str], None],
        on_error: Callable[[str], None],
        chunk_duration: float = 5.0
    ):
        """Inicia reconocimiento continuo."""
        
        self.is_recording = True
        
        def process_audio():
            audio_buffer = []
            
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype='float32',
                callback=self._audio_callback
            ):
                while self.is_recording:
                    try:
                        # Obtener chunk de audio
                        chunk = self.audio_queue.get(timeout=0.1)
                        audio_buffer.append(chunk)
                        
                        # Acumular hasta chunk_duration segundos
                        total_samples = sum(len(c) for c in audio_buffer)
                        duration = total_samples / self.sample_rate
                        
                        if duration >= chunk_duration:
                            # Concatenar y transcribir
                            audio_data = np.concatenate(audio_buffer, axis=0)
                            audio_flat = audio_data.flatten()
                            
                            try:
                                segments, info = self.model.transcribe(
                                    audio_flat,
                                    language="es",
                                    initial_prompt=self.initial_prompt,
                                    vad_filter=True,
                                    vad_parameters=dict(
                                        min_silence_duration_ms=500
                                    )
                                )
                                
                                text = " ".join([s.text for s in segments])
                                if text.strip():
                                    on_recognized(text.strip())
                                    
                            except Exception as e:
                                on_error(f"Error transcripción: {e}")
                            
                            # Limpiar buffer
                            audio_buffer = []
                            
                    except queue.Empty:
                        continue
        
        self.recording_thread = threading.Thread(target=process_audio)
        self.recording_thread.start()
    
    def stop_recognition(self):
        """Detiene el reconocimiento."""
        self.is_recording = False
        if self.recording_thread:
            self.recording_thread.join(timeout=2.0)
            self.recording_thread = None
    
    def transcribe_file(self, audio_path: str) -> str:
        """Transcribe un archivo de audio."""
        segments, info = self.model.transcribe(
            audio_path,
            language="es",
            initial_prompt=self.initial_prompt,
            vad_filter=True
        )
        
        return " ".join([s.text for s in segments])
```

---

## 4. Servicio Unificado

```python
# services/speech_service.py

import os
from enum import Enum
from typing import Callable, Optional

class SpeechMode(Enum):
    AZURE = "azure"
    EDGE = "edge"

class SpeechService:
    """Servicio unificado de reconocimiento de voz."""
    
    def __init__(self, preferred_mode: SpeechMode = SpeechMode.AZURE):
        self.mode = preferred_mode
        self._azure_service = None
        self._edge_service = None
        
        # Intentar inicializar Azure
        if preferred_mode == SpeechMode.AZURE:
            if self._check_azure_connection():
                from services.azure_speech_service import AzureSpeechService
                self._azure_service = AzureSpeechService()
                print("Usando Azure AI Speech")
            else:
                print("Azure no disponible, usando modo Edge")
                self.mode = SpeechMode.EDGE
        
        # Inicializar Edge como fallback
        if self.mode == SpeechMode.EDGE or self._azure_service is None:
            from services.whisper_local_service import WhisperLocalService
            self._edge_service = WhisperLocalService()
            self.mode = SpeechMode.EDGE
            print("Usando Whisper Local")
    
    def _check_azure_connection(self) -> bool:
        """Verifica conexión a Azure."""
        key = os.getenv("AZURE_SPEECH_KEY")
        if not key:
            return False
        
        try:
            import requests
            response = requests.get(
                "https://eastus.api.cognitive.microsoft.com/",
                timeout=3
            )
            return True
        except:
            return False
    
    def get_current_mode(self) -> SpeechMode:
        return self.mode
    
    def start_recognition(
        self,
        on_recognizing: Callable[[str], None],
        on_recognized: Callable[[str], None],
        on_error: Callable[[str], None]
    ):
        """Inicia reconocimiento con el servicio activo."""
        if self.mode == SpeechMode.AZURE and self._azure_service:
            self._azure_service.start_continuous_recognition(
                on_recognizing, on_recognized, on_error
            )
        else:
            self._edge_service.start_continuous_recognition(
                on_recognizing, on_recognized, on_error
            )
    
    def stop_recognition(self):
        """Detiene el reconocimiento."""
        if self.mode == SpeechMode.AZURE and self._azure_service:
            self._azure_service.stop_recognition()
        else:
            self._edge_service.stop_recognition()
    
    def transcribe_file(self, audio_path: str) -> str:
        """Transcribe un archivo de audio."""
        if self.mode == SpeechMode.AZURE and self._azure_service:
            # Usar Azure OpenAI Whisper para archivos
            from services.azure_speech_service import AzureWhisperService
            whisper = AzureWhisperService()
            return whisper.transcribe_audio(audio_path)
        else:
            return self._edge_service.transcribe_file(audio_path)
```

---

## 5. API Endpoints

```python
# routers/transcription.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from services.speech_service import SpeechService, SpeechMode

router = APIRouter(prefix="/api/transcription", tags=["transcription"])

speech_service = SpeechService()

@router.get("/mode")
async def get_mode():
    """Obtiene el modo actual de reconocimiento."""
    return {"mode": speech_service.get_current_mode().value}

@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """WebSocket para streaming de transcripción."""
    await websocket.accept()
    
    try:
        def on_recognizing(text: str):
            # Texto parcial
            websocket.send_json({"type": "partial", "text": text})
        
        def on_recognized(text: str):
            # Texto final
            websocket.send_json({"type": "final", "text": text})
        
        def on_error(error: str):
            websocket.send_json({"type": "error", "message": error})
        
        speech_service.start_recognition(
            on_recognizing, on_recognized, on_error
        )
        
        # Mantener conexión
        while True:
            data = await websocket.receive_text()
            if data == "stop":
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        speech_service.stop_recognition()

@router.post("/transcribe-file")
async def transcribe_file(audio_path: str):
    """Transcribe un archivo de audio."""
    try:
        text = speech_service.transcribe_file(audio_path)
        return {"text": text}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
```

---

## 6. Métricas de Calidad

### 6.1 WER (Word Error Rate)

```python
# utils/metrics.py

def calculate_wer(reference: str, hypothesis: str) -> float:
    """Calcula Word Error Rate."""
    import jiwer
    
    # Normalizar
    reference = reference.lower().strip()
    hypothesis = hypothesis.lower().strip()
    
    wer = jiwer.wer(reference, hypothesis)
    return wer

# Ejemplo de uso en tests
def test_forensic_terms():
    reference = "livideces dorsales fijas, rigidez generalizada"
    hypothesis = speech_service.transcribe_file("test_audio.wav")
    
    wer = calculate_wer(reference, hypothesis)
    assert wer < 0.05, f"WER {wer} excede límite 5%"
```

### 6.2 Benchmarks Esperados

| Condición | Azure | Edge (Whisper) |
|-----------|-------|----------------|
| Audio limpio | 3-5% WER | 5-8% WER |
| Ruido moderado | 5-8% WER | 8-12% WER |
| Terminología forense | 5-7% WER | 7-10% WER |

---

## 7. Configuración de Variables de Entorno

```bash
# .env

# Azure AI Speech
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus

# Azure OpenAI (para Whisper batch)
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/

# Configuración local
WHISPER_MODEL_SIZE=large-v3
WHISPER_DEVICE=cuda
```

---

## 8. Próximo Documento

→ `04_pipeline_ner.md` - Extracción de entidades con Azure OpenAI GPT-4
