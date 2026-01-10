# 06. Interfaz de Usuario

## 1. Visión General

ForensIA usa **Electron + React** para crear una aplicación de escritorio nativa que funciona offline.

| Aspecto | Tecnología |
|---------|------------|
| **Framework** | Electron 30+ |
| **UI** | React 18 + TypeScript |
| **Estilos** | Tailwind CSS |
| **Estado** | Zustand |
| **3D** | Three.js (modelo anatómico) |
| **Iconos** | Lucide React |

---

## 2. Estructura del Proyecto

```
📂 /frontend
├── electron/
│   ├── main.ts              # Main process
│   ├── preload.ts           # Bridge seguro
│   └── ipc-handlers.ts      # Comunicación IPC
├── src/
│   ├── App.tsx              # Entrada principal
│   ├── main.tsx             # Bootstrap React
│   ├── pages/
│   │   ├── Login.tsx        # Autenticación
│   │   ├── Dashboard.tsx    # Lista de casos
│   │   ├── Dictation.tsx    # Pantalla principal
│   │   ├── Review.tsx       # Revisión antes de exportar
│   │   └── Settings.tsx     # Configuración
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── dictation/
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── TranscriptView.tsx
│   │   │   ├── FieldsPanel.tsx
│   │   │   └── VoiceIndicator.tsx
│   │   ├── protocol/
│   │   │   ├── ProtocolForm.tsx
│   │   │   ├── SectionTabs.tsx
│   │   │   └── FieldInput.tsx
│   │   ├── anatomy/
│   │   │   ├── BodyModel3D.tsx
│   │   │   └── OrganHighlight.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── StatusBadge.tsx
│   ├── hooks/
│   │   ├── useAudioRecorder.ts
│   │   ├── useTranscription.ts
│   │   ├── useProtocol.ts
│   │   └── useConnectionStatus.ts
│   ├── stores/
│   │   ├── caseStore.ts
│   │   ├── transcriptionStore.ts
│   │   └── uiStore.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── protocol.ts
│   └── styles/
│       └── globals.css
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Pantallas Principales

### 3.1 Login

```tsx
// pages/Login.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Wifi, WifiOff } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isOnline, mode } = useConnectionStatus();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError('Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">ForensIA</h1>
          <p className="text-slate-500">Asistente de Documentación Forense</p>
        </div>

        {/* Status de conexión */}
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
          <span className="text-sm">
            {isOnline ? `Modo Azure (${mode})` : 'Modo Offline (Edge)'}
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="doctor.legista"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 3.2 Dashboard (Lista de Casos)

```tsx
// pages/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCaseStore } from '../stores/caseStore';

export function Dashboard() {
  const { cases, fetchCases, createCase } = useCaseStore();
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed'>('all');

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={18} />;
      case 'draft': return <Clock className="text-amber-500" size={18} />;
      default: return <AlertCircle className="text-red-500" size={18} />;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Casos</h1>
          <button
            onClick={() => createCase()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nuevo Caso
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-4 py-2 rounded-lg ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'draft' ? 'Borradores' : 'Completados'}
            </button>
          ))}
        </div>

        {/* Lista de casos */}
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
              onClick={() => window.location.href = `/dictation/${caseItem.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-400" size={24} />
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Protocolo {caseItem.protocol_number || 'Sin número'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {caseItem.deceased_name || 'NN'} • {caseItem.created_at}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(caseItem.status)}
                  <span className="text-sm text-slate-500 capitalize">
                    {caseItem.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
```

### 3.3 Pantalla de Dictado (Principal)

```tsx
// pages/Dictation.tsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { AudioRecorder } from '../components/dictation/AudioRecorder';
import { TranscriptView } from '../components/dictation/TranscriptView';
import { FieldsPanel } from '../components/dictation/FieldsPanel';
import { BodyModel3D } from '../components/anatomy/BodyModel3D';
import { useCaseStore } from '../stores/caseStore';
import { useTranscriptionStore } from '../stores/transcriptionStore';

export function Dictation() {
  const { caseId } = useParams();
  const { currentCase, loadCase, updateField } = useCaseStore();
  const { transcript, isRecording, partialText } = useTranscriptionStore();
  
  const [activeSection, setActiveSection] = useState('fenomenos');
  const [showModel, setShowModel] = useState(true);

  useEffect(() => {
    if (caseId) {
      loadCase(caseId);
    }
  }, [caseId]);

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header del caso */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Protocolo {currentCase?.protocol_number || 'Nuevo'}
              </h1>
              <p className="text-sm text-slate-500">
                {currentCase?.deceased_name || 'Fallecido sin identificar'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModel(!showModel)}
                className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {showModel ? 'Ocultar Modelo' : 'Mostrar Modelo'}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo: Transcripción y Dictado */}
          <div className="w-1/2 flex flex-col border-r">
            {/* Controles de grabación */}
            <AudioRecorder />
            
            {/* Vista de transcripción */}
            <div className="flex-1 overflow-auto p-4">
              <TranscriptView
                transcript={transcript}
                partialText={partialText}
                isRecording={isRecording}
              />
            </div>
          </div>

          {/* Panel derecho: Campos y Modelo 3D */}
          <div className="w-1/2 flex flex-col">
            {/* Modelo 3D (colapsable) */}
            {showModel && (
              <div className="h-1/3 border-b bg-slate-900">
                <BodyModel3D
                  highlightedOrgans={currentCase?.highlighted_organs || []}
                />
              </div>
            )}
            
            {/* Panel de campos */}
            <div className="flex-1 overflow-auto">
              <FieldsPanel
                caseData={currentCase}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onFieldUpdate={updateField}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
```

---

## 4. Componentes Clave

### 4.1 AudioRecorder

```tsx
// components/dictation/AudioRecorder.tsx

import { Mic, MicOff, Pause, Play, Square } from 'lucide-react';
import { useTranscriptionStore } from '../../stores/transcriptionStore';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export function AudioRecorder() {
  const {
    isRecording,
    isPaused,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    duration
  } = useTranscriptionStore();
  
  const { mode } = useConnectionStatus();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border-b p-4">
      <div className="flex items-center justify-between">
        {/* Indicador de modo */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            mode === 'azure' ? 'bg-blue-500' : 'bg-amber-500'
          }`} />
          <span className="text-sm text-slate-500">
            {mode === 'azure' ? 'Azure AI Speech' : 'Whisper Local'}
          </span>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4">
          {/* Duración */}
          <span className="font-mono text-lg text-slate-700">
            {formatDuration(duration)}
          </span>

          {/* Botón principal */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
            >
              <Mic size={20} />
              Iniciar Dictado
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Pausa/Reanudar */}
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600"
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              
              {/* Detener */}
              <button
                onClick={stopRecording}
                className="p-3 bg-slate-600 text-white rounded-full hover:bg-slate-700"
              >
                <Square size={20} />
              </button>

              {/* Indicador de grabación */}
              <div className="flex items-center gap-2 ml-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-500 font-medium">
                  {isPaused ? 'Pausado' : 'Grabando...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.2 TranscriptView

```tsx
// components/dictation/TranscriptView.tsx

import { useEffect, useRef } from 'react';

interface TranscriptViewProps {
  transcript: string;
  partialText: string;
  isRecording: boolean;
}

export function TranscriptView({ transcript, partialText, isRecording }: TranscriptViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll al final
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, partialText]);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-slate-600 sticky top-0 bg-white py-2">
        Transcripción
      </h3>

      {/* Texto confirmado */}
      <div className="prose prose-slate max-w-none">
        {transcript.split('\n').map((paragraph, i) => (
          <p key={i} className="text-slate-800">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Texto parcial (mientras habla) */}
      {isRecording && partialText && (
        <div className="text-slate-400 italic border-l-2 border-blue-300 pl-3">
          {partialText}
          <span className="animate-pulse">▌</span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
```

### 4.3 FieldsPanel

```tsx
// components/dictation/FieldsPanel.tsx

import { useState } from 'react';

const SECTIONS = [
  { id: 'fenomenos', label: 'Fenómenos Cadavéricos', fields: ['25', '26', '27', '33'] },
  { id: 'externo', label: 'Examen Externo', fields: ['36', '37', '40', '41', '42', '43', '44', '45'] },
  { id: 'interno', label: 'Examen Interno', fields: ['60', '61', '63', '72', '74'] },
  { id: 'lesiones', label: 'Lesiones', fields: ['81'] },
  { id: 'conclusiones', label: 'Conclusiones', fields: ['104', '105'] },
];

interface FieldsPanelProps {
  caseData: any;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onFieldUpdate: (field: string, value: any) => void;
}

export function FieldsPanel({
  caseData,
  activeSection,
  onSectionChange,
  onFieldUpdate
}: FieldsPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Tabs de secciones */}
      <div className="flex border-b overflow-x-auto">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`px-4 py-3 text-sm whitespace-nowrap ${
              activeSection === section.id
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Campos de la sección activa */}
      <div className="flex-1 overflow-auto p-4">
        <FieldsSection
          section={SECTIONS.find(s => s.id === activeSection)!}
          caseData={caseData}
          onFieldUpdate={onFieldUpdate}
        />
      </div>
    </div>
  );
}

function FieldsSection({ section, caseData, onFieldUpdate }) {
  // Renderizar campos según la sección
  if (section.id === 'fenomenos') {
    return (
      <div className="space-y-4">
        <FieldInput
          label="25. Livideces"
          value={caseData?.fenomenos_cadavericos?.campo_25 || ''}
          onChange={(v) => onFieldUpdate('fenomenos_cadavericos.campo_25', v)}
          placeholder="Ubicación, grado, características"
        />
        <FieldInput
          label="26. Rigidez"
          value={caseData?.fenomenos_cadavericos?.campo_26 || ''}
          onChange={(v) => onFieldUpdate('fenomenos_cadavericos.campo_26', v)}
          placeholder="Ubicación, grado"
        />
        <FieldInput
          label="27. Temperatura Rectal"
          value={caseData?.fenomenos_cadavericos?.campo_27 || ''}
          onChange={(v) => onFieldUpdate('fenomenos_cadavericos.campo_27', v)}
          placeholder="°C"
          type="number"
        />
        <FieldInput
          label="33. Tiempo Aprox. de Muerte"
          value={caseData?.fenomenos_cadavericos?.campo_33 || ''}
          onChange={(v) => onFieldUpdate('fenomenos_cadavericos.campo_33', v)}
          placeholder="Intervalo en horas"
        />
      </div>
    );
  }
  
  // ... más secciones
  return null;
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [isEditing, setIsEditing] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className={`p-3 rounded-lg border ${
      hasValue ? 'border-green-200 bg-green-50' : 'border-slate-200'
    }`}>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="min-h-[40px] p-2 cursor-text hover:bg-slate-50 rounded"
        >
          {value || (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4.4 Modelo 3D Anatómico

```tsx
// components/anatomy/BodyModel3D.tsx

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface BodyModel3DProps {
  highlightedOrgans: string[];
}

export function BodyModel3D({ highlightedOrgans }: BodyModel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    // Placeholder body (cilindro simple)
    // En producción: cargar modelo GLTF de cuerpo humano
    const bodyGeometry = new THREE.CylinderGeometry(1, 0.8, 4, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.6
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);
    
    // Órganos (esferas como placeholder)
    const organs: { [key: string]: THREE.Mesh } = {};
    
    const organPositions = {
      'corazon': [0, 0.5, 0.3],
      'pulmon_derecho': [0.5, 0.5, 0],
      'pulmon_izquierdo': [-0.5, 0.5, 0],
      'higado': [0.4, -0.3, 0.2],
      'encefalo': [0, 1.8, 0],
    };
    
    Object.entries(organPositions).forEach(([name, pos]) => {
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: highlightedOrgans.includes(name) ? 0xef4444 : 0x3b82f6,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(mesh);
      organs[name] = mesh;
    });
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [highlightedOrgans]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
```

---

## 5. Stores (Estado Global)

```typescript
// stores/transcriptionStore.ts

import { create } from 'zustand';

interface TranscriptionState {
  transcript: string;
  partialText: string;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mode: 'azure' | 'edge';
  
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  appendTranscript: (text: string) => void;
  setPartialText: (text: string) => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
  transcript: '',
  partialText: '',
  isRecording: false,
  isPaused: false,
  duration: 0,
  mode: 'azure',
  
  startRecording: async () => {
    set({ isRecording: true, isPaused: false, duration: 0 });
    
    // Conectar WebSocket
    const ws = new WebSocket('ws://localhost:8000/api/transcription/stream');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'partial') {
        set({ partialText: data.text });
      } else if (data.type === 'final') {
        const current = get().transcript;
        set({
          transcript: current + '\n' + data.text,
          partialText: ''
        });
      }
    };
    
    // Timer de duración
    const timer = setInterval(() => {
      if (!get().isPaused && get().isRecording) {
        set(state => ({ duration: state.duration + 1 }));
      }
    }, 1000);
    
    // Guardar referencias para cleanup
    (window as any).__ws = ws;
    (window as any).__timer = timer;
  },
  
  stopRecording: () => {
    set({ isRecording: false, isPaused: false });
    
    // Cleanup
    (window as any).__ws?.close();
    clearInterval((window as any).__timer);
  },
  
  pauseRecording: () => set({ isPaused: true }),
  resumeRecording: () => set({ isPaused: false }),
  
  appendTranscript: (text: string) => {
    set(state => ({
      transcript: state.transcript + '\n' + text
    }));
  },
  
  setPartialText: (text: string) => set({ partialText: text }),
}));
```

---

## 6. Electron Configuration

### 6.1 Main Process

```typescript
// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

---

## 7. Próximo Documento

→ `07_deployment_seguridad.md` - Instalación, configuración y seguridad
