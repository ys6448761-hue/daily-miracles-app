const fs = require("fs");

const mustFiles = [
  "AURORA-STATUS.md",
  "MVP_SCOPE.md",
  "DECISIONS.md",
  "ARCHITECTURE.md",
  "KPI.md",
];

for (const f of mustFiles) {
  if (!fs.existsSync(f)) {
    console.error(`GATE FAIL: missing ${f}`);
    process.exit(1);
  }
}

console.log("GATE PASS");
