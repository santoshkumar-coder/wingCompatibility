const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON file path
const JSON_DATA_FILE = 'users_data.json';
const DB_FILE = 'wingmann.db';

// Middleware
app.use(express.json());

app.use(express.static("static"));

// Initialize Database
const db = new Database(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    answers TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Initialize JSON file
if (!fs.existsSync(JSON_DATA_FILE)) {
  fs.writeFileSync(JSON_DATA_FILE, JSON.stringify([], null, 2));
}

// Helper: Save to JSON with sorted answers
function saveToJson(userData) {
  let users = [];
  if (fs.existsSync(JSON_DATA_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(JSON_DATA_FILE, 'utf8'));
    } catch (e) {
      users = [];
    }
  }

  // Sort answers by question number ascending (integer sort)
  if (userData.answers && typeof userData.answers === 'object') {
    userData.answers = sortAnswers(userData.answers);
  }

  users.push(userData);

  // Re-sort all users' answers just in case
  users.forEach(user => {
    if (user.answers && typeof user.answers === 'object') {
      user.answers = sortAnswers(user.answers);
    }
  });

  fs.writeFileSync(JSON_DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function getAllUsersFromJson() {
  if (fs.existsSync(JSON_DATA_FILE)) {
    try {
      const users = JSON.parse(fs.readFileSync(JSON_DATA_FILE, 'utf8'));
      users.forEach(user => {
        if (user.answers && typeof user.answers === 'object') {
          user.answers = sortAnswers(user.answers);
        }
      });
      return users;
    } catch (e) {
      return [];
    }
  }
  return [];
}

function sortAnswers(answers) {
  return Object.fromEntries(
    Object.entries(answers).sort(([a], [b]) => parseInt(a) - parseInt(b))
  );
}

// Data Constants
const QUESTION_WEIGHTS = {
  1: 3, 2: 5, 3: 4, 4: 4, 5: 5,
  6: 4, 7: 4, 8: 4, 9: 5, 10: 4,
  11: 5, 12: 4, 13: 4, 14: 2, 15: 4,
  16: 5, 17: 4, 18: 5, 19: 4, 20: 2,
  21: 5, 22: 5, 23: 3, 24: 3, 25: 3
};

const MATCHING_RULES = {
  1: { high: [[1,1],[2,2],[3,3],[4,4]], moderate: [[1,4],[2,4],[3,4]], low: [[1,2],[1,3],[2,3]] },
  2: { high: [[1,1],[3,3],[1,3],[2,2]], moderate: [[2,3],[2,1]], low: [[1,4],[2,4],[3,4],[4,4]] },
  3: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  4: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  5: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7], [1,2],[1,3],[1,4],[1,5],[1,7],[2,3],[4,3],[5,3],[7,3],[2,5],[2,7],[4,5],[5,7]], moderate: [[2,4],[4,7]], low: [[6,1],[6,2],[6,3],[6,4],[6,5],[6,7]] },
  6: { high: [[1,1],[2,2],[2,4]], moderate: [[1,3],[1,2]], low: [[3,3],[3,4],[4,4],[2,3],[1,4]] },
  7: { high: [[1,1],[2,2],[3,3],[4,4],[1,4]], moderate: [[1,3],[2,4]], low: [[1,2],[2,3],[3,4]] },
  8: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  9: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  10: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  11: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  12: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  13: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  14: { high: [[1,1],[2,2]], moderate: [[1,2],[1,3],[1,4]], low: [[3,3],[2,4],[2,3],[4,4],[3,4]] },
  15: { high: [[1,1]], moderate: [[2,2],[1,2],[1,3],[1,4]], low: [[3,3],[3,4],[4,3],[2,3],[3,2],[4,4],[2,4],[4,2]] },
  16: { high: [[1,1],[2,2],[3,3],[4,4],[5,5],[1,2],[4,5]], moderate: [[1,3],[2,3],[3,4],[3,5]], low: [[1,4],[1,5],[2,4],[2,5]] },
  17: { high: [[4,4],[5,5],[4,5]], moderate: [[1,3],[2,3],[3,3],[3,4],[3,5]], low: [[1,1],[2,2],[1,2],[1,4],[1,5],[2,4],[2,5]] },
  18: { high: [[2,2],[3,3],[4,4]], moderate: [[3,4],[2,3]], low: [[1,1],[2,4],[1,2],[1,3],[1,4]] },
  19: { high: [[1,1],[2,2],[1,2]], moderate: [[1,3],[2,3],[3,3],[3,4],[3,5]], low: [[4,4],[5,5],[4,5],[2,4],[2,5],[1,4],[1,5]] },
  20: { high: [[1,1],[2,2],[1,2],[4,4],[5,5],[4,5]], moderate: [[1,3],[2,3],[3,3],[2,4],[1,4]], low: [[1,5],[2,5],[4,3],[5,3]] },
  21: { high: [[4,4],[5,5],[4,5]], moderate: [[3,3],[3,4],[3,5],[2,3],[1,3]], low: [[1,1],[2,2],[1,2],[1,4],[1,5],[2,4],[2,5]] },
  22: { high: [[4,4],[5,5],[4,5]], moderate: [[3,3],[3,4],[3,5],[1,3]], low: [[1,1],[2,2],[1,2],[2,3],[2,4],[2,5],[1,5],[1,4]] },
  23: { high: [[1,1],[2,2],[1,3],[2,3],[1,2]], moderate: [[3,4],[3,5],[3,3],[4,4]], low: [[5,5],[1,5],[2,5],[1,4],[2,4],[4,5]] },
  24: { high: [[1,1]], moderate: [[1,2],[1,4],[2,2],[4,4],[3,3]], low: [[2,4],[2,3],[3,4],[1,3]] },
  25: { high: [[1,1],[3,3],[1,3]], moderate: [[2,2],[1,2],[4,4],[2,3],[3,4]], low: [[1,4],[2,4]] }
};

const Q5_CATEGORIES = {
  1: ["love", "care", "affection", "warmth", "emotional support", "kindness", "compassion", "maturity"],
  2: ["honesty", "loyalty", "transparency", "dependability", "faithfulness", "reliability"],
  3: ["openness", "communication", "listening", "understanding", "expressing emotions", "patience"],
  4: ["support", "respect", "equality", "appreciation", "independence", "space", "boundaries"],
  5: ["growth", "teamwork", "understanding", "adaptive", "flexible", "supporting goals", "solving"],
  6: ["sex", "sharing experiences", "adventure", "chemistry", "humour", "humor", "emotional connection"],
  7: ["commitment", "safety", "consistency", "partnership", "togetherness"]
};

const QUESTION_TEXTS = {
  1: "How do you usually like to spend your weekends?",
  2: "When it comes to managing money as a couple, I prefer:",
  3: "I feel most balanced when my partner and I have similar daily habits and energy levels.",
  4: "If I had to choose between spending time on my goals or my relationship, I'd usually choose my goals.",
  5: "What's one thing that really matters to you in a relationship?",
  6: "When I'm upset, I tend to:",
  7: "When you care about someone, you usually show it through:",
  8: "I pick up on changes in someone's mood quickly.",
  9: "I can express how I feel even when it might cause disagreement.",
  10: "When my partner withdraws during a disagreement, I usually want to reach out and reconnect.",
  11: "I sometimes worry that my partner might lose interest or drift away.",
  12: "I love emotional closeness, but too much of it can make me want space.",
  13: "Even with someone I trust, I sometimes hold back my true feelings.",
  14: "When I feel overwhelmed, I usually:",
  15: "If someone you're dating doesn't text back for hours, what's your first reaction?",
  16: "I feel safe sharing my feelings when I know I won't be judged.",
  17: "After a disagreement, I'm usually the one to take the first step toward making things right.",
  18: "When conflict arises, I tend to:",
  19: "I often focus more on being right than on being understood.",
  20: "I find it difficult to stay calm when I feel misunderstood.",
  21: "I believe relationships help both people grow.",
  22: "When I realize I've hurt someone, I try to take responsibility and reconnect.",
  23: "I rarely talk about my feelings and emotions.",
  24: "Which best describes how you feel about relationships right now?",
  25: "I've learned the most about relationships from:"
};

const QUESTION_OPTIONS = {
  1: { 1: "Relaxing at home", 2: "Going out with friends or exploring new places", 3: "Doing something productive", 4: "Mixing it up depending on my mood" },
  2: { 1: "Putting it all together", 2: "Keeping our own accounts but being open about stuff", 3: "Splitting things in a way that feels fair for both", 4: "Keeping finances totally separate" },
  3: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  4: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  6: { 1: "Stay quiet and think", 2: "Talk things through right away", 3: "Distract myself until I feel calmer", 4: "Wait for the other person to reach out first" },
  7: { 1: "Spending quality time together", 2: "Giving thoughtful gifts", 3: "Checking in and making sure they are okay", 4: "Doing things to help or support them" },
  8: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  9: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  10: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  11: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  12: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  13: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  14: { 1: "Take some time alone to recharge and think", 2: "Talk it out with someone I trust", 3: "Distract myself with music, shows, or hobbies", 4: "Try to stay busy and push through it" },
  15: { 1: "Calm – they're probably busy", 2: "Anxious – did I say something wrong?", 3: "Unbothered – I'll reply later too", 4: "Irritated – communication should be consistent" },
  16: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  17: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  18: { 1: "Avoid it until things calm down", 2: "Address it right away", 3: "Compromise quickly to move on", 4: "Reflect before bringing it up" },
  19: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  20: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  21: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  22: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  23: { 1: "1 - Completely Disagree", 2: "2", 3: "3", 4: "4", 5: "5 - Completely Agree" },
  24: { 1: "Ready to build something meaningful", 2: "Open but cautious", 3: "Still exploring what I really want", 4: "Healing and taking things slow" },
  25: { 1: "My past relationships", 2: "Watching family or friends", 3: "Personal growth and self reflection", 4: "Movies, books, or social media" }
};

// NLP / Categorization Logic
function categorizeQ5Answer(text) {
  if (!text || typeof text !== 'string') return 3;

  const textLower = text.toLowerCase().trim();
  const words = textLower.split(/\s+/);

  const semanticConcepts = {
    1: { concepts: ["forgiveness", "forgive", "forgiving", "mercy", "compassion", "empathy", "emotional", "feelings", "heart", "soul", "warmth", "tenderness"], word_roots: ["forgiv", "compass", "empath", "emot", "feel", "heart", "soul"] },
    2: { concepts: ["accountability", "accountable", "responsibility", "responsible", "integrity", "honest", "trust", "reliable", "dependable", "faithful", "loyal"], word_roots: ["account", "responsib", "integrit", "honest", "trust", "reliab", "depend", "faith", "loyal"] },
    3: { concepts: ["communication", "talk", "discuss", "express", "listen", "understand", "dialogue", "conversation", "share", "open"], word_roots: ["communicat", "talk", "discuss", "express", "listen", "understand", "dialogue", "share"] },
    4: { concepts: ["respect", "equality", "equal", "fair", "fairness", "boundaries", "privacy", "independence", "autonomy", "freedom"], word_roots: ["respect", "equal", "fair", "boundar", "privac", "independ", "autonom", "freedom"] },
    5: { concepts: ["growth", "grow", "improve", "develop", "evolve", "learn", "progress", "teamwork", "collaboration", "partnership", "together"], word_roots: ["grow", "improv", "develop", "evolv", "learn", "progress", "team", "collabor", "partner"] },
    6: { concepts: ["fun", "enjoyment", "excitement", "adventure", "passion", "romance", "intimacy", "chemistry", "humor", "laughter", "enjoy"], word_roots: ["fun", "enjoy", "excit", "adventur", "passion", "romance", "intimac", "chemistr", "humor", "laugh"] },
    7: { concepts: ["commitment", "commit", "stable", "stability", "consistent", "security", "secure", "steady", "permanent", "long-term"], word_roots: ["commit", "stabil", "consist", "secur", "steady", "perman", "long"] }
  };

  const categoryScores = {};
  const categoryPositions = {};

  for (let catId = 1; catId <= 7; catId++) {
    let firstPosition = textLower.length;
    const allMatches = new Set();

    // Check Core Keywords
    for (const keyword of Q5_CATEGORIES[catId]) {
      const pos = textLower.indexOf(keyword);
      if (pos !== -1) {
        if (pos < firstPosition) firstPosition = pos;
        allMatches.add(keyword);
      }
    }

    // Check Semantic Concepts
    for (const concept of semanticConcepts[catId].concepts) {
      const pos = textLower.indexOf(concept);
      if (pos !== -1) {
        if (pos < firstPosition) firstPosition = pos;
        allMatches.add(concept);
      }
    }

    // Check Word Roots
    for (const word of words) {
      for (const root of semanticConcepts[catId].word_roots) {
        if (word.startsWith(root) || word.includes(root)) {
          const pos = textLower.indexOf(word);
          if (pos !== -1) {
            if (pos < firstPosition) firstPosition = pos;
            allMatches.add(word);
          }
          break;
        }
      }
    }

    categoryScores[catId] = allMatches.size;
    categoryPositions[catId] = allMatches.size > 0 ? firstPosition : textLower.length;
  }

  const maxCount = Math.max(...Object.values(categoryScores));
  if (maxCount > 0) {
    const topCategories = Object.keys(categoryScores)
      .filter(catId => categoryScores[catId] === maxCount)
      .map(Number);

    if (topCategories.length > 1) {
      return topCategories.reduce((best, current) => 
        categoryPositions[current] < categoryPositions[best] ? current : best
      );
    }
    return topCategories[0];
  }

  return 3; // Default to Communication
}

// Compatibility Engine Logic
function getAnswerLabel(questionNum, rawValue) {
  if (questionNum === 5) return String(rawValue);
  
  const options = QUESTION_OPTIONS[questionNum];
  if (!options) return String(rawValue);
  
  const key = parseInt(rawValue);
  return options[key] || String(rawValue);
}

function getCompatibilityLevel(questionNum, answer1, answer2) {
  const rules = MATCHING_RULES[questionNum];
  if (!rules) return "low";

  const isMatch = (pairList, a1, a2) => 
    pairList.some(([p1, p2]) => (p1 === a1 && p2 === a2) || (p1 === a2 && p2 === a1));

  if (isMatch(rules.high, answer1, answer2)) return "high";
  if (isMatch(rules.moderate, answer1, answer2)) return "moderate";
  return "low";
}

function calculateCompatibility(user1Answers, user2Answers, detailed = false) {
  let totalScore = 0;
  const breakdown = [];

  for (let qNum = 1; qNum <= 25; qNum++) {
    const weight = QUESTION_WEIGHTS[qNum];
    let a1 = user1Answers[String(qNum)];
    let a2 = user2Answers[String(qNum)];

    if (a1 === undefined || a2 === undefined) continue;

    const originalA1 = a1;
    const originalA2 = a2;

    if (qNum === 5) {
      if (typeof a1 === 'string') a1 = categorizeQ5Answer(a1);
      if (typeof a2 === 'string') a2 = categorizeQ5Answer(a2);
    }

    const answer1Int = parseInt(a1);
    const answer2Int = parseInt(a2);

    if (isNaN(answer1Int) || isNaN(answer2Int)) continue;

    const level = getCompatibilityLevel(qNum, answer1Int, answer2Int);
    let compatibilityValue = 0;
    if (level === "high") compatibilityValue = 2;
    else if (level === "moderate") compatibilityValue = 1;

    const questionScore = weight * compatibilityValue;
    totalScore += questionScore;

    if (detailed) {
      breakdown.push({
        question_num: qNum,
        question_text: QUESTION_TEXTS[qNum] || `Question ${qNum}`,
        weight: weight,
        user1_answer: getAnswerLabel(qNum, originalA1),
        user2_answer: getAnswerLabel(qNum, originalA2),
        compatibility_level: level,
        compatibility_value: compatibilityValue,
        question_score: questionScore,
        max_possible_score: weight * 2
      });
    }
  }

  const percentage = (totalScore / 200) * 100;

  if (detailed) {
    return {
      total_score: totalScore,
      max_possible_score: 200,
      percentage: Number(percentage.toFixed(2)),
      breakdown: breakdown
    };
  }
  return Number(percentage.toFixed(2));
}

// API Endpoints
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'home.html'));
});

app.post('/submit', (req, res) => {
  try {
    const { name, gender, phone, answers } = req.body;
    const phoneRegex = /^\d{10}$/;

    if (!name || !gender || !phone) {
      return res.status(400).json({ success: false, error: 'Missing required fields (name, gender, phone)' });
    }

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone number must be exactly 10 digits.' });
    }

    if (!answers || Object.keys(answers).length !== 25) {
      return res.status(400).json({ success: false, error: `Invalid number of answers. Expected 25, got ${Object.keys(answers || {}).length}` });
    }

    const userData = {
      name,
      gender,
      phone,
      answers: sortAnswers(answers),
      created_at: new Date().toISOString()
    };

    // Save to SQLite
    const insert = db.prepare('INSERT INTO users (name, gender, phone, answers) VALUES (?, ?, ?, ?)');
    const info = insert.run(name, gender, phone, JSON.stringify(userData.answers));
    const userId = info.lastInsertRowid;

    userData.id = userId;
    saveToJson(userData);

    // Get opposite gender users
    const oppositeGender = gender === 'Male' ? 'Female' : 'Male';
    const others = db.prepare('SELECT id, name, answers FROM users WHERE gender = ? AND id != ?').all(oppositeGender, userId);

    const compatibilityScores = others.map(other => {
      const otherAnswers = JSON.parse(other.answers);
      return {
        id: other.id,
        name: other.name,
        score: calculateCompatibility(userData.answers, otherAnswers)
      };
    });

    compatibilityScores.sort((a, b) => b.score - a.score);

    res.json({ success: true, scores: compatibilityScores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'results.html'));
});

app.get('/add-user', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'add_user.html'));
});

app.get('/all-compatibility', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'all_compatibility.html'));
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, gender, phone, answers, created_at FROM users ORDER BY created_at DESC').all();
    const formattedUsers = users.map(u => ({
      ...u,
      answers: JSON.parse(u.answers)
    }));
    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compatibility/all', (req, res) => {
  try {
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
    const allUsers = db.prepare('SELECT id, name, gender, answers FROM users').all();
    const compatibilityMatrix = [];

    if (userId) {
      const selectedUser = allUsers.find(u => u.id === userId);
      if (!selectedUser) return res.status(404).json({ error: 'User not found' });

      const user1Answers = JSON.parse(selectedUser.answers);
      allUsers.forEach(user2 => {
        if (user2.id !== selectedUser.id && user2.gender !== selectedUser.gender) {
          const user2Answers = JSON.parse(user2.answers);
          compatibilityMatrix.push({
            user1: { id: selectedUser.id, name: selectedUser.name, gender: selectedUser.gender },
            user2: { id: user2.id, name: user2.name, gender: user2.gender },
            score: calculateCompatibility(user1Answers, user2Answers)
          });
        }
      });
    } else {
      for (let i = 0; i < allUsers.length; i++) {
        for (let j = i + 1; j < allUsers.length; j++) {
          const u1 = allUsers[i];
          const u2 = allUsers[j];
          if (u1.gender !== u2.gender) {
            compatibilityMatrix.push({
              user1: { id: u1.id, name: u1.name, gender: u1.gender },
              user2: { id: u2.id, name: u2.name, gender: u2.gender },
              score: calculateCompatibility(JSON.parse(u1.answers), JSON.parse(u2.answers))
            });
          }
        }
      }
    }

    compatibilityMatrix.sort((a, b) => b.score - a.score);
    res.json(compatibilityMatrix);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/json-data', (req, res) => {
  try {
    const users = getAllUsersFromJson();
    if (users.length > 0) {
      fs.writeFileSync(JSON_DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compatibility/detailed', (req, res) => {
  try {
    const user1_id = parseInt(req.query.user1_id);
    const user2_id = parseInt(req.query.user2_id);

    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: 'Both user1_id and user2_id are required' });
    }

    const u1 = db.prepare('SELECT id, name, gender, answers FROM users WHERE id = ?').get(user1_id);
    const u2 = db.prepare('SELECT id, name, gender, answers FROM users WHERE id = ?').get(user2_id);

    if (!u1 || !u2) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    const analysis = calculateCompatibility(JSON.parse(u1.answers), JSON.parse(u2.answers), true);

    res.json({
      user1: { id: u1.id, name: u1.name, gender: u1.gender },
      user2: { id: u2.id, name: u2.name, gender: u2.gender },
      analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = { categorizeQ5Answer, calculateCompatibility, getAnswerLabel, getCompatibilityLevel };
