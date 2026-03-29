import React, { useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { categories, Category, Instrument } from './data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from 'recharts';
import { ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Info, GripVertical, Download, Star, User, Calendar, MessageSquare, Moon, Sun } from 'lucide-react';

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
  const [checkedNietNodig, setCheckedNietNodig] = useState<Record<string, boolean>>(() => loadState('borging_nietNodig', {}));
  const [confidence, setConfidence] = useState<Record<string, number>>(() => loadState('borging_confidence', {}));
  const [agendaOrder, setAgendaOrder] = useState<string[]>(() => loadState('borging_agendaOrder', []));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [actionDetails, setActionDetails] = useState<Record<string, { owner: string, deadline: string }>>(() => loadState('borging_actionDetails', {}));
  const [showActionDetails, setShowActionDetails] = useState(() => loadState('borging_showActionDetails', true));
  const [categoryComments, setCategoryComments] = useState<Record<string, string>>(() => loadState('borging_categoryComments', {}));
  const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({});

  // Save state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('borging_doeIk', JSON.stringify(checkedDoeIk)); }, [checkedDoeIk]);
  useEffect(() => { localStorage.setItem('borging_vergtActie', JSON.stringify(checkedVergtActie)); }, [checkedVergtActie]);
  useEffect(() => { localStorage.setItem('borging_nietNodig', JSON.stringify(checkedNietNodig)); }, [checkedNietNodig]);
  useEffect(() => { localStorage.setItem('borging_confidence', JSON.stringify(confidence)); }, [confidence]);
  useEffect(() => { localStorage.setItem('borging_agendaOrder', JSON.stringify(agendaOrder)); }, [agendaOrder]);
  useEffect(() => { localStorage.setItem('borging_actionDetails', JSON.stringify(actionDetails)); }, [actionDetails]);
  useEffect(() => { localStorage.setItem('borging_showActionDetails', JSON.stringify(showActionDetails)); }, [showActionDetails]);
  useEffect(() => { localStorage.setItem('borging_categoryComments', JSON.stringify(categoryComments)); }, [categoryComments]);

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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleGenerateReport = async (reportType: 'full' | 'results') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Pop-up blocker prevented het rapport van openen. Sta pop-ups toe voor deze site.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <title>Rapport wordt gegenereerd...</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
          .loader { border: 4px solid #e2e8f0; border-top: 4px solid #0f172a; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <h2>Rapport wordt gegenereerd...</h2>
          <p>Even geduld aub. Dit kan enkele seconden duren.</p>
        </div>
      </body>
      </html>
    `);

    // Capture charts
    const spiderEl = document.getElementById('spider-chart-container');
    const barEl = document.getElementById('bar-chart-container');
    
    let spiderImg = '';
    let barImg = '';

    const captureWithTimeout = (el: HTMLElement, options: any, timeoutMs: number) => {
      return Promise.race([
        html2canvas(el, options),
        new Promise<HTMLCanvasElement>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
      ]);
    };

    try {
      if (spiderEl) {
        const canvas = await captureWithTimeout(spiderEl, { scale: 2, useCORS: true, logging: false }, 3000);
        spiderImg = canvas.toDataURL('image/png');
      }
      if (barEl) {
        const canvas = await captureWithTimeout(barEl, { scale: 2, useCORS: true, logging: false }, 3000);
        barImg = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error("Error capturing charts", e);
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Borgingsrapport</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    @media print {
      @page { margin: 1.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { break-before: page; }
      .avoid-break { break-inside: avoid; }
      
      /* Forceer de pagina om bij het begin te beginnen */
      html, body {
        height: auto !important;
        overflow: visible !important;
        position: static !important;
      }
    }
  </style>
</head>
  <body class="bg-white text-slate-800">
  ${reportType === 'full' ? `
  <!-- Page 1: Cover -->
  <div class="h-screen flex flex-col items-center justify-center relative p-8 text-center">
    <h1 class="text-5xl font-extrabold text-slate-900 mb-8">Borging a.d.h.v. De Vertrouwensboom</h1>
    <img src="/vertrouwensboom.png" alt="De Vertrouwensboom" class="max-w-md w-full object-contain mb-8" onerror="this.style.display='none'" />
    <h2 class="text-2xl font-medium text-slate-600">Een zelfscan van het borgende instrumentarium</h2>
    <div class="absolute bottom-12 text-slate-400 font-medium">${new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <!-- Page 2: Theorie -->
  <div class="page-break p-8">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Uitgangspunten van De Vertrouwensboom</h2>
    <div class="prose prose-slate max-w-none">
      <p class="mb-4">De Vertrouwensboom is een metafoor voor het bouwen en onderhouden van vertrouwen binnen en buiten de organisatie. Het model gaat ervan uit dat vertrouwen moet groeien en geworteld moet zijn in stevige fundamenten.</p>
      <p class="mb-4"><strong>Wortels (Fundament):</strong> Dit zijn de kernwaarden, de visie en de missie van de organisatie. Zonder sterke wortels kan de boom niet groeien of stormen doorstaan.</p>
      <p class="mb-4"><strong>Stam (Organisatie):</strong> De structuur, processen en leiderschap die de organisatie overeind houden. Een stevige stam zorgt voor stabiliteit en richting.</p>
      <p class="mb-4"><strong>Takken (Verbinding):</strong> De relaties met stakeholders, zowel intern (medewerkers) als extern (klanten, partners, maatschappij). Vertrouwen reikt uit naar de omgeving.</p>
      <p class="mb-4"><strong>Bladeren (Zichtbaarheid):</strong> De dagelijkse acties, communicatie en transparantie. Dit is wat de buitenwereld ziet en ervaart.</p>
      <h3 class="text-xl font-bold mt-6 mb-3">Borging is...</h3>
      <ul class="list-disc pl-5 space-y-2">
        <li>Het structureel inbedden van afspraken, processen en gedrag.</li>
        <li>Zorgen dat wat we beloven, ook daadwerkelijk gebeurt en blijft gebeuren.</li>
        <li>Niet eenmalig, maar een continu proces van evalueren en bijsturen.</li>
        <li>Essentieel voor het behouden en versterken van vertrouwen.</li>
      </ul>
    </div>
  </div>
  ` : ''}

  <!-- Page 3: Resultaten -->
  <div class="${reportType === 'full' ? 'page-break' : ''} p-8">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Totaalbeeld Borging</h2>
    <div class="grid grid-cols-3 gap-6 mb-8">
      <div class="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center">
        <div class="text-5xl font-black text-emerald-600">${totalDoeIk} <span class="text-2xl text-emerald-400">/ ${totalInstruments}</span></div>
        <div class="text-sm font-bold text-emerald-700 uppercase tracking-wider mt-2">Ingezet ("Doen we")</div>
      </div>
      <div class="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
        <div class="text-5xl font-black text-amber-600">${totalVergtActie}</div>
        <div class="text-sm font-bold text-amber-700 uppercase tracking-wider mt-2">Vergt Actie</div>
      </div>
      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
        <div class="text-5xl font-black text-slate-600">${totalNietNodig}</div>
        <div class="text-sm font-bold text-slate-700 uppercase tracking-wider mt-2">Niet Nodig</div>
      </div>
    </div>
    
    <h3 class="text-xl font-bold text-slate-800 mb-4">Borgingsgraad per Categorie</h3>
    <div class="space-y-4">
      ${categories.map(category => {
        const catInstruments = category.elements.flatMap(e => e.instruments);
        const catTotal = catInstruments.length;
        const catDoeIk = catInstruments.filter(inst => checkedDoeIk[inst.id]).length;
        const percentage = Math.round((catDoeIk / catTotal) * 100) || 0;
        return `
          <div class="bg-white p-4 rounded-lg border border-slate-200 avoid-break">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-slate-800">${category.name}</span>
              <span class="font-bold ${percentage >= 75 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}">${percentage}% (${catDoeIk}/${catTotal})</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5">
              <div class="h-2.5 rounded-full ${percentage >= 75 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>

  <!-- Page 4: Visuals -->
  <div class="page-break p-8">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Visuele Weergave</h2>
    <div class="space-y-8">
      ${spiderImg ? `
      <div class="avoid-break">
        <h3 class="text-xl font-bold text-slate-800 mb-4 text-center">Inzet van Instrumenten (%)</h3>
        <div class="flex justify-center"><img src="${spiderImg}" alt="Spider Chart" style="max-width: 100%; height: auto;" /></div>
      </div>` : ''}
      
      ${barImg ? `
      <div class="avoid-break mt-8">
        <h3 class="text-xl font-bold text-slate-800 mb-4 text-center">Mate van vertrouwen (%)</h3>
        <div class="flex justify-center"><img src="${barImg}" alt="Bar Chart" style="max-width: 100%; height: auto;" /></div>
      </div>` : ''}
    </div>
  </div>

  <!-- Page 5: Agenda & Punten -->
  <div class="page-break p-8">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Borgingsagenda & Aandachtspunten</h2>
    
    <div class="mb-8">
      <h3 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Borgingsagenda (Vergt Actie)
      </h3>
      ${borgingsagenda.length > 0 ? `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-100">
            <th class="p-3 border border-slate-200 font-bold text-sm">Categorie</th>
            <th class="p-3 border border-slate-200 font-bold text-sm">Instrument</th>
            <th class="p-3 border border-slate-200 font-bold text-sm w-32">Eigenaar</th>
            <th class="p-3 border border-slate-200 font-bold text-sm w-32">Deadline</th>
          </tr>
        </thead>
        <tbody>
          ${borgingsagenda.map(item => `
            <tr class="avoid-break">
              <td class="p-3 border border-slate-200 text-sm align-top"><span class="font-semibold ${item.category.textColorClass}">${item.category.name}</span><br/><span class="text-xs text-slate-500">${item.element.name}</span></td>
              <td class="p-3 border border-slate-200 text-sm align-top">${item.instrument.text}</td>
              <td class="p-3 border border-slate-200 text-sm align-top">${actionDetails[item.instrument.id]?.owner || ''}</td>
              <td class="p-3 border border-slate-200 text-sm align-top">${actionDetails[item.instrument.id]?.deadline || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p class="text-slate-500 italic">Geen actiepunten geselecteerd.</p>'}
    </div>

    <div>
      <h3 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        Aandachtspunten (Niet ingezet)
      </h3>
      ${aandachtspunten.length > 0 ? `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-100">
            <th class="p-3 border border-slate-200 font-bold text-sm w-1/4">Categorie</th>
            <th class="p-3 border border-slate-200 font-bold text-sm">Instrument</th>
          </tr>
        </thead>
        <tbody>
          ${aandachtspunten.map(item => `
            <tr class="avoid-break">
              <td class="p-3 border border-slate-200 text-sm align-top"><span class="font-semibold ${item.category.textColorClass}">${item.category.name}</span><br/><span class="text-xs text-slate-500">${item.element.name}</span></td>
              <td class="p-3 border border-slate-200 text-sm align-top">${item.instrument.text}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p class="text-slate-500 italic">Geen aandachtspunten. U zet alle instrumenten in!</p>'}
    </div>
  </div>

  ${reportType === 'full' ? `
  <!-- Bijlage: Zelfscan -->
  <div class="page-break p-8">
    <h2 class="text-3xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Bijlage: Volledige Zelfscan</h2>
    
    ${categories.map(category => `
      <div class="mb-8 avoid-break">
        <h3 class="text-xl font-bold mb-3 ${category.textColorClass}">${category.name}</h3>
        <table class="w-full text-left border-collapse mb-4">
          <thead>
            <tr class="bg-slate-100">
              <th class="p-2 border border-slate-200 font-bold text-xs w-1/4">Element</th>
              <th class="p-2 border border-slate-200 font-bold text-xs w-1/2">Instrument</th>
              <th class="p-2 border border-slate-200 font-bold text-xs w-1/4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${category.elements.map(element => 
              element.instruments.map((instrument, idx) => {
                const isDoeIk = checkedDoeIk[instrument.id];
                const isVergtActie = checkedVergtActie[instrument.id];
                const isNietNodig = checkedNietNodig[instrument.id];
                
                let statusHtml = '';
                if (isNietNodig) statusHtml = '<span class="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded font-medium">Niet nodig</span>';
                else {
                  if (isDoeIk) statusHtml += '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded font-medium mr-1">Doen we</span>';
                  if (isVergtActie) statusHtml += '<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-medium">Vergt actie</span>';
                  if (!isDoeIk && !isVergtActie) statusHtml = '<span class="text-slate-400 text-xs italic">-</span>';
                }

                return `
                  <tr>
                    ${idx === 0 ? `<td class="p-2 border border-slate-200 text-xs align-top font-medium" rowspan="${element.instruments.length}">${element.name}</td>` : ''}
                    <td class="p-2 border border-slate-200 text-xs align-top ${isNietNodig ? 'line-through text-slate-400' : ''}">${instrument.text}</td>
                    <td class="p-2 border border-slate-200 text-xs align-top text-center">${statusHtml}</td>
                  </tr>
                `;
              }).join('')
            ).join('')}
          </tbody>
        </table>
        ${categoryComments[category.id] ? `
          <div class="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
            <strong>Opmerking:</strong> ${categoryComments[category.id]}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <script>
    setTimeout(() => {
      window.print();
      window.onafterprint = () => {
        window.close();
      };
    }, 1000); // Give it a little time to render everything
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDoeIkChange = (id: string) => {
    setCheckedDoeIk(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      if (newState[id]) {
        setCheckedNietNodig(n => ({ ...n, [id]: false }));
      }
      return newState;
    });
  };

  const handleVergtActieChange = (id: string) => {
    setCheckedVergtActie(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      if (newState[id]) {
        setCheckedNietNodig(n => ({ ...n, [id]: false }));
        if (!agendaOrder.includes(id)) {
          setAgendaOrder([...agendaOrder, id]);
        }
      } else {
        setAgendaOrder(agendaOrder.filter(itemId => itemId !== id));
      }
      return newState;
    });
  };

  const handleNietNodigChange = (id: string) => {
    setCheckedNietNodig(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      if (newState[id]) {
        setCheckedDoeIk(d => ({ ...d, [id]: false }));
        setCheckedVergtActie(v => ({ ...v, [id]: false }));
        setAgendaOrder(order => order.filter(itemId => itemId !== id));
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
          if (!checkedDoeIk[inst.id] && !checkedNietNodig[inst.id]) {
            points.push({ category: cat, element: el, instrument: inst });
          }
        });
      });
    });
    return points;
  }, [checkedDoeIk, checkedNietNodig]);

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
          if (!checkedNietNodig[inst.id]) {
            total++;
            if (checkedDoeIk[inst.id]) checked++;
          }
        });
      });
      return {
        subject: cat.name,
        A: total > 0 ? Math.round((checked / total) * 100) : 0,
        fullMark: 100,
      };
    });
  }, [checkedDoeIk, checkedNietNodig]);

  const barData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      Vertrouwen: (confidence[cat.id] || 0) * 20,
      fill: getCategoryColorHex(cat.id),
      id: cat.id
    }));
  }, [confidence]);

  const totalInstruments = categories.reduce((acc, cat) => acc + cat.elements.reduce((eAcc, el) => eAcc + el.instruments.filter(i => !checkedNietNodig[i.id]).length, 0), 0);
  const totalDoeIk = Object.values(checkedDoeIk).filter(Boolean).length;
  const totalVergtActie = Object.values(checkedVergtActie).filter(Boolean).length;
  const totalNietNodig = Object.values(checkedNietNodig).filter(Boolean).length;
  
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center">Borging a.d.h.v. De Vertrouwensboom</h1>
          
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center print:hidden">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                title="Wissel Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <a href="#theorie" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Theorie</a>
              <a href="#zelfscan" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Zelfscan</a>
              <a href="#resultaten" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Resultaten</a>
              <a href="#agenda" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Agenda</a>
            </nav>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 print:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-2 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Exporteer
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleGenerateReport('full')}
                  className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
                >
                  Alles
                </button>
                <button 
                  onClick={() => handleGenerateReport('results')}
                  className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
                >
                  Resultaten
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="pdf-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 bg-slate-50 dark:bg-slate-900 transition-colors">
        
        {/* Section 1: Theory */}
        <section id="theorie" className="space-y-8 scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-12 transition-colors">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-center">Uitgangspunten van De Vertrouwensboom</h2>
              <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300">
                <p>
                  De Vertrouwensboom biedt Examencommissies een specifiek en praktisch overzicht van borgingsinstrumenten voor programmatisch toetsen. Het document beoogt examencommissies te voorzien van inspiratie bij de selectie van instrumenten om te komen tot een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem. Het helpt grip te houden op kwaliteit, bijsturing te onderbouwen en het verlenen van een graad te onderschrijven.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mt-8 print:break-before-page">
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-6 md:p-8 flex flex-col justify-start border border-slate-200 dark:border-slate-600 transition-colors">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">Borging is...</h3>
                  <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300">
                    <p className="mb-6">
                      De term 'borging' is in de WHW niet gedefinieerd. Omdat een toetssysteem nooit 100% waterdicht is, is het zinvol de term goed te definiëren en in de context van het doel te plaatsen:
                    </p>
                    <ul className="list-none pl-0 space-y-4">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 font-black text-xl leading-snug">→</span>
                        <span><strong>Borgen</strong> is het objectief en systematisch vastleggen en aantoonbaar bewaken van de kwaliteit van toetsing door middel van maatregelen en procedures</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 font-black text-xl leading-snug">→</span>
                        <span><strong>Borging is succesvol</strong> als systematische meting van de kwaliteit van toetsing leidt tot het benodigde vertrouwen binnen de examencommissie om het verlenen van een graad te onderschrijven</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-3 font-black text-xl leading-snug">→</span>
                        <span><strong>Borgende instrumenten</strong> bieden een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem, zodat de examencommissie een beredeneerd oordeel kan vormen over haar vertrouwen in dit systeem</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-6 md:p-8 flex flex-col items-center justify-start border border-slate-200 dark:border-slate-600 min-h-[300px] transition-colors">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center w-full">De Vertrouwensboom</h3>
                  <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden rounded-lg shadow-md bg-white dark:bg-slate-800 flex items-center justify-center mt-auto mb-auto transition-colors">
                    <img 
                      src="./vertrouwensboom.png" 
                      alt="Vertrouwensboom" 
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              </div>

              <div className="prose prose-slate dark:prose-invert prose-lg max-w-none mt-8 text-slate-700 dark:text-slate-300">
                <p>
                  Het voornaamste uitgangspunt is het vertrouwen dat de examencommissie aan borging ontleent. Dit vertrouwen vormt de basis voor haar handelen. De commissie onderzoekt voortdurend haar mate van vertrouwen en grijpt in wanneer dit vertrouwen onvoldoende is of dreigt af te nemen. Daarom is het van belang om zicht te hebben op het volledige palet aan borgende instrumenten, zodat een integraal en objectief onderbouwd oordeel gevormd kan worden, waarop zowel vertrouwen als bijsturing kan berusten.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Self-Scan */}
        <section id="zelfscan" className="space-y-8 scroll-mt-24 print:break-before-page">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Zelfscan van het Instrumentarium</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Geef aan welke instrumenten u hanteert en of actie vereist is (evt. door wie en wanneer).<br />
              Geef per categorie uw vertrouwen aan en voeg evt. een opmerking toe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 w-full">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="toggle-action-details" 
                  checked={showActionDetails} 
                  onChange={(e) => setShowActionDetails(e.target.checked)}
                  className="w-4 h-4 text-slate-900 dark:text-slate-100 rounded border-slate-300 dark:border-slate-600 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-slate-800"
                />
                <label htmlFor="toggle-action-details" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Actieplanning t.b.v. borgingsagenda in-/uitschakelen
                </label>
              </div>
              <button 
                onClick={() => {
                  if(window.confirm('Weet u zeker dat u alle ingevulde gegevens wilt wissen?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors print:hidden"
              >
                Wis Gegevens
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} id={`category-${category.id}`} className={`rounded-xl overflow-hidden border ${category.borderColorClass} shadow-sm ${category.containerColorClass} print-break-avoid scroll-mt-24 transition-colors`}>
                <div className={`${category.colorClass} px-4 py-2 border-b ${category.borderColorClass} flex flex-col md:flex-row md:items-center justify-between gap-2 transition-colors`}>
                  <h3 className={`text-lg font-bold ${category.textColorClass}`}>{category.name}</h3>
                  
                  <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Vertrouwen:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => {
                        const isSelected = (confidence[category.id] || 0) >= rating;
                        return (
                          <button
                            key={rating}
                            onClick={() => handleConfidenceChange(category.id, rating)}
                            className="print-keep-button p-1 transition-all duration-200 hover:scale-125 focus:outline-none group"
                          >
                            <Star 
                              className={`w-6 h-6 transition-colors duration-200 ${isSelected ? 'fill-amber-400 text-amber-500 group-hover:fill-amber-500 group-hover:text-amber-600' : 'fill-transparent text-slate-300 group-hover:text-amber-300 group-hover:fill-amber-100'}`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {category.elements.map(element => (
                    <div key={element.id} className="px-4 py-2">
                      <div className="mb-1.5 flex items-baseline gap-2">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{element.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 hidden md:block">- {element.description}</p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 md:hidden mb-2">{element.description}</p>
                      
                      <div className="space-y-1.5">
                        {element.instruments.map(instrument => {
                          const isVergtActie = !!checkedVergtActie[instrument.id];
                          const isDoeIk = !!checkedDoeIk[instrument.id];
                          const isNietNodig = !!checkedNietNodig[instrument.id];
                          
                          const itemBgClass = isVergtActie 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-sm' 
                            : isDoeIk 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm' 
                              : isNietNodig
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600'
                                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm';

                          return (
                            <div key={instrument.id} className={`flex flex-col gap-0 rounded-lg border transition-all duration-200 ${itemBgClass}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
                                <div className={`flex-1 text-sm leading-snug ${isNietNodig ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {instrument.text}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                                  <button
                                    onClick={() => handleDoeIkChange(instrument.id)}
                                    disabled={isNietNodig}
                                    className={`print-keep-button px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                      isNietNodig
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                        : isDoeIk 
                                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    Doen we
                                  </button>
                                  <button
                                    onClick={() => handleVergtActieChange(instrument.id)}
                                    disabled={isNietNodig}
                                    className={`print-keep-button px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                      isNietNodig
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                        : isVergtActie 
                                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    Vergt actie
                                  </button>
                                  <button
                                    onClick={() => handleNietNodigChange(instrument.id)}
                                    className={`print-keep-button px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                      isNietNodig 
                                        ? 'bg-slate-500 text-white border-slate-600 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    Niet nodig
                                  </button>
                                </div>
                              </div>
                              
                              {isVergtActie && showActionDetails && (
                                <div className="flex flex-col sm:flex-row gap-4 px-3 pb-3 pt-2 border-t border-black/5 dark:border-white/5 print:border-none print:pt-0">
                                  <div className="flex-1 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Eigenaar..." 
                                      value={actionDetails[instrument.id]?.owner || ''}
                                      onChange={(e) => handleActionDetailChange(instrument.id, 'owner', e.target.value)}
                                      className="text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 px-1 py-1 w-full focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                  </div>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Deadline (bijv. Q3 2026)..." 
                                      value={actionDetails[instrument.id]?.deadline || ''}
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
                  
                  {/* Category Comments */}
                  <div className="px-4 py-3 bg-white/40 dark:bg-slate-800/40 border-t border-black/5 dark:border-white/5">
                    {!(showCommentInput[category.id] || categoryComments[category.id]) ? (
                      <button 
                        onClick={() => setShowCommentInput(prev => ({ ...prev, [category.id]: true }))}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-colors print:hidden"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Voeg opmerking toe
                      </button>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-1 shrink-0" />
                        <textarea
                          value={categoryComments[category.id] || ''}
                          onChange={(e) => setCategoryComments(prev => ({ ...prev, [category.id]: e.target.value }))}
                          placeholder={`Opmerkingen voor ${category.name}...`}
                          className="w-full text-sm bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 resize-y text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          autoFocus={!categoryComments[category.id]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Resultaten */}
        <section id="resultaten" className="space-y-8 scroll-mt-24 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Resultaten</h2>
          </div>

          <div id="resultaten-content" className="space-y-8 bg-slate-50 dark:bg-slate-900 p-2 -m-2 rounded-xl transition-colors">
            {/* Infographic: Totaalbeeld */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">Totaalbeeld Borging</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center shadow-sm flex flex-col justify-center transition-colors">
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{totalDoeIk} <span className="text-2xl text-emerald-400 dark:text-emerald-600">/ {totalInstruments}</span></div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mt-2">Ingezet ("Doen we")</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-center shadow-sm flex flex-col justify-center transition-colors">
                  <div className="text-4xl font-black text-amber-600 dark:text-amber-400">{totalVergtActie}</div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mt-2">Vergt Actie</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-center shadow-sm flex flex-col justify-center transition-colors">
                  <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{avgConfidence} <span className="text-lg text-blue-400 dark:text-blue-600">/ 5</span></div>
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider mt-2">Gem. Vertrouwen</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Min: {minConf} | Max: {maxConf}</div>
                </div>
              </div>
              
              <div className="space-y-3 mt-8 print:break-before-page">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">Borgingsgraad per Categorie</h4>
                <div className="flex flex-col gap-2">
                  {categories.map(category => {
                    const catInstruments = category.elements.flatMap(e => e.instruments).filter(inst => !checkedNietNodig[inst.id]);
                    const catTotal = catInstruments.length;
                    const catDoeIk = catInstruments.filter(inst => checkedDoeIk[inst.id]).length;
                    const catGraad = catTotal > 0 ? Math.round((catDoeIk / catTotal) * 100) : 0;
                    const verbeterActies = catInstruments.filter(inst => !checkedDoeIk[inst.id]);
                    const hue = Math.round((catGraad / 100) * 120);
                    const barColor = `hsl(${hue}, 80%, 45%)`;

                    return (
                      <div key={category.id} className={`${category.colorClass} p-2.5 rounded-lg border ${category.borderColorClass} shadow-sm transition-colors`}>
                        <div className="flex items-center gap-3">
                          {catGraad === 100 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          <span className={`text-sm font-bold ${category.textColorClass} dark:text-slate-200 w-32 sm:w-48 shrink-0 leading-tight`}>
                            {category.name}
                          </span>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden transition-colors">
                              <div className="h-full transition-all duration-1000" style={{ width: `${catGraad}%`, backgroundColor: barColor }}></div>
                            </div>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 w-10 text-right">{catGraad}%</span>
                          </div>
                        </div>
                        
                        {verbeterActies.length > 0 && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug pl-8 mt-2">
                            <span className="font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Doen we niet:</span>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              {verbeterActies.map(inst => (
                                <li key={inst.id}>{inst.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:break-before-page print:break-inside-avoid">
              {/* Spider Chart */}
              <div id="spider-chart-container" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">Inzet van Instrumenten (%)</h3>
                <div className="flex-1 min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Inzet (%)" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} isAnimationActive={false} dot={<CustomDot />} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Inzet']} 
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div id="bar-chart-container" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">Mate van vertrouwen (%)</h3>
                <div className="flex-1 min-h-[350px]">
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
                      <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: isDarkMode ? '#94a3b8' : '#475569' }} />
                      <Tooltip 
                        cursor={{fill: isDarkMode ? '#334155' : '#f8fafc'}} 
                        formatter={(value) => [`${value}%`, 'Vertrouwen']} 
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <ReferenceLine y={Math.round((avgConfidence / 5) * 100) || 0} stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeDasharray="3 3" strokeWidth={1} />
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
          </div>
        </section>

        {/* Section 4: Agenda */}
        <section id="agenda" className="space-y-8 scroll-mt-24 pt-8 border-t border-slate-200 dark:border-slate-700 transition-colors">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Agenda</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Overzicht van aandachtspunten en uw geprioriteerde borgingsagenda.
            </p>
          </div>

          <div id="agenda-content" className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900 p-2 -m-2 rounded-xl transition-colors">
            {/* Borgingsagenda */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-colors">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Borgingsagenda
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Instrumenten die actie vergen. Wijzig de volgorde om prioriteit aan te geven.</p>
              </div>
              <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20 transition-colors">
                {borgingsagenda.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <Info className="w-12 h-12 mb-2 opacity-50" />
                    <p>Geen actiepunten geselecteerd.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {borgingsagenda.map((item, index) => (
                      <li 
                        key={`agenda-${item.instrument.id}`} 
                        className={`bg-white dark:bg-slate-800 p-3 rounded-xl border ${draggedIndex === index ? 'border-emerald-500 shadow-md opacity-50' : 'border-slate-200 dark:border-slate-700 shadow-sm'} flex gap-3 group cursor-grab active:cursor-grabbing transition-all`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                          <GripVertical className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
                              {item.category.name}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.element.name}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 group-hover:line-clamp-none transition-all">{item.instrument.text}</p>
                          {showActionDetails && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 print:mt-1">
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

            {/* Aandachtspunten */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full print:break-before-page transition-colors">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Aandachtspunten
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Instrumenten die momenteel niet worden ingezet (geen "Doen we").</p>
              </div>
              <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20 transition-colors">
                {aandachtspunten.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400 dark:text-emerald-500" />
                    <p>Geen aandachtspunten. U zet alle instrumenten in!</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {aandachtspunten.map((item, idx) => (
                      <li key={`aandacht-${idx}`} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${item.category.colorClass} ${item.category.textColorClass}`}>
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
      </main>

      {/* Colofon */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 print:mt-8 print:py-4 transition-colors">
        <p className="mb-1">
          <strong className="dark:text-slate-300">Auteur:</strong> <span className="dark:text-slate-400">Tim Gerbrands</span> &nbsp;|&nbsp; <strong className="dark:text-slate-300">Laatst bijgewerkt:</strong> <span className="dark:text-slate-400">27 maart 2026</span>
        </p>
        <p>
          <strong className="dark:text-slate-300">Publicatie over De Vertrouwensboom:</strong>{' '}
          <a 
            href="https://e-xamens.nl/februari-2026-01/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
          >
            Examens - Tijdschrift voor de toetspraktijk, feb. 2026
          </a>
        </p>
      </footer>
    </div>
  );
}
