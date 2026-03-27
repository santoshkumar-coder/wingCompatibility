const { categorizeQ5Answer } = require('./app.js');

const testCases = [
  "love and care",
  "honesty and loyalty",
  "communication",
  "respect and space",
  "growth and teamwork",
  "fun and adventure",
  "commitment",
  ""
];

console.log("Testing categorizeQ5Answer:");
console.log("----------------------------");

testCases.forEach(input => {
  const result = categorizeQ5Answer(input);
  console.log(`Input: "${input}" => Category: ${result}`);
});

console.log("\nTesting compatibility score (Identical Sets):");
console.log("----------------------------");

const answers = {};
for (let i = 1; i <= 25; i++) {
  answers[i.toString()] = "1";
}

const { calculateCompatibility } = require('./app.js');
const score = calculateCompatibility(answers, answers);
console.log(`Identical answers (all "1"s) => Compatibility Score: ${score}%`);
