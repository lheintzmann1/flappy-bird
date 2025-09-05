import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'flappy_bird_leaderboard';
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
      const leaderboard = await kv.get(LEADERBOARD_KEY) || [];
      return res.status(200).json(leaderboard);
    }

    if (req.method === 'POST') {
      // Add new score
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid name or score' });
      }

      // Sanitize name
      const sanitizedName = name.trim().substring(0, 20).replace(/[<>]/g, '');
      
      const leaderboard = await kv.get(LEADERBOARD_KEY) || [];
      
      // Add new entry
      leaderboard.push({
        name: sanitizedName,
        score,
        date: new Date().toISOString()
      });

      // Sort by score (highest first) and keep only top entries
      leaderboard.sort((a, b) => b.score - a.score);
      const topScores = leaderboard.slice(0, MAX_ENTRIES);

      // Save back to storage
      await kv.set(LEADERBOARD_KEY, topScores);

      return res.status(200).json(topScores);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
