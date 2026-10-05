// Edit this file to change the homepage text, example provider, and step cards.
// Colors and motion live in app/globals.css. Search behavior lives in components/HomeSearch.tsx.
export const HOME_COPY = {
  brandName: "InsureBased",
  dataPill: "",
  kicker: "Search first. Verify clearly.",
  title: "Find care that fits your coverage.",
  subtitle:
    "Search nearby doctors and review available insurance information from trustworthy public sources.",
  search: {
    label: "Nearby search",
    title: "Who do you need?",
    helper: "Quick search checks Original Medicare. Use exact plan search for ACA.",
    specialtyLabel: "Care type",
    specialtyDefault: "Any specialty",
    locateButton: "Search near me",
    locatingButton: "Finding your location...",
    locationUnavailable: "Location is not available in this browser. Enter a ZIP instead.",
    locationFailed: "Location was blocked or timed out. Enter a ZIP code instead.",
    zipLabel: "ZIP code",
    zipPlaceholder: "60614",
    zipError: "Enter a 5-digit ZIP code.",
    insuranceLink: "Choose an exact ACA Marketplace plan",
  },
  what: {
    label: "What the label means",
    title: "Clear answers, even when the answer is unknown.",
    body:
      "The app separates provider records from coverage checks. If a plan cannot be verified from a real source, the label says that instead of guessing.",
    facts: [
      {
        value: "Provider",
        label: "Names, specialties, and phone numbers come from public records.",
      },
      {
        value: "Coverage",
        label: "Marketplace and Medicare labels use source-backed data where available.",
      },
      {
        value: "Other plans",
        label: "Employer and other insurers are marked not verified unless there is a real source.",
      },
    ],
  },
  trustItems: [
    {
      icon: "shield",
      title: "Honest coverage labels",
      body: "Choose an Original Medicare check, or use an exact ACA plan search. Other plans remain unverified.",
    },
    {
      icon: "check",
      title: "Built for quick calls",
      body: "Provider, specialty, distance, phone context, and coverage label stay together.",
    },
  ],
  steps: [
    {
      icon: "pin",
      title: "Search nearby",
      body: "Use your location for fast results, or type a ZIP when you want control.",
    },
    {
      icon: "stethoscope",
      title: "Pick the care type",
      body: "Choose a specialty when you know what you need, or keep the list broad.",
    },
    {
      icon: "phone",
      title: "Call with context",
      body: "Use the phone number and coverage label as your starting point before booking.",
    },
  ],
  motionNote:
    "Motion should feel fast and useful: soft page entry, button press feedback, chip ripple, and results fade-in only.",
  footer:
    "Provider names, specialties, and phone numbers come from public records. Coverage labels only appear when a real source is available; other insurers are marked not verified.",
} as const;
