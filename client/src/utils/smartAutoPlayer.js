// Strategic Smart Auto-Player Heuristics for Ludo Arena

export function getSmartAutoMove(gameState, myColor) {
  if (!gameState || !myColor || !gameState.players || !gameState.players[myColor]) {
    return null;
  }

  const player = gameState.players[myColor];
  const dicePool = gameState.dicePool || [];
  if (dicePool.length === 0) return null;

  const mode = gameState.mode || '4P';
  const finishStep = mode === '6P' ? 76 : 56;
  const maxTrack = mode === '6P' ? 68 : 52;
  const mainTrackMax = mode === '6P' ? 67 : 51;
  const killRequired = gameState.settings?.killRequiredToEnterHome ?? true;
  const hasKill = (player.kills || 0) > 0;

  // Start position for each color
  const startPositions = mode === '6P' ? {
    red: 0, green: 12, yellow: 24, blue: 36, orange: 48, purple: 60
  } : {
    red: 0, green: 13, yellow: 26, blue: 39
  };

  const safeSpotsAbs = mode === '6P'
    ? [0, 12, 24, 36, 48, 60]
    : [0, 8, 13, 21, 26, 34, 39, 47];

  // Helper: Get absolute board position of a step
  const getAbsPos = (step, color) => {
    if (step < 0 || step >= mainTrackMax) return -1;
    const start = startPositions[color] || 0;
    return (start + step) % maxTrack;
  };

  // Build list of opponent token positions
  const opponentAbsPositions = new Set();
  const opponentPositionsList = [];

  Object.keys(gameState.players).forEach(otherColor => {
    if (otherColor !== myColor) {
      const otherP = gameState.players[otherColor];
      if (otherP && otherP.tokens) {
        otherP.tokens.forEach(st => {
          if (st >= 0 && st < mainTrackMax) {
            const abs = getAbsPos(st, otherColor);
            opponentAbsPositions.add(abs);
            opponentPositionsList.push({ color: otherColor, abs, step: st });
          }
        });
      }
    }
  });

  // Evaluate all legal move candidates
  const candidates = [];

  for (let tIdx = 0; tIdx < player.tokens.length; tIdx++) {
    const currentStep = player.tokens[tIdx];
    if (currentStep === finishStep) continue; // Already finished

    for (let rIdx = 0; rIdx < dicePool.length; rIdx++) {
      const roll = dicePool[rIdx];

      // Check basic move validity
      if (!canTokenMove(currentStep, roll, killRequired, hasKill, finishStep, mainTrackMax)) {
        continue;
      }

      const nextStep = (currentStep === -1) ? 0 : (currentStep + roll);
      const nextAbs = getAbsPos(nextStep, myColor);

      // Evaluate Smart Score
      let score = 0;

      // 1. Reaching Home (Finish) (+1000)
      if (nextStep === finishStep) {
        score += 1000;
      }

      // 2. Capturing Opponent Token (+900)
      let isKill = false;
      if (nextStep >= 0 && nextStep < mainTrackMax && !safeSpotsAbs.includes(nextAbs)) {
        if (opponentAbsPositions.has(nextAbs)) {
          score += 900;
          isKill = true;
        }
      }

      // 3. Escaping Danger (+500)
      const curAbs = getAbsPos(currentStep, myColor);
      let inDanger = false;
      if (currentStep >= 0 && currentStep < mainTrackMax && !safeSpotsAbs.includes(curAbs)) {
        for (const opp of opponentPositionsList) {
          const dist = (curAbs - opp.abs + maxTrack) % maxTrack;
          if (dist >= 1 && dist <= 6) {
            inDanger = true;
            break;
          }
        }
      }
      if (inDanger) {
        if (nextStep >= mainTrackMax || safeSpotsAbs.includes(nextAbs) || isKill) {
          score += 500;
        } else {
          score += 300;
        }
      }

      // 4. Moving inside Home Corridor (+450)
      if (nextStep >= mainTrackMax && nextStep < finishStep) {
        score += 450;
      }

      // 5. Landing on Safe Star Spot (+350)
      if (nextStep >= 0 && nextStep < mainTrackMax && safeSpotsAbs.includes(nextAbs)) {
        score += 350;
      }

      // 6. Leaving Base with a 6 (+250)
      if (currentStep === -1 && roll === 6) {
        score += 250;
      }

      // 7. Avoid landing in immediate danger (-200)
      if (nextStep >= 0 && nextStep < mainTrackMax && !safeSpotsAbs.includes(nextAbs) && !isKill) {
        for (const opp of opponentPositionsList) {
          const dist = (nextAbs - opp.abs + maxTrack) % maxTrack;
          if (dist >= 1 && dist <= 6) {
            score -= 200;
            break;
          }
        }
      }

      // 8. Progress bonus based on distance
      score += (nextStep * 2);

      candidates.push({
        tokenIndex: tIdx,
        rollIndex: rIdx,
        val: roll,
        score
      });
    }
  }

  if (candidates.length === 0) return null;

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0];
}

function canTokenMove(step, roll, killRequired, hasKill, finishStep, mainTrackMax) {
  if (step === finishStep) return false;
  if (step === -1) {
    return roll === 6;
  }
  const next = step + roll;
  if (next > finishStep) return false;
  if (killRequired && !hasKill && next >= mainTrackMax) {
    return false;
  }
  return true;
}
