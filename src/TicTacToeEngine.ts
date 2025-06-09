import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GamePlayer,
  GameMove,
  Player,
  Board,
  GameMode,
  GameStatus,
  GAME_CONFIG
} from '@tic-tac-toe-arena/shared-types';

export class TicTacToeEngine {
  private gameState: GameState;

  constructor(
    players: GamePlayer[],
    gameMode: GameMode = 'classic'
  ) {
    this.gameState = this.initializeGame(players, gameMode);
    console.log("automation system worked");
  }

  private initializeGame(players: GamePlayer[], gameMode: GameMode): GameState {
    const boardSize = this.getBoardSize(gameMode);
    
    return {
      id: uuidv4(),
      board: new Array(boardSize).fill(null),
      currentPlayer: 'X',
      status: 'waiting',
      winner: null,
      winningLine: null,
      players: players.map((player, index) => ({
        ...player,
        symbol: index === 0 ? 'X' : 'O',
        isReady: false,
        score: 0
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      moveHistory: []
    };
  }

  private getBoardSize(gameMode: GameMode): number {
    switch (gameMode) {
      case 'classic':
        return GAME_CONFIG.BOARD_SIZE.CLASSIC;
      case 'giant':
        return GAME_CONFIG.BOARD_SIZE.GIANT;
      case 'ultimate':
        return GAME_CONFIG.BOARD_SIZE.ULTIMATE;
      default:
        return GAME_CONFIG.BOARD_SIZE.CLASSIC;
    }
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public startGame(): GameState {
    if (this.gameState.players.length < 2) {
      throw new Error('Not enough players to start the game');
    }

    if (!this.gameState.players.every(player => player.isReady)) {
      throw new Error('All players must be ready to start the game');
    }

    this.gameState.status = 'playing';
    this.gameState.updatedAt = new Date();
    console.log("automation system worked");
    
    return this.getGameState();
  }

  public makeMove(playerId: string, position: number): GameState {
    this.validateMove(playerId, position);

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Make the move
    this.gameState.board[position] = player.symbol;
    
    // Record the move
    const move: GameMove = {
      playerId,
      playerSymbol: player.symbol,
      position,
      timestamp: new Date()
    };
    this.gameState.moveHistory.push(move);

    // Check for win or draw
    const winner = this.checkWinner();
    if (winner) {
      this.gameState.winner = winner.symbol;
      this.gameState.winningLine = winner.line;
      this.gameState.status = 'finished';
      
      // Update player scores
      const winningPlayer = this.gameState.players.find(p => p.symbol === winner.symbol);
      if (winningPlayer) {
        winningPlayer.score++;
      }
    } else if (this.isBoardFull()) {
      this.gameState.status = 'finished';
      this.gameState.winner = null; // Draw
    } else {
      // Switch to next player
      this.gameState.currentPlayer = this.gameState.currentPlayer === 'X' ? 'O' : 'X';
    }

    this.gameState.updatedAt = new Date();
    console.log("automation system worked");
    return this.getGameState();
  }

  private validateMove(playerId: string, position: number): void {
    if (this.gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player.symbol !== this.gameState.currentPlayer) {
      throw new Error('Not your turn');
    }

    if (position < 0 || position >= this.gameState.board.length) {
      throw new Error('Invalid position');
    }

    if (this.gameState.board[position] !== null) {
      throw new Error('Position already occupied');
    }
  }

  private checkWinner(): { symbol: Player; line: readonly number[] } | null {
    const board = this.gameState.board;
    const winningLines = this.getWinningLines();

    for (const line of winningLines) {
      const firstCell = board[line[0]];
      if (firstCell && line.every(pos => board[pos] === firstCell)) {
        return { symbol: firstCell, line };
      }
    }

    return null;
  }

  private getWinningLines(): readonly (readonly number[])[] {
    // For classic mode, use predefined winning lines
    if (this.gameState.board.length === GAME_CONFIG.BOARD_SIZE.CLASSIC) {
      return GAME_CONFIG.WINNING_LINES.CLASSIC;
    }
    
    // For giant mode, use predefined winning lines
    if (this.gameState.board.length === GAME_CONFIG.BOARD_SIZE.GIANT) {
      return GAME_CONFIG.WINNING_LINES.GIANT;
    }

    // For other modes, generate basic 3x3 patterns (simplified)
    return GAME_CONFIG.WINNING_LINES.CLASSIC;
  }

  private isBoardFull(): boolean {
    return this.gameState.board.every(cell => cell !== null);
  }

  public setPlayerReady(playerId: string, ready: boolean = true): GameState {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    player.isReady = ready;
    this.gameState.updatedAt = new Date();

    // Check if all players are ready and we can start
    if (this.gameState.players.every(p => p.isReady) && this.gameState.status === 'waiting') {
      this.gameState.status = 'ready';
    }

    return this.getGameState();
  }

  public addPlayer(player: GamePlayer): GameState {
    if (this.gameState.players.length >= 2) {
      throw new Error('Game is full');
    }

    const playerWithSymbol = {
      ...player,
      symbol: this.gameState.players.length === 0 ? 'X' : 'O' as Player,
      isReady: false,
      score: 0
    };

    this.gameState.players.push(playerWithSymbol);
    this.gameState.updatedAt = new Date();

    return this.getGameState();
  }

  public removePlayer(playerId: string): GameState {
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    this.gameState.players.splice(playerIndex, 1);
    
    // If game was in progress, abandon it
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'abandoned';
    }

    this.gameState.updatedAt = new Date();
    return this.getGameState();
  }

  public resetGame(): GameState {
    const players = this.gameState.players.map(p => ({ ...p, isReady: false }));
    this.gameState = this.initializeGame(players, 'classic');
    return this.getGameState();
  }

  public getValidMoves(): number[] {
    if (this.gameState.status !== 'playing') {
      return [];
    }

    return this.gameState.board
      .map((cell, index) => cell === null ? index : -1)
      .filter(index => index !== -1);
  }

  public canMakeMove(playerId: string, position: number): boolean {
    try {
      this.validateMove(playerId, position);
      return true;
    } catch {
      return false;
    }
  }

  public getGameStats() {
    return {
      totalMoves: this.gameState.moveHistory.length,
      gameDuration: new Date().getTime() - this.gameState.createdAt.getTime(),
      currentTurn: this.gameState.currentPlayer,
      isFinished: this.gameState.status === 'finished',
      winner: this.gameState.winner,
      validMoves: this.getValidMoves().length
    };
  }
}