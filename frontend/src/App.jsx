import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const D = {
  bg:"var(--bg)", 
  surface:"var(--surface)", 
  surface2:"var(--surface-hover)", 
  surface3:"rgba(15, 23, 42, 0.4)",
  border:"var(--border)", 
  border2:"rgba(255,255,255,0.04)",
  text:"var(--text)", 
  textMid:"var(--text-muted)", 
  textDim:"#475569",
  critical:"var(--accent)", 
  high:"#FB923C", 
  medium:"#FBBF24", 
  low:"#34D399", 
  info:"var(--primary)",
};

const LEVEL = {
  critical:{ color:"#F43F5E", bg:"rgba(244,63,94,0.12)",  border:"rgba(244,63,94,0.3)",  dot:"#F43F5E", label:"Critical" },
  high:    { color:"#FB923C", bg:"rgba(251,146,60,0.12)", border:"rgba(251,146,60,0.3)", dot:"#FB923C", label:"High"     },
  medium:  { color:"#FBBF24", bg:"rgba(251,191,36,0.12)", border:"rgba(251,191,36,0.3)", dot:"#FBBF24", label:"Medium"   },
  low:     { color:"#34D399", bg:"rgba(52,211,153,0.12)", border:"rgba(52,211,153,0.3)", dot:"#34D399", label:"Low"      },
};

/* Google-Maps day-mode risk palette */
const RS = {
  critical:{ fill:"rgba(220,38,38,0.38)",  stroke:"#DC2626", label:"#7F1D1D", badge:"#FEE2E2" },
  high:    { fill:"rgba(234,88,12,0.35)",  stroke:"#EA580C", label:"#7C2D12", badge:"#FFEDD5" },
  medium:  { fill:"rgba(202,138,4,0.32)",  stroke:"#B45309", label:"#78350F", badge:"#FEF3C7" },
  low:     { fill:"rgba(22,163,74,0.26)",  stroke:"#15803D", label:"#14532D", badge:"#DCFCE7" },
};

const STATUS_COLOR = { ok:"#34D399", warn:"#FBBF24", bad:"#F43F5E" };

/* ═══════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════ */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile:w<640, isTablet:w>=640&&w<1024, isDesktop:w>=1024, width:w };
}

/* ═══════════════════════════════════════════════════
   ML RISK HOOK  –  polls your backend every 30s
   Replace ML_ENDPOINT with your actual model URL.
   Expected response: { risk: "danger"|"medium"|"safe", confidence: 0-100, cases: number, peak: number }
═══════════════════════════════════════════════════ */
const ML_ENDPOINT = "http://localhost:8000/predict"; // ← change to your backend URL

const RISK_META = {
  danger: {
    label:   "⚠ Danger",
    color:   "#F43F5E",
    bg:      "rgba(244,63,94,0.15)",
    border:  "rgba(244,63,94,0.40)",
    glow:    "rgba(244,63,94,0.07)",
    pulse:   "#F43F5E",
  },
  medium: {
    label:   "◈ Medium",
    color:   "#FBBF24",
    bg:      "rgba(251,191,36,0.15)",
    border:  "rgba(251,191,36,0.40)",
    glow:    "rgba(251,191,36,0.06)",
    pulse:   "#FBBF24",
  },
  safe: {
    label:   "✓ Safe",
    color:   "#34D399",
    bg:      "rgba(52,211,153,0.15)",
    border:  "rgba(52,211,153,0.40)",
    glow:    "rgba(52,211,153,0.06)",
    pulse:   "#34D399",
  },
};

function useMLRisk() {
  const [risk,       setRisk]       = useState("medium");   // "danger" | "medium" | "safe"
  const [confidence, setConfidence] = useState(87);
  const [cases,      setCases]      = useState(38);
  const [peak,       setPeak]       = useState(82);
  const [loading,    setLoading]    = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error,      setError]      = useState(null);

  async function fetchRisk() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("http://localhost:8000/predict", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ward_data: [
            { ward:"Ukkadam",     contamination:65, cases:12, rainfall:45 },
            { ward:"Singanallur", contamination:58, cases:8,  rainfall:30 },
            { ward:"Peelamedu",   contamination:42, cases:5,  rainfall:15 },
            { ward:"Ganapathy",   contamination:55, cases:9,  rainfall:25 },
            { ward:"Kuniyamuthur", contamination:60, cases:10, rainfall:35 },
          ]
        }),
      });
      if (!res.ok) throw new Error("Backend Offline");
      const data = await res.json();
      
      setRisk(data.risk || "medium");
      setConfidence(Math.round(data.confidence || 85));
      setCases(data.cases || 0);
      setPeak(data.peak || 0);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRisk();
    const id = setInterval(fetchRisk, 20_000); // Poll every 20s
    return () => clearInterval(id);
  }, []);

  return { risk, confidence, cases, peak, loading, lastUpdate, error, refetch: fetchRisk };
}

/* ═══════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════ */
const forecastData = [
  { day:"Feb 14", actual:22, predicted:null },
  { day:"Feb 16", actual:28, predicted:null },
  { day:"Feb 18", actual:31, predicted:null },
  { day:"Feb 20", actual:38, predicted:38  },
  { day:"Feb 22", actual:null, predicted:42 },
  { day:"Feb 24", actual:null, predicted:51 },
  { day:"Feb 26", actual:null, predicted:63 },
  { day:"Feb 28", actual:null, predicted:78 },
  { day:"Mar 2",  actual:null, predicted:82 },
  { day:"Mar 4",  actual:null, predicted:71 },
];
const weeklyData = [
  { day:"Mon", cholera:2, typhoid:5, dysentery:3, hepatitis:1 },
  { day:"Tue", cholera:3, typhoid:6, dysentery:4, hepatitis:2 },
  { day:"Wed", cholera:2, typhoid:7, dysentery:3, hepatitis:1 },
  { day:"Thu", cholera:4, typhoid:8, dysentery:5, hepatitis:2 },
  { day:"Fri", cholera:3, typhoid:9, dysentery:4, hepatitis:2 },
  { day:"Sat", cholera:5, typhoid:7, dysentery:6, hepatitis:1 },
  { day:"Sun", cholera:4, typhoid:6, dysentery:5, hepatitis:2 },
];
const wards = [
  { name:"Ukkadam",        risk:"critical", cases:8, wqi:42 },
  { name:"Singanallur",    risk:"critical", cases:6, wqi:48 },
  { name:"Peelamedu",      risk:"high",     cases:5, wqi:55 },
  { name:"Ganapathy",      risk:"high",     cases:4, wqi:58 },
  { name:"Kuniyamuthur",   risk:"high",     cases:4, wqi:61 },
  { name:"Saravanampatti", risk:"medium",   cases:3, wqi:68 },
  { name:"RS Puram",       risk:"medium",   cases:2, wqi:72 },
  { name:"Tatabad",        risk:"medium",   cases:2, wqi:70 },
  { name:"Gandhinagar",    risk:"low",      cases:1, wqi:81 },
  { name:"Race Course",    risk:"low",      cases:1, wqi:84 },
  { name:"Podanur",        risk:"low",      cases:0, wqi:88 },
  { name:"Perur",          risk:"low",      cases:0, wqi:90 },
];
const alerts = [
  { id:1, level:"critical", icon:"⚡", title:"Cholera Risk - Ukkadam Ward",        desc:"Turbidity spike 4.2 NTU, E.coli+ detected, 8 cases/48hrs", time:"2m ago"  },
  { id:2, level:"high",     icon:"⚠️", title:"Typhoid Cluster - Singanallur",      desc:"5 confirmed cases, Cross-contamination suspected",          time:"18m ago" },
  { id:3, level:"high",     icon:"💧", title:"Water Quality Failure - Peelamedu", desc:"Chlorine residual 0.08 mg/L (below 0.2 threshold)",        time:"34m ago" },
  { id:4, level:"medium",   icon:"🤖", title:"AI Forecast - Kuniyamuthur",         desc:"78% outbreak probability in 7 days detected",              time:"1h ago"  },
  { id:5, level:"medium",   icon:"🏥", title:"Dysentery Surge - Ganapathy",        desc:"14 OPD visits today vs 4 avg, Samples sent",              time:"2h ago"  },
  { id:6, level:"low",      icon:"✅", title:"Chlorination Done - Saravanampatti", desc:"Residual chlorine normal, Status downgraded",              time:"5h ago"  },
];
const waterParams = [
  { label:"pH",        value:7.4,  max:14,  unit:"",       status:"ok",   display:"7.4"  },
  { label:"Turbidity", value:3.1,  max:5,   unit:" NTU",   status:"warn", display:"3.1"  },
  { label:"Chlorine",  value:0.15, max:0.5, unit:" mg/L",  status:"bad",  display:"0.15" },
  { label:"E. coli",   value:0,    max:10,  unit:"/100mL", status:"ok",   display:"0"    },
  { label:"Nitrates",  value:22,   max:45,  unit:" mg/L",  status:"warn", display:"22"   },
  { label:"TDS",       value:340,  max:500, unit:" mg/L",  status:"ok",   display:"340"  },
];
const forecastDays = [
  { date:"Feb 20", pct:74, level:"high"     }, { date:"Feb 21", pct:71, level:"high"     },
  { date:"Feb 22", pct:65, level:"medium"   }, { date:"Feb 23", pct:67, level:"medium"   },
  { date:"Feb 24", pct:76, level:"high"     }, { date:"Feb 25", pct:79, level:"high"     },
  { date:"Feb 26", pct:85, level:"critical" }, { date:"Feb 27", pct:88, level:"critical" },
  { date:"Feb 28", pct:91, level:"critical" }, { date:"Mar 1",  pct:89, level:"critical" },
  { date:"Mar 2",  pct:82, level:"high"     }, { date:"Mar 3",  pct:78, level:"high"     },
  { date:"Mar 4",  pct:69, level:"medium"   }, { date:"Mar 5",  pct:62, level:"medium"   },
];

/* ═══════════════════════════════════════════════════
   MAP DATA  –  20 real Coimbatore wards, geo-placed
═══════════════════════════════════════════════════ */
const CBE_WARDS = [
  { id:"w1",  name:"Ukkadam",         zone:"Central", risk:"critical", cases:8, wqi:42, pop:"52K",
    path:"M 206,106 L 250,102 L 260,124 L 246,142 L 208,140 L 200,120 Z" },
  { id:"w2",  name:"Singanallur",     zone:"East",    risk:"critical", cases:6, wqi:48, pop:"48K",
    path:"M 260,98  L 308,94  L 320,118 L 310,138 L 268,140 L 256,122 Z" },
  { id:"w3",  name:"Peelamedu",       zone:"East",    risk:"high",     cases:5, wqi:55, pop:"61K",
    path:"M 316,90  L 372,86  L 380,112 L 364,132 L 318,130 L 310,110 Z" },
  { id:"w4",  name:"Saravanampatti",  zone:"NE",      risk:"medium",   cases:3, wqi:68, pop:"44K",
    path:"M 376,70  L 440,66  L 448,96  L 422,114 L 380,110 L 370,82  Z" },
  { id:"w5",  name:"Annur",           zone:"North",   risk:"low",      cases:0, wqi:88, pop:"30K",
    path:"M 426,46  L 476,48  L 480,78  L 452,92  L 430,82  L 422,58  Z" },
  { id:"w6",  name:"Mettupalayam",    zone:"NW",      risk:"low",      cases:1, wqi:84, pop:"35K",
    path:"M 120,70  L 190,66  L 194,98  L 182,116 L 128,112 L 116,92  Z" },
  { id:"w7",  name:"Ganapathy",       zone:"Central", risk:"high",     cases:4, wqi:58, pop:"55K",
    path:"M 202,140 L 250,138 L 254,176 L 232,190 L 198,182 L 194,156 Z" },
  { id:"w8",  name:"Tatabad",         zone:"Central", risk:"medium",   cases:2, wqi:70, pop:"38K",
    path:"M 254,136 L 318,132 L 322,164 L 298,180 L 256,174 L 250,152 Z" },
  { id:"w9",  name:"RS Puram",        zone:"West",    risk:"medium",   cases:2, wqi:72, pop:"42K",
    path:"M 128,114 L 194,110 L 198,150 L 176,164 L 132,158 L 120,136 Z" },
  { id:"w10", name:"Race Course",     zone:"West",    risk:"low",      cases:1, wqi:84, pop:"28K",
    path:"M 84,92   L 130,90  L 132,128 L 116,144 L 82,136  L 74,112  Z" },
  { id:"w11", name:"Gandhinagar",     zone:"East",    risk:"low",      cases:1, wqi:81, pop:"33K",
    path:"M 318,128 L 372,124 L 376,158 L 354,174 L 320,168 L 314,148 Z" },
  { id:"w12", name:"Kuniyamuthur",    zone:"SE",      risk:"high",     cases:4, wqi:61, pop:"50K",
    path:"M 372,120 L 428,116 L 432,152 L 408,168 L 372,162 L 366,140 Z" },
  { id:"w13", name:"Vellalore",       zone:"East",    risk:"medium",   cases:3, wqi:66, pop:"40K",
    path:"M 424,108 L 474,106 L 478,140 L 452,154 L 424,148 L 418,122 Z" },
  { id:"w14", name:"Podanur",         zone:"South",   risk:"low",      cases:0, wqi:88, pop:"36K",
    path:"M 166,180 L 212,176 L 216,210 L 196,224 L 162,218 L 158,196 Z" },
  { id:"w15", name:"Kavundampalayam", zone:"South",   risk:"medium",   cases:2, wqi:69, pop:"45K",
    path:"M 216,174 L 296,170 L 298,206 L 270,220 L 216,212 L 212,186 Z" },
  { id:"w16", name:"Kinathukadavu",   zone:"South",   risk:"low",      cases:0, wqi:90, pop:"29K",
    path:"M 298,166 L 364,162 L 366,198 L 338,214 L 296,208 L 292,182 Z" },
  { id:"w17", name:"Thondamuthur",    zone:"SE",      risk:"low",      cases:0, wqi:86, pop:"27K",
    path:"M 364,158 L 418,154 L 422,188 L 396,204 L 360,198 L 356,174 Z" },
  { id:"w18", name:"Madukarai",       zone:"SW",      risk:"low",      cases:1, wqi:82, pop:"31K",
    path:"M 100,148 L 158,146 L 162,180 L 142,196 L 100,188 L 90,164  Z" },
  { id:"w19", name:"Pollachi",        zone:"SW",      risk:"medium",   cases:2, wqi:74, pop:"68K",
    path:"M 50,132  L 104,128 L 106,160 L 82,178  L 48,166  L 42,144  Z" },
  { id:"w20", name:"Perur",           zone:"South",   risk:"low",      cases:0, wqi:90, pop:"22K",
    path:"M 162,218 L 218,212 L 218,244 L 196,254 L 158,244 L 154,226 Z" },
];

function pathCentroid(d) {
  const pts = [...d.matchAll(/[ML]\s*([\d.]+)[, ]+([\d.]+)/g)].map(m=>({x:+m[1],y:+m[2]}));
  if (!pts.length) return {x:0,y:0};
  return { x:pts.reduce((s,p)=>s+p.x,0)/pts.length, y:pts.reduce((s,p)=>s+p.y,0)/pts.length };
}

/* ═══════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════ */
function Pill({ level, children }) {
  const m = LEVEL[level] || LEVEL.low;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600,
      padding:"3px 10px", borderRadius:999, background:m.bg, color:m.color,
      border:"1px solid "+m.border, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:m.dot, flexShrink:0 }}/>
      {children || m.label}
    </span>
  );
}

function Card({ children, style={}, glow }) {
  return (
    <div className="glass-card" style={{ 
      borderRadius:16, 
      padding:20, 
      position:"relative", 
      overflow:"hidden",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      boxShadow: glow
        ? `0 0 40px ${glow}18, 0 8px 32px rgba(0,0,0,0.3)`
        : "0 8px 32px rgba(0,0,0,0.3)",
      ...style 
    }}>
      <div style={{ 
        position:"absolute", 
        top:0, 
        left:0, 
        right:0, 
        height:1,
        background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.3),transparent)",
        pointerEvents:"none" 
      }}/>
      {children}
    </div>
  );
}

function KPICard({ label, value, delta, deltaDir, color, icon }) {
  return (
    <Card glow={color} style={{ display:"flex", flexDirection:"column", gap:8, minWidth:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <span style={{ fontSize:11, color:D.textMid, fontWeight:500, textTransform:"uppercase",
          letterSpacing:"0.05em", lineHeight:1.3 }}>{label}</span>
        <span style={{ fontSize:18, flexShrink:0, marginLeft:4 }}>{icon}</span>
      </div>
      <div style={{ fontSize:32, fontWeight:800, color:color||D.text, lineHeight:1, letterSpacing:"-0.03em" }}>{value}</div>
      {delta && (
        <div style={{ fontSize:11, fontWeight:500,
          color: deltaDir==="up"?D.critical : deltaDir==="down"?D.low : D.textMid }}>
          {deltaDir==="up"?"↑ ":deltaDir==="down"?"↓ ":""}{delta}
        </div>
      )}
    </Card>
  );
}

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:D.surface3, border:"1px solid "+D.border, borderRadius:10,
      padding:"10px 14px", fontSize:12, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontWeight:700, color:D.text, marginBottom:4 }}>{label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.name} style={{ display:"flex", gap:8 }}>
          <span style={{ color:D.textMid }}>{p.name}:</span>
          <span style={{ fontWeight:600, color:p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function WaterMeter({ label, value, max, unit, status, display }) {
  const pct = Math.min((value/max)*100, 100);
  const col = STATUS_COLOR[status];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
      <div style={{ width:68, fontSize:11, color:D.textMid, flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, height:6, background:D.surface3, borderRadius:99, overflow:"hidden", minWidth:0 }}>
        <div style={{ width:pct+"%", height:"100%", background:col, borderRadius:99,
          boxShadow:"0 0 8px "+col+"60", transition:"width 1s ease" }}/>
      </div>
      <div style={{ width:58, fontSize:12, fontWeight:600, color:col, textAlign:"right", flexShrink:0 }}>{display}{unit}</div>
    </div>
  );
}

function ForecastBar({ pct, level }) {
  const col = LEVEL[level]?.color || D.info;
  return (
    <div style={{ flex:1, background:D.surface3, borderRadius:6, overflow:"hidden", height:55, position:"relative" }}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:pct+"%",
        background:col+"20", borderTop:"2px solid "+col,
        boxShadow:"0 -2px 8px "+col+"40", borderRadius:"4px 4px 0 0",
        transition:"height 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>
      <div style={{ position:"absolute", top:"50%", left:0, right:0,
        transform:"translateY(-50%)", textAlign:"center", fontSize:10,
        fontWeight:700, color:col, textShadow:"0 0 12px "+col }}>{pct}%</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GOOGLE-MAPS STYLE COIMBATORE MAP
   Tooltip is a plain HTML div — NOT foreignObject —
   so it always renders and never blocks clicks.
═══════════════════════════════════════════════════ */
function CoimbatoreMap({ isMobile, filter = "all", onFilterChange = () => {} }) {
  const [hovId, setHovId]   = useState(null);
  const [mouse, setMouse]   = useState({ x:0, y:0 });
  const wrapRef             = useRef(null);
  const ward = CBE_WARDS.find(w => w.id === hovId) || null;

  function onMove(e, id) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
    setHovId(id);
  }

  // tooltip sizing + clamping
  const TW = 196, TH = 156;
  const cw  = wrapRef.current?.offsetWidth  || 560;
  const ch  = wrapRef.current?.offsetHeight || 340;
  const tx  = mouse.x + 14 + TW > cw ? mouse.x - TW - 10 : mouse.x + 14;
  const ty  = Math.max(4, Math.min(mouse.y - TH/2, ch - TH - 4));

  return (
    <div ref={wrapRef} style={{ position:"relative", borderRadius:12, overflow:"visible", userSelect:"none" }}>

      {/* ── SVG: Google Maps day style ── */}
      <svg viewBox="0 0 560 290"
        style={{ width:"100%", height: isMobile ? 220 : 310, display:"block" }}>
        <defs>
          <linearGradient id="gLand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#F0EDE4"/>
            <stop offset="100%" stopColor="#E6E0D2"/>
          </linearGradient>
          <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#B0D8EE"/>
            <stop offset="100%" stopColor="#8EC4DC"/>
          </linearGradient>
          <linearGradient id="gPark" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%"  stopColor="#C2D9A4"/>
            <stop offset="100%" stopColor="#D0E6B0"/>
          </linearGradient>
          <filter id="fShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor="rgba(0,0,0,0.2)"/>
          </filter>
          <filter id="fHover">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.32)"/>
          </filter>
          <radialGradient id="gVig" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.13)"/>
          </radialGradient>
          {/* subtle map tile pattern */}
          <pattern id="pTile" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(160,148,128,0.13)" strokeWidth="0.4"/>
          </pattern>
        </defs>

        {/* Base land */}
        <rect width="560" height="290" fill="url(#gLand)"/>
        <rect width="560" height="290" fill="url(#pTile)"/>

        {/* Western Ghats / Nilgiris hilly shading NW */}
        <path d="M0,0 L160,0 L120,56 L64,86 L0,90 Z" fill="#DDDBC8" opacity="0.5"/>
        <path d="M0,0 L80,0 L48,44 L0,52 Z"          fill="#D0CEBC" opacity="0.4"/>

        {/* Dry eastern scrub */}
        <path d="M440,0 L560,0 L560,120 L478,72 L448,36 Z" fill="#E0D8C0" opacity="0.38"/>

        {/* Parks / green zones */}
        <ellipse cx="72"  cy="82"  rx="42" ry="28" fill="url(#gPark)" opacity="0.72"/>
        <ellipse cx="462" cy="58"  rx="36" ry="22" fill="url(#gPark)" opacity="0.58"/>
        <ellipse cx="84"  cy="198" rx="32" ry="20" fill="url(#gPark)" opacity="0.52"/>
        <ellipse cx="484" cy="204" rx="28" ry="18" fill="url(#gPark)" opacity="0.46"/>
        <ellipse cx="284" cy="264" rx="52" ry="18" fill="url(#gPark)" opacity="0.40"/>
        <text x="44"  y="85"  fontSize="6.5" fill="#3D6B30" fontFamily="sans-serif" fontStyle="italic" opacity="0.85">Forest</text>
        <text x="440" y="61"  fontSize="6.5" fill="#3D6B30" fontFamily="sans-serif" fontStyle="italic" opacity="0.72">Reserve</text>

        {/* Siruvani Reservoir */}
        <ellipse cx="50" cy="122" rx="22" ry="14" fill="url(#gWater)" stroke="#5AAEC8" strokeWidth="0.8" opacity="0.92"/>
        <text x="16" y="140" fontSize="6" fill="#1E6080" fontFamily="sans-serif" fontStyle="italic">Siruvani</text>

        {/* Pillur Reservoir */}
        <ellipse cx="100" cy="72" rx="18" ry="11" fill="url(#gWater)" stroke="#5AAEC8" strokeWidth="0.8" opacity="0.88"/>
        <text x="70" y="67" fontSize="6" fill="#1E6080" fontFamily="sans-serif" fontStyle="italic">Pillur Res.</text>

        {/* ── Noyyal River — wide realistic stroke ── */}
        {/* soft glow behind */}
        <path d="M0,154 C50,146 98,140 154,144 C208,150 256,146 308,142 C356,138 400,144 448,152 C486,158 522,156 560,152"
          fill="none" stroke="#AAD8F0" strokeWidth="10" strokeLinecap="round" opacity="0.38"/>
        {/* main channel */}
        <path d="M0,154 C50,146 98,140 154,144 C208,150 256,146 308,142 C356,138 400,144 448,152 C486,158 522,156 560,152"
          fill="none" stroke="#6EC0E0" strokeWidth="5.5" strokeLinecap="round" opacity="0.92"/>
        {/* highlight shimmer */}
        <path d="M0,153 C50,145 98,139 154,143 C208,149 256,145 308,141 C356,137 400,143 448,151 C486,157 522,155 560,151"
          fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="185" y="139" fontSize="7.5" fill="#1A6E8E" fontFamily="sans-serif" fontStyle="italic">Noyyal River</text>

        {/* ── Road network ── */}
        {/* Outer city bypass ring */}
        <path d="M136,42 C262,20 402,34 472,82 C514,112 516,172 480,220 C450,256 368,278 264,280 C160,280 80,256 50,210 C18,162 34,94 136,42"
          fill="none" stroke="#F0EAD8" strokeWidth="4" strokeOpacity="0.78"/>
        <path d="M136,42 C262,20 402,34 472,82 C514,112 516,172 480,220 C450,256 368,278 264,280 C160,280 80,256 50,210 C18,162 34,94 136,42"
          fill="none" stroke="#DCA820" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="10,8"/>

        {/* NH 544  East-West national highway */}
        <path d="M0,154 L560,142" fill="none" stroke="white" strokeWidth="4.5" strokeOpacity="0.88"/>
        <path d="M0,154 L560,142" fill="none" stroke="#F0C030" strokeWidth="1.6" strokeOpacity="0.68" strokeDasharray="14,9"/>
        <rect x="460" y="133" width="46" height="13" rx="3" fill="#E8B820" opacity="0.88"/>
        <text x="483" y="143" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#4A2E00" fontFamily="sans-serif">NH 544</text>

        {/* NH 67  North-South national highway */}
        <path d="M224,0 L214,290" fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.84"/>
        <path d="M224,0 L214,290" fill="none" stroke="#F0C030" strokeWidth="1.4" strokeOpacity="0.62" strokeDasharray="14,9"/>
        <rect x="214" y="12" width="34" height="13" rx="3" fill="#E8B820" opacity="0.88"/>
        <text x="231" y="22" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#4A2E00" fontFamily="sans-serif">NH 67</text>

        {/* Secondary roads */}
        <path d="M224,154 L312,98"  fill="none" stroke="#EDE8DC" strokeWidth="2.2" strokeOpacity="0.78"/>
        <path d="M224,154 L140,184" fill="none" stroke="#EDE8DC" strokeWidth="2.2" strokeOpacity="0.72"/>
        <path d="M312,134 L398,130" fill="none" stroke="#EDE8DC" strokeWidth="2"   strokeOpacity="0.68"/>
        <path d="M224,154 L244,224" fill="none" stroke="#EDE8DC" strokeWidth="2"   strokeOpacity="0.68"/>
        <path d="M160,146 L206,148" fill="none" stroke="#EDE8DC" strokeWidth="1.6" strokeOpacity="0.62"/>
        <path d="M310,134 L314,168" fill="none" stroke="#EDE8DC" strokeWidth="1.6" strokeOpacity="0.6"/>

        {/* ── Ward polygons ── */}
        {CBE_WARDS.map(w => {
          const r    = RS[w.risk];
          const isH  = hovId === w.id;
          const show = filter === "all" || w.risk === filter;
          const c    = pathCentroid(w.path);
          return (
            <g key={w.id} opacity={show ? 1 : 0.18} filter={isH ? "url(#fHover)" : "url(#fShadow)"}>
              <path d={w.path}
                fill={isH ? r.stroke+"68" : r.fill}
                stroke={r.stroke}
                strokeWidth={isH ? 2.5 : 1.4}
                strokeOpacity={isH ? 1 : 0.78}
                style={{ cursor: show ? "pointer" : "default", transition:"fill 0.15s, stroke-width 0.12s" }}
                onMouseMove={show ? e => onMove(e, w.id) : undefined}
                onMouseLeave={show ? () => setHovId(null) : undefined}
              />
              {/* Ward name */}
              <text x={c.x} y={c.y - (w.cases>0 ? 5 : 2)}
                textAnchor="middle"
                fontSize={isH ? 7.5 : 6.5}
                fontWeight={isH ? "800" : "700"}
                fill={isH ? r.stroke : r.label}
                fontFamily="'DM Sans','Segoe UI',sans-serif"
                pointerEvents="none" style={{ userSelect:"none" }}>
                {w.name.length > 11 ? w.name.split(" ")[0] : w.name}
              </text>
              {/* Case count badge */}
              {w.cases > 0 && (
                <g pointerEvents="none">
                  <circle cx={c.x} cy={c.y+8} r={isH ? 7.5 : 6.5}
                    fill={r.stroke} opacity={isH ? 1 : 0.9}
                    stroke="white" strokeWidth={isH ? 1.5 : 1}/>
                  <text x={c.x} y={c.y+11.5} textAnchor="middle"
                    fontSize="7" fontWeight="900" fill="white" fontFamily="sans-serif">
                    {w.cases}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* City-centre Google-blue dot */}
        <g pointerEvents="none">
          <circle cx="224" cy="154" r="11" fill="#4285F4" fillOpacity="0.14"/>
          <circle cx="224" cy="154" r="5.5" fill="#4285F4" stroke="white" strokeWidth="1.5"/>
          <text x="234" y="150" fontSize="8" fontWeight="800" fill="#1A4EC4"
            fontFamily="'DM Sans',sans-serif">Coimbatore</text>
        </g>

        {/* Vignette */}
        <rect width="560" height="290" fill="url(#gVig)" pointerEvents="none"/>

        {/* ── Compass rose — Google Maps style ── */}
        <g transform="translate(530,26)" pointerEvents="none">
          <circle cx="0" cy="0" r="17" fill="white" fillOpacity="0.93"
            stroke="#C4BAA8" strokeWidth="0.8"
            style={{filter:"drop-shadow(0 2px 5px rgba(0,0,0,0.18))"}}/>
          <polygon points="0,-13  4,-3  0,1  -4,-3"  fill="#E03030"/>
          <polygon points="0,13   4,3   0,-1  -4,3"  fill="#A8A098"/>
          <polygon points="-13,0  -3,4  1,0  -3,-4"  fill="#B8B0A0"/>
          <polygon points="13,0   3,-4  -1,0  3,4"   fill="#B8B0A0"/>
          <text x="0" y="-15" textAnchor="middle" fontSize="8" fontWeight="900"
            fill="#E03030" fontFamily="sans-serif">N</text>
        </g>

        {/* ── Scale bar — Google Maps style ── */}
        <g transform="translate(14,272)" pointerEvents="none">
          <rect x="-2" y="-9" width="80" height="18" rx="3"
            fill="white" fillOpacity="0.84" stroke="#C4BAA8" strokeWidth="0.6"/>
          <rect x="0" y="-3" width="38" height="6" fill="#555" rx="1"/>
          <rect x="38" y="-3" width="38" height="6" fill="white" stroke="#888" strokeWidth="0.5" rx="1"/>
          <line x1="0"  y1="-5" x2="0"  y2="5" stroke="#555" strokeWidth="1"/>
          <line x1="38" y1="-5" x2="38" y2="5" stroke="#888" strokeWidth="0.8"/>
          <line x1="76" y1="-5" x2="76" y2="5" stroke="#888" strokeWidth="0.8"/>
          <text x="0"  y="12" fontSize="6.5" fill="#555" fontFamily="sans-serif">0</text>
          <text x="34" y="12" fontSize="6.5" fill="#555" fontFamily="sans-serif">10</text>
          <text x="68" y="12" fontSize="6.5" fill="#555" fontFamily="sans-serif">20 km</text>
        </g>

        {/* Watermark */}
        <text x="558" y="288" textAnchor="end" fontSize="6.5" fill="#888070" fontFamily="sans-serif">
          Coimbatore District  ·  Ward Risk Overlay
        </text>
      </svg>

      {/* ── HTML Tooltip — outside SVG, always works ── */}
      {ward && (
        <div style={{ position:"absolute", left:tx, top:ty, width:TW,
          pointerEvents:"none", zIndex:60 }}>
          <div style={{ background:"white", borderRadius:10, overflow:"hidden",
            boxShadow:"0 4px 24px rgba(0,0,0,0.26), 0 1px 4px rgba(0,0,0,0.12)",
            fontFamily:"'DM Sans','Segoe UI',sans-serif", border:"1px solid #E0D8CC" }}>
            {/* coloured top stripe */}
            <div style={{ height:5, background:RS[ward.risk].stroke }}/>
            <div style={{ padding:"10px 13px 12px" }}>
              {/* name + badge */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6, marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#1A1A1A", letterSpacing:"-0.01em", lineHeight:1.2 }}>
                  {ward.name}
                </div>
                <span style={{ fontSize:9, fontWeight:700, padding:"3px 7px", borderRadius:99, flexShrink:0,
                  background:RS[ward.risk].badge, color:RS[ward.risk].stroke,
                  border:"1px solid "+RS[ward.risk].stroke+"55", textTransform:"uppercase" }}>
                  {ward.risk}
                </span>
              </div>
              <div style={{ fontSize:10, color:"#888", marginBottom:9 }}>📍 {ward.zone} Zone · Coimbatore</div>
              <div style={{ height:1, background:"#F0EBE2", marginBottom:8 }}/>
              {[
                { icon:"🦠", label:"Active Cases", val:ward.cases,
                  color:ward.cases>4?"#DC2626":ward.cases>1?"#B45309":"#15803D" },
                { icon:"🧪", label:"Water Quality", val:ward.wqi+"/100",
                  color:ward.wqi<55?"#DC2626":ward.wqi<70?"#B45309":"#15803D" },
                { icon:"👥", label:"Population",   val:ward.pop, color:"#1D4ED8" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:10, color:"#666" }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* caret */}
          <div style={{ position:"absolute", bottom:-7,
            left: tx+TW+10 > cw ? TW-18 : 18,
            width:0, height:0,
            borderLeft:"7px solid transparent", borderRight:"7px solid transparent",
            borderTop:"7px solid white",
            filter:"drop-shadow(0 2px 2px rgba(0,0,0,0.1))" }}/>
        </div>
      )}

      {/* Clickable filter buttons */}
      <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
        {[["all","All","#38BDF8"],["critical","Critical","#F43F5E"],["high","High","#FB923C"],["medium","Medium","#FBBF24"],["low","Low","#34D399"]].map(([k,v,col]) => {
          const on = filter === k;
          return (
            <button key={k} onClick={() => onFilterChange(k)} style={{
              display:"flex", alignItems:"center", gap:5,
              fontSize:11, fontWeight:600, cursor:"pointer",
              padding:"4px 10px", borderRadius:6, transition:"all 0.15s", outline:"none",
              background: on ? col+"22" : "transparent",
              color:      on ? col : D.textMid,
              border:"1px solid "+(on ? col+"66" : D.border2),
            }}>
              {k !== "all" && <div style={{ width:9, height:9, borderRadius:2, flexShrink:0,
                background: on ? col : "transparent", border:"1.5px solid "+col }}/>}
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════ */
export default function App() {
  const [clock, setClock]               = useState("");
  const [activeTab, setActiveTab]       = useState("forecast");
  const [activeWardTab, setActiveWardTab] = useState("all");
  const [mapFilter, setMapFilter]       = useState("all");
  const ml = useMLRisk();
  const rm = RISK_META[ml.risk] || RISK_META.medium;
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-IN",
        { timeZone:"Asia/Kolkata", hour12:false }) + " IST");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredWards = activeWardTab === "all"
    ? wards
    : wards.filter(w => w.risk === activeWardTab);

  const pad        = isMobile ? "14px" : isTablet ? "20px" : "28px 32px";
  const kpiCols    = isMobile ? "1fr 1fr" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)";
  const mainCols   = isMobile || isTablet ? "1fr" : "1fr 1fr 340px";
  const bottomCols = isMobile ? "1fr" : "1fr 1fr";
  const chartH     = isMobile ? 180 : 200;

  const tabBtn = (label, val) => (
    <button onClick={() => setActiveTab(val)} style={{
      fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:8,
      cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s",
      border:"1px solid "+(activeTab===val ? "rgba(56,189,248,0.5)" : D.border2),
      background: activeTab===val ? "rgba(56,189,248,0.12)" : "transparent",
      color:       activeTab===val ? D.info : D.textMid,
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif",
      background:D.bg, minHeight:"100vh", color:D.text,
      display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>

      {/* Hero Background with generated image */}
      <div style={{ 
        position:"fixed", inset:0,
        backgroundImage:"url('/hero-bg.png')",
        backgroundSize:"cover",
        backgroundPosition:"center",
        opacity: 0.15,
        pointerEvents:"none", 
        zIndex:0 
      }}/>
      <div style={{ position:"fixed", inset:0,
        backgroundImage:"radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 60%)",
        pointerEvents:"none", zIndex:0 }}/>

      {/* ── TOPBAR ── */}
      <div className="glass" style={{ 
        position:"sticky", top:0, zIndex:50, width:"100%", height:70,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxSizing:"border-box", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ width:"100%", maxWidth:1440,
          padding:"0 "+(isMobile?"14px":"32px"),
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxSizing:"border-box" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:12,
              background:"linear-gradient(135deg, var(--primary), var(--secondary))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, boxShadow:"0 0 24px var(--primary-glow)", 
              flexShrink:0, animation: "float 4s ease-in-out infinite" }}>💧</div>
            <div>
              <div className="text-gradient" style={{ fontSize:isMobile?16:22, fontWeight:800,
                letterSpacing:"-0.03em", fontFamily: "var(--font-display)" }}>AquaWatch CBE</div>
              {!isMobile && <div style={{ fontSize:11, color:D.textMid, fontWeight: 500 }}>
                Coimbatore District — Health Surveillance & Outbreak Prediction</div>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:isMobile?12:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6,
              background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)",
              borderRadius:999, padding:isMobile?"6px 12px":"8px 18px",
              fontSize:12, fontWeight:700, color:D.low }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:D.low,
                animation:"pulse 2s infinite", display:"inline-block",
                boxShadow:"0 0 12px "+D.low, flexShrink:0 }}/>
              {isMobile ? "Live" : "System Online"}
            </div>
            {!isMobile && <div style={{ fontSize:14, color:D.text,
              fontVariantNumeric:"tabular-nums", fontWeight: 700, opacity: 0.8 }}>{clock}</div>}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position:"relative", zIndex:1, padding:pad,
        maxWidth:1440, width:"100%", boxSizing:"border-box" }}>

        {/* KPI ROW */}
        <div style={{ display:"grid", gridTemplateColumns:kpiCols, gap:12, marginBottom:14 }}>
          <KPICard label="Active Cases (7-day)" value="47"  delta="12 from last week" deltaDir="up"  color={D.critical} icon="🦠"/>
          <KPICard label="High-Risk Wards"      value="9"   delta="of 100 wards"                     color={D.high}     icon="📍"/>
          <KPICard label="PHC Reports Pending"  value="23"  delta="across 6 taluks"                  color={D.medium}   icon="🏥"/>
          <KPICard label="AI Confidence"        value="87%" delta="14-day forecast"                  color={D.info}     icon="🤖"/>
          <KPICard label="Water Samples"        value="142" delta="10 failed QC"      deltaDir="up"  color={D.low}      icon="🧪"/>
        </div>

        {/* MAIN 3-COL */}
        <div style={{ display:"grid", gridTemplateColumns:mainCols, gap:14, marginBottom:14 }}>

          {/* AI PREDICTION */}
          <div style={{ borderRadius:16, padding:20, position:"relative", overflow:"visible",
            background:"linear-gradient(145deg,#0A1628 0%,#0F1E3A 60%,#0A1628 100%)",
            border:"1px solid rgba(56,189,248,0.2)",
            boxShadow:"0 12px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ position:"absolute", inset:0,
              backgroundImage:"radial-gradient(rgba(56,189,248,0.06) 1px, transparent 1px)",
              backgroundSize:"22px 22px", pointerEvents:"none" }}/>
            <div style={{ position:"absolute", top:-70, right:-50, width:250, height:250,
              background:"radial-gradient(circle,rgba(56,189,248,0.08) 0%,transparent 70%)",
              pointerEvents:"none" }}/>
            <div style={{ position:"absolute", bottom:-50, left:-30, width:200, height:200,
              background:"radial-gradient(circle,"+rm.glow+" 0%,transparent 70%)",
              pointerEvents:"none", transition:"background 0.8s" }}/>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
              background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.5),transparent)",
              pointerEvents:"none" }}/>


            {/* ── ML risk badge — true top-right of card ── */}
            <div style={{ position:"absolute", top:14, right:16, zIndex:20,
              display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
              <button
                onClick={ml.refetch}
                onTouchStart={e => e.currentTarget.style.transform = "scale(0.93)"}
                onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; ml.refetch(); }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  background: rm.bg, border:"1px solid "+rm.border,
                  borderRadius:999, padding:"8px 14px",
                  fontSize:12, fontWeight:700, color:rm.color,
                  cursor:"pointer", transition:"transform 0.15s, box-shadow 0.3s",
                  boxShadow:"0 0 18px "+rm.bg+", 0 2px 8px rgba(0,0,0,0.4)",
                  outline:"none", WebkitTapHighlightColor:"transparent",
                  touchAction:"manipulation", userSelect:"none",
                  minHeight:36, minWidth:44,
                }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:rm.pulse,
                  animation: ml.loading ? "none" : "pulse 2s infinite",
                  display:"inline-block", flexShrink:0,
                  opacity: ml.loading ? 0.4 : 1 }}/>
                {ml.loading ? "Updating…" : rm.label}
              </button>
              <div style={{ fontSize:9, color:D.textDim, textAlign:"right" }}>
                {ml.error
                  ? <span style={{ color:"#F87171" }}>⚠ offline</span>
                  : ml.lastUpdate
                    ? ml.lastUpdate.toLocaleTimeString("en-IN",{hour12:false,timeZone:"Asia/Kolkata"})
                    : "connecting…"}
              </div>
            </div>

            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ marginBottom:14, paddingRight:110 }}>
                <div style={{ fontSize:14, fontWeight:700, color:D.text }}>🤖 AI Outbreak Prediction</div>
                <div style={{ fontSize:11, color:D.textMid, marginTop:2 }}>LSTM + Random Forest Ensemble</div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10,
                marginBottom:14, paddingBottom:14, borderBottom:"1px solid rgba(56,189,248,0.1)" }}>
                {[{l:"Cases",val:String(ml.cases),c:D.info},{l:"Peak",val:String(ml.peak),c:D.critical},
                  {l:"To Peak",val:"10d",c:D.high},{l:"Confidence",val:ml.confidence+"%",c:D.low}].map(s => (
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:s.c,
                      letterSpacing:"-0.03em", lineHeight:1,
                      textShadow:"0 0 20px "+s.c+"60" }}>{s.val}</div>
                    <div style={{ fontSize:10, color:D.textMid, marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                {tabBtn("14-Day Forecast","forecast")}
                {tabBtn("Weekly Breakdown","weekly")}
              </div>

              {activeTab === "forecast" ? (
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={forecastData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#38BDF8" stopOpacity={0.28}/>
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#FB923C" stopOpacity={0.28}/>
                        <stop offset="100%" stopColor="#FB923C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.07)" vertical={false}/>
                    <XAxis dataKey="day" tick={{ fontSize:9, fill:D.textMid }} axisLine={false} tickLine={false} interval={isMobile?2:1}/>
                    <YAxis tick={{ fontSize:9, fill:D.textMid }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <ReferenceLine y={60} stroke={D.critical} strokeDasharray="4 3" strokeOpacity={0.65}
                      label={{ value:"Threshold", fill:"#F87171", fontSize:9, position:"insideTopRight" }}/>
                    <Area type="monotone" dataKey="actual"    name="Actual"    stroke="#38BDF8" fill="url(#gA)" strokeWidth={2.5} dot={{ r:3, fill:"#38BDF8", strokeWidth:0 }} connectNulls={false}/>
                    <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#FB923C" fill="url(#gP)" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r:3, fill:"#FB923C", strokeWidth:0 }} connectNulls={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={chartH}>
                  <BarChart data={weeklyData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.07)" vertical={false}/>
                    <XAxis dataKey="day" tick={{ fontSize:9, fill:D.textMid }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:9, fill:D.textMid }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="cholera"   name="Cholera"     fill={D.critical} radius={[3,3,0,0]}/>
                    <Bar dataKey="typhoid"   name="Typhoid"     fill={D.high}     radius={[3,3,0,0]}/>
                    <Bar dataKey="dysentery" name="Dysentery"   fill={D.medium}   radius={[3,3,0,0]}/>
                    <Bar dataKey="hepatitis" name="Hepatitis A" fill={D.low}      radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap" }}>
                {[{color:"#38BDF8",label:"Actual",dash:false},{color:"#FB923C",label:"Predicted",dash:true},{color:"#F43F5E",label:"Threshold",dash:true}].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:D.textMid }}>
                    <div style={{ width:18, height:2, flexShrink:0,
                      background: l.dash ? "transparent" : l.color,
                      borderTop: l.dash ? "2px dashed "+l.color : "none", borderRadius:2 }}/>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* WATER QUALITY */}
          <Card glow={D.info}>
            <div style={{ fontSize:14, fontWeight:700, color:D.text, marginBottom:2 }}>Water Quality Index</div>
            <div style={{ fontSize:11, color:D.textMid, marginBottom:16 }}>142 samples — Coimbatore District</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:48, fontWeight:800, color:D.critical, lineHeight:1,
                  letterSpacing:"-0.04em", textShadow:"0 0 30px rgba(244,63,94,0.4)" }}>61</div>
                <div style={{ fontSize:12, color:D.medium, fontWeight:600, marginTop:3 }}>Marginal Quality</div>
              </div>
              <div style={{ width:72, height:72, borderRadius:"50%", background:D.surface3,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28, border:"1px solid "+D.border, flexShrink:0 }}>🧪</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              {waterParams.map(p => <WaterMeter key={p.label} {...p}/>)}
            </div>
          </Card>

          {/* ALERTS */}
          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid "+D.border,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:D.text }}>Early Warnings</div>
              <div style={{ display:"flex", alignItems:"center", gap:5,
                fontSize:11, fontWeight:600, color:D.critical }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:D.critical,
                  animation:"pulse 2s infinite", display:"inline-block" }}/>
                3 Critical
              </div>
            </div>
            <div style={{ overflowY:"auto", maxHeight: isDesktop ? 420 : 260 }}>
              {alerts.map(a => {
                const lv = LEVEL[a.level];
                return (
                  <div key={a.id}
                    style={{ padding:"12px 18px", borderBottom:"1px solid "+D.border2,
                      borderLeft:"3px solid "+lv.color,
                      display:"flex", gap:10, alignItems:"flex-start",
                      cursor:"pointer", transition:"background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = D.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize:15, flexShrink:0 }}>{a.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:D.text, marginBottom:2,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                      <div style={{ fontSize:11, color:D.textMid, lineHeight:1.5 }}>{a.desc}</div>
                    </div>
                    <div style={{ fontSize:10, color:D.textDim, flexShrink:0, paddingTop:2, whiteSpace:"nowrap" }}>{a.time}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* BOTTOM 2-COL */}
        <div style={{ display:"grid", gridTemplateColumns:bottomCols, gap:14 }}>

          {/* MAP */}
          <Card style={{ overflow:"visible" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:D.text, marginBottom:2 }}>Ward Risk Map</div>
                <div style={{ fontSize:11, color:D.textMid }}>Coimbatore District — Hover a ward to inspect</div>
              </div>
              <Pill level="low">Live</Pill>
            </div>
            <CoimbatoreMap isMobile={isMobile} filter={mapFilter} onFilterChange={setMapFilter}/>
          </Card>

          {/* RIGHT COLUMN */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* WARD TABLE — fixed filter buttons */}
            <Card style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:D.text }}>Ward Risk Table</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {["all","critical","high","medium","low"].map(t => {
                    const lv  = LEVEL[t];           // undefined for "all"
                    const on  = activeWardTab === t;
                    const activeBg     = lv ? lv.bg     : D.surface2;
                    const activeColor  = lv ? lv.color  : D.info;
                    const activeBorder = lv ? lv.border : "rgba(56,189,248,0.4)";
                    return (
                      <button key={t}
                        onClick={() => setActiveWardTab(t)}
                        style={{
                          fontSize:10, padding:"4px 10px", borderRadius:6,
                          cursor:"pointer", fontWeight:600, textTransform:"capitalize",
                          transition:"all 0.15s", outline:"none",
                          background: on ? activeBg  : "transparent",
                          color:      on ? activeColor : D.textMid,
                          border: "1px solid " + (on ? activeBorder : D.border2),
                        }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:280 }}>
                  <thead>
                    <tr>
                      {["Ward","Risk","Cases","WQI"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"6px 8px",
                          fontWeight:600, fontSize:11, color:D.textMid,
                          borderBottom:"1px solid "+D.border }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWards.map((w,i) => (
                      <tr key={i}
                        onMouseEnter={e => e.currentTarget.style.background = D.surface2}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding:"8px 8px", fontWeight:600, color:D.text }}>{w.name}</td>
                        <td style={{ padding:"8px 8px" }}><Pill level={w.risk}/></td>
                        <td style={{ padding:"8px 8px", fontWeight:700, color:LEVEL[w.risk]?.color }}>{w.cases}</td>
                        <td style={{ padding:"8px 8px", fontWeight:600,
                          color:w.wqi>=75?D.low:w.wqi>=60?D.medium:D.critical }}>{w.wqi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 14-DAY FORECAST BARS */}
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:700, color:D.text }}>14-Day Risk Forecast</div>
                <div style={{ fontSize:11, color:D.textMid }}>
                  Confidence: <span style={{ color:D.info, fontWeight:700 }}>87%</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:3, overflowX: isMobile?"auto":"visible",
                paddingBottom: isMobile?4:0 }}>
                {(isMobile ? forecastDays.slice(0,7) : forecastDays).map((d,i) => (
                  <div key={i} style={{ flex:"1 0 "+(isMobile?"44px":"auto"),
                    display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <ForecastBar pct={d.pct} level={d.level}/>
                    <div style={{ fontSize:8, color:D.textDim, textAlign:"center",
                      lineHeight:1.2, whiteSpace:"nowrap" }}>{d.date.slice(4)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, padding:"8px 12px", background:D.surface3,
                borderRadius:8, border:"1px solid "+D.border2,
                fontSize:11, color:D.textMid, lineHeight:1.6 }}>
                🔬 Inputs: Water sensors, PHC reports, Rainfall, History, Sanitation
              </div>
            </Card>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop:20, padding:"14px 0",
          borderTop:"1px solid "+D.border,
          display:"flex", justifyContent:"space-between",
          flexWrap:"wrap", gap:8, fontSize:11, color:D.textDim }}>
          <span>AquaWatch CBE v2.1 — TWAD Board · PHC Network · IMD · TNPCB</span>
          <span>
            Last sync: <span style={{ color:D.info, fontWeight:600 }}>2 min ago</span> ·
            Nodes: <span style={{ color:D.low, fontWeight:600 }}>34/38 online</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin:0; padding:0; width:100%; background:#080E1A; overflow-x:hidden; }
        body  { display:flex; flex-direction:column; align-items:center; }
        #root { width:100%; display:flex; flex-direction:column; align-items:center; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.2); border-radius:99px; }
      `}</style>
    </div>
  );
}