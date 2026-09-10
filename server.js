// server.js - 港式台牌麻將遊戲伺服器
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const taiCalculator = require('./taiCalculator');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const ACTION_PRIORITY = {
    'win': 4,      // 胡最大
    'kong': 3,     // 槓第二
    'pong': 3,     // 碰跟槓同級 (同一張牌不可能同時有人能碰跟槓)
    'chow': 2,     // 吃最小
    'pass': 1,     // 過
    'none': 0      // 沒回應
};

// ============================================
// server.js - 完整遞迴回溯版（放在 GameRoom 類別外面）
// ============================================

// server.js - 分析一種花色的所有可能組合
function analyzeSuit(numbers) {
    if (numbers.length === 0) {
        return [{ melds: 0, pairs: 0 }];
    }
    
    const results = [];
    const counts = {};
    for (let num of numbers) counts[num] = (counts[num] || 0) + 1;
    
    function tryForm(remaining, melds, pairs) {
        let first = null;
        for (let i = 1; i <= 9; i++) {
            if (remaining[i] > 0) {
                first = i;
                break;
            }
        }
        
        if (first === null) {
            results.push({ melds, pairs });
            return;
        }
        
        const count = remaining[first];
        
        // ✅ 嘗試組成刻子
        if (count >= 3) {
            const newRemaining = {...remaining};
            newRemaining[first] -= 3;
            if (newRemaining[first] === 0) delete newRemaining[first];
            tryForm(newRemaining, melds + 1, pairs);
        }
        
        // ✅ 嘗試組成順子
        if (first <= 7 && (remaining[first+1] || 0) > 0 && (remaining[first+2] || 0) > 0) {
            const newRemaining = {...remaining};
            newRemaining[first]--;
            newRemaining[first+1]--;
            newRemaining[first+2]--;
            if (newRemaining[first] === 0) delete newRemaining[first];
            if (newRemaining[first+1] === 0) delete newRemaining[first+1];
            if (newRemaining[first+2] === 0) delete newRemaining[first+2];
            tryForm(newRemaining, melds + 1, pairs);
        }
        
        // ✅ 嘗試組成雀頭
        if (count >= 2 && pairs === 0) {
            const newRemaining = {...remaining};
            newRemaining[first] -= 2;
            if (newRemaining[first] === 0) delete newRemaining[first];
            tryForm(newRemaining, melds, pairs + 1);
        }
        
        // ✅ 新增：跳過這張牌，什麼都不做
        const newRemaining = {...remaining};
        delete newRemaining[first];
        tryForm(newRemaining, melds, pairs);
    }
    
    tryForm(counts, 0, 0);
    
    const unique = [];
    const seen = new Set();
    for (let r of results) {
        const key = `${r.melds},${r.pairs}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(r);
        }
    }
    
    return unique.length > 0 ? unique : [{ melds: 0, pairs: 0 }];
}

// server.js - 最上層
// server.js - 最上層
function analyzeSuitOneMissing(numbers) {
    const candidates = new Set();
    for (let num of numbers) {
        candidates.add(num);
        if (num > 1) candidates.add(num - 1);
        if (num < 9) candidates.add(num + 1);
    }
    
    // 先檢查原本是否完整
    const original = analyzeSuit(numbers);
    const hasComplete = original.some(r => r.pairs === 1 && r.melds >= 0);
    // 檢查：numbers 長度 % 3 == 2 且能找到 melds + 1 pair
    const totalMeldsNeeded = Math.floor(numbers.length / 3);
    
    for (let r of original) {
        if (r.pairs === 1 && r.melds === totalMeldsNeeded) {
            return { missing: 0 }; // 原本就完整
        }
    }
    
    // 嘗試加入候選牌
    for (let candidate of candidates) {
        const testNumbers = [...numbers, candidate].sort((a, b) => a - b);
        const results = analyzeSuit(testNumbers);
        const totalMeldsNeededForTest = Math.floor(testNumbers.length / 3);
        
        for (let r of results) {
            if (r.pairs === 1 && r.melds === totalMeldsNeededForTest) {
                return { missing: 1 };
            }
        }
    }
    
    return false;
}

// ============================================
// 遊戲狀態管理
// ============================================

class GameRoom {
  constructor(roomId, settings) {
    this.roomId = roomId;
    this.settings = settings;
    this.players = new Map();
    this.playerOrder = [];
    this.gameState = 'waiting';
    this.currentTurn = 0;
    this.dealer = 0;
    // 🌟 新增：追蹤圈數與局數
    this.windRound = 0; // 0:東圈, 1:南圈, 2:西圈, 3:北圈
    this.dealerRound = 0; // 0:東局, 1:南局, 2:西局, 3:北局
    this.startingDealer = -1; // 記錄起莊玩家
    this.dealerKeeps = false; // 是否連莊
    this.dealerConsecutive = 0;
    // 🌟 新增：骰子與換牌狀態
    this.diceValues = [];
    this.exchangeData = new Map(); // 記錄玩家交出的換牌
    this.exchangeDieRoll = 0; 
    this.exchangeRequiredCount = 0;
    this.wall = [];
    this.discardPile = [];
    this.lastDiscard = null;
    this.lastDiscardPlayer = null;
    this.waitingForAction = null;
    this.pendingActions = [];
    this.flowerReplacements = new Map();
    this.kongReplacements = new Map();
    this.gameLog = [];
    this.roundWinClaims = [];
    this.consecutiveDiscards = []; // 追蹤連續打牌歷史
    this.lastRoundMultiWinBlaster = null;
    this.lastRoundMultiWinners = [];
    this.roomStats = new Map();
   this.pullLedger = {};
for(let i=0; i<4; i++) {
    this.pullLedger[i] = {};
    for(let j=0; j<4; j++) {
        this.pullLedger[i][j] = { amount: 0, count: 0 };
    }
}
this.turnTimer = null;   // 🌟 伺服器打牌倒數計時器
    this.actionTimer = null; // 🌟 伺服器吃碰槓倒數計時器
  }

  clearTimers() {
      if (this.turnTimer) { clearTimeout(this.turnTimer); this.turnTimer = null; }
      if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = null; }
  }

// 🌟 升級版：即時加減分 + 保留拉莊倍數面板
processPulling(winnerSeat, loserSeat, currentScore, isSelfDraw) {
    const winner = this.getPlayerBySeatIndex(winnerSeat);
    const loser = this.getPlayerBySeatIndex(loserSeat);
    if (!winner || !loser) return;

    // 🌟 記錄這局活躍的拉莊關係，防止被後面的 cleanup 清掉
    this.activePullsThisRound = this.activePullsThisRound || [];
    this.activePullsThisRound.push(`${winnerSeat}-${loserSeat}`);


    // 1. 斷纜與踢半 (因為已經即時付過錢了，這裡只需清空帳本即可)
    for (let creditorSeat = 0; creditorSeat < 4; creditorSeat++) {
        let debtData = this.pullLedger[creditorSeat][winnerSeat];
        if (debtData.amount > 0) {
            if (isSelfDraw || loserSeat === creditorSeat) {
                this.broadcastGameMessage(`⚔️ 踢半！${winner.name} 結清了對 ${this.getPlayerBySeatIndex(creditorSeat).name} 的連拉狀態`, 'system');
            } else {
                this.broadcastGameMessage(`💔 斷纜！${winner.name} 結清了對 ${this.getPlayerBySeatIndex(creditorSeat).name} 的連拉狀態`, 'system');
            }
            // 歸零帳本，重新計算
            debtData.amount = 0;
            debtData.count = 0; 
        }
    }

    // 2. 拉人 (計算倍率，並【即時更新計分板】)
    let currentDebt = this.pullLedger[winnerSeat][loserSeat];
    if (currentDebt.amount > 0) {
        // 計算這局加上 1.5 倍拉莊倍率後，總共累積多少
        let newTotalAmount = Math.ceil(currentDebt.amount * 1.5) + currentScore;
        
        // 🌟 核心：算出「這局實際上該掏出多少錢」 (新總數 - 之前已經付過的總數)
        let roundPayout = newTotalAmount - currentDebt.amount;
        
        // 【即時轉帳】
        winner.score += roundPayout;
        loser.score -= roundPayout;
        
        currentDebt.amount = newTotalAmount;
        currentDebt.count += 1;
        this.broadcastGameMessage(`⛓️ 拉${currentDebt.count}！${winner.name} 拉 ${loser.name}，即時轉帳 ${roundPayout} 分 (總記數：${currentDebt.amount})`, 'system');
    } else {
        // 第一次起拉
        winner.score += currentScore;
        loser.score -= currentScore;
        
        currentDebt.amount = currentScore;
        currentDebt.count = 1;
        this.broadcastGameMessage(`🔗 起拉！${winner.name} 開始拉 ${loser.name}，即時轉帳 ${currentScore} 分`, 'system');
    }
}
 getCustomTaiRules() {
      const customRules = JSON.parse(JSON.stringify(taiCalculator.DefaultRules));

      if (this.settings.customTaiTable) {
          const customTable = this.settings.customTaiTable;
          
          for (let patternKey in customTable) {
              const customSetting = customTable[patternKey];

              for (let category in customRules) {
                  if (customRules[category] && customRules[category][patternKey]) {
                      // 🌟 同時覆寫開關與番數！
                      customRules[category][patternKey].enabled = customSetting.enabled;
                      customRules[category][patternKey].tai = parseInt(customSetting.tai);
                      break; 
                  }
              }
          }
      }
      return customRules;
  }
// 🌟 新增：即時賞罰轉帳引擎（加入 try-catch 防崩潰保護）
  executeInstantPayout(triggerSeat, targetSeats, baseAmount, reason, type) {
      try {
          const pointsPerBase = 5; // 1底 = 5分
          const points = baseAmount * pointsPerBase;
          const triggerPlayer = this.getPlayerBySeatIndex(triggerSeat);
          if (!triggerPlayer) return;

          let totalTransfer = 0;

          for (let seat of targetSeats) {
              if (seat === triggerSeat) continue;
              const targetPlayer = this.getPlayerBySeatIndex(seat);
              if (targetPlayer && targetPlayer.isOnline) {
                  if (type === 'collect') {
                      targetPlayer.score -= points;
                      totalTransfer += points;
                  } else if (type === 'penalize') {
                      targetPlayer.score += points;
                      totalTransfer -= points;
                  }
              }
          }

          triggerPlayer.score += totalTransfer;

          // 安全紀錄大賽進出底數
          const triggerSocketId = this.playerOrder[triggerSeat];
          if (triggerSocketId) {
              const tStats = this.roomStats.get(triggerSocketId);
              if (tStats) tStats.totalInstantPayouts += Math.abs(baseAmount);
          }

          const actionName = type === 'collect' ? '獲得' : '支付';
          const msg = `✨ [特別賞罰] ${triggerPlayer.name} 觸發【${reason}】${actionName} ${baseAmount} 底 (${Math.abs(totalTransfer)} 分)`;
          
          console.log(`💰 執行即時轉帳: ${msg}`);
          
          // 廣播給全場
          this.broadcastGameMessage(msg, 'system');
          this.broadcastGameState();
          this.broadcastPlayerState();
      } catch (e) {
          console.error("❌ 即時賞罰發生錯誤:", e);
      }
  }
  // 🌟 新增：花牌即時賞罰檢測（一枱花 / 一枱草防重分配算法）
  checkFlowerInstantPayout(player) {
      player.usedFlowerIds = player.usedFlowerIds || new Set();
      const fMap = {
          '春': { n: 1, g: 'cao' }, '夏': { n: 2, g: 'cao' }, '秋': { n: 3, g: 'cao' }, '冬': { n: 4, g: 'cao' },
          '梅': { n: 1, g: 'hua' }, '蘭': { n: 2, g: 'hua' }, '竹': { n: 3, g: 'hua' }, '菊': { n: 4, g: 'hua' }
      };

      let found = true;
      while (found) {
          found = false;
          const available = { 1: [], 2: [], 3: [], 4: [] };
          
          for (let f of player.flowers) {
              if (player.usedFlowerIds.has(f.id)) continue;
              const info = fMap[f.value];
              if (info) available[info.n].push({ id: f.id, g: info.g });
          }

          if (available[1].length > 0 && available[2].length > 0 && available[3].length > 0 && available[4].length > 0) {
              let selected = null;
              
              // 優先提取：純一枱花 (梅蘭竹菊)
              if (available[1].some(f => f.g === 'hua') && available[2].some(f => f.g === 'hua') && available[3].some(f => f.g === 'hua') && available[4].some(f => f.g === 'hua')) {
                  selected = [available[1].find(f => f.g === 'hua'), available[2].find(f => f.g === 'hua'), available[3].find(f => f.g === 'hua'), available[4].find(f => f.g === 'hua')];
                  for (let f of selected) player.usedFlowerIds.add(f.id);
                  this.executeInstantPayout(player.seatIndex, [0, 1, 2, 3], 1, '一枱花(梅蘭竹菊)', 'collect');
                  found = true;
              }
              // 優先提取：純一枱花 (春夏秋冬)
              else if (available[1].some(f => f.g === 'cao') && available[2].some(f => f.g === 'cao') && available[3].some(f => f.g === 'cao') && available[4].some(f => f.g === 'cao')) {
                  selected = [available[1].find(f => f.g === 'cao'), available[2].find(f => f.g === 'cao'), available[3].find(f => f.g === 'cao'), available[4].find(f => f.g === 'cao')];
                  for (let f of selected) player.usedFlowerIds.add(f.id);
                  this.executeInstantPayout(player.seatIndex, [0, 1, 2, 3], 1, '一枱花(春夏秋冬)', 'collect');
                  found = true;
              }
              // 混合提取：一枱草 (任意混搭 1234)
              else {
                  selected = [available[1][0], available[2][0], available[3][0], available[4][0]];
                  for (let f of selected) player.usedFlowerIds.add(f.id);
                  this.executeInstantPayout(player.seatIndex, [0, 1, 2, 3], 0.5, '一枱草', 'collect');
                  found = true;
              }
          }
      }
  }
  
  canPlayerWin(playerId) {
    const player = this.players.get(playerId);
    
    // 🌟 核心防呆：如果玩家手裡根本沒有牌（例如剛創好房間還在大廳），直接返回，不要去算台機！
    if (!player || !player.hand || player.hand.length === 0) return false;
    
    // 🌟 直接將判定權交給考量了副露數量的 checkCanWin，徹底解除 17 張的限制！
    return this.checkCanWin(playerId);
  }

  canPlayerWinByIndex(playerIndex) {
    const socketId = this.playerOrder[playerIndex];
    if (!socketId) return false;
    return this.canPlayerWin(socketId);
  }

  getPrivatePlayerState(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;
    return {
        hand: player.hand,
        melds: player.melds,
        flowers: player.flowers,
        canWin: this.canPlayerWin(socketId),
        availableActions: this.getAvailableActions(socketId)
    };
  }

  addPlayer(socketId, playerData) {
    if (this.players.size >= 4) return false;
    const seatIndex = this.playerOrder.length;
    const player = {
      socketId, id: playerData.id, name: playerData.name,
      seatIndex, hand: [], melds: [], flowers: [],
      score: playerData.initialScore || 0, isReady: false,
      isOnline: true, isDealer: false, hasWon: false, hasDiscarded: false,
      isAI: playerData.isAI || false,
      // ✅ 加入叮牌相關屬性
      isAFK: false, // 🌟 新增託管屬性
      isTing: false,
      tingType: null,
      isEatTing: false,
      isMenqingTing: false,
      hasDrawnAfterTing: false,
      tingJiEligible: false,
    };
    this.players.set(socketId, player);
    this.playerOrder.push(socketId);
    this.roomStats.set(socketId, { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 });
    return true;
}

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      player.isOnline = false;
      if (this.gameState === 'playing') {
        this.broadcastGameMessage(`${player.name} 已斷線`);
      }
    }
  }

  getPlayerBySocketId(socketId) { return this.players.get(socketId); }

 // server/server.js 裡面的座位搜尋引擎
  getPlayerBySeatIndex(seatIndex) {
    try {
        // 🌟 核心修正：
        // 1. 使用 Array.from 將 Map 的 values 轉為陣列
        // 2. 用 parseInt(seatIndex) 強制將型態轉為純數字，防止前端傳字串進來比對失敗
        // 3. 採用嚴格等於 '===' 進行比對
        const foundPlayer = Array.from(this.players.values()).find(p => p.seatIndex === parseInt(seatIndex));
        
        // 找不到就乖乖回傳 null，絕對不要盲目回傳第一個玩家！
        return foundPlayer || null; 
    } catch (e) {
        console.error("搜尋座位玩家失敗:", e);
        return null;
    }
  }

  getCurrentPlayer() { return this.getPlayerBySeatIndex(this.currentTurn); }

  getNextPlayerIndex(currentIndex = null) {
    const startIndex = currentIndex !== null ? currentIndex : this.currentTurn;
    
    let attempts = 0;
    while (attempts < 4) {
        // 🌟 修正：取消原本混亂的 ccwOrder，直接用標準座位順序遞增，視覺上就是完美逆時針
        const nextIndex = (startIndex + 1 + attempts) % 4; 
        const player = this.getPlayerBySeatIndex(nextIndex);
        if (player && player.isOnline && !player.hasWon) return nextIndex;
        attempts++;
    }
    return -1;
  }

  allPlayersReady() {
    let readyCount = 0;
    for (let player of this.players.values()) { 
        if (player.isReady) readyCount++; 
    }
    // 🌟 核心修正：大廳必須「目前房間內所有人」都按了準備，且至少要有1人，才會觸發開局！
    return readyCount === this.players.size && this.players.size > 0;
  }

  broadcastGameState() { io.to(this.roomId).emit('gameStateUpdate', this.getPublicGameState()); }

  broadcastPlayerState() { io.to(this.roomId).emit('playersUpdate', this.getPublicPlayersState()); }

  broadcastGameMessage(message, type = 'info') {
    io.to(this.roomId).emit('gameMessage', { message, type, timestamp: Date.now() });
    this.gameLog.push({ message, type, timestamp: Date.now() });
  }

  getPublicGameState() {
    return {
        roomId: this.roomId, gameState: this.gameState, currentTurn: this.currentTurn,
        dealer: this.dealer, 
        windRound: this.windRound,     // 🌟 新增
        dealerRound: this.dealerRound, // 🌟 新增
        diceValues: this.diceValues,
        exchangeDieRoll: this.exchangeDieRoll,         
        exchangeRequiredCount: this.exchangeRequiredCount,
        discardPile: this.discardPile, lastDiscard: this.lastDiscard,
        wallCount: this.wall.length, waitingForAction: this.waitingForAction, settings: this.settings,
        pullLedger: this.pullLedger
    };
  }

 // 取得安全的公開玩家狀態
  getPublicPlayersState(forceReveal = false) {
      // 🌟 核心修正：加入 'summary' 狀態，讓大結算階段也能光明正大開牌！
      const revealAll = forceReveal || this.gameState === 'finished' || this.gameState === 'summary';
      
      return Array.from(this.players.values()).map(p => {
          return {
              seatIndex: p.seatIndex,
              id: p.socketId,
              name: p.name,
              score: p.score,
              isDealer: p.isDealer,
              isTing: p.isTing,
              isReady: p.isReady,
              isAFK: p.isAFK,
              handCount: p.hand.length,
              flowersCount: p.flowers.length,
              meldsCount: p.melds.length,
              // 🌟 如果是結算狀態，就把真實手牌傳給 Unity 讓它攤牌
              hand: revealAll ? p.hand : null, 
              flowers: p.flowers,
              melds: p.melds
          };
      });
  }
  initializeWall() {
    const wall = [];
    const suits = ['wan', 'tong', 'tiao'];
    for (let suit of suits) {
      for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 4; j++) {
          wall.push({ id: uuidv4(), type: 'number', suit, value: i.toString() });
        }
      }
    }
    const honors = ['東', '南', '西', '北', '中', '發', '白'];
    for (let honor of honors) {
      for (let i = 0; i < 4; i++) {
        wall.push({ id: uuidv4(), type: 'honor', suit: 'honor', value: honor });
      }
    }
    const flowers = ['春', '夏', '秋', '冬', '梅', '蘭', '竹', '菊'];
    for (let flower of flowers) {
      wall.push({ id: uuidv4(), type: 'flower', suit: 'flower', value: flower });
    }
    this.shuffleArray(wall);
    this.wall = wall;
    return wall;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  dealTiles() {
    this.initializeWall();

    // 🛡️ 1. 全員狀態清空防護（確保每一局乾乾淨淨）
    for (let [socketId, p] of this.players) {
        if (p) {
            p.hand = [];
            p.flowers = [];
            p.melds = [];
        }
    }

    // 🌟 2. 16輪發牌大迴圈（4家輪流拿牌）
    for (let i = 0; i < 16; i++) {
        for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
            const player = this.getPlayerBySeatIndex(seatIndex); 
            if (player) {
                const tile = this.wall.pop();
                if (tile.type === 'flower') {
                    player.flowers.push(tile);
                    this.checkFlowerInstantPayout(player);
                    const replacement = this.wall.pop();
                    player.hand.push(replacement);
                } else { 
                    player.hand.push(tile); 
                }
            }
        } // 👈 精準閉合 seatIndex 迴圈
    } // 👈 精準閉合 i 迴圈

    // 🌟 3. 莊家單獨抽取第 17 張開局牌（移到迴圈外面了！）
    const dealerPlayer = this.getPlayerBySeatIndex(this.dealer);
    if (dealerPlayer) {
        const tile = this.wall.pop();
        if (tile.type === 'flower') {
            dealerPlayer.flowers.push(tile);
            this.checkFlowerInstantPayout(dealerPlayer); // ✅ 已對齊莊家變數
            const replacement = this.wall.pop();
            dealerPlayer.hand.push(replacement);
        } else { 
            dealerPlayer.hand.push(tile); 
        }
    }

    // 🌟 4. 全員自動理牌排序
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
        const player = this.getPlayerBySeatIndex(seatIndex);
        if (player) this.sortHand(player);
    }
    
    this.checkInitialFlowers();
  }

  sortHand(player) {
    const suitOrder = { 'wan': 1, 'tong': 2, 'tiao': 3, 'honor': 4 };
    const honorOrder = { '東': 1, '南': 2, '西': 3, '北': 4, '中': 5, '發': 6, '白': 7 };
    player.hand.sort((a, b) => {
        if (a.type === 'flower' && b.type !== 'flower') return 1;
        if (a.type !== 'flower' && b.type === 'flower') return -1;
        if (a.type === 'flower' && b.type === 'flower') return 0;
        if (a.suit !== b.suit) return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
        if (a.type === 'honor' || b.type === 'honor') return (honorOrder[a.value] || 99) - (honorOrder[b.value] || 99);
        return parseInt(a.value) - parseInt(b.value);
    });
  }

  checkInitialFlowers() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      const player = this.getPlayerBySeatIndex(seatIndex);
      if (player) {
        const flowersInHand = player.hand.filter(t => t.type === 'flower');
        for (let flower of flowersInHand) {
          player.flowers.push(flower);
          player.hand = player.hand.filter(t => t.id !== flower.id);
          if (this.wall.length > 0) {
            const replacement = this.wall.pop();
            if (replacement.type === 'flower') {
              player.flowers.push(replacement);
              while (this.wall.length > 0) {
                const nextTile = this.wall.pop();
                if (nextTile.type === 'flower') { player.flowers.push(nextTile); }
                else { player.hand.push(nextTile); break; }
              }
            } else { player.hand.push(replacement); }
          }
        }
        this.sortHand(player);
      }
    }
  }

  drawTile(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;
    if (this.wall.length === 0) { this.endGame('draw'); return null; }
    const tile = this.wall.pop();
    if (tile.type === 'flower') {
      player.flowers.push(tile);
      this.checkFlowerInstantPayout(player);
      this.broadcastGameMessage(`${player.name} 摸到花牌 ${tile.value}`);
      if (this.wall.length > 0) {
        const replacement = this.wall.pop();
        if (replacement.type === 'flower') {
          player.flowers.push(replacement);
          this.broadcastGameMessage(`${player.name} 又摸到花牌 ${replacement.value}`);
          while (this.wall.length > 0) {
            const nextTile = this.wall.pop();
            if (nextTile.type === 'flower') { 
              player.flowers.push(nextTile); 
              this.broadcastGameMessage(`${player.name} 再次摸到花牌 ${nextTile.value}`); 
            } else { 
              player.hand.push(nextTile); 
              player.lastDrawnTileId = nextTile.id; // 🌟 記住實際摸到的牌
              return nextTile; 
            }
          }
        } else { 
          player.hand.push(replacement); 
          player.lastDrawnTileId = replacement.id; // 🌟 記住實際摸到的牌
          return replacement; 
        }
      }
      player.lastDrawnTileId = tile.id; 
      return tile;
    }
    player.hand.push(tile);
    player.lastDrawnTileId = tile.id; // 🌟 記住實際摸到的牌
    return tile;
  }

  discardTile(socketId, tileId) {
    const player = this.players.get(socketId);
    this.sortHand(player);
    if (!player) return { success: false, reason: '玩家不存在' };

    // 🌟 1. 叮牌限制檢查：必須放在 splice 之前！
    if (player.isTing) {
        if (player.hasDrawnAfterTing) {
            // 已摸過牌，只能打出剛剛記住的「那張牌的 ID」
            if (tileId !== player.lastDrawnTileId) {
                return { success: false, reason: '叮牌後只能打出剛摸到的牌' };
            }
            player.tingJiEligible = false;
        } else {
            player.hasDrawnAfterTing = true;
        }
    }

    // 🌟 2. 確認有這張牌後，再執行 splice 刪除
    const tileIndex = player.hand.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return { success: false, reason: '手牌中沒有這張牌' };
    const tile = player.hand.splice(tileIndex, 1)[0];

    this.sortHand(player);
    
    tile.discardedBy = player.seatIndex;
    if (player.isTing && !player.hasMarkedTingDiscard) {
        tile.isTingDiscard = true;
        player.hasMarkedTingDiscard = true;
    }
    this.discardPile.push(tile);
    this.lastDiscard = tile;
    // 碰吃槓會打斷連續出牌，故在此進行追牌判定
    this.consecutiveDiscards = this.consecutiveDiscards || [];
    if (this.consecutiveDiscards.length === 3) {
        const chainTile = this.consecutiveDiscards[0];
        const isHonor = chainTile.type === 'honor';
        
        if (tile.value === chainTile.value && tile.suit === chainTile.suit) {
            // ✅ 成功跟上第四張 -> 觸發 4追
            const firstSeat = chainTile.seatIndex;
            if (isHonor) this.executeInstantPayout(firstSeat, [0, 1, 2, 3], 1, '4追番子', 'penalize');
            else this.executeInstantPayout(firstSeat, [0, 1, 2, 3], 2, '4追非番子', 'penalize');
            this.consecutiveDiscards = []; // 結算後重置
        } else {
            // ❌ 第四家未能跟牌 -> 觸發 三追 罰第四家
            const currentSeat = player.seatIndex;
            if (isHonor) this.executeInstantPayout(currentSeat, [0, 1, 2, 3], 0.5, '三追番子', 'penalize');
            else this.executeInstantPayout(currentSeat, [0, 1, 2, 3], 1, '三追非番子', 'penalize');
            this.consecutiveDiscards = [{ seatIndex: player.seatIndex, value: tile.value, suit: tile.suit, type: tile.type }];
        }
    } else {
        if (this.consecutiveDiscards.length === 0) {
            this.consecutiveDiscards.push({ seatIndex: player.seatIndex, value: tile.value, suit: tile.suit, type: tile.type });
        } else {
            const prev = this.consecutiveDiscards[this.consecutiveDiscards.length - 1];
            if (tile.value === prev.value && tile.suit === prev.suit) {
                this.consecutiveDiscards.push({ seatIndex: player.seatIndex, value: tile.value, suit: tile.suit, type: tile.type });
            } else {
                this.consecutiveDiscards = [{ seatIndex: player.seatIndex, value: tile.value, suit: tile.suit, type: tile.type }];
            }
        }
    }
    this.lastDiscardPlayer = socketId;
    player.hasDiscarded = true;
    this.broadcastGameMessage(`${player.name} 打出 ${this.getTileDisplayName(tile)}`);
    
    const tileData = {
        seat: player.seatIndex,
        tile: { id: tile.id || '', type: tile.type || 'number', suit: tile.suit || 'wan', value: tile.value || '1', discardedBy: player.seatIndex,isTingDiscard: tile.isTingDiscard || false },
        remainingCount: this.wall.length
    };
    io.to(this.roomId).emit('tilePlayed', tileData);
   
    this.broadcastPlayerState();
    this.checkActionsAfterDiscard(socketId, tile);
    return { success: true, tile: tile };
  }

  // server.js - checkActionsAfterDiscard（修改：顯示所有可用的操作）
checkActionsAfterDiscard(discarderSocketId, tile) {
    const actions = [];
    
    for (let [socketId, player] of this.players) {
        if (socketId === discarderSocketId) continue;
        if (!player.isOnline || player.hasWon) continue;
        
        const canWin = this.checkCanWin(socketId, tile);

       if (player.isTing) {
            // 🌟 優先級改為 4，與最上方的 ACTION_PRIORITY 對齊，無條件壓過碰槓
            if (canWin) actions.push({ player: socketId, type: 'win', priority: 4 }); 
            continue;  // 叮牌狀態跳過吃碰槓
        }
        const canKong = this.checkCanKong(socketId, tile);
        const canPong = this.checkCanPong(socketId, tile);
        const canChow = this.checkCanChow(socketId, tile, discarderSocketId);
        
        if (canWin) actions.push({ player: socketId, type: 'win', priority: 3 });
        if (canKong) actions.push({ player: socketId, type: 'kong', priority: 2 });
        if (canPong) actions.push({ player: socketId, type: 'pong', priority: 2 });
        if (canChow) actions.push({ player: socketId, type: 'chow', priority: 1 });
    }
    console.log(`檢查操作完成，actions 數量: ${actions.length}`);
    
    if (actions.length > 0) {
        // ✅ 改為：每個玩家顯示他所有可用的操作
        // 按玩家分組
        const playerActions = {}; // socketId -> [{type, priority}]
        for (let action of actions) {
            if (!playerActions[action.player]) {
                playerActions[action.player] = [];
            }
            playerActions[action.player].push(action);
        }
        
        // 收集所有需要通知的玩家
        const allPendingPlayers = Object.keys(playerActions);
        this.waitingForAction = allPendingPlayers;
        console.log(`✅ waitingForAction 設定為: [${this.waitingForAction.join(', ')}]`);
        this.waitingForAction = allPendingPlayers;
        console.log(`✅ waitingForAction 設定為: [${this.waitingForAction.join(', ')}]`);

        // 🌟 新增：建立統一的等待 Queue
        this.pendingActionQueue = {
            tile: tile,
            discarder: discarderSocketId,
            responses: [] // 等待收集大家的回覆
        };
        const humanPlayers = [];
        const aiPlayers = [];
        
        for (let socketId of allPendingPlayers) {
            const player = this.players.get(socketId);
            if (player.isAI) {
                aiPlayers.push({ socketId, actions: playerActions[socketId] });
            } else {
                humanPlayers.push({ socketId, actions: playerActions[socketId] });
            }
        }
        
        // ✅ 通知真人玩家：發送所有可用操作
        for (let human of humanPlayers) {
            // 找出最高優先級的操作類型（用於前端顯示）
            const highestPriority = Math.max(...human.actions.map(a => a.priority));
            const mainAction = human.actions.find(a => a.priority === highestPriority);
            
            // 發送多個 actionRequired（每個操作一個）
            for (let action of human.actions) {
                io.to(human.socketId).emit('actionRequired', {
                    type: action.type,
                    tile: {
                        id: tile.id || '', type: tile.type || 'number',
                        suit: tile.suit || 'wan', value: tile.value || '1',
                        discardedBy: this.players.get(discarderSocketId)?.seatIndex
                    },
                    timeout: 20000
                });
                console.log(`📤 發送 actionRequired 給真人 ${human.socketId}: type=${action.type}`);
            }
        }
        
        // AI 玩家自動回應
        for (let ai of aiPlayers) {
            const delay = 200 + Math.random() * 200;
            // AI 選擇最高優先級的操作
            const highestPriority = Math.max(...ai.actions.map(a => a.priority));
            const aiAction = ai.actions.find(a => a.priority === highestPriority);
            console.log(`🤖 排程 AI ${this.players.get(ai.socketId)?.name} 在 ${delay}ms 後回應: ${aiAction.type}`);
            setTimeout(() => {
                this.handleAIAction({ player: ai.socketId, type: aiAction.type, priority: aiAction.priority }, tile);
            }, delay);
        }
        
        if (humanPlayers.length === 0) {
            console.log('只有 AI 需要操作，等待 AI 自動回應');
        }
    } else {
        console.log('沒有待處理操作，直接輪到下家');
        this.scheduleNextTurn(300);
    }
}
// server.js - GameRoom 類別中
canFormWinningHandWithOneMissing(tiles, melds) {
    // 檢查是否「差一張」就能胡（結構分析法）
    const meldCount = melds.length;
    const neededMelds = 5 - meldCount;
    
    const normalTiles = tiles.filter(t => t && t.type !== 'flower');
    
    const bySuit = { wan: [], tong: [], tiao: [], honor: [] };
    for (let tile of normalTiles) {
        if (tile.type === 'honor') {
            bySuit.honor.push(tile.value);
        } else {
            const num = parseInt(tile.value);
            if (!isNaN(num)) bySuit[tile.suit].push(num);
        }
    }
    
    // 字牌檢查
    const honorCounts = {};
    for (let h of bySuit.honor) honorCounts[h] = (honorCounts[h] || 0) + 1;
    
    let honorPairCount = 0;
    let missingHonor = false;
    
    for (let [value, count] of Object.entries(honorCounts)) {
        if (count === 2) honorPairCount++;
        else if (count === 1) {
            if (missingHonor) return false;
            missingHonor = true;
        } else if (count === 3) { /* 刻子 */ }
        else return false;
    }
    
    if (honorPairCount > 1) return false;
    
    let missingCount = missingHonor ? 1 : 0;
    
    for (let suit of ['wan', 'tong', 'tiao']) {
        const numbers = bySuit[suit].sort((a, b) => a - b);
        if (numbers.length === 0) continue;
        
        const result = analyzeSuitOneMissing(numbers);
        if (result === false) return false;
        missingCount += result.missing;
    }
    
    return missingCount === 1 && honorPairCount <= 1;
}


// 🌟 伺服器端：生成聽牌天書 (包含打哪張聽哪張、剩幾張)
generateTingDetails(socketId) {
    const player = this.players.get(socketId);
    if (!player) return [];
    
    const details = [];
    const hand = player.hand.filter(t => t.type !== 'flower');
    const existingMelds = player.melds;

    const visibleTiles = { wan: {}, tong: {}, tiao: {}, honor: {} };
    const countVisible = (tile) => {
        if (!tile) return;
        if (tile.type === 'honor') visibleTiles.honor[tile.value] = (visibleTiles.honor[tile.value] || 0) + 1;
        else if (tile.type === 'number') visibleTiles[tile.suit][tile.value] = (visibleTiles[tile.suit][tile.value] || 0) + 1;
    };
    for (let t of hand) countVisible(t);
    for (let t of this.discardPile) countVisible(t);
    for (let [sid, p] of this.players) for (let m of p.melds) for (let mt of m.tiles) countVisible(mt);

    const calculateRemaining = (suit, value) => {
        const used = (suit === 'honor') ? (visibleTiles.honor[value] || 0) : (visibleTiles[suit]?.[value] || 0);
        return Math.max(0, 4 - used);
    };

    if (player.isTing) {
        const winTiles = [];
        // 🌟 核心修正：計算聽牌時，扣除剛摸到尚未打出的那張牌，用基礎手牌推算
        const evalHand = (hand.length % 3 === 2 && player.lastDrawnTileId) 
            ? hand.filter(t => t.id !== player.lastDrawnTileId) 
            : hand;

        for (let suit of ['wan', 'tong', 'tiao']) {
            for (let v = 1; v <= 9; v++) {
                if (this.isAnyWinningHand([...evalHand, { type: 'number', suit, value: v.toString() }], existingMelds)) {
                    winTiles.push({ suit, value: v.toString(), remaining: calculateRemaining(suit, v.toString()) });
                }
            }
        }
        for (let h of ['東','南','西','北','中','發','白']) {
            if (this.isAnyWinningHand([...evalHand, { type: 'honor', suit: 'honor', value: h }], existingMelds)) {
                winTiles.push({ suit: 'honor', value: h, remaining: calculateRemaining('honor', h) });
            }
        }
        if (winTiles.length > 0) details.push({ discardTileId: 'ting_locked', winTiles: winTiles });
        return details;
    }

    // 模擬打牌 (未叮牌的原本邏輯)
    for (let i = 0; i < hand.length; i++) {
        const remainingHand = hand.filter((_, idx) => idx !== i);
        const droppedTile = hand[i];
        if (details.some(d => d.suit === droppedTile.suit && d.value === droppedTile.value)) continue;

        const winTiles = [];
        for (let suit of ['wan', 'tong', 'tiao']) {
            for (let v = 1; v <= 9; v++) {
                if (this.isAnyWinningHand([...remainingHand, { type: 'number', suit, value: v.toString() }], existingMelds)) {
                    winTiles.push({ suit, value: v.toString(), remaining: calculateRemaining(suit, v.toString()) });
                }
            }
        }
        for (let h of ['東','南','西','北','中','發','白']) {
            if (this.isAnyWinningHand([...remainingHand, { type: 'honor', suit: 'honor', value: h }], existingMelds)) {
                winTiles.push({ suit: 'honor', value: h, remaining: calculateRemaining('honor', h) });
            }
        }

        if (winTiles.length > 0) details.push({ discardTileId: droppedTile.id, suit: droppedTile.suit, value: droppedTile.value, winTiles: winTiles });
    }
    return details;
}


  handleAIAction(aiAction, tile) {
      const player = this.players.get(aiAction.player);
      if (!player) return;
      
      if (!this.waitingForAction || !this.waitingForAction.includes(aiAction.player)) return;

      const winChance = 1.0; 
      const pongKongChance = 0.6;
      const chowChance = 0.5;

      let selectedAction = 'pass';

      if (aiAction.type === 'win' && Math.random() < winChance) {
          selectedAction = 'win';
      } else if ((aiAction.type === 'pong' || aiAction.type === 'kong') && Math.random() < pongKongChance) {
          selectedAction = aiAction.type;
      } else if (aiAction.type === 'chow' && Math.random() < chowChance) {
          selectedAction = 'chow';
      }

      console.log(`🤖 AI ${player.name} 評估操作 ${aiAction.type} -> 決定選擇 [${selectedAction}]`);

      if (selectedAction !== 'pass') {
          let extraData = null;
          
          // 🌟 核心修正：讓 AI 智慧判斷它是能左吃、中吃還是右吃，防止送錯被伺服器拒絕卡死！
          if (selectedAction === 'chow') {
              const num = parseInt(tile.value);
              const suit = tile.suit;
              let validChowType = 'middle';
              
              const hasMinus2 = player.hand.some(t => t.suit === suit && parseInt(t.value) === num - 2);
              const hasMinus1 = player.hand.some(t => t.suit === suit && parseInt(t.value) === num - 1);
              const hasPlus1  = player.hand.some(t => t.suit === suit && parseInt(t.value) === num + 1);
              const hasPlus2  = player.hand.some(t => t.suit === suit && parseInt(t.value) === num + 2);
              
              if (hasMinus1 && hasPlus1) validChowType = 'middle';
              else if (hasMinus2 && hasMinus1) validChowType = 'left';
              else if (hasPlus1 && hasPlus2) validChowType = 'right';
              
              extraData = { chowType: validChowType };
          }

          if (this.pendingActionQueue) {
              this.pendingActionQueue.responses.push({
                  socketId: aiAction.player,
                  seat: player.seatIndex,
                  action: selectedAction,
                  data: extraData,
                  priority: aiAction.priority
              });
              
              this.waitingForAction = this.waitingForAction.filter(id => id !== aiAction.player);
              if (this.waitingForAction.length === 0) {
                  this.resolvePendingActions();
              }
          }
          return;
      }

      this.waitingForAction = this.waitingForAction.filter(id => id !== aiAction.player);
      if (this.waitingForAction.length === 0) {
          this.clearPendingActions();
          if (this.gameState !== 'finished') {
              this.scheduleNextTurn(500);
          }
      }}

  // ✅ 新增：檢查低優先級操作
checkLowerPriorityActions(tile) {
    // 找出所有可能的操作（不限優先級）
    const allActions = [];
    
    for (let [socketId, player] of this.players) {
        if (socketId === this.lastDiscardPlayer) continue;
        if (!player.isOnline || player.hasWon) continue;
        
        const canPong = this.checkCanPong(socketId, tile);
        const canChow = this.checkCanChow(socketId, tile, this.lastDiscardPlayer);
        
        // 注意：這裡不檢查 canWin 和 canKong，因為它們的優先級更高，應該已經被處理過了
        if (canPong) allActions.push({ player: socketId, type: 'pong', priority: 2 });
        if (canChow) allActions.push({ player: socketId, type: 'chow', priority: 1 });
    }
    
    if (allActions.length > 0) {
        // 按優先級排序
        allActions.sort((a, b) => b.priority - a.priority);
        const highestPriority = allActions[0].priority;
        const pendingActions = allActions.filter(a => a.priority === highestPriority);
        
        this.pendingActions = pendingActions;
        this.waitingForAction = pendingActions.map(a => a.player);
        console.log(`🔄 檢查低優先級操作: [${this.waitingForAction.join(', ')}]`);
        
        const humanPlayers = [];
        const aiPlayers = [];
        
        for (let action of pendingActions) {
            const player = this.players.get(action.player);
            if (player.isAI) aiPlayers.push(action);
            else humanPlayers.push(action);
        }
        
        for (let action of humanPlayers) {
            io.to(action.player).emit('actionRequired', {
                type: action.type,
                tile: {
                    id: tile.id || '', type: tile.type || 'number',
                    suit: tile.suit || 'wan', value: tile.value || '1',
                    discardedBy: this.players.get(this.lastDiscardPlayer)?.seatIndex
                },
                timeout: 20000
            });
            console.log(`📤 發送 actionRequired 給真人 ${action.player}: type=${action.type}`);
        }
        
        for (let aiAction of aiPlayers) {
            const delay = 200 + Math.random() * 200;
            setTimeout(() => { this.handleAIAction(aiAction, tile); }, delay);
        }
    } else {
        console.log('沒有低優先級操作，輪到下家');
        this.scheduleNextTurn(300);
    }
}

checkCanWin(socketId, tile = null) {
      const player = this.players.get(socketId);
      if (!player) return false;
      
      let evalHand = player.hand;
      let winType = 'selfDraw';
      
      // 如果有傳入 tile，代表是出銃
      if (tile) {
          evalHand = [...player.hand, tile];
          winType = 'discard';
      }
      
      const normalTiles = evalHand.filter(t => t.type !== 'flower');
      
      console.log(`=== checkCanWin 詳細 ===`);
      console.log(`玩家: ${player.name}, 手牌=${normalTiles.length}張, 副露=${player.melds.length}組`);
      
      // 1. 檢查是否為標準胡牌型 (4面子 + 1雀頭)
      let isStandardWin = this.canFormWinningHand(normalTiles, player.melds);
      
      // 2. 檢查是否為特殊牌型 (十三么, 十六不搭, 嚦咕等)
      let isSpecialWin = false;
      try {
          if (taiCalculator.checkShiSanYao(evalHand, player.melds) || 
              taiCalculator.checkShiLiuBuDa(evalHand, player.melds) ||
              taiCalculator.checkShiLiuBuDaShe(evalHand, player.melds) ||
              taiCalculator.checkShiLiuBuDaXiangFeng(evalHand, player.melds) ||
              taiCalculator.checkLikwu(evalHand, player.melds) ||
              taiCalculator.checkEightPairsLikwu(evalHand, player.melds)) {
              isSpecialWin = true;
          }
      } catch (e) {
          console.error('特殊牌型預檢錯誤:', e);
      }
      
     // 🌟 防護罩：不是標準胡牌，也不是特殊胡牌，直接退回！
      if (!isStandardWin && !isSpecialWin) {
          console.log(`❌ canFormWinningHand 與 特殊牌型 均返回 false`);
          return false;
      }
      
      // 🌟 核心修復 1：必須先取得房間的客製化番表，否則下方會報錯崩潰！
      const customRules = this.getCustomTaiRules();

      try {
          let isDiscarderTing = false;
          if (tile && tile.discardedBy !== undefined) {
              const discarder = this.getPlayerBySeatIndex(tile.discardedBy);
              if (discarder) isDiscarderTing = discarder.isTing;
          }

          const result = taiCalculator.calculateTai({
              hand: evalHand,
              melds: player.melds,
              winType: winType,
              extraInfo: { 
                  flowers: player.flowers, 
                // 🌟 核心修正：直接比對座位號碼，絕對精準
                isDealer: player.seatIndex === this.dealer, 
                winTile: tile,
                tingType: player.tingType,
                isTing: player.isTing,
                isEatTing: player.isEatTing,
                isMenqingTing: player.isMenqingTing,
                isTingBeforeDraw: player.tingJiEligible,
                isDiscarderTing: isDiscarderTing,
                dealerConsecutive: this.dealerConsecutive || 0,
                // 🌟 核心修正：確認打牌者是不是莊家
                isDiscarderDealer: (tile && tile.discardedBy !== undefined) ? (tile.discardedBy === this.dealer) : false
            }
          }, customRules); // ✅ 這裡就不會再報錯了
          console.log(`台數計算: totalTai=${result.totalTai}, canWin=${result.canWin}`);
          return result.canWin;
      } catch (error) {
          console.error('台數計算錯誤:', error.message);
          return false;
      }
  }

// 🌟 新增：萬用胡牌檢測器（同時支援標準 4面子1雀頭 與 特殊牌型如嚦咕、十三么）
  isAnyWinningHand(tiles, melds = []) {
      const normalTiles = tiles.filter(t => t && t.type !== 'flower');
      
      // 1. 標準牌型檢查
      if (this.canFormWinningHand(normalTiles, melds)) return true;

      // 2. 特殊牌型檢查
      try {
          if (taiCalculator.checkShiSanYao(normalTiles, melds) || 
              taiCalculator.checkShiLiuBuDa(normalTiles, melds) ||
              taiCalculator.checkShiLiuBuDaShe(normalTiles, melds) ||
              taiCalculator.checkShiLiuBuDaXiangFeng(normalTiles, melds) ||
              taiCalculator.checkLikwu(normalTiles, melds) ||
              taiCalculator.checkEightPairsLikwu(normalTiles, melds)) {
              return true;
          }
      } catch (e) {
          console.error('特殊牌型預檢錯誤:', e);
      }
      return false;
  }

canFormWinningHand(tiles, melds = []) {
    if (!tiles || !Array.isArray(tiles)) return false;
    
    const meldCount = Array.isArray(melds) ? melds.length : 0;
    const remainingMeldsNeeded = 5 - meldCount;
    const expectedHandSize = remainingMeldsNeeded * 3 + 2;
    
    // 🌟 核心修正：允許容錯 1 張牌的誤差 (解決吃碰槓瞬間的數量不同步)
    if (tiles.length < expectedHandSize - 1 || tiles.length > expectedHandSize + 1) {
        return false;
    }
    
    const normalTiles = tiles.filter(t => t && t.type !== 'flower');
    const bySuit = { wan: [], tong: [], tiao: [], honor: [] };
    
    for (let tile of normalTiles) {
        if (tile.type === 'honor') {
            bySuit.honor.push(tile.value);
        } else if (tile.type === 'number') {
            const num = parseInt(tile.value);
            if (!isNaN(num)) bySuit[tile.suit].push(num);
        }
    }
    
    for (let suit of ['wan', 'tong', 'tiao']) {
        bySuit[suit].sort((a, b) => a - b);
    }
    
    // === 字牌檢查 ===
    const honorCounts = {};
    for (let h of bySuit.honor) honorCounts[h] = (honorCounts[h] || 0) + 1;
    
    let honorPairCount = 0;
    let honorMelds = 0;
    for (let [value, count] of Object.entries(honorCounts)) {
        if (count === 1) return false; // 🌟 嚴格防呆：如果有單張字牌，絕對不可能是標準胡牌！
        else if (count === 2) honorPairCount++;
        else if (count >= 3) honorMelds++;
    }
    
    if (honorPairCount > 1) return false;
    
    const wanResult = analyzeSuit(bySuit.wan);
    const tongResult = analyzeSuit(bySuit.tong);
    const tiaoResult = analyzeSuit(bySuit.tiao);
    
    for (let wan of wanResult) {
        for (let tong of tongResult) {
            for (let tiao of tiaoResult) {
                const totalMelds = wan.melds + tong.melds + tiao.melds + honorMelds;
                const totalPairs = wan.pairs + tong.pairs + tiao.pairs + honorPairCount;
                
                if (totalMelds === remainingMeldsNeeded && totalPairs === 1) {
                    return true;
                }
            }
        }
    }
    
    return false;
  }


  checkCanKong(socketId, tile) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    // 計算手牌中相同牌的數量
    let count = 0;
    for (let t of player.hand) {
        if (t.type === tile.type && t.suit === tile.suit && t.value === tile.value) {
            count++;
        }
    }
    
    // 手牌中有 3 張 → 可以明槓
    return count >= 3;
} 

  checkCanPong(socketId, tile) {
    const player = this.players.get(socketId);
    if (!player) return false;
    let count = 0;
    for (let t of player.hand) {
        if (t.type === tile.type && t.suit === tile.suit && t.value === tile.value) count++;
    }
    return count >= 2;
  }

  checkCanChow(socketId, tile, discarderSocketId) {
    const player = this.players.get(socketId);
    if (!player) return false;
    const discarder = this.players.get(discarderSocketId);
    if (!discarder) return false;
    if (tile.type !== 'number') return false;

    // 🌟 核心修正：與 getNextPlayerIndex 保持完全一致！
    // 標準座位順序下，打牌者的下家（右手邊可以吃牌的人）就是 (打牌者座位 + 1) % 4
    const nextSeat = (discarder.seatIndex + 1) % 4;
    if (player.seatIndex !== nextSeat) return false;

    // 🌟 如果玩家已經叮牌（聽牌宣告），根據規則不能再吃碰槓，直接攔截
    if (player.isTing) return false;

    const num = parseInt(tile.value), suit = tile.suit;
    const combinations = [[num - 2, num - 1], [num - 1, num + 1], [num + 1, num + 2]];
    for (let combo of combinations) {
        if (combo[0] >= 1 && combo[1] <= 9) {
            const hasFirst = player.hand.some(t => t.type === 'number' && t.suit === suit && parseInt(t.value) === combo[0]);
            const hasSecond = player.hand.some(t => t.type === 'number' && t.suit === suit && parseInt(t.value) === combo[1]);
            if (hasFirst && hasSecond) return true;
        }
    }
    return false;
  }

  playerPong(socketId) {
    const player = this.players.get(socketId);
    this.consecutiveDiscards = []; //
    if (!player || !this.lastDiscard) return { success: false };
    const tile = this.lastDiscard;
    const matchingTiles = player.hand.filter(t => t.type === tile.type && t.suit === tile.suit && t.value === tile.value);
    if (matchingTiles.length < 2) return { success: false };
    player.hand = player.hand.filter(t => !(t.type === tile.type && t.suit === tile.suit && t.value === tile.value) || matchingTiles.indexOf(t) >= 2);
    player.melds.push({ type: 'pong', tiles: [...matchingTiles.slice(0, 2), tile], fromPlayer: this.lastDiscardPlayer });
    this.broadcastGameMessage(`${player.name} 碰了 ${this.getTileDisplayName(tile)}`);
    this.clearPendingActions();
    this.currentTurn = player.seatIndex;
io.to(this.roomId).emit('meldCreated', { seat: player.seatIndex, meld: { type: 'pong', tiles: [...matchingTiles.slice(0, 2), tile], fromPlayer: this.lastDiscardPlayer ? this.players.get(this.lastDiscardPlayer)?.seatIndex : -1 } });
this.discardPile = this.discardPile.filter(t => t.id !== tile.id);    this.lastDiscard = null; this.lastDiscardPlayer = null;
    this.broadcastGameState(); this.broadcastPlayerState();
    io.to(socketId).emit('privateStateUpdate', { 
        success: true, 
        gameState: this.getPublicGameState(), 
        players: this.getPublicPlayersState(), 
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
    const canTing = !player.isAI ? this.checkCanTing(socketId) : false;
    // 🌟 修正：使用 player.isAI 和 socketId
    const tingDetailsData = (!player.isAI && canTing) ? this.generateTingDetails(socketId) : [];
    io.to(socketId).emit('yourTurn', { 
        isFirstTurn: false, 
        canWin: false, 
        canTing: canTing, 
        drawnTile: null, 
        isTing: player.isTing,
        countdownSec: this.settings.timeLimit || 15, // 🌟 新增這行
        tingDetails: tingDetailsData, // 🌟 天書上車！
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
    // ✅ 除錯日誌（放在 return 之前）
    console.log(`=== playerPong 完成 ===`);
    console.log(`currentTurn: ${this.currentTurn} (${this.getCurrentPlayer()?.name})`);
    console.log(`waitingForAction: ${JSON.stringify(this.waitingForAction)}`);
    
    if (player.isAI) {
        setTimeout(() => {
            console.log(`🤖 AI ${player.name} 碰後打牌`);
            this.aiDiscard(player);
        }, 300);
    }
    return { success: true };
}
playerKong(socketId) {
    const player = this.players.get(socketId);
    this.consecutiveDiscards = [];
    if (!player || !this.lastDiscard) return { success: false };
    
    const tile = this.lastDiscard;
    const matchingTiles = player.hand.filter(t => t.type === tile.type && t.suit === tile.suit && t.value === tile.value);
    if (matchingTiles.length < 3) return { success: false };
    
    player.hand = player.hand.filter(t => !(t.type === tile.type && t.suit === tile.suit && t.value === tile.value));
    player.melds.push({ type: 'mingKong', tiles: [...matchingTiles, tile], fromPlayer: this.lastDiscardPlayer });
    
    this.broadcastGameMessage(`${player.name} 槓了 ${this.getTileDisplayName(tile)}`);
    // 🌟 已經將明槓的即時收錢邏輯移除！

    const drawnTile = this.drawTile(socketId);
    this.clearPendingActions();
    this.currentTurn = player.seatIndex;
    
    io.to(this.roomId).emit('meldCreated', { seat: player.seatIndex, meld: { type: 'mingKong', tiles: [...matchingTiles, tile], fromPlayer: this.lastDiscardPlayer ? this.players.get(this.lastDiscardPlayer)?.seatIndex : -1 } });
    this.discardPile = this.discardPile.filter(t => t.id !== tile.id);
    this.lastDiscard = null; this.lastDiscardPlayer = null;
    this.broadcastGameState(); this.broadcastPlayerState();
    
    io.to(socketId).emit('privateStateUpdate', { 
        success: true, 
        gameState: this.getPublicGameState(), 
        players: this.getPublicPlayersState(), 
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
    const canWin = this.checkCanWin(socketId);
    const canTing = !player.isAI ? this.checkCanTing(socketId) : false;
    const tingDetailsData = (!player.isAI && canTing) ? this.generateTingDetails(socketId) : [];
    
    io.to(socketId).emit('yourTurn', { 
        isFirstTurn: false, 
        drawnTile: drawnTile,  
        canWin: canWin, 
        canTing: canTing,
        isTing: player.isTing,
        countdownSec: this.settings.timeLimit || 15, 
        tingDetails: tingDetailsData, 
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
    if (player.isAI) {
        setTimeout(() => {
            this.aiDiscard(player);
        }, 300);
    }
    return { success: true, drawnTile };
  }
playerSelfKong(socketId, data) {
      const player = this.players.get(socketId);
      if (!player || this.currentTurn !== player.seatIndex) return { success: false, reason: '不是你的回合' };
      
      const targetValue = data.tile ? data.tile.value : data.value;
      const targetSuit = data.tile ? data.tile.suit : data.suit;
      const targetType = data.tile ? data.tile.type : (data.type || 'number');

      if (!targetValue || !targetSuit) return { success: false, reason: '資料不完整' };

      const matchingTiles = player.hand.filter(t => t.type === targetType && t.suit === targetSuit && t.value === targetValue);

      // ==========================================
      // 🌟 情況 A：暗槓 (唯一會收錢的槓牌)
      // ==========================================
      if (matchingTiles.length === 4) {
          if (player.isTing) return { success: false, reason: '叮牌後不可暗槓' };

          player.hand = player.hand.filter(t => !(t.type === targetType && t.suit === targetSuit && t.value === targetValue));
          player.melds.push({ type: 'anKong', tiles: matchingTiles });
          
          // 🌟 只有暗槓會觸發：向全場收 1 底
          this.executeInstantPayout(player.seatIndex, [0, 1, 2, 3], 1, '暗槓', 'collect');

          const drawnTile = this.drawTile(socketId);
          this.sortHand(player);

          io.to(this.roomId).emit('meldCreated', { 
              seat: player.seatIndex, 
              meld: { 
                  type: 'anKong', 
                  tiles: matchingTiles.map(t => ({ id: t.id, type: 'number', suit: 'wan', value: '1' })) 
              } 
          });

          io.to(socketId).emit('privateStateUpdate', {
              success: true,
              privateState: this.getPrivatePlayerState(socketId)          
          });

          this.refreshAndSendYourTurn(socketId, player, drawnTile);
          return { success: true, type: 'anKong' };
      }

      // ==========================================
      // 🌟 情況 B：加槓 / 補槓 (不收錢)
      // ==========================================
      const existingMeldIdx = player.melds.findIndex(m => m.type === 'pong' && m.tiles[0].value === targetValue && m.tiles[0].suit === targetSuit);
      const hasFourthTile = player.hand.some(t => t.type === targetType && t.suit === targetSuit && t.value === targetValue);

      if (existingMeldIdx !== -1 && hasFourthTile) {
          const fourthTileIdx = player.hand.findIndex(t => t.type === targetType && t.suit === targetSuit && t.value === targetValue);
          const fourthTile = player.hand.splice(fourthTileIdx, 1)[0];

          player.melds[existingMeldIdx].type = 'mingKong';
          player.melds[existingMeldIdx].tiles.push(fourthTile);

          this.broadcastGameMessage(`${player.name} 補槓了 ${targetValue}${targetSuit === 'honor' ? '' : targetSuit}`, 'info');

          // 🌟 已經將加槓/補槓的即時收錢邏輯移除！直接補牌。
          const drawnTile = this.drawTile(socketId);
          this.sortHand(player);

          io.to(this.roomId).emit('meldCreated', { seat: player.seatIndex, meld: player.melds[existingMeldIdx] });
          io.to(socketId).emit('privateStateUpdate', {
              success: true,
              privateState: this.getPrivatePlayerState(socketId)
          });

          this.refreshAndSendYourTurn(socketId, player, drawnTile);
          return { success: true, type: 'buGang' };
      }

      return { success: false, reason: '不符合槓牌條件' };
  }

// 🌟 新增的輔助優化方法：槓牌後刷新並把出牌權交還給玩家
refreshAndSendYourTurn(socketId, player, drawnTile) {
    this.broadcastGameState(); 
    this.broadcastPlayerState();
    
    const canWin = this.checkCanWin(socketId);
    const canTing = !player.isAI ? this.checkCanTing(socketId) : false;
// 🌟 新增：產生聽牌天書 (只有真人才需要，AI不用發送)
        const tingDetailsData = currentPlayer.isAI ? [] : this.generateTingDetails(currentPlayer.socketId);
    io.to(socketId).emit('yourTurn', { 
        isFirstTurn: false, 
        drawnTile: drawnTile, 
        canWin: canWin, 
        canTing: canTing,
        isTing: player.isTing,
        countdownSec: this.settings.timeLimit || 15, // 🌟 新增這行
        privateState: this.getPrivatePlayerState(socketId) 
    });

    if (player.isAI) {
        setTimeout(() => {
            console.log(`🤖 AI ${player.name} 槓後打牌`);
            this.aiDiscard(player);
        }, 300);
    }
}
  playerChow(socketId, chowType) {
    const player = this.players.get(socketId);
    this.consecutiveDiscards = [];
    if (!player || !this.lastDiscard) return { success: false };
    const tile = this.lastDiscard;
    const num = parseInt(tile.value), suit = tile.suit;
    let neededNumbers = [];
    if (chowType === 'left') neededNumbers = [num - 2, num - 1];
    else if (chowType === 'middle') neededNumbers = [num - 1, num + 1];
    else if (chowType === 'right') neededNumbers = [num + 1, num + 2];
    else return { success: false };
    const foundTiles = [];
    for (let needed of neededNumbers) {
        const found = player.hand.find(t => t.type === 'number' && t.suit === suit && parseInt(t.value) === needed);
        if (found) foundTiles.push(found);
    }
    if (foundTiles.length !== 2) return { success: false };
    player.hand = player.hand.filter(t => !foundTiles.includes(t));
// 🌟 將自己手上的兩張牌先排序，然後強制把上家打的牌 (tile) 塞在正中間！
    foundTiles.sort((a, b) => parseInt(a.value) - parseInt(b.value));
    const chowTiles = [foundTiles[0], tile, foundTiles[1]];    player.melds.push({ type: 'chow', tiles: chowTiles, fromPlayer: this.lastDiscardPlayer });
    this.broadcastGameMessage(`${player.name} 吃了 ${this.getTileDisplayName(tile)}`);
    this.clearPendingActions();
    this.currentTurn = player.seatIndex;
    io.to(this.roomId).emit('meldCreated', { seat: player.seatIndex, meld: { type: 'chow', tiles: chowTiles, fromPlayer: this.lastDiscardPlayer ? this.players.get(this.lastDiscardPlayer)?.seatIndex : -1 } });
    this.discardPile = this.discardPile.filter(t => t.id !== tile.id);
    this.lastDiscard = null; this.lastDiscardPlayer = null;
    this.broadcastGameState(); this.broadcastPlayerState();
    io.to(socketId).emit('privateStateUpdate', { 
        success: true, 
        gameState: this.getPublicGameState(), 
        players: this.getPublicPlayersState(), 
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
   // 🌟 修正：計算是否能聽牌，並產生聽牌天書 (TingDetails)
    const canTing = !player.isAI ? this.checkCanTing(socketId) : false;
    const tingDetailsData = (!player.isAI && canTing) ? this.generateTingDetails(socketId) : [];
    io.to(socketId).emit('yourTurn', { 
        isFirstTurn: false, 
        canWin: false, 
        canTing: canTing,
        drawnTile: null, 
        isTing: player.isTing, 
        countdownSec: this.settings.timeLimit || 15, // 🌟 新增這行
        tingDetails: tingDetailsData, // 🌟 天書上車！
        privateState: this.getPrivatePlayerState(socketId) 
    });
    
    if (player.isAI) {
        setTimeout(() => {
            console.log(`🤖 AI ${player.name} 吃後打牌`);
            this.aiDiscard(player);
        }, 300);
    }
    return { success: true };
}

  checkCanTing(socketId) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    // 過濾掉花牌，只拿一般手牌來算
    const hand = player.hand.filter(t => t.type !== 'flower');
    const meldCount = player.melds.length;
    
    // 台灣麻將的標準結構：4副露+1對眼=14張 / 5副露+1對眼=17張
    // 這裡我們動態計算「未吃碰前，標準聽牌時手裡應該有幾張」
    // 如果是 5 面子的賽制（如台麻），就是 (5 - meldCount) * 3 + 1
    const standardTingSize = (5 - meldCount) * 3 + 1; 

    console.log(`checkCanTing: hand=${hand.length}張, melds=${meldCount}, 標準聽牌張數=${standardTingSize}`);
    
    // 🌟 核心修正：如果是輪到玩家回合（已摸牌，準備打牌），手牌會多一張！
    // 所以我們允許 hand.length === standardTingSize (沒摸牌，差一張) 
    // 或者 hand.length === standardTingSize + 1 (已摸牌，準備打一張)
    if (hand.length !== standardTingSize && hand.length !== standardTingSize + 1) {
        console.log(`❌ 手牌數量不符: 目前 ${hand.length} 張，不符合聽牌所需的 ${standardTingSize} 或 ${standardTingSize + 1} 張`);
        return false;
    }
    
    return this.canTingByBruteForce(hand, player.melds);
}

canTingByBruteForce(hand, melds) {
      for (let i = 0; i < hand.length; i++) {
          const remaining = hand.filter((_, idx) => idx !== i);
          const droppedTile = hand[i];
          
          // 測試 27 張數字牌
          const suits = ['wan', 'tong', 'tiao'];
          for (let suit of suits) {
              for (let v = 1; v <= 9; v++) {
                  const test = [...remaining, { type: 'number', suit, value: v.toString() }];
                  
                  // 🌟 核心修正：統一使用 isAnyWinningHand，同時支援標準與特殊牌型！
                  if (this.isAnyWinningHand(test, melds)) {
                      console.log(`✅ 打掉 ${droppedTile.value}${droppedTile.suit}，聽 ${v}${suit}`);
                      return true;
                  }
              }
          }
          
          // 測試 7 張字牌
          for (let h of ['東','南','西','北','中','發','白']) {
              const test = [...remaining, { type: 'honor', suit: 'honor', value: h }];
              
              // 🌟 核心修正：統一使用 isAnyWinningHand！
              if (this.isAnyWinningHand(test, melds)) {
                  console.log(`✅ 打掉 ${droppedTile.value}${droppedTile.suit}，聽 ${h}`);
                  return true;
              }
          }
      }
      console.log(`❌ 無法聽牌`);
      return false;
  }
  // server.js - GameRoom 類別中
tingPlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return { success: false, reason: '玩家不存在' };
    if (player.isTing) return { success: false, reason: '已經叮牌了' };
    
    if (!this.checkCanTing(socketId)) {
        return { success: false, reason: '尚未聽牌，不能叮牌' };
    }
    
    player.isTing = true;
    player.hasDrawnAfterTing = false;
    player.tingJiEligible = true;
    player.hasMarkedTingDiscard = false;

    // ==========================================
    // 🏆 嚴格評定叮牌階級 (依照最新規則)
    // ==========================================

    // 1. 該玩家「自己」有沒有副露 (吃碰明槓)？
    const hasNoMelds = player.melds.length === 0;

    // 2. 計算該玩家「歷史總共打過幾張牌？」 
    // 包含目前還在海底的，以及被別人吃碰槓走的，藉此精準判斷是不是「起手第一圈」
    let myDiscardCount = 0;
    
    // a. 算海底的
    for (let t of this.discardPile) {
        if (t.discardedBy === player.seatIndex) myDiscardCount++;
    }
    // b. 算被別人拿走的
    for (let p of this.players.values()) {
        for (let m of p.melds) {
            if (m.fromPlayer === player.seatIndex) myDiscardCount++;
        }
    }

    // 3. 所有玩家丟進海底的牌的總數 (系統在吃碰槓時已自動從 discardPile 扣除，所以長度就是準確的數量)
    const totalDiscardCount = this.discardPile.length;

    // 開始判定
    if (hasNoMelds && myDiscardCount === 0 && player.isDealer) {
        // 莊家：自己沒副露，且一發未打 -> 天叮
        player.tingType = 'heaven';
    } 
    else if (hasNoMelds && myDiscardCount === 0 && !player.isDealer) {
        // 閒家：自己沒副露，且一發未打 -> 地叮
        player.tingType = 'earth';
    } 
    else if (totalDiscardCount <= 5) {
        // 海底總數 (不計副露) 在 5 張以內 -> 5子叮
        player.tingType = 'five';
    } 
    else if (totalDiscardCount <= 10) {
        // 海底總數 (不計副露) 在 10 張以內 -> 10子叮
        player.tingType = 'ten';
    } 
    else {
        // 其他情況 -> 普通叮牌
        player.tingType = 'normal';
    }
    
    console.log(`tingPlayer: isTing=${player.isTing}, tingType=${player.tingType}, myDiscardCount=${myDiscardCount}, totalDiscardCount=${totalDiscardCount}`);
    
    this.broadcastGameMessage(`${player.name} 叮牌！`, 'ting');
    this.broadcastPlayerState();
    
    return { success: true };
  }
getTingTypeName(type) {
    const names = {
        'heaven': '天叮',
        'earth': '地叮',
        'five': '5子叮',
        'ten': '10子叮',
        'normal': '叮牌'
    };
    return names[type] || '叮牌';
}

  playerWin(socketId) {
    console.log(`=== playerWin ===`);
    console.log(`lastDiscard: ${this.lastDiscard?.value}${this.lastDiscard?.suit}`);
    console.log(`lastDiscardPlayer: ${this.lastDiscardPlayer}`);
    
    const player = this.players.get(socketId);
    if (!player) return { success: false };
    
    console.log(`playerWin: isTing=${player.isTing}, tingType=${player.tingType}, hasDrawnAfterTing=${player.hasDrawnAfterTing}`);
    
    let winTile = this.lastDiscard;
    let isSelfDraw = false;
    
    // 🌟 替換成這樣：
    if (this.currentTurn === player.seatIndex) {
        isSelfDraw = true;
        // 🌟 精準抓出剛剛摸進來的那張牌！
        winTile = player.hand.find(t => t.id === player.lastDrawnTileId) || player.hand[player.hand.length - 1];
    }
    else if (!winTile && !this.lastDiscardPlayer) {
        isSelfDraw = true;
    } else if (!winTile && this.lastDiscardPlayer) {
        const discarderSeat = this.players.get(this.lastDiscardPlayer)?.seatIndex;
        for (let i = this.discardPile.length - 1; i >= 0; i--) {
            if (this.discardPile[i].discardedBy === discarderSeat) {
                winTile = this.discardPile[i];
                isSelfDraw = false;
                break;
            }
        }
        if (!winTile) isSelfDraw = true;  
    } else {
        isSelfDraw = false;
    }
        
console.log(`isSelfDraw: ${isSelfDraw}, winTile: ${winTile ? winTile.value + winTile.suit : '無(自摸)'}`);

        // 🌟 就在這行 console.log 的正下方，加上這段復仇自摸賞罰：
        if (isSelfDraw && this.lastRoundMultiWinBlaster === player.seatIndex && this.lastRoundMultiWinners && this.lastRoundMultiWinners.length > 0) {
            // 出銃多響後自摸，即時向上一局胡你的所有人各收 2 底！
            this.executeInstantPayout(player.seatIndex, this.lastRoundMultiWinners, 2, '出銃多響後自摸復仇', 'collect');
        }
// 叮即：叮牌後，還沒摸/打牌就胡了
    const isTingBeforeDraw = player.tingJiEligible;
    const evalHand = isSelfDraw ? player.hand : (winTile ? [...player.hand, winTile] : player.hand);

    let isDiscarderTing = false;
    if (winTile && winTile.discardedBy !== undefined) {
        const discarder = this.getPlayerBySeatIndex(winTile.discardedBy);
        if (discarder) isDiscarderTing = discarder.isTing;
    }

    // 🌟 核心修復 2：取得客製化番表
    const customRules = this.getCustomTaiRules();

    const result = taiCalculator.calculateTai({
        hand: evalHand, 
        melds: player.melds,
        winType: isSelfDraw ? 'selfDraw' : 'discard',
        extraInfo: {
            flowers: player.flowers, 
                // 🌟 核心修正
                isDealer: player.seatIndex === this.dealer, 
                winTile: winTile,
                tingType: player.tingType,
                isTing: player.isTing,
                isEatTing: player.isEatTing,
                isMenqingTing: player.isMenqingTing,
                isTingBeforeDraw: isTingBeforeDraw,
                isDiscarderTing: isDiscarderTing,
                discardCount: this.discardPile.length,
                dealerConsecutive: this.dealerConsecutive || 0,
                // 🌟 核心修正
                isDiscarderDealer: (winTile && winTile.discardedBy !== undefined) ? (winTile.discardedBy === this.dealer) : false,
                wallCount: this.wall.length
            }
    }, customRules);
    
    if (!result.canWin) return { success: false };

    
   // ✅ 把它替換成這樣（補上自摸的判斷）：
    const wStats = this.roomStats.get(socketId);
    if (wStats) {
        wStats.winCount++;
        if (isSelfDraw) wStats.selfDrawCount++; // 🌟 補上自摸次數累加
    }
    
    player.hasWon = true;
    const score = result.finalScore;
    
    this.broadcastGameMessage(
        `${player.name} 胡牌！${result.details.map(d => d.name).join('、')} 共 ${result.totalTai} 番`, 
        'win'
    );
    
    // ==========================================
    // 🌟 替換這裡：改用拉莊記帳引擎處理分數
    // ==========================================
    if (isSelfDraw) {
        for (let [otherSocketId, otherPlayer] of this.players) {
            if (otherSocketId !== socketId && !otherPlayer.hasWon) { 
                // 呼叫引擎，處理對其他三家的拉人與斷纜
                this.processPulling(player.seatIndex, otherPlayer.seatIndex, score, true);
            }
        }
    } else {
        const discarder = this.players.get(this.lastDiscardPlayer);
        if (discarder) { 
            // 呼叫引擎，處理對放銃者的拉人與斷纜
            this.processPulling(player.seatIndex, discarder.seatIndex, score, false);

            // 放銃者的放銃王次數加 1
            const dStats = this.roomStats.get(this.lastDiscardPlayer);
            if (dStats) dStats.chongCount++;
        }
    }
    
  // 🌟 終極斷纜清理：如果是單響胡牌，在這裡執行全域清理
    if (this.roundWinClaims.length <= 1) {
    this.cleanupUnrelatedPulls([player.seatIndex]); // 🌟 傳入贏家座位
}
    
    this.clearPendingActions();
    this.broadcastGameState();
    this.broadcastPlayerState();
    
    const discarderSeat = this.lastDiscardPlayer 
        ? this.players.get(this.lastDiscardPlayer)?.seatIndex 
        : -1;
    
    io.to(this.roomId).emit('win', { 
        winner: player.seatIndex.toString(), 
        winType: isSelfDraw ? 'selfDraw' : 'discard', 
        discarderSeat, 
        taiResult: result, 
        finalScore: score 
    });
    
    // ✅ 關鍵修正：檢查遊戲是否結束
    const gameEnded = this.checkGameEnd();
    
    if (gameEnded) {
        // 遊戲結束
        io.to(this.roomId).emit('gameEnd', { 
            reason: 'normal', 
            scores: Array.from(this.players.values()).map(p => ({ 
                name: p.name, score: p.score, seatIndex: p.seatIndex 
            })) 
        });
    } else {
        // ✅ 遊戲還沒結束，跳到下一個沒胡的玩家
        // 先設定 currentTurn 為下一個沒胡的玩家
        const nextIndex = this.getNextPlayerIndex();
        if (nextIndex !== -1) {
            this.currentTurn = nextIndex;
            setTimeout(() => { 
                // ✅ 再次檢查遊戲狀態，防止重複呼叫
                if (this.gameState !== 'finished' && !this._isNextTurnProcessing) {
                    this.nextTurn(); 
                }
            }, 1000);
        } else {
            this.endGame('normal');
        }
    }
    
    return { success: true, result, score };
}



  clearPendingActions() { 
      this.pendingActions = []; 
      this.waitingForAction = null; 
      this.clearTimers(); // 🌟 清除計時器
  }

scheduleNextTurn(delay = 300) {
      if (this.nextTurnTimer) {
          clearTimeout(this.nextTurnTimer);
      }
      this.nextTurnTimer = setTimeout(() => {
          this.nextTurnTimer = null;
          if (this.gameState !== 'finished') {
              this.nextTurn();
          }
      }, delay);
  }
  // 🌟 核心引擎：統一結算玩家的操作優先級
  resolvePendingActions() {
      if (!this.pendingActionQueue || this.pendingActionQueue.responses.length === 0) {
          this.pendingActionQueue = null;
          this.scheduleNextTurn(300);
          return;
      }

      // 1. 依照優先級由大到小排序
      const responses = this.pendingActionQueue.responses.sort((a, b) => b.priority - a.priority);
      
      // 2. 取出優先級最高的操作
      const highestAction = responses[0];
      console.log(`🏆 優先級結算：最高優先級操作為 [${highestAction.action}] by 玩家 ${highestAction.seat}`);

      // 清除 Queue 狀態
      this.pendingActionQueue = null;
      this.waitingForAction = null;

      // 3. 根據結果執行對應的原本邏輯
      if (highestAction.action === 'win') {
          // 🚨 多響支援：如果有多個人同時按了 win (同為最高優先級 4)，我們要把他們都抓出來！
          const winners = responses.filter(r => r.action === 'win').map(r => r.socketId);
          this.roundWinClaims = winners;
          this.executeMultiWin();
      } 
      else if (highestAction.action === 'kong') {
          this.playerKong(highestAction.socketId);
      } 
      else if (highestAction.action === 'pong') {
          this.playerPong(highestAction.socketId);
      } 
      else if (highestAction.action === 'chow') {
          this.playerChow(highestAction.socketId, highestAction.data ? highestAction.data.chowType : 'middle');
      } 
      else {
          // 大家全按了 Pass 或者都沒能操作，輪到下一家摸牌
          this.scheduleNextTurn(300);
      }
  }

  nextTurn() {
    if (this._isNextTurnProcessing) {
        console.log('⚠️ nextTurn 被鎖定，跳過');
        return;
    }
    
    // ✅ 檢查遊戲是否已結束
    if (this.gameState === 'finished') {
        console.log('遊戲已結束，不再執行 nextTurn');
        return;
    }
    
    this._isNextTurnProcessing = true;
    try {
        this.clearPendingActions();
        
        // ✅ 確保當前玩家沒有胡牌（如果有人胡了，getNextPlayerIndex 會跳過）
        let nextIndex = this.getNextPlayerIndex();
        console.log(`🔥 nextTurn: 從座位${this.currentTurn} 切換到座位${nextIndex}`);
        
        if (nextIndex === -1) { 
            this.endGame('draw'); 
            return; 
        }
        
        if (this.gameState === 'finished') return;
        
        this.currentTurn = nextIndex;
        const currentPlayer = this.getCurrentPlayer();
        console.log(`currentPlayer 完整資訊: name=${currentPlayer?.name}, isAI=${currentPlayer?.isAI}, type=${typeof currentPlayer?.isAI}`);
        console.log(`currentPlayer keys: ${Object.keys(currentPlayer).join(', ')}`);
console.log(`currentPlayer.isTing = ${currentPlayer.isTing}`);
console.log(`currentPlayer.hasOwnProperty('isTing') = ${currentPlayer.hasOwnProperty('isTing')}`);
        // ✅ 雙重確認：如果取得的是已胡牌玩家，直接結束
        if (!currentPlayer || currentPlayer.hasWon) {
            console.log('❌ 所有玩家都已胡牌或斷線');
            this.endGame('draw');
            return;
        }
        
        console.log(`當前玩家: ${currentPlayer.name}, isAI: ${currentPlayer.isAI}, 手牌: ${currentPlayer.hand.length}張`);
        for (let player of this.players.values()) player.hasDiscarded = false;
       
        // 摸牌
// 摸牌
const drawnTile = this.drawTile(currentPlayer.socketId);

if (!drawnTile) {
    console.log('牌牆已空，流局');
    this.endGame('draw');
    return;
}

console.log(`${currentPlayer.name} 摸到: ${drawnTile?.value}${drawnTile?.suit}`);

const canWin = this.checkCanWin(currentPlayer.socketId);
// 🌟 避免對已經叮牌的玩家重複執行耗時的聽牌運算
const canTing = (currentPlayer.isAI || currentPlayer.isTing) ? false : this.checkCanTing(currentPlayer.socketId);
const tingDetailsData = currentPlayer.isAI ? [] : this.generateTingDetails(currentPlayer.socketId);

        
        this.broadcastGameMessage(`輪到 ${currentPlayer.name} 摸牌`);
        io.to(this.roomId).emit('turnChange', { seat: this.currentTurn });
        
        // 發送狀態更新
        io.to(currentPlayer.socketId).emit('privateStateUpdate', { 
            success: true, 
            gameState: this.getPublicGameState(), 
            players: this.getPublicPlayersState(), 
            privateState: this.getPrivatePlayerState(currentPlayer.socketId) 
        });
        console.log(`canTing 檢查: isAI=${currentPlayer.isAI}, hand=${currentPlayer.hand.length}, melds=${currentPlayer.melds.length}`);
console.log(`canTing 結果: ${canTing}`);console.log(`nextTurn emit: isTing=${currentPlayer.isTing}, type=${typeof currentPlayer.isTing}`);
        io.to(currentPlayer.socketId).emit('yourTurn', { 
    drawnTile, 
 canWin: canWin, 
     canTing: canTing,  // ✅ AI 不用檢查
      isTing: currentPlayer.isTing|| false, 
      countdownSec: this.settings.timeLimit || 15, // 🌟 新增這行
      tingDetails: tingDetailsData,
    privateState: this.getPrivatePlayerState(currentPlayer.socketId) 
});
console.log(`發送 yourTurn: isTing=${currentPlayer.isTing}`);

        this.broadcastGameState(); 
        this.broadcastPlayerState();
        
        // AI 自動打牌
       if (currentPlayer.isAI || currentPlayer.isAFK) {
            console.log(`🤖 AI/託管 ${currentPlayer.name} 在 1000ms 後打牌`);
            setTimeout(() => { 
                if (this.gameState !== 'finished') {
                    this.aiDiscard(currentPlayer); 
                }
            }, 1000);
        } else {
            // 🌟 真人玩家開啟伺服器端 17 秒倒數計時 (容忍前端 15秒 + 2秒網路延遲)
            if (this.turnTimer) clearTimeout(this.turnTimer);
            this.turnTimer = setTimeout(() => {
                if (this.gameState === 'playing' && this.currentTurn === currentPlayer.seatIndex) {
                    console.log(`⏳ 玩家 ${currentPlayer.name} 出牌超時，強制轉為託管！`);
                    currentPlayer.isAFK = true;
                    this.broadcastGameMessage(`玩家 ${currentPlayer.name} 閒置超時，已轉為自動託管`, 'system');
                    this.broadcastPlayerState();
                    this.aiDiscard(currentPlayer);
                }
            }, (this.settings.timeLimit || 15) * 1000 + 2000);
        }
   } finally {
        // 🌟 修正：立即解除鎖定，不要用 500ms 的 setTimeout 導致 auto-discard 被吃掉！
        this._isNextTurnProcessing = false; 
    }
  }

aiDiscard(player) {
      if (this.gameState === 'finished') return;
      if (!player || player.hand.length === 0) return;
      
      if (this.checkCanWin(player.socketId)) {
          console.log(`🤖 AI ${player.name} 發現可以自摸！立刻胡牌！`);
          this.playerWin(player.socketId);
          return;
      }

      let targetIndex = -1;
      
      if (player.isTing) {
          if (player.hasDrawnAfterTing && player.lastDrawnTileId) {
              const forcedIndex = player.hand.findIndex(t => t.id === player.lastDrawnTileId);
              if (forcedIndex !== -1) targetIndex = forcedIndex;
              player.tingJiEligible = false;
          } else {
              player.hasDrawnAfterTing = true;
          }
      }
      
      if (targetIndex === -1) {
          targetIndex = this.calculateBestDiscard(player);
      }

      // 🌟 核心修正：不再呼叫會讓陣列減一的 canTingByBruteForce，改用內聯運算防止 13 !== 14 錯誤！
      const handWithoutDiscard = player.hand.filter((_, idx) => idx !== targetIndex);
      let isTingNow = false;
      
      if (!player.isTing) {
          for (let suit of ['wan', 'tong', 'tiao']) {
              for (let v = 1; v <= 9; v++) {
                  if (this.isAnyWinningHand([...handWithoutDiscard, { type: 'number', suit, value: v.toString() }], player.melds)) {
                      isTingNow = true; break;
                  }
              }
              if (isTingNow) break;
          }
          if (!isTingNow) {
              for (let h of ['東','南','西','北','中','發','白']) {
                  if (this.isAnyWinningHand([...handWithoutDiscard, { type: 'honor', suit: 'honor', value: h }], player.melds)) {
                      isTingNow = true; break;
                  }
              }
          }
      }

      if (!player.isTing && isTingNow) {
          console.log(`🤖 AI ${player.name} 自動宣告叮牌！`);
          // 確保只有在尚未叮牌時才宣告，防止無限遞迴
          if (this.checkCanTing(player.socketId)) {
              this.tingPlayer(player.socketId);
          }
      }

      const tileIdToDiscard = player.hand[targetIndex].id;
      this.discardTile(player.socketId, tileIdToDiscard);
  }

 calculateBestDiscard(player) {
      const hand = player.hand;
      let lowestScore = Infinity;
      let bestDiscards = [];

      // 🛡️ 戰術核心 1：掃描全場，看看是否已經有「其他玩家」宣告叮牌了？
      const isOpponentTing = Array.from(this.players.values()).some(p => p.socketId !== player.socketId && p.isTing);

      // 🎯 策略 A 【一向聽進攻】：如果打出某張牌能立刻聽牌，AI 依然會果斷選擇聽牌！
      for (let i = 0; i < hand.length; i++) {
          const remaining = hand.filter((_, idx) => idx !== i);
          let canTingAfterDiscard = false;
          
          for (let suit of ['wan', 'tong', 'tiao']) {
              for (let v = 1; v <= 9; v++) {
                  if (this.isAnyWinningHand([...remaining, { type: 'number', suit, value: v.toString() }], player.melds)) { 
                      canTingAfterDiscard = true; break; 
                  }
              }
              if (canTingAfterDiscard) break;
          }
          if (!canTingAfterDiscard) {
              for (let h of ['東','南','西','北','中','發','白']) {
                  if (this.isAnyWinningHand([...remaining, { type: 'honor', suit: 'honor', value: h }], player.melds)) { 
                      canTingAfterDiscard = true; break; 
                  }
              }
          }
          
          if (canTingAfterDiscard) {
              console.log(`🤖 AI ${player.name} 為了聽牌，決定打出 ${hand[i].value}${hand[i].suit}`);
              return i; 
          }
      }

      // 🎯 策略 B 【最大機率入章 / 防守安全牌】：掃描全手牌，找出價值最低（或最安全）的牌丟掉
      for (let i = 0; i < hand.length; i++) {
          // 將「對手是否聽牌」的警報傳給評分器
          let score = this.evaluateTileImportance(hand, i, isOpponentTing);
          
          if (score < lowestScore) {
              lowestScore = score;
              bestDiscards = [i];
          } else if (score === lowestScore) {
              bestDiscards.push(i);
          }
      }
      
      // 隨機從最低分（最廢/最安全）的牌中挑一張丟
      return bestDiscards[Math.floor(Math.random() * bestDiscards.length)];
  }

  // ========================================================
  // 🧠 升級版核心：AI 留牌與防守評分器
  // ========================================================
  evaluateTileImportance(hand, index, isOpponentTing = false) {
      const tile = hand[index];
      let score = 0;
      const sameSuit = hand.filter((t, i) => i !== index && t.suit === tile.suit && t.type === tile.type);

      // ----------------------------------------------------
      // 【進攻價值評估】(原本的邏輯：搭子、對子越完整分數越高)
      // ----------------------------------------------------
      if (tile.type === 'honor') {
          const identicalCount = sameSuit.filter(t => t.value === tile.value).length;
          if (identicalCount >= 2) score += 100; 
          else if (identicalCount === 1) score += 50; 
      } else {
          const val = parseInt(tile.value);
          const identicalCount = sameSuit.filter(t => parseInt(t.value) === val).length;
          
          if (identicalCount >= 2) score += 100; 
          else if (identicalCount === 1) score += 50; 

          const hasMinus2 = sameSuit.some(t => parseInt(t.value) === val - 2);
          const hasMinus1 = sameSuit.some(t => parseInt(t.value) === val - 1);
          const hasPlus1  = sameSuit.some(t => parseInt(t.value) === val + 1);
          const hasPlus2  = sameSuit.some(t => parseInt(t.value) === val + 2);

          if (hasMinus1 && hasPlus1) score += 90; 
          else if ((hasMinus1 && hasMinus2) || (hasPlus1 && hasPlus2)) score += 90; 

          if (hasMinus1 || hasPlus1) {
              if (val === 1 || val === 9) score += 20; 
              else score += 40; 
          }
          if (hasMinus2 || hasPlus2) {
              score += 25;
          }
          if (identicalCount === 0 && !hasMinus1 && !hasPlus1 && !hasMinus2 && !hasPlus2) {
              if (val === 1 || val === 9) score += 5; 
              else if (val === 2 || val === 8) score += 10;
              else score += 15; 
          }
      }

      // ----------------------------------------------------
      // 🛡️ 【終極防守模式】(有人聽牌時強制啟動)
      // ----------------------------------------------------
      if (isOpponentTing) {
          // 檢查這張牌是否曾經被丟到海底？(現物 / 絕對安全牌)
          const isDiscarded = this.discardPile.some(t => t.suit === tile.suit && t.value === tile.value);

          if (isDiscarded) {
              // 🌟 這是海底出現過的「安全牌」！把它的保留分數扣到極低，AI 會瘋狂優先丟它保命！
              score -= 2000; 
          } else {
              // ⚠️ 這是場上沒出現過的「危險生張」！依據點炮危險程度大幅增加保留分數，死都不丟！
              if (tile.type === 'number') {
                  const val = parseInt(tile.value);
                  // 4, 5, 6 中張最容易點炮，視為核彈級危險
                  if (val >= 4 && val <= 6) score += 1000; 
                  // 2, 3, 7, 8 次危險
                  else if (val >= 2 && val <= 8) score += 600; 
                  // 1, 9 邊張稍微安全，但生張依然有風險
                  else score += 300; 
              } else if (tile.type === 'honor') {
                  // 生張字牌容易點炮對對糊或單釣
                  score += 400; 
              }
          }
      }

      return score;
  }
 fillWithAI() {
    const aiNames = ['小明', '小華', '小美', '阿強'];
    
    // 🌟 這裡填入你 Unity 裡面總共有幾張頭像照片 (例如: 5)
    const totalAvatars = 5; 

    let aiIndex = 0;
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
        const player = this.getPlayerBySeatIndex(seatIndex);
        if (!player) {
            const aiSocketId = `ai_${this.roomId}_${seatIndex}`;
            
            // 🌟 讓 AI 隨機抽一個頭像編號 (例如產生 0 ~ 4 的隨機整數)
            const randomAvatarId = Math.floor(Math.random() * totalAvatars);
            
            // 🌟 把原本的名字加上暗號，變成例如 "小明|2"
            const aiFinalName = `${aiNames[aiIndex % aiNames.length]}|${randomAvatarId}`;

            const aiPlayer = { 
                socketId: aiSocketId, id: aiSocketId, 
                name: aiFinalName, // ✅ 這裡把原本單純的名字，換成有暗號的名字
                seatIndex, hand: [], melds: [], flowers: [], score: 0, 
                isReady: true, isOnline: true, isDealer: false, 
                hasWon: false, hasDiscarded: false, isAI: true, 
                // ✅ 叮牌相關屬性
                isTing: false,
                tingType: null,
                isEatTing: false,
                isMenqingTing: false,
                hasDrawnAfterTing: false,
                tingJiEligible: false,
            };
            this.players.set(aiSocketId, aiPlayer);
            this.playerOrder[seatIndex] = aiSocketId;
            this.roomStats.set(aiSocketId, { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 });
            aiIndex++;
        }
    }
  }
  startGame() {
    if (this.gameState !== 'waiting') return false;
    if (!this.allPlayersReady()) return false;
    
    this.fillWithAI();

    // 第一局隨機打亂座位，並隨機起莊
    if (this.startingDealer === -1) {
        for (let i = this.playerOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playerOrder[i], this.playerOrder[j]] = [this.playerOrder[j], this.playerOrder[i]];
        }
        for (let i = 0; i < this.playerOrder.length; i++) {
            const p = this.players.get(this.playerOrder[i]);
            if (p) p.seatIndex = i;
        }

        this.dealer = Math.floor(Math.random() * 4);
        this.startingDealer = this.dealer;
        this.windRound = 0;
        this.dealerRound = 0;
    }

    this.currentTurn = this.dealer;
    
    
    for (let player of this.players.values()) {
        player.isDealer = (player.seatIndex === this.dealer);
    }
    
    // 發送 gameStart 讓 Unity 載入遊戲場景
    io.to(this.roomId).emit('gameStart', { 
        players: this.getPublicPlayersState(), 
        currentTurn: this.currentTurn, 
        dealer: this.dealer, 
        windRound: this.windRound,
        dealerRound: this.dealerRound 
    });

    this.checkDiceAndStart(); // 呼叫骰子與開局處理
    return true;
  }
 checkDiceAndStart() {
      this.diceValues = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
      ];
      this.broadcastGameMessage(`開局擲骰: ${this.diceValues.join(', ')}`);

      // 1. 🌟 先廣播空桌狀態與骰子，讓 Unity 有 4 秒鐘可以清空舊牌並播放骰子動畫！
      this.broadcastGameState();

      // 2. 🌟 延遲 4 秒後，才正式發牌與判定賞罰！
      setTimeout(() => {
          
          this.dealTiles(); // 🎯 骰子飛完後才發牌！

          // 結算開局骰子即時賞罰
          const isTriple = (this.diceValues[0] === this.diceValues[1] && this.diceValues[1] === this.diceValues[2]);
          if (isTriple) {
              this.executeInstantPayout(this.dealer, [0, 1, 2, 3], 1, '圍骰', 'collect');
          } else {
              const sorted = [...this.diceValues].sort((a, b) => a - b);
              if (sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3) {
                  this.executeInstantPayout(this.dealer, [0, 1, 2, 3], 1, '123骰', 'penalize');
              }
          }

          const sortedDice = [...this.diceValues].sort((a, b) => a - b);
          const isStraight = (sortedDice[0] + 1 === sortedDice[1] && sortedDice[1] + 1 === sortedDice[2]);
          const isSouthOrNorth = (this.windRound === 1 || this.windRound === 3);

          if ((isTriple || isStraight || isSouthOrNorth) && this.settings.enableExchange !== false) {
              this.gameState = 'exchanging';
              this.exchangeData.clear();
              
              this.exchangeDieRoll = Math.floor(Math.random() * 6) + 1;
              if (this.exchangeDieRoll === 1) {
            // 🌟 尋找當前莊家
            const dealerPlayer = Array.from(this.players.values()).find(p => p.seatIndex === this.dealer);
            
            if (dealerPlayer && dealerPlayer.isAI) {
                // AI 莊家特權：立刻隨機決定換 3~6 張牌
                this.exchangeRequiredCount = Math.floor(Math.random() * 4) + 3;
                this.broadcastGameMessage(`莊家 (AI) 擲出 1 點，決定全場換 ${this.exchangeRequiredCount} 張牌！`, 'system');
            } else {
                // 真人莊家：設為 0，等待莊家客戶端傳送決定
                this.exchangeRequiredCount = 0;
            }
        }
              else if (this.exchangeDieRoll === 2 || this.exchangeDieRoll === 3) this.exchangeRequiredCount = 3;
              else this.exchangeRequiredCount = this.exchangeDieRoll;

              let msg = this.exchangeRequiredCount === 0 ? "3~6張" : `${this.exchangeRequiredCount}張`;
              this.broadcastGameMessage(`換牌機制發動！莊家擲出 ${this.exchangeDieRoll} 點，請換 ${msg} 牌`, 'system');
              
              this.broadcastGameState();
              this.broadcastPlayerState();
              
             for (let player of this.players.values()) {
                  if (player.isAI) {
                      // 🌟 修正：只有當換牌數確定了，或者是 AI 自己當莊家時，才允許 AI 出牌！
                      if (this.exchangeRequiredCount !== 0 || player.seatIndex === this.dealer) {
                          setTimeout(() => this.aiSubmitExchange(player), 1000 + Math.random() * 1500);
                      }
                  } else {
                      io.to(player.socketId).emit('yourHand', { hand: player.hand, flowers: player.flowers, seat: player.seatIndex });
                  }
              }
          } else {
              this.gameState = 'playing';
              this.startFirstTurn();
          }
      }, 4000); // ⏳ 完美等待 4 秒鐘
  }

 aiSubmitExchange(player) {
      if (this.gameState !== 'exchanging') return;
      
      // 🌟 AI 決定交出幾張
      let count = this.exchangeRequiredCount;
      if (count === 0) {
          count = Math.floor(Math.random() * 4) + 3; // 隨機 3~6 張
      }

      const normalTiles = player.hand.filter(t => t.type !== 'flower');
      const tilesToExchange = normalTiles.slice(0, count).map(t => t.id);
      this.submitExchangeTiles(player.socketId, tilesToExchange);
  }

  submitExchangeTiles(socketId, tileIds) {
      if (this.gameState !== 'exchanging') return { success: false, reason: '不在換牌階段' };
      
      // 🌟 莊家決定數量的特權
        if (this.exchangeRequiredCount === 0 && player.seatIndex === this.dealer) {
            this.exchangeRequiredCount = tileIds.length; 
            this.broadcastGameMessage(`莊家決定全場換 ${this.exchangeRequiredCount} 張牌！請閒家開始選牌。`, 'system');
            
            // 🌟 喚醒原本在發呆等待的 AI 閒家，讓他們開始選牌
            for (let p of this.players.values()) {
                if (p.isAI && p.seatIndex !== this.dealer) {
                    setTimeout(() => this.aiSubmitExchange(p), 1000 + Math.random() * 1500);
                }
            }

            // 立刻廣播給其他閒家，解鎖他們的按鈕
            this.broadcastGameState(); 
        }
      
      const player = this.players.get(socketId);
      if (this.exchangeData.has(socketId)) return { success: false, reason: '已提交過換牌' };

      // 取出要換的牌
      const exchangeTiles = [];
      for (let id of tileIds) {
          const idx = player.hand.findIndex(t => t.id === id);
          if (idx !== -1) {
              const tile = player.hand.splice(idx, 1)[0];
              if (tile.type === 'flower') return { success: false, reason: '不可交出花牌' }; // 防呆
              exchangeTiles.push(tile);
          }
      }

      this.exchangeData.set(socketId, exchangeTiles);
      io.to(socketId).emit('gameMessage', { message: '已確認換牌，等待其他玩家...', type: 'info' });

      // 4 人都交了，進行隨機交換池分配
      if (this.exchangeData.size === 4) {
          this.processExchange();
      }
      return { success: true };
  }

  processExchange() {
      let success = false;
      let assignments = new Map();

      // 🌟 使用重試機制解決死鎖 (Derangement Problem)
      while (!success) {
          let pool = [];
          // 把所有玩家交出的牌放入大池子，並標記原主人
          for (let [socketId, tiles] of this.exchangeData) {
              for (let t of tiles) pool.push({ owner: socketId, tile: t });
          }

          // 洗亂大池子
          for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [pool[i], pool[j]] = [pool[j], pool[i]];
          }

          assignments.clear();
          let isValidDistribution = true;

          // 為每個玩家抽牌
          for (let [socketId, submittedTiles] of this.exchangeData) {
              const requiredCount = submittedTiles.length; // 拿回相同的數量
              let assignedTiles = [];

              for (let i = pool.length - 1; i >= 0; i--) {
                  // 🌟 確保抽到的牌不是自己原本交出去的
                  if (pool[i].owner !== socketId) {
                      assignedTiles.push(pool.splice(i, 1)[0].tile);
                      if (assignedTiles.length === requiredCount) break;
                  }
              }

              // 如果剩下的牌都是自己的，導致拿不滿，宣告失敗並重洗
              if (assignedTiles.length !== requiredCount) {
                  isValidDistribution = false; 
                  break;
              }
              assignments.set(socketId, assignedTiles);
          }
          if (isValidDistribution) success = true;
      }

      // 發放牌並理牌
      for (let [socketId, player] of this.players) {
          const receivedTiles = assignments.get(socketId);
          player.hand.push(...receivedTiles);
          this.sortHand(player);
      }
      
      this.exchangeData.clear();
      this.gameState = 'playing';
      this.broadcastGameMessage('牌池交換完成！遊戲開始！', 'system');
      this.startFirstTurn();
  }

  // 🌟 新增：開始第一回合 (從原本 startGame 拆出來)
  startFirstTurn() {
      this.broadcastGameState(); 
      this.broadcastPlayerState();
      
      for (let i = 0; i < 4; i++) {
          const p = this.getPlayerBySeatIndex(i);
          if (p && !p.isAI) {
              io.to(p.socketId).emit('yourHand', { hand: p.hand, flowers: p.flowers, seat: i });
          }
      }
      
      const dealerPlayer = this.getPlayerBySeatIndex(this.dealer);
      if (dealerPlayer && !dealerPlayer.isAI) {
          io.to(dealerPlayer.socketId).emit('yourTurn', { isFirstTurn: true,
            countdownSec: this.settings.timeLimit || 15 // 🌟 新增這行
           });
      }
      io.to(this.roomId).emit('turnChange', { seat: this.currentTurn });
      
      if (dealerPlayer && dealerPlayer.isAI) {
          setTimeout(() => { this.aiDiscard(dealerPlayer); }, 1500);
      }
  }
endGame(reason = 'normal') {
    this.gameState = 'finished';
    
    // 🌟 新增：判斷連莊或下莊
    this.dealerKeeps = false;
    let message = '遊戲結束';
    
    if (reason === 'draw') {
        this.dealerKeeps = true; // 流局連莊
        message = '流局！莊家連莊';
    } else {
        const dealerPlayer = this.getPlayerBySeatIndex(this.dealer);
        if (dealerPlayer && dealerPlayer.hasWon) {
            this.dealerKeeps = true; // 莊家胡牌連莊
            message = '莊家胡牌！連莊';
        } else {
            message = '閒家胡牌！下莊';
        }
    }
    this.broadcastGameMessage(message);

   const finalScores = [];
    for (let player of this.players.values()) { 
        finalScores.push({ name: player.name, score: player.score });
        
        // 🌟 核心修正：遊戲結束時，將所有真人玩家的「準備狀態」強行拔除！
        // 這樣下一局必須「每個人」都真正按下確認，才不會被別人偷跑！
        player.isReady = player.isAI ? true : false; 
    }
    
    io.to(this.roomId).emit('gameEnd', { reason, scores: finalScores });
    this.broadcastGameState();
    
    // 🌟🌟🌟 強制廣播無碼的真實手牌給 Unity 攤牌！
    this.broadcastPlayerState();
  }
// 🌟 新增：開始下一局
  startNextRound() {

    // 🌟 核心修正：根據房間設定動態獲取總圈數 (1圈、2圈、4圈)
    const maxCircles = this.settings.totalCircles || 4;

   // 如果下莊，更換莊家與局數
    if (!this.dealerKeeps) {
        this.dealer = (this.dealer + 1) % 4;
        this.dealerRound = (this.dealer - this.startingDealer + 4) % 4;
        if (this.dealer === this.startingDealer) {
            this.windRound++;
        }
        this.dealerConsecutive = 0; // 🌟 下莊，連莊歸零
    } else {
        this.dealerConsecutive++;   // 🌟 連莊成功，次數 +1
    }
    
    // 🌟 核心修正：當圈數達到上限時，不開新局，直接引爆終極戰績大結算！
    if (this.windRound >= maxCircles) {
        this.executeFinalMatchSummary();
        return;
    }
    
    // 重置所有遊戲與玩家狀態
    this.gameState = 'playing';
    this.wall = [];
    this.discardPile = [];
    this.consecutiveDiscards = []; // 🌟 確保新局清空追牌紀錄
    this.lastDiscard = null;
    this.lastDiscardPlayer = null;
    this.waitingForAction = null;
    this.pendingActions = [];
    
    for (let player of this.players.values()) {
        player.hand = [];
        player.melds = [];
        player.flowers = [];
        player.hasWon = false;
        player.isTing = false;
        player.tingType = null;
        player.isEatTing = false;
        player.isMenqingTing = false;
        player.hasDrawnAfterTing = false;
        player.tingJiEligible = false;
        player.hasDiscarded = false;
        player.isReadyNext = false; // 重置準備狀態
        player.isDealer = (player.seatIndex === this.dealer);
    }
    
   this.currentTurn = this.dealer;
    
    const winds = ['東', '南', '西', '北'];
    this.broadcastGameMessage(`新一局開始！${winds[this.windRound]}圈${winds[this.dealerRound]}局`);

    // 🌟 核心修正：先發送 gameStart 讓所有客戶端「清空並重置」上一局的 UI 面板！
    io.to(this.roomId).emit('gameStart', { 
        players: this.getPublicPlayersState(), 
        currentTurn: this.currentTurn, 
        dealer: this.dealer, 
        windRound: this.windRound,
        dealerRound: this.dealerRound 
    });

    // 🌟 核心修正：大腦清空後，伺服器此時才正式發牌與擲骰子，確保新牌不會與舊牌衝突！
    //this.dealTiles();
    this.checkDiceAndStart(); 
  }

  // 🌟 新增：終極大結算發動引擎
  executeFinalMatchSummary() {
      this.gameState = 'summary'; // 🌟 核心修正：狀態必須是 'summary'
      this.broadcastGameMessage("✨ 整場大賽完全結束！正在生成終極總結算面板... ✨", 'system');

      const matchResults = []; // 確保這裡只有這唯一的一個宣告！
      
      for (let [socketId, player] of this.players) {
          const stats = this.roomStats.get(socketId) || { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 };
          matchResults.push({
              seatIndex: player.seatIndex,
              name: player.name,
              finalScore: player.score,
              isAI: player.isAI,
              stats: stats // 包含所有累積的戰績
          });
      }

      // 按最終分數從高到低進行戰力排行
      matchResults.sort((a, b) => b.finalScore - a.finalScore);

      // 🌟 發送終極大結算事件給前端 Unity
      io.to(this.roomId).emit('finalMatchSummary', {
          roomId: this.roomId,
          results: matchResults
      });

      console.log(`🏆 [大結算完成] 全場總冠軍: ${matchResults[0]?.name} (${matchResults[0]?.finalScore}分)`);
  }

  // 🌟 請在這裡整段貼上 executeMultiWin 方法：
executeMultiWin() {
    const winnersCount = this.roundWinClaims.length;
    if (winnersCount === 0) return;

    // 🌟🌟🌟 核心關鍵修正：單響分流器 🌟🌟🌟
    if (winnersCount === 1) {
        const singleWinnerSocketId = this.roundWinClaims[0];
        this.roundWinClaims = []; // 清空集票箱，防止二次污染
        this.playerWin(singleWinnerSocketId); // 呼叫原本完美的單響胡牌方法
        return;
    }

    const discarderPlayer = this.players.get(this.lastDiscardPlayer);
    
    // 🌟 修正位置 1：將放銃統計移出迴圈！一次多響事件，在大賽戰績上精準計為 1 次放銃。
    if (discarderPlayer) {
        const dStats = this.roomStats.get(this.lastDiscardPlayer);
        if (dStats) dStats.chongCount += 1; 
    }

    let extraTai = 0;
    let multiWinName = '';
    if (winnersCount === 2) { extraTai = 10; multiWinName = '雙響額外賞'; }
    else if (winnersCount === 3) { extraTai = 20; multiWinName = '三響額外賞'; }

   const gameResults = [];
    
    // 🌟 核心修復 3：取得客製化番表
    const customRules = this.getCustomTaiRules();

    for (let winnerSocketId of this.roundWinClaims) {
        const winnerPlayer = this.players.get(winnerSocketId);
        const evalHand = [...winnerPlayer.hand, this.lastDiscard];
        
        const taiResult = taiCalculator.calculateTai({
            hand: evalHand, 
            melds: winnerPlayer.melds, 
            winType: 'discard',
            extraInfo: { 
                flowers: winnerPlayer.flowers, 
                // 🌟 核心修正
                isDealer: winnerPlayer.seatIndex === this.dealer, 
                winTile: this.lastDiscard, 
                tingType: winnerPlayer.tingType,
                isTing: winnerPlayer.isTing,
                isTingBeforeDraw: winnerPlayer.tingJiEligible,
                discardCount: this.discardPile.length,
                dealerConsecutive: this.dealerConsecutive || 0,
                // 🌟 核心修正
                isDiscarderDealer: (this.lastDiscard && this.lastDiscard.discardedBy !== undefined) ? (this.lastDiscard.discardedBy === this.dealer) : false,
                wallCount: this.wall.length
            }
        }, customRules); // ✅ 補上第二個參數);

       if (extraTai > 0) {
            taiResult.totalTai += extraTai;
            taiResult.details.push({ name: multiWinName, tai: extraTai });
            // 🌟 修正：多響的額外賞也要記得轉換成實際分數 (* 5)
            taiResult.finalScore = (taiResult.baseTai + taiResult.totalTai) * 5;
        }

        const scoreDelta = taiResult.finalScore;
       // ==========================================
        // 🌟 替換這裡：多響時，贏家各自對放銃者進行拉人或斷纜結算
        // ==========================================
        if (discarderPlayer) {
            this.processPulling(winnerPlayer.seatIndex, discarderPlayer.seatIndex, scoreDelta, false);
        }
        // ==========================================
        
        winnerPlayer.hasWon = true;
        
        // 🌟 多響贏家戰績累加
        const wStats = this.roomStats.get(winnerSocketId);
        if (wStats) wStats.winCount++;

        gameResults.push({ 
            seatIndex: winnerPlayer.seatIndex, 
            name: winnerPlayer.name, 
            taiResult: taiResult, 
            finalScore: scoreDelta 
        });
        
        this.broadcastGameMessage(
            `${winnerPlayer.name} 胡牌！${taiResult.details.map(d => d.name).join('、')} 共 ${taiResult.totalTai} 番`, 
            'win'
        );
    }

    // 儲存多響快取，留待下局執行自摸報仇
    if (winnersCount >= 2 && discarderPlayer) {
        this.lastRoundMultiWinBlaster = discarderPlayer.seatIndex;
        this.lastRoundMultiWinners = this.roundWinClaims.map(sid => this.players.get(sid).seatIndex);
    } else {
        this.lastRoundMultiWinBlaster = null;
        this.lastRoundMultiWinners = [];
    }
    
    // 通知全體玩家多響胡牌明細（用於播放特效或聊天室宣告）
    const discarderSeat = discarderPlayer ? discarderPlayer.seatIndex : -1;
    io.to(this.roomId).emit('win', { 
        winner: "multi", // 多響標記
        winType: 'discard', 
        discarderSeat, 
        multiResults: gameResults 
    });

    this.clearPendingActions();
    this.roundWinClaims = [];

    // 🌟 終極斷纜清理：多響結算完畢後，執行全域清理
const winnerSeats = this.roundWinClaims.map(sid => this.players.get(sid).seatIndex);
this.cleanupUnrelatedPulls(winnerSeats); // 🌟 傳入多響的所有贏家座位
    // 🌟 直接交給原本健全的 endGame 處理局終與連莊邏輯！
    this.endGame('normal');
}

// 🌟 終極斷纜清理：將這局的「贏家座位」傳進來
  cleanupUnrelatedPulls(winnerSeats = []) {
      for (let c = 0; c < 4; c++) {
          for (let d = 0; d < 4; d++) {
              if (this.pullLedger[c][d].amount > 0) {
                  // 🌟 核心修正：如果債主(c)這局沒有胡牌，他的拉莊就被斷纜清空！
                  // 這樣 A 胡 B 後，A 繼續胡 C，A 對 B 的拉莊就會完美保留！
                  if (!winnerSeats.includes(c)) {
                      this.pullLedger[c][d].amount = 0;
                      this.pullLedger[c][d].count = 0;
                  }
              }
          }
      }
  }

 checkGameEnd() {
    const winners = [];
    for (let player of this.players.values()) { 
        if (player.hasWon) winners.push(player); 
    }
    
    // ✅ 一人胡牌就結束
    if (winners.length >= 1) { 
        this.endGame('normal'); 
        return true; 
    }
    return false;
}

  // server.js - GameRoom 類別中
getAvailableActions(socketId) {
    const player = this.players.get(socketId);
    if (!player) return [];
    
    const actions = [];
    
    // ✅ 檢查手牌中是否有暗槓（4張相同）
    const handCounts = {};
    for (let tile of player.hand) {
        if (tile.type !== 'flower') {
            const key = `${tile.suit}_${tile.value}`;
            handCounts[key] = (handCounts[key] || 0) + 1;
        }
    }
    
    for (let [key, count] of Object.entries(handCounts)) {
        if (count === 4) {
            const [suit, value] = key.split('_');
            actions.push({ 
                type: 'anKong', 
                key: key,
                tile: { suit, value, type: suit === 'honor' ? 'honor' : 'number' }
            });
        }
    }
    
    // ✅ 檢查是否有加槓（碰過的牌手上有第四張）
    for (let i = 0; i < player.melds.length; i++) {
        const meld = player.melds[i];
        if (meld.type === 'pong') {
            const pongTile = meld.tiles[0];
            const hasFourth = player.hand.some(t => 
                t.type === pongTile.type && 
                t.suit === pongTile.suit && 
                t.value === pongTile.value
            );
            if (hasFourth) {
                actions.push({ 
                    type: 'jiaKong', 
                    meldIndex: i, 
                    tile: pongTile 
                });
            }
        }
    }
    
    return actions;
}

  getTileDisplayName(tile) {
    if (tile.type === 'number') { const suitNames = { 'wan': '萬', 'tong': '筒', 'tiao': '索' }; return `${tile.value}${suitNames[tile.suit] || ''}`; }
    else if (tile.type === 'honor') return tile.value;
    else if (tile.type === 'flower') return tile.value;
    return '';
  }
}



// ============================================
// 遊戲管理器
// ============================================

class GameManager {
  constructor() { this.rooms = new Map(); this.playerRooms = new Map();}

  createRoom(settings = {}) {
    const roomId = this.generateRoomId();
    const defaultSettings = { 
        maxPlayers: 4, baseScore: 5, minTai: 1, timeLimit: 15, 
        totalCircles: 4, enableExchange: true, ...settings 
    };
    const room = new GameRoom(roomId, defaultSettings);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) { return this.rooms.get(roomId); }

  getPlayerRoom(socketId) { const roomId = this.playerRooms.get(socketId); return this.rooms.get(roomId); }

  joinRoom(socketId, roomId, playerData) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, reason: '房間不存在' };
    if (room.gameState !== 'waiting') return { success: false, reason: '遊戲已開始' };
    const success = room.addPlayer(socketId, playerData);
    if (!success) return { success: false, reason: '房間已滿' };
    this.playerRooms.set(socketId, roomId);
    return { success: true, room };
  }

  leaveRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(socketId);
      let hasActivePlayer = false;
      for (let player of room.players.values()) { if (player.isOnline) { hasActivePlayer = true; break; } }
      if (!hasActivePlayer) this.rooms.delete(roomId);
    }
    this.playerRooms.delete(socketId);
  }

  generateRoomId() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

  getRoomList() {
    const rooms = [];
    for (let [roomId, room] of this.rooms) {
      if (room.gameState === 'waiting') rooms.push({ roomId, playerCount: room.players.size, maxPlayers: room.settings.maxPlayers });
    }
    return rooms;
  }
}

const gameManager = new GameManager();

// ============================================
// Socket.IO 事件處理
// ============================================

io.on('connection', (socket) => {
  console.log(`玩家連線: ${socket.id}`);
  socket.onAny((eventName) => { console.log(`收到事件: ${eventName}`); });

  socket.on('createRoom', (data) => {
    // 🌟 修正：把創建的房間號碼印出來，方便你對照輸入！
    console.log('收到 createRoom 事件，玩家:', data.playerName);
    try {
        const room = gameManager.createRoom(data.settings);
        console.log(`✅ 成功建立房間，號碼為: 【 ${room.roomId} 】`); // 🌟 新增這行

        const joinResult = gameManager.joinRoom(socket.id, room.roomId, { id: socket.id, name: data.playerName || '玩家', initialScore: data.initialScore || 0 });
        if (joinResult.success) {
            socket.join(room.roomId);
            socket.emit('roomCreated', { success: true, roomId: room.roomId, gameState: room.getPublicGameState(), players: room.getPublicPlayersState(), privateState: room.getPrivatePlayerState(socket.id) });
            io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
            io.to(room.roomId).emit('gameMessage', { message: `${data.playerName} 創建了房間`, type: 'system' });
        } else { socket.emit('error', { message: joinResult.reason }); }
    } catch (error) { console.error('創建房間錯誤:', error); socket.emit('error', { message: '伺服器錯誤' }); }
  });
  // 🌟 完美防禦版：房間設定監聽器 (server.js)
  socket.on('updateRoomSettings', (data) => {
    try {
        let settings = data;

        // 🛡️ 防禦一：如果 Socket.io 把資料包在陣列裡，自動拆殼取出第一項
        if (Array.isArray(data)) {
            settings = data[0];
        }

        // 🛡️ 防禦二：如果拆殼後是 JSON 字串，進行安全解析
        if (typeof settings === 'string') {
            try {
                settings = JSON.parse(settings);
            } catch(e) {
                console.error("解析 C# 傳來的設定字串失敗:", e);
            }
        }

        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return socket.emit('error', { message: '不在房間中' });
        if (room.gameState !== 'waiting') return socket.emit('error', { message: '遊戲已經開打，無法變更設定' });
        
        // 只有第一個進房的人（座位 0 / 房主）有特權修改設定
        if (room.playerOrder[0] !== socket.id) return socket.emit('error', { message: '只有房主可以更改房間設定' });

        // ⚙️ 寫入圈數 (同時支援 totalCircles 或 rounds，徹底防呆)
        if (settings && settings.totalCircles !== undefined) {
            room.settings.totalCircles = parseInt(settings.totalCircles);
        } else if (settings && settings.rounds !== undefined) {
            room.settings.totalCircles = parseInt(settings.rounds);
        }
        if (settings && settings.customTaiTable) {
            room.settings.customTaiTable = settings.customTaiTable;
        }
        
        // ⚙️ 🌟 核心修正：破除 !! 盲區，採用「嚴格值比對」
        // 只有當前端明確傳來 布林值 true 或 字串 'true' 時才算開啟，其餘（包含 false）一律關閉！
        if (settings && settings.hasOwnProperty('enableExchange')) {
            room.settings.enableExchange = (settings.enableExchange === true || settings.enableExchange === 'true');
        }

        // 向全房間同步最新設定
        io.to(room.roomId).emit('roomSettingsUpdated', room.settings);
        
        const msg = `房間設定已更新：打 ${room.settings.totalCircles} 圈，換牌機制：${room.settings.enableExchange ? '開啟' : '關閉'}`;
        room.broadcastGameMessage(msg, 'system');
    } catch (error) { console.error('更新房間設定錯誤:', error); }
  });
// 🌟 核彈級作弊通道：一鍵直接進入大總結算 (server.js)
  socket.on('debugSkipRound', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        
        if (room.gameState === 'waiting' || room.gameState === 'summary') return;

        room.broadcastGameMessage("☢️ [Debug] 核彈級作弊啟動：直接引爆整場大總結算！", 'system');
        
        room.waitingForAction = [];
        if (room.actionTimeout) clearTimeout(room.actionTimeout);
        for (let [sid, p] of room.players) if (p) p.isReady = false;

        room.gameState = 'summary';

        // ✅ 整塊替換成這樣（正確去 roomStats 提取）：
        const results = Array.from(room.players.values()).map(p => {
            const pStats = room.roomStats.get(p.socketId) || { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 };
            return {
                seatIndex: p.seatIndex,
                name: p.name,
                finalScore: p.score || 0,
                isAI: p.isAI,
                stats: pStats // 🌟 正確抓取保險箱裡的戰績
            };
        }).sort((a, b) => b.finalScore - a.finalScore);

        const summaryData = {
            roomId: room.roomId,
            results: results
        };

        // 廣播大結局！
        io.to(room.roomId).emit('finalMatchSummary', summaryData);

    } catch (error) { console.error('核彈級作弊跳局錯誤:', error); }
  });

  // 🌟 1. 處理玩家在遊戲中點擊「確認退出」：提前引爆大總結算
  socket.on('forceForfeitMatch', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState === 'waiting' || room.gameState === 'summary') return;

        room.broadcastGameMessage(`⚠️ 玩家 ${room.players.get(socket.id).name} 選擇退出，對局提早結束！`, 'system');
        
        // 強制切換至總結算狀態
        room.gameState = 'summary';
        room.waitingForAction = [];
        if (room.actionTimeout) clearTimeout(room.actionTimeout);

        // 打包當前累積的全場戰績
        const results = Array.from(room.players.values()).map(p => {
            const pStats = room.roomStats.get(p.socketId) || { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 };
            return {
                seatIndex: p.seatIndex,
                name: p.name,
                finalScore: p.score || 0,
                isAI: p.isAI,
                stats: pStats // 🌟 正確抓取保險箱裡的戰績
            };
        }).sort((a, b) => b.finalScore - a.finalScore);

        // 向全桌廣播大總結算畫面
        io.to(room.roomId).emit('finalMatchSummary', { roomId: room.roomId, results });
    } catch (e) { console.error('強制退出處理錯誤:', e); }
  });

  
  // 🌟 2. 總結算選擇「再來一場」：原地滿血復活，分數清零，秒速洗牌開新大賽！
  // 🌟 2. 總結算選擇「再來一場」：原地滿血復活，分數清零，秒速洗牌開新大賽！
  socket.on('tournamentPlayAgain', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== 'summary') return;

        // 🌟 核心修正 2：全大賽參數與「實體牌桌」徹底歸零清空！
        room.windRound = 0;
        room.dealerRound = 0;
        room.dealer = 0; 
        room.gameState = 'playing';
        room.wall = [];
        room.discardPile = [];
        room.consecutiveDiscards = [];
        room.lastDiscard = null;
        room.lastDiscardPlayer = null;
        room.waitingForAction = [];
        if (room.actionTimeout) clearTimeout(room.actionTimeout);

        // 清空拉莊帳本
        for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                room.pullLedger[i][j] = { amount: 0, count: 0 };
            }
        }
        
        for (let [sid, p] of room.players) {
            if (p) {
                p.score = 0;
                p.isReady = true;
                p.hand = [];         // 徹底清空手牌
                p.flowers = [];      // 徹底清空花牌
                p.melds = [];        // 徹底清空副露
                p.hasWon = false;
                p.isTing = false;
                p.tingType = null;
                p.isEatTing = false;
                p.isMenqingTing = false;
                p.hasDrawnAfterTing = false;
                p.tingJiEligible = false;
                p.hasDiscarded = false;
                p.isReadyNext = false;
                p.isDealer = (p.seatIndex === room.dealer);
                
                room.roomStats.set(sid, { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 });
            }
        }
        
        room.broadcastGameMessage("🔄 再來一場！積分已全數清零，新大賽洗牌開局！", 'system');
        
        io.to(room.roomId).emit('gameStart', { 
            players: room.getPublicPlayersState(), 
            currentTurn: room.currentTurn, 
            dealer: room.dealer, 
            windRound: room.windRound,
            dealerRound: room.dealerRound 
        });

        // 🌟 核心修正 3：同樣不呼叫 dealTiles()，讓牌在骰子擲完後才發！
        room.checkDiceAndStart(); 

    } catch (e) { console.error('再來一場處理錯誤:', e); }
  });
  // server.js 裡面的 tournamentFinish 監聽器
  socket.on('tournamentFinish', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== 'summary') return;

        // 核心修正：除了重置局數，戰場的所有物理殘留必須「徹底洗白」！
        room.windRound = 0;
        room.dealerRound = 0;
        room.dealer = 0;
        room.gameState = 'waiting'; 
        room.discardPile = [];       
        room.lastDiscard = null;     
        room.waitingForAction = [];
        if (room.actionTimeout) clearTimeout(room.actionTimeout);
        
       for (let [sid, p] of room.players) {
            if (p) {
                p.score = 0;
                p.hand = [];         
                p.flowers = [];      
                p.melds = [];        
                p.isReady = p.isAI ? true : false; 
                room.roomStats.set(sid, { winCount: 0, selfDrawCount: 0, chongCount: 0, totalInstantPayouts: 0 });
            }
        }

        // 🌟 核心修正：在切換場景前，必須向所有玩家廣播最新（已重置）的玩家名單！
        io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
        
        // 然後才下達切換場景指令
        io.to(room.roomId).emit('returnToRoomScene');
    } catch (e) { console.error('大賽完結處理錯誤:', e); }
  });
 socket.on('joinRoom', (data) => {
    try {
        const targetRoomId = data.roomId ? data.roomId.toString().trim().toUpperCase() : '';
        console.log(`🔍 玩家嘗試加入房間，輸入的號碼為: 【 ${targetRoomId} 】`); // 🌟 新增這行
        
        const joinResult = gameManager.joinRoom(socket.id, targetRoomId, { id: socket.id, name: data.playerName || '玩家', initialScore: 0 });
        if (joinResult.success) {
            socket.join(targetRoomId);
            const room = joinResult.room;
            socket.emit('roomJoined', { success: true, roomId: targetRoomId, gameState: room.getPublicGameState(), players: room.getPublicPlayersState(), privateState: room.getPrivatePlayerState(socket.id) });
            io.to(targetRoomId).emit('playersUpdate', room.getPublicPlayersState());
            io.to(targetRoomId).emit('gameMessage', { message: `${data.playerName} 加入了房間`, type: 'system' });
        } else { 
            // 🌟 加上 Log，讓你知道為什麼加入失敗
            console.log(`❌ 加入房間失敗: ${joinResult.reason}`);
            socket.emit('error', { message: joinResult.reason }); 
        }
    } catch (error) { console.error('加入房間錯誤:', error); socket.emit('error', { message: '伺服器錯誤' }); }
  });

  socket.on('playerReady', (data) => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return socket.emit('error', { message: '不在房間中' });
        
        const player = room.getPlayerBySocketId(socket.id);
        if (!player) return socket.emit('error', { message: '玩家不存在' });
        
        // 🌟 1. 強制鎖死：只要收到事件，就是準備 (不允許取消)
        player.isReady = true;
        
        socket.emit('readySuccess', { success: true });
        
        // 廣播玩家狀態更新
        io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
        io.to(room.roomId).emit('gameMessage', { message: `${player.name} 已準備`, type: 'system' });
        
        // 🌟 2. 只要「目前在房間裡的真人」全部都準備了，就觸發開局！
        if (room.allPlayersReady()) { 
            
            // 🌟 3. 自動補滿 AI
            // 假設你的 room 類別有加入 AI 的函數，例如 addAIPlayer() 或 addBot()
            // (請把這行的 addAIPlayer 替換成你實際寫好的 AI 加入函數)
            while (room.players.size < room.maxPlayers) {
                if (typeof room.addAIPlayer === 'function') {
                    room.addAIPlayer(); 
                } else {
                    console.log("警告：尚未實作 addAIPlayer 方法，無法自動補齊 AI！");
                    break; 
                }
            }

            // 確保加入 AI 後重新廣播一次最新名單，讓畫面出現 AI 的名字
            io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
            io.to(room.roomId).emit('gameMessage', { message: `座位已由 AI 補滿，即將開局！`, type: 'system' });

            // 🌟 4. 倒數 2 秒開局
            setTimeout(() => { 
                room.startGame(); 
            }, 2000); 
        }
    } catch (error) { 
        console.error('玩家準備錯誤:', error); 
        socket.emit('error', { message: '伺服器錯誤' }); 
    }
  });
  // 🌟 [作弊通道] 一鍵生成加槓測試環境
  socket.on('debugJiaKong', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== 'playing') return;
        const player = room.players.get(socket.id);

        // 1. 在桌面上無中生有塞一個「一萬的碰牌」
        player.melds.push({
            type: 'pong',
            tiles: [
                { id: 'test_1', type: 'number', suit: 'wan', value: '1' },
                { id: 'test_2', type: 'number', suit: 'wan', value: '1' },
                { id: 'test_3', type: 'number', suit: 'wan', value: '1' }
            ]
        });

        // 2. 在手牌裡無中生有塞入「第四張一萬」
        const fourthTile = { id: 'test_4', type: 'number', suit: 'wan', value: '1' };
        player.hand.push(fourthTile);

        // 3. 強制把回合搶過來變成你的回合
        room.currentTurn = player.seatIndex;

        // 4. 廣播畫面更新
        io.to(room.roomId).emit('meldCreated', { seat: player.seatIndex, meld: player.melds[player.melds.length - 1] });
        room.refreshAndSendYourTurn(socket.id, player, fourthTile);
        
        room.broadcastGameMessage("🛠️ [Debug] 已配置加槓測試環境！", "system");
    } catch (error) { console.error('加槓測試錯誤:', error); }
  });

 socket.on('playTile', (tileData) => {
    console.log('收到 playTile 事件');
    try {
        if (typeof tileData === 'string') tileData = JSON.parse(tileData);
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        if (room.gameState !== 'playing') return;
        
        const currentPlayer = room.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.socketId !== socket.id) { 
            console.log(`❌ 不是你的回合！當前回合: ${room.currentTurn}`); 
            return; 
        }
if (currentPlayer.isAFK) {
            currentPlayer.isAFK = false;
        }
        // ==========================================
        // 🌟 核心防禦 1：如果這回合已經出過牌了，絕對不允許再出第二次！
        // 徹底阻斷因為超時與手動點擊同時發生造成的「雙重出牌」
        // ==========================================
        if (currentPlayer.hasDiscarded) {
            console.log(`🛡️ 攔截連點：玩家 ${currentPlayer.name} 已經出過牌了！`);
            return;
        }

        const tileId = tileData.id;
        if (!tileId) return;
        console.log(`玩家 ${currentPlayer.name} 嘗試打出 tileId: ${tileId}`);
        const result = room.discardTile(socket.id, tileId);
        console.log(`打牌結果: success=${result.success}`);
        
        if (result.success) { 
            room.broadcastGameState(); 
            room.broadcastPlayerState(); 
            
            // 🌟 核心修正：出牌成功後，立刻把伺服器剛排序好的手牌同步給自己！
            // 這樣 Unity 就會馬上收到 PrivateStateUpdate，並瞬間把手牌收攏排好。
            socket.emit('privateStateUpdate', { 
                success: true, 
                gameState: room.getPublicGameState(), 
                players: room.getPublicPlayersState(), 
                privateState: room.getPrivatePlayerState(socket.id) 
            });
        }
    } catch (error) { console.error('playTile 錯誤:', error); }
  });
// 🌟 玩家點擊畫面，解除託管
  socket.on('cancelAFK', () => {
      const room = gameManager.getPlayerRoom(socket.id);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (player && player.isAFK) {
          player.isAFK = false;
          console.log(`🧑 玩家 ${player.name} 解除託管，重掌控制權`);
          room.broadcastGameMessage(`玩家 ${player.name} 回到遊戲`, 'system');
          room.broadcastPlayerState();
      }
  });
  socket.on('drawTile', (data) => {
    console.log('收到 drawTile 事件');
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        const drawnTile = room.drawTile(socket.id);
        console.log(`摸到: ${drawnTile?.value}${drawnTile?.suit}`);
        socket.emit('privateStateUpdate', { success: true, gameState: room.getPublicGameState(), players: room.getPublicPlayersState(), privateState: room.getPrivatePlayerState(socket.id) });
        io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
    } catch (error) { console.error('摸牌錯誤:', error); }
  });


// server.js - socket 事件處理
socket.on('anKong', (data) => {
    console.log('收到 anKong 事件', data);
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        
        // 🌟 修正：呼叫正確的 playerSelfKong，並且把前端傳來的 data 餵給它！
        const result = room.playerSelfKong(socket.id, data);
        
        console.log(`暗槓結果: success=${result.success}`);
        if (result.success) {
            io.to(socket.id).emit('yourTurn', { 
                drawnTile: result.drawnTile, 
                canWin: room.checkCanWin(socket.id), 
                canTing: false,
                isTing: room.getPlayerBySocketId(socket.id)?.isTing || false,
                countdownSec: room.settings.timeLimit || 15,
                privateState: room.getPrivatePlayerState(socket.id) 
            });
        }
    } catch (error) {
        console.error('暗槓錯誤:', error);
    }
});

socket.on('jiaKong', (data) => {
      console.log('收到 jiaKong 事件', data);
      try {
          const room = gameManager.getPlayerRoom(socket.id);
          if (!room) return;
          
          // 🌟 核心修正：加槓與暗槓現在已經統一由 playerSelfKong 處理！
          // 傳入完整的 data，系統會自動判斷是情況 A (暗槓) 還是情況 B (加槓)
          const result = room.playerSelfKong(socket.id, data);
          
          console.log(`加槓結果: success=${result.success}`);
          
          // 備註：playerSelfKong 執行成功後，內部已經會自動呼叫 refreshAndSendYourTurn
          // 並幫玩家抽一張補牌、更新畫面了，所以這裡不用再重複 emit 'yourTurn'。

      } catch (error) {
          console.error('加槓錯誤:', error);
      }
  });
 
  // server.js - socket 事件處理
socket.on('ting', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;

        // 🌟 核心修正：必須呼叫房間系統正式的 tingPlayer 方法！
        // 這樣系統才會幫玩家掛上 tingJiEligible (一發/叮即) 的有效標籤
        const result = room.tingPlayer(socket.id);
        
        if (result.success) {
            console.log(`玩家 ${room.getPlayerBySocketId(socket.id).name} 成功宣告聽牌！`);
        } else {
            console.log(`聽牌失敗: ${result.reason}`);
        }
    } catch (error) {
        console.error('聽牌錯誤:', error);
    }
  });

 

  // 在其他 socket.on 事件附近加入
socket.on('selfWin', (data) => {
    console.log('收到 selfWin 事件');
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        
        // 自摸 = playerWin 但 lastDiscard 為 null
        room.lastDiscard = null;
        room.lastDiscardPlayer = null;
        
        const result = room.playerWin(socket.id);
        console.log(`自摸結果: success=${result.success}`);
    } catch (error) {
        console.error('自摸錯誤:', error);
    }
});

  // server.js - pass 事件處理


  socket.on('refreshState', (data) => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return socket.emit('error', { message: '不在房間中' });
        socket.emit('privateStateUpdate', { success: true, gameState: room.getPublicGameState(), players: room.getPublicPlayersState(), privateState: room.getPrivatePlayerState(socket.id) });
        io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
        io.to(room.roomId).emit('turnChange', { seat: room.currentTurn });
        io.to(room.roomId).emit('gameStateUpdate', room.getPublicGameState());
    } catch (error) { console.error('重新整理狀態錯誤:', error); socket.emit('error', { message: '伺服器錯誤' }); }
  });

  socket.on('leaveRoom', (data) => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (room) {
            const player = room.getPlayerBySocketId(socket.id);
            socket.leave(room.roomId);
            gameManager.leaveRoom(socket.id);
            io.to(room.roomId).emit('gameMessage', { message: `${player?.name || '玩家'} 離開了房間`, type: 'system' });
            io.to(room.roomId).emit('playersUpdate', room.getPublicPlayersState());
        }
    } catch (error) { console.error('離開房間錯誤:', error); }
  });

  // 🌟 修正：處理玩家在結算面板點擊「確認/下一局準備」的事件
  socket.on('readyForNextGame', () => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;

        // 1. 將點擊按鈕的真人玩家狀態設為已準備
        const player = room.players.get(socket.id);
        if (player) player.isReady = true;

        // 2. 自動將房間內的所有 AI 玩家設為已準備
        for (let [sid, p] of room.players) {
            if (p.isAI) p.isReady = true;
        }

        // 3. 檢查還有誰沒準備
        let allReady = true;
        let waitingList = [];
        for (let [sid, p] of room.players) {
            if (!p.isReady) {
                allReady = false;
                waitingList.push(p.name);
            }
        }

        // 4. 執行推進邏輯
        if (allReady) {
            if (room.forceStartTimer) { clearTimeout(room.forceStartTimer); room.forceStartTimer = null; }
            room.startNextRound(); // 全員到齊，立刻推進！
        } else {
            // 🌟 防呆救援：如果有人沒按，啟動 15 秒強制發車倒數
            if (!room.forceStartTimer) {
                room.broadcastGameMessage(`等待 ${waitingList.join(', ')} 確認... (15秒後強制繼續)`, 'system');
                
                room.forceStartTimer = setTimeout(() => {
                    room.forceStartTimer = null;
                    if (room.gameState === 'finished' || room.gameState === 'summary') {
                        room.broadcastGameMessage("⏳ 等待超時，系統強制推進！", 'system');
                        room.startNextRound();
                    }
                }, 15000);
            }
        }
    } catch (error) { console.error('下一局準備處理錯誤:', error); }
  });
// 🌟 處理前端送出換牌請求
  socket.on('submitExchangeTiles', (data) => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (room) {
            const result = room.submitExchangeTiles(socket.id, data.tileIds);
            if (!result.success) socket.emit('error', { message: result.reason });
        }
    } catch (e) { console.error('換牌錯誤:', e); }
  });
  // 在 server.js 處理 Socket 事件的地方：

socket.on('playerQuit', () => {
    handlePlayerLeave(socket);
});

socket.on('disconnect', () => {
    handlePlayerLeave(socket);
});

// 🌟 核心處理函數：玩家離開時的 AI 接管邏輯
function handlePlayerLeave(socket) {
    // 🌟 核心修正 1：透過 gameManager 來找房間，因為 socket.roomId 根本不存在！
    const room = gameManager.getPlayerRoom(socket.id);
    if (!room) return;

    const roomId = room.roomId;

    // 🌟 核心修正 2：Map 物件必須用 .get，不能用 .find！
    const player = room.players.get(socket.id);
    if (player) {
        console.log(`🚪 玩家 ${player.name} 退出遊戲，轉交 AI 託管。`);
        
        // 1. 標記為離線與 AI 託管！
        player.isOnline = false;
        player.isAI = true; 
        
        // 🌟 斷線轉 AI 後，強制將他設為「已準備」，這樣就不會卡住還在結算畫面的其他玩家！
        player.isReady = true; 
        
        // 讓該 socket 真正離開 socket.io 的房間
        socket.leave(roomId);

        // 2. 檢查房間裡還有沒有「真人」？
        let humanCount = 0;
        for (let p of room.players.values()) {
            if (p.isOnline && !p.isAI) humanCount++;
        }
        
        if (humanCount === 0) {
            console.log(`🛑 房間 ${roomId} 無真人玩家，強制結束遊戲並釋放資源。`);
            gameManager.rooms.delete(roomId);
            return;
        }

        // 3. 廣播給其他還在的玩家：有人變成 AI 了
        room.broadcastGameState();

        // 4. 防呆：如果剛好「正在輪到」這個退出的玩家出牌，立刻觸發 AI 自動打牌！
        if (room.currentTurn === player.seatIndex && room.gameState === 'playing') {
            console.log(`🤖 輪到剛退出的 AI 玩家，立刻觸發 AI 出牌邏輯...`);
            room.aiDiscard(player); 
        }
        
        // 5. 斷線救援：如果這時候剛好在結算畫面，且其他真人都按確認了，AI 化後自動幫他補按發車！
        if (room.gameState === 'finished' || room.gameState === 'summary') {
            let allReady = true;
            for (let p of room.players.values()) {
                if (!p.isReady) { allReady = false; break; }
            }
            if (allReady && room.gameState === 'finished') {
                console.log(`♻️ [斷線救援] 剩餘玩家皆已準備，自動開啟新局...`);
                room.startNextRound();
            }
        }
        
        // 6. 操作救援：如果他在等待「吃碰槓」途中斷線，幫他直接送出 Pass，以免卡死大家
        if (room.waitingForAction && room.waitingForAction.includes(socket.id)) {
            handlePlayerAction({ id: socket.id }, 'pass');
        }
    }
}
// 🌟 取代原本零散的 win/pong/kong/chow/pass 監聽器
  // 把玩家的請求統一丟進 Priority Queue 收集
  socket.on('win', () => handlePlayerAction(socket, 'win'));
  socket.on('pong', () => handlePlayerAction(socket, 'pong'));
  socket.on('kong', () => handlePlayerAction(socket, 'kong'));
  socket.on('chow', (data) => handlePlayerAction(socket, 'chow', data));
  socket.on('pass', () => handlePlayerAction(socket, 'pass'));
socket.on('surrenderPull', (data) => {
    try {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room) return;
        const player = room.getPlayerBySocketId(socket.id);
        const creditorSeat = data.creditorSeat; // 債主座位
        
        let debtData = room.pullLedger[creditorSeat][player.seatIndex];
        // 只有在被「拉3」或「拉6」時允許投降
        if (debtData && debtData.amount > 0 && (debtData.count === 3 || debtData.count === 6)) {
            let payout = debtData.amount;
            
            // 執行扣款
            player.score -= payout;
            room.getPlayerBySeatIndex(creditorSeat).score += payout;
            
            // 帳務歸零（斷纜）
            debtData.amount = 0;
            debtData.count = 0;
            
            room.broadcastGameMessage(`🏳️ 投降！${player.name} 向 ${room.getPlayerBySeatIndex(creditorSeat).name} 投降，支付 ${payout} 分並斷纜！`, 'system');
            room.broadcastPlayerState();
            room.broadcastGameState();
        }
    } catch (e) { console.error('投降處理錯誤:', e); }
});
  function handlePlayerAction(socket, actionType, extraData = null) {
      try {
          const room = gameManager.getPlayerRoom(socket.id);
          if (!room || !room.pendingActionQueue) return;

          // 確認該玩家是不是真的在允許操作的名單裡
          if (!room.waitingForAction || !room.waitingForAction.includes(socket.id)) return;

          const player = room.players.get(socket.id);
          if (!player) return;

          // 1. 登記該玩家的回覆
          room.pendingActionQueue.responses.push({
              socketId: socket.id,
              seat: player.seatIndex,
              action: actionType,
              data: extraData,
              priority: ACTION_PRIORITY[actionType]
          });

          // 2. 從等待名單中剔除該玩家，避免重複發送
          room.waitingForAction = room.waitingForAction.filter(id => id !== socket.id);
          console.log(`收到玩家 ${player.name} 選擇 [${actionType}]，剩餘等待: [${room.waitingForAction.join(', ') || '無'}]`);

          // 3. 如果所有允許操作的玩家都回覆了，立刻執行結算！
          if (room.waitingForAction.length === 0) {
              room.resolvePendingActions();
          }
      } catch (error) {
          console.error(`處理操作 ${actionType} 錯誤:`, error);
      }
  }
});





// ============================================
// REST API
// ============================================

app.get('/health', (req, res) => { res.json({ status: 'ok', rooms: gameManager.rooms.size }); });

app.get('/api/room/:roomId', (req, res) => {
  const room = gameManager.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: '房間不存在' });
  res.json({ roomId: room.roomId, gameState: room.gameState, playerCount: room.players.size, maxPlayers: room.settings.maxPlayers });
});

// ============================================
// 啟動伺服器
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { // 改用 PORT 變數
    console.log(`伺服器啟動於埠口 ${PORT}`);
});
module.exports = { app, server, io, GameManager, GameRoom };