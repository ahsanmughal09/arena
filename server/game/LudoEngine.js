/**
 * Core Ludo Engine supporting 4-Player Square & 6-Player Hexagonal modes,
 * custom diagonal teaming, server-authoritative move validation, and turn cycling.
 * Features Roll Balance (Dice Stacking) mechanic when rolling 6s,
 * and customizable house rules (extra turn on kill/home, kill required to enter home).
 */

const PLAYER_COLORS_4P = ['red', 'green', 'yellow', 'blue'];
const PLAYER_COLORS_6P = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];

class LudoEngine {
  constructor(mode = '4P', teamMode = 'solo', turnTimer = 30, customRules = {}) {
    this.mode = mode; // '4P' or '6P'
    this.teamMode = teamMode; // 4P: 'solo', '2v2' | 6P: 'solo', '3v3', '2v2v2'
    this.turnTimer = turnTimer;
    
    this.customRules = {
      diceCount: parseInt(customRules.diceCount || 1, 10),
      extraTurnOnKill: customRules.extraTurnOnKill !== false,
      extraTurnOnHome: customRules.extraTurnOnHome !== false,
      killRequiredToEnterHome: customRules.killRequiredToEnterHome !== false
    };

    this.colors = mode === '4P' ? PLAYER_COLORS_4P : PLAYER_COLORS_6P;
    this.trackLength = mode === '4P' ? 52 : 72;
    this.outerTrackLength = mode === '4P' ? 51 : 71;
    this.homeLength = 6;
    this.finishStep = mode === '4P' ? 56 : 76; // -1: yard, 0..outerTrackLength-1: main, outerTrackLength..finishStep: home stretch (56/76 is finished)
    
    this.startPositions = mode === '4P' ? {
      red: 0,
      green: 13,
      yellow: 26,
      blue: 39
    } : {
      red: 0,
      green: 12,
      yellow: 24,
      blue: 36,
      orange: 48,
      purple: 60
    };

    this.safeSpots = mode === '4P' 
      ? [0, 8, 13, 21, 26, 34, 39, 47]
      : [0, 8, 12, 20, 24, 32, 36, 44, 48, 56, 60, 68];

    // Teams mapping
    this.teams = this.initTeams();

    // Player states: { [color]: { name, socketId, connected, kills, tokens: [-1, -1, -1, -1] } }
    this.players = {};
    this.activePlayerIndex = 0;
    this.dicePool = [];
    this.selectedRollIndex = 0;
    this.canRoll = true;
    this.hasExtraTurn = false;
    this.currentDice = null;
    this.consecutiveSixes = 0;
    this.gameStarted = false;
    this.gameOver = false;
    this.winner = null;
    this.validMoves = [];
    this.lastAction = null; // { type, color, tokenIndex, rolled, captured }
  }

  initTeams() {
    const teams = {};
    if (this.mode === '4P') {
      if (this.teamMode === '2v2') {
        teams.red = 'Team Alpha';
        teams.yellow = 'Team Alpha';
        teams.green = 'Team Beta';
        teams.blue = 'Team Beta';
      } else {
        this.colors.forEach(c => teams[c] = c.toUpperCase());
      }
    } else { // 6P
      if (this.teamMode === '3v3') {
        teams.red = 'Team Alpha';
        teams.yellow = 'Team Alpha';
        teams.orange = 'Team Alpha';
        teams.green = 'Team Beta';
        teams.blue = 'Team Beta';
        teams.purple = 'Team Beta';
      } else if (this.teamMode === '2v2v2') {
        teams.red = 'Team Red-Blue';
        teams.blue = 'Team Red-Blue';
        teams.green = 'Team Green-Orange';
        teams.orange = 'Team Green-Orange';
        teams.yellow = 'Team Yellow-Purple';
        teams.purple = 'Team Yellow-Purple';
      } else {
        this.colors.forEach(c => teams[c] = c.toUpperCase());
      }
    }
    return teams;
  }

  addPlayer(color, socketId, name) {
    if (!this.colors.includes(color)) return false;
    this.players[color] = {
      color,
      name: name || color.toUpperCase(),
      socketId,
      connected: true,
      kills: 0,
      tokens: [-1, -1, -1, -1] // step index for 4 tokens
    };
    return true;
  }

  removePlayer(socketId) {
    for (const color of this.colors) {
      if (this.players[color] && this.players[color].socketId === socketId) {
        this.players[color].connected = false;
        return color;
      }
    }
    return null;
  }

  startGame() {
    this.gameStarted = true;
    this.activePlayerIndex = 0;
    this.dicePool = [];
    this.selectedRollIndex = 0;
    this.canRoll = true;
    this.hasExtraTurn = false;
    this.currentDice = null;
    this.consecutiveSixes = 0;
    this.validMoves = [];

    // If 2-player match or fewer than max players, force distinct opponent teams so captures always work!
    const activeColors = Object.keys(this.players).filter(c => this.players[c] && this.players[c].connected);
    if (activeColors.length < (this.mode === '4P' ? 4 : 6) || this.teamMode === 'solo') {
      this.colors.forEach(c => {
        this.teams[c] = c.toUpperCase();
      });
    }
  }

  getActiveColor() {
    return this.colors[this.activePlayerIndex];
  }

  rollDice() {
    if (!this.gameStarted || this.gameOver || !this.canRoll) return null;

    if (this.customRules.diceCount === 2) {
      const roll1 = Math.floor(Math.random() * 6) + 1;
      const roll2 = Math.floor(Math.random() * 6) + 1;
      this.currentDice = [roll1, roll2];

      const isDoubleSix = (roll1 === 6 && roll2 === 6);

      if (isDoubleSix) {
        this.consecutiveSixes += 2;
        if (this.consecutiveSixes >= 4) { // 4 sixes across 2 rolls -> penalty!
          this.consecutiveSixes = 0;
          this.dicePool = [];
          this.canRoll = false;
          this.validMoves = [];
          this.lastAction = { type: 'FOUR_SIXES_PENALTY', color: this.getActiveColor(), rolled: [6, 6] };
          this.nextTurn();
          return { roll: [6, 6], penalty: true, dicePool: [], canRoll: false, validMoves: [] };
        }

        // Double 6s grants extra roll turn!
        this.dicePool.push(6, 6);
        this.canRoll = true;
        this.validMoves = [];
        this.lastAction = { type: 'ROLLED_DOUBLE_SIX', color: this.getActiveColor(), rolled: [6, 6], dicePool: [...this.dicePool] };
        return { roll: [6, 6], penalty: false, dicePool: this.dicePool, canRoll: true, validMoves: [] };
      }

      // Non-double 6s roll (e.g. [6, 4] or [3, 2]): push both, no extra roll turn
      this.consecutiveSixes = 0;
      this.dicePool.push(roll1, roll2);
      this.canRoll = false;

      this.autoSelectValidRoll();

      if (this.validMoves.length === 0) {
        this.lastAction = { type: 'NO_VALID_MOVES', color: this.getActiveColor(), rolled: [roll1, roll2], dicePool: [...this.dicePool] };
      } else {
        this.lastAction = { type: 'ROLLED_DICE', color: this.getActiveColor(), rolled: [roll1, roll2], dicePool: [...this.dicePool] };
      }

      return { roll: [roll1, roll2], penalty: false, dicePool: this.dicePool, canRoll: false, validMoves: this.validMoves };
    }

    // Standard 1-Dice Roll logic
    const roll = Math.floor(Math.random() * 6) + 1;
    this.currentDice = roll;

    if (roll === 6) {
      this.consecutiveSixes++;
      if (this.consecutiveSixes === 3) {
        this.consecutiveSixes = 0;
        this.dicePool = [];
        this.canRoll = false;
        this.lastAction = { type: 'THREE_SIXES_PENALTY', color: this.getActiveColor(), rolled: 6 };
        this.nextTurn();
        return { roll: 6, penalty: true, dicePool: [], canRoll: false, validMoves: [] };
      }

      this.dicePool.push(6);
      this.canRoll = true;
      this.validMoves = [];
      this.lastAction = { type: 'ROLLED_SIX', color: this.getActiveColor(), rolled: 6, dicePool: [...this.dicePool] };
      return { roll: 6, penalty: false, dicePool: this.dicePool, canRoll: true, validMoves: [] };
    }

    // Non-6 rolled
    this.consecutiveSixes = 0;
    this.dicePool.push(roll);
    this.canRoll = false;

    // Find first roll in dicePool that has valid moves
    this.autoSelectValidRoll();

    if (this.validMoves.length === 0) {
      this.lastAction = { type: 'NO_VALID_MOVES', color: this.getActiveColor(), rolled: roll, dicePool: [...this.dicePool] };
    } else {
      this.lastAction = { type: 'ROLLED_NUMBER', color: this.getActiveColor(), rolled: roll, dicePool: [...this.dicePool] };
    }

    return { roll, penalty: false, dicePool: this.dicePool, canRoll: false, validMoves: this.validMoves };
  }

  autoSelectValidRoll() {
    const activeColor = this.getActiveColor();
    for (let i = 0; i < this.dicePool.length; i++) {
      const vm = this.calculateValidMoves(activeColor, this.dicePool[i]);
      if (vm.length > 0) {
        this.selectedRollIndex = i;
        this.validMoves = vm;
        return true;
      }
    }
    // If no remaining rolls have any valid moves
    this.selectedRollIndex = 0;
    this.validMoves = [];
    return false;
  }

  selectRoll(rollIndex) {
    if (rollIndex < 0 || rollIndex >= this.dicePool.length) return false;
    this.selectedRollIndex = rollIndex;
    this.validMoves = this.calculateValidMoves(this.getActiveColor(), this.dicePool[rollIndex]);
    return true;
  }

  hasOpponentTokenAt(myColor, absStep) {
    for (const c of this.colors) {
      if (c === myColor) continue;
      const p = this.players[c];
      if (!p) continue;
      for (const step of p.tokens) {
        if (step >= 0 && step < this.outerTrackLength) {
          const pAbs = (this.startPositions[c] + step) % this.trackLength;
          if (pAbs === absStep) return true;
        }
      }
    }
    return false;
  }

  calculateValidMoves(color, roll) {
    const player = this.players[color];
    if (!player || !roll) return [];

    const valid = [];
    const outerLen = this.outerTrackLength || (this.mode === '4P' ? 51 : 71);
    const lastSafeStep = this.mode === '4P' ? 47 : 68;
    const hasKill = ((player.kills || 0) > 0);
    const killRequired = !!this.customRules.killRequiredToEnterHome;

    player.tokens.forEach((step, tokenIndex) => {
      if (step === -1) {
        // Token in yard: needs 6 to enter start spot
        if (roll === 6) {
          valid.push(tokenIndex);
        }
      } else if (step >= outerLen) {
        // Token is inside home stretch
        if (step + roll <= this.finishStep) {
          valid.push(tokenIndex);
        }
      } else {
        // Token is on main perimeter track (0..outerLen-1)
        const targetStep = step + roll;

        if (!killRequired || hasKill) {
          // Unrestricted home entry if kill is not required or player already has a kill
          if (targetStep <= this.finishStep) {
            valid.push(tokenIndex);
          }
        } else {
          // Kill is required & player has 0 kills
          if (targetStep <= lastSafeStep) {
            // Moving up to safe square (47 in 4P, 68 in 6P) is always valid
            valid.push(tokenIndex);
          } else if (targetStep < outerLen) {
            // Target is past safe square (steps 48..50 in 4P, 69..70 in 6P)
            // Valid ONLY if landing on an opponent token to kill it!
            const targetAbsPos = (this.startPositions[color] + targetStep) % this.trackLength;
            if (!this.safeSpots.includes(targetAbsPos) && this.hasOpponentTokenAt(color, targetAbsPos)) {
              valid.push(tokenIndex);
            }
          }
        }
      }
    });

    return valid;
  }

  // Convert token's relative step (-1, 0..finishStep) to absolute board step (0..trackLength-1 or home identifier)
  getGlobalPosition(color, step) {
    if (step === -1) return { type: 'YARD', color, id: `yard-${color}` };
    const outerLen = this.outerTrackLength || (this.mode === '4P' ? 51 : 71);
    if (step >= outerLen) {
      const homeIdx = step - outerLen;
      return { type: 'HOME_PATH', color, step: homeIdx, id: `home-${color}-${homeIdx}` };
    }
    
    const startPos = this.startPositions[color];
    const absStep = (startPos + step) % this.trackLength;
    return { type: 'MAIN', step: absStep, id: `main-${absStep}` };
  }

  moveToken(color, tokenIndex, explicitRollIndex = null) {
    if (color !== this.getActiveColor() || this.canRoll || this.dicePool.length === 0) return null;

    let useIndex = explicitRollIndex !== null ? explicitRollIndex : this.selectedRollIndex;
    if (useIndex < 0 || useIndex >= this.dicePool.length) {
      useIndex = this.selectedRollIndex;
    }

    const roll = this.dicePool[useIndex];
    const currentValid = this.calculateValidMoves(color, roll);
    if (!currentValid.includes(tokenIndex)) return null;

    const player = this.players[color];
    const oldStep = player.tokens[tokenIndex];

    let newStep;
    if (oldStep === -1) {
      newStep = 0; // enter track at step 0
    } else {
      newStep = oldStep + roll;
    }

    player.tokens[tokenIndex] = newStep;
    const oldPos = this.getGlobalPosition(color, oldStep);
    const newPos = this.getGlobalPosition(color, newStep);

    let captured = null;
    // Check capture only if landing on main loop track
    if (newPos.type === 'MAIN' && !this.safeSpots.includes(newPos.step)) {
      captured = this.checkCapture(color, newPos.step);
    }

    const reachesHome = (newStep === this.finishStep && oldStep !== this.finishStep);

    // Remove executed roll from dicePool
    this.dicePool.splice(useIndex, 1);

    // Check extra turn rules
    const extraOnKill = (captured !== null) && this.customRules.extraTurnOnKill;
    const extraOnHome = reachesHome && this.customRules.extraTurnOnHome;

    if (extraOnKill || extraOnHome) {
      this.hasExtraTurn = true;
    }

    this.lastAction = {
      type: 'MOVE',
      color,
      tokenIndex,
      oldStep,
      newStep,
      rolled: roll,
      captured,
      reachesHome
    };

    // Check Win Condition
    const gameWon = this.checkWinCondition();
    if (gameWon) {
      this.gameOver = true;
      this.winner = this.teams[color] || color;
      return { success: true, gameOver: true, winner: this.winner, action: this.lastAction };
    }

    // Check remaining dice pool
    if (this.dicePool.length > 0) {
      const hasMoves = this.autoSelectValidRoll();
      if (!hasMoves) {
        // No remaining valid moves for any dice in pool -> clear pool
        this.dicePool = [];
        if (this.hasExtraTurn) {
          this.grantExtraTurn();
        } else {
          this.nextTurn();
        }
      }
    } else {
      // Pool empty -> check extra turn or pass turn
      if (this.hasExtraTurn) {
        this.grantExtraTurn();
      } else {
        this.nextTurn();
      }
    }

    return { success: true, gameOver: false, action: this.lastAction };
  }

  grantExtraTurn() {
    this.hasExtraTurn = false;
    this.dicePool = [];
    this.selectedRollIndex = 0;
    this.canRoll = true;
    this.currentDice = null;
    this.consecutiveSixes = 0;
    this.validMoves = [];
  }

  checkCapture(movingColor, targetMainStep) {
    const movingTeam = this.teams[movingColor];

    for (const color of this.colors) {
      // Don't capture own tokens or teammate's tokens
      if (this.teams[color] === movingTeam) continue;

      const otherPlayer = this.players[color];
      if (!otherPlayer) continue;

      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const step = otherPlayer.tokens[tIdx];
        const globalPos = this.getGlobalPosition(color, step);

        if (globalPos.type === 'MAIN' && globalPos.step === targetMainStep) {
          // Send captured token back to yard (-1)
          otherPlayer.tokens[tIdx] = -1;
          if (this.players[movingColor]) {
            this.players[movingColor].kills = (this.players[movingColor].kills || 0) + 1;
          }
          return { color, tokenIndex: tIdx, oldStep: step };
        }
      }
    }
    return null;
  }

  checkWinCondition() {
    // Check if team of active player has completed all member tokens
    const teamName = this.teams[this.getActiveColor()];
    const teamColors = this.colors.filter(c => this.teams[c] === teamName);

    for (const c of teamColors) {
      const p = this.players[c];
      if (!p) return false;
      const allFinished = p.tokens.every(step => step === this.finishStep);
      if (!allFinished) return false;
    }
    return true;
  }

  nextTurn() {
    this.dicePool = [];
    this.selectedRollIndex = 0;
    this.canRoll = true;
    this.hasExtraTurn = false;
    this.currentDice = null;
    this.validMoves = [];
    let nextIdx = (this.activePlayerIndex + 1) % this.colors.length;

    // Loop until we find a player who hasn't fully finished all tokens (if game still running)
    let attempts = 0;
    while (attempts < this.colors.length) {
      const nextColor = this.colors[nextIdx];
      const p = this.players[nextColor];
      if (p && p.connected && !p.tokens.every(s => s === this.finishStep)) {
        this.activePlayerIndex = nextIdx;
        return;
      }
      nextIdx = (nextIdx + 1) % this.colors.length;
      attempts++;
    }
  }

  getGameState() {
    return {
      mode: this.mode,
      teamMode: this.teamMode,
      turnTimer: this.turnTimer,
      customRules: this.customRules,
      colors: this.colors,
      teams: this.teams,
      players: this.players,
      activeColor: this.getActiveColor(),
      currentDice: this.dicePool[this.selectedRollIndex] || this.currentDice || null,
      dicePool: this.dicePool,
      selectedRollIndex: this.selectedRollIndex,
      canRoll: this.canRoll,
      hasExtraTurn: this.hasExtraTurn,
      validMoves: this.validMoves,
      gameStarted: this.gameStarted,
      gameOver: this.gameOver,
      winner: this.winner,
      safeSpots: this.safeSpots,
      lastAction: this.lastAction
    };
  }
}

module.exports = LudoEngine;
