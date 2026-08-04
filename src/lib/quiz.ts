export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed index
  explanation: string;
}

export const CATEGORY_QUIZZES: Record<string, QuizQuestion[]> = {
  plumbing: [
    {
      id: "p1",
      question: "Before repairing a burst water pipe inside a residential wall, what is the mandatory first step?",
      options: [
        "Apply sealant to the wet area immediately",
        "Shut off the main water isolation valve and drain residual pressure",
        "Heat the pipe using a soldering torch",
        "Increase municipal water inflow to find the crack"
      ],
      correctAnswer: 1,
      explanation: "Always isolate the main supply line and relieve residual pressure to prevent flooding during repair."
    },
    {
      id: "p2",
      question: "Which component under a sink trap prevents hazardous sewer gases from entering living spaces?",
      options: [
        "Pressure relief valve",
        "P-Trap / Water Seal",
        "Check valve",
        "Expansion joint"
      ],
      correctAnswer: 1,
      explanation: "The water trap (P-trap) holds standing water that acts as a physical barrier against sewer gas."
    },
    {
      id: "p3",
      question: "When installing a electric water heater, what critical safety component must be present to prevent tank explosion?",
      options: [
        "Temperature & Pressure Relief (TPR) Valve",
        "Flow meter",
        "Water softener filter",
        "Pressure booster pump"
      ],
      correctAnswer: 0,
      explanation: "TPR valves automatically discharge excess temperature or pressure if normal limits are exceeded."
    },
    {
      id: "p4",
      question: "What is the recommended sealant for threaded male pipe connections on PVC and copper water lines?",
      options: [
        "Super glue",
        "PTFE / Teflon tape or thread pipe dopes",
        "Silicone caulk only",
        "Electrical insulation tape"
      ],
      correctAnswer: 1,
      explanation: "Teflon (PTFE) tape lubricates and seals threaded pipe connections to prevent micro-leaks."
    },
    {
      id: "p5",
      question: "If a customer reports slow drainage in multiple fixtures across the house, where is the problem most likely located?",
      options: [
        "Aerator on the kitchen faucet",
        "Main sewer line or main branch cleanout",
        "Toilet fill valve",
        "Shower hose washer"
      ],
      correctAnswer: 1,
      explanation: "Widespread multi-fixture drainage issues indicate a obstruction in the main drain line or stack."
    }
  ],
  electrical: [
    {
      id: "e1",
      question: "In standard Nigerian single-phase wiring (UK Standard BS 7671), what color is the Live conductor?",
      options: [
        "Blue or Black",
        "Brown or Red",
        "Green and Yellow striped",
        "White"
      ],
      correctAnswer: 1,
      explanation: "Brown (or legacy Red) represents Live, Blue/Black represents Neutral, and Green/Yellow represents Earth."
    },
    {
      id: "e2",
      question: "What protective device is designed to protect humans against lethal electric shocks from earth faults in wet areas?",
      options: [
        "Standard Miniature Circuit Breaker (MCB)",
        "Residual Current Device (RCD / GFCI)",
        "Step-up Transformer",
        "Voltage surge protector"
      ],
      correctAnswer: 1,
      explanation: "RCDs detect micro-leakage to earth (30mA) and cut power in milliseconds to protect human life."
    },
    {
      id: "e3",
      question: "When replacing a 13A wall socket, what must be done before touching open wiring?",
      options: [
        "Wear rubber shoes only",
        "Isolate main circuit breaker and verify zero voltage with a calibrated tester",
        "Turn off the wall switch button",
        "Touch live wire quickly to test current"
      ],
      correctAnswer: 1,
      explanation: "Isolate circuit supply at the distribution panel and verify with a multimeter before touching wires."
    },
    {
      id: "e4",
      question: "What happens if an oversized 32A breaker is installed on thin 1.5mm² lighting cables?",
      options: [
        "Light bulbs will burn brighter",
        "Cable can overheat and catch fire before the breaker trips during overload",
        "Electricity bill will double",
        "Breaker will trip continuously"
      ],
      correctAnswer: 1,
      explanation: "Breakers protect cables. Oversizing breakers allows unsafe current flow that burns thin wires."
    },
    {
      id: "e5",
      question: "What is the primary function of an Electrical Earth (Grounding) rod driven into the soil?",
      options: [
        "To attract lightning strikes",
        "To provide a safe, low-resistance path for fault currents to safely trigger breakers",
        "To boost AC voltage",
        "To stabilize generator frequency"
      ],
      correctAnswer: 1,
      explanation: "Earth grounding safely dissipates fault currents into soil and triggers protective trip units."
    }
  ],
  cleaning: [
    {
      id: "c1",
      question: "Why should Household Bleach (Sodium Hypochlorite) NEVER be mixed with Ammonia or Acid cleaners?",
      options: [
        "It causes the solution to freeze",
        "It creates deadly toxic Chloramine/Chlorine gas fumes",
        "It turns surfaces permanently yellow",
        "It loses all cleaning power instantly"
      ],
      correctAnswer: 1,
      explanation: "Mixing bleach with acids or ammonia produces highly lethal toxic gases that damage lungs instantly."
    },
    {
      id: "c2",
      question: "In professional hygiene cleaning, why are color-coded microfiber cloths used?",
      options: [
        "To look aesthetically pleasing to clients",
        "To prevent cross-contamination (e.g. using toilet cloths on kitchen counters)",
        "To distinguish cotton from synthetic cloths",
        "To measure chemical dilution levels"
      ],
      correctAnswer: 1,
      explanation: "Color coding ensures cloths used in high-risk zone (restrooms) are never used in food preparation zones."
    },
    {
      id: "c3",
      question: "What is 'Dwell Time' in professional disinfectant application?",
      options: [
        "The time it takes to mop a floor",
        "The required contact time a chemical must remain wet on a surface to kill pathogens",
        "The time dried floors take to shine",
        "The shelf life of diluted bleach"
      ],
      correctAnswer: 1,
      explanation: "Disinfectants require a specific contact time (usually 5-10 minutes wet) to effectively kill viruses and bacteria."
    },
    {
      id: "c4",
      question: "When deep cleaning hardwood or laminated floors, what is the best practice?",
      options: [
        "Flood the floor with soapy water",
        "Use a damp, well-wrung microfiber mop with pH-neutral wood cleaner",
        "Scrub with abrasive steel wool",
        "Apply raw bleach directly"
      ],
      correctAnswer: 1,
      explanation: "Excess water damages wood laminate core; damp mopping with neutral pH cleaner protects protective finishes."
    },
    {
      id: "c5",
      question: "What personal protective equipment (PPE) is mandatory during post-construction dust cleanup?",
      options: [
        "Cotton apron only",
        "N95/FFP2 Respirator mask, safety goggles, and heavy-duty gloves",
        "Earplugs only",
        "Sun hat"
      ],
      correctAnswer: 1,
      explanation: "Post-construction silica and cement dust cause severe respiratory hazard requiring proper dust respirators."
    }
  ],
  hvac: [
    {
      id: "h1",
      question: "What is a primary indicator of a refrigerant leak in a split-unit air conditioner?",
      options: [
        "Outdoor fan running too fast",
        "Ice buildup on evaporator coils / copper suction valves and reduced cooling",
        "Air filter turning black",
        "Remote controller screen flickering"
      ],
      correctAnswer: 1,
      explanation: "Low refrigerant pressure causes evaporator coils and copper lines to freeze up due to pressure drop."
    },
    {
      id: "h2",
      question: "Before recharging refrigerant into an AC system that experienced a leak, what must be done?",
      options: [
        "Pour water into the outdoor unit",
        "Locate & repair leak point, pressure test with nitrogen, and pull deep vacuum",
        "Add oil to the indoor fan motor",
        "Turn down thermostat to minimum temperature"
      ],
      correctAnswer: 1,
      explanation: "Recharging without fixing leaks and pulling vacuum leads to moisture contamination and compressor failure."
    },
    {
      id: "h3",
      question: "What is the consequence of a clogged AC condensate drain line?",
      options: [
        "Compressor over-speeding",
        "Water leaking inside the room from the indoor unit drip tray",
        "Remote control signal failure",
        "Power breaker tripping instantly"
      ],
      correctAnswer: 1,
      explanation: "When condensate drain tubing is clogged with algae/dust, water overflows the indoor unit tray into living spaces."
    },
    {
      id: "h4",
      question: "What component gives the AC compressor motor the electrical boost required to start up?",
      options: [
        "Run / Start Capacitor",
        "Thermostat sensor probe",
        "Expansion capillary valve",
        "Blower wheel"
      ],
      correctAnswer: 0,
      explanation: "The start/run capacitor stores energy to overcome mechanical inertia when the compressor kicks on."
    },
    {
      id: "h5",
      question: "Why must outdoor condensing coils be cleaned regularly during servicing?",
      options: [
        "To keep birds away",
        "Dirt acts as an insulator, preventing heat rejection and overheating compressor",
        "To prevent rust on plastic casing",
        "To make fan blades turn silently"
      ],
      correctAnswer: 1,
      explanation: "Dirty condenser coils restrict airflow and heat release, causing high head pressure and system inefficiency."
    }
  ],
  painting: [
    {
      id: "pt1",
      question: "What critical surface preparation step is required before painting smooth or glossy walls?",
      options: [
        "Wash with oil",
        "Scrape, sand smooth, clean dust, and apply primer coat",
        "Apply topcoat directly",
        "Spray with water"
      ],
      correctAnswer: 1,
      explanation: "Sanding provides mechanical keying (grip) and primer ensures uniform paint adhesion without peeling."
    },
    {
      id: "pt2",
      question: "Why will paint bubble or peel off fresh masonry / plastered walls?",
      options: [
        "Plaster contains too much sand",
        "High moisture content / uncured damp wall trapping water vapor behind paint film",
        "Using a high quality roller",
        "Applying two coats"
      ],
      correctAnswer: 1,
      explanation: "Moisture trapped behind impermeable paint creates vapour pressure that pushes paint off the wall."
    },
    {
      id: "pt3",
      question: "What is the main purpose of Painter’s Masking Tape during interior room painting?",
      options: [
        "To hold plaster boards together",
        "To create razor-sharp trim edges and protect baseboards/switches from drips",
        "To patch drywall holes",
        "To seal windows permanently"
      ],
      correctAnswer: 1,
      explanation: "Painter's tape protects edges, door frames, and switches from accidental paint splatters."
    },
    {
      id: "pt4",
      question: "Which paint type is recommended for high-moisture areas like bathrooms and kitchens?",
      options: [
        "Flat / Matte distemper paint",
        "Satin / Semi-gloss washable moisture-resistant emulsion",
        "Powder chalk paint",
        "Solvent thinner"
      ],
      correctAnswer: 1,
      explanation: "Satin/Semi-gloss paints have tight film structures that resist water penetration and scrub easily."
    },
    {
      id: "pt5",
      question: "What is the recommended recoat drying time between emulsion paint coats in ambient conditions?",
      options: [
        "5 minutes",
        "2 to 4 hours minimum",
        "48 hours",
        "7 days"
      ],
      correctAnswer: 1,
      explanation: "Emulsion paint needs 2-4 hours to touch dry and cure sufficiently before applying a second coat."
    }
  ],
  solar: [
    {
      id: "s1",
      question: "When connecting two 12V 200Ah deep-cycle batteries in SERIES, what is the resulting output voltage and capacity?",
      options: [
        "12V 400Ah",
        "24V 200Ah",
        "24V 400Ah",
        "12V 200Ah"
      ],
      correctAnswer: 1,
      explanation: "Series connections double system voltage (12V + 12V = 24V) while keeping battery capacity (200Ah) constant."
    },
    {
      id: "s2",
      question: "Why must a DC Solar Circuit Breaker / Isolator be installed between solar panels and inverter?",
      options: [
        "To convert DC to AC power",
        "To safely isolate high-voltage DC array for maintenance and short-circuit protection",
        "To increase solar panel wattage",
        "To regulate battery temperature"
      ],
      correctAnswer: 1,
      explanation: "High voltage DC arcs are dangerous; DC isolators allow safe emergency disconnect of PV strings."
    },
    {
      id: "s3",
      question: "What solar charge controller technology provides highest efficiency (up to 98%) by tracking optimal PV power points?",
      options: [
        "PWM (Pulse Width Modulation)",
        "MPPT (Maximum Power Point Tracking)",
        "Linear voltage regulator",
        "Diode bridge"
      ],
      correctAnswer: 1,
      explanation: "MPPT controllers adjust impedance continuously to harvest maximum wattage from solar arrays."
    },
    {
      id: "s4",
      question: "What should NEVER be connected directly to an Inverter's pure sine wave output line?",
      options: [
        "Laptops and TVs",
        "Grid Utility input power line back-feeding into inverter output",
        "Standing fans",
        "LED lights"
      ],
      correctAnswer: 1,
      explanation: "Back-feeding mains utility grid into an inverter's AC output instantly destroys inverter MOSFETs."
    },
    {
      id: "s5",
      question: "What is the mandatory earthing requirement for outdoor solar panel aluminum mounting structures?",
      options: [
        "No grounding required",
        "PV frame grounding to dedicated earth rod for lightning surge protection",
        "Connect ground to neutral wire",
        "Wrap frames in plastic"
      ],
      correctAnswer: 1,
      explanation: "Metallic solar panel frames must be bonded to ground to safely dissipate static and lightning surges."
    }
  ],
  general: [
    {
      id: "g1",
      question: "When drilling into a masonry brick wall to hang heavy wall shelves, what anchor fixing should be used?",
      options: [
        "Paper tape",
        "Plastic wall plug (Rawlplug) with correct gauge masonry screw",
        "Thumbtacks",
        "Wood glue only"
      ],
      correctAnswer: 1,
      explanation: "Plastic wall plugs expand inside masonry pilot holes to provide structural anchor hold."
    },
    {
      id: "g2",
      question: "What tool is essential to verify a wall shelf or TV wall mount is perfectly horizontal?",
      options: [
        "Tape measure",
        "Spirit Level / Laser Level",
        "Plumb bob",
        "Pencil"
      ],
      correctAnswer: 1,
      explanation: "Spirit levels ensure fixtures are level to prevent items from sliding off."
    },
    {
      id: "g3",
      question: "Before drilling into an unfamiliar indoor wall, what check is necessary?",
      options: [
        "Tap with a hammer lightly",
        "Use a stud / cable detector to avoid hidden live electric wires and water pipes",
        "Turn off main lights",
        "Spray water on the wall"
      ],
      correctAnswer: 1,
      explanation: "Cable and pipe detectors prevent catastrophic accidental drilling into live electrical conduit or water pipes."
    },
    {
      id: "g4",
      question: "What Personal Protective Equipment (PPE) is mandatory when operating high-speed angle grinders or circular saws?",
      options: [
        "Sunglasses",
        "Impact-rated Safety Goggles and Face Shield",
        "Cotton gloves only",
        "Earbuds"
      ],
      correctAnswer: 1,
      explanation: "High-speed cutting disc shatters can cause blindings; impact safety goggles are mandatory."
    },
    {
      id: "g5",
      question: "How should a professional handyperson handle an unexpected issue found during client job execution?",
      options: [
        "Hide it from the client and leave quickly",
        "Document with clear photos, explain options to client transparently before extra work",
        "Fix it without permission and demand double payment",
        "Ignore the issue"
      ],
      correctAnswer: 1,
      explanation: "Professional integrity requires documenting issues and agreeing upfront on scope adjustments."
    }
  ]
};

export function getQuizForCategory(categoryId: string): QuizQuestion[] {
  const normalized = categoryId.toLowerCase();
  return CATEGORY_QUIZZES[normalized] || CATEGORY_QUIZZES.general;
}
