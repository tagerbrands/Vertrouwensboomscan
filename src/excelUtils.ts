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
