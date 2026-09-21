import React, { useState, useMemo, useCallback } from 'react';
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
  Legend,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceArea
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  GripVertical,
  User,
  Calendar
} from 'lucide-react';
import { Category, Instrument } from './data';

interface GroupConsensusVisualsProps {
  categories: Category[];
  isEnglish: boolean;
  isDarkMode: boolean;
  groupDoeIk: Record<string, boolean>;
  groupVergtActie: Record<string, boolean>;
  groupNietNodig: Record<string, boolean>;
  groupConfidence: Record<string, number>;
  groupActionDetails: Record<string, { owner?: string; deadline?: string }>;
  showActionDetails: boolean;
  groupAgendaOrder: string[];
  setGroupAgendaOrder: React.Dispatch<React.SetStateAction<string[]>>;
  scrollToCategory: (categoryId: string) => void;
  defaultCategoryConfidence?: Record<string, number>; // fallback from group participants mean %
}

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

export const GroupConsensusVisuals: React.FC<GroupConsensusVisualsProps> = ({
  categories,
  isEnglish,
  isDarkMode,
  groupDoeIk,
  groupVergtActie,
  groupNietNodig,
  groupConfidence,
  groupActionDetails,
  showActionDetails,
  groupAgendaOrder,
  setGroupAgendaOrder,
  scrollToCategory,
  defaultCategoryConfidence = {}
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Drag and drop for Borgingsagenda
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...groupAgendaOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setGroupAgendaOrder(newOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Helper to get effective confidence (0 - 100%) for a category
  const getEffectiveConfidence = useCallback((catId: string): number => {
    if (groupConfidence[catId] !== undefined) {
      return (groupConfidence[catId] || 0) * 20;
    }
    return defaultCategoryConfidence[catId] ?? 0;
  }, [groupConfidence, defaultCategoryConfidence]);

  // Derived: Inzet per category (Radar)
  const radarData = useMemo(() => {
    return categories.map(cat => {
      let total = 0;
      let checked = 0;
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (!groupNietNodig[inst.id]) {
            total++;
            if (groupDoeIk[inst.id]) checked++;
          }
        });
      });
      const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
      return {
        subject: cat.id === 'luk-kwaliteit' ? (isEnglish ? 'Quality of LOU' : 'Kwaliteit van LUK') : cat.name,
        id: cat.id,
        A: percent,
        fullMark: 100,
      };
    });
  }, [categories, groupDoeIk, groupNietNodig, isEnglish]);

  // Derived: Vertrouwen per category (Bar)
  const barData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.id === 'luk-kwaliteit' ? (isEnglish ? 'Quality of LOU' : 'Kwaliteit van LUK') : cat.name,
      vertrouwen: getEffectiveConfidence(cat.id),
      fill: getCategoryColorHex(cat.id),
      id: cat.id
    }));
  }, [categories, getEffectiveConfidence, isEnglish]);

  // Derived: Scatter Data (Zones van vertrouwen)
  const scatterData = useMemo(() => {
    return categories.map(cat => {
      let total = 0;
      let checked = 0;
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (!groupNietNodig[inst.id]) {
            total++;
            if (groupDoeIk[inst.id]) checked++;
          }
        });
      });
      const inzetPercent = total > 0 ? Math.round((checked / total) * 100) : 0;
      const confPercent = getEffectiveConfidence(cat.id);
      return {
        name: cat.name,
        id: cat.id,
        x: inzetPercent,
        y: confPercent,
        z: total,
        fill: getCategoryColorHex(cat.id)
      };
    });
  }, [categories, groupDoeIk, groupNietNodig, getEffectiveConfidence]);

  // Overall counts
  const totalInstruments = useMemo(() => {
    return categories.reduce((acc, cat) => {
      return acc + cat.elements.reduce((eAcc, el) => {
        return eAcc + el.instruments.filter(i => !groupNietNodig[i.id]).length;
      }, 0);
    }, 0);
  }, [categories, groupNietNodig]);

  const totalDoeIk = useMemo(() => {
    return Object.values(groupDoeIk).filter(Boolean).length;
  }, [groupDoeIk]);

  const totalVergtActie = useMemo(() => {
    return Object.values(groupVergtActie).filter(Boolean).length;
  }, [groupVergtActie]);

  const totalNietNodig = useMemo(() => {
    return Object.values(groupNietNodig).filter(Boolean).length;
  }, [groupNietNodig]);

  const avgConfidence = useMemo(() => {
    if (categories.length === 0) return 0;
    const sum = categories.reduce((acc, cat) => acc + getEffectiveConfidence(cat.id), 0);
    return Math.round(sum / categories.length);
  }, [categories, getEffectiveConfidence]);

  // Derived: Borgingsagenda items
  const borgingsagenda = useMemo(() => {
    const items: { category: Category; element: any; instrument: Instrument }[] = [];
    
    // First, ordered items from groupAgendaOrder
    groupAgendaOrder.forEach(id => {
      categories.forEach(cat => {
        cat.elements.forEach(el => {
          const inst = el.instruments.find(i => i.id === id);
          if (inst && groupVergtActie[id]) {
            items.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });

    // Then any additional items in groupVergtActie not yet in groupAgendaOrder
    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (groupVergtActie[inst.id] && !items.some(item => item.instrument.id === inst.id)) {
            items.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });

    return items;
  }, [categories, groupAgendaOrder, groupVergtActie]);

  // Derived: Aandachtspunten (niet ingezet en niet als 'niet nodig' gemarkeerd)
  const aandachtspunten = useMemo(() => {
    const points: { category: Category; element: any; instrument: Instrument }[] = [];
    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (!groupDoeIk[inst.id] && !groupNietNodig[inst.id]) {
            points.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });
    return points;
  }, [categories, groupDoeIk, groupNietNodig]);

  // Custom Tick for Spider Chart
  const CustomRadarTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    const category = categories.find(c => {
      const displayName = c.id === 'luk-kwaliteit' ? (isEnglish ? 'Quality of LOU' : 'Kwaliteit van LUK') : c.name;
      return displayName === payload.value || c.name === payload.value;
    });
    const color = category ? getCategoryColorHex(category.id) : (isDarkMode ? '#94a3b8' : '#64748b');
    return (
      <g className="cursor-pointer" onClick={() => category && scrollToCategory(category.id)}>
        <text radius={radius} stroke={stroke} x={x} y={y} style={{ fontSize: '10px', fontWeight: 'bold' }} className="hover:opacity-80 transition-opacity" textAnchor={textAnchor} fill={color}>
          {payload.value}
        </text>
      </g>
    );
  };

  const CustomRadarDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getCategoryColorHex(payload.id);
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
  };

  // Custom Scatter Node with directional arrows for intervention quadrants
  const renderScatterNode = useCallback((props: any) => {
    const { cx, cy, fill, payload } = props;
    const r = props.node?.r || props.r || 10;
    const { x, y } = payload;
    
    // blinde vlekken (x<50, y>=50) of onvoldoende (x<50, y<50)
    const hasRightArrow = x < 50;
    // Grijp in (x>=50, y<50)
    const hasUpArrow = x >= 50 && y < 50;

    return (
      <g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => scrollToCategory(payload.id)}>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={isDarkMode ? '#1e293b' : '#ffffff'} strokeWidth={1.5} opacity={0.85} />
        {hasRightArrow && (
          <path d={`M ${cx + r} ${cy} L ${cx + r + 15} ${cy} M ${cx + r + 10} ${cy - 5} L ${cx + r + 15} ${cy} L ${cx + r + 10} ${cy + 5}`} fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {hasUpArrow && (
          <path d={`M ${cx} ${cy - r} L ${cx} ${cy - r - 15} M ${cx - 5} ${cy - r - 10} L ${cx} ${cy - r - 15} L ${cx + 5} ${cy - r - 10}`} fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    );
  }, [isDarkMode, scrollToCategory]);

  return (
    <section className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-700 transition-colors">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isEnglish ? "Group Consensus Results & Visuals" : "Groepsuitkomst & Consensus Visuals"}
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {isEnglish
            ? "Visual representations based on the consensus choices and ratings entered above for the entire group."
            : "Visuele weergaven en analyses op basis van de hierboven door de examencommissie ingevoerde groepsconsensus."}
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEnglish ? "Consensus Deployed" : "Consensus Ingezet"}
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalDoeIk} <span className="text-lg font-semibold text-slate-400">/ {totalInstruments}</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {totalInstruments > 0 ? Math.round((totalDoeIk / totalInstruments) * 100) : 0}% {isEnglish ? "of instruments" : "van instrumentarium"}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEnglish ? "Requires Action" : "Op de Agenda"}
          </span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalVergtActie}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {isEnglish ? "action points identified" : "actiepunten vastgesteld"}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEnglish ? "Not Needed" : "Niet Nodig"}
          </span>
          <div className="text-3xl font-black text-slate-600 dark:text-slate-400 mt-2">
            {totalNietNodig}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {isEnglish ? "excluded by committee" : "buiten beschouwing"}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEnglish ? "Mean Confidence" : "Gem. Vertrouwen"}
          </span>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {avgConfidence}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {isEnglish ? "overall assessment" : "over alle categorieën"}
          </span>
        </div>
      </div>

      {/* Grid: Spider Chart & Column Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spider Chart Container */}
        <div
          id="group-spider-chart-container"
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">
            {isEnglish ? "Consensus Deployment per Category (%)" : "Consensus Inzet van Instrumenten per Categorie (%)"}
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={isEnglish ? "Deployment (%)" : "Inzet (%)"}
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                  dot={<CustomRadarDot />}
                />
                <RechartsTooltip
                  formatter={(value) => [`${value}%`, isEnglish ? 'Deployment' : 'Inzet']}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column Chart Container */}
        <div
          id="group-bar-chart-container"
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">
            {isEnglish ? "Consensus Confidence per Category (%)" : "Consensus Vertrouwen per Categorie (%)"}
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#475569' }}
                />
                <RechartsTooltip
                  cursor={{ fill: isDarkMode ? '#334155' : '#f8fafc' }}
                  formatter={(value) => [`${value}%`, isEnglish ? 'Confidence' : 'Vertrouwen']}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine
                  y={avgConfidence}
                  stroke={isDarkMode ? '#475569' : '#94a3b8'}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Bar
                  dataKey="vertrouwen"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  onClick={(data) => scrollToCategory(data.id)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confidence Matrix (Zones van vertrouwen) & Interpretation */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Matrix Chart */}
        <div
          id="group-matrix-chart-container"
          className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">
            {isEnglish ? "Zones of Confidence (Consensus)" : "Zones van Vertrouwen (Consensus)"}
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={isEnglish ? "Deployment" : "Inzet"}
                  domain={[0, 100]}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#475569' }}
                  label={{
                    value: isEnglish ? "Deployment per category (%)" : "Inzet van instrumentarium per categorie (%)",
                    position: 'insideBottom',
                    offset: -25,
                    fill: isDarkMode ? '#94a3b8' : '#475569'
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={isEnglish ? "Confidence" : "Vertrouwen"}
                  domain={[0, 100]}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#475569' }}
                  label={{
                    value: isEnglish ? "Confidence per category (%)" : "Mate van vertrouwen per categorie (%)",
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                    textAnchor: 'middle',
                    fill: isDarkMode ? '#94a3b8' : '#475569'
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name={isEnglish ? "Instruments" : "Aantal instrumenten"} />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800 dark:text-white mb-1">{data.name}</p>
                          <p className="text-slate-600 dark:text-slate-300">
                            {isEnglish ? "Deployment:" : "Inzet:"} <span className="font-bold">{data.x}%</span>
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            {isEnglish ? "Confidence:" : "Vertrouwen:"} <span className="font-bold">{data.y}%</span>
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            {isEnglish ? "Total instruments:" : "Aantal instrumenten:"} <span className="font-bold">{data.z}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={50} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeDasharray="3 3" />
                <ReferenceArea x1={75} x2={100} y1={75} y2={100} fillOpacity={0} label={{ position: 'center', value: isEnglish ? 'In order' : 'Op orde', fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }} />
                <ReferenceArea x1={0} x2={25} y1={75} y2={100} fillOpacity={0} label={{ position: 'center', value: isEnglish ? 'Blind spots' : 'Blinde vlekken', fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }} />
                <ReferenceArea x1={75} x2={100} y1={0} y2={25} fillOpacity={0} label={{ position: 'center', value: isEnglish ? 'Intervene' : 'Grijp in', fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }} />
                <ReferenceArea x1={0} x2={25} y1={0} y2={25} fillOpacity={0} label={{ position: 'center', value: isEnglish ? 'Insufficient' : 'Onvoldoende', fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }} />
                <Scatter name="Categorieën" data={scatterData} isAnimationActive={false} shape={renderScatterNode}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interpretation Section */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">
            {isEnglish ? "Interpretation & Assessment" : "Interpretatie & Eigenstandig Oordeel"}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
            {isEnglish
              ? "The relationship between deployment of instruments and your confidence reveals strategic priorities for the examination board:"
              : "De verhouding tussen de inzet van borgende instrumenten en uw vertrouwen toont de strategische aandachtsgebieden voor de examencommissie:"}
          </p>

          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Blinde Vlekken */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col">
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                  {isEnglish ? "Blind spots" : "Blinde vlekken"}
                </h4>
                {scatterData.filter(d => d.x < 50 && d.y >= 50).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {scatterData.filter(d => d.x < 50 && d.y >= 50).map(cat => (
                      <div
                        key={`dot-${cat.id}`}
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: cat.fill }}
                        title={cat.name}
                        onClick={() => scrollToCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex-1">
                {isEnglish
                  ? "High confidence despite low deployment. Trust may be based on assumptions rather than objective verification."
                  : "Hoog vertrouwen ondanks geringe inzet van instrumenten. Mogelijk berust vertrouwen op aannames i.p.v. objectieve waarneming."}
              </p>
            </div>

            {/* Op orde */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col">
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                  {isEnglish ? "In order" : "Op orde"}
                </h4>
                {scatterData.filter(d => d.x >= 50 && d.y >= 50).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {scatterData.filter(d => d.x >= 50 && d.y >= 50).map(cat => (
                      <div
                        key={`dot-${cat.id}`}
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: cat.fill }}
                        title={cat.name}
                        onClick={() => scrollToCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex-1">
                {isEnglish
                  ? "Sufficient deployment leads to demonstrable quality and legitimate confidence. Continue current practice."
                  : "Voldoende inzet leidt aantoonbaar tot kwaliteit en terecht vertrouwen. Bestendig de huidige aanpak."}
              </p>
            </div>

            {/* Onvoldoende */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col">
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                  {isEnglish ? "Insufficient" : "Onvoldoende"}
                </h4>
                {scatterData.filter(d => d.x < 50 && d.y < 50).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {scatterData.filter(d => d.x < 50 && d.y < 50).map(cat => (
                      <div
                        key={`dot-${cat.id}`}
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: cat.fill }}
                        title={cat.name}
                        onClick={() => scrollToCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex-1">
                {isEnglish
                  ? "Low deployment and low confidence. Develop a step-by-step plan to deploy key instruments."
                  : "Geringe inzet en laag vertrouwen. Maak een plan van aanpak om cruciale instrumenten te implementeren."}
              </p>
            </div>

            {/* Grijp in */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col">
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                  {isEnglish ? "Intervene" : "Grijp in"}
                </h4>
                {scatterData.filter(d => d.x >= 50 && d.y < 50).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {scatterData.filter(d => d.x >= 50 && d.y < 50).map(cat => (
                      <div
                        key={`dot-${cat.id}`}
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: cat.fill }}
                        title={cat.name}
                        onClick={() => scrollToCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex-1">
                {isEnglish
                  ? "Instruments are deployed, but confidence remains low. Evaluation of effectiveness and quality of instruments is required."
                  : "Veel instrumenten ingezet, maar vertrouwen blijft laag. Onderzoek de effectiviteit van de instrumenten."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agenda & Aandachtspunten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Borgingsagenda */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-colors">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {isEnglish ? "Quality Assurance Agenda (Consensus)" : "Borgingsagenda (Consensus)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEnglish
                ? "Instruments agreed by the group as requiring action. Drag items to re-order priority."
                : "Instrumenten waarvoor de groep 'Vergt actie' heeft vastgesteld. Sleep om prioriteit te wijzigen."}
            </p>
          </div>
          <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20">
            {borgingsagenda.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                <Info className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">
                  {isEnglish ? "No action items selected in consensus." : "Nog geen actiepunten geselecteerd in de groepsconsensus."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {borgingsagenda.map((item, index) => (
                  <li
                    key={`group-agenda-${item.instrument.id}`}
                    className={`bg-white dark:bg-slate-800 p-3 rounded-xl border ${
                      draggedIndex === index ? 'border-emerald-500 shadow-md opacity-50' : 'border-slate-200 dark:border-slate-700 shadow-sm'
                    } flex gap-3 group cursor-grab active:cursor-grabbing transition-all`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                      <GripVertical className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
                          {item.category.name}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.element.name}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{item.instrument.text}</p>
                      {showActionDetails && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">{groupActionDetails[item.instrument.id]?.owner || '_________________'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">{groupActionDetails[item.instrument.id]?.deadline || '_________________'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Aandachtspunten */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-colors">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {isEnglish ? "Points of Attention (Consensus)" : "Aandachtspunten (Consensus)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEnglish
                ? "Instruments not currently deployed by the examination board."
                : "Instrumenten die momenteel niet worden ingezet (en niet als 'Niet nodig' gemarkeerd)."}
            </p>
          </div>
          <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20">
            {aandachtspunten.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400" />
                <p className="text-sm">
                  {isEnglish ? "No points of attention. All instruments are deployed!" : "Geen aandachtspunten. Alle instrumenten worden ingezet!"}
                </p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {aandachtspunten.map((item) => (
                  <li
                    key={`group-aandacht-${item.instrument.id}`}
                    className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
                        {item.category.name}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.element.name}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.instrument.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
