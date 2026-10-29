import * as XLSX from 'xlsx';
import { Category } from './data';

export interface ScanActionDetail {
  action?: string;
  who?: string;
  deadline?: string;
}

export interface ExportScanData {
  participantName: string;
  isEnglish: boolean;
  categories: Category[];
  checkedDoeIk: Record<string, boolean>;
  checkedVergtActie: Record<string, boolean>;
  checkedNietNodig: Record<string, boolean>;
  confidence: Record<string, number>;
  comments: Record<string, string>;
  actionDetails: Record<string, ScanActionDetail>;
}

export interface ParticipantScan {
  id: string;
  fileName: string;
  name: string;
  date: string;
  isEnglish: boolean;
  categoryStats: Record<string, {
    inzetPercentage: number;
    inzetCount: number;
    totalActive: number;
    confidenceScore: number; // 1-5
    confidencePercentage: number; // 0-100%
    comment?: string;
  }>;
  instrumentChoices: Record<string, 'DOEN_WE' | 'VERGT_ACTIE' | 'NIET_NODIG' | 'NONE'>;
  actionDetails: Record<string, ScanActionDetail>;
  color: string;
}

const PARTICIPANT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48', // rose
  '#84cc16', // lime
  '#a855f7', // violet
];

export function getParticipantColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}

/**
 * Export a single completed scan to an organized, readable Excel file.
 */
export function exportScanToExcel(data: ExportScanData): void {
  const {
    participantName,
    isEnglish,
    categories,
    checkedDoeIk,
    checkedVergtActie,
    checkedNietNodig,
    confidence,
    comments,
    actionDetails,
  } = data;

  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString();
  const displayDate = new Date().toLocaleString(isEnglish ? 'en-US' : 'nl-NL');

  // Compute summary stats
  const allInstruments = categories.flatMap(c => c.elements.flatMap(e => e.instruments));
  const totalInstruments = allInstruments.length;
  const totalDoeIk = allInstruments.filter(i => checkedDoeIk[i.id]).length;
  const totalVergtActie = allInstruments.filter(i => checkedVergtActie[i.id]).length;
  const totalNietNodig = allInstruments.filter(i => checkedNietNodig[i.id]).length;

  // Sheet 1: Overzicht / Summary
  const overzichtRows: (string | number)[][] = [
    [isEnglish ? "Trust Tree Assurance Analysis" : "De Vertrouwensboom: Borgingsanalyse", ""],
    [isEnglish ? "Respondent / Alias:" : "Respondent / Alias:", participantName || (isEnglish ? "Anonymous" : "Anoniem")],
    [isEnglish ? "Date:" : "Datum:", displayDate],
    [isEnglish ? "Language:" : "Taal:", isEnglish ? "English" : "Nederlands"],
    [],
    [isEnglish ? "OVERALL RESULTS" : "TOTAALOVERZICHT BORGING", ""],
    [isEnglish ? "Total Instruments:" : "Totaal aantal instrumenten:", totalInstruments],
    [isEnglish ? "Deployed ('We do this'):" : "Ingezet ('Doen we'):", totalDoeIk],
    [isEnglish ? "On Agenda ('Requires action'):" : "Op agenda ('Vergt actie'):", totalVergtActie],
    [isEnglish ? "Not needed:" : "Niet nodig:", totalNietNodig],
    [],
    [
      isEnglish ? "Category ID" : "Categorie ID",
      isEnglish ? "Category" : "Categorie",
      isEnglish ? "Use of Instruments (%)" : "Inzet Instrumenten (%)",
      isEnglish ? "Deployed count" : "Aantal ingezet",
      isEnglish ? "Total active" : "Totaal actief",
      isEnglish ? "Trust Score (1-5)" : "Vertrouwen Score (1-5)",
      isEnglish ? "Trust (%)" : "Vertrouwen (%)",
      isEnglish ? "Comments" : "Toelichting / Opmerking",
    ]
  ];

  const categoryStatsJson: Record<string, any> = {};

  categories.forEach(cat => {
    const catInstruments = cat.elements.flatMap(e => e.instruments).filter(i => !checkedNietNodig[i.id]);
    const catTotal = catInstruments.length;
    const catDoeIk = catInstruments.filter(i => checkedDoeIk[i.id]).length;
    const inzetPerc = catTotal > 0 ? Math.round((catDoeIk / catTotal) * 100) : 0;
    const confScore = confidence[cat.id] || 0;
    const confPerc = Math.round((confScore / 5) * 100);
    const comment = comments[cat.id] || "";

    categoryStatsJson[cat.id] = {
      inzetPercentage: inzetPerc,
      inzetCount: catDoeIk,
      totalActive: catTotal,
      confidenceScore: confScore,
      confidencePercentage: confPerc,
      comment,
    };

    overzichtRows.push([
      cat.id,
      cat.name,
      inzetPerc,
      catDoeIk,
      catTotal,
      confScore,
      confPerc,
      comment
    ]);
  });

  const wsOverzicht = XLSX.utils.aoa_to_sheet(overzichtRows);
  // Set column widths
  wsOverzicht['!cols'] = [
    { wch: 24 },
    { wch: 40 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 50 },
  ];

  // Sheet 2: Instrumenten / Instruments detail
  const instrumentRows: (string | number)[][] = [
    [
      isEnglish ? "Category ID" : "Categorie ID",
      isEnglish ? "Category" : "Categorie",
      isEnglish ? "Element" : "Element",
      isEnglish ? "Instrument ID" : "Instrument ID",
      isEnglish ? "Instrument Text" : "Instrument Tekst",
      isEnglish ? "Selection" : "Keuze",
      isEnglish ? "Status Code" : "Status Code",
      isEnglish ? "Action" : "Actie",
      isEnglish ? "Responsible (Who)" : "Wie",
      isEnglish ? "Deadline" : "Deadline",
    ]
  ];

  const instrumentChoicesJson: Record<string, string> = {};

  categories.forEach(cat => {
    cat.elements.forEach(elem => {
      elem.instruments.forEach(inst => {
        let choiceText = isEnglish ? "Not specified" : "Niet ingevuld";
        let statusCode = "NONE";

        if (checkedDoeIk[inst.id]) {
          choiceText = isEnglish ? "We do this" : "Doen we";
          statusCode = "DOEN_WE";
        } else if (checkedVergtActie[inst.id]) {
          choiceText = isEnglish ? "Requires action" : "Vergt actie";
          statusCode = "VERGT_ACTIE";
        } else if (checkedNietNodig[inst.id]) {
          choiceText = isEnglish ? "Not needed" : "Niet nodig";
          statusCode = "NIET_NODIG";
        }

        instrumentChoicesJson[inst.id] = statusCode;
        const details = (actionDetails[inst.id] || {}) as any;
        const who = details.who || details.owner || "";
        const action = details.action || "";
        const deadline = details.deadline || "";

        instrumentRows.push([
          cat.id,
          cat.name,
          elem.name,
          inst.id,
          inst.text,
          choiceText,
          statusCode,
          action,
          who,
          deadline,
        ]);
      });
    });
  });

  const wsInstrumenten = XLSX.utils.aoa_to_sheet(instrumentRows);
  wsInstrumenten['!cols'] = [
    { wch: 22 },
    { wch: 32 },
    { wch: 28 },
    { wch: 14 },
    { wch: 60 },
    { wch: 18 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 18 },
  ];

  // Sheet 3: Raw metadata for 100% loss-less parsing
  const rawExportPayload = {
    appName: "Borgingsanalyse Vertrouwensboom",
    version: "2.0",
    participantName: participantName || (isEnglish ? "Anonymous" : "Anoniem"),
    timestamp,
    isEnglish,
    categoryStats: categoryStatsJson,
    instrumentChoices: instrumentChoicesJson,
    actionDetails,
  };

  const wsRaw = XLSX.utils.aoa_to_sheet([
    ["KEY", "VALUE"],
    ["JSON_DATA", JSON.stringify(rawExportPayload)],
    ["PARTICIPANT", participantName || ""],
    ["TIMESTAMP", timestamp],
    ["TOTAL_DOE_IK", totalDoeIk],
    ["TOTAL_VERGT_ACTIE", totalVergtActie],
    ["TOTAL_NIET_NODIG", totalNietNodig],
  ]);

  XLSX.utils.book_append_sheet(wb, wsOverzicht, isEnglish ? "Summary" : "Overzicht");
  XLSX.utils.book_append_sheet(wb, wsInstrumenten, isEnglish ? "Instruments" : "Instrumenten");
  XLSX.utils.book_append_sheet(wb, wsRaw, "RawData");

  // Format file name
  const safeName = (participantName || (isEnglish ? "Scan" : "Scan"))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Borgingsanalyse_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export interface DetailedReportExcelData {
  participantName: string;
  isEnglish: boolean;
  categories: Category[];
  checkedDoeIk: Record<string, boolean>;
  checkedVergtActie: Record<string, boolean>;
  checkedNietNodig: Record<string, boolean>;
  confidence: Record<string, number>;
  comments: Record<string, string>;
  actionDetails: Record<string, ScanActionDetail>;
  agendaOrder?: string[];
}

/**
 * Export a comprehensive, cleanly styled Excel report that contains the exact same information
 * as the PDF report (Theory & Principles, Overview & Results, Agenda, Points of Attention, Full Checklist).
 */
export function exportDetailedReportToExcel(data: DetailedReportExcelData): void {
  const {
    participantName,
    isEnglish,
    categories,
    checkedDoeIk,
    checkedVergtActie,
    checkedNietNodig,
    confidence,
    comments,
    actionDetails,
    agendaOrder = [],
  } = data;

  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString();
  const displayDate = new Date().toLocaleString(isEnglish ? 'en-US' : 'nl-NL');

  // Overall stats
  const allInstruments = categories.flatMap(c => c.elements.flatMap(e => e.instruments));
  const activeInstruments = allInstruments.filter(i => !checkedNietNodig[i.id]);
  const totalDoeIk = allInstruments.filter(i => checkedDoeIk[i.id]).length;
  const totalVergtActie = allInstruments.filter(i => checkedVergtActie[i.id]).length;
  const totalNietNodig = allInstruments.filter(i => checkedNietNodig[i.id]).length;
  const confScores = categories.map(c => confidence[c.id] || 0);
  const avgConf = confScores.length > 0
    ? (confScores.reduce((a, b) => a + b, 0) / confScores.length).toFixed(1)
    : "0.0";

  // -------------------------------------------------------------
  // Sheet 1: Overzicht & Resultaten / Summary & Results
  // -------------------------------------------------------------
  const summaryRows: (string | number)[][] = [
    [isEnglish ? "THE TRUST TREE: QUALITY ASSURANCE ANALYSIS" : "DE VERTROUWENSBOOM: BORGINGSANALYSE", ""],
    [isEnglish ? "A self-scan of the quality assurance instruments" : "Een zelfscan van het borgende instrumentarium", ""],
    [],
    [isEnglish ? "Respondent / Alias:" : "Respondent / Alias:", participantName || (isEnglish ? "Anonymous" : "Anoniem")],
    [isEnglish ? "Export Date:" : "Datum van export:", displayDate],
    [isEnglish ? "Author:" : "Auteur:", "Tim A. Gerbrands"],
    [isEnglish ? "Publication:" : "Publicatie:", "Examens - Tijdschrift voor de toetspraktijk, feb. 2026"],
    [],
    [isEnglish ? "OVERALL ASSURANCE RESULTS" : "TOTAALOVERZICHT BORGING", ""],
    [isEnglish ? "Total active instruments:" : "Totaal aantal actieve instrumenten:", activeInstruments.length],
    [isEnglish ? "Deployed ('We do this'):" : "Ingezet ('Doen we'):", totalDoeIk],
    [isEnglish ? "On agenda ('Requires action'):" : "Op de agenda ('Vergt actie'):", totalVergtActie],
    [isEnglish ? "Not needed (excluded):" : "Niet nodig (buiten beschouwing):", totalNietNodig],
    [isEnglish ? "Average trust level (1-5):" : "Gemiddelde vertrouwensscore (1-5):", `${avgConf} / 5`],
    [],
    [isEnglish ? "LEVEL OF TRUST AND INSTRUMENT DEPLOYMENT PER CATEGORY" : "BORGINGSGRAAD EN VERTROUWEN PER CATEGORIE", ""],
    [
      isEnglish ? "Category ID" : "Categorie ID",
      isEnglish ? "Category Name" : "Categorie Naam",
      isEnglish ? "Deployment (%)" : "Inzet Instrumenten (%)",
      isEnglish ? "Deployed count" : "Aantal ingezet",
      isEnglish ? "Total active" : "Totaal actief",
      isEnglish ? "Trust Score (1-5)" : "Vertrouwen Score (1-5)",
      isEnglish ? "Trust (%)" : "Vertrouwen (%)",
      isEnglish ? "Zone of Trust" : "Zone van Vertrouwen",
      isEnglish ? "Comments & Explanations" : "Toelichting / Opmerking",
    ]
  ];

  const categoryStatsJson: Record<string, any> = {};

  categories.forEach(cat => {
    const catInstruments = cat.elements.flatMap(e => e.instruments).filter(i => !checkedNietNodig[i.id]);
    const catTotal = catInstruments.length;
    const catDoeIk = catInstruments.filter(i => checkedDoeIk[i.id]).length;
    const inzetPerc = catTotal > 0 ? Math.round((catDoeIk / catTotal) * 100) : 0;
    const confScore = confidence[cat.id] || 0;
    const confPerc = Math.round((confScore / 5) * 100);
    const comment = comments[cat.id] || "";

    let zoneName = "";
    if (inzetPerc >= 50 && confPerc >= 50) {
      zoneName = isEnglish ? "1. In Order (High use, High trust)" : "1. Op orde (Veel inzet, hoog vertrouwen)";
    } else if (inzetPerc < 50 && confPerc >= 50) {
      zoneName = isEnglish ? "2. Blind Spots (Low use, High trust)" : "2. Blinde vlekken (Weinig inzet, hoog vertrouwen)";
    } else if (inzetPerc >= 50 && confPerc < 50) {
      zoneName = isEnglish ? "3. Intervene (High use, Low trust)" : "3. Grijp in (Veel inzet, laag vertrouwen)";
    } else {
      zoneName = isEnglish ? "4. Insufficient (Low use, Low trust)" : "4. Onvoldoende (Weinig inzet, laag vertrouwen)";
    }

    categoryStatsJson[cat.id] = {
      inzetPercentage: inzetPerc,
      inzetCount: catDoeIk,
      totalActive: catTotal,
      confidenceScore: confScore,
      confidencePercentage: confPerc,
      comment,
    };

    summaryRows.push([
      cat.id,
      cat.name,
      `${inzetPerc}%`,
      catDoeIk,
      catTotal,
      confScore,
      `${confPerc}%`,
      zoneName,
      comment
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 22 },
    { wch: 38 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 42 },
    { wch: 55 },
  ];

  // -------------------------------------------------------------
  // Sheet 2: Borgingsagenda / Quality Assurance Agenda
  // -------------------------------------------------------------
  const agendaRows: (string | number)[][] = [
    [isEnglish ? "QUALITY ASSURANCE AGENDA (ACTION REQUIRED)" : "BORGINGSAGENDA (ACTIE VEREIST)", ""],
    [
      isEnglish
        ? "Overview of instruments requiring action, prioritized with assigned owners and deadlines."
        : "Geprioriteerde actielijst van instrumenten waarbij actie vereist is, voorzien van eigenaren en deadlines.",
      ""
    ],
    [],
    [
      isEnglish ? "Priority #" : "Prioriteit #",
      isEnglish ? "Category" : "Categorie",
      isEnglish ? "Element" : "Element",
      isEnglish ? "Instrument ID" : "Instrument ID",
      isEnglish ? "Instrument Description" : "Instrument Tekst",
      isEnglish ? "Responsible Owner" : "Verantwoordelijke (Wie)",
      isEnglish ? "Deadline" : "Deadline",
      isEnglish ? "Action Notes" : "Actie / Notities",
    ]
  ];

  // Compile agenda items
  const agendaItems: Array<{ catName: string; elemName: string; instId: string; instText: string; owner: string; deadline: string; action: string }> = [];
  
  // Follow user order from agendaOrder first, then any other checkedVergtActie
  const addedIds = new Set<string>();
  agendaOrder.forEach(id => {
    if (checkedVergtActie[id]) {
      categories.forEach(cat => {
        cat.elements.forEach(el => {
          const inst = el.instruments.find(i => i.id === id);
          if (inst) {
            const details = (actionDetails[id] || {}) as any;
            agendaItems.push({
              catName: cat.name,
              elemName: el.name,
              instId: inst.id,
              instText: inst.text,
              owner: details.who || details.owner || "",
              deadline: details.deadline || "",
              action: details.action || "",
            });
            addedIds.add(id);
          }
        });
      });
    }
  });

  // Any remaining vergtActie not in agendaOrder
  categories.forEach(cat => {
    cat.elements.forEach(el => {
      el.instruments.forEach(inst => {
        if (checkedVergtActie[inst.id] && !addedIds.has(inst.id)) {
          const details = (actionDetails[inst.id] || {}) as any;
          agendaItems.push({
            catName: cat.name,
            elemName: el.name,
            instId: inst.id,
            instText: inst.text,
            owner: details.who || details.owner || "",
            deadline: details.deadline || "",
            action: details.action || "",
          });
          addedIds.add(inst.id);
        }
      });
    });
  });

  if (agendaItems.length > 0) {
    agendaItems.forEach((item, idx) => {
      agendaRows.push([
        idx + 1,
        item.catName,
        item.elemName,
        item.instId,
        item.instText,
        item.owner,
        item.deadline,
        item.action,
      ]);
    });
  } else {
    agendaRows.push([
      "-",
      isEnglish ? "No action items selected." : "Geen actiepunten geselecteerd.",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);
  }

  const wsAgenda = XLSX.utils.aoa_to_sheet(agendaRows);
  wsAgenda['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 28 },
    { wch: 14 },
    { wch: 65 },
    { wch: 24 },
    { wch: 20 },
    { wch: 35 },
  ];

  // -------------------------------------------------------------
  // Sheet 3: Aandachtspunten / Points of Attention
  // -------------------------------------------------------------
  const attentionRows: (string | number)[][] = [
    [isEnglish ? "POINTS OF ATTENTION (NOT DEPLOYED)" : "AANDACHTSPUNTEN (NIET INGEZET)", ""],
    [
      isEnglish
        ? "Instruments that are currently not deployed and have not been marked as 'not needed'."
        : "Instrumenten die momenteel niet worden ingezet en niet als 'niet nodig' zijn gemarkeerd.",
      ""
    ],
    [],
    [
      isEnglish ? "Nr" : "Nr",
      isEnglish ? "Category" : "Categorie",
      isEnglish ? "Element" : "Element",
      isEnglish ? "Instrument ID" : "Instrument ID",
      isEnglish ? "Instrument Description" : "Instrument Tekst",
    ]
  ];

  const attentionItems: Array<{ catName: string; elemName: string; instId: string; instText: string }> = [];
  categories.forEach(cat => {
    cat.elements.forEach(el => {
      el.instruments.forEach(inst => {
        if (!checkedDoeIk[inst.id] && !checkedNietNodig[inst.id]) {
          attentionItems.push({
            catName: cat.name,
            elemName: el.name,
            instId: inst.id,
            instText: inst.text,
          });
        }
      });
    });
  });

  if (attentionItems.length > 0) {
    attentionItems.forEach((item, idx) => {
      attentionRows.push([
        idx + 1,
        item.catName,
        item.elemName,
        item.instId,
        item.instText,
      ]);
    });
  } else {
    attentionRows.push([
      "-",
      isEnglish ? "No points of attention. You deploy all instruments!" : "Geen aandachtspunten. U zet alle instrumenten in!",
      "",
      "",
      ""
    ]);
  }

  const wsAttention = XLSX.utils.aoa_to_sheet(attentionRows);
  wsAttention['!cols'] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 28 },
    { wch: 14 },
    { wch: 70 },
  ];

  // -------------------------------------------------------------
  // Sheet 4: Volledige Zelfscan / Complete Instrument Checklist
  // -------------------------------------------------------------
  const fullChecklistRows: (string | number)[][] = [
    [isEnglish ? "APPENDIX: COMPLETE SELF-SCAN CHECKLIST" : "BIJLAGE: VOLLEDIGE ZELFSCAN VAN HET INSTRUMENTARIUM", ""],
    [
      isEnglish
        ? "Comprehensive overview of all 7 categories, elements, and individual instrument statuses."
        : "Volledig overzicht van alle 7 categorieën, elementen en de status van elk individueel instrument.",
      ""
    ],
    [],
    [
      isEnglish ? "Category" : "Categorie",
      isEnglish ? "Element" : "Element",
      isEnglish ? "Instrument ID" : "Instrument ID",
      isEnglish ? "Instrument Description" : "Instrument Tekst",
      isEnglish ? "Selected Status" : "Keuze / Status",
      isEnglish ? "Status Code" : "Status Code",
      isEnglish ? "Responsible Owner" : "Verantwoordelijke (Wie)",
      isEnglish ? "Deadline" : "Deadline",
    ]
  ];

  const instrumentChoicesJson: Record<string, string> = {};

  categories.forEach(cat => {
    cat.elements.forEach(elem => {
      elem.instruments.forEach(inst => {
        let choiceText = isEnglish ? "Not specified" : "Niet ingevuld";
        let statusCode = "NONE";

        if (checkedDoeIk[inst.id]) {
          choiceText = isEnglish ? "We do this" : "Doen we";
          statusCode = "DOEN_WE";
        } else if (checkedVergtActie[inst.id]) {
          choiceText = isEnglish ? "Requires action" : "Vergt actie";
          statusCode = "VERGT_ACTIE";
        } else if (checkedNietNodig[inst.id]) {
          choiceText = isEnglish ? "Not needed" : "Niet nodig";
          statusCode = "NIET_NODIG";
        }

        instrumentChoicesJson[inst.id] = statusCode;
        const details = (actionDetails[inst.id] || {}) as any;
        const who = details.who || details.owner || "";
        const deadline = details.deadline || "";

        fullChecklistRows.push([
          cat.name,
          elem.name,
          inst.id,
          inst.text,
          choiceText,
          statusCode,
          who,
          deadline,
        ]);
      });
    });
  });

  const wsFull = XLSX.utils.aoa_to_sheet(fullChecklistRows);
  wsFull['!cols'] = [
    { wch: 30 },
    { wch: 30 },
    { wch: 14 },
    { wch: 65 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
  ];

  // -------------------------------------------------------------
  // Sheet 5: Theorie & Uitgangspunten / Theory & Principles
  // -------------------------------------------------------------
  const theoryRows: (string | number)[][] = [
    [isEnglish ? "THE TRUST TREE: PRINCIPLES AND FRAMEWORK" : "DE VERTROUWENSBOOM: UITGANGSPUNTEN EN BEGRIPPENKADER", ""],
    [],
    [
      isEnglish ? "Core Principles:" : "Uitgangspunten:",
      isEnglish
        ? "The Trust Tree offers Examination Boards a specific and practical overview of assurance instruments for programmatic assessment. It aims to provide inspiration in selecting instruments to achieve an objective representation of the qualities of the educational and assessment system."
        : "De Vertrouwensboom biedt Examencommissies een specifiek en praktisch overzicht van borgingsinstrumenten voor programmatisch toetsen. Het document beoogt examencommissies te voorzien van inspiratie bij de selectie van instrumenten om te komen tot een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem. Het helpt grip te houden op kwaliteit, bijsturing te onderbouwen en het verlenen van een graad te onderschrijven."
    ],
    [],
    [
      isEnglish ? "Definition of Assurance:" : "Wat is Borging (WHW context)?:",
      isEnglish
        ? "Assurance is the objective and systematic recording and demonstrable monitoring of the quality of assessment through measures and procedures."
        : "Borgen is het objectief en systematisch vastleggen en aantoonbaar bewaken van de kwaliteit van toetsing door middel van maatregelen en procedures."
    ],
    [
      isEnglish ? "When is Assurance Successful?:" : "Wanneer is Borging succesvol?:",
      isEnglish
        ? "Assurance is successful when the systematic measurement of assessment quality leads to the necessary confidence within the examination board to endorse conferring a degree."
        : "Borging is succesvol als systematische meting van de kwaliteit van toetsing leidt tot het benodigde vertrouwen binnen de examencommissie om het verlenen van een graad te onderschrijven."
    ],
    [
      isEnglish ? "Role of Assurance Instruments:" : "Rol van borgende instrumenten:",
      isEnglish
        ? "Assurance instruments provide an objective representation of the qualities of the educational and assessment system, enabling the examination board to form a reasoned judgment regarding its trust in this system."
        : "Borgende instrumenten bieden een objectieve weergave van de kwaliteiten van het onderwijs- en toetssysteem, zodat de examencommissie een beredeneerd oordeel kan vormen over haar vertrouwen in dit systeem."
    ],
    [],
    [isEnglish ? "THE 4 ZONES OF TRUST (INTERPRETATION MATRIX)" : "DE 4 ZONES VAN VERTROUWEN (INTERPRETATIEMATRIX)", ""],
    [
      isEnglish ? "Zone" : "Zone",
      isEnglish ? "Characteristics" : "Kenmerken",
      isEnglish ? "Description & Strategic Advice" : "Beschrijving en handelingsperspectief",
    ],
    [
      isEnglish ? "1. In Order" : "1. Op orde",
      isEnglish ? "High use (>=50%), High trust (>=50%)" : "Hoge inzet (>=50%), Hoog vertrouwen (>=50%)",
      isEnglish ? "High degree of well-founded confidence. Keep evaluating the toolkit." : "Hoge mate van gefundeerd vertrouwen. Evalueer het instrumentarium doorlopend."
    ],
    [
      isEnglish ? "2. Blind Spots" : "2. Blinde vlekken",
      isEnglish ? "Low use (<50%), High trust (>=50%)" : "Lage inzet (<50%), Hoog vertrouwen (>=50%)",
      isEnglish ? "High risk of misplaced confidence. Better substantiate trust via measurements." : "Hoog risico op ongefundeerd vertrouwen. Onderbouw het vertrouwen beter."
    ],
    [
      isEnglish ? "3. Intervene" : "3. Grijp in",
      isEnglish ? "High use (>=50%), Low trust (<50%)" : "Hoge inzet (>=50%), Laag vertrouwen (<50%)",
      isEnglish ? "Substantiated assurance is at stake. Restore confidence; consider interventions." : "Borging gefundeerd in het geding. Herstel vertrouwen; evt. via ingrijpen."
    ],
    [
      isEnglish ? "4. Insufficient" : "4. Onvoldoende",
      isEnglish ? "Low use (<50%), Low trust (<50%)" : "Lage inzet (<50%), Laag vertrouwen (<50%)",
      isEnglish ? "Insufficient control over assurance. Improve the toolkit to increase trust." : "Onvoldoende grip op borging. Verbeter instrumenten t.b.v. vertrouwen."
    ],
  ];

  const wsTheory = XLSX.utils.aoa_to_sheet(theoryRows);
  wsTheory['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 85 },
  ];

  // -------------------------------------------------------------
  // Sheet 6: RawData (Enables lossless compatibility with Group Analysis)
  // -------------------------------------------------------------
  const rawExportPayload = {
    appName: "Borgingsanalyse Vertrouwensboom",
    version: "2.0",
    participantName: participantName || (isEnglish ? "Anonymous" : "Anoniem"),
    timestamp,
    isEnglish,
    categoryStats: categoryStatsJson,
    instrumentChoices: instrumentChoicesJson,
    actionDetails,
  };

  const wsRaw = XLSX.utils.aoa_to_sheet([
    ["KEY", "VALUE"],
    ["JSON_DATA", JSON.stringify(rawExportPayload)],
    ["PARTICIPANT", participantName || ""],
    ["TIMESTAMP", timestamp],
    ["TOTAL_DOE_IK", totalDoeIk],
    ["TOTAL_VERGT_ACTIE", totalVergtActie],
    ["TOTAL_NIET_NODIG", totalNietNodig],
  ]);

  // Append all sheets
  XLSX.utils.book_append_sheet(wb, wsSummary, isEnglish ? "Summary & Results" : "Overzicht & Resultaten");
  XLSX.utils.book_append_sheet(wb, wsAgenda, isEnglish ? "Quality Agenda" : "Borgingsagenda");
  XLSX.utils.book_append_sheet(wb, wsAttention, isEnglish ? "Attention Points" : "Aandachtspunten");
  XLSX.utils.book_append_sheet(wb, wsFull, isEnglish ? "Full Checklist" : "Volledige Zelfscan");
  XLSX.utils.book_append_sheet(wb, wsTheory, isEnglish ? "Theory & Principles" : "Uitgangspunten");
  XLSX.utils.book_append_sheet(wb, wsRaw, "RawData");

  // Format file name
  const safeName = (participantName || (isEnglish ? "Report" : "Rapport"))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = isEnglish ? `TrustTree_Report_${safeName}_${dateStr}.xlsx` : `Borgingsrapport_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Parses an uploaded .xlsx file into ParticipantScan format.
 */
export async function parseExcelScan(file: File, index: number): Promise<ParticipantScan> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  let participantName = file.name.replace(/\.[^/.]+$/, "").replace(/^Borgingsanalyse_/, "");
  let isEnglish = false;
  let categoryStats: ParticipantScan['categoryStats'] = {};
  let instrumentChoices: ParticipantScan['instrumentChoices'] = {};
  let actionDetails: ParticipantScan['actionDetails'] = {};
  let date = new Date(file.lastModified).toISOString().slice(0, 10);

  // 1. Check if RawData sheet exists (produced by this app)
  if (wb.SheetNames.includes("RawData")) {
    const rawSheet = wb.Sheets["RawData"];
    const rows: any[][] = XLSX.utils.sheet_to_json(rawSheet, { header: 1 });
    const jsonRow = rows.find(r => r[0] === "JSON_DATA");
    if (jsonRow && jsonRow[1]) {
      try {
        const parsed = JSON.parse(jsonRow[1]);
        if (parsed.participantName) participantName = parsed.participantName;
        if (parsed.isEnglish !== undefined) isEnglish = parsed.isEnglish;
        if (parsed.categoryStats) categoryStats = parsed.categoryStats;
        if (parsed.instrumentChoices) instrumentChoices = parsed.instrumentChoices;
        if (parsed.actionDetails) actionDetails = parsed.actionDetails;
        if (parsed.timestamp) date = parsed.timestamp.slice(0, 10);

        return {
          id: `${file.name}-${Date.now()}-${index}`,
          fileName: file.name,
          name: participantName,
          date,
          isEnglish,
          categoryStats,
          instrumentChoices,
          actionDetails,
          color: getParticipantColor(index),
        };
      } catch (err) {
        console.warn("Failed to parse RawData JSON from Excel", err);
      }
    }
  }

  // 2. Fallback: Parse Sheet "Overzicht" / "Summary" and "Instrumenten" / "Instruments"
  const overzichtSheet = wb.Sheets["Overzicht"] || wb.Sheets["Summary"] || wb.Sheets[wb.SheetNames[0]];
  if (overzichtSheet) {
    const rows: any[][] = XLSX.utils.sheet_to_json(overzichtSheet, { header: 1 });
    // Try to find participant name
    for (const r of rows) {
      if (r[0] && typeof r[0] === 'string') {
        const text = r[0].toLowerCase();
        if (text.includes("respondent") || text.includes("alias") || text.includes("naam")) {
          if (r[1]) participantName = String(r[1]).trim();
        }
      }
    }

    // Look for category rows (columns: ID, Name, inzet%, inzetCount, totalActive, confScore, conf%)
    const categoryIds = [
      "luk-kwaliteit",
      "portfoliocriteria",
      "kaders-procedures",
      "besluitvorming",
      "deskundigheid",
      "systemen",
      "fraudebeleid",
    ];

    for (const r of rows) {
      if (!r || !r[0]) continue;
      const firstCell = String(r[0]).trim();
      const matchedCat = categoryIds.find(cid => cid === firstCell);
      if (matchedCat) {
        categoryStats[matchedCat] = {
          inzetPercentage: Number(r[2]) || 0,
          inzetCount: Number(r[3]) || 0,
          totalActive: Number(r[4]) || 0,
          confidenceScore: Number(r[5]) || 0,
          confidencePercentage: Number(r[6]) || (Number(r[5]) ? Math.round((Number(r[5]) / 5) * 100) : 0),
          comment: r[7] ? String(r[7]) : "",
        };
      }
    }
  }

  // Parse Instruments sheet
  const instSheet = wb.Sheets["Instrumenten"] || wb.Sheets["Instruments"] || (wb.SheetNames.length > 1 ? wb.Sheets[wb.SheetNames[1]] : null);
  if (instSheet) {
    const rows: any[][] = XLSX.utils.sheet_to_json(instSheet, { header: 1 });
    // Find rows with instrument ID like 'i1'..'i35'
    for (const r of rows) {
      if (!r) continue;
      // Instrument ID might be at column 3 (index 3) or somewhere in row
      const instIdCell = r.find((cell: any) => typeof cell === 'string' && /^i\d+$/.test(cell.trim()));
      if (instIdCell) {
        const id = String(instIdCell).trim();
        // Look for status code or selection
        let status: 'DOEN_WE' | 'VERGT_ACTIE' | 'NIET_NODIG' | 'NONE' = 'NONE';
        const rowStr = r.map(c => String(c).toLowerCase()).join(" ");
        if (rowStr.includes("doen_we") || rowStr.includes("doen we") || rowStr.includes("we do this")) {
          status = 'DOEN_WE';
        } else if (rowStr.includes("vergt_actie") || rowStr.includes("vergt actie") || rowStr.includes("requires action")) {
          status = 'VERGT_ACTIE';
        } else if (rowStr.includes("niet_nodig") || rowStr.includes("niet nodig") || rowStr.includes("not needed")) {
          status = 'NIET_NODIG';
        }
        instrumentChoices[id] = status;

        // Action details if present
        if (r[7] || r[8] || r[9]) {
          actionDetails[id] = {
            action: r[7] ? String(r[7]) : undefined,
            who: r[8] ? String(r[8]) : undefined,
            deadline: r[9] ? String(r[9]) : undefined,
          };
        }
      }
    }
  }

  return {
    id: `${file.name}-${Date.now()}-${index}`,
    fileName: file.name,
    name: participantName,
    date,
    isEnglish,
    categoryStats,
    instrumentChoices,
    actionDetails,
    color: getParticipantColor(index),
  };
}
