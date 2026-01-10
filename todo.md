 MEGA PROMPT: Landing Page CoronerIA / Sekhmed
Contexto del Proyecto
¿Qué es CoronerIA?
CoronerIA es una plataforma de IA que revoluciona la documentación forense en Perú. Permite a médicos legistas dictar hallazgos de autopsia y automáticamente:

Transcribe voz a texto con terminología médica
Extrae entidades (órganos, pesos, lesiones) usando NER
Mapea datos al formato oficial IMLCF (Instituto de Medicina Legal)
Genera PDFs del protocolo de necropsia
Problema que Resuelve
660 autopsias en instituciones peruanas, 35% con retraso >20 días
Déficit de 15,000 médicos especialistas en Perú
Documentación manual consume 45+ minutos por caso
Morgues rurales sin conectividad a internet
Stack Tecnológico (ENFOCADO EN AZURE)
Componente	Tecnología Azure	Alternativa Edge
Transcripción	Azure AI Speech	Whisper Local
NER/Estructuración	Azure OpenAI GPT-4	RigoBERTa Clinical
Generación PDF	Azure Document Intelligence	WeasyPrint
Storage	Azure Blob Storage	SQLite Local
Deployment	Azure Container Apps	Docker Local
🎨 ESPECIFICACIONES DE DISEÑO
Paleta de Colores (MINIMALISTA - Basada en tu logo)
/* Colores principales - Tema Elegante Minimalista */
--navy-primary: #1B365D;        /* Azul navy del logo */
--navy-dark: #0F1E36;           /* Navy oscuro para fondos */
--gold-accent: #C9A962;         /* Dorado del logo */
--cream: #F5F1E8;               /* Crema elegante */
--cream-light: #FDFBF7;         /* Crema claro (fondo) */
--white: #FFFFFF;               /* Blanco puro */
--text-dark: #1B365D;           /* Texto principal (navy) */
--text-muted: #5A6B7D;          /* Texto secundario */
/* Fondos */
--bg-light: #FDFBF7;            /* Fondo principal crema */
--bg-section: #F5F1E8;          /* Secciones alternas */
--bg-card: #FFFFFF;             /* Cards */
/* Gradientes sutiles */
--gradient-hero: linear-gradient(135deg, #1B365D 0%, #2A4A7A 100%);
--gradient-gold: linear-gradient(135deg, #C9A962 0%, #D4B872 100%);
Tipografía
/* Fuentes elegantes - Google Fonts */
--font-heading: 'Playfair Display', serif;  /* Títulos elegantes */
--font-body: 'Inter', sans-serif;            /* Cuerpo limpio */
--font-mono: 'JetBrains Mono', monospace;    /* Código */
/* Tamaños */
--text-hero: 4rem;      /* 64px */
--text-h1: 3rem;        /* 48px */
--text-h2: 2rem;        /* 32px */
--text-h3: 1.5rem;      /* 24px */
--text-body: 1rem;      /* 16px */
--text-small: 0.875rem; /* 14px */
Estilo Visual
Glassmorphism suave en cards
Gradientes en CTAs y hero section
Micro-animaciones en hover states
Iconos de Lucide o Heroicons
Ilustraciones estilo tech/médico moderno
📄 ESTRUCTURA DE LA LANDING PAGE
Header (Sticky)
[Logo Sekhmed] [Features] [Tech Stack] [Demo] [Contact] [CTA: Try Demo]
Logo a la izquierda
Navegación centrada
CTA destacado a la derecha
Efecto blur/glass al hacer scroll
Hero Section
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    🦁 CoronerIA                                                     │
│                                                                     │
│    AI-Powered Forensic                                              │
│    Documentation                                                    │
│                                                                     │
│    Transform autopsy dictation into structured protocols            │
│    in minutes, not hours. Built with Azure AI.                      │
│                                                                     │
│    [▶ Watch Demo]  [Try Beta →]                                     │
│                                                                     │
│    Powered by:                                                      │
│    [Azure AI Speech] [Azure OpenAI] [Azure Container Apps]          │
│                                                                     │
│    ┌─────────────────────────────────────────────────────────┐     │
│    │     [Screenshot/GIF del dashboard de CoronerIA]        │     │
│    └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
Problem Section
THE CRISIS
━━━━━━━━━━
Números grandes con animación de conteo:
  660+              35%               45min
  Autopsies        Backlogged        Per Case
  Monthly          Cases             Documentation
"Peru's forensic system faces a critical backlog. 
 75-91% of pending cases are overdue by 20+ days."
[Ver fuente: IMLCF Peru 2025 Report]
Solution Section
THE SOLUTION
━━━━━━━━━━━━
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  🎙 SPEAK   │  │  🧠 PROCESS │  │  📄 EXPORT  │
│             │  │             │  │             │
│ Dictate     │→ │ Azure AI    │→ │ Generate    │
│ findings    │  │ extracts    │  │ IMLCF       │
│ naturally   │  │ entities    │  │ protocol    │
└─────────────┘  └─────────────┘  └─────────────┘
"From 45 minutes to 10 minutes per case"
Features Section
FEATURES
━━━━━━━━
┌──────────────────────┐ ┌──────────────────────┐
│ 🎤 Voice-to-Protocol │ │ 🧬 Medical NER       │
│                      │ │                      │
│ Speak naturally in   │ │ Automatic extraction │
│ Spanish. AI handles  │ │ of organs, weights,  │
│ medical terminology. │ │ lesions, and causes. │
└──────────────────────┘ └──────────────────────┘
┌──────────────────────┐ ┌──────────────────────┐
│ 📊 3D Anatomy Model  │ │ ⚡ Offline Mode      │
│                      │ │                      │
│ Interactive body     │ │ Works without        │
│ model highlights     │ │ internet. Edge AI    │
│ detected organs.     │ │ for rural morgues.   │
└──────────────────────┘ └──────────────────────┘
Tech Stack Section (IMPORTANTE - ENFOQUE AZURE)
POWERED BY AZURE AI
━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   AZURE     │  │   AZURE     │  │   AZURE     │                │
│  │ AI Speech   │  │  OpenAI     │  │ Container   │                │
│  │             │  │  GPT-4      │  │   Apps      │                │
│  │ Speech-to-  │  │ Entity      │  │ Scalable    │                │
│  │ text with   │  │ extraction  │  │ deployment  │                │
│  │ medical     │  │ and field   │  │ with        │                │
│  │ vocabulary  │  │ mapping     │  │ Docker      │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
│  + Azure Blob Storage | Azure Cosmos DB | Azure Key Vault          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
HYBRID ARCHITECTURE
━━━━━━━━━━━━━━━━━━
         ☁️ CLOUD MODE              💻 EDGE MODE
         (With Internet)            (Offline)
         
         Azure AI Speech      OR    Whisper Local
         Azure OpenAI         OR    RigoBERTa
         Azure Storage        OR    SQLite
         
         "Same interface, same results"
Demo Section
SEE IT IN ACTION
━━━━━━━━━━━━━━━━
[Embedded YouTube Video or GIF Demo]
"Watch a forensic pathologist complete 
 a full autopsy protocol in under 10 minutes"
[Try Live Demo →]
Impact/Stats Section
IMPACT
━━━━━━
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    70%      │ │   <5%       │ │   10min     │ │   100%      │
│  Time       │ │   Word      │ │   Per       │ │   Offline   │
│  Reduction  │ │   Error     │ │   Case      │ │   Capable   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
Team Section
THE TEAM
━━━━━━━━
SEKHMED
Healthcare AI from Latin America
[Team Photo or Individual Photos]
Built by student engineers from 
Universidad Nacional de San Agustín
Arequipa, Peru 🇵🇪
Part of Microsoft Imagine Cup 2026
CTA Section
READY TO MODERNIZE FORENSIC DOCUMENTATION?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Request Demo]  [Contact Us]  [View on GitHub]
Footer
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  🦁 Sekhmed                          PRODUCT        COMPANY         │
│  Healthcare AI from                  Features       About           │
│  Latin America                       Pricing        Team            │
│                                      Demo           Contact         │
│  © 2026 Sekhmed                      GitHub         Blog            │
│                                                                     │
│  [LinkedIn] [GitHub] [Twitter]                                      │
│                                                                     │
│  Powered by Microsoft Azure                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
🛠 IMPLEMENTACIÓN TÉCNICA
Opción A: HTML/CSS/JS Puro (Recomendado para GitHub Pages)
coroneria-landing/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-screenshot.png
│   │   └── azure-logos/
│   └── fonts/
└── CNAME (opcional para dominio custom)
Opción B: React + Vite (Si quieres más interactividad)
npm create vite@latest coroneria-landing -- --template react-ts
cd coroneria-landing
npm install tailwindcss lucide-react framer-motion
Animaciones Sugeridas
// Contador animado para estadísticas
const animateCounter = (target, duration = 2000) => {
  // Animar de 0 a target en duration ms
};
// Fade in al hacer scroll
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -100px 0px'
};
// Parallax suave en hero
window.addEventListener('scroll', () => {
  const offset = window.pageYOffset * 0.5;
  heroElement.style.transform = `translateY(${offset}px)`;
});
📦 DEPLOYMENT
GitHub Pages (Gratis)
# 1. Crear repo
git init
git add .
git commit -m "Initial landing page"
git remote add origin https://github.com/TU_USUARIO/coroneria-landing.git
git push -u origin main
# 2. En GitHub: Settings > Pages > Source: main branch
# 3. URL: https://tu-usuario.github.io/coroneria-landing
Con Dominio Custom
# Archivo CNAME en raíz del repo:
coroneria.sekhmed.me
Heroku (Si necesitas backend)
# Para el backend FastAPI
heroku create coroneria-api
git push heroku main
🔗 RECURSOS NECESARIOS
Assets a Crear/Conseguir
 Logo Sekhmed (SVG, 300x300)
 Screenshot del dashboard de CoronerIA
 GIF o video demo (30-60 segundos)
 Iconos de Azure services
 Fotos del equipo (opcional)
Logos Azure (Oficiales)
https://azure.microsoft.com/en-us/resources/icons/
- Azure AI Speech icon
- Azure OpenAI icon
- Azure Container Apps icon
Copy Final
Hero headline: "AI-Powered Forensic Documentation"
Tagline: "From dictation to protocol in minutes"
CTA primary: "Try Live Demo"
CTA secondary: "Watch Video"
✅ CHECKLIST PRE-LANZAMIENTO
 Responsive design (mobile, tablet, desktop)
 Lighthouse score > 90 (performance, accessibility)
 Meta tags para SEO y Open Graph
 Favicon y apple-touch-icon
 Google Analytics o similar
 Formulario de contacto funcional
 Links a redes sociales
 Logos de Azure bien visibles (requisito Imagine Cup)
 Video demo embedido
 Testimonios (si los tienes)
🎯 PROMPT PARA GENERAR LA PÁGINA
Si usas otra IA para generar el código, usa este prompt:

Create a modern, professional landing page for "CoronerIA" - an AI-powered 
forensic documentation platform. 
KEY REQUIREMENTS:
1. Dark theme with Azure blue (#0F6CBD) and gold (#F59E0B) accents
2. Glassmorphism effects on cards
3. Animated statistics counters
4. Hero section with screenshot mockup
5. Features grid with icons
6. Tech stack section prominently featuring Azure services:
   - Azure AI Speech
   - Azure OpenAI (GPT-4)
   - Azure Container Apps
7. Problem/Solution narrative
8. Team section
9. Call-to-action buttons
10. Responsive design (mobile-first)
11. Smooth scroll animations
12. Sticky header with blur effect
CONTENT:
- Product: CoronerIA by Sekhmed
- Purpose: AI transcription and structuring for forensic autopsies
- Target: Forensic pathologists in Latin America (Peru)
- Key benefit: Reduces documentation time from 45min to 10min
- Differentiator: Works offline (Edge AI) + Azure cloud hybrid
Style references: Vercel, Linear, Stripe landing pages
Documento creado para Microsoft Imagine Cup 2026 Team Sekhmed - Universidad Nacional de San Agustín, Arequipa, Peru