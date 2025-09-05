// Fallback leaderboard storage using memory (for development)
let memoryLeaderboard = [];
const MAX_ENTRIES = 10;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get leaderboard
      return res.status(200).json(memoryLeaderboard);
    }

    if (req.method === 'POST') {
      // Add new score
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid name or score' });
      }

      // Sanitize name
      const sanitizedName = name.trim().substring(0, 20).replace(/[<>]/g, '');
      
      // Add new entry
      memoryLeaderboard.push({
        name: sanitizedName,
        score,
        date: new Date().toISOString()
      });

      // Sort by score (highest first) and keep only top entries
      memoryLeaderboard.sort((a, b) => b.score - a.score);
      memoryLeaderboard = memoryLeaderboard.slice(0, MAX_ENTRIES);

      return res.status(200).json(memoryLeaderboard);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
