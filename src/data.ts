export interface Instrument {
  id: string;
  text: string;
}

export interface Element {
  name: string;
  description: string;
  instruments: Instrument[];
}

export interface Category {
  id: string;
  name: string;
  colorClass: string;
  containerColorClass: string;
  textColorClass: string;
  borderColorClass: string;
  elements: Element[];
}

export const categories: Category[] = [
  {
    id: "luk-kwaliteit",
    name: "LUK-kwaliteit",
    colorClass: "bg-rose-50 dark:bg-rose-900/40",
    containerColorClass: "bg-rose-50/30 dark:bg-rose-900/10",
    textColorClass: "text-rose-700 dark:text-rose-300",
    borderColorClass: "border-rose-200 dark:border-rose-800/50",
    elements: [
      {
        name: "Formulering",
        description: "Heldere, toetsbare formuleringen van LUKs die zijn afgestemd op het juiste niveau binnen het curriculum. Rubrics maken criteria evt. concreet en meetbaar.",
        instruments: [
          { id: "i1", text: "Valideer of (doorontwikkelingen van) de LUKs voldoen aan de geldende NVAO kwaliteitseisen: tuning, niveau, taxonomie." }
        ]
      },
      {
        name: "BOKS(AE)",
        description: "Body of Knowledge, Skills (and Attitude & Ethics), geformuleerd a.d.h.v. het beroepscompetentieprofiel.",
        instruments: [
          { id: "i2", text: "Toets of de LUKs de BOKS(AE) aantoonbaar dekken en of de relatie begrijpelijk is opgenomen in de Zelfevaluatie en Reflectie (ZER) t.b.v. accreditatie." }
        ]
      }
    ]
  },
  {
    id: "portfoliocriteria",
    name: "Portfoliocriteria",
    colorClass: "bg-orange-50 dark:bg-orange-900/40",
    containerColorClass: "bg-orange-50/30 dark:bg-orange-900/10",
    textColorClass: "text-orange-700 dark:text-orange-300",
    borderColorClass: "border-orange-200 dark:border-orange-800/50",
    elements: [
      {
        name: "Ontvankelijkheidscriteria",
        description: "Vastleggen van vereisten die niet onder de LUKs vallen, maar wel noodzaak zijn om juiste beslissingen te nemen.",
        instruments: [
          { id: "i3", text: "Evalueer deze criteria periodiek om vast te stellen dat ze 1) noodzakelijk zijn, 2) niet leiden tot overmatige belasting van studenten, 3) samenhang vertonen met de LUKs en 4) bijdragen aan de kwaliteit van beslissingen." }
        ]
      },
      {
        name: "VRAAKKT",
        description: "Duidelijke afspraken over de toepassing van de VRAAKKT criteria.",
        instruments: [
          { id: "i4", text: "Beoordeel of toetsinstructies omtrent de toepassing van VRAAKKT criteria van voldoende kwaliteit zijn." },
          { id: "i5", text: "Verifieer of VRAAKKT criteria zuiver in de beslisprocedure zijn geïntegreerd." }
        ]
      },
      {
        name: "Verplichte bewijsmaterialen",
        description: "Vastgelegde bewijsmaterialen die een vaste basis vormen voor beoordeling, met invloed op o.a. kwaliteit van scaffolding, kalibratie, feedbackprocessen en beslissingen.",
        instruments: [
          { id: "i6", text: "Analyseer het ontwerp i.r.t. toetsbeleid, didactische visie en kwaliteitscriteria systematisch en observeer het effect op de beslissing (risico op 'afvinken' kan de holistische aard verstoren)." },
          { id: "i7", text: "Evalueer hoe studenten worden geïnformeerd over de invloed van verplichte bewijsmaterialen op beslissingen." }
        ]
      }
    ]
  },
  {
    id: "kaders-procedures",
    name: "Kaders & procedures",
    colorClass: "bg-amber-50 dark:bg-amber-900/40",
    containerColorClass: "bg-amber-50/30 dark:bg-amber-900/10",
    textColorClass: "text-amber-700 dark:text-amber-300",
    borderColorClass: "border-amber-200 dark:border-amber-800/50",
    elements: [
      {
        name: "Bewijsmateriaal (Low stake)",
        description: "Integratie van bewijsmaterialen en bijbehorende feedback in het onderwijsontwerp, conform de principes van constructive alignment.",
        instruments: [
          { id: "i8", text: "Stel vast dat bewijsmaterialen zijn ontworpen in relatie tot kwaliteitscriteria, hoe ze worden verzameld en hoe daarop feedback wordt gegenereerd en vastgelegd." },
          { id: "i9", text: "Zie periodiek en steekproefsgewijs toe op de uitvoer van de vastgestelde low stake-procedures." }
        ]
      },
      {
        name: "Eerder verworven bewijs (EVB)",
        description: "Richtlijnen voor de omgang met bewijsmaterialen die buiten het toezicht van de opleiding tot stand zijn gekomen.",
        instruments: [
          { id: "i10", text: "Toets of de EVB procedure de kwaliteit en authenticiteit van extern bewijsmateriaal waarborgt." },
          { id: "i11", text: "Zie periodiek en steekproefsgewijs toe op de uitvoer van de vastgestelde EVB-procedures." }
        ]
      },
      {
        name: "Tussentijdse evaluatie (Medium stake)",
        description: "Feedbackmomenten die halverwege het leertraject inzicht geven in de voortgang richting de LUKs. Hierbij wordt het portfolio holistisch bekeken.",
        instruments: [
          { id: "i12", text: "Verifieer of de status van deze beoordeling in relatie tot de beslissing transparant is voor alle actoren." },
          { id: "i13", text: "Valideer of beoordelingscriteria in relatie tot het holistische oordeel transparant zijn voor alle actoren." },
          { id: "i14", text: "Zie periodiek en steekproefsgewijs toe op de uitvoer van de vastgestelde medium stake-procedures." }
        ]
      },
      {
        name: "Beslissing (High stake)",
        description: "Het uiteindelijke besluitvormingsproces waarbij wordt vastgesteld of een student voldoet aan de toetscriteria.",
        instruments: [
          { id: "i15", text: "Toets of de beslisprocedure grip geeft op de rolverdeling, mate van (on)afhankelijkheid van beoordelaars en toepassing van vierogenbeleid." },
          { id: "i16", text: "Beoordeel of de beslisprocedure aan alle eisen voldoet (conform OER, examinatorhandelingen, remediëring, enz.)." },
          { id: "i17", text: "Beoordeel of toetsinstructies en evt. rubrics van voldoende kwaliteit zijn." },
          { id: "i18", text: "Zie periodiek en steekproefsgewijs toe op de uitvoer van de vastgestelde high stake-procedures." }
        ]
      }
    ]
  },
  {
    id: "organisatie",
    name: "Organisatie",
    colorClass: "bg-emerald-50 dark:bg-emerald-900/40",
    containerColorClass: "bg-emerald-50/30 dark:bg-emerald-900/10",
    textColorClass: "text-emerald-700 dark:text-emerald-300",
    borderColorClass: "border-emerald-200 dark:border-emerald-800/50",
    elements: [
      {
        name: "Governance",
        description: "De verdeling van rollen, taken en verantwoordelijkheden binnen het onderwijs- en toetssysteem.",
        instruments: [
          { id: "i19", text: "Analyseer systematisch of taken en verantwoordelijkheden bij de juiste rollen zijn belegd, inzichtelijk is hoe rollen samenwerken en zich tot elkaar verhouden, met welk mandaat ze opereren en of facilitering adequaat is." },
          { id: "i20", text: "Evalueer periodiek of de actoren rolvast handelen conform hun verantwoordelijkheden." }
        ]
      }
    ]
  },
  {
    id: "profiel-examinatoren",
    name: "Profiel examinatoren",
    colorClass: "bg-blue-50 dark:bg-blue-900/40",
    containerColorClass: "bg-blue-50/30 dark:bg-blue-900/10",
    textColorClass: "text-blue-700 dark:text-blue-300",
    borderColorClass: "border-blue-200 dark:border-blue-800/50",
    elements: [
      {
        name: "Certificering",
        description: "Examinatoren moeten beschikken over de juiste kwalificaties (bijvoorbeeld BKE, master) die passen bij de toetsingstaak.",
        instruments: [
          { id: "i21", text: "Verifieer periodiek of certificering passend en actueel is in relatie tot de taak (bijv. via HR systemen)." }
        ]
      },
      {
        name: "Professionalisering",
        description: "Structurele bijscholing, trainingen en intervisie om de deskundigheid en integriteit van examinatoren te borgen.",
        instruments: [
          { id: "i22", text: "Stel eisen aan structurele professionalisering, monitor intervisie en trainingsdeelname, beoordeel facilitering." },
          { id: "i23", text: "Zie toe op structurele roostering en aanwezigheid van kalibratiesessies." }
        ]
      },
      {
        name: "Kalibratie",
        description: "Structurele kalibratiesessies om de interpretatie van LUKs en verwachtingen t.a.v. ontvankelijkheidscriteria eenduidig te maken en zo tot consistente besluitvorming te komen.",
        instruments: [
          { id: "i24", text: "Zie steekproefsgewijs toe op de uitvoer van de kalibratieprocedure, incl. de kwaliteit en toepassing van ondersteunende middelen (zoals een handreiking)." },
          { id: "i25", text: "Beoordeel of verslaglegging en communicatie over bereikte consensus van voldoende kwaliteit is." },
          { id: "i26", text: "Verifieer de kwaliteit van kalibratie via steekproefsgewijze herbeoordelingen." }
        ]
      },
      {
        name: "Feedbackgeletterdheid",
        description: "Examinatoren moeten in staat zijn om zowel de inhoud als de kwaliteit van feedback te interpreteren (feedback duiden) en helder, onderbouwd feedback te geven.",
        instruments: [
          { id: "i27", text: "Valideer de kwaliteit en toepassing van ondersteunende middelen (zoals een handreiking)." },
          { id: "i28", text: "Analyseer de kwaliteit van feedback geven systematisch, bijv. via een analyse op de toepassing van feedbackmodellen, examinator- en studentevaluaties, en verzoeken tot herbeoordeling waar feedbackkwaliteit in het geding is." },
          { id: "i29", text: "Toets de kwaliteit van feedback duiden, bijv. via de inzet van herbeoordelingen op risicovolle eindwerken." }
        ]
      }
    ]
  },
  {
    id: "digitale-systemen",
    name: "Digitale systemen",
    colorClass: "bg-purple-50 dark:bg-purple-900/40",
    containerColorClass: "bg-purple-50/30 dark:bg-purple-900/10",
    textColorClass: "text-purple-700 dark:text-purple-300",
    borderColorClass: "border-purple-200 dark:border-purple-800/50",
    elements: [
      {
        name: "Authenticiteitscheck",
        description: "Digitale systemen moeten een robuuste check op de authenticiteit van bewijsmaterialen en feedback mogelijk maken.",
        instruments: [
          { id: "i30", text: "Evalueer periodiek of procedures voor documentatie van bewijsmaterialen en feedback mogelijk zijn (in relatie tot toepassing van VRAAKKT criteria, koppeling van bewijsmaterialen aan feedback, enz.)." }
        ]
      },
      {
        name: "Externe validering",
        description: "Mogelijkheid voor externe experts om de toetskwaliteit te beoordelen en een onafhankelijke kwaliteitscheck te doen, ook na uitschrijving van de student.",
        instruments: [
          { id: "i31", text: "Analyseer systematisch of externe validatie van portfolio's is ingericht, met aandacht voor privacy en (data)veiligheid." }
        ]
      }
    ]
  },
  {
    id: "fraudebeleid",
    name: "Fraudebeleid",
    colorClass: "bg-fuchsia-50 dark:bg-fuchsia-900/40",
    containerColorClass: "bg-fuchsia-50/30 dark:bg-fuchsia-900/10",
    textColorClass: "text-fuchsia-700 dark:text-fuchsia-300",
    borderColorClass: "border-fuchsia-200 dark:border-fuchsia-800/50",
    elements: [
      {
        name: "Informeren, Preventie & Melden",
        description: "Integraal fraudebeleid gericht op voorkomen en vroegtijdig signaleren van fraude door betrokkenen te informeren, incentives te vermijden en detectie inzetten ter bijsturing i.p.v. bestraffing.",
        instruments: [
          { id: "i32", text: "Beoordeel hoe fraudepreventie en informatievoorziening terugkerend zijn geïntegreerd in het curriculum." },
          { id: "i33", text: "Instrueer relevante actoren periodiek over de procedure voor het melden van een vermoeden van fraude." }
        ]
      },
      {
        name: "Onderzoek & Sanctioneren",
        description: "Na een melding van fraude start een onderzoek dat pedagogisch is ingericht, met als doel het leerproces van de student te ondersteunen in plaats van te straffen.",
        instruments: [
          { id: "i34", text: "Ontwerp en implementeer een methodiek voor fraudeonderzoek die recht doet aan haar doel en evalueer deze periodiek." },
          { id: "i35", text: "Leg een sanctieladder transparant vast, en sanctioneer a.d.h.v. een heldere contextschets en onderbouwing." }
        ]
      }
    ]
  }
];
