# 05. Generación de Documentos

## 1. Visión General

Este módulo genera los documentos de salida del protocolo de necropsia en múltiples formatos.

| Formato | Uso | Tecnología |
|---------|-----|------------|
| **PDF** | Impresión, archivo oficial | Azure Doc Intelligence / WeasyPrint |
| **JSON FHIR** | Interoperabilidad | HL7 FHIR DiagnosticReport |
| **CSV** | Importación a Forensys | Mapeo directo |

---

## 2. Generación de PDF

### 2.1 Modo Azure: Document Intelligence

```python
# services/azure_document_service.py

import os
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from typing import Dict, Any

class AzureDocumentService:
    """Genera PDFs usando Azure Document Intelligence."""
    
    def __init__(self):
        self.client = DocumentIntelligenceClient(
            endpoint=os.getenv("AZURE_DOC_INTEL_ENDPOINT"),
            credential=AzureKeyCredential(os.getenv("AZURE_DOC_INTEL_KEY"))
        )
    
    def generate_protocol_pdf(
        self,
        case_data: Dict[str, Any],
        output_path: str
    ) -> str:
        """Genera PDF del protocolo de necropsia."""
        
        # Usar template HTML + Azure para renderizar
        html_content = self._build_html(case_data)
        
        # Por ahora usamos WeasyPrint ya que Doc Intelligence
        # es más para análisis que generación
        return self._render_with_weasyprint(html_content, output_path)
    
    def _build_html(self, data: Dict) -> str:
        """Construye HTML del protocolo."""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                {self._get_styles()}
            </style>
        </head>
        <body>
            {self._render_header(data)}
            {self._render_administrative(data)}
            {self._render_cadaveric_signs(data)}
            {self._render_external_exam(data)}
            {self._render_internal_exam(data)}
            {self._render_lesions(data)}
            {self._render_conclusions(data)}
            {self._render_signatures(data)}
        </body>
        </html>
        """
    
    def _get_styles(self) -> str:
        return """
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 14pt;
            margin: 0;
        }
        .header h2 {
            font-size: 12pt;
            font-weight: normal;
            margin: 5px 0;
        }
        .section {
            margin-bottom: 15px;
        }
        .section-title {
            font-weight: bold;
            font-size: 12pt;
            border-bottom: 1px solid #000;
            margin-bottom: 10px;
        }
        .field {
            margin-bottom: 8px;
        }
        .field-label {
            font-weight: bold;
        }
        .field-value {
            margin-left: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        td, th {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
        }
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin-top: 50px;
            text-align: center;
        }
        """
    
    def _render_header(self, data: Dict) -> str:
        return f"""
        <div class="header">
            <h1>MINISTERIO PÚBLICO</h1>
            <h2>INSTITUTO DE MEDICINA LEGAL Y CIENCIAS FORENSES</h2>
            <h1>PROTOCOLO DE NECROPSIA Nº {data.get('campo_01_protocolo_numero', '')}</h1>
        </div>
        """
    
    def _render_administrative(self, data: Dict) -> str:
        admin = data.get('seccion_i_datos_administrativos', {})
        return f"""
        <div class="section">
            <div class="section-title">I. DATOS ADMINISTRATIVOS</div>
            <table>
                <tr>
                    <td><strong>Distrito Judicial:</strong> {admin.get('campo_02_distrito_judicial', '')}</td>
                    <td><strong>Fecha:</strong> {admin.get('campo_03_fecha_necropsia', '')}</td>
                </tr>
                <tr>
                    <td><strong>División Médico Legal:</strong> {admin.get('campo_04_division_medico_legal', '')}</td>
                    <td><strong>Fiscalía:</strong> {admin.get('campo_05_fiscalia', '')}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Nombre del Fallecido:</strong> {admin.get('campo_09_nombre_fallecido', 'NN')}</td>
                </tr>
                <tr>
                    <td><strong>Edad:</strong> {admin.get('campo_10_edad', '')}</td>
                    <td><strong>Sexo:</strong> {admin.get('campo_11_sexo', '')}</td>
                </tr>
            </table>
        </div>
        """
    
    def _render_cadaveric_signs(self, data: Dict) -> str:
        signs = data.get('seccion_iii_fenomenos_cadavericos', {})
        livideces = signs.get('campo_25_livideces', {})
        rigidez = signs.get('campo_26_rigidez', {})
        
        return f"""
        <div class="section">
            <div class="section-title">II. FENÓMENOS CADAVÉRICOS</div>
            <div class="field">
                <span class="field-label">Livideces:</span>
                <span class="field-value">
                    {livideces.get('ubicacion', '')} - {livideces.get('grado', '')} - 
                    {livideces.get('caracteristicas', '')}
                </span>
            </div>
            <div class="field">
                <span class="field-label">Rigidez:</span>
                <span class="field-value">
                    {rigidez.get('ubicacion', '')} - {rigidez.get('grado', '')}
                </span>
            </div>
            <div class="field">
                <span class="field-label">Temperatura Rectal:</span>
                <span class="field-value">{signs.get('campo_27_temperatura_rectal', '')}°C</span>
            </div>
            <div class="field">
                <span class="field-label">Tiempo Aprox. de Muerte:</span>
                <span class="field-value">{signs.get('campo_33_tiempo_aproximado_muerte', '')}</span>
            </div>
        </div>
        """
    
    def _render_external_exam(self, data: Dict) -> str:
        ext = data.get('seccion_iv_examen_externo', {})
        return f"""
        <div class="section">
            <div class="section-title">III. EXAMEN EXTERNO</div>
            <table>
                <tr>
                    <td><strong>Talla:</strong> {ext.get('campo_36_talla', '')} cm</td>
                    <td><strong>Peso:</strong> {ext.get('campo_37_peso', '')} kg</td>
                </tr>
                <tr>
                    <td><strong>Constitución:</strong> {ext.get('campo_34_constitucion', '')}</td>
                    <td><strong>Raza:</strong> {ext.get('campo_35_raza', '')}</td>
                </tr>
            </table>
            <div class="field">
                <span class="field-label">Piel:</span>
                <span class="field-value">{ext.get('campo_40_piel', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Cráneo:</span>
                <span class="field-value">{ext.get('campo_41_craneo', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Cara:</span>
                <span class="field-value">{ext.get('campo_42_cara', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Cuello:</span>
                <span class="field-value">{ext.get('campo_43_cuello', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Tórax:</span>
                <span class="field-value">{ext.get('campo_44_torax', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Abdomen:</span>
                <span class="field-value">{ext.get('campo_45_abdomen', '')}</span>
            </div>
        </div>
        """
    
    def _render_internal_exam(self, data: Dict) -> str:
        internal = data.get('seccion_v_examen_interno', {})
        torax = internal.get('torax', {})
        abdomen = internal.get('abdomen', {})
        
        return f"""
        <div class="section">
            <div class="section-title">IV. EXAMEN INTERNO</div>
            
            <h4>A. Cabeza</h4>
            <div class="field">
                <span class="field-label">Encéfalo:</span>
                <span class="field-value">
                    {internal.get('cabeza', {}).get('campo_52_encefalo', '')}
                    (Peso: {internal.get('cabeza', {}).get('peso_encefalo', '')}g)
                </span>
            </div>
            
            <h4>B. Tórax</h4>
            <div class="field">
                <span class="field-label">Pulmón Derecho:</span>
                <span class="field-value">
                    {torax.get('campo_60_pulmon_derecho', '')}
                    (Peso: {torax.get('peso_pulmon_derecho', '')}g)
                </span>
            </div>
            <div class="field">
                <span class="field-label">Pulmón Izquierdo:</span>
                <span class="field-value">
                    {torax.get('campo_61_pulmon_izquierdo', '')}
                    (Peso: {torax.get('peso_pulmon_izquierdo', '')}g)
                </span>
            </div>
            <div class="field">
                <span class="field-label">Corazón:</span>
                <span class="field-value">
                    {torax.get('campo_63_corazon', '')}
                    (Peso: {torax.get('peso_corazon', '')}g)
                </span>
            </div>
            
            <h4>C. Abdomen</h4>
            <div class="field">
                <span class="field-label">Hígado:</span>
                <span class="field-value">
                    {abdomen.get('campo_72_higado', '')}
                    (Peso: {abdomen.get('peso_higado', '')}g)
                </span>
            </div>
            <div class="field">
                <span class="field-label">Bazo:</span>
                <span class="field-value">
                    {abdomen.get('campo_74_bazo', '')}
                    (Peso: {abdomen.get('peso_bazo', '')}g)
                </span>
            </div>
        </div>
        """
    
    def _render_lesions(self, data: Dict) -> str:
        lesions = data.get('seccion_vi_lesiones_traumaticas', {}).get('campo_81_lesiones', [])
        
        if not lesions:
            return """
            <div class="section">
                <div class="section-title">V. LESIONES TRAUMÁTICAS</div>
                <p>No se observan lesiones traumáticas.</p>
            </div>
            """
        
        rows = ""
        for i, lesion in enumerate(lesions, 1):
            rows += f"""
            <tr>
                <td>{i}</td>
                <td>{lesion.get('tipo', '')}</td>
                <td>{lesion.get('ubicacion', '')}</td>
                <td>{lesion.get('dimensiones', '')}</td>
                <td>{lesion.get('caracteristicas', '')}</td>
            </tr>
            """
        
        return f"""
        <div class="section">
            <div class="section-title">V. LESIONES TRAUMÁTICAS</div>
            <table>
                <tr>
                    <th>Nº</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Dimensiones</th>
                    <th>Características</th>
                </tr>
                {rows}
            </table>
        </div>
        """
    
    def _render_conclusions(self, data: Dict) -> str:
        concl = data.get('seccion_ix_conclusiones', {})
        causas = concl.get('campo_104_causas_muerte', {})
        
        return f"""
        <div class="section">
            <div class="section-title">VI. CONCLUSIONES</div>
            <div class="field">
                <span class="field-label">Causa Final:</span>
                <span class="field-value">{causas.get('causa_final', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Causa Intermedia:</span>
                <span class="field-value">{causas.get('causa_intermedia', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Causa Básica:</span>
                <span class="field-value">{causas.get('causa_basica', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Código CIE-10:</span>
                <span class="field-value">{concl.get('codigo_cie10', '')}</span>
            </div>
            <div class="field">
                <span class="field-label">Agentes Causantes:</span>
                <span class="field-value">{concl.get('campo_105_agentes_causantes', '')}</span>
            </div>
        </div>
        """
    
    def _render_signatures(self, data: Dict) -> str:
        return """
        <div class="signature-section">
            <table style="border: none;">
                <tr style="border: none;">
                    <td style="border: none; text-align: center;">
                        <div class="signature-line">
                            Médico Legista
                        </div>
                    </td>
                    <td style="border: none; text-align: center;">
                        <div class="signature-line">
                            V°B° Director
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        """
    
    def _render_with_weasyprint(self, html: str, output_path: str) -> str:
        """Renderiza HTML a PDF con WeasyPrint."""
        from weasyprint import HTML
        
        HTML(string=html).write_pdf(output_path)
        return output_path
```

### 2.2 Modo Edge: WeasyPrint Local

```python
# services/local_document_service.py

from weasyprint import HTML
from typing import Dict, Any

class LocalDocumentService:
    """Genera PDFs localmente con WeasyPrint."""
    
    def generate_protocol_pdf(
        self,
        case_data: Dict[str, Any],
        output_path: str
    ) -> str:
        """Genera PDF del protocolo."""
        
        # Reutiliza el builder de Azure
        from services.azure_document_service import AzureDocumentService
        azure_service = AzureDocumentService()
        
        html_content = azure_service._build_html(case_data)
        HTML(string=html_content).write_pdf(output_path)
        
        return output_path
```

---

## 3. Generación FHIR

### 3.1 Modelo DiagnosticReport

```python
# services/fhir_service.py

import json
from datetime import datetime
from typing import Dict, Any
from uuid import uuid4

class FHIRService:
    """Genera documentos FHIR R4."""
    
    def generate_diagnostic_report(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Genera DiagnosticReport FHIR R4."""
        
        admin = case_data.get('seccion_i_datos_administrativos', {})
        concl = case_data.get('seccion_ix_conclusiones', {})
        
        return {
            "resourceType": "DiagnosticReport",
            "id": str(uuid4()),
            "meta": {
                "profile": [
                    "http://hl7.org/fhir/StructureDefinition/DiagnosticReport"
                ]
            },
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                            "code": "PAT",
                            "display": "Pathology"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "18743-5",
                        "display": "Autopsy report"
                    }
                ],
                "text": "Protocolo de Necropsia"
            },
            "subject": self._build_subject(admin),
            "effectiveDateTime": admin.get('campo_03_fecha_necropsia', 
                                           datetime.now().isoformat()),
            "issued": datetime.now().isoformat(),
            "performer": self._build_performers(case_data),
            "result": self._build_observations(case_data),
            "conclusion": self._build_conclusion(concl),
            "conclusionCode": self._build_conclusion_codes(concl)
        }
    
    def _build_subject(self, admin: Dict) -> Dict:
        """Construye referencia al paciente/fallecido."""
        return {
            "reference": f"Patient/{uuid4()}",
            "display": admin.get('campo_09_nombre_fallecido', 'NN'),
            "extension": [
                {
                    "url": "http://forensia.pe/fhir/extension/deceased-age",
                    "valueString": admin.get('campo_10_edad', '')
                },
                {
                    "url": "http://forensia.pe/fhir/extension/deceased-sex",
                    "valueCode": self._map_sex(admin.get('campo_11_sexo', ''))
                }
            ]
        }
    
    def _map_sex(self, sex: str) -> str:
        mapping = {
            "Masculino": "male",
            "Femenino": "female",
            "Indeterminado": "unknown"
        }
        return mapping.get(sex, "unknown")
    
    def _build_performers(self, data: Dict) -> list:
        """Construye lista de médicos."""
        autopsia = data.get('seccion_ii_autopsia', {})
        medicos = autopsia.get('campo_21_practicada_por', [])
        
        return [
            {
                "reference": f"Practitioner/{uuid4()}",
                "display": medico
            }
            for medico in medicos
        ]
    
    def _build_observations(self, data: Dict) -> list:
        """Construye observaciones de hallazgos."""
        observations = []
        
        # Fenómenos cadavéricos
        signs = data.get('seccion_iii_fenomenos_cadavericos', {})
        if signs.get('campo_33_tiempo_aproximado_muerte'):
            observations.append({
                "reference": f"Observation/{uuid4()}",
                "display": f"Tiempo de muerte: {signs['campo_33_tiempo_aproximado_muerte']}"
            })
        
        # Examen interno - pesos
        internal = data.get('seccion_v_examen_interno', {})
        torax = internal.get('torax', {})
        
        organ_weights = [
            ('peso_corazon', 'Peso corazón'),
            ('peso_pulmon_derecho', 'Peso pulmón derecho'),
            ('peso_pulmon_izquierdo', 'Peso pulmón izquierdo'),
            ('peso_higado', 'Peso hígado'),
        ]
        
        for field, display in organ_weights:
            weight = torax.get(field) or internal.get('abdomen', {}).get(field)
            if weight:
                observations.append({
                    "reference": f"Observation/{uuid4()}",
                    "display": f"{display}: {weight}g"
                })
        
        return observations
    
    def _build_conclusion(self, concl: Dict) -> str:
        """Construye texto de conclusión."""
        causas = concl.get('campo_104_causas_muerte', {})
        parts = []
        
        if causas.get('causa_final'):
            parts.append(f"Causa final: {causas['causa_final']}")
        if causas.get('causa_basica'):
            parts.append(f"Causa básica: {causas['causa_basica']}")
        
        return ". ".join(parts)
    
    def _build_conclusion_codes(self, concl: Dict) -> list:
        """Construye códigos CIE-10 de conclusión."""
        cie10 = concl.get('codigo_cie10', '')
        
        if not cie10:
            return []
        
        return [
            {
                "coding": [
                    {
                        "system": "http://hl7.org/fhir/sid/icd-10",
                        "code": cie10
                    }
                ]
            }
        ]
    
    def to_json(self, fhir_resource: Dict) -> str:
        """Serializa a JSON."""
        return json.dumps(fhir_resource, indent=2, ensure_ascii=False)
```

---

## 4. Exportación CSV (Forensys)

```python
# services/csv_service.py

import csv
from typing import Dict, Any
from io import StringIO

class CSVExportService:
    """Exporta datos para importación a Forensys."""
    
    FORENSYS_COLUMNS = [
        'protocolo_numero',
        'fecha_necropsia',
        'nombre_fallecido',
        'edad',
        'sexo',
        'talla',
        'peso',
        'causa_final',
        'causa_basica',
        'codigo_cie10',
        # ... más campos según Forensys
    ]
    
    def export_case(self, case_data: Dict[str, Any]) -> str:
        """Exporta un caso a CSV."""
        
        admin = case_data.get('seccion_i_datos_administrativos', {})
        external = case_data.get('seccion_iv_examen_externo', {})
        concl = case_data.get('seccion_ix_conclusiones', {})
        causas = concl.get('campo_104_causas_muerte', {})
        
        row = {
            'protocolo_numero': admin.get('campo_01_protocolo_numero', ''),
            'fecha_necropsia': admin.get('campo_03_fecha_necropsia', ''),
            'nombre_fallecido': admin.get('campo_09_nombre_fallecido', 'NN'),
            'edad': admin.get('campo_10_edad', ''),
            'sexo': admin.get('campo_11_sexo', ''),
            'talla': external.get('campo_36_talla', ''),
            'peso': external.get('campo_37_peso', ''),
            'causa_final': causas.get('causa_final', ''),
            'causa_basica': causas.get('causa_basica', ''),
            'codigo_cie10': concl.get('codigo_cie10', ''),
        }
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=self.FORENSYS_COLUMNS)
        writer.writeheader()
        writer.writerow(row)
        
        return output.getvalue()
    
    def export_batch(self, cases: list) -> str:
        """Exporta múltiples casos."""
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=self.FORENSYS_COLUMNS)
        writer.writeheader()
        
        for case_data in cases:
            # ... similar a export_case
            pass
        
        return output.getvalue()
```

---

## 5. Servicio Unificado

```python
# services/document_service.py

import os
import hashlib
from typing import Dict, Any
from datetime import datetime

class DocumentService:
    """Servicio unificado de generación de documentos."""
    
    def __init__(self):
        self._pdf_service = None
        self._fhir_service = None
        self._csv_service = None
        
        # Lazy loading
    
    def _get_pdf_service(self):
        if not self._pdf_service:
            # Siempre usamos WeasyPrint para PDF
            from services.local_document_service import LocalDocumentService
            self._pdf_service = LocalDocumentService()
        return self._pdf_service
    
    def _get_fhir_service(self):
        if not self._fhir_service:
            from services.fhir_service import FHIRService
            self._fhir_service = FHIRService()
        return self._fhir_service
    
    def _get_csv_service(self):
        if not self._csv_service:
            from services.csv_service import CSVExportService
            self._csv_service = CSVExportService()
        return self._csv_service
    
    def generate_all(
        self,
        case_data: Dict[str, Any],
        output_dir: str
    ) -> Dict[str, str]:
        """Genera todos los formatos de salida."""
        
        protocol_num = case_data.get(
            'seccion_i_datos_administrativos', {}
        ).get('campo_01_protocolo_numero', 'unknown')
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base_name = f"protocolo_{protocol_num}_{timestamp}"
        
        results = {}
        
        # PDF
        pdf_path = os.path.join(output_dir, f"{base_name}.pdf")
        self._get_pdf_service().generate_protocol_pdf(case_data, pdf_path)
        results['pdf'] = pdf_path
        results['pdf_hash'] = self._hash_file(pdf_path)
        
        # FHIR JSON
        fhir_path = os.path.join(output_dir, f"{base_name}_fhir.json")
        fhir_data = self._get_fhir_service().generate_diagnostic_report(case_data)
        with open(fhir_path, 'w', encoding='utf-8') as f:
            f.write(self._get_fhir_service().to_json(fhir_data))
        results['fhir'] = fhir_path
        
        # CSV
        csv_path = os.path.join(output_dir, f"{base_name}.csv")
        csv_content = self._get_csv_service().export_case(case_data)
        with open(csv_path, 'w', encoding='utf-8') as f:
            f.write(csv_content)
        results['csv'] = csv_path
        
        return results
    
    def _hash_file(self, filepath: str) -> str:
        """Calcula SHA-256 del archivo."""
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for block in iter(lambda: f.read(4096), b''):
                sha256.update(block)
        return sha256.hexdigest()
```

---

## 6. API Endpoints

```python
# routers/export.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any
import os

from services.document_service import DocumentService

router = APIRouter(prefix="/api/export", tags=["export"])
document_service = DocumentService()

OUTPUT_DIR = os.getenv("EXPORT_DIR", "./exports")

class ExportRequest(BaseModel):
    case_id: str
    case_data: Dict[str, Any]

@router.post("/all")
async def export_all_formats(request: ExportRequest):
    """Exporta caso en todos los formatos."""
    
    results = document_service.generate_all(
        request.case_data,
        OUTPUT_DIR
    )
    
    return {
        "status": "success",
        "files": results
    }

@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    """Exporta solo PDF."""
    
    pdf_path = os.path.join(
        OUTPUT_DIR,
        f"protocolo_{request.case_id}.pdf"
    )
    
    document_service._get_pdf_service().generate_protocol_pdf(
        request.case_data,
        pdf_path
    )
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path)
    )

@router.post("/fhir")
async def export_fhir(request: ExportRequest):
    """Exporta FHIR DiagnosticReport."""
    
    fhir_data = document_service._get_fhir_service().generate_diagnostic_report(
        request.case_data
    )
    
    return fhir_data
```

---

## 7. Integración con Cadena de Custodia

```python
# services/chain_of_custody.py

import hashlib
from datetime import datetime
from typing import Dict

class ChainOfCustody:
    """Gestiona la cadena de custodia digital."""
    
    def sign_document(
        self,
        filepath: str,
        user_id: str,
        case_id: str
    ) -> Dict:
        """Firma digitalmente un documento."""
        
        file_hash = self._hash_file(filepath)
        timestamp = datetime.now().isoformat()
        
        signature = {
            "file_path": filepath,
            "file_hash": file_hash,
            "signed_by": user_id,
            "case_id": case_id,
            "timestamp": timestamp,
            "signature": self._create_signature(
                file_hash, user_id, timestamp
            )
        }
        
        return signature
    
    def _hash_file(self, filepath: str) -> str:
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for block in iter(lambda: f.read(4096), b''):
                sha256.update(block)
        return sha256.hexdigest()
    
    def _create_signature(
        self,
        file_hash: str,
        user_id: str,
        timestamp: str
    ) -> str:
        """Crea firma combinando hash + user + tiempo."""
        data = f"{file_hash}:{user_id}:{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def verify_document(
        self,
        filepath: str,
        signature: Dict
    ) -> bool:
        """Verifica integridad del documento."""
        current_hash = self._hash_file(filepath)
        return current_hash == signature["file_hash"]
```

---

## 8. Próximo Documento

→ `06_interfaz_usuario.md` - Diseño de la interfaz Electron + React
