import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Download,
  Star,
  User,
  Calendar,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { categoriesNl, categoriesEn, Category, Instrument } from './data';
import { ParticipantScan, parseExcelScan } from './excelUtils';
import { GroupConsensusVisuals } from './GroupConsensusVisuals';

interface GroupAnalysisProps {
  isEnglish: boolean;
  isDarkMode: boolean;
  onBack: () => void;
  currentScanData?: {
    participantName: string;
    checkedDoeIk: Record<string, boolean>;
    checkedVergtActie: Record<string, boolean>;
    checkedNietNodig: Record<string, boolean>;
    confidence: Record<string, number>;
    comments: Record<string, string>;
    actionDetails: Record<string, { action?: string; who?: string; deadline?: string }>;
  };
}

// Helper to load state from localStorage
const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

function getCategoryColorHex(id: string) {
  switch (id) {
    case 'luk-kwaliteit': return '#f43f5e'; // rose-500
    case 'portfoliocriteria': return '#f97316'; // orange-500
    case 'kaders-procedures': return '#f59e0b'; // amber-500
    case 'organisatie': return '#10b981'; // emerald-500
    case 'profiel-examinatoren': return '#3b82f6'; // blue-500
    case 'digitale-systemen': return '#a855f7'; // purple-500
    case 'fraudebeleid': return '#d946ef'; // fuchsia-500
    default: return '#cbd5e1';
  }
}

export const GroupAnalysis: React.FC<GroupAnalysisProps> = ({
  isEnglish,
  isDarkMode,
  onBack
}) => {
  const [scans, setScans] = useState<ParticipantScan[]>(() => loadState('group_scans', []));
  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save uploaded scans to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('group_scans', JSON.stringify(scans));
    } catch (e) {
      console.error("Error saving scans to localStorage:", e);
    }
  }, [scans]);

  // Group consensus overrides (persisted separately to prevent stale state from overriding fresh scan consensus)
  const [groupConsensusOverrides, setGroupConsensusOverrides] = useState<Record<string, 'DOEN_WE' | 'VERGT_ACTIE' | 'NIET_NODIG' | 'NONE'>>(() => {
    // Clean up old legacy keys that caused incorrect active states
    try {
      localStorage.removeItem('group_doeIk');
      localStorage.removeItem('group_vergtActie');
      localStorage.removeItem('group_nietNodig');
    } catch {
      // ignore
    }
    return loadState('group_consensus_overrides_v1', {});
  });
  const [groupConfidence, setGroupConfidence] = useState<Record<string, number>>(() => loadState('group_confidence', {}));
  const [groupActionDetails, setGroupActionDetails] = useState<Record<string, { owner: string; deadline: string }>>(() => loadState('group_actionDetails', {}));
  const [showActionDetails, setShowActionDetails] = useState<boolean>(() => loadState('group_showActionDetails', true));
  const [groupAgendaOrder, setGroupAgendaOrder] = useState<string[]>(() => loadState('group_agendaOrder', []));

  // Save consensus state to localStorage
  useEffect(() => { localStorage.setItem('group_consensus_overrides_v1', JSON.stringify(groupConsensusOverrides)); }, [groupConsensusOverrides]);
  useEffect(() => { localStorage.setItem('group_confidence', JSON.stringify(groupConfidence)); }, [groupConfidence]);
  useEffect(() => { localStorage.setItem('group_actionDetails', JSON.stringify(groupActionDetails)); }, [groupActionDetails]);
  useEffect(() => { localStorage.setItem('group_showActionDetails', JSON.stringify(showActionDetails)); }, [showActionDetails]);
  useEffect(() => { localStorage.setItem('group_agendaOrder', JSON.stringify(groupAgendaOrder)); }, [groupAgendaOrder]);

  const categories = isEnglish ? categoriesEn : categoriesNl;

  // Effective consensus choices:
  // - 'Doen we' is ONLY active if in 100% of the answers 'doen we' was marked (when the bar is fully green).
  //   If not the case, the button is inactive.
  // - 'Vergt actie' is ONLY active if in 100% of the answers 'vergt actie' was marked.
  //   If not the case, the button is inactive.
  // - 'Niet nodig' is ONLY active if in 100% of the answers 'niet nodig' was marked.
  //   If not the case, the button is inactive.
  // - Manual consensus selections made by the group in this view are respected as overrides.
  const { effectiveGroupDoeIk, effectiveGroupVergtActie, effectiveGroupNietNodig } = useMemo(() => {
    const doeIk: Record<string, boolean> = {};
    const vergtActie: Record<string, boolean> = {};
    const nietNodig: Record<string, boolean> = {};

    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          const override = groupConsensusOverrides[inst.id];
          if (override !== undefined) {
            doeIk[inst.id] = override === 'DOEN_WE';
            vergtActie[inst.id] = override === 'VERGT_ACTIE';
            nietNodig[inst.id] = override === 'NIET_NODIG';
          } else {
            let doeIkCount = 0;
            let vergtActieCount = 0;
            let nietNodigCount = 0;
            let totalAnswered = 0;

            scans.forEach(s => {
              const c = s.instrumentChoices[inst.id];
              if (c === 'DOEN_WE') {
                doeIkCount++;
                totalAnswered++;
              } else if (c === 'VERGT_ACTIE') {
                vergtActieCount++;
                totalAnswered++;
              } else if (c === 'NIET_NODIG') {
                nietNodigCount++;
                totalAnswered++;
              }
            });

            // Uitsluitend actief als in 100% van de antwoorden 'doen we' is aangemerkt (dus balk volledig groen)
            doeIk[inst.id] = totalAnswered > 0 && doeIkCount === totalAnswered;
            // Uitsluitend actief als in 100% van de antwoorden 'vergt actie' is aangemerkt
            vergtActie[inst.id] = totalAnswered > 0 && vergtActieCount === totalAnswered;
            // Uitsluitend actief als in 100% van de antwoorden 'niet nodig' is aangemerkt
            nietNodig[inst.id] = totalAnswered > 0 && nietNodigCount === totalAnswered;
          }
        });
      });
    });

    return {
      effectiveGroupDoeIk: doeIk,
      effectiveGroupVergtActie: vergtActie,
      effectiveGroupNietNodig: nietNodig,
    };
  }, [categories, scans, groupConsensusOverrides]);

  // Handle file uploads
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const newScans: ParticipantScan[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const parsed = await parseExcelScan(file, scans.length + newScans.length);
          newScans.push(parsed);
        }
      }
      if (newScans.length > 0) {
        setScans(prev => [...prev, ...newScans]);
        setGroupConsensusOverrides({});
      }
    } catch (err) {
      console.error("Error parsing uploaded Excel files:", err);
      alert(isEnglish ? "An error occurred while reading one or more Excel files." : "Er is een fout opgetreden bij het inlezen van de Excel-bestanden.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove a scan
  const handleRemoveScan = (id: string) => {
    setScans(prev => prev.filter(s => s.id !== id));
  };

  // Clear all scans
  const handleClearAll = () => {
    if (confirm(isEnglish ? "Remove all uploaded scans?" : "Alle ingeladen scans verwijderen?")) {
      setScans([]);
      setGroupConsensusOverrides({});
      try {
        localStorage.removeItem('group_scans');
      } catch {
        // ignore
      }
    }
  };

  // Clear consensus choices
  const handleClearConsensus = () => {
    if (confirm(isEnglish ? "Clear all consensus choices and inputs?" : "Alle ingevoerde consensuskeuzes en actiepunten wissen?")) {
      setGroupConsensusOverrides({});
      setGroupConfidence({});
      setGroupActionDetails({});
      setGroupAgendaOrder([]);
    }
  };

  // 1. Spider Chart Data: Inzet van Instrumenten per Deelnemer (%)
  const spiderChartData = useMemo(() => {
    return categories.map(cat => {
      const row: Record<string, any> = {
        categoryId: cat.id,
        category: cat.id === 'luk-kwaliteit' ? (isEnglish ? 'Quality of LOU' : 'Kwaliteit van LUK') : cat.name,
      };

      scans.forEach((scan, idx) => {
        const key = `scan_${idx}`;
        const stats = scan.categoryStats[cat.id];
        row[key] = stats ? stats.inzetPercentage : 0;
      });

      return row;
    });
  }, [categories, scans, isEnglish]);

  // 2. Column Chart Data: Vertrouwen met Bereik (minimum - maximum)
  const columnChartData = useMemo(() => {
    return categories.map(cat => {
      const values: number[] = [];

      scans.forEach(scan => {
        const stats = scan.categoryStats[cat.id];
        if (stats) {
          values.push(stats.confidencePercentage);
        }
      });

      const n = values.length;
      const displayName = cat.id === 'luk-kwaliteit'
        ? (isEnglish ? 'Quality of LOU' : 'Kwaliteit van LUK')
        : cat.name;

      if (n === 0) {
        return {
          id: cat.id,
          name: displayName,
          mean: 0,
          min: 0,
          max: 0,
          whiskerTop: 0,
          whiskerBottom: 0,
          values: [],
          fill: getCategoryColorHex(cat.id),
        };
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const mean = Math.round((sum / n) * 10) / 10;
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Whisker represents the exact range [min, max]
      const whiskerTop = max;
      const whiskerBottom = min;

      return {
        id: cat.id,
        name: displayName,
        mean,
        min,
        max,
        whiskerTop,
        whiskerBottom,
        values,
        fill: getCategoryColorHex(cat.id),
      };
    });
  }, [categories, scans, isEnglish]);

  // Default category confidence map from participants average (for consensus fallback)
  const defaultCategoryConfidence = useMemo(() => {
    const map: Record<string, number> = {};
    columnChartData.forEach(item => {
      map[item.id] = item.mean;
    });
    return map;
  }, [columnChartData]);

  // Custom Tick for Spider Chart
  const renderSpiderTick = (props: any) => {
    const { x, y, payload } = props;
    const catName = payload.value;
    const words = catName.split(' ');
    let lines: string[] = [];
    if (words.length > 3) {
      lines = [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
    } else {
      lines = [catName];
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill={isDarkMode ? '#cbd5e1' : '#334155'}
        fontSize={10}
        fontWeight={500}
      >
        {lines.map((line, i) => (
          <tspan x={x} dy={i === 0 ? 0 : 12} key={i}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  // Custom Bar with Whisker representing the RANGE (minimum - maximum value) + Hover Highlight
  const renderBarWithWhisker = (props: any) => {
    const { fill, x, y, width, height, index } = props;
    const item = columnChartData[index];
    if (!item) return null;

    const barHeight = height;
    const baselineY = y + height;
    const pxPerUnit = item.mean > 0 ? barHeight / item.mean : 0;

    const whiskerTopY = baselineY - item.whiskerTop * pxPerUnit;
    const whiskerBottomY = baselineY - item.whiskerBottom * pxPerUnit;
    const centerX = x + width / 2;
    const capWidth = Math.max(6, Math.min(14, width * 0.4));

    // Hovered participant indicator
    const hoveredScan = hoveredParticipantId ? scans.find(s => s.id === hoveredParticipantId) : null;
    const participantValue = hoveredScan ? (hoveredScan.categoryStats[item.id]?.confidencePercentage ?? null) : null;
    const participantY = (participantValue !== null && pxPerUnit > 0)
      ? Math.max(y - 10, baselineY - participantValue * pxPerUnit)
      : null;

    return (
      <g key={`bar-group-${index}`}>
        {/* Main Bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={4}
          ry={4}
          opacity={hoveredParticipantId ? 0.7 : 1}
          className="transition-all duration-200"
        />

        {/* Range Whiskers (showing minimum to maximum across all participant scans) */}
        {scans.length > 1 && item.max > item.min && pxPerUnit > 0 && (
          <g stroke={isDarkMode ? '#ffffff' : '#0f172a'} strokeWidth={1.75} opacity={0.85}>
            <line x1={centerX} y1={whiskerTopY} x2={centerX} y2={whiskerBottomY} />
            <line x1={centerX - capWidth / 2} y1={whiskerTopY} x2={centerX + capWidth / 2} y2={whiskerTopY} />
            <line x1={centerX - capWidth / 2} y1={whiskerBottomY} x2={centerX + capWidth / 2} y2={whiskerBottomY} />
          </g>
        )}

        {/* Highlight for currently hovered participant from legend */}
        {hoveredParticipantId && hoveredScan && participantY !== null && (
          <g>
            <circle
              cx={centerX}
              cy={participantY}
              r={5}
              fill={hoveredScan.color}
              stroke="#ffffff"
              strokeWidth={2}
              className="animate-pulse"
            />
          </g>
        )}
      </g>
    );
  };

  // Consensus Handlers
  const handleDoeIkChange = (id: string) => {
    const currentVal = !!effectiveGroupDoeIk[id];
    setGroupConsensusOverrides(prev => ({
      ...prev,
      [id]: currentVal ? 'NONE' : 'DOEN_WE'
    }));
  };

  const handleVergtActieChange = (id: string) => {
    const currentVal = !!effectiveGroupVergtActie[id];
    const nextVal = !currentVal;
    setGroupConsensusOverrides(prev => ({
      ...prev,
      [id]: nextVal ? 'VERGT_ACTIE' : 'NONE'
    }));
    if (nextVal) {
      if (!groupAgendaOrder.includes(id)) {
        setGroupAgendaOrder(prevOrder => [...prevOrder, id]);
      }
    } else {
      setGroupAgendaOrder(prevOrder => prevOrder.filter(itemId => itemId !== id));
    }
  };

  const handleNietNodigChange = (id: string) => {
    const currentVal = !!effectiveGroupNietNodig[id];
    const nextVal = !currentVal;
    setGroupConsensusOverrides(prev => ({
      ...prev,
      [id]: nextVal ? 'NIET_NODIG' : 'NONE'
    }));
    if (nextVal) {
      setGroupAgendaOrder(order => order.filter(itemId => itemId !== id));
    }
  };

  const handleConfidenceChange = (categoryId: string, value: number) => {
    setGroupConfidence(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] === value ? 0 : value,
    }));
  };

  const handleActionDetailChange = (id: string, field: 'owner' | 'deadline', value: string) => {
    setGroupActionDetails(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { owner: '', deadline: '' }), [field]: value }
    }));
  };

  const scrollToCategory = (categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // PDF Export for Group Analysis
  const handleGenerateGroupPdf = async () => {
    const spiderEl = document.getElementById('group-spider-chart-container');
    const barEl = document.getElementById('group-bar-chart-container');
    const matrixEl = document.getElementById('group-matrix-chart-container');
    
    let spiderImg = '';
    let barImg = '';
    let matrixImg = '';

    try {
      if (spiderEl) {
        spiderImg = await htmlToImage.toPng(spiderEl, { pixelRatio: 2, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' });
      }
      if (barEl) {
        barImg = await htmlToImage.toPng(barEl, { pixelRatio: 2, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' });
      }
      if (matrixEl) {
        matrixImg = await htmlToImage.toPng(matrixEl, { pixelRatio: 2, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' });
      }
    } catch (e) {
      console.error("Error capturing group charts for PDF", e);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(isEnglish ? "Pop-up blocker prevented the report from opening. Please allow pop-ups for this site." : "Pop-up blocker verhinderde het rapport van openen. Sta pop-ups toe voor deze site.");
      return;
    }

    const totalInstruments = categories.reduce((acc, cat) => acc + cat.elements.reduce((eAcc, el) => eAcc + el.instruments.filter(i => !effectiveGroupNietNodig[i.id]).length, 0), 0);
    const totalDoeIk = Object.values(effectiveGroupDoeIk).filter(Boolean).length;
    const totalVergtActie = Object.values(effectiveGroupVergtActie).filter(Boolean).length;
    const totalNietNodig = Object.values(effectiveGroupNietNodig).filter(Boolean).length;

    // Borgingsagenda items for PDF
    const agendaItems: { category: any; element: any; instrument: any }[] = [];
    groupAgendaOrder.forEach(id => {
      categories.forEach(cat => {
        cat.elements.forEach(el => {
          const inst = el.instruments.find(i => i.id === id);
          if (inst && effectiveGroupVergtActie[id]) {
            agendaItems.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });
    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (effectiveGroupVergtActie[inst.id] && !agendaItems.some(item => item.instrument.id === inst.id)) {
            agendaItems.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });

    // Aandachtspunten items for PDF
    const aandachtsItems: { category: any; element: any; instrument: any }[] = [];
    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (!effectiveGroupDoeIk[inst.id] && !effectiveGroupNietNodig[inst.id]) {
            aandachtsItems.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="${isEnglish ? 'en' : 'nl'}">
<head>
  <meta charset="UTF-8">
  <title>${isEnglish ? 'Trust Tree - Group Analysis Report' : 'De Vertrouwensboom - Groepsanalyse Rapport'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    @media print {
      @page { margin: 1.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { break-before: page; }
      .avoid-break { break-inside: avoid; }
      html, body { height: auto !important; overflow: visible !important; }
    }
  </style>
</head>
<body class="bg-white text-slate-900 p-6">
  <!-- Page 1: Overview -->
  <div class="border-b-4 border-indigo-600 pb-6 mb-8">
    <h1 class="text-4xl font-black text-slate-900 mb-2">
      ${isEnglish ? 'Trust Tree - Group Analysis' : 'De Vertrouwensboom - Groepsanalyse'}
    </h1>
    <p class="text-xl text-indigo-600 font-semibold">
      ${isEnglish ? 'Consensus and collective assurance quality scan' : 'Consensus en collectief overzicht borging toetskwaliteit'}
    </p>
    <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>${isEnglish ? 'Date:' : 'Datum:'} ${new Date().toLocaleDateString(isEnglish ? 'en-US' : 'nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span>${isEnglish ? 'Participants:' : 'Deelnemers:'} ${scans.map(s => s.name).join(', ') || (isEnglish ? 'None' : 'Geen')}</span>
    </div>
  </div>

  <h2 class="text-2xl font-bold text-slate-900 mb-4">${isEnglish ? 'Overall Assurance (Consensus)' : 'Totaalbeeld Borging (Consensus)'}</h2>
  <div class="grid grid-cols-3 gap-6 mb-8">
    <div class="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center">
      <div class="text-5xl font-black text-emerald-600">${totalDoeIk} <span class="text-2xl text-emerald-400">/ ${totalInstruments}</span></div>
      <div class="text-sm font-bold text-emerald-700 uppercase tracking-wider mt-2">${isEnglish ? 'Deployed' : 'Ingezet'}</div>
    </div>
    <div class="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
      <div class="text-5xl font-black text-amber-600">${totalVergtActie}</div>
      <div class="text-sm font-bold text-amber-700 uppercase tracking-wider mt-2">${isEnglish ? 'On agenda' : 'Op de agenda'}</div>
    </div>
    <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
      <div class="text-5xl font-black text-slate-600">${totalNietNodig}</div>
      <div class="text-sm font-bold text-slate-700 uppercase tracking-wider mt-2">${isEnglish ? 'Not needed' : 'Niet nodig'}</div>
    </div>
  </div>

  <h3 class="text-xl font-bold text-slate-800 mb-4">${isEnglish ? 'Degree of Assurance per Category' : 'Borgingsgraad per Categorie'}</h3>
  <div class="space-y-3 mb-8">
    ${categories.map(category => {
      const catInstruments = category.elements.flatMap(e => e.instruments);
      const catTotal = catInstruments.filter(inst => !effectiveGroupNietNodig[inst.id]).length;
      const catDoeIk = catInstruments.filter(inst => effectiveGroupDoeIk[inst.id]).length;
      const percentage = catTotal > 0 ? Math.round((catDoeIk / catTotal) * 100) : 0;
      return `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 avoid-break">
          <div class="flex justify-between items-center mb-1.5">
            <span class="font-bold text-slate-800">${category.name}</span>
            <span class="font-bold ${percentage >= 75 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}">${percentage}% (${catDoeIk}/${catTotal})</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2">
            <div class="h-2 rounded-full ${percentage >= 75 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <!-- Page 2: Visuals -->
  <div class="page-break p-4 avoid-break">
    <h2 class="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-200 pb-2">${isEnglish ? 'Consensus Visuals' : 'Consensus Visuals'}</h2>
    <div class="flex flex-col items-center gap-4">
      ${spiderImg ? `
      <div class="w-full flex justify-center">
        <img src="${spiderImg}" style="width:100%; max-width:480px; max-height:260px; object-fit:contain; margin: 0 auto;" />
      </div>` : ''}

      ${barImg ? `
      <div class="w-full flex justify-center">
        <img src="${barImg}" style="width:100%; max-width:480px; max-height:260px; object-fit:contain; margin: 0 auto;" />
      </div>` : ''}

      ${matrixImg ? `
      <div class="w-full flex justify-center">
        <img src="${matrixImg}" style="width:100%; max-width:480px; max-height:260px; object-fit:contain; margin: 0 auto;" />
      </div>` : ''}
    </div>
  </div>

  <!-- Page 3: Agenda & Aandachtspunten -->
  <div class="page-break p-4">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
      ${isEnglish ? 'Assurance Agenda & Points of Attention' : 'Borgingsagenda & Aandachtspunten'}
    </h2>

    <div class="mb-8">
      <h3 class="text-xl font-bold text-slate-800 mb-4">
        ${isEnglish ? 'Quality Assurance Agenda (Action required)' : 'Borgingsagenda (Actiepunten)'}
      </h3>
      ${agendaItems.length > 0 ? `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-100">
            <th class="p-3 border border-slate-200 font-bold text-sm w-1/4">${isEnglish ? 'Category' : 'Categorie'}</th>
            <th class="p-3 border border-slate-200 font-bold text-sm">${isEnglish ? 'Instrument' : 'Instrument'}</th>
            <th class="p-3 border border-slate-200 font-bold text-sm w-32">${isEnglish ? 'Owner' : 'Eigenaar'}</th>
            <th class="p-3 border border-slate-200 font-bold text-sm w-32">${isEnglish ? 'Deadline' : 'Deadline'}</th>
          </tr>
        </thead>
        <tbody>
          ${agendaItems.map(item => `
            <tr class="avoid-break">
              <td class="p-3 border border-slate-200 text-sm align-top"><span class="font-semibold">${item.category.name}</span><br/><span class="text-xs text-slate-500">${item.element.name}</span></td>
              <td class="p-3 border border-slate-200 text-sm align-top">${item.instrument.text}</td>
              <td class="p-3 border border-slate-200 text-sm align-top">${groupActionDetails[item.instrument.id]?.owner || ''}</td>
              <td class="p-3 border border-slate-200 text-sm align-top">${groupActionDetails[item.instrument.id]?.deadline || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : `<p class="text-slate-500 italic">${isEnglish ? 'No action items identified.' : 'Geen actiepunten geselecteerd.'}</p>`}
    </div>

    <div>
      <h3 class="text-xl font-bold text-slate-800 mb-4">
        ${isEnglish ? 'Points of Attention (Not deployed)' : 'Aandachtspunten (Niet ingezet)'}
      </h3>
      ${aandachtsItems.length > 0 ? `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-100">
            <th class="p-3 border border-slate-200 font-bold text-sm w-1/4">${isEnglish ? 'Category' : 'Categorie'}</th>
            <th class="p-3 border border-slate-200 font-bold text-sm">${isEnglish ? 'Instrument' : 'Instrument'}</th>
          </tr>
        </thead>
        <tbody>
          ${aandachtsItems.map(item => `
            <tr class="avoid-break">
              <td class="p-3 border border-slate-200 text-sm align-top"><span class="font-semibold">${item.category.name}</span><br/><span class="text-xs text-slate-500">${item.element.name}</span></td>
              <td class="p-3 border border-slate-200 text-sm align-top">${item.instrument.text}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : `<p class="text-slate-500 italic">${isEnglish ? 'All instruments deployed!' : 'Alle instrumenten worden ingezet!'}</p>`}
    </div>
  </div>

  <div class="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 pb-8">
    <p>De Vertrouwensboom, Tim A. Gerbrands, 2025</p>
  </div>

  <script>
    setTimeout(() => {
      window.print();
      window.onafterprint = () => {
        window.close();
      };
    }, 1000);
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          {/* Left: Back button */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEnglish ? "Back to self-scan" : "Terug naar zelfscan"}</span>
            </button>
          </div>

          {/* Center: Title */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white pointer-events-auto">
              {isEnglish ? "Trust Tree Group Analysis" : "Vertrouwensboom Groepsanalyse"}
            </h1>
          </div>

          {/* Right: Actions (Upload, PDF, Clear) */}
          <div className="flex items-center gap-2 z-10">
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => handleFiles(e.target.files)}
              multiple
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium shadow-sm transition-colors cursor-pointer"
              title={isEnglish ? "Upload more Excel scans" : "Scans toevoegen"}
            >
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{isEnglish ? "Upload Scans" : "Scans Toevoegen"}</span>
            </button>

            {/* PDF Export Button */}
            <button
              onClick={handleGenerateGroupPdf}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
              title={isEnglish ? "Export PDF report" : "PDF-rapport exporteren"}
            >
              <Download className="w-4 h-4" />
              <span>{isEnglish ? "PDF Report" : "PDF Rapport"}</span>
            </button>

            {scans.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title={isEnglish ? "Remove all uploaded scans" : "Alle scans verwijderen"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Upload Zone / Scans Overview */}
        {scans.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-4 shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {isEnglish
                ? "Upload exported Excel scans"
                : "Laad geëxporteerde Excel-scans in"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
              {isEnglish
                ? "Drag and drop the .xlsx files saved from 'Export analysis' here, or click to browse. You can select multiple files at once."
                : "Sleep de via 'Exporteer analyse' opgeslagen .xlsx bestanden hiernaartoe, of klik om te bladeren. U kunt meerdere bestanden tegelijk selecteren."}
            </p>
            <div>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium shadow-sm transition-colors">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isEnglish ? "Select Excel files (.xlsx)" : "Selecteer Excel-bestanden (.xlsx)"}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Loaded Scans Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                {isEnglish ? "LOADED SCANS" : "INGELADEN SCANS"} ({scans.length}):
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {scans.map((scan) => {
                  const isHovered = hoveredParticipantId === scan.id;
                  return (
                    <div
                      key={scan.id}
                      onMouseEnter={() => setHoveredParticipantId(scan.id)}
                      onMouseLeave={() => setHoveredParticipantId(null)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isHovered
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-md scale-105'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: scan.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                        {scan.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveScan(scan.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full transition-colors"
                        title={isEnglish ? "Delete scan" : "Scan verwijderen"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Charts: Spider Chart (Deployment %) & Column Chart (Confidence % with Range [min-max]) */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Spider Chart: Inzet van Instrumenten (%) per Participant */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {isEnglish ? "Deployment of Instruments per Participant (%)" : "Inzet van Instrumentarium per Deelnemer (%)"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isEnglish
                        ? "Individual overlay of deployed instruments per category"
                        : "Individuele overlay van ingezet instrumentarium per categorie"}
                    </p>
                  </div>
                  <div className="w-full h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={spiderChartData}>
                        <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                        <PolarAngleAxis dataKey="category" tick={renderSpiderTick} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                        {scans.map((scan, idx) => {
                          const dataKey = `scan_${idx}`;
                          const isHovered = hoveredParticipantId === scan.id;
                          const opacity = hoveredParticipantId
                            ? (isHovered ? 0.9 : 0.15)
                            : 0.65;
                          const strokeWidth = isHovered ? 3 : 1.75;

                          return (
                            <Radar
                              key={scan.id}
                              name={scan.name}
                              dataKey={dataKey}
                              stroke={scan.color}
                              fill={scan.color}
                              fillOpacity={isHovered ? 0.25 : 0.05}
                              strokeWidth={strokeWidth}
                              isAnimationActive={false}
                              opacity={opacity}
                            />
                          );
                        })}

                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 min-w-[170px]">
                                  <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-1">
                                    {label}
                                  </p>
                                  {payload.map((entry: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center gap-2">
                                      <span className="flex items-center gap-1.5">
                                        <span
                                          className="w-2 h-2 rounded-full shrink-0"
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.name}:</span>
                                      </span>
                                      <span className="font-bold text-slate-900 dark:text-white">{entry.value}%</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Column Chart: Vertrouwen per Categorie met Bereik [min-max] */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {isEnglish ? "Level of Confidence per Category (%)" : "Mate van Vertrouwen per Categorie (%)"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isEnglish
                        ? "Mean confidence per category with range [min-max]"
                        : "Gemiddeld vertrouwen per categorie met bereik [min-max]"}
                    </p>
                  </div>
                  <div className="w-full h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={columnChartData}
                        margin={{ top: 20, right: 20, left: -10, bottom: 45 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis
                          dataKey="name"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          height={70}
                          tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 11 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
                          tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 11 }}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 min-w-[210px]">
                                  <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-1">
                                    {data.name}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between font-semibold">
                                      <span className="text-slate-600 dark:text-slate-300">
                                        {isEnglish ? "Confidence:" : "Vertrouwen:"}
                                      </span>
                                      <span className="font-bold" style={{ color: data.fill }}>
                                        {data.mean}% [{data.min}% - {data.max}%]
                                      </span>
                                    </div>
                                    {scans.length > 1 && (
                                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                        <span>{isEnglish ? "Range [min-max]:" : "Bereik [min-max]:"}</span>
                                        <span className="font-semibold">{data.min}% - {data.max}%</span>
                                      </div>
                                    )}
                                    {hoveredParticipantId && (
                                      <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between font-bold">
                                        <span>{scans.find(s => s.id === hoveredParticipantId)?.name}:</span>
                                        <span>{scans.find(s => s.id === hoveredParticipantId)?.categoryStats[data.id]?.confidencePercentage ?? 0}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="mean"
                          shape={renderBarWithWhisker}
                          isAnimationActive={false}
                        >
                          {columnChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Centered Legend UNDER the spider chart and column chart */}
              <div className="flex flex-col items-center justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEnglish ? "Legenda:" : "Legenda:"}
                  </span>
                  {scans.map(scan => {
                    const isHovered = hoveredParticipantId === scan.id;
                    return (
                      <div
                        key={`central-leg-${scan.id}`}
                        onMouseEnter={() => setHoveredParticipantId(scan.id)}
                        onMouseLeave={() => setHoveredParticipantId(null)}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                          isHovered
                            ? 'bg-slate-100 dark:bg-slate-700 scale-105 shadow-sm ring-2 ring-indigo-500'
                            : hoveredParticipantId
                            ? 'opacity-30'
                            : 'opacity-100 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: scan.color }}
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {scan.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Synthesis Table: Group choices per instrument */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isEnglish ? "Synthesis & Group Consensus" : "Synthese & Groepsconsensus"}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {isEnglish
                      ? "The bar shows the % of 'We do' answers. An orange warning icon indicates 'Requires action' (hover for details). 100% agreement items are pre-selected."
                      : "De balk toont het percentage 'Doen we'. Een oranje uitroepteken geeft aan wie 'Vergt actie' koos (beweeg erover voor details). Items met 100% consensus staan standaard aan."}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-group-action-details"
                      checked={showActionDetails}
                      onChange={(e) => setShowActionDetails(e.target.checked)}
                      className="w-4 h-4 text-slate-900 dark:text-slate-100 rounded border-slate-300 dark:border-slate-600 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-slate-800"
                    />
                    <label htmlFor="toggle-group-action-details" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      {isEnglish ? "Action planner" : "Actieplanning tonen"}
                    </label>
                  </div>

                  <button
                    onClick={handleClearConsensus}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isEnglish ? "Clear consensus choices" : "Consensuskeuzes wissen"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEnglish ? "Reset choices" : "Wis keuzes"}</span>
                  </button>
                </div>
              </div>

              {/* Categories Stack */}
              <div className="space-y-4">
                {categories.map((category) => {
                  const catStat = columnChartData.find(c => c.id === category.id);
                  const meanVal = catStat?.mean ?? 0;
                  const minVal = catStat?.min ?? 0;
                  const maxVal = catStat?.max ?? 0;

                  // Current consensus rating: either explicitly selected or defaults to participant average rounded
                  const currentStarRating = groupConfidence[category.id] !== undefined
                    ? groupConfidence[category.id]
                    : Math.round(meanVal / 20);

                  return (
                    <div
                      key={category.id}
                      id={`category-${category.id}`}
                      className={`rounded-xl overflow-hidden border ${category.borderColorClass} shadow-sm ${category.containerColorClass} transition-colors`}
                    >
                      {/* Category Header */}
                      <div className={`${category.colorClass} px-4 py-2.5 border-b ${category.borderColorClass} flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors`}>
                        <h3 className={`text-lg font-bold ${category.textColorClass}`}>
                          {category.name}
                        </h3>

                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Trust indicator in requested format: "Vertrouwen: gemiddelde [minimum - maximum]" */}
                          {scans.length > 0 && (
                            <div className="flex items-center gap-2 bg-white/75 dark:bg-slate-800/75 px-3 py-1 rounded-lg backdrop-blur-sm border border-black/5 dark:border-white/5">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {isEnglish ? "Confidence:" : "Vertrouwen:"}
                              </span>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {meanVal}% [{minVal}% - {maxVal}%]
                              </span>
                            </div>
                          )}

                          {/* Star rating for consensus confidence rating (1 - 5 stars) */}
                          <div className="flex items-center gap-2 bg-white/75 dark:bg-slate-800/75 px-3 py-1 rounded-lg backdrop-blur-sm border border-black/5 dark:border-white/5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {isEnglish ? "Consensus:" : "Consensus:"}
                            </span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(rating => {
                                const isSelected = currentStarRating >= rating;
                                return (
                                  <button
                                    key={rating}
                                    onClick={() => handleConfidenceChange(category.id, rating)}
                                    className="p-0.5 transition-all duration-200 hover:scale-125 focus:outline-none group cursor-pointer"
                                    title={`${rating} ${isEnglish ? "stars" : "sterren"}`}
                                  >
                                    <Star
                                      className={`w-5 h-5 transition-colors duration-200 ${
                                        isSelected
                                          ? 'fill-amber-400 text-amber-500 group-hover:fill-amber-500 group-hover:text-amber-600'
                                          : 'fill-transparent text-slate-300 group-hover:text-amber-300 group-hover:fill-amber-100'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Elements in Category */}
                      <div className="divide-y divide-black/5 dark:divide-white/5">
                        {category.elements.map((element, elemIdx) => (
                          <div key={`${category.id}-elem-${elemIdx}-${element.name}`} className="px-4 py-2.5">
                            <div className="mb-1.5 flex items-baseline gap-2">
                              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{element.name}</h4>
                              {element.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 hidden md:block">- {element.description}</p>
                              )}
                            </div>
                            {element.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 md:hidden mb-2">{element.description}</p>
                            )}

                            <div className="space-y-2">
                              {element.instruments.map((instrument) => {
                                const votesDoeIk: ParticipantScan[] = [];
                                const votesVergtActie: ParticipantScan[] = [];
                                const votesNietNodig: ParticipantScan[] = [];

                                scans.forEach(scan => {
                                  const choice = scan.instrumentChoices[instrument.id];
                                  if (choice === 'DOEN_WE') votesDoeIk.push(scan);
                                  else if (choice === 'VERGT_ACTIE') votesVergtActie.push(scan);
                                  else if (choice === 'NIET_NODIG') votesNietNodig.push(scan);
                                });

                                const totalAnswered = votesDoeIk.length + votesVergtActie.length + votesNietNodig.length;

                                const actionNotes: { scan: ParticipantScan; detail: any }[] = [];
                                scans.forEach(scan => {
                                  const det = scan.actionDetails?.[instrument.id];
                                  if (det && (det.action || det.who || det.deadline)) {
                                    actionNotes.push({ scan, detail: det });
                                  }
                                });

                                const pctDoeIk = totalAnswered > 0 ? Math.round((votesDoeIk.length / totalAnswered) * 100) : 0;
                                const barTooltip = totalAnswered > 0 
                                  ? `${pctDoeIk}% ${isEnglish ? "'we do'" : "'doen we'"} (${votesDoeIk.length}/${totalAnswered})${votesDoeIk.length > 0 ? ': ' + votesDoeIk.map(s => s.name).join(', ') : ''}`
                                  : (isEnglish ? 'No answers given' : 'Geen antwoorden ingevuld');

                                // Consensus choices for this instrument (defaulting to 100% consensus where applicable)
                                const isDoeIk = !!effectiveGroupDoeIk[instrument.id];
                                const isVergtActie = !!effectiveGroupVergtActie[instrument.id];
                                const isNietNodig = !!effectiveGroupNietNodig[instrument.id];

                                const itemBgClass = isVergtActie 
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-sm' 
                                  : isDoeIk 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm' 
                                    : isNietNodig
                                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600'
                                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm';

                                return (
                                  <div
                                    key={instrument.id}
                                    className={`flex flex-col gap-0 rounded-lg border transition-all duration-200 ${itemBgClass}`}
                                  >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3">
                                      <div className={`flex-1 text-sm leading-snug ${isNietNodig ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {instrument.text}
                                      </div>

                                       <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                                        {/* Colored progress bar with orange exclamation mark to its left */}
                                        <div className="flex items-center gap-2 shrink-0">
                                          {/* Orange exclamation mark if any scan chose 'vergt actie' with hover tooltip (links van de gekleurde balk) */}
                                          {votesVergtActie.length > 0 && (
                                            <div className="relative group/alert shrink-0 flex items-center">
                                              <div
                                                className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 hover:scale-110 transition-transform cursor-help shadow-xs"
                                                title={isEnglish ? "Requires action according to participant(s)" : "Vergt actie volgens deelnemer(s)"}
                                              >
                                                <AlertTriangle className="w-3.5 h-3.5 fill-amber-500/20" />
                                              </div>

                                              {/* Hover detail card */}
                                              <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 hidden group-hover/alert:block z-40 w-72 sm:w-80 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-amber-300 dark:border-amber-700 text-xs text-slate-800 dark:text-slate-100 pointer-events-none transition-all">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800/60 pb-1.5 mb-2">
                                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                                  <span>
                                                    {isEnglish
                                                      ? `Requires action (${votesVergtActie.length}):`
                                                      : `Vergt actie volgens (${votesVergtActie.length}):`}
                                                  </span>
                                                </div>

                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                  {votesVergtActie.map(scan => {
                                                    const det = scan.actionDetails?.[instrument.id];
                                                    const actionText = det?.action || det?.note;
                                                    const owner = det?.who || det?.owner;
                                                    const deadline = det?.deadline;
                                                    const hasNotes = actionText || owner || deadline;

                                                    return (
                                                      <div
                                                        key={scan.id}
                                                        className="bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/80 dark:border-amber-800/40 space-y-1"
                                                      >
                                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                          <span
                                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                                            style={{ backgroundColor: scan.color }}
                                                          />
                                                          <span>{scan.name}</span>
                                                        </div>
                                                        {hasNotes ? (
                                                          <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 pt-0.5">
                                                            {actionText && (
                                                              <div>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                  {isEnglish ? "Note:" : "Notitie:"}{" "}
                                                                </span>
                                                                "{actionText}"
                                                              </div>
                                                            )}
                                                            {owner && (
                                                              <div>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                  {isEnglish ? "Owner:" : "Eigenaar:"}{" "}
                                                                </span>
                                                                {owner}
                                                              </div>
                                                            )}
                                                            {deadline && (
                                                              <div>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                  {isEnglish ? "Deadline:" : "Deadline:"}{" "}
                                                                </span>
                                                                {deadline}
                                                              </div>
                                                            )}
                                                          </div>
                                                        ) : (
                                                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                            {isEnglish ? "No notes entered in scan" : "Geen notities ingevoerd in scan"}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Bar showing exclusively % 'doen we' with mouse-over effect */}
                                          <div className="relative group/bar shrink-0 flex items-center">
                                            <div
                                              className="h-2.5 w-24 sm:w-32 md:w-36 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60 shrink-0 relative cursor-help transition-all group-hover/bar:ring-2 group-hover/bar:ring-emerald-400 dark:group-hover/bar:ring-emerald-500"
                                              title={barTooltip}
                                            >
                                              {totalAnswered > 0 && votesDoeIk.length > 0 && (
                                                <div
                                                  style={{ width: `${(votesDoeIk.length / totalAnswered) * 100}%` }}
                                                  className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                                                />
                                              )}
                                            </div>

                                            {/* Hover detail card showing who chose 'doen we' */}
                                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/bar:block z-40 w-64 sm:w-72 p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-emerald-300 dark:border-emerald-700 text-xs text-slate-800 dark:text-slate-100 pointer-events-none transition-all">
                                              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-1.5 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                                                <div className="flex items-center gap-1.5">
                                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                                                  <span>{isEnglish ? "'We do' selected by:" : "Gekozen voor 'doen we':"}</span>
                                                </div>
                                                <span className="font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[10px] text-emerald-800 dark:text-emerald-300">
                                                  {votesDoeIk.length}/{totalAnswered} ({pctDoeIk}%)
                                                </span>
                                              </div>

                                              {votesDoeIk.length > 0 ? (
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                  {votesDoeIk.map(scan => (
                                                    <div
                                                      key={scan.id}
                                                      className="flex items-center gap-2 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/40"
                                                    >
                                                      <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                                        style={{ backgroundColor: scan.color }}
                                                      />
                                                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                                        {scan.name}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-slate-500 dark:text-slate-400 italic text-[11px] py-0.5">
                                                  {totalAnswered === 0
                                                    ? (isEnglish ? "No answers submitted" : "Geen antwoorden ingevuld")
                                                    : (isEnglish ? "No participants selected 'we do'" : "Geen deelnemers hebben 'doen we' gekozen")}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Consensus Decision Buttons: 'Doen we', 'Vergt actie', 'Niet nodig' */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={() => handleDoeIkChange(instrument.id)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                                              isDoeIk 
                                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            {isEnglish ? 'We do' : 'Doen we'}
                                          </button>
                                          <button
                                            onClick={() => handleVergtActieChange(instrument.id)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                                              isVergtActie 
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            {isEnglish ? 'Requires action' : 'Vergt actie'}
                                          </button>
                                          <button
                                            onClick={() => handleNietNodigChange(instrument.id)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                                              isNietNodig 
                                                ? 'bg-slate-500 text-white border-slate-600 shadow-sm' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            {isEnglish ? 'Not needed' : 'Niet nodig'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Details Inputs if 'Vergt actie' is active */}
                                    {isVergtActie && showActionDetails && (
                                      <div className="flex flex-col sm:flex-row gap-4 px-3 pb-3 pt-2 border-t border-black/5 dark:border-white/5">
                                        <div className="flex-1 flex items-center gap-2">
                                          <User className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                                          <input 
                                            type="text" 
                                            placeholder={isEnglish ? "Owner / responsible..." : "Eigenaar..."} 
                                            value={groupActionDetails[instrument.id]?.owner || ''}
                                            onChange={(e) => handleActionDetailChange(instrument.id, 'owner', e.target.value)}
                                            className="text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 px-1 py-1 w-full focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                          />
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                                          <input 
                                            type="text" 
                                            placeholder={isEnglish ? "Deadline (e.g. Q3 2026)..." : "Deadline (bijv. Q3 2026)..."} 
                                            value={groupActionDetails[instrument.id]?.deadline || ''}
                                            onChange={(e) => handleActionDetailChange(instrument.id, 'deadline', e.target.value)}
                                            className="text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 px-1 py-1 w-full focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visuals based on the data entered in the group analysis */}
            <GroupConsensusVisuals
              categories={categories}
              isEnglish={isEnglish}
              isDarkMode={isDarkMode}
              groupDoeIk={effectiveGroupDoeIk}
              groupVergtActie={effectiveGroupVergtActie}
              groupNietNodig={effectiveGroupNietNodig}
              groupConfidence={groupConfidence}
              groupActionDetails={groupActionDetails}
              showActionDetails={showActionDetails}
              groupAgendaOrder={groupAgendaOrder}
              setGroupAgendaOrder={setGroupAgendaOrder}
              scrollToCategory={scrollToCategory}
              defaultCategoryConfidence={defaultCategoryConfidence}
            />
          </>
        )}
      </main>
    </div>
  );
};
