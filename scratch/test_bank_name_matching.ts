import { validateArtisanNameMatch, tokenizeName } from "../src/lib/banks";

console.log("=== TESTING NIGERIAN ARTISAN NAME MATCHING ===");

const testCases = [
  {
    registered: "Khalid Ibrahim",
    bank: "IBRAHIM KHALID",
    expected: true,
    desc: "Reversed First & Last Name",
  },
  {
    registered: "Engr. Mohammed Babatunde Bello",
    bank: "BELLO MOHAMMED B",
    expected: true,
    desc: "Honorific Title + Middle Initial",
  },
  {
    registered: "Chinedu Okonkwo",
    bank: "OKONKWO CHINEDU EMMANUEL",
    expected: true,
    desc: "Bank has additional middle name",
  },
  {
    registered: "Alhaji Musa Garba",
    bank: "MUSA GARBA ENTERPRISE",
    expected: true,
    desc: "Title + Business suffix",
  },
  {
    registered: "Khalid Ibrahim",
    bank: "JOHNSON OLUWASEUN DOE",
    expected: false,
    desc: "Completely different person (Fraud attempt)",
  },
  {
    registered: "Amaka Eze",
    bank: "EZE AMAKA PRECIOUS",
    expected: true,
    desc: "Female artisan with maiden/middle name",
  },
  {
    registered: "Peter Obi",
    bank: "AHMED BOLA TINUBU",
    expected: false,
    desc: "Unrelated third-party account",
  },
];

for (const tc of testCases) {
  const res = validateArtisanNameMatch(tc.registered, tc.bank);
  const pass = res.isValid === tc.expected;
  console.log(`[${pass ? "PASS ✅" : "FAIL ❌"}] ${tc.desc}`);
  console.log(`   Registered: "${tc.registered}" -> Tokens: [${tokenizeName(tc.registered).join(", ")}]`);
  console.log(`   Bank Account: "${tc.bank}" -> Tokens: [${tokenizeName(tc.bank).join(", ")}]`);
  console.log(`   Result: isValid=${res.isValid}, matchScore=${res.matchScore}%, reason="${res.reason}"\n`);
}
