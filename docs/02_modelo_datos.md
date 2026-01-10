# 02. Modelo de Datos ForensIA

## 1. Estructura del Protocolo de Necropsia IMLCF

Basado en la Cartilla de Llenado del Protocolo de Necropsia (Resolución 704-98-MP-CEMP), este documento define el esquema de datos que ForensIA debe manejar.

### 1.1 Resumen de Secciones

| Sección | Campos | Responsable | Complejidad IA |
|---------|--------|-------------|----------------|
| I. Datos Administrativos | 1-20 | Mesa Recepción | Baja (no IA) |
| II. Fenómenos Cadavéricos | 25-33 | Médico | Media |
| III. Examen Externo | 34-48 | Médico | **Alta** |
| IV. Examen Interno | 49-80 | Médico | **Muy Alta** |
| V. Lesiones Traumáticas | 81 | Médico | **Muy Alta** |
| VI. Datos Internos Morgue | 82 | Técnico | Baja |
| VII. Exámenes Auxiliares | 83-102 | Médico | Media |
| VIII. Conclusiones | 103-109 | Médico | Alta |

---

## 2. Esquema JSON Completo

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProtocoloNecropsia",
  "description": "Protocolo de Necropsia IMLCF Perú - 109 campos",
  "type": "object",
  "properties": {
    
    "metadata": {
      "type": "object",
      "description": "Metadatos del caso en ForensIA",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "created_at": { "type": "string", "format": "date-time" },
        "updated_at": { "type": "string", "format": "date-time" },
        "status": { "enum": ["draft", "in_progress", "review", "completed", "exported"] },
        "mode": { "enum": ["azure", "edge"] },
        "audio_path": { "type": "string" },
        "hash_audio": { "type": "string" },
        "hash_transcript": { "type": "string" }
      }
    },

    "seccion_i_datos_administrativos": {
      "type": "object",
      "description": "Campos 1-20: Llenados por Mesa de Recepción",
      "properties": {
        "campo_01_protocolo_numero": { "type": "string", "description": "Número correlativo" },
        "campo_02_distrito_judicial": { "type": "string" },
        "campo_03_fecha_necropsia": { "type": "string", "format": "date" },
        "campo_04_division_medico_legal": { "type": "string" },
        "campo_05_fiscalia": { "type": "string" },
        "campo_06_autoridad_policial": { "type": "string" },
        "campo_07_oficio_numero": { "type": "string" },
        "campo_08_informe_solicitado_por": { "type": "string" },
        "campo_09_nombre_fallecido": { "type": "string", "default": "NN" },
        "campo_10_edad": { "type": "string", "description": "Años, meses, días u horas" },
        "campo_11_sexo": { "enum": ["Masculino", "Femenino", "Indeterminado"] },
        "campo_12_estado_civil": { "type": "string" },
        "campo_13_pais_nacimiento": { "type": "string" },
        "campo_14_departamento_nacimiento": { "type": "string" },
        "campo_15_provincia_nacimiento": { "type": "string" },
        "campo_16_distrito_nacimiento": { "type": "string" },
        "campo_17_ocupacion": { "type": "string" },
        "campo_18_grado_instruccion": { "type": "string" },
        "campo_19_religion": { "type": "string" },
        "campo_20_lugar_fallecimiento": { "type": "string" }
      }
    },

    "seccion_ii_autopsia": {
      "type": "object",
      "description": "Campos 21-24: Datos de la autopsia",
      "properties": {
        "campo_21_practicada_por": { 
          "type": "array", 
          "items": { "type": "string" },
          "description": "Nombres de médicos legistas" 
        },
        "campo_22_autoridades_presentes": { "type": "array", "items": { "type": "string" } },
        "campo_23_lugar_hora": { "type": "string" },
        "campo_24_inventario_prendas_objetos": { "type": "string", "description": "Descripción detallada" }
      }
    },

    "seccion_iii_fenomenos_cadavericos": {
      "type": "object",
      "description": "Campos 25-33: Fenómenos cadavéricos y tiempo de muerte",
      "properties": {
        "campo_25_livideces": {
          "type": "object",
          "properties": {
            "ubicacion": { "type": "string" },
            "grado": { "enum": ["+", "++", "+++"] },
            "caracteristicas": { "enum": ["modificables", "no_modificables"] }
          }
        },
        "campo_26_rigidez": {
          "type": "object",
          "properties": {
            "ubicacion": { "type": "string" },
            "grado": { "enum": ["+", "++", "+++"] }
          }
        },
        "campo_27_temperatura_rectal": { "type": "number", "description": "Grados centígrados" },
        "campo_28_temperatura_hepatica": { "type": "number", "description": "Grados centígrados" },
        "campo_29_fenomenos_oculares": { "type": "string" },
        "campo_30_putrefaccion": {
          "type": "object",
          "properties": {
            "tipo": { "type": "string" },
            "grado": { "enum": ["leve", "moderado", "avanzado"] }
          }
        },
        "campo_31_fauna_cadaverica": { "type": "string", "description": "Tipo, magnitud, localización, tamaño larvas" },
        "campo_32_otros_fenomenos": { "type": "string" },
        "campo_33_tiempo_aproximado_muerte": { "type": "string", "description": "Intervalo en horas/días" }
      }
    },

    "seccion_iv_examen_externo": {
      "type": "object",
      "description": "Campos 34-48: Examen físico externo (retrato hablado)",
      "properties": {
        "campo_34_constitucion": { "type": "string" },
        "campo_35_raza": { "type": "string" },
        "campo_36_talla": { "type": "number", "description": "Centímetros" },
        "campo_37_peso": { "type": "number", "description": "Kilogramos" },
        "campo_38_estado_nutricion": { "enum": ["buena", "regular", "mala"] },
        "campo_39_estado_hidratacion": { "enum": ["buena", "regular", "mala"] },
        "campo_40_piel": { "type": "string", "description": "Coloración, nevus, cicatrices, etc." },
        "campo_41_craneo": { "type": "string" },
        "campo_42_cara": { "type": "string", "description": "Ojos, frente, cejas, nariz, labios, etc." },
        "campo_43_cuello": { "type": "string" },
        "campo_44_torax": { "type": "string" },
        "campo_45_abdomen": { "type": "string" },
        "campo_46_pelvis_genitales": { "type": "string" },
        "campo_47_miembros_superiores": { "type": "string", "description": "Derecho e izquierdo" },
        "campo_48_miembros_inferiores": { "type": "string", "description": "Derecho e izquierdo" }
      }
    },

    "seccion_v_examen_interno": {
      "type": "object",
      "description": "Campos 49-80: Examen interno por región",
      "properties": {
        
        "cabeza": {
          "type": "object",
          "properties": {
            "campo_49_boveda": { "type": "string" },
            "campo_50_base": { "type": "string" },
            "campo_51_meninges": { "type": "string" },
            "campo_52_encefalo": { "type": "string" },
            "campo_53_vasos_intracraneanos": { "type": "string" },
            "peso_encefalo": { "type": "number", "description": "Gramos" }
          }
        },
        
        "cuello": {
          "type": "object",
          "properties": {
            "campo_54_columna_cervical": { "type": "string" },
            "campo_55_organos_visceras": { "type": "string", "description": "Faringe, laringe, esófago, traquea, tiroides" },
            "campo_56_vasos_cuello": { "type": "string" }
          }
        },
        
        "torax": {
          "type": "object",
          "properties": {
            "campo_57_columna_dorsal": { "type": "string" },
            "campo_58_parrilla_costal": { "type": "string" },
            "campo_59_pleuras_cavidades": { "type": "string" },
            "campo_60_pulmon_derecho": { "type": "string" },
            "campo_61_pulmon_izquierdo": { "type": "string" },
            "campo_62_pericardio_cavidad": { "type": "string" },
            "campo_63_corazon": { "type": "string" },
            "campo_64_vasos_grandes": { "type": "string" },
            "peso_pulmon_derecho": { "type": "number" },
            "peso_pulmon_izquierdo": { "type": "number" },
            "peso_corazon": { "type": "number" }
          }
        },
        
        "abdomen": {
          "type": "object",
          "properties": {
            "campo_65_columna_lumbar": { "type": "string" },
            "campo_66_diafragma": { "type": "string" },
            "campo_67_peritoneo_cavidad": { "type": "string" },
            "campo_68_epiplones_mesenterio": { "type": "string" },
            "campo_69_estomago_contenido": { "type": "string" },
            "campo_70_intestinos": { "type": "string" },
            "campo_71_apendice": { "type": "string" },
            "campo_72_higado": { "type": "string" },
            "campo_73_vias_biliares": { "type": "string" },
            "campo_74_bazo": { "type": "string" },
            "campo_75_pancreas": { "type": "string" },
            "campo_76_aparato_urinario": { "type": "string" },
            "campo_77_vasos_abdominales": { "type": "string" },
            "peso_higado": { "type": "number" },
            "peso_bazo": { "type": "number" },
            "peso_pancreas": { "type": "number" },
            "peso_rinon_derecho": { "type": "number" },
            "peso_rinon_izquierdo": { "type": "number" }
          }
        },
        
        "pelvis": {
          "type": "object",
          "properties": {
            "campo_78_esqueleto_pelviano": { "type": "string" },
            "campo_79_vasos_pelvianos": { "type": "string" },
            "campo_80_genitales_internos": { "type": "string" }
          }
        }
      }
    },

    "seccion_vi_lesiones_traumaticas": {
      "type": "object",
      "description": "Campo 81: Lesiones traumáticas detalladas",
      "properties": {
        "campo_81_lesiones": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "numero": { "type": "integer" },
              "tipo": { "type": "string", "description": "Contusa, cortante, proyectil, etc." },
              "ubicacion": { "type": "string" },
              "dimensiones": { "type": "string" },
              "caracteristicas": { "type": "string" },
              "region_anatomica": { "type": "string" }
            }
          }
        }
      }
    },

    "seccion_vii_datos_morgue": {
      "type": "object",
      "description": "Campo 82: Información interna",
      "properties": {
        "campo_82_informacion_hecho": { "type": "string" },
        "tecnico_necropsiador": { "type": "string" },
        "tipo_donacion": { "type": "string" },
        "con_fotografia": { "type": "boolean" },
        "motivo_muerte": { "enum": ["violenta", "natural"] }
      }
    },

    "seccion_viii_examenes_auxiliares": {
      "type": "object",
      "description": "Campos 83-102: Solicitudes de exámenes",
      "properties": {
        "toxicologico": {
          "type": "object",
          "properties": {
            "campo_83_fecha": { "type": "string", "format": "date" },
            "campo_84_hora": { "type": "string", "format": "time" },
            "campo_85_investigacion_solicitada": { "type": "string" },
            "campo_86_muestras": { "type": "string" }
          }
        },
        "anatomo_patologico": {
          "type": "object",
          "properties": {
            "campo_87_fecha": { "type": "string", "format": "date" },
            "campo_88_hora": { "type": "string", "format": "time" },
            "campo_89_investigacion_solicitada": { "type": "string" },
            "campo_90_muestras": { "type": "string" }
          }
        },
        "biologico": {
          "type": "object",
          "properties": {
            "campo_91_fecha": { "type": "string", "format": "date" },
            "campo_92_hora": { "type": "string", "format": "time" },
            "campo_93_investigacion_solicitada": { "type": "string" },
            "campo_94_muestras": { "type": "string" }
          }
        },
        "estomatologico": {
          "type": "object",
          "properties": {
            "campo_95_fecha": { "type": "string", "format": "date" },
            "campo_96_hora": { "type": "string", "format": "time" },
            "campo_97_investigacion_solicitada": { "type": "string" },
            "campo_98_muestras": { "type": "string" }
          }
        },
        "antropologico": {
          "type": "object",
          "properties": {
            "campo_99_fecha": { "type": "string", "format": "date" },
            "campo_100_hora": { "type": "string", "format": "time" },
            "campo_101_investigacion_solicitada": { "type": "string" },
            "campo_102_muestras": { "type": "string" }
          }
        }
      }
    },

    "seccion_ix_conclusiones": {
      "type": "object",
      "description": "Campos 103-109: Conclusiones médico-legales",
      "properties": {
        "campo_103_conclusiones": { "type": "string", "description": "Explicación fisiopatológica" },
        "campo_104_causas_muerte": {
          "type": "object",
          "properties": {
            "causa_final": { "type": "string" },
            "causa_intermedia": { "type": "string" },
            "causa_basica": { "type": "string" }
          }
        },
        "campo_105_agentes_causantes": { "type": "string" },
        "codigo_cie10": { "type": "string", "description": "Código OMS" },
        "campo_106_lugar_fecha": { "type": "string" },
        "campo_107_firma_medicos": { "type": "array", "items": { "type": "string" } },
        "campo_108_visto_bueno_director": { "type": "string" },
        "campo_109_pie_imprenta": { "type": "string" }
      }
    }
  }
}
```

---

## 3. Tablas de Referencia

### 3.1 Pesos Normales de Órganos (Adulto)

| Órgano | Masculino (g) | Femenino (g) |
|--------|---------------|--------------|
| Encéfalo | 1300-1500 | 1200-1400 |
| Corazón | 300-350 | 250-300 |
| Pulmón derecho | 450-600 | 400-550 |
| Pulmón izquierdo | 400-550 | 350-500 |
| Hígado | 1400-1800 | 1200-1500 |
| Bazo | 150-200 | 130-180 |
| Riñón (cada uno) | 130-170 | 120-150 |
| Páncreas | 70-110 | 60-100 |

### 3.2 Fenómenos Cadavéricos y Tiempo de Muerte

| Fenómeno | Aparición | Descripción |
|----------|-----------|-------------|
| Enfriamiento | 0-24h | Pérdida de 1°C/hora |
| Livideces | 30min-2h | Manchas rojas en zonas declives |
| Rigidez | 2-4h | Inicia en mandíbula, generaliza 12h |
| Putrefacción | 24-48h | Mancha verde abdominal |

---

## 4. Mapeo Dictado → Campos

### 4.1 Ejemplos de Extracción

| Dictado | Entidades Extraídas | Campo Destino |
|---------|---------------------|---------------|
| "Pulmón derecho de 520 gramos, congestivo" | ORGAN: pulmón derecho, WEIGHT: 520g, CONDITION: congestivo | campo_60, peso_pulmon_derecho |
| "Herida contusa en región frontal derecha de 3x2 cm" | LESION: herida contusa, SITE: región frontal derecha, SIZE: 3x2 cm | campo_81_lesiones[] |
| "Livideces dorsales, fijas" | CADAVERIC: livideces, LOCATION: dorsales, CHAR: fijas | campo_25 |
| "Tiempo de muerte estimado entre 12 y 18 horas" | TIME: 12-18 horas | campo_33 |

### 4.2 Prompt de Extracción (Azure OpenAI)

```json
{
  "system": "Extrae datos del dictado de autopsia y devuelve JSON con los campos del protocolo IMLCF",
  "expected_output": {
    "campo_60_pulmon_derecho": "Congestivo, antracosis leve",
    "peso_pulmon_derecho": 520,
    "campo_81_lesiones": [
      {
        "numero": 1,
        "tipo": "herida contusa",
        "ubicacion": "región frontal derecha",
        "dimensiones": "3 por 2 centímetros"
      }
    ]
  }
}
```

---

## 5. Base de Datos SQLite

### 5.1 Schema

```sql
-- Tabla principal de casos
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    protocol_number TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    status TEXT DEFAULT 'draft',
    
    -- Sección I (datos admin como JSON para flexibilidad)
    datos_administrativos TEXT,
    
    -- Secciones II-IX como JSON estructurado
    autopsia TEXT,
    fenomenos_cadavericos TEXT,
    examen_externo TEXT,
    examen_interno TEXT,
    lesiones_traumaticas TEXT,
    datos_morgue TEXT,
    examenes_auxiliares TEXT,
    conclusiones TEXT,
    
    -- Auditoría
    audio_path TEXT,
    transcript_raw TEXT,
    hash_audio TEXT,
    hash_transcript TEXT,
    hash_caso TEXT,
    
    -- Exportación
    exported_pdf_path TEXT,
    exported_at TIMESTAMP
);

-- Índices para búsqueda
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_protocol ON cases(protocol_number);
CREATE INDEX idx_cases_created ON cases(created_at);

-- Tabla de auditoría
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT REFERENCES cases(id),
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    field_changed TEXT,
    value_before TEXT,
    value_after TEXT,
    hash_before TEXT,
    hash_after TEXT
);

-- Tabla de usuarios locales
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'medico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Campos del MVP (10 Críticos)

Para el MVP inicial, nos enfocamos en los campos más usados según validación con usuario:

| # | Campo | ID | Tipo | Prioridad |
|---|-------|-----|------|-----------|
| 1 | Talla | campo_36 | number | ⭐⭐⭐ |
| 2 | Peso | campo_37 | number | ⭐⭐⭐ |
| 3 | Livideces | campo_25 | object | ⭐⭐⭐ |
| 4 | Rigidez | campo_26 | object | ⭐⭐⭐ |
| 5 | Tiempo de muerte | campo_33 | string | ⭐⭐⭐ |
| 6 | Lesiones externas | campo_40-48 | string | ⭐⭐⭐ |
| 7 | Peso corazón | peso_corazon | number | ⭐⭐ |
| 8 | Peso pulmones | peso_pulmon_* | number | ⭐⭐ |
| 9 | Lesiones traumáticas | campo_81 | array | ⭐⭐⭐ |
| 10 | Causa de muerte | campo_104 | object | ⭐⭐⭐ |

---

## 7. Próximo Documento

→ `03_pipeline_asr.md` - Configuración de Azure AI Speech y Whisper
