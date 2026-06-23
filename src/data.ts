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

export const categoriesNl: Category[] = [
  {
    id: "luk-kwaliteit",
    name: "Kwaliteit van Leeruitkomsten (LUK)",
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
        name: "Onderzoek & Maatregelen",
        description: "Na een melding van fraude start een onderzoek dat pedagogisch is ingericht, met als doel het leerproces van de student te ondersteunen in plaats van te straffen.",
        instruments: [
          { id: "i34", text: "Ontwerp en implementeer een methodiek voor fraudeonderzoek die recht doet aan haar doel en evalueer deze periodiek." },
          { id: "i35", text: "Leg een maatregelenladder transparant vast, en neem maatregelen a.d.h.v. een heldere contextschets en onderbouwing." }
        ]
      }
    ]
  }
];

export const categoriesEn: Category[] = [
  {
    id: "luk-kwaliteit",
    name: "Quality of Learning Outcomes (LOU)",
    colorClass: "bg-rose-50 dark:bg-rose-900/40",
    containerColorClass: "bg-rose-50/30 dark:bg-rose-900/10",
    textColorClass: "text-rose-700 dark:text-rose-300",
    borderColorClass: "border-rose-200 dark:border-rose-800/50",
    elements: [
      {
        name: "Formulation",
        description: "Clear, testable formulations of LOUs aligned with the appropriate level within the curriculum. Rubrics make criteria concrete and measurable.",
        instruments: [
          { id: "i1", text: "Validate whether (developments of) the LOUs meet the applicable NVAO quality requirements: tuning, level, taxonomy." }
        ]
      },
      {
        name: "BOKS(AE)",
        description: "Body of Knowledge, Skills (and Attitude & Ethics), formulated based on the professional competency profile.",
        instruments: [
          { id: "i2", text: "Test whether the LOUs demonstrably cover the BOKS(AE) and if the relationship is comprehensively included in the Self-evaluation and Reflection (ZER) for accreditation." }
        ]
      }
    ]
  },
  {
    id: "portfoliocriteria",
    name: "Portfolio Criteria",
    colorClass: "bg-orange-50 dark:bg-orange-900/40",
    containerColorClass: "bg-orange-50/30 dark:bg-orange-900/10",
    textColorClass: "text-orange-700 dark:text-orange-300",
    borderColorClass: "border-orange-200 dark:border-orange-800/50",
    elements: [
      {
        name: "Admissibility Criteria",
        description: "Establishing requirements that do not fall under the LOUs, but are necessary to make correct decisions.",
        instruments: [
          { id: "i3", text: "Evaluate these criteria periodically to determine that they are 1) necessary, 2) do not lead to excessive burden on students, 3) are coherent with the LOUs and 4) contribute to the quality of decisions." }
        ]
      },
      {
        name: "VRAAQQT",
        description: "Clear agreements about the application of the VRAAQQT criteria.",
        instruments: [
          { id: "i4", text: "Assess whether testing instructions regarding the application of VRAAQQT criteria are of sufficient quality." },
          { id: "i5", text: "Verify whether VRAAQQT criteria are purely integrated into the decision procedure." }
        ]
      },
      {
        name: "Mandatory Evidence",
        description: "Established evidence that forms a solid basis for assessment, influencing the quality of scaffolding, calibration, feedback processes, and decisions, among others.",
        instruments: [
          { id: "i6", text: "Analyze the design systematically in relation to assessment policy, didactic vision, and quality criteria, and observe the effect on the decision (risk of 'ticking the box' can disrupt the holistic nature)." },
          { id: "i7", text: "Evaluate how students are informed about the influence of mandatory evidence on decisions." }
        ]
      }
    ]
  },
  {
    id: "kaders-procedures",
    name: "Frameworks & Procedures",
    colorClass: "bg-amber-50 dark:bg-amber-900/40",
    containerColorClass: "bg-amber-50/30 dark:bg-amber-900/10",
    textColorClass: "text-amber-700 dark:text-amber-300",
    borderColorClass: "border-amber-200 dark:border-amber-800/50",
    elements: [
      {
        name: "Evidence (Low stake)",
        description: "Integration of evidence and related feedback into the educational design, according to the principles of constructive alignment.",
        instruments: [
          { id: "i8", text: "Establish that evidence is designed in relation to quality criteria, how it is collected, and how feedback on it is generated and recorded." },
          { id: "i9", text: "Periodically and selectively oversee the execution of established low-stake procedures." }
        ]
      },
      {
        name: "Prior Acquired Evidence (EVB)",
        description: "Guidelines for handling evidence generated outside the direct supervision of the program.",
        instruments: [
          { id: "i10", text: "Test whether the EVB procedure guarantees the quality and authenticity of external evidence." },
          { id: "i11", text: "Periodically and selectively oversee the execution of established EVB procedures." }
        ]
      },
      {
        name: "Interim Evaluation (Medium stake)",
        description: "Feedback moments halfway through the learning trajectory that provide insight into progress towards the LOUs. The portfolio is viewed holistically.",
        instruments: [
          { id: "i12", text: "Verify whether the status of this assessment in relation to the decision is transparent to all actors." },
          { id: "i13", text: "Validate whether assessment criteria in relation to the holistic judgment are transparent to all actors." },
          { id: "i14", text: "Periodically and selectively oversee the execution of established medium-stake procedures." }
        ]
      },
      {
        name: "Decision (High stake)",
        description: "The final decision-making process determining whether a student meets the assessment criteria.",
        instruments: [
          { id: "i15", text: "Test whether the decision procedure provides a grip on role division, the degree of (in)dependence of assessors, and the application of the four-eyes principle." },
          { id: "i16", text: "Assess whether the decision procedure meets all requirements (in accordance with OER, examiner actions, remediation, etc.)." },
          { id: "i17", text: "Assess whether testing instructions and any rubrics are of sufficient quality." },
          { id: "i18", text: "Periodically and selectively oversee the execution of established high-stake procedures." }
        ]
      }
    ]
  },
  {
    id: "organisatie",
    name: "Organization",
    colorClass: "bg-emerald-50 dark:bg-emerald-900/40",
    containerColorClass: "bg-emerald-50/30 dark:bg-emerald-900/10",
    textColorClass: "text-emerald-700 dark:text-emerald-300",
    borderColorClass: "border-emerald-200 dark:border-emerald-800/50",
    elements: [
      {
        name: "Governance",
        description: "The distribution of roles, tasks, and responsibilities within the education and assessment system.",
        instruments: [
          { id: "i19", text: "Systematically analyze whether tasks and responsibilities are assigned to the right roles, whether it is clear how roles collaborate and relate to each other, with what mandate they operate, and whether facilitation is adequate." },
          { id: "i20", text: "Periodically evaluate whether actors consistently act according to their responsibilities." }
        ]
      }
    ]
  },
  {
    id: "profiel-examinatoren",
    name: "Examiner Profile",
    colorClass: "bg-blue-50 dark:bg-blue-900/40",
    containerColorClass: "bg-blue-50/30 dark:bg-blue-900/10",
    textColorClass: "text-blue-700 dark:text-blue-300",
    borderColorClass: "border-blue-200 dark:border-blue-800/50",
    elements: [
      {
        name: "Certification",
        description: "Examiners must possess the correct qualifications (e.g., BKE, master's) matching the assessment task.",
        instruments: [
          { id: "i21", text: "Periodically verify whether certification is appropriate and up-to-date concerning the task (e.g., via HR systems)." }
        ]
      },
      {
        name: "Professionalization",
        description: "Structural further education, training, and intervision to guarantee the expertise and integrity of examiners.",
        instruments: [
          { id: "i22", text: "Set requirements for structural professionalization, monitor intervision and training attendance, assess facilitation." },
          { id: "i23", text: "Oversee structural scheduling and attendance of calibration sessions." }
        ]
      },
      {
        name: "Calibration",
        description: "Structural calibration sessions to standardize the interpretation of LOUs and expectations regarding admissibility criteria, leading to consistent decision-making.",
        instruments: [
          { id: "i24", text: "Selectively oversee the execution of the calibration procedure, inc. the quality and application of supporting materials (like a guide)." },
          { id: "i25", text: "Assess whether documentation and communication about the achieved consensus are of sufficient quality." },
          { id: "i26", text: "Verify the quality of calibration via selective re-assessments." }
        ]
      },
      {
        name: "Feedback Literacy",
        description: "Examiners must be able to interpret both the content and quality of feedback (interpreting feedback) and provide clear, substantiated feedback.",
        instruments: [
          { id: "i27", text: "Validate the quality and application of supporting materials (such as a guide)." },
          { id: "i28", text: "Systematically analyze the quality of providing feedback, e.g., via an analysis of the application of feedback models, examiner and student evaluations, and requests for reassessment where feedback quality is at issue." },
          { id: "i29", text: "Test the quality of interpreting feedback, e.g., via the use of reassessments on high-risk final works." }
        ]
      }
    ]
  },
  {
    id: "digitale-systemen",
    name: "Digital Systems",
    colorClass: "bg-purple-50 dark:bg-purple-900/40",
    containerColorClass: "bg-purple-50/30 dark:bg-purple-900/10",
    textColorClass: "text-purple-700 dark:text-purple-300",
    borderColorClass: "border-purple-200 dark:border-purple-800/50",
    elements: [
      {
        name: "Authenticity Check",
        description: "Digital systems must allow for a robust check on the authenticity of evidence and feedback.",
        instruments: [
          { id: "i30", text: "Periodically evaluate whether procedures for documentation of evidence and feedback are possible (in relation to the application of VRAAQQT criteria, linking evidence to feedback, etc.)." }
        ]
      },
      {
        name: "External Validation",
        description: "Possibility for external experts to assess the quality of testing and perform an independent quality check, even after the student's deregistration.",
        instruments: [
          { id: "i31", text: "Systematically analyze whether external validation of portfolios is set up, with attention to privacy and data security." }
        ]
      }
    ]
  },
  {
    id: "fraudebeleid",
    name: "Fraud Policy",
    colorClass: "bg-fuchsia-50 dark:bg-fuchsia-900/40",
    containerColorClass: "bg-fuchsia-50/30 dark:bg-fuchsia-900/10",
    textColorClass: "text-fuchsia-700 dark:text-fuchsia-300",
    borderColorClass: "border-fuchsia-200 dark:border-fuchsia-800/50",
    elements: [
      {
        name: "Information, Prevention & Reporting",
        description: "Integral fraud policy aimed at preventing and early signaling of fraud by informing those involved, avoiding incentives, and utilizing detection for guidance rather than punishment.",
        instruments: [
          { id: "i32", text: "Assess how fraud prevention and information provision are structurally integrated into the curriculum." },
          { id: "i33", text: "Periodically instruct relevant actors about the procedure for reporting suspected fraud." }
        ]
      },
      {
        name: "Investigation & Measures",
        description: "After a fraud report, an investigation is initiated that is pedagogically structured, aiming to support the student's learning process rather than to punish.",
        instruments: [
          { id: "i34", text: "Design and implement a methodology for fraud investigation that serves its purpose, and evaluate this periodically." },
          { id: "i35", text: "Transparently record a measures ladder, and take measures based on a clear contextual outline and substantiation." }
        ]
      }
    ]
  }
];

export const categories = categoriesNl;
