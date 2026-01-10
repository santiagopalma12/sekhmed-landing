# 04. Pipeline NER (Extracción de Entidades)

## 1. Visión General

El pipeline NER extrae entidades médico-legales del texto transcrito y las mapea a los 109 campos del protocolo de necropsia.

| Modo | Tecnología | Uso |
|------|------------|-----|
| **Azure** ☁️ | Azure OpenAI GPT-4 | Extracción + mapeo en un paso |
| **Edge** 💻 | RigoBERTa Clinical + Reglas | Fallback sin internet |

---

## 2. Entidades Forenses

### 2.1 Definición de Entidades

| Entidad | Código | Descripción | Ejemplos |
|---------|--------|-------------|----------|
| **ORGAN** | ORG | Órganos anatómicos | pulmón derecho, hígado, encéfalo |
| **BODY_SITE** | BST | Regiones/ubicaciones | región frontal, hemitórax izquierdo |
| **LESION_TYPE** | LES | Tipos de lesión | herida contusa, equimosis, laceración |
| **MEASUREMENT** | MEA | Medidas y pesos | 3 por 2 cm, 450 gramos |
| **CONDITION** | CON | Estados patológicos | congestivo, edematoso, pálido |
| **CADAVERIC_SIGN** | CAD | Fenómenos cadavéricos | livideces dorsales, rigidez |
| **TIME_INTERVAL** | TIM | Intervalos temporales | 12 a 18 horas |
| **WEAPON** | WPN | Agentes causantes | proyectil, arma blanca |
| **SAMPLE** | SMP | Muestras tomadas | sangre, contenido gástrico |
| **WEIGHT** | WGT | Peso específico | 350 gramos |
| **TEMPERATURE** | TMP | Temperatura | 32 grados |

### 2.2 Formato de Salida

```json
{
  "entities": [
    {
      "text": "pulmón derecho",
      "type": "ORGAN",
      "start": 15,
      "end": 29
    },
    {
      "text": "450 gramos",
      "type": "WEIGHT",
      "start": 33,
      "end": 43
    },
    {
      "text": "congestivo",
      "type": "CONDITION",
      "start": 45,
      "end": 55
    }
  ],
  "mapped_fields": {
    "campo_60_pulmon_derecho": "congestivo",
    "peso_pulmon_derecho": 450
  }
}
```

---

## 3. Modo Azure (Predeterminado)

### 3.1 Azure OpenAI GPT-4

Usamos GPT-4 para extracción y mapeo en un solo paso mediante structured output.

### 3.2 System Prompt

```python
SYSTEM_PROMPT_NER = """
Eres un asistente especializado en documentación médico-legal forense.
Tu tarea es extraer información del dictado de autopsia y estructurarla
según el Protocolo de Necropsia del IMLCF Perú.

## INSTRUCCIONES

1. Extrae TODAS las entidades mencionadas del texto.
2. Mapea cada entidad al campo correspondiente del protocolo.
3. Responde ÚNICAMENTE con JSON válido.

## ENTIDADES A EXTRAER

- ORGAN: Órganos anatómicos (pulmón, hígado, corazón, encéfalo, etc.)
- BODY_SITE: Regiones anatómicas (región frontal, hemitórax, cuello, etc.)
- LESION_TYPE: Tipos de lesión (herida contusa, equimosis, laceración, etc.)
- MEASUREMENT: Medidas (3 por 2 centímetros, 5 milímetros, etc.)
- WEIGHT: Pesos (450 gramos, un kilo, etc.)
- CONDITION: Estados (congestivo, pálido, edematoso, necrótico, etc.)
- CADAVERIC_SIGN: Fenómenos cadavéricos (livideces, rigidez, putrefacción)
- TIME_INTERVAL: Tiempos (12 a 18 horas, 2 días, etc.)
- WEAPON: Agentes (proyectil, arma blanca, objeto contuso)
- SAMPLE: Muestras (sangre, orina, contenido gástrico)
- TEMPERATURE: Temperaturas (32 grados, 28°C)

## CAMPOS DEL PROTOCOLO IMLCF

### Fenómenos Cadavéricos (25-33)
- campo_25_livideces
- campo_26_rigidez
- campo_27_temperatura_rectal
- campo_33_tiempo_aproximado_muerte

### Examen Externo (34-48)
- campo_36_talla (en cm)
- campo_37_peso (en kg)
- campo_40_piel
- campo_41_craneo
- campo_42_cara
- campo_43_cuello
- campo_44_torax
- campo_45_abdomen

### Examen Interno (49-80)
- campo_60_pulmon_derecho
- campo_61_pulmon_izquierdo
- campo_63_corazon
- campo_72_higado
- peso_pulmon_derecho, peso_pulmon_izquierdo, peso_corazon, etc.

### Lesiones (81)
- campo_81_lesiones: array de objetos con tipo, ubicacion, dimensiones

### Conclusiones (103-109)
- campo_104_causas_muerte: {causa_final, causa_intermedia, causa_basica}

## EJEMPLO

Input: "Pulmón derecho de 520 gramos, congestivo con antracosis leve"

Output:
{
  "entities": [
    {"text": "Pulmón derecho", "type": "ORGAN"},
    {"text": "520 gramos", "type": "WEIGHT"},
    {"text": "congestivo", "type": "CONDITION"},
    {"text": "antracosis leve", "type": "CONDITION"}
  ],
  "mapped_fields": {
    "campo_60_pulmon_derecho": "Congestivo con antracosis leve",
    "peso_pulmon_derecho": 520
  }
}
"""
```

### 3.3 Implementación

```python
# services/azure_ner_service.py

import os
import json
from openai import AzureOpenAI
from typing import Dict, Any, List

class AzureNERService:
    """Servicio de extracción de entidades con Azure OpenAI."""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_KEY"),
            api_version="2024-02-01",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.model = os.getenv("AZURE_OPENAI_MODEL", "gpt-4")
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extrae entidades y mapea a campos del protocolo."""
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_NER},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,  # Baja temperatura para consistencia
            max_tokens=2000
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    
    def extract_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Extrae entidades de múltiples textos."""
        results = []
        for text in texts:
            result = self.extract_entities(text)
            results.append(result)
        return results
    
    def validate_mapped_fields(self, mapped: Dict) -> Dict[str, Any]:
        """Valida y normaliza campos extraídos."""
        validated = {}
        
        for field, value in mapped.items():
            # Convertir pesos a números
            if field.startswith("peso_"):
                if isinstance(value, str):
                    # Extraer número de "520 gramos"
                    import re
                    match = re.search(r'(\d+(?:\.\d+)?)', value)
                    if match:
                        validated[field] = float(match.group(1))
                else:
                    validated[field] = value
            
            # Campos de texto
            else:
                validated[field] = str(value).strip()
        
        return validated
```

### 3.4 Ejemplo de Uso

```python
# Ejemplo de extracción
service = AzureNERService()

dictado = """
Campo 60: Pulmón derecho de 520 gramos, congestivo con antracosis moderada.
Campo 61: Pulmón izquierdo de 480 gramos, similar al derecho.
Campo 63: Corazón de 340 gramos, sin alteraciones macroscópicas.
Lesión número 1: Herida contusa en región frontal derecha de 3 por 2 centímetros,
con bordes irregulares y equimosis perilesional.
"""

result = service.extract_entities(dictado)
print(json.dumps(result, indent=2, ensure_ascii=False))

# Output esperado:
# {
#   "entities": [...],
#   "mapped_fields": {
#     "campo_60_pulmon_derecho": "Congestivo con antracosis moderada",
#     "peso_pulmon_derecho": 520,
#     "campo_61_pulmon_izquierdo": "Similar al derecho",
#     "peso_pulmon_izquierdo": 480,
#     "campo_63_corazon": "Sin alteraciones macroscópicas",
#     "peso_corazon": 340,
#     "campo_81_lesiones": [
#       {
#         "numero": 1,
#         "tipo": "herida contusa",
#         "ubicacion": "región frontal derecha",
#         "dimensiones": "3 por 2 centímetros",
#         "caracteristicas": "bordes irregulares, equimosis perilesional"
#       }
#     ]
#   }
# }
```

---

## 4. Modo Edge (Fallback Offline)

### 4.1 RigoBERTa Clinical

Modelo BERT entrenado en español clínico para NER.

```python
# services/rigobert_ner_service.py

from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
import torch

class RigoBERTaNERService:
    """Servicio de NER local con RigoBERTa Clinical."""
    
    LABEL_MAP = {
        "B-ENFERMEDAD": "CONDITION",
        "I-ENFERMEDAD": "CONDITION",
        "B-ANATOMIA": "ORGAN",
        "I-ANATOMIA": "ORGAN",
        "B-PROCEDIMIENTO": "SAMPLE",
        "I-PROCEDIMIENTO": "SAMPLE",
        # Mapeos adicionales...
    }
    
    def __init__(self, model_name: str = "IIC/RigoBERTa-Clinical"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForTokenClassification.from_pretrained(model_name)
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        
        self.ner_pipeline = pipeline(
            "ner",
            model=self.model,
            tokenizer=self.tokenizer,
            aggregation_strategy="simple",
            device=0 if self.device == "cuda" else -1
        )
    
    def extract_entities(self, text: str) -> list:
        """Extrae entidades del texto."""
        entities = self.ner_pipeline(text)
        
        # Convertir a formato estándar
        result = []
        for ent in entities:
            entity_type = self.LABEL_MAP.get(ent["entity_group"], "OTHER")
            result.append({
                "text": ent["word"],
                "type": entity_type,
                "score": ent["score"],
                "start": ent["start"],
                "end": ent["end"]
            })
        
        return result
```

### 4.2 Extracción de Medidas con Regex

```python
# services/measurement_extractor.py

import re
from typing import List, Dict

class MeasurementExtractor:
    """Extrae medidas, pesos y temperaturas del texto."""
    
    PATTERNS = {
        "WEIGHT": [
            r'(\d+(?:[.,]\d+)?)\s*(?:gramos?|gr?|g)\b',
            r'(\d+(?:[.,]\d+)?)\s*(?:kilogramos?|kilos?|kg)\b',
        ],
        "MEASUREMENT": [
            r'(\d+(?:[.,]\d+)?)\s*(?:por|x)\s*(\d+(?:[.,]\d+)?)\s*(?:centímetros?|cm)\b',
            r'(\d+(?:[.,]\d+)?)\s*(?:centímetros?|cm)\b',
            r'(\d+(?:[.,]\d+)?)\s*(?:milímetros?|mm)\b',
        ],
        "TEMPERATURE": [
            r'(\d+(?:[.,]\d+)?)\s*(?:grados?|°C?)\b',
        ],
        "TIME_INTERVAL": [
            r'(\d+)\s*(?:a|hasta|-)\s*(\d+)\s*horas?\b',
            r'(\d+)\s*horas?\b',
            r'(\d+)\s*días?\b',
        ]
    }
    
    def extract(self, text: str) -> List[Dict]:
        """Extrae todas las medidas del texto."""
        entities = []
        
        for entity_type, patterns in self.PATTERNS.items():
            for pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    entities.append({
                        "text": match.group(0),
                        "type": entity_type,
                        "value": match.groups(),
                        "start": match.start(),
                        "end": match.end()
                    })
        
        return entities
```

### 4.3 Mapeo basado en Reglas

```python
# services/field_mapper.py

from typing import Dict, List, Any

class FieldMapper:
    """Mapea entidades a campos del protocolo."""
    
    ORGAN_TO_FIELD = {
        "pulmón derecho": "campo_60_pulmon_derecho",
        "pulmón izquierdo": "campo_61_pulmon_izquierdo",
        "corazón": "campo_63_corazon",
        "hígado": "campo_72_higado",
        "bazo": "campo_74_bazo",
        "páncreas": "campo_75_pancreas",
        "encéfalo": "campo_52_encefalo",
        # ... más mapeos
    }
    
    ORGAN_TO_WEIGHT = {
        "pulmón derecho": "peso_pulmon_derecho",
        "pulmón izquierdo": "peso_pulmon_izquierdo",
        "corazón": "peso_corazon",
        "hígado": "peso_higado",
        "bazo": "peso_bazo",
        "encéfalo": "peso_encefalo",
    }
    
    SITE_TO_FIELD = {
        "región frontal": "campo_42_cara",
        "cráneo": "campo_41_craneo",
        "cuello": "campo_43_cuello",
        "tórax": "campo_44_torax",
        "abdomen": "campo_45_abdomen",
        # ... más mapeos
    }
    
    def map_entities_to_fields(
        self,
        entities: List[Dict],
        text: str
    ) -> Dict[str, Any]:
        """Mapea lista de entidades a campos del protocolo."""
        
        mapped = {}
        current_organ = None
        
        for entity in entities:
            etype = entity["type"]
            etext = entity["text"].lower()
            
            if etype == "ORGAN":
                current_organ = etext
                if etext in self.ORGAN_TO_FIELD:
                    field = self.ORGAN_TO_FIELD[etext]
                    mapped[field] = self._collect_description(entities, entity)
            
            elif etype == "WEIGHT" and current_organ:
                if current_organ in self.ORGAN_TO_WEIGHT:
                    field = self.ORGAN_TO_WEIGHT[current_organ]
                    mapped[field] = self._parse_weight(etext)
            
            elif etype == "LESION_TYPE":
                if "campo_81_lesiones" not in mapped:
                    mapped["campo_81_lesiones"] = []
                mapped["campo_81_lesiones"].append(
                    self._build_lesion(entities, entity)
                )
        
        return mapped
    
    def _parse_weight(self, text: str) -> float:
        """Convierte texto de peso a número."""
        import re
        match = re.search(r'(\d+(?:[.,]\d+)?)', text)
        if match:
            return float(match.group(1).replace(',', '.'))
        return 0
    
    def _collect_description(self, entities: List, organ_entity: Dict) -> str:
        """Recolecta descripción de un órgano."""
        # Buscar CONDITION cercanos al órgano
        conditions = []
        for e in entities:
            if e["type"] == "CONDITION":
                # Si está cerca del órgano
                if abs(e["start"] - organ_entity["end"]) < 50:
                    conditions.append(e["text"])
        return ", ".join(conditions) if conditions else ""
    
    def _build_lesion(self, entities: List, lesion_entity: Dict) -> Dict:
        """Construye objeto de lesión."""
        lesion = {
            "tipo": lesion_entity["text"],
            "ubicacion": "",
            "dimensiones": ""
        }
        
        # Buscar BODY_SITE y MEASUREMENT cercanos
        for e in entities:
            if e["type"] == "BODY_SITE" and abs(e["start"] - lesion_entity["end"]) < 100:
                lesion["ubicacion"] = e["text"]
            elif e["type"] == "MEASUREMENT" and abs(e["start"] - lesion_entity["end"]) < 100:
                lesion["dimensiones"] = e["text"]
        
        return lesion
```

---

## 5. Servicio Unificado

```python
# services/ner_service.py

from enum import Enum
from typing import Dict, Any
import os

class NERMode(Enum):
    AZURE = "azure"
    EDGE = "edge"

class NERService:
    """Servicio unificado de extracción de entidades."""
    
    def __init__(self, preferred_mode: NERMode = NERMode.AZURE):
        self.mode = preferred_mode
        self._azure_service = None
        self._edge_service = None
        
        if preferred_mode == NERMode.AZURE:
            if self._check_azure():
                from services.azure_ner_service import AzureNERService
                self._azure_service = AzureNERService()
            else:
                self.mode = NERMode.EDGE
        
        if self.mode == NERMode.EDGE:
            from services.rigobert_ner_service import RigoBERTaNERService
            from services.measurement_extractor import MeasurementExtractor
            from services.field_mapper import FieldMapper
            
            self._edge_service = RigoBERTaNERService()
            self._measurement_extractor = MeasurementExtractor()
            self._field_mapper = FieldMapper()
    
    def _check_azure(self) -> bool:
        return bool(os.getenv("AZURE_OPENAI_KEY"))
    
    def extract_and_map(self, text: str) -> Dict[str, Any]:
        """Extrae entidades y mapea a campos."""
        
        if self.mode == NERMode.AZURE and self._azure_service:
            result = self._azure_service.extract_entities(text)
            return {
                "entities": result.get("entities", []),
                "mapped_fields": result.get("mapped_fields", {}),
                "mode": "azure"
            }
        else:
            # Modo Edge: combinar NER + regex + mapeo
            entities = self._edge_service.extract_entities(text)
            measurements = self._measurement_extractor.extract(text)
            
            all_entities = entities + measurements
            mapped = self._field_mapper.map_entities_to_fields(all_entities, text)
            
            return {
                "entities": all_entities,
                "mapped_fields": mapped,
                "mode": "edge"
            }
```

---

## 6. API Endpoints

```python
# routers/ner.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from services.ner_service import NERService

router = APIRouter(prefix="/api/ner", tags=["ner"])
ner_service = NERService()

class ExtractionRequest(BaseModel):
    text: str

class ExtractionResponse(BaseModel):
    entities: List[Dict[str, Any]]
    mapped_fields: Dict[str, Any]
    mode: str

@router.post("/extract", response_model=ExtractionResponse)
async def extract_entities(request: ExtractionRequest):
    """Extrae entidades y mapea a campos del protocolo."""
    result = ner_service.extract_and_map(request.text)
    return result

@router.get("/mode")
async def get_mode():
    """Obtiene el modo actual de NER."""
    return {"mode": ner_service.mode.value}
```

---

## 7. Métricas de Calidad

### 7.1 F1-Score por Entidad

```python
# utils/ner_metrics.py

from sklearn.metrics import precision_recall_fscore_support

def evaluate_ner(predictions: list, ground_truth: list) -> dict:
    """Evalúa precisión del NER."""
    
    # Convertir a formato comparable
    pred_labels = [e["type"] for e in predictions]
    true_labels = [e["type"] for e in ground_truth]
    
    precision, recall, f1, _ = precision_recall_fscore_support(
        true_labels, pred_labels, average='weighted'
    )
    
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }
```

### 7.2 Benchmarks Esperados

| Entidad | Azure GPT-4 | Edge RigoBERTa |
|---------|-------------|----------------|
| ORGAN | 0.95+ | 0.88+ |
| LESION_TYPE | 0.92+ | 0.85+ |
| MEASUREMENT | 0.98+ | 0.95+ |
| CONDITION | 0.90+ | 0.80+ |
| **Promedio** | **0.93+** | **0.87+** |

---

## 8. Próximo Documento

→ `05_generacion_documentos.md` - Generación de PDF con Azure Document Intelligence
