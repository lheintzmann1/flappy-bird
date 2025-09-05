
// Optimized Flappy Bird with Leaderboard
const $ = id => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');

// Cache DOM elements
const gameOverScreen = $('gameOverScreen');
const leaderboardScreen = $('leaderboardScreen');
const finalScoreEl = $('finalScore');
const bestScoreEl = $('bestScore');
const instructions = $('instructions');
const playerNameInput = $('playerName');
const highScoreForm = $('highScoreForm');

// Optimized constants
const BIRD_W = 30, BIRD_H = 25, PIPE_W = 60, PIPE_GAP = 150, PIPE_SPEED = 2;
const GRAVITY = 0.5, JUMP = -8, GROUND_H = 100;
const API_URL = '/api/leaderboard';

// Game state - using object for better performance
const game = {
  state: 'playing',
  score: 0,
  bestScore: parseInt(localStorage.getItem('bestScore') || '0'),
  frame: 0,
  bird: { x: 80, y: 300, vy: 0 },
  pipes: [],
  leaderboard: []
};

// Optimized pipe creation
const createPipe = () => {
  const minH = 50;
  const topH = Math.random() * (canvas.height - PIPE_GAP - minH * 2 - GROUND_H) + minH;
  game.pipes.push({
    x: canvas.width,
    topH,
    botY: topH + PIPE_GAP,
    botH: canvas.height - topH - PIPE_GAP - GROUND_H,
    scored: false
  });
};

// Fast collision detection
const collides = (bird, pipe) => (
  bird.x < pipe.x + PIPE_W && bird.x + BIRD_W > pipe.x && 
  (bird.y < pipe.topH || bird.y + BIRD_H > pipe.botY)
);

// Initialize game
const init = () => {
  Object.assign(game, {
    state: 'playing',
    score: 0,
    frame: 0,
    pipes: []
  });
  Object.assign(game.bird, { y: 300, vy: 0 });
  gameOverScreen.style.display = 'none';
  leaderboardScreen.style.display = 'none';
  instructions.style.display = 'block';
  highScoreForm.style.display = 'none';
  createPipe();
};

// Game update loop - optimized
const update = () => {
  if (game.state !== 'playing') return;
  
  const { bird, pipes } = game;
  game.frame++;
  
  // Bird physics
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  
  // Create pipes every 120 frames
  if (game.frame % 120 === 0) createPipe();
  
  // Update pipes (reverse loop for safe removal)
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= PIPE_SPEED;
    
    if (pipe.x + PIPE_W < 0) {
      pipes.splice(i, 1);
    } else if (!pipe.scored && pipe.x + PIPE_W < bird.x) {
      pipe.scored = true;
      game.score++;
    } else if (collides(bird, pipe)) {
      gameOver();
      return;
    }
  }
  
  // Ground/ceiling collision
  if (bird.y + BIRD_H > canvas.height - GROUND_H || bird.y < 0) {
    gameOver();
  }
};

// Game over logic
const gameOver = () => {
  game.state = 'gameover';
  
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    localStorage.setItem('bestScore', game.bestScore);
    // Show name input for new high score
    if (game.score > 0) {
      highScoreForm.style.display = 'block';
      playerNameInput.focus();
    }
  }
  
  finalScoreEl.textContent = `Score: ${game.score}`;
  bestScoreEl.textContent = `Best: ${game.bestScore}`;
  gameOverScreen.style.display = 'flex';
  instructions.style.display = 'none';
};

// Optimized rendering with minimal state changes
const draw = () => {
  const { bird, pipes, score } = game;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background gradient (cached)
  if (!draw.bgGradient) {
    draw.bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    draw.bgGradient.addColorStop(0, '#87CEEB');
    draw.bgGradient.addColorStop(0.7, '#87CEEB');
    draw.bgGradient.addColorStop(0.7, '#98FB98');
    draw.bgGradient.addColorStop(1, '#90EE90');
  }
  ctx.fillStyle = draw.bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Ground
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, canvas.height - GROUND_H, canvas.width, GROUND_H);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, canvas.height - GROUND_H, canvas.width, 20);
  
  // Pipes - batch drawing
  ctx.fillStyle = '#228B22';
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
    ctx.fillRect(pipe.x - 5, pipe.topH - 20, PIPE_W + 10, 20);
    ctx.fillRect(pipe.x, pipe.botY, PIPE_W, pipe.botH);
    ctx.fillRect(pipe.x - 5, pipe.botY, PIPE_W + 10, 20);
  });
  
  // Bird
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(bird.x, bird.y, BIRD_W, BIRD_H);
  // Eye
  ctx.fillStyle = '#FFF';
  ctx.fillRect(bird.x + 20, bird.y + 5, 6, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(bird.x + 22, bird.y + 7, 2, 2);
  // Beak
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.moveTo(bird.x + BIRD_W, bird.y + 12);
  ctx.lineTo(bird.x + BIRD_W + 8, bird.y + 15);
  ctx.lineTo(bird.x + BIRD_W, bird.y + 18);
  ctx.closePath();
  ctx.fill();
  
  // Score with shadow
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(score, canvas.width / 2 + 2, 52);
  ctx.fillStyle = '#FFF';
  ctx.fillText(score, canvas.width / 2, 50);
};

// Main game loop - optimized with RAF
const gameLoop = () => {
  update();
  draw();
  requestAnimationFrame(gameLoop);
};

// Input handling
const jump = () => game.state === 'playing' && (game.bird.vy = JUMP);

// Leaderboard API functions
const fetchLeaderboard = async () => {
  try {
    const response = await fetch(API_URL);
    return response.ok ? await response.json() : [];
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e);
    return [];
  }
};

const submitScore = async (name, score) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    return response.ok ? await response.json() : null;
  } catch (e) {
    console.error('Failed to submit score:', e);
    return null;
  }
};

const showLeaderboard = async () => {
  leaderboardScreen.style.display = 'flex';
  gameOverScreen.style.display = 'none';
  
  const list = $('leaderboardList');
  list.innerHTML = 'Loading...';
  
  const scores = await fetchLeaderboard();
  
  if (scores.length === 0) {
    list.innerHTML = '<p>No scores yet. Be the first!</p>';
    return;
  }
  
  list.innerHTML = scores.map((entry, i) => 
    `<div class="score-entry ${i < 3 ? 'top-score' : ''}">
      <span class="rank">${i + 1}.</span>
      <span class="name">${entry.name}</span>
      <span class="score">${entry.score}</span>
    </div>`
  ).join('');
};

// Event listeners - optimized
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (game.state === 'playing') jump();
    else if (game.state === 'gameover') init();
  }
});

canvas.addEventListener('click', jump);

$('restartBtn').addEventListener('click', init);
$('showLeaderboard').addEventListener('click', showLeaderboard);
$('closeLeaderboard').addEventListener('click', () => {
  leaderboardScreen.style.display = 'none';
  gameOverScreen.style.display = 'flex';
});

$('submitScore').addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  if (!name) return;
  
  const btn = $('submitScore');
  btn.textContent = 'Submitting...';
  btn.disabled = true;
  
  await submitScore(name, game.score);
  
  btn.textContent = 'Submitted!';
  highScoreForm.style.display = 'none';
  
  setTimeout(() => {
    btn.textContent = 'Submit to Leaderboard';
    btn.disabled = false;
  }, 2000);
});

playerNameInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') $('submitScore').click();
});

// Initialize and start
init();
gameLoop();
