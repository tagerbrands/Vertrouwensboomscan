import React, { useState, useMemo, useEffect } from 'react';
import { categories, Category, Instrument } from './data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Info, GripVertical, Download, Star, User, Calendar } from 'lucide-react';

// Helper to load state from localStorage
const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export default function App() {
  const [checkedDoeIk, setCheckedDoeIk] = useState<Record<string, boolean>>(() => loadState('borging_doeIk', {}));
  const [checkedVergtActie, setCheckedVergtActie] = useState<Record<string, boolean>>(() => loadState('borging_vergtActie', {}));
  const [confidence, setConfidence] = useState<Record<string, number>>(() => loadState('borging_confidence', {}));
  const [agendaOrder, setAgendaOrder] = useState<string[]>(() => loadState('borging_agendaOrder', []));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [actionDetails, setActionDetails] = useState<Record<string, { owner: string, deadline: string }>>(() => loadState('borging_actionDetails', {}));
  const [showActionDetails, setShowActionDetails] = useState(() => loadState('borging_showActionDetails', false));

  // Save state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('borging_doeIk', JSON.stringify(checkedDoeIk)); }, [checkedDoeIk]);
  useEffect(() => { localStorage.setItem('borging_vergtActie', JSON.stringify(checkedVergtActie)); }, [checkedVergtActie]);
  useEffect(() => { localStorage.setItem('borging_confidence', JSON.stringify(confidence)); }, [confidence]);
  useEffect(() => { localStorage.setItem('borging_agendaOrder', JSON.stringify(agendaOrder)); }, [agendaOrder]);
  useEffect(() => { localStorage.setItem('borging_actionDetails', JSON.stringify(actionDetails)); }, [actionDetails]);
  useEffect(() => { localStorage.setItem('borging_showActionDetails', JSON.stringify(showActionDetails)); }, [showActionDetails]);

  const handleActionDetailChange = (id: string, field: 'owner' | 'deadline', value: string) => {
    setActionDetails(prev => ({
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

  const handleExport = () => {
    const content = document.getElementById('pdf-content');
    if (!content) return;

    const clone = content.cloneNode(true) as HTMLElement;

    // Replace inputs with spans
    const originalInputs = content.querySelectorAll('input[type="text"]');
    const clonedInputs = clone.querySelectorAll('input[type="text"]');
    
    originalInputs.forEach((orig, index) => {
      const el = orig as HTMLInputElement;
      const cloneEl = clonedInputs[index] as HTMLInputElement;
      const span = document.createElement('span');
      span.className = 'inline-block border-b border-slate-300 bg-transparent px-1 min-w-[100px] text-sm font-medium';
      span.textContent = el.value || '_________________';
      cloneEl.parentNode?.replaceChild(span, cloneEl);
    });

    // Remove toggle checkbox
    const toggleCheckbox = clone.querySelector('#toggle-action-details');
    if (toggleCheckbox) {
      toggleCheckbox.parentElement?.remove();
    }

    // Remove fixed heights and scrollbars so everything is fully visible
    const scrollableDivs = clone.querySelectorAll('.overflow-y-auto, .h-\\[600px\\], .max-h-\\[600px\\]');
    scrollableDivs.forEach(div => {
      div.classList.remove('overflow-y-auto', 'h-[600px]', 'max-h-[600px]');
    });

    // Remove interactive elements that don't make sense in static HTML
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.querySelector('.lucide-grip-vertical')) {
        btn.remove(); // Remove drag handles
      } else {
        btn.style.pointerEvents = 'none'; // Disable other buttons
      }
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Borgingsrapport Examencommissie</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #f8fafc;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      padding: 2rem;
    }
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: #f8fafc; /* Match app background */
    }
    .cursor-grab { cursor: default !important; }
    .lucide-grip-vertical { display: none !important; }
    button { pointer-events: none !important; }
    
    /* Ensure charts render well */
    .recharts-wrapper { margin: 0 auto; }
    
    /* Ensure lists and scrollable areas are fully visible */
    .overflow-y-auto, .overflow-hidden, .h-\\[600px\\] {
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="text-center mb-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Borgingsrapport Examencommissie</h1>
      <p class="text-xl text-slate-500">Gegenereerd op ${new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${clone.innerHTML}
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Borgingsrapport_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDoeIkChange = (id: string) => {
    setCheckedDoeIk(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVergtActieChange = (id: string) => {
    setCheckedVergtActie(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      // Update agenda order if newly checked
      if (newState[id] && !agendaOrder.includes(id)) {
        setAgendaOrder([...agendaOrder, id]);
      } else if (!newState[id]) {
        setAgendaOrder(agendaOrder.filter(itemId => itemId !== id));
      }
      return newState;
    });
  };

  const handleConfidenceChange = (categoryId: string, value: number) => {
    setConfidence(prev => ({ ...prev, [categoryId]: value }));
  };

  const moveAgendaItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newOrder = [...agendaOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setAgendaOrder(newOrder);
    } else if (direction === 'down' && index < agendaOrder.length - 1) {
      const newOrder = [...agendaOrder];
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
      setAgendaOrder(newOrder);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Required for Firefox
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
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

    const newOrder = [...agendaOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setAgendaOrder(newOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Derived data for results
  const aandachtspunten = useMemo(() => {
    const points: { category: Category; element: any; instrument: Instrument }[] = [];
    categories.forEach(cat => {
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          if (!checkedDoeIk[inst.id]) {
            points.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });
    return points;
  }, [checkedDoeIk]);

  const borgingsagenda = useMemo(() => {
    const items: { category: Category; element: any; instrument: Instrument }[] = [];
    // Use the agendaOrder to sort the items
    agendaOrder.forEach(id => {
      categories.forEach(cat => {
        cat.elements.forEach(el => {
          const inst = el.instruments.find(i => i.id === id);
          if (inst && checkedVergtActie[id]) {
            items.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });

    if (showActionDetails) {
      items.sort((a, b) => {
        const deadlineA = actionDetails[a.instrument.id]?.deadline || '';
        const deadlineB = actionDetails[b.instrument.id]?.deadline || '';
        
        const parseDeadline = (d: string) => {
          if (!d || !d.trim()) return 99999999;
          
          let year = 9999;
          let monthOrQuarter = 99;
          
          const yearMatch = d.match(/\b(20\d{2})\b/);
          if (yearMatch) year = parseInt(yearMatch[1], 10);
          
          const qMatch = d.match(/Q([1-4])/i);
          if (qMatch) {
            monthOrQuarter = parseInt(qMatch[1], 10) * 3;
          } else {
            const monthMatch = d.match(/\b(0?[1-9]|1[0-2])[-/]\d{4}\b/);
            if (monthMatch) {
              monthOrQuarter = parseInt(monthMatch[1], 10);
            } else {
              const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
              const lowerD = d.toLowerCase();
              for (let i = 0; i < months.length; i++) {
                if (lowerD.includes(months[i])) {
                  monthOrQuarter = i + 1;
                  break;
                }
              }
            }
          }
          
          return year * 100 + monthOrQuarter;
        };
        
        return parseDeadline(deadlineA) - parseDeadline(deadlineB);
      });
    }

    return items;
  }, [checkedVergtActie, agendaOrder, showActionDetails, actionDetails]);

  const radarData = useMemo(() => {
    return categories.map(cat => {
      let total = 0;
      let checked = 0;
      cat.elements.forEach(el => {
        el.instruments.forEach(inst => {
          total++;
          if (checkedDoeIk[inst.id]) checked++;
        });
      });
      return {
        subject: cat.name,
        A: total > 0 ? Math.round((checked / total) * 100) : 0,
        fullMark: 100,
      };
    });
  }, [checkedDoeIk]);

  const barData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      Vertrouwen: (confidence[cat.id] || 0) * 20,
      fill: getCategoryColorHex(cat.id),
      id: cat.id
    }));
  }, [confidence]);

  const totalInstruments = categories.reduce((acc, cat) => acc + cat.elements.reduce((eAcc, el) => eAcc + el.instruments.length, 0), 0);
  const totalDoeIk = Object.values(checkedDoeIk).filter(Boolean).length;
  const totalVergtActie = Object.values(checkedVergtActie).filter(Boolean).length;
  
  const confValues = Object.values(confidence) as number[];
  const minConf = confValues.length > 0 ? Math.min(...confValues) : 0;
  const maxConf = confValues.length > 0 ? Math.max(...confValues) : 0;
  const avgConfidence = categories.length > 0 
    ? (categories.reduce((acc, cat) => acc + (confidence[cat.id] || 0), 0) / categories.length).toFixed(1)
    : "0.0";

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

  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    const category = categories.find(c => c.name === payload.value);
    const color = category ? getCategoryColorHex(category.id) : '#64748b';
    return (
      <g className="cursor-pointer" onClick={() => category && scrollToCategory(category.id)}>
        <text radius={radius} stroke={stroke} x={x} y={y} className="text-[10px] sm:text-xs font-bold hover:opacity-80 transition-opacity" textAnchor={textAnchor} fill={color}>
          {payload.value}
        </text>
      </g>
    );
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getCategoryColorHex(payload.id);
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Borging door Examencommissies</h1>
          <nav className="hidden md:flex space-x-8 items-center">
            <a href="#theorie" className="text-sm font-medium text-slate-600 hover:text-slate-900">Theorie</a>
            <a href="#zelfscan" className="text-sm font-medium text-slate-600 hover:text-slate-900">Zelfscan</a>
            <a href="#resultaten" className="text-sm font-medium text-slate-600 hover:text-slate-900">Resultaten</a>
            <button 
              onClick={() => {
                if(window.confirm('Weet u zeker dat u alle ingevulde gegevens wilt wissen?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors print:hidden"
            >
              Wis Gegevens
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors print:hidden"
            >
              <Download className="w-4 h-4" />
              Exporteer
            </button>
          </nav>
        </div>
      </header>

      <main id="pdf-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 bg-slate-50">
        
        {/* Section 1: Theory */}
        <section id="theorie" className="space-y-8 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vertrouwensboom: Scan van het borgende instrumentarium</h2>
                <div className="prose prose-slate prose-lg">
                  <p>
                    De Vertrouwensboom biedt Examencommissies een specifiek en praktisch overzicht van borgingsinstrumenten voor programmatisch toetsen. Het document beoogt examencommissies te voorzien van inspiratie bij de selectie van instrumenten om te komen tot een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem. Het helpt grip te houden op kwaliteit, bijsturing te onderbouwen en het verlenen van een graad te onderschrijven.
                  </p>
                  <p>
                    De term 'borging' is in de WHW niet gedefinieerd. Omdat een toetssysteem nooit 100% waterdicht is, is het zinvol de term goed te definiëren en in de context van het doel te plaatsen:
                  </p>
                  <ul className="list-none pl-0 space-y-3">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">→</span>
                      <span><strong>Borgen</strong> is het objectief en systematisch vastleggen en aantoonbaar bewaken van de kwaliteit van toetsing door middel van maatregelen en procedures</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">→</span>
                      <span><strong>Borging is succesvol</strong> als systematische meting van de kwaliteit van toetsing leidt tot het benodigde vertrouwen binnen de examencommissie om het verlenen van een graad te onderschrijven</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">→</span>
                      <span><strong>Borgende instrumenten</strong> bieden een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem, zodat de examencommissie een beredeneerd oordeel kan vormen over haar vertrouwen in dit systeem</span>
                    </li>
                  </ul>
                  <p>
                    Hieruit volgt dat niet de borging zelf het voornaamste uitgangspunt is, maar het vertrouwen dat de examencommissie eraan ontleent. Dit vertrouwen vormt de basis voor haar handelen. De commissie onderzoekt voortdurend haar mate van vertrouwen en grijpt in wanneer dit vertrouwen onvoldoende is of dreigt af te nemen. Daarom is het van belang om zicht te hebben op het volledige palet aan borgende instrumenten, zodat een integraal en objectief onderbouwd oordeel gevormd kan worden, waarop zowel vertrouwen als bijsturing kan berusten.
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-200">
              <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg shadow-md bg-white">
    <img 
      src="./vertrouwensboom.png" 
      alt="Vertrouwensboom" 
      className="w-full h-auto block"
    />
        </div>
        </div>
        </section>

        {/* Section 2: Self-Scan */}
        <section id="zelfscan" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Zelfscan Instrumentarium</h2>
            <p className="text-lg text-slate-600">
              Loop door de onderstaande categorieën en geef per instrument aan of u dit momenteel inzet ("Doen we") en of er actie vereist is ("Vergt actie"). Geef tevens per categorie uw vertrouwen aan op een schaal van 1 tot 5 sterren.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="toggle-action-details" 
                checked={showActionDetails} 
                onChange={(e) => setShowActionDetails(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
              />
              <label htmlFor="toggle-action-details" className="text-sm font-medium text-slate-700 cursor-pointer">
                Optioneel: Actieplanning (eigenaar en deadline) inschakelen (dit kan ook achteraf)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} id={`category-${category.id}`} className={`rounded-xl overflow-hidden border ${category.borderColorClass} shadow-sm ${category.colorClass} bg-opacity-20 print-break-avoid scroll-mt-24`}>
                <div className={`${category.colorClass} px-4 py-2 border-b ${category.borderColorClass} flex flex-col md:flex-row md:items-center justify-between gap-2`}>
                  <h3 className={`text-lg font-bold ${category.textColorClass}`}>{category.name}</h3>
                  
                  <div className="flex items-center gap-3 bg-white/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-sm font-bold text-slate-800">Vertrouwen:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => {
                        const isSelected = (confidence[category.id] || 0) >= rating;
                        return (
                          <button
                            key={rating}
                            onClick={() => handleConfidenceChange(category.id, rating)}
                            className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none"
                          >
                            <Star 
                              className={`w-6 h-6 ${isSelected ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-black/5">
                  {category.elements.map(element => (
                    <div key={element.id} className="px-4 py-2">
                      <div className="mb-1.5 flex items-baseline gap-2">
                        <h4 className="text-base font-bold text-slate-800">{element.name}</h4>
                        <p className="text-xs text-slate-600 hidden md:block">- {element.description}</p>
                      </div>
                      <p className="text-xs text-slate-600 md:hidden mb-2">{element.description}</p>
                      
                      <div className="space-y-1.5">
                        {element.instruments.map(instrument => {
                          const isVergtActie = !!checkedVergtActie[instrument.id];
                          const isDoeIk = !!checkedDoeIk[instrument.id];
                          
                          const itemBgClass = isVergtActie 
                            ? 'bg-amber-50 border-amber-300' 
                            : isDoeIk 
                              ? 'bg-emerald-50 border-emerald-300' 
                              : 'bg-white/60 border-white/40 hover:bg-white/90 hover:border-white/60';

                          return (
                            <div key={instrument.id} className="flex flex-col gap-2">
                              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${itemBgClass}`}>
                                <div className="flex-1 text-sm text-slate-800 leading-snug">
                                  {instrument.text}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleDoeIkChange(instrument.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                      isDoeIk 
                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Doen we
                                  </button>
                                  <button
                                    onClick={() => handleVergtActieChange(instrument.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                      isVergtActie 
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Vergt actie
                                  </button>
                                </div>
                              </div>
                              
                              {isVergtActie && showActionDetails && (
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex flex-col sm:flex-row gap-3 print:bg-transparent print:border-none print:p-0 print:mt-1 print-break-avoid">
                                  <div className="flex-1 flex items-center gap-2">
                                    <User className="w-4 h-4 text-amber-600 print:text-slate-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Eigenaar..." 
                                      value={actionDetails[instrument.id]?.owner || ''}
                                      onChange={(e) => handleActionDetailChange(instrument.id, 'owner', e.target.value)}
                                      className="text-sm bg-white border border-amber-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 print:border-0 print:border-b print:border-slate-300 print:bg-transparent print:rounded-none print:px-0"
                                    />
                                  </div>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-600 print:text-slate-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Deadline (bijv. Q3 2026)..." 
                                      value={actionDetails[instrument.id]?.deadline || ''}
                                      onChange={(e) => handleActionDetailChange(instrument.id, 'deadline', e.target.value)}
                                      className="text-sm bg-white border border-amber-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 print:border-0 print:border-b print:border-slate-300 print:bg-transparent print:rounded-none print:px-0"
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
            ))}
          </div>
        </section>

        {/* Section 3: Results */}
        <section id="resultaten" className="space-y-8 scroll-mt-24 pt-8 border-t border-slate-200">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Resultaten & Agenda</h2>
            <p className="text-lg text-slate-600">
              Bekijk hieronder de visuele weergave van uw zelfscan, de openstaande aandachtspunten en uw geprioriteerde borgingsagenda.
            </p>
          </div>

          {/* Infographic: Totaalbeeld */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Totaalbeeld Borging</h3>
            <div id="export-totaalbeeld" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center shadow-sm flex flex-col justify-center">
                <div className="text-4xl font-black text-emerald-600">{totalDoeIk} <span className="text-2xl text-emerald-400">/ {totalInstruments}</span></div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-2">Ingezet ("Doen we")</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center shadow-sm flex flex-col justify-center">
                <div className="text-4xl font-black text-amber-600">{totalVergtActie}</div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-2">Vergt Actie</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center shadow-sm flex flex-col justify-center">
                <div className="text-4xl font-black text-blue-600">{avgConfidence} <span className="text-lg text-blue-400">/ 5</span></div>
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-2">Gem. Vertrouwen</div>
                <div className="text-xs text-blue-600 mt-2 font-medium">Min: {minConf} | Max: {maxConf}</div>
              </div>
            </div>
            
            <div id="export-borgingsgraad" className="space-y-3 mt-8">
              <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">Borgingsgraad per Categorie</h4>
              <div className="flex flex-col gap-2">
                {categories.map(category => {
                  const catInstruments = category.elements.flatMap(e => e.instruments);
                  const catTotal = catInstruments.length;
                  const catDoeIk = catInstruments.filter(inst => checkedDoeIk[inst.id]).length;
                  const catGraad = Math.round((catDoeIk / catTotal) * 100) || 0;
                  const verbeterActies = catInstruments.filter(inst => !checkedDoeIk[inst.id]);
                  const hue = Math.round((catGraad / 100) * 120);
                  const barColor = `hsl(${hue}, 80%, 45%)`;

                  return (
                    <div key={category.id} className={`${category.colorClass} bg-opacity-40 p-2.5 rounded-lg border border-slate-200 shadow-sm`}>
                      <div className="flex items-center gap-3">
                        {catGraad === 100 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        <span className={`text-sm font-bold ${category.textColorClass} w-32 sm:w-48 shrink-0 leading-tight`}>
                          {category.name}
                        </span>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ width: `${catGraad}%`, backgroundColor: barColor }}></div>
                          </div>
                          <span className="text-sm font-black text-slate-700 w-10 text-right">{catGraad}%</span>
                        </div>
                      </div>
                      
                      {verbeterActies.length > 0 && (
                        <div className="text-xs text-slate-600 leading-snug pl-8 mt-1.5">
                          <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">Doen we niet:</span>
                          {verbeterActies.map(inst => inst.text).join(' • ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div id="export-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spider Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Inzet Instrumenten ("Doen we")</h3>
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Inzet (%)" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} isAnimationActive={false} dot={<CustomDot />} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Inzet']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Mate van vertrouwen (%)</h3>
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      interval={0} 
                      tick={{ fill: '#475569', fontSize: 11 }} 
                    />
                    <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: '#475569' }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [`${value}%`, 'Vertrouwen']} />
                    <Bar dataKey="Vertrouwen" radius={[4, 4, 0, 0]} isAnimationActive={false} onClick={(data) => scrollToCategory(data.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div id="export-lists" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Aandachtspunten */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Aandachtspunten
                </h3>
                <p className="text-sm text-slate-500 mt-1">Instrumenten die momenteel niet worden ingezet (geen "Doen we").</p>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {aandachtspunten.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400" />
                    <p>Geen aandachtspunten. U zet alle instrumenten in!</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {aandachtspunten.map((item, idx) => (
                      <li key={`aandacht-${idx}`} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
                            {item.category.name}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{item.element.name}</span>
                        </div>
                        <p className="text-sm text-slate-700">{item.instrument.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Borgingsagenda */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Borgingsagenda
                </h3>
                <p className="text-sm text-slate-500 mt-1">Instrumenten die actie vergen. Wijzig de volgorde om prioriteit aan te geven.</p>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {borgingsagenda.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Info className="w-12 h-12 mb-2 opacity-50" />
                    <p>Geen actiepunten geselecteerd.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {borgingsagenda.map((item, index) => (
                      <li 
                        key={`agenda-${item.instrument.id}`} 
                        className={`bg-white p-3 rounded-xl border ${draggedIndex === index ? 'border-emerald-500 shadow-md opacity-50' : 'border-slate-200 shadow-sm'} flex gap-3 group cursor-grab active:cursor-grabbing transition-all`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                          <GripVertical className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
                              {item.category.name}
                            </span>
                            <span className="text-xs font-medium text-slate-500">{item.element.name}</span>
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-3 group-hover:line-clamp-none transition-all">{item.instrument.text}</p>
                          {showActionDetails && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 print:mt-1">
                              <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium">{actionDetails[item.instrument.id]?.owner || '_________________'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="font-medium">{actionDetails[item.instrument.id]?.deadline || '_________________'}</span>
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
          </div>
        </section>
      </main>
    </div>
  );
}
