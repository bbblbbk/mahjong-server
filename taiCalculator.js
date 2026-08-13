// server/taiCalculator.js - 完整版

// ============================================
// 第一部分：規則配置（可自訂）
// ============================================

const DEBUG = false;


const DefaultRules = {
  // 基本設定
  basic: {
    baseTai: 5,           // 1底 = 5番
    minTai: 0,            // 最低起胡番數（不含底）
  },
  
  // 基本牌型
  basicPatterns: {
    flowerEach: { enabled: true, tai: 2, name: '花牌' },
    honorEach: { enabled: true, tai: 2, name: '字牌刻子' },
    noFlowerNoHonor: { enabled: true, tai: 10, name: '無字花' },
    oneSetFlower: { enabled: true, tai: 20, name: '一台花' },
    rob7: { enabled: true, tai: 40, name: '1搶7' },
    rob7Reverse: { enabled: true, tai: 40, name: '7搶1' },
    eightFlower: { enabled: true, tai: 100, name: '8仙過海' }
  },
  
  // 風牌/箭牌系列
  windDragonSeries: {
    smallThreeWinds: { enabled: true, tai: 25, name: '小三風' },
    bigThreeWinds: { enabled: true, tai: 50, name: '大三風' },
    smallThreeDragons: { enabled: true, tai: 40, name: '小三元' },
    bigThreeDragons: { enabled: true, tai: 80, name: '大三元' },
    smallFourWinds: { enabled: true, tai: 120, name: '小四喜' },
    bigFourWinds: { enabled: true, tai: 160, name: '大四喜' },
    allHonors: { enabled: true, tai: 240, name: '字一色' }
  },
  
  // 牌型台數
  handPatterns: {
    pairWait: { enabled: true, tai: 2, name: '對碰' },
    generalEye: { enabled: true, tai: 2, name: '將眼' },
    onlyWait: { enabled: true, tai: 2, name: '獨獨' },
    fakeOnlyWait: { enabled: true, tai: 1, name: '假獨' },
    menqing: { enabled: true, tai: 5, name: '門清' },
    menqingSelfDraw: { enabled: true, tai: 5, name: '門清自摸' },
    ting: { enabled: true, tai: 5, name: '叮牌' },
    tingBeforeDraw: { enabled: true, tai: 5, name: '叮即' },
    eatTing: { enabled: true, tai: 3, name: '食叮牌' },
    menqingTing: { enabled: true, tai: 15, name: '門清叮' },
    heavenTing: { enabled: true, tai: 60, name: '天叮' },
    earthTing: { enabled: true, tai: 50, name: '地叮' },
    fiveTilesTing: { enabled: true, tai: 20, name: '5子叮' },
    tenTilesTing: { enabled: true, tai: 10, name: '10子叮' },
    // 花色系列
    hunyise: { enabled: true, tai: 40, name: '混一色' },
    qingyise: { enabled: true, tai: 120, name: '清一色' },
    luyise: { enabled: true, tai: 200, name: '綠一色' },
    // 刻子系列
    pongpong: { enabled: true, tai: 40, name: '對對糊' },
    // 連刻系列
    yiseErLianKe: { enabled: true, tai: 5, name: '一色二連刻' },
    xiaoYiseSanLianKe: { enabled: true, tai: 15, name: '小一色三連刻' },
    daYiseSanLianKe: { enabled: true, tai: 30, name: '大一色三連刻' },
    // 147/258/369 碰系列
    xiaoYise147: { enabled: true, tai: 15, name: '小一色147/258/369碰' },
    daYise147: { enabled: true, tai: 30, name: '大一色147/258/369碰' },
    // 特殊胡牌規則
    heavenWin: { enabled: true, tai: 180, name: '天糊' },
    earthWin: { enabled: true, tai: 160, name: '地糊' },
    humanWin: { enabled: true, tai: 120, name: '人糊' },
    lastTileDraw: { enabled: true, tai: 20, name: '海底撈月' },
    lastTileDrawOneTong: { enabled: true, tai: 40, name: '海底撈月（一筒）' },
    lastTileDiscard: { enabled: true, tai: 10, name: '河底撈魚' },
    robKong: { enabled: true, tai: 5, name: '搶槓' },
    // 子內系列（天糊/地糊/人糊時不加計）
    twoTilesInside: { enabled: true, tai: 80, name: '二子內' },
    threeTilesInside: { enabled: true, tai: 70, name: '三子內' },
    fourTilesInside: { enabled: true, tai: 60, name: '四子內' },
    fiveTilesInside: { enabled: true, tai: 50, name: '五子內' },
    sixTilesInside: { enabled: true, tai: 40, name: '六子內' },
    sevenTilesInside: { enabled: true, tai: 30, name: '七子內' },
    eightTilesInside: { enabled: true, tai: 20, name: '八子內' },
    nineTilesInside: { enabled: true, tai: 10, name: '九子內' },
    tenTilesInside: { enabled: true, tai: 5, name: '十子內' },// 嚦咕系列
    likwu: { enabled: true, tai: 60, name: '嚦咕嚦咕' },
    eightPairsLikwu: { enabled: true, tai: 70, name: '八飛嚦咕' },
    threeWindsLikwu: { enabled: true, tai: 15, name: '三風（嚦咕）' },
    threeDragonsLikwu: { enabled: true, tai: 20, name: '三元（嚦咕）' },
    fourWindsLikwu: { enabled: true, tai: 40, name: '四喜（嚦咕）' },
    threeConsecutivePairs: { enabled: true, tai: 5, name: '三連對' },
    fourConsecutivePairs: { enabled: true, tai: 10, name: '四連對' },
    fiveConsecutivePairs: { enabled: true, tai: 20, name: '五連對' },
    sixConsecutivePairs: { enabled: true, tai: 40, name: '六連對' },
    sevenConsecutivePairs: { enabled: true, tai: 80, name: '七連對' },
    eightConsecutivePairs: { enabled: true, tai: 160, name: '八連對' },
    

    // 四歸系列
    mingSiGuiYi: { enabled: true, tai: 5, name: '明四歸一' },
    anSiGuiYi: { enabled: true, tai: 15, name: '暗四歸一' },
    mingSiGuiEr: { enabled: true, tai: 15, name: '明四歸二' },
    anSiGuiEr: { enabled: true, tai: 30, name: '暗四歸二' },
    mingSiGuiSi: { enabled: true, tai: 30, name: '明四歸四' },
    anSiGuiSi: { enabled: true, tai: 60, name: '暗四歸四' },
    shuangSiGui: { enabled: true, tai: 15, name: '雙四歸' },  // 明雙四歸
    anShuangSiGui: { enabled: true, tai: 30, name: '暗雙四歸' },
    // 刻子/暗刻系列
    kankanhu: { enabled: true, tai: 200, name: '坎坎糊' },
    wuGangZi: { enabled: true, tai: 240, name: '五槓子' },
    // 組合類
pinghu: { enabled: true, tai: 5, name: '平糊' },
queYiMen: { enabled: true, tai: 10, name: '缺一門' },
queWu: { enabled: true, tai: 15, name: '缺五' },
duanYao: { enabled: true, tai: 10, name: '斷么' },
banQiuRen: { enabled: true, tai: 20, name: '半求人' },
quanQiuRen: { enabled: true, tai: 40, name: '全求人' },
xiaoYuWu: { enabled: true, tai: 60, name: '小於五' },
daYuWu: { enabled: true, tai: 60, name: '大於五' },
queSanBao: { enabled: true, tai: 40, name: '缺三寶' },
xiaoWuMenQi: { enabled: true, tai: 10, name: '小五門齊' },
daWuMenQi: { enabled: true, tai: 15, name: '大五門齊' },
hunDaiYao: { enabled: true, tai: 40, name: '混帶么' },
quanDaiYao: { enabled: true, tai: 80, name: '全帶么' },
hunLaoTou: { enabled: true, tai: 100, name: '混老頭' },
qingLaoTou: { enabled: true, tai: 300, name: '清老頭' },
xiaoQiMenQi: { enabled: true, tai: 20, name: '小七門齊' },
daQiMenQi: { enabled: true, tai: 25, name: '大七門齊' },
banQiuRen: { enabled: true, tai: 20, name: '半求人' },
quanQiuRen: { enabled: true, tai: 40, name: '全求人' },
jiHu: { enabled: true, tai: 40, name: '雞糊' },
yaHu: { enabled: true, tai: 20, name: '鴨糊' },
wuZiHuaDaPing: { enabled: true, tai: 20, name: '無字花大平' },
kaLongHuoChe: { enabled: true, tai: 300, name: '卡窿火車' },
hunDaiYiZhong: { enabled: true, tai: 30, name: '混帶一種數字' },
hunDaiLiangZhong: { enabled: true, tai: 40, name: '混帶兩種數字' },
hunDaiSanZhong: { enabled: true, tai: 50, name: '混帶三種數字' },
manTingFang: { enabled: true, tai: 120, name: '滿亭芳' },
// 般高/同順系列
mingBanGao: { enabled: true, tai: 8, name: '明般高' },
anBanGao: { enabled: true, tai: 8, name: '暗般高' },
shuangBanGao: { enabled: true, tai: 20, name: '雙般高' },
anShuangBanGao: { enabled: true, tai: 40, name: '暗雙般高' },
mingYiSeSanTongShun: { enabled: true, tai: 30, name: '明一色三同順' },
anYiSeSanTongShun: { enabled: true, tai: 60, name: '暗一色三同順' },
mingYiSeSiTongShun: { enabled: true, tai: 80, name: '明一色四同順' },
anYiSeSiTongShun: { enabled: true, tai: 160, name: '暗一色四同順' },
quanBanGao: { enabled: true, tai: 40, name: '全般高' },
// 步步高系列
mingYiSeBuBuGao: { enabled: true, tai: 15, name: '明一色步步高' },
anYiSeBuBuGao: { enabled: true, tai: 30, name: '暗一色步步高' },
mingYiSeSanBuGao: { enabled: true, tai: 10, name: '明一色三步高' },
anYiSeSanBuGao: { enabled: true, tai: 20, name: '暗一色三步高' },
mingSanSeBuBuGao: { enabled: true, tai: 8, name: '明三色步步高' },
anSanSeBuBuGao: { enabled: true, tai: 15, name: '暗三色步步高' },
mingSanSeSanBuGao: { enabled: true, tai: 5, name: '明三色三步高' },
anSanSeSanBuGao: { enabled: true, tai: 10, name: '暗三色三步高' },
// 相逢系列
xiangFeng: { enabled: true, tai: 3, name: '相逢' },
shuangXiangFeng: { enabled: true, tai: 11, name: '雙相逢' },
mingSanXiangFeng: { enabled: true, tai: 10, name: '明三相逢' },
anSanXiangFeng: { enabled: true, tai: 20, name: '暗三相逢' },
mingSiXiangFeng: { enabled: true, tai: 40, name: '明四相逢' },
anSiXiangFeng: { enabled: true, tai: 80, name: '暗四相逢' },
mingWuXiangFeng: { enabled: true, tai: 100, name: '明五相逢' },
anWuXiangFeng: { enabled: true, tai: 200, name: '暗五相逢' },
quanXiangFeng: { enabled: true, tai: 20, name: '全相逢' },
shuangShu: { enabled: true, tai: 80, name: '雙數' },
sanShu: { enabled: true, tai: 40, name: '三數' },
liangSeXiongDiPeng: { enabled: true, tai: 5, name: '兩色兄弟碰' },
xiaoSanSeXiongDiPeng: { enabled: true, tai: 15, name: '小三色兄弟碰' },
daSanSeXiongDiPeng: { enabled: true, tai: 30, name: '大三色兄弟碰' },
xiaoSanSeSanLianKe: { enabled: true, tai: 10, name: '小三色三連刻' },
daSanSeSanLianKe: { enabled: true, tai: 20, name: '大三色三連刻' },
xiaoSanSe147: { enabled: true, tai: 20, name: '小三色147/258/369碰' },
daSanSe147: { enabled: true, tai: 20, name: '大三色147/258/369碰' },
// 十六不搭/十三么系列
shiLiuBuDa: { enabled: true, tai: 60, name: '十六不搭' },
shiLiuBuDaShiLiuFei: { enabled: true, tai: 70, name: '十六不搭（十六飛）' },
shiLiuBuDaShe: { enabled: true, tai: 20, name: '十六不搭（蛇）' },
shiLiuBuDaXiangFeng: { enabled: true, tai: 20, name: '十六不搭（相逢）' },
shiSanYao: { enabled: true, tai: 160, name: '十三么' },
hunDaiYaoShiSanYao: { enabled: true, tai: 200, name: '混帶么十三么' },
quanDaiYaoShiSanYao: { enabled: true, tai: 240, name: '全帶么十三么' },
hunLaoTouShiSanYao: { enabled: true, tai: 260, name: '混老頭十三么' },
qingLaoTouShiSanYao: { enabled: true, tai: 320, name: '清老頭十三么' },
// 無花 / 無字
wuHua: { enabled: true, tai: 2, name: '無花' },
wuZi: { enabled: true, tai: 2, name: '無字' },

// 暗槓 / 明槓（牌型台數）
anGang: { enabled: true, tai: 4, name: '暗槓' },
mingGang: { enabled: true, tai: 2, name: '明槓' },

// 花/槓摸
huaGangMo: { enabled: true, tai: 2, name: '花/槓摸' },

// 花/槓上花（連續）
huaGangShangHua2: { enabled: true, tai: 5, name: '花/槓上花（連續2次）' },
huaGangShangHua3: { enabled: true, tai: 10, name: '花/槓上花（連續3次）' },
huaGangShangHua4: { enabled: true, tai: 20, name: '花/槓上花（連續4次）' },

// 老少/雜龍系列
mingZaLong: { enabled: true, tai: 10, name: '明雜龍' },
anZaLong: { enabled: true, tai: 20, name: '暗雜龍' },
mingQingLong: { enabled: true, tai: 15, name: '明清龍' },
anQingLong: { enabled: true, tai: 30, name: '暗清龍' },
// 老少系列
laoShao: { enabled: true, tai: 5, name: '老少' },
shuangLaoShao: { enabled: true, tai: 15, name: '雙老少' },
  // 暗刻系列（新增）
  liangAnKe: { enabled: true, tai: 10, name: '兩暗刻' },
  sanAnKe: { enabled: true, tai: 20, name: '三暗刻' },
  siAnKe: { enabled: true, tai: 40, name: '四暗刻' },
  wuAnKe: { enabled: true, tai: 80, name: '五暗刻' },
  
  // 老少碰（新增）
  laoShaoPeng: { enabled: true, tai: 5, name: '老少碰' },
  tianTi: { enabled: true, tai: 40, name: '天梯' },
  }
};

const RewardPenaltyRules = {
  // 賞罰規則
  anKong: { enabled: true, reward: 1, name: '暗槓', type: 'reward' },  // 收1底
  yiTaiCao: { enabled: true, reward: 0.5, name: '一枱草', type: 'reward' },  // 收0.5底
  yiTaiHua: { enabled: true, reward: 1, name: '一枱花', type: 'reward' },  // 收1底
  weiShai: { enabled: true, reward: 1, name: '圍骰', type: 'reward' },  // 收1底
  oneTwoThreeShai: { enabled: true, penalty: 1, name: '123骰', type: 'penalty' },  // 罰1底
  sanZhuiFanZi: { enabled: true, penalty: 0.5, name: '三追番子', type: 'penalty' },  // 罰0.5底
  sanZhuiFeiFanZi: { enabled: true, penalty: 1, name: '三追非番子', type: 'penalty' },  // 罰1底
  fourZhuiFanZi: { enabled: true, penalty: 1, name: '4追番子', type: 'penalty' },  // 罰1底
  fourZhuiFeiFanZi: { enabled: true, penalty: 2, name: '4追非番子', type: 'penalty' },  // 罰2底
  chuChongDoubleTripleThenZiMo: { enabled: true, reward: 2, name: '出銃雙響/三響後自摸', type: 'reward' }  // 收2底
};

// ============================================
// 第二部分：輔助函數
// ============================================

function getTileNumber(tile) {
  if (!tile || tile.type !== 'number') return null;
  const match = tile.value.match(/(\d+)/);
  return match ? parseInt(match[0]) : null;
}

function countTiles(tiles) {
  const counts = {};
  if (!tiles) return counts;
  for (let tile of tiles) {
    const key = tile.value;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

// 花牌番數 (每隻2番)
function countFlowers(hand) {
    return hand.filter(t => t.type === 'flower').length;
}

// 門清：沒有吃、沒有碰（明槓和暗槓都不算副露，不破壞門清）
function isMengqing(melds) {
  // 確保 melds 存在且為陣列
  if (!melds || !Array.isArray(melds) || melds.length === 0) return true;
  
  for (let meld of melds) {
    if (meld && (meld.type === 'chow' || meld.type === 'pong')) {
      return false;
    }
  }
  return true;
}

function isSelfDraw(winType) {
  return winType === 'selfDraw';
}

/**
 * 🌟 智能等牌掃描器 (自動判定 獨獨 / 假獨 / 對碰)
 */
function checkOnlyWaitAndPairWait(hand, melds, winTile, winType, allMelds, eyeTile) {
    if (!winTile) return { isOnlyWait: false, isPairWait: false, isFakeOnlyWait: false };

    let readyHand = [...hand];
    if (readyHand.length % 3 === 2) {
        let removed = false;
        readyHand = readyHand.filter(t => {
            if (!removed && (t.id === winTile.id || (t.suit === winTile.suit && t.value === winTile.value))) {
                removed = true;
                return false;
            }
            return true;
        });
    }

    const winningTiles = [];
    for (let suit of ['wan', 'tong', 'tiao']) {
        for (let v = 1; v <= 9; v++) {
            const testHand = [...readyHand, { type: 'number', suit, value: v.toString() }];
            const res = analyzeHandMelds(testHand, melds);
            if (res && res.melds && res.melds.length === 5 && res.eyeTile) winningTiles.push(`${suit}_${v}`);
        }
    }
    for (let h of ['東','南','西','北','中','發','白']) {
        const testHand = [...readyHand, { type: 'honor', suit: 'honor', value: h }];
        const res = analyzeHandMelds(testHand, melds);
        if (res && res.melds && res.melds.length === 5 && res.eyeTile) winningTiles.push(`honor_${h}`);
    }

    const isOnlyWait = winningTiles.length === 1;

    let isPairWait = false;
    if (winningTiles.length === 2) {
        const t1 = winningTiles[0].split('_');
        const t2 = winningTiles[1].split('_');
        const c1 = readyHand.filter(t => t.suit === t1[0] && t.value === t1[1]).length;
        const c2 = readyHand.filter(t => t.suit === t2[0] && t.value === t2[1]).length;
        if (c1 === 2 && c2 === 2) isPairWait = true;
    }

    let isFakeOnlyWait = false;
    if (winningTiles.length > 1 && !isPairWait) {
        // 🌟 核心修正：假獨必須「無法形成兩面聽」。
        // 我們直接去拆解好的 allMelds 裡面找，看這張 winTile 是不是被用在兩面聽的順子裡！
        let isTwoSided = false;
        const winSuit = winTile.suit;
        const winVal = parseInt(winTile.value);

        if (!isNaN(winVal) && allMelds && allMelds.length > 0) {
            for (let m of allMelds) {
                if (m.type === 'chow' && m.tiles[0].suit === winSuit) {
                    const nums = m.tiles.map(t => parseInt(t.value)).sort((a,b)=>a-b);
                    if (nums.includes(winVal)) {
                        if (nums[0] === winVal && winVal < 7 && winningTiles.includes(`${winSuit}_${winVal + 3}`)) {
                            isTwoSided = true; // 作為前端 (例如聽 1,4 的 1)
                        } else if (nums[2] === winVal && winVal > 3 && winningTiles.includes(`${winSuit}_${winVal - 3}`)) {
                            isTwoSided = true; // 作為後端 (例如聽 1,4 的 4)
                        }
                    }
                }
            }
        }
        
        if (!isTwoSided) {
            isFakeOnlyWait = true;
        }
    }

    return { isOnlyWait, isPairWait, isFakeOnlyWait };
}
// ============================================
// 第三部分：台數檢查函數
// ============================================

function checkHunyise(hand, melds) {
  const safeMelds = Array.isArray(melds) ? melds : [];
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  let hasNumberTile = false;
  let hasHonor = false;
  let mainSuit = null;
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'honor') {
      hasHonor = true;
      continue;
    }
    if (tile.type === 'number') {
      hasNumberTile = true;
      const suit = tile.suit;
      if (mainSuit === null) {
        mainSuit = suit;
      } else if (mainSuit !== suit) {
        return false;
      }
    }
  }
  
  return hasNumberTile && hasHonor && mainSuit !== null;
}

function checkQingyise(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  let mainSuit = null;
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'honor') return false;
    if (tile.type === 'number') {
      const suit = tile.suit;
      if (mainSuit === null) {
        mainSuit = suit;
      } else if (mainSuit !== suit) {
        return false;
      }
    }
  }
  
  return mainSuit !== null;
}

function checkLuyise(hand, melds) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  // 允許的牌值（數字牌用數字，字牌用完整值）
  const allowedNumbers = ['2', '3', '4', '6', '8'];
  const allowedHonor = ['發'];
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') return false;
    if (tile.type === 'honor') {
      if (!allowedHonor.includes(tile.value)) {
        if (DEBUG) console.log(`綠一色失敗: 不允許的字牌 ${tile.value}`);
        return false;
      }
    } else if (tile.type === 'number') {
      // 只允許索子（條子）
      if (tile.suit !== 'tiao') {
        if (DEBUG) console.log(`綠一色失敗: 不允許的花色 ${tile.suit}`);
        return false;
      }
      if (!allowedNumbers.includes(tile.value)) {
        if (DEBUG) console.log(`綠一色失敗: 不允許的數字 ${tile.value}`);
        return false;
      }
    }
  }
  
  if (DEBUG) console.log('綠一色成立!');
  return true;
}

function checkPongpong(hand, melds, allMelds = []) {
  // 🌟 核心修正：不再盲目數手牌，直接檢查拆解出的最終面子，確保 5 組全都是刻子或槓子！
  if (allMelds && allMelds.length > 0) {
    let pongCount = 0;
    for (let m of allMelds) {
      if (['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
        pongCount++;
      }
    }
    return pongCount === 5; // 5 組刻/槓子 + 1 對眼
  }
  return false;
}

/**
 * 檢查一色二連刻（兩組同色刻子，數字連續，例如 333, 444）
 */
function checkYiseErLianKe(hand, melds, allMelds = []) {
    // 🌟 核心保險栓：直接使用我們升級過的 getAllTriplets 提取「真正的刻子」
    const triplets = getAllTriplets(hand, melds, allMelds);
    
    if (triplets.length < 2) return false;

    // 將找到的真正刻子按花色分組
    const bySuit = { wan: [], tong: [], tiao: [] };
    for (let t of triplets) {
        if (bySuit[t.suit]) { // 🌟 補上這行，忽略字牌
            bySuit[t.suit].push(t.num);
        }
    }

    // 檢查是否有同花色且連續的兩組刻子
    for (let suit of ['wan', 'tong', 'tiao']) {
        // 去除重複並從小到大排序
        const trips = [...new Set(bySuit[suit])].sort((a, b) => a - b);
        if (trips.length < 2) continue;

        for (let i = 0; i < trips.length - 1; i++) {
            // 只要有連續的兩個數字，就是一色二連刻！
            if (trips[i] + 1 === trips[i + 1]) {
                return true;
            }
        }
    }
    return false;
}



/**
 * 檢查大一色三連刻（三組同色刻子，數字相連，例如 333, 444, 555）
 */
function checkDaYiseSanLianKe(hand, melds, allMelds = []) {
    if (!allMelds || allMelds.length === 0) return false;

    // 1. 分花色精確收集真正的刻子/槓子數字
    const triplets = { wan: [], tong: [], tiao: [] };
    
    for (let m of allMelds) {
        if (!m || !m.tiles || m.tiles.length === 0) continue;
        const tile = m.tiles[0];
        const val = parseInt(tile.value);
        if (isNaN(val)) continue; // 排除字牌

        // 必須是刻子或槓子，絕對排除順子(chow)
        if (['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
            triplets[tile.suit].push(val);
        }
    }

    // 2. 嚴格數學連續性檢查
    for (let suit of ['wan', 'tong', 'tiao']) {
        // 去重複並由小到大排序
        const trips = [...new Set(triplets[suit])].sort((a, b) => a - b);
        if (trips.length < 3) continue;

        // 檢查是否有三個數字呈現 n, n+1, n+2 完美遞增
        for (let i = 0; i <= trips.length - 3; i++) {
            if (trips[i] + 1 === trips[i + 1] && trips[i + 1] + 1 === trips[i + 2]) {
                return true;
            }
        }
    }
    return false;
}checkDaSanSeSanLianKe 


/**
 * 檢查小一色三連刻（兩組同色連續刻子 + 同色相鄰數字的對子）
 */
function checkXiaoYiseSanLianKe(hand, melds, allMelds = [], eyeTile = null) {
    if (!allMelds || allMelds.length === 0 || !eyeTile) return false;

    // 1. 精準提取真正的刻子
    const triplets = { wan: [], tong: [], tiao: [] };
    for (let m of allMelds) {
        if (!m || !m.tiles || m.tiles.length === 0) continue;
        const val = parseInt(m.tiles[0].value);
        if (!isNaN(val) && ['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
            triplets[m.tiles[0].suit].push(val);
        }
    }

    // 2. 驗證眼牌
    const eyeVal = parseInt(eyeTile.value);
    if (isNaN(eyeVal)) return false; // 眼牌必須是數字

    const suit = eyeTile.suit;
    const trips = [...new Set(triplets[suit])].sort((a, b) => a - b);
    if (trips.length < 2) return false;

    const p = eyeVal;
    // 眼牌在右 (例如 333, 444, 55)
    if (trips.includes(p - 1) && trips.includes(p - 2)) return true;
    // 眼牌在中 (例如 333, 44, 555)
    if (trips.includes(p - 1) && trips.includes(p + 1)) return true;
    // 眼牌在左 (例如 33, 444, 555)
    if (trips.includes(p + 1) && trips.includes(p + 2)) return true;

    return false;
}


/**
 * 檢查小一色147/258/369碰（兩組刻子 + 一對眼牌，數字符合數列）
 */
function checkXiaoYise147(hand, melds, allMelds = []) {
    const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
    
    // 🌟 核心修正：只從真正的面子群中提取刻子與眼牌
    const triplets = [];
    const eyes = [];
    
    if (allMelds && allMelds.length > 0) {
        for (let m of allMelds) {
            if (!m || !m.tiles || m.tiles.length === 0) continue;
            const tile = m.tiles[0];
            const num = parseInt(tile.value);
            if (isNaN(num)) continue; // 排除字牌
            
            if (['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
                triplets.push({ suit: tile.suit, num: num });
            } else if (m.type === 'pair') {
                eyes.push({ suit: tile.suit, num: num });
            }
        }
    }
    
    if (triplets.length < 2 || eyes.length < 1) return false;

    // 檢查是否有符合的組合
    for (let pattern of patterns) {
        for (let suit of ['wan', 'tong', 'tiao']) {
            const suitTrips = triplets.filter(t => t.suit === suit).map(t => t.num);
            const suitEyes = eyes.filter(e => e.suit === suit).map(e => e.num);
            
            // 找出在此花色中，符合 pattern 的刻子數字
            const matchedTrips = suitTrips.filter(num => pattern.includes(num));
            // 找出在此花色中，符合 pattern 的眼牌數字
            const matchedEyes = suitEyes.filter(num => pattern.includes(num));
            
            // 🌟 嚴格條件：必須要有至少 2 個符合的刻子，且眼牌必須剛好是數列中剩下的那個數字！
            if (matchedTrips.length >= 2 && matchedEyes.length >= 1) {
                // 確保眼牌數字不跟刻子數字重複
                const uniqueTrips = [...new Set(matchedTrips)];
                const eyeNum = matchedEyes[0];
                if (uniqueTrips.length >= 2 && !uniqueTrips.includes(eyeNum)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 檢查大一色147/258/369碰（三組同色刻子，數字符合數列）
 */
function checkDaYise147(hand, melds, allMelds = []) {
    const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
    const triplets = [];
    
    if (allMelds && allMelds.length > 0) {
        for (let m of allMelds) {
            if (!m || !m.tiles || m.tiles.length === 0) continue;
            const tile = m.tiles[0];
            const num = parseInt(tile.value);
            if (isNaN(num)) continue; 
            if (['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
                triplets.push({ suit: tile.suit, num: num });
            }
        }
    }

    if (triplets.length < 3) return false;

    for (let pattern of patterns) {
        for (let suit of ['wan', 'tong', 'tiao']) {
            const suitTrips = triplets.filter(t => t.suit === suit).map(t => t.num);
            const uniqueMatchedTrips = new Set(suitTrips.filter(num => pattern.includes(num)));
            
            // 🌟 嚴格條件：同花色必須湊齊 pattern 中的 3 個數字
            if (uniqueMatchedTrips.size >= 3) {
                return true;
            }
        }
    }
    return false;
}


function checkSmallThreeWinds(hand, melds, extraInfo) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const windTiles = ['東', '南', '西', '北'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type === 'honor' && windTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  
  if (DEBUG) console.log('小三風檢查:', counts);
  
  let pongCount = 0;
  let pairWind = null;
  
  for (let wind of windTiles) {
    const count = counts[wind] || 0;
    if (count >= 3) {
      pongCount++;
    } else if (count === 2) {
      pairWind = wind;
    }
  }
  
  return pongCount === 2 && pairWind !== null;
}

function checkBigThreeWinds(hand, melds, extraInfo) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const windTiles = ['東', '南', '北', '西'];
  const counts = countTiles(allTiles);
  
  let pongCount = 0;
  for (let wind of windTiles) {
    if (counts[wind] >= 3) pongCount++;
  }
  
  return pongCount === 3;
}

/**
 * 檢查小三元（兩組箭牌刻子 + 一對箭牌眼牌）
 * 與大三元互斥
 */
function checkSmallThreeDragons(hand, melds, extraInfo) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const dragonTiles = ['中', '發', '白'];
  const counts = countTiles(allTiles);
  
  let pongCount = 0;
  let pairDragon = null;
  
  for (let dragon of dragonTiles) {
    const count = counts[dragon] || 0;
    if (count >= 3) {
      pongCount++;
    } else if (count === 2) {
      pairDragon = dragon;
    }
  }
  
  return pongCount === 2 && pairDragon !== null;
}

function checkBigThreeDragons(hand, melds, extraInfo) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const dragonTiles = ['中', '發', '白'];
  const counts = countTiles(allTiles);
  
  let pongCount = 0;
  for (let dragon of dragonTiles) {
    if (counts[dragon] >= 3) pongCount++;
  }
  
  return pongCount === 3;
}

function checkAllHonors(hand, melds, extraInfo) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type !== 'honor' && tile.type !== 'flower') {
      return false;
    }
  }
  
  return true;
}

/**
 * 找出胡牌牌型中的眼牌
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {string|null} 眼牌的值，如果找不到返回 null
 */
function findEyeTile(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
    const normalTiles = allTiles.filter(t => t.type !== 'flower');
    
    // 統計每種牌的出現次數
    const counts = {};
    for (let tile of normalTiles) {
        counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
    
    // 找出所有出現次數 >= 2 的牌作為候選眼牌
    const candidates = [];
    for (let [value, cnt] of Object.entries(counts)) {
        if (cnt >= 2) {
            candidates.push(value);
        }
    }
    
    // 如果只有一個候選，直接返回
    if (candidates.length === 1) {
        return candidates[0];
    }
    
    // 如果有多個候選，需要通過胡牌分析來確定哪個是真正的眼牌
    for (let candidate of candidates) {
        // 複製一份計數
        const testCounts = { ...counts };
        // 假設 candidate 是眼牌，移除 2 張
        testCounts[candidate] -= 2;
        if (testCounts[candidate] === 0) delete testCounts[candidate];
        
        // 檢查剩餘的牌是否能組成順子或刻子
        if (canFormAllMelds(testCounts)) {
            return candidate;
        }
    }
    
    return null;
}

/**
 * 檢查計數物件中的牌是否能全部組成順子或刻子
 * @param {Object} counts 牌值 -> 剩餘數量
 * @returns {boolean}
 */
function canFormAllMelds(counts) {
    // 將計數轉換為按花色分組的數字陣列
    const bySuit = { wan: [], tong: [], tiao: [], honor: [] };
    
    for (let [value, count] of Object.entries(counts)) {
        // 判斷花色和數字
        let suit, num;
        if (value.includes('萬')) {
            suit = 'wan';
            num = parseInt(value);
        } else if (value.includes('筒')) {
            suit = 'tong';
            num = parseInt(value);
        } else if (value.includes('索')) {
            suit = 'tiao';
            num = parseInt(value);
        } else {
            // 字牌
            suit = 'honor';
            num = value;
        }
        
        for (let i = 0; i < count; i++) {
            if (suit === 'honor') {
                bySuit.honor.push(num);
            } else {
                bySuit[suit].push(num);
            }
        }
    }
    
    // 檢查每種花色
    for (let suit of ['wan', 'tong', 'tiao']) {
        const numbers = bySuit[suit];
        if (numbers.length === 0) continue;
        numbers.sort((a, b) => a - b);
        
        if (!canFormChowsAndPongs(numbers)) {
            return false;
        }
    }
    
    // 檢查字牌（只能組成刻子）
    const honorCounts = {};
    for (let h of bySuit.honor) {
        honorCounts[h] = (honorCounts[h] || 0) + 1;
    }
    for (let count of Object.values(honorCounts)) {
        if (count !== 3) return false;
    }
    
    return true;
}



/**
 * 檢查一組數字是否能全部組成順子或刻子
 * @param {Array} numbers 數字陣列
 * @returns {boolean}
 */
function canFormChowsAndPongs(numbers) {
    if (numbers.length === 0) return true;
    if (numbers.length % 3 !== 0) return false;
    
    const counts = {};
    for (let num of numbers) {
        counts[num] = (counts[num] || 0) + 1;
    }
    
    // 使用遞迴嘗試所有可能
    function tryForm(remaining) {
        // 找第一個有牌的數字
        let first = null;
        for (let num = 1; num <= 9; num++) {
            if (remaining[num] > 0) {
                first = num;
                break;
            }
        }
        if (first === null) return true;
        
        const count = remaining[first];
        
        // 嘗試組成刻子
        if (count >= 3) {
            const newRemaining = { ...remaining };
            newRemaining[first] -= 3;
            if (newRemaining[first] === 0) delete newRemaining[first];
            if (tryForm(newRemaining)) return true;
        }
        
        // 嘗試組成順子
        if (first <= 7 && remaining[first + 1] && remaining[first + 2]) {
            const newRemaining = { ...remaining };
            newRemaining[first]--;
            newRemaining[first + 1]--;
            newRemaining[first + 2]--;
            if (newRemaining[first] === 0) delete newRemaining[first];
            if (newRemaining[first + 1] === 0) delete newRemaining[first + 1];
            if (newRemaining[first + 2] === 0) delete newRemaining[first + 2];
            if (tryForm(newRemaining)) return true;
        }
        
        return false;
    }
    
    return tryForm(counts);
}

/**
 * 檢查將眼（眼牌是 2、5、8 的筒索萬子，2番）
 */
function checkGeneralEye(hand, melds, extraInfo = {}) {
    let eyeValue = null;
    let eyeSuit = null;
    
    if (extraInfo.eyeTile) {
        eyeValue = typeof extraInfo.eyeTile === 'object' ? extraInfo.eyeTile.value : extraInfo.eyeTile;
        eyeSuit = typeof extraInfo.eyeTile === 'object' ? extraInfo.eyeTile.suit : null;
    } else {
        const allTiles = [...hand];
        for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
        const counts = {};
        for (let t of allTiles) {
            if (t.type !== 'flower') {
                const key = `${t.suit}_${t.value}`;  // ← 加入花色
                counts[key] = (counts[key] || 0) + 1;
            }
        }
        for (let [key, cnt] of Object.entries(counts)) {
            if (cnt === 2) {
                const [suit, value] = key.split('_');
                eyeValue = value;
                eyeSuit = suit;
                break;
            }
        }
    }
    
    if (!eyeValue) return false;
    
    const match = eyeValue.match(/(\d+)/);
    if (!match) return false;
    
    const num = parseInt(match[0]);
    return num === 2 || num === 5 || num === 8;
}

function checkPairWait(hand, melds, waitInfo) {
  if (!waitInfo) return false;
  return waitInfo.type === 'pairWait';
}

function checkOnlyWait(hand, melds, waitInfo) {
  if (!waitInfo) return false;
  return waitInfo.onlyWait === true;
}

// ============================================
// 嚦咕系列檢查函數 (🌟 終極嚴格版)
// ============================================

/**
 * 🌟 嚦咕基礎防呆：真正的 17 張嚦咕胡牌，必定呈現「1組刻子 + 7對眼牌」的完美結構！
 */
function checkLikwuBase(hand, melds) {
  if (melds.length > 0) return false;
  const normalTiles = hand.filter(t => t.type !== 'flower');
  if (normalTiles.length !== 17) return false;

  const counts = {};
  for (let tile of normalTiles) {
    const key = `${tile.suit}_${tile.value}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  let hasTriplet = false;
  let pairCount = 0;

  for (let count of Object.values(counts)) {
    if (count === 3) {
      if (hasTriplet) return false; // 不能有兩組刻子
      hasTriplet = true;
    } else if (count === 2) {
      pairCount++;
    } else {
      return false; // 出現單張或4張直接出局！廢牌絕對不能胡！
    }
  }
  return hasTriplet && pairCount === 7;
}

/**
 * 普通嚦咕嚦咕 (單釣)：胡的那張牌，剛好湊成對子
 */
function checkLikwu(hand, melds, winTile = null) {
  if (!checkLikwuBase(hand, melds)) return false;
  
  if (winTile) {
    const normalTiles = hand.filter(t => t.type !== 'flower');
    const counts = {};
    for (let tile of normalTiles) {
      const key = `${tile.suit}_${tile.value}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    const winKey = `${winTile.suit}_${winTile.value}`;
    // 如果胡的牌剛好是 3 張那組，代表這是八飛，不是單釣！
    if (counts[winKey] === 3) return false; 
  }
  return true;
}

/**
 * 八飛嚦咕 (八面聽)：胡的那張牌，剛好湊成刻子 (原本手牌已有 8 對)
 */
function checkEightPairsLikwu(hand, melds, winTile = null) {
  if (!checkLikwuBase(hand, melds)) return false;

  if (winTile) {
    const normalTiles = hand.filter(t => t.type !== 'flower');
    const counts = {};
    for (let tile of normalTiles) {
      const key = `${tile.suit}_${tile.value}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    const winKey = `${winTile.suit}_${winTile.value}`;
    // 如果胡的牌剛好是 3 張那組，證明原本確實有 8 對，是八面聽！
    if (counts[winKey] === 3) return true;
    return false;
  }
  return true;
}

function checkThreeWindsLikwu(hand, melds) {
  if (!checkLikwuBase(hand, melds)) return false; // 🌟 統一依賴 Base
  const allTiles = [...hand];
  for (let meld of melds) { if (meld && meld.tiles) allTiles.push(...meld.tiles); }
  const windTiles = ['東', '南', '西', '北'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type !== 'flower' && windTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  let pairCount = 0, tripletCount = 0;
  for (let count of Object.values(counts)) {
    if (count === 2) pairCount++;
    if (count === 3) tripletCount++;
  }
  return (pairCount === 3 && tripletCount === 0) || (pairCount === 2 && tripletCount === 1);
}

function checkThreeDragonsLikwu(hand, melds) {
  if (!checkLikwuBase(hand, melds)) return false;
  const allTiles = [...hand];
  for (let meld of melds) { if (meld && meld.tiles) allTiles.push(...meld.tiles); }
  const dragonTiles = ['中', '發', '白'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type !== 'flower' && dragonTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  let pairCount = 0, tripletCount = 0;
  for (let count of Object.values(counts)) {
    if (count === 2) pairCount++;
    if (count === 3) tripletCount++;
  }
  return (pairCount === 3 && tripletCount === 0) || (pairCount === 2 && tripletCount === 1);
}

function checkFourWindsLikwu(hand, melds) {
  if (!checkLikwuBase(hand, melds)) return false;
  const allTiles = [...hand];
  for (let meld of melds) { if (meld && meld.tiles) allTiles.push(...meld.tiles); }
  const windTiles = ['東', '南', '西', '北'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type !== 'flower' && windTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  let pairCount = 0, tripletCount = 0;
  for (let count of Object.values(counts)) {
    if (count === 2) pairCount++;
    if (count === 3) tripletCount++;
  }
  return (pairCount === 4 && tripletCount === 0) || (pairCount === 3 && tripletCount === 1);
}

function checkConsecutivePairs(hand, melds, targetCount) {
  if (!checkLikwuBase(hand, melds)) return false;
  const allTiles = [...hand];
  for (let meld of melds) { if (meld && meld.tiles) allTiles.push(...meld.tiles); }
  const numberTiles = allTiles.filter(t => t.type === 'number');
  if (numberTiles.length === 0) return false;
  const bySuit = { wan: [], tong: [], tiao: [] };
  for (let tile of numberTiles) {
    const num = getTileNumber(tile);
    if (num) bySuit[tile.suit].push(num);
  }
  for (let suit of ['wan', 'tong', 'tiao']) {
    const numbers = bySuit[suit];
    if (numbers.length < targetCount * 2) continue;
    const counts = {};
    for (let num of numbers) counts[num] = (counts[num] || 0) + 1;
    let maxConsecutive = 0, currentConsecutive = 0;
    for (let num = 1; num <= 9; num++) {
      if ((counts[num] || 0) >= 2) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    if (maxConsecutive >= targetCount) return true;
  }
  return false;
}

// 各連對的包裝函數
function checkThreeConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 3); }
function checkFourConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 4); }
function checkFiveConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 5); }
function checkSixConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 6); }
function checkSevenConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 7); }
function checkEightConsecutivePairs(hand, melds) { return checkConsecutivePairs(hand, melds, 8); }
// ============================================
// 四歸系列檢查函數（恢復版）
// ============================================
function isFourTileSetMing(suit, value, melds, winType, winTile) {
    if (winType === 'discard' && winTile && winTile.suit === suit && parseInt(winTile.value) === parseInt(value)) return true;
    for (let meld of melds) {
        if (meld.type === 'chow' || meld.type === 'pong' || meld.type === 'mingKong') {
            if (meld.tiles.some(t => t.suit === suit && t.value === value.toString())) return true;
        }
    }
    return false;
}
function getAllTileCounts(hand, melds) {
  const counts = {};
  for (let tile of hand) {
    if (tile.type !== 'flower') counts[`${tile.suit}_${tile.value}`] = (counts[`${tile.suit}_${tile.value}`] || 0) + 1;
  }
  for (let meld of melds) {
    if (meld && meld.tiles) {
      for (let tile of meld.tiles) {
        if (tile.value) counts[`${tile.suit}_${tile.value}`] = (counts[`${tile.suit}_${tile.value}`] || 0) + 1;
      }
    }
  }
  return counts;
}

function getChowCountWithTile(hand, melds, tileValue, tileSuit) {
    const num = parseInt(tileValue);
    if (isNaN(num)) return 0;
    const allTiles = [...hand];
    for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
    const suitTiles = allTiles.filter(t => t.type === 'number' && t.suit === tileSuit);
    const counts = {};
    for (let tile of suitTiles) {
        const n = parseInt(tile.value);
        if (!isNaN(n)) counts[n] = (counts[n] || 0) + 1;
    }
    const positions = [];
    if (num <= 7) positions.push(Math.min(counts[num] || 0, counts[num + 1] || 0, counts[num + 2] || 0));
    if (num >= 2 && num <= 8) positions.push(Math.min(counts[num - 1] || 0, counts[num] || 0, counts[num + 1] || 0));
    if (num >= 3) positions.push(Math.min(counts[num - 2] || 0, counts[num - 1] || 0, counts[num] || 0));
    return positions.length > 0 ? Math.max(...positions) : 0;
}

/**
 * 檢查是否為副露（吃或碰，明槓）
 */
function isOpenMeld(melds, tileKey) {
    const safeMelds = Array.isArray(melds) ? melds : [];
    
    for (let meld of safeMelds) {
        if (!meld || !meld.tiles) continue;
        
        if (meld.type === 'chow' || meld.type === 'pong' || meld.type === 'mingKong') {
            for (let tile of meld.tiles) {
                const key = `${tile.suit}_${tile.value}`;
                if (key === tileKey) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function checkMingSiGuiYi(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 1 || chowCount >= 2) continue;
      if (isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkAnSiGuiYi(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 1 || chowCount >= 2) continue;
      if (!isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkMingSiGuiEr(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 2 || chowCount >= 4) continue;
      if (isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkAnSiGuiEr(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 2 || chowCount >= 4) continue;
      if (!isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkMingSiGuiSi(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 4) continue;
      if (isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkAnSiGuiSi(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount < 4) continue;
      if (!isFourTileSetMing(suit, value, melds, winType, winTile)) return true;
    }
  }
  return false;
}

function checkShuangSiGui(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  let validCount = 0;
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount === 0) continue;
      if (isFourTileSetMing(suit, value, melds, winType, winTile)) validCount++;
    }
  }
  return validCount >= 2;
}

function checkAnShuangSiGui(hand, melds, winType, winTile) {
  const counts = getAllTileCounts(hand, melds);
  let validCount = 0;
  for (let [key, count] of Object.entries(counts)) {
    if (count === 4) {
      const [suit, value] = key.split('_');
      if (suit === 'honor') continue;
      const chowCount = getChowCountWithTile(hand, melds, value, suit);
      if (chowCount === 0) continue;
      if (!isFourTileSetMing(suit, value, melds, winType, winTile)) validCount++;
    }
  }
  return validCount >= 2;
}

// ============================================
// 刻子/暗刻系列檢查函數
// ============================================

/**
 * 計算手牌和副露中的刻子數量（包括暗槓）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {Object} { totalPongs, openPongs, closedPongs }
 */
function countPongs(hand, melds, winType = null, winTile = null) {
    let openPongs = 0;
    let closedPongs = 0;
    const safeMelds = Array.isArray(melds) ? melds : [];
    
    for (let meld of safeMelds) {
        if (meld && (meld.type === 'pong' || meld.type === 'mingKong')) openPongs++;
        if (meld && meld.type === 'anKong') closedPongs++;
    }
    
    const handCounts = {};
    for (let tile of hand) {
        if (tile.type !== 'flower') {
            handCounts[tile.value] = (handCounts[tile.value] || 0) + 1;
        }
    }
    
    for (let [value, count] of Object.entries(handCounts)) {
        if (count === 3) {
            // 🌟 判斷出銃
            if (winType === 'discard' && winTile && winTile.value === value) {
                openPongs++;
            } else {
                closedPongs++;
            }
        }
        if (count === 4) {
            closedPongs++;
        }
    }
    return { totalPongs: openPongs + closedPongs, openPongs, closedPongs };
}

/**
 * 計算槓子數量（明槓 + 暗槓）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {number}
 */
function countGangs(hand, melds) {
  let gangCount = 0;
  const safeMelds = Array.isArray(melds) ? melds : [];
  
  for (let meld of safeMelds) {
    if (meld && (meld.type === 'mingKong' || meld.type === 'anKong')) {
      gangCount++;
    }
  }
  
  // 統計手牌中的暗槓（4張相同牌）
  const handCounts = {};
  for (let tile of hand) {
    if (tile.type !== 'flower') {
      handCounts[tile.value] = (handCounts[tile.value] || 0) + 1;
    }
  }
  
  for (let count of Object.values(handCounts)) {
    if (count === 4) {
      gangCount++;  // 手牌中的暗槓
    }
  }
  
  return gangCount;
}

/**
 * 檢查坎坎糊（五組刻子 + 一對眼牌，無副露）
 * 與對對糊不同：完全沒有副露，所有刻子都是暗刻
 */
function checkKankanhu(hand, melds, winType, winTile) {
    if (melds.length > 0) return false;
    const { totalPongs, closedPongs } = countPongs(hand, melds, winType, winTile);
    return totalPongs === 5 && closedPongs === 5;
}

/**
 * 檢查五槓子（暗槓/明槓五組）
 */
function checkWuGangZi(hand, melds) {
  const gangCount = countGangs(hand, melds);
  return gangCount === 5;
}

// ============================================
// 組合類檢查函數
// ============================================

// 在 taiCalculator.js 中，確保順序如下：

/**
 * 檢查平糊（除眼牌外皆為順子）
 */

function checkPinghu(hand, melds) {
    // 分析手牌，獲取面子和眼牌
    const { melds: analyzedMelds, eyeTile } = analyzeHandMelds(hand, melds);
    
    // 檢查是否所有面子都是順子
    for (let meld of analyzedMelds) {
        if (meld.type !== 'chow') {
            return false;  // 有刻子，不是平糊
        }
    }
    
    // 檢查眼牌是否存在
    if (!eyeTile) return false;
    
    return true;
}

/**
 * 檢查一組數字是否能全部組成順子（使用簡單的計數方法）
 */
function canFormChowsSimple(numbers) {
    if (numbers.length === 0) return true;
    if (numbers.length % 3 !== 0) return false;
    
    const counts = {};
    for (let num of numbers) {
        counts[num] = (counts[num] || 0) + 1;
    }
    
    // 遞迴嘗試所有可能
    function tryForm(remaining) {
        // 找第一個有牌的數字
        let first = null;
        for (let num = 1; num <= 9; num++) {
            if (remaining[num] > 0) {
                first = num;
                break;
            }
        }
        if (first === null) return true;
        
        // 嘗試組成刻子
        if (remaining[first] >= 3) {
            const newRemaining = { ...remaining };
            newRemaining[first] -= 3;
            if (newRemaining[first] === 0) delete newRemaining[first];
            if (tryForm(newRemaining)) return true;
        }
        
        // 嘗試組成順子
        if (first <= 7 && remaining[first+1] > 0 && remaining[first+2] > 0) {
            const newRemaining = { ...remaining };
            newRemaining[first]--;
            newRemaining[first+1]--;
            newRemaining[first+2]--;
            if (newRemaining[first] === 0) delete newRemaining[first];
            if (newRemaining[first+1] === 0) delete newRemaining[first+1];
            if (newRemaining[first+2] === 0) delete newRemaining[first+2];
            if (tryForm(newRemaining)) return true;
        }
        
        return false;
    }
    
    return tryForm(counts);
}


/**
 * 檢查半求人（五組順子/刻子副露，最後獨獨自摸）
 * 條件：4組副露 + 1組手牌刻子/順子？需要確認規則
 * 簡化版：所有面子都副露，且自摸
 */
function checkBanQiuRen(hand, melds, winType, waitInfo) {
  // 必須自摸
  if (winType !== 'selfDraw') return false;
  
  // 必須有副露
  if (melds.length === 0) return false;
  
  // 檢查是否所有面子都副露（5組面子，4組副露 + 1組手牌？）
  // 簡化版：至少有4組副露
  if (melds.length < 4) return false;
  
  // 檢查是否獨獨（只有一種牌可胡）
  if (!waitInfo || !waitInfo.onlyWait) return false;
  
  return true;
}

/**
 * 檢查全求人（五組順子/刻子副露，最後胡別人打出的牌）
 * 條件：所有面子都副露，且胡別人打的牌
 */
function checkQuanQiuRen(hand, melds, winType) {
  // 必須胡別人打的牌（非自摸）
  if (winType === 'selfDraw') return false;
  
  // 必須有副露
  if (melds.length === 0) return false;
  
  // 檢查是否所有面子都副露（5組面子全部副露）
  // 簡化版：至少有4組副露（最後一組是胡牌）
  if (melds.length < 4) return false;
  
  // 手牌應該只有一對眼牌（其他都已副露）
  const normalHand = hand.filter(t => t.type !== 'flower');
  if (normalHand.length !== 2) return false;
  
  return true;
}

/**
 * 檢查小於五（只由數字小於五的筒索萬組成）
 */
function checkXiaoYuWu(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num >= 5) {
        return false;  // 出現大於等於5
      }
    }
    if (tile.type === 'honor') {
      return false;  // 有字牌
    }
  }
  return true;
}

/**
 * 檢查大於五（只由數字大於五的筒索萬組成）
 */
function checkDaYuWu(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num <= 5) {
        return false;  // 出現小於等於5
      }
    }
    if (tile.type === 'honor') {
      return false;  // 有字牌
    }
  }
  return true;
}

/**
 * 檢查缺三寶（同時滿足缺一門、缺五、斷么）
 */
function checkQueSanBao(hand, melds) {
  return checkQueYiMen(hand, melds) && 
         checkQueWu(hand, melds) && 
         checkDuanYao(hand, melds);
}

/**
 * 獲取手牌中出現的花色和字牌類型
 */
function getTileCategories(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const categories = {
    wan: false,   // 萬子
    tong: false,  // 筒子
    tiao: false,  // 條子
    wind: false,  // 風牌（東南西北）
    dragon: false // 箭牌（中發白）
  };
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'number') {
      if (tile.suit === 'wan') categories.wan = true;
      if (tile.suit === 'tong') categories.tong = true;
      if (tile.suit === 'tiao') categories.tiao = true;
    }
    if (tile.type === 'honor') {
      const windTiles = ['東', '南', '西', '北'];
      if (windTiles.includes(tile.value)) {
        categories.wind = true;
      } else {
        categories.dragon = true;
      }
    }
  }
  
  return categories;
}

/**
 * 檢查是否有順子或刻子（用於五門齊判斷）
 */
function hasMeldForSuit(hand, melds, suit) {
  // 簡化版：檢查是否有 3 張或以上的該花色牌
  let count = 0;
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'number' && tile.suit === suit) {
      count++;
    }
  }
  
  return count >= 3;
}

/**
 * 檢查小五門齊（所有花色+風牌+字牌，但其中一種只有眼牌）
 */
function checkXiaoWuMenQi(hand, melds) {
  const categories = getTileCategories(hand, melds);
  
  // 檢查是否所有類別都出現
  const allCategories = [categories.wan, categories.tong, categories.tiao, 
                         categories.wind, categories.dragon];
  const presentCount = allCategories.filter(c => c === true).length;
  
  // 小五門齊：5種都有出現，但至少有一種只有眼牌（沒有順子或刻子）
  if (presentCount !== 5) return false;
  
  // 檢查是否有哪一種只有眼牌（2張）
  // 簡化版：檢查是否有哪種花色只有2張牌
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const suitCounts = { wan: 0, tong: 0, tiao: 0, wind: 0, dragon: 0 };
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'number') {
      suitCounts[tile.suit]++;
    }
    if (tile.type === 'honor') {
      const windTiles = ['東', '南', '西', '北'];
      if (windTiles.includes(tile.value)) {
        suitCounts.wind++;
      } else {
        suitCounts.dragon++;
      }
    }
  }
  
  // 至少有一種只有2張（眼牌）
  for (let count of Object.values(suitCounts)) {
    if (count === 2) return true;
  }
  
  return false;
}

/**
 * 檢查大五門齊（所有花色+風牌+字牌，每種至少一組順子或刻子）
 */
function checkDaWuMenQi(hand, melds) {
  const categories = getTileCategories(hand, melds);
  
  // 檢查是否所有類別都出現
  const allCategories = [categories.wan, categories.tong, categories.tiao, 
                         categories.wind, categories.dragon];
  const presentCount = allCategories.filter(c => c === true).length;
  
  if (presentCount !== 5) return false;
  
  // 檢查每種是否至少有3張（順子或刻子）
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const suitCounts = { wan: 0, tong: 0, tiao: 0, wind: 0, dragon: 0 };
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'number') {
      suitCounts[tile.suit]++;
    }
    if (tile.type === 'honor') {
      const windTiles = ['東', '南', '西', '北'];
      if (windTiles.includes(tile.value)) {
        suitCounts.wind++;
      } else {
        suitCounts.dragon++;
      }
    }
  }
  
  // 每種都至少有3張
  for (let count of Object.values(suitCounts)) {
    if (count < 3) return false;
  }
  
  return true;
}

/**
 * 檢查混帶么（字牌以外的牌都帶有 1 和 9）
 */
function checkHunDaiYao(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
    
    let hasNumberTile = false;
    
    for (let tile of allTiles) {
        if (tile.type === 'flower') continue;
        if (tile.type === 'honor') continue;  // 字牌忽略，允許存在
        if (tile.type === 'number') {
            hasNumberTile = true;
            const num = getTileNumber(tile);
            if (num !== 1 && num !== 9) {
                return false;  // 出現非1/9的數字牌
            }
        }
    }
    return hasNumberTile;
}

/**
 * 檢查全帶么（只由筒索萬組成，所有組合都帶有 1 和 9）
 */
function checkQuanDaiYao(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') return false;
    if (tile.type === 'honor') return false;
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num !== 1 && num !== 9) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 檢查混老頭（字牌以外的牌只有 1 和 9）
 */
function checkHunLaoTou(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  let hasNumberTile = false;
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'honor') continue;
    if (tile.type === 'number') {
      hasNumberTile = true;
      const num = getTileNumber(tile);
      if (num !== 1 && num !== 9) {
        return false;
      }
    }
  }
  
  return hasNumberTile;
}

/**
 * 檢查清老頭（只由筒索萬組成，所有組合都是 1 和 9）
 */
function checkQingLaoTou(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'flower') return false;
    if (tile.type === 'honor') return false;
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num !== 1 && num !== 9) {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================
// 組合類（續2）檢查函數
// ============================================

/**
 * 獲取手牌中的花牌
 */
function getFlowers(hand) {
  return hand.filter(t => t.type === 'flower');
}

/**
 * 檢查小七門齊（所有花色+風牌+字牌+每種花牌至少一隻，但一種只有眼牌）
 */
function checkXiaoQiMenQi(hand, melds, flowers = []) {
  const categories = getTileCategories(hand, melds);
  const allCategories = [categories.wan, categories.tong, categories.tiao, categories.wind, categories.dragon];
  if (allCategories.filter(c => c === true).length !== 5) return false;
  
  // 🌟 改從傳入的 flowers 檢查
  const springFlowers = ['春', '夏', '秋', '冬'];
  const summerFlowers = ['梅', '蘭', '竹', '菊'];
  const hasSpringSet = springFlowers.some(f => flowers.some(fl => fl.value === f));
  const hasSummerSet = summerFlowers.some(f => flowers.some(fl => fl.value === f));
  if (!hasSpringSet && !hasSummerSet) return false;
  
  // 檢查是否至少有一種只有眼牌（2張）
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const suitCounts = { wan: 0, tong: 0, tiao: 0, wind: 0, dragon: 0 };
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'number') {
      suitCounts[tile.suit]++;
    }
    if (tile.type === 'honor') {
      const windTiles = ['東', '南', '西', '北'];
      if (windTiles.includes(tile.value)) {
        suitCounts.wind++;
      } else {
        suitCounts.dragon++;
      }
    }
  }
  
  // 至少有一種只有2張（眼牌）
  for (let count of Object.values(suitCounts)) {
    if (count === 2) return true;
  }
  
  return false;
}

/**
 * 檢查大七門齊（所有花色+風牌+字牌+每種花牌至少一隻，每種至少一組順子或刻子）
 */
function checkDaQiMenQi(hand, melds, flowers = []) {
  const categories = getTileCategories(hand, melds);
  const allCategories = [categories.wan, categories.tong, categories.tiao, categories.wind, categories.dragon];
  if (allCategories.filter(c => c === true).length !== 5) return false;
  
  // 🌟 改從傳入的 flowers 檢查
  const springFlowers = ['春', '夏', '秋', '冬'];
  const summerFlowers = ['梅', '蘭', '竹', '菊'];
  const hasSpringSet = springFlowers.some(f => flowers.some(fl => fl.value === f));
  const hasSummerSet = summerFlowers.some(f => flowers.some(fl => fl.value === f));
  if (!hasSpringSet && !hasSummerSet) return false;
  
  // 檢查每種是否至少有3張（順子或刻子）
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const suitCounts = { wan: 0, tong: 0, tiao: 0, wind: 0, dragon: 0 };
  for (let tile of allTiles) {
    if (tile.type === 'flower') continue;
    if (tile.type === 'number') {
      suitCounts[tile.suit]++;
    }
    if (tile.type === 'honor') {
      const windTiles = ['東', '南', '西', '北'];
      if (windTiles.includes(tile.value)) {
        suitCounts.wind++;
      } else {
        suitCounts.dragon++;
      }
    }
  }
  
  // 每種都至少有3張
  for (let count of Object.values(suitCounts)) {
    if (count < 3) return false;
  }
  
  return true;
}



/**
 * 檢查雞糊（計算後合共番數少於 4 番，胡別人打出的牌）
 * 注意：這個函數需要在 calculateTai 中調用，因為需要知道總台數
 * 這裡提供一個輔助函數，實際判斷在 calculateTai 中進行
 */
function isJiHu(totalTai, winType) {
  return winType !== 'selfDraw' && totalTai < 4;
}

/**
 * 檢查鴨糊（計算後合共番數少於 4 番，自摸）
 */
function isYaHu(totalTai, winType) {
  return winType === 'selfDraw' && totalTai < 4;
}

// ============================================
// 組合類（續3）檢查函數
// ============================================

/**
 * 檢查無字花（同時無字牌和花牌）
 */
function checkNoFlowerNoHonor(hand, melds, flowers) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld.tiles) allTiles.push(...meld.tiles);
    let hasHonor = false;
    for (let t of allTiles) {
        if (t.type === 'honor') hasHonor = true;
    }
    const hasFlower = flowers && flowers.length > 0;  // ✅ 從參數取得
    return !hasHonor && !hasFlower;
}


/**
 * 檢查無字花大平（除眼牌外皆為順子，只由筒索萬組成，無花牌）
 */
function checkWuZiHuaDaPing(hand, melds, flowers = []) {
    if (DEBUG) console.log('=== checkWuZiHuaDaPing 被調用 ===');
    
    // 🌟 核心修正 1：檢查玩家專屬的 flowers 陣列 (從外層傳進來的真實花牌)
    if (flowers && flowers.length > 0) {
        if (DEBUG) console.log('有花牌，無字花大平失敗');
        return false;
    }
    
    // 🌟 核心修正 2：防呆，檢查手牌中是否有殘留未分類的花牌
    const flowersInHand = hand.filter(t => t.type === 'flower');
    if (flowersInHand.length > 0) {
        if (DEBUG) console.log('手牌殘留花牌，無字花大平失敗');
        return false;
    }
    
    // 檢查字牌
    const allTiles = [...hand];
    const safeMelds = Array.isArray(melds) ? melds : [];
    for (let meld of safeMelds) {
        if (meld && meld.tiles) allTiles.push(...meld.tiles);
    }
    
    let hasHonor = false;
    for (let tile of allTiles) {
        if (tile.type === 'honor') {
            hasHonor = true;
            break;
        }
    }
    if (DEBUG) console.log('有字牌:', hasHonor);
    if (hasHonor) return false;
    
    // 檢查是否為平胡 (只有順子 + 眼牌)
    const isPinghu = checkPinghu(hand, melds);
    if (DEBUG) console.log('是平糊:', isPinghu);
    
    return isPinghu;
}

/**
 * 檢查卡窿火車（全13579）
 * 三組不同色的 13579 + 任意一種色的 13579 眼牌
 */
function checkKaLongHuoChe(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  // 過濾花牌
  const normalTiles = allTiles.filter(t => t.type === 'number');
  
  // 統計每個數字出現的次數
  const counts = { 1: 0, 3: 0, 5: 0, 7: 0, 9: 0 };
  for (let tile of normalTiles) {
    const num = getTileNumber(tile);
    if (num === 1 || num === 3 || num === 5 || num === 7 || num === 9) {
      counts[num]++;
    } else {
      return false;  // 出現非13579的數字
    }
  }
  
  // 檢查是否有3組不同色的13579（即每種數字至少有3張，且來自不同花色）
  // 簡化版：檢查每個數字是否至少有3張
  for (let num of [1, 3, 5, 7, 9]) {
    if (counts[num] < 3) return false;
  }
  
  return true;
}

/**
 * 獲取所有面子（刻子和順子）中的數字集合
 * @returns {Array} 每個面子中的數字陣列
 */
function getAllMeldNumbers(hand, melds) {
  const safeMelds = Array.isArray(melds) ? melds : [];
  const meldNumbers = [];
  
  // 1. 從副露中獲取面子
  for (let meld of safeMelds) {
    if (meld && (meld.type === 'pong' || meld.type === 'mingKong' || meld.type === 'kong' || meld.type === 'chow')) {
      const numbers = [];
      for (let tile of meld.tiles) {
        if (tile.type === 'number') {
          numbers.push(parseInt(tile.value));
        }
      }
      if (numbers.length > 0) {
        meldNumbers.push(numbers);
      }
    }
  }
  
  // 2. 從手牌中分析面子和眼牌
  const { melds: analyzedMelds, eyeTile } = analyzeHandMelds(hand, safeMelds);
  
  // 分析出的面子
  for (let meld of analyzedMelds) {
    if (meld.type === 'pong' || meld.type === 'chow') {
      const numbers = [];
      for (let tile of meld.tiles) {
        if (tile.type === 'number') {
          numbers.push(parseInt(tile.value));
        }
      }
      if (numbers.length > 0) {
        meldNumbers.push(numbers);
      }
    }
  }
  
  // 3. 記錄眼牌中的數字（如果有）
  let eyeNumber = null;
  if (eyeTile && eyeTile.type === 'number') {
    eyeNumber = parseInt(eyeTile.value);
  }
  
  return { meldNumbers, eyeNumber };
}

/**
 * 找出所有面子共同包含的數字
 * @returns {Set} 共同出現的數字集合
 */
function getCommonNumbersInAllMelds(hand, melds) {
  const { meldNumbers, eyeNumber } = getAllMeldNumbers(hand, melds);
  
  if (meldNumbers.length === 0) return new Set();
  
  // 找出所有面子共同包含的數字
  let commonNumbers = new Set(meldNumbers[0]);
  for (let i = 1; i < meldNumbers.length; i++) {
    const currentSet = new Set(meldNumbers[i]);
    for (let num of commonNumbers) {
      if (!currentSet.has(num)) {
        commonNumbers.delete(num);
      }
    }
  }
  
  return commonNumbers;
}

/**
 * 輔助方法：獲取所有數字面子和眼牌的數字集合群
 * 每一組面子會變成一個獨立的 Set，只記錄裡面的數字（排除字牌）
 */
function getNumericGroups(hand, melds) {
    const groups = [];

    // 1. 處理吃碰槓的副露
    for (let m of melds) {
        const nums = new Set();
        for (let t of m.tiles) {
            if (t.type === 'number') nums.add(parseInt(t.value));
        }
        if (nums.size > 0) groups.push(nums);
    }

    // 2. 這裡假設你的系統會把手牌拆解成完成的面子與眼牌
    // 如果傳入的 hand 已經是純數字或尚未拆解，我們預防性地將剩餘手牌按每組拆開
    // 註：最準確的做法是從你胡牌拆解出的組合(concealedMelds, pair)來丟進這個方法
    // 以下為相容你現有架構的防護拆解：
    const handNumbers = hand.filter(t => t.type === 'number').map(t => parseInt(t.value));
    
    // 由於不確定 getAllMeldNumbers 的實作，這裡建立標準面子群的掃描：
    // 建議直接傳入拆解好的陣列。此處示範標準全校驗邏輯：
    return groups; 
}

// =========================================================================
// 🌟 核心修正：統一的混帶數字校驗引擎
// =========================================================================
function validateHunDaiCount(hand, melds, requiredCount) {
    // 1. 收集全手牌中，所有「數字面子」與「數字眼牌」各自的數字集合
    const numericGroups = [];

    // 處理副露 (Melds)
    for (let m of melds) {
        const nums = new Set();
        for (let t of m.tiles) {
            if (t.type === 'number') nums.add(parseInt(t.value));
        }
        if (nums.size > 0) numericGroups.push(nums);
    }

    // 處理手牌中的面子與眼牌 (從 evalHand 中分離數字群)
    // 為了精準，我們直接向手牌與副露中所有出現過的數字進行窮舉
    const allUsedNumbers = new Set();
    for (let t of hand) {
        if (t.type === 'number') allUsedNumbers.add(parseInt(t.value));
    }
    for (let m of melds) {
        for (let t of m.tiles) {
            if (t.type === 'number') allUsedNumbers.add(parseInt(t.value));
        }
    }

    const uniqueNumbersArray = Array.from(allUsedNumbers);
    if (numericGroups.length === 0 && uniqueNumbersArray.length === 0) return false;

    // 這裡我們改用「滿足條件的獨立數字個數」來判斷
    // 港台牌標準定義：全手牌所有數字牌花色群中，總共只使用了 X 種數字
    if (uniqueNumbersArray.length === requiredCount) {
        return true;
    }

    return false;
}

/**
 * 🌟 檢查混帶一種數字 (如：五帶、七帶)
 * 條件：全手牌所有的數字面子與雀頭中，總共只出現過 1 種數字（字牌允許存在）
 */
function checkHunDaiYiZhong(hand, melds) {
    // 例如全手牌只有 7萬 777筒 789索 雀頭77萬，只使用了「7」這 1 種數字
    return validateHunDaiCount(hand, melds, 1);
}

/**
 * 🌟 檢查混帶兩種數字
 * 條件：全手牌所有的數字面子與雀頭中，總共只出現過 2 種數字（字牌允許存在）
 */
function checkHunDaiLiangZhong(hand, melds) {
    // 例如全手牌只有 3、7 兩種數字：123萬, 333筒, 789索, 雀頭77筒
    return validateHunDaiCount(hand, melds, 2);
}

/**
 * 🌟 檢查混帶三種數字
 * 條件：全手牌所有的數字面子與雀頭中，總共只出現過 3 種數字（字牌允許存在）
 */
function checkHunDaiSanZhong(hand, melds) {
    // 例如全手牌只使用了 3, 5, 7 三種數字
    return validateHunDaiCount(hand, melds, 3);
}
/**
 * 檢查滿亭芳
 * 條件：沒有字牌，所有數字面子只使用一種數字，且該數字在所有面子中都出現，眼牌也必須是該數字
 */
function checkManTingFang(hand, melds) {
  // 檢查無字牌
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'honor') return false;
    if (tile.type === 'flower') return false;
  }
  
  const { meldNumbers, eyeNumber } = getAllMeldNumbers(hand, melds);
  
  if (meldNumbers.length === 0) return false;
  
  // 找出所有面子共同包含的數字
  const commonNumbers = getCommonNumbersInAllMelds(hand, melds);
  
  // 滿亭芳：共同數字數量為 1
  if (commonNumbers.size !== 1) return false;
  
  // 眼牌必須是這個數字（不能是字牌）
  const commonNum = Array.from(commonNumbers)[0];
  if (eyeNumber === null || eyeNumber !== commonNum) return false;
  
  return true;
}

/**
 * 獲取手牌中數字牌出現的數字集合（保留用於其他用途）
 */
function getNumbersSet(hand, melds) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const numbers = new Set();
  for (let tile of allTiles) {
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num) numbers.add(num);
    }
  }
  return numbers;
}

/**
 * 檢查缺一門（只由筒索萬中兩種色組成）
 */
function checkQueYiMen(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
    
    // 有字牌時不成立
    for (let tile of allTiles) {
        if (tile.type === 'honor') return false;
    }
    
    const suits = new Set();
    for (let tile of allTiles) {
        if (tile.type === 'number') {
            suits.add(tile.suit);
        }
    }
    
    return suits.size === 2;
}

/**
 * 檢查缺五（只由除 5 以外的牌組成）
 */
/**
 * 檢查缺五（只由除 5 以外的牌組成）
 */
function checkQueWu(hand, melds) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  // 有字牌時不成立
  for (let tile of allTiles) {
    if (tile.type === 'honor') return false;
  }
  
  for (let tile of allTiles) {
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num === 5) return false;
    }
  }
  return true;
}

/**
 * 檢查斷么（只由除 1 和 9 以外的牌組成）
 */
function checkDuanYao(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
    
    // 有字牌時不成立
    for (let tile of allTiles) {
        if (tile.type === 'honor') return false;
    }
    
    for (let tile of allTiles) {
        if (tile.type === 'number') {
            const num = getTileNumber(tile);
            if (num === 1 || num === 9) return false;
        }
    }
    return true;
}


// ============================================
// 般高/同順系列檢查函數
// ============================================


/**
 * 找出所有順子（從手牌和副露中）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {Array} 順子陣列，每個順子是 [num1, num2, num3, suit, tiles]
 */


function findAllChowsWithMeldInfo(hand, melds, winType = null, winTile = null, allMelds = []) {
    return extractAllChows(hand, melds, winType, winTile, allMelds);
}

function countSameChows(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const keyCount = {};
    for (let chow of chows) {
        const key = `${chow.suit}_${chow.start}`;
        keyCount[key] = (keyCount[key] || 0) + 1;
    }
    return keyCount;
}

/**
 * 計算每種順子出現的次數，保留完整物件（用於暗牌型）
 */
function countSameChowsWithMeldInfo(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const groups = {};
    for (let chow of chows) {
        const key = `${chow.suit}_${chow.start}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(chow);
    }
    return groups;
}

// ========== 般高系列 ==========

function checkMingBanGao(hand, melds, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const groups = {};
    for (let chow of chows) {
        const key = `${chow.suit}_${chow.start}`;
        if (!groups[key]) groups[key] = { count: 0, hasMing: false };
        groups[key].count++;
        if (chow.isMeld) groups[key].hasMing = true;
    }
    for (let group of Object.values(groups)) {
        if (group.count >= 2 && group.hasMing) return true;
    }
    return false;
}

function checkAnBanGao(hand, melds, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    // 只保留全暗的順子
    const darkChows = chows.filter(c => !c.isMeld);
    const groups = {};
    for (let chow of darkChows) {
        const key = `${chow.suit}_${chow.start}`;
        groups[key] = (groups[key] || 0) + 1;
    }
    for (let count of Object.values(groups)) {
        if (count >= 2) return true;
    }
    return false;
}

function checkMingShuangBanGao(hand, melds, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const groups = {};
    for (let chow of chows) {
        const key = `${chow.suit}_${chow.start}`;
        if (!groups[key]) groups[key] = { count: 0, hasMing: false };
        groups[key].count++;
        if (chow.isMeld) groups[key].hasMing = true;
    }
    let banGaoCount = 0;
    for (let group of Object.values(groups)) {
        if (group.count >= 2 && group.hasMing) banGaoCount++;
    }
    return banGaoCount >= 2;
}

function checkAnShuangBanGao(hand, melds, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const darkChows = chows.filter(c => !c.isMeld);
    const groups = {};
    for (let chow of darkChows) {
        const key = `${chow.suit}_${chow.start}`;
        groups[key] = (groups[key] || 0) + 1;
    }
    let banGaoCount = 0;
    for (let count of Object.values(groups)) {
        if (count >= 2) banGaoCount++;
    }
    return banGaoCount >= 2;
}

/**
 * 全般高 (40番) - 所有順子都至少出現兩次（只考慮手牌中的順子）
 */
function checkQuanBanGao(hand, melds, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const darkChows = chows.filter(c => !c.isMeld);
    if (darkChows.length !== 5) return false;
    const groups = {};
    for (let chow of darkChows) {
        const key = `${chow.suit}_${chow.start}`;
        groups[key] = (groups[key] || 0) + 1;
    }
    for (let count of Object.values(groups)) {
        if (count < 2) return false;
    }
    return true;
}


function checkSameChowCountAdvanced(hand, melds, targetCount, requireNoMeldForTiles, winType, winTile, allMelds) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const chowGroups = {};
    for (let chow of chows) {
        const key = `${chow.suit}_${chow.start}`;
        if (!chowGroups[key]) chowGroups[key] = { count: 0, hasMing: false };
        chowGroups[key].count++;
        if (chow.isMeld) chowGroups[key].hasMing = true;
    }
    
    for (let group of Object.values(chowGroups)) {
        if (group.count >= targetCount) {
            if (requireNoMeldForTiles) {
                // 暗：必須全部沒有副露
                if (!group.hasMing) return true;
            } else {
                // 明：至少有一組是副露
                if (group.hasMing) return true;
            }
        }
    }
    return false;
}
function checkMingYiSeSanTongShun(hand, melds, winType, winTile, allMelds) {
    return checkSameChowCountAdvanced(hand, melds, 3, false, winType, winTile, allMelds);
}
function checkAnYiSeSanTongShun(hand, melds, winType, winTile, allMelds) {
    return checkSameChowCountAdvanced(hand, melds, 3, true, winType, winTile, allMelds);
}
function checkMingYiSeSiTongShun(hand, melds, winType, winTile, allMelds) {
    return checkSameChowCountAdvanced(hand, melds, 4, false, winType, winTile, allMelds);
}
function checkAnYiSeSiTongShun(hand, melds, winType, winTile, allMelds) {
    return checkSameChowCountAdvanced(hand, melds, 4, true, winType, winTile, allMelds);
}



// 20. 步步高系列檢查函數


// 🌟 終極重構：只從正確的胡牌結構 (allMelds) 中提取順子，徹底根除幻覺 Bug
function extractAllChows(hand, melds, winType = null, winTile = null, allMelds = []) {
    const chows = [];
    const safeMelds = Array.isArray(melds) ? melds : []; 

    if (allMelds && allMelds.length > 0) {
        for (let m of allMelds) {
            if (m && m.type === 'chow' && m.tiles && m.tiles.length === 3) {
                const tiles = m.tiles;
                const suit = tiles[0].suit;
                const nums = tiles.map(t => parseInt(t.value)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
                if (nums.length !== 3) continue;

                let isMeldLocal = false;
                if (safeMelds.some(orig => orig.type === 'chow' && orig.tiles[0].id === m.tiles[0].id)) {
                    isMeldLocal = true;
                } 
                // 🌟 出銃判定：只要這組順子包含了別人打的那張牌，就視為明(副露)！
                else if (winType === 'discard' && winTile && winTile.type === 'number') {
                    if (tiles.some(t => t.id === winTile.id || (t.suit === winTile.suit && parseInt(t.value) === parseInt(winTile.value)))) {
                        isMeldLocal = true;
                    }
                }
                chows.push({ suit: suit, start: nums[0], end: nums[2], tiles: tiles, isMeld: isMeldLocal });
            }
        }
        return chows;
    }
    return chows;
}

/**
 * 檢查一色步步高（返回是否有至少一組）
 */
function checkYiSeBuBuGao(hand, melds, isMing) {
    // 檢查萬子、筒子、條子任一花色有步步高
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeBuBuGao(hand, melds, suit, isMing);
        if (count > 0) {
            return true;
        }
    }
    return false;
}

/**
 * 檢查一色三步高（返回是否有至少一組）
 */
function checkYiSeSanBuGao(hand, melds, isMing) {
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeSanBuGao(hand, melds, suit, isMing);
        if (count > 0) {
            return true;
        }
    }
    return false;
}

/**
 * 檢查三色步步高（不同色的 123,234,345）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @param {boolean} isMing 是否為明
 * @returns {boolean}
 */
// =========================================================================
// 🌟 修正版：三色步步高（移除硬編碼，完美支援任意連續數字，自動校正出銃面子）
// =========================================================================
function checkSanSeBuBuGao(hand, melds, isMing, winType = null, winTile = null) {
  const chows = extractAllChows(hand, melds);
  if (!chows || chows.length < 3) return false;

  // 🌟 核心修正一：出銃胡補丁
  // 如果是出銃胡（winType === 'discard'），胡的那張牌所在的「手牌順子」必須強制升級為明面子 (isMeld = true)
  if (winType === 'discard' && winTile && winTile.type === 'number') {
    const winVal = parseInt(winTile.value);
    const winSuit = winTile.suit;
    
    for (let chow of chows) {
      if (!chow.isMeld && chow.suit === winSuit && winVal >= chow.start && winVal <= (chow.start + 2)) {
        chow.isMeld = true; // 強制將此面子視為已公開的副露
        break; // 僅將胡牌的那一組順子轉為明面子
      }
    }
  }

  // 🌟 核心修正二：排列組合遍歷法（徹底抹除 123/234/345 的硬編碼限制）
  // 透過窮舉任意三組順子，檢查是否能組成「三種花色、且起始數字依次遞增 1」
  for (let i = 0; i < chows.length; i++) {
    for (let j = 0; j < chows.length; j++) {
      for (let k = 0; k < chows.length; k++) {
        if (i === j || j === k || i === k) continue; // 避免重複選到同一個面子

        const c1 = chows[i], c2 = chows[j], c3 = chows[k];

        // 條件 1：三組順子的花色必須互不相同
        if (c1.suit === c2.suit || c2.suit === c3.suit || c1.suit === c3.suit) continue;

        // 條件 2：起始數字依次遞增 1 (例如：c1=5, c2=6, c3=7，對應 567, 678, 789)
        if (c1.start + 1 === c2.start && c2.start + 1 === c3.start) {
          
          // 判定這一組組合本質上是「明」還是「暗」（三組裡只要有一組是副露就是明）
          const combinationIsMing = c1.isMeld || c2.isMeld || c3.isMeld;
          
          // 如果與當前要檢查的明暗目標 (isMing) 吻合，則判定成立！
          if (isMing === combinationIsMing) {
            return true;
          }
        }
      }
    }
  }

  return false;
}


// =========================================================================
// 🌟 修正版：三色三步高（移除硬編碼，完美支援任意間隔為 2 的遞增數字）
// =========================================================================
function checkSanSeSanBuGao(hand, melds, isMing, winType = null, winTile = null) {
  const chows = extractAllChows(hand, melds);
  if (!chows || chows.length < 3) return false;

  // 🌟 核心修正一：出銃胡補丁
  if (winType === 'discard' && winTile && winTile.type === 'number') {
    const winVal = parseInt(winTile.value);
    const winSuit = winTile.suit;
    
    for (let chow of chows) {
      if (!chow.isMeld && chow.suit === winSuit && winVal >= chow.start && winVal <= (chow.start + 2)) {
        chow.isMeld = true;
        break;
      }
    }
  }

  // 🌟 核心修正二：排列組合遍歷法（移除 123/345/567 的硬編碼限制）
  // 透過窮舉任意三組順子，檢查是否能組成「三種花色、且起始數字依次遞增 2」
  for (let i = 0; i < chows.length; i++) {
    for (let j = 0; j < chows.length; j++) {
      for (let k = 0; k < chows.length; k++) {
        if (i === j || j === k || i === k) continue;

        const c1 = chows[i], c2 = chows[j], c3 = chows[k];

        // 條件 1：三組順子的花色必須互不相同
        if (c1.suit === c2.suit || c2.suit === c3.suit || c1.suit === c3.suit) continue;

        // 條件 2：起始數字依次遞增 2 (例如：c1=1, c2=3, c3=5，對應 123, 345, 567)
        if (c1.start + 2 === c2.start && c2.start + 2 === c3.start) {
          
          const combinationIsMing = c1.isMeld || c2.isMeld || c3.isMeld;
          
          if (isMing === combinationIsMing) {
            return true;
          }
        }
      }
    }
  }

  return false;
}



// 包裝函數
function checkMingYiSeBuBuGao(hand, melds) {
    // 檢查萬子、筒子、條子任一花色有步步高且有副露
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeBuBuGao(hand, melds, suit, true);
        if (count > 0) {
            if (DEBUG) console.log(`明一色步步高: 花色=${suit}, 組合數=${count}`);
            return true;
        }
    }
    return false;
}

function checkAnYiSeBuBuGao(hand, melds) {
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeBuBuGao(hand, melds, suit, false);
        if (count > 0) {
            if (DEBUG) console.log(`暗一色步步高: 花色=${suit}, 組合數=${count}`);
            return true;
        }
    }
    return false;
}

function checkMingYiSeSanBuGao(hand, melds) {
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeSanBuGao(hand, melds, suit, true);
        if (count > 0) {
            if (DEBUG) console.log(`明一色三步高: 花色=${suit}, 組合數=${count}`);
            return true;
        }
    }
    return false;
}

function checkAnYiSeSanBuGao(hand, melds) {
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countYiSeSanBuGao(hand, melds, suit, false);
        if (count > 0) {
            if (DEBUG) console.log(`暗一色三步高: 花色=${suit}, 組合數=${count}`);
            return true;
        }
    }
    return false;
}
function checkMingSanSeBuBuGao(hand, melds) {
  return checkSanSeBuBuGao(hand, melds, true);
}

function checkAnSanSeBuBuGao(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const chowColors = { 123: [], 234: [], 345: [] };
    const chowTiles = { 123: [], 234: [], 345: [] };
    
    for (let chow of chows) {
        if (chow.start === 1 && chow.end === 3) {
            chowColors[123].push(chow.suit);
            chowTiles[123].push(...chow.tiles);
        } else if (chow.start === 2 && chow.end === 4) {
            chowColors[234].push(chow.suit);
            chowTiles[234].push(...chow.tiles);
        } else if (chow.start === 3 && chow.end === 5) {
            chowColors[345].push(chow.suit);
            chowTiles[345].push(...chow.tiles);
        }
    }
    
    if (chowColors[123].length === 0 || chowColors[234].length === 0 || chowColors[345].length === 0) return false;
    
    for (let c1 of chowColors[123]) {
        for (let c2 of chowColors[234]) {
            for (let c3 of chowColors[345]) {
                if (c1 !== c2 && c1 !== c3 && c2 !== c3) {
                    const allTiles = [...chowTiles[123], ...chowTiles[234], ...chowTiles[345]];
                    if (hasNoOpenMeldForTiles(allTiles, melds)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function checkMingSanSeSanBuGao(hand, melds) {
  return checkSanSeSanBuGao(hand, melds, true);
}

function checkAnSanSeSanBuGao(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const chowColors = { 123: [], 345: [], 567: [] };
    const chowTiles = { 123: [], 345: [], 567: [] };
    
    for (let chow of chows) {
        if (chow.start === 1 && chow.end === 3) {
            chowColors[123].push(chow.suit);
            chowTiles[123].push(...chow.tiles);
        } else if (chow.start === 3 && chow.end === 5) {
            chowColors[345].push(chow.suit);
            chowTiles[345].push(...chow.tiles);
        } else if (chow.start === 5 && chow.end === 7) {
            chowColors[567].push(chow.suit);
            chowTiles[567].push(...chow.tiles);
        }
    }
    
    if (chowColors[123].length === 0 || chowColors[345].length === 0 || chowColors[567].length === 0) return false;
    
    for (let c1 of chowColors[123]) {
        for (let c2 of chowColors[345]) {
            for (let c3 of chowColors[567]) {
                if (c1 !== c2 && c1 !== c3 && c2 !== c3) {
                    const allTiles = [...chowTiles[123], ...chowTiles[345], ...chowTiles[567]];
                    if (hasNoOpenMeldForTiles(allTiles, melds)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function countYiSeBuBuGao(hand, melds, suit, isMing) {
    return countSameSuitCombinations(hand, melds, suit, [1, 2, 3], isMing);
}

function countYiSeSanBuGao(hand, melds, suit, isMing) {
    return countSameSuitCombinations(hand, melds, suit, [1, 3, 5], isMing);
}
// ============================================
// 相逢系列檢查函數
// ============================================

/**
 * 檢查相逢（兩組不同色同數字的順子）
 * 例：123萬 + 123索
 */
function checkXiangFeng(hand, melds) {
  const chows = extractAllChows(hand, melds);
  
  // 按順子數字分組
  const chowByNumbers = {};
  for (let chow of chows) {
    const key = `${chow.start},${chow.end}`;
    if (!chowByNumbers[key]) {
      chowByNumbers[key] = new Set();
    }
    chowByNumbers[key].add(chow.suit);
  }
  
  // 檢查是否有順子出現在至少2種花色
  for (let suits of Object.values(chowByNumbers)) {
    if (suits.size >= 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * 檢查三相逢（三組不同色同數字的順子，齊筒索萬）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @param {boolean} isMing 是否為明（至少一組副露）
 */
function checkSanXiangFeng(hand, melds, isMing) {
  const chows = extractAllChows(hand, melds);
  
  // 按順子數字分組
  const chowByNumbers = {};
  for (let chow of chows) {
    const key = `${chow.start},${chow.end}`;
    if (!chowByNumbers[key]) {
      chowByNumbers[key] = [];
    }
    chowByNumbers[key].push(chow);
  }
  
  // 檢查是否有順子出現在全部3種花色
  for (let [key, chowList] of Object.entries(chowByNumbers)) {
    const suits = new Set(chowList.map(c => c.suit));
    if (suits.size === 3) {
      // ✅ 找到三相逢，檢查這三組的明暗
      // 從三種花色中各取一個順子
      const involvedChows = [];
      const usedSuits = new Set();
      for (let chow of chowList) {
        if (!usedSuits.has(chow.suit)) {
          involvedChows.push(chow);
          usedSuits.add(chow.suit);
        }
      }
      
      if (isMing) {
        return involvedChows.some(c => c.isMeld === true);
      } else {
        return involvedChows.every(c => c.isMeld === false);
      }
    }
  }
  
  return false;
}

function checkSiXiangFeng(hand, melds, isMing) {
  const chows = extractAllChows(hand, melds);
  
  // 按順子數字分組（保存完整物件，不只是花色）
  const chowByNumbers = {};
  for (let chow of chows) {
    const key = `${chow.start},${chow.end}`;
    if (!chowByNumbers[key]) {
      chowByNumbers[key] = [];
    }
    chowByNumbers[key].push(chow);
  }
  
  // 檢查是否有順子出現至少4次，且包含全部3種花色
  for (let [key, chowList] of Object.entries(chowByNumbers)) {
    if (chowList.length >= 4) {
      const suits = chowList.map(c => c.suit);
      const hasWan = suits.includes('wan');
      const hasTong = suits.includes('tong');
      const hasTiao = suits.includes('tiao');
      if (hasWan && hasTong && hasTiao) {
        // ✅ 只檢查參與四相逢的順子
        if (isMing) {
          return chowList.some(c => c.isMeld === true);
        } else {
          return chowList.every(c => c.isMeld === false);
        }
      }
    }
  }
  
  return false;
}

function checkWuXiangFeng(hand, melds, isMing) {
  const chows = extractAllChows(hand, melds);
  
  const chowByNumbers = {};
  for (let chow of chows) {
    const key = `${chow.start},${chow.end}`;
    if (!chowByNumbers[key]) {
      chowByNumbers[key] = [];
    }
    chowByNumbers[key].push(chow);
  }
  
  for (let [key, chowList] of Object.entries(chowByNumbers)) {
    if (chowList.length >= 5) {
      const suits = chowList.map(c => c.suit);
      const hasWan = suits.includes('wan');
      const hasTong = suits.includes('tong');
      const hasTiao = suits.includes('tiao');
      if (hasWan && hasTong && hasTiao) {
        // ✅ 只檢查參與五相逢的順子
        if (isMing) {
          return chowList.some(c => c.isMeld === true);
        } else {
          return chowList.every(c => c.isMeld === false);
        }
      }
    }
  }
  
  return false;
}

/**
 * 檢查全相逢（眼牌以外的順子要與其他順子組成至少一次相逢）
 */
function checkQuanXiangFeng(hand, melds) {
    const chows = extractAllChows(hand, melds);
    
    // 需要有 5 組順子（完整的胡牌牌型）
    if (chows.length !== 5) return false;
    
    // 按順子起始數字分組
    const chowByNumber = {};
    for (let chow of chows) {
        const key = chow.start;
        if (!chowByNumber[key]) {
            chowByNumber[key] = new Set();
        }
        chowByNumber[key].add(chow.suit);
    }
    
    // 檢查每組順子是否都至少有 2 種花色（即參與了相逢）
    for (let suits of Object.values(chowByNumber)) {
        if (suits.size < 2) {
            if (DEBUG) console.log(`全相逢失敗: 起始數字 ${key} 只有 ${suits.size} 種花色`);
            return false;
        }
    }
    
    if (DEBUG) console.log('全相逢成立!');
    return true;
}

// 包裝函數
function checkMingSanXiangFeng(hand, melds) {
  return checkSanXiangFeng(hand, melds, true);
}

function checkAnSanXiangFeng(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const chowByNumbers = {};
    const chowTilesByNumbers = {};
    
    for (let chow of chows) {
        const key = `${chow.start},${chow.end}`;
        if (!chowByNumbers[key]) {
            chowByNumbers[key] = new Set();
            chowTilesByNumbers[key] = [];
        }
        chowByNumbers[key].add(chow.suit);
        chowTilesByNumbers[key].push(...chow.tiles);
    }
    
    for (let [key, suits] of Object.entries(chowByNumbers)) {
        if (suits.size === 3) {
            if (hasNoOpenMeldForTiles(chowTilesByNumbers[key], melds)) {
                return true;
            }
        }
    }
    return false;
}

function checkMingSiXiangFeng(hand, melds) {
  return checkSiXiangFeng(hand, melds, true);
}

function checkAnSiXiangFeng(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const chowByNumbers = {};
    const chowTilesByNumbers = {};
    
    for (let chow of chows) {
        const key = `${chow.start},${chow.end}`;
        if (!chowByNumbers[key]) {
            chowByNumbers[key] = [];
            chowTilesByNumbers[key] = [];
        }
        chowByNumbers[key].push(chow.suit);
        chowTilesByNumbers[key].push(...chow.tiles);
    }
    
    for (let [key, suits] of Object.entries(chowByNumbers)) {
        if (suits.length >= 4) {
            const hasWan = suits.includes('wan');
            const hasTong = suits.includes('tong');
            const hasTiao = suits.includes('tiao');
            if (hasWan && hasTong && hasTiao) {
                if (hasNoOpenMeldForTiles(chowTilesByNumbers[key], melds)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function checkMingWuXiangFeng(hand, melds) {
  return checkWuXiangFeng(hand, melds, true);
}

function checkAnWuXiangFeng(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const chowByNumbers = {};
    const chowTilesByNumbers = {};
    
    for (let chow of chows) {
        const key = `${chow.start},${chow.end}`;
        if (!chowByNumbers[key]) {
            chowByNumbers[key] = [];
            chowTilesByNumbers[key] = [];
        }
        chowByNumbers[key].push(chow.suit);
        chowTilesByNumbers[key].push(...chow.tiles);
    }
    
    for (let [key, suits] of Object.entries(chowByNumbers)) {
        if (suits.length >= 5) {
            const hasWan = suits.includes('wan');
            const hasTong = suits.includes('tong');
            const hasTiao = suits.includes('tiao');
            if (hasWan && hasTong && hasTiao) {
                if (hasNoOpenMeldForTiles(chowTilesByNumbers[key], melds)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ============================================
// 數字組合系列檢查函數
// ============================================

/**
 * 獲取手牌中所有數字（過濾花牌和字牌）
 */
function getAllNumbers(hand, melds) {
  const allTiles = [...hand];
  for (let meld of melds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const numbers = [];
  for (let tile of allTiles) {
    if (tile.type === 'number') {
      const num = getTileNumber(tile);
      if (num) numbers.push(num);
    }
  }
  return numbers;
}

/**
 * 獲取手牌中所有數字（去重）
 */
function getUniqueNumbers(hand, melds) {
  const numbers = getAllNumbers(hand, melds);
  return [...new Set(numbers)];
}

/**
 * 檢查雙數（胡牌牌型由兩種數字組合而成）
 */
function checkShuangShu(hand, melds) {
  const uniqueNumbers = getUniqueNumbers(hand, melds);
  return uniqueNumbers.length === 2;
}

/**
 * 檢查三數（胡牌牌型由三種數字組合而成）
 */
function checkSanShu(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld.tiles) allTiles.push(...meld.tiles);
    
    // 有字牌時不成立
    for (let tile of allTiles) {
        if (tile.type === 'honor') return false;
    }
    
    const uniqueNumbers = getUniqueNumbers(hand, melds);
    return uniqueNumbers.length === 3;
}

/**
 * 獲取手牌中所有刻子（三張相同）
 */
// 🌟 核心保險栓：只從真正的胡牌面子中提取刻子
function getAllPongs(hand, melds, allMelds = []) {
  if (allMelds && allMelds.length > 0) {
    const pongs = [];
    for (let m of allMelds) {
      if (m && ['pong', 'anKong', 'mingKong', 'kong'].includes(m.type) && m.tiles && m.tiles.length > 0) {
        const tile = m.tiles[0];
        const num = parseInt(tile.value);
        if (!isNaN(num)) pongs.push({ suit: tile.suit, num: num, count: m.tiles.length });
      }
    }
    return pongs;
  }
  
  // 備用防呆：萬一沒有 allMelds 才用舊方法
  const allTiles = [...hand];
  for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type === 'number') counts[`${tile.suit}_${tile.value}`] = (counts[`${tile.suit}_${tile.value}`] || 0) + 1;
  }
  const pongs = [];
  for (let [key, count] of Object.entries(counts)) {
    if (count >= 3) {
      const [suit, value] = key.split('_');
      pongs.push({ suit, num: parseInt(value), count });
    }
  }
  return pongs;
}

function checkLiangSeXiongDiPeng(hand, melds, allMelds = []) {
  const pongs = getAllTriplets(hand, melds, allMelds);
  const byNumber = {};
  for (let pong of pongs) {
    if (pong.suit === 'honor') continue; // 必須是數字牌
    if (!byNumber[pong.num]) byNumber[pong.num] = new Set();
    byNumber[pong.num].add(pong.suit);
  }
  for (let suits of Object.values(byNumber)) {
    if (suits.size >= 2) return true; // 同一個數字出現在兩種花色的刻子中
  }
  return false;
}

function checkXiaoSanSeXiongDiPeng(hand, melds, allMelds = [], eyeTile = null) {
  if (!eyeTile || eyeTile.type !== 'number') return false; // 必須要有數字眼牌
  const pongs = getAllTriplets(hand, melds, allMelds);
  const eyeVal = parseInt(eyeTile.value);

  const byNumber = {};
  for (let pong of pongs) {
    if (pong.suit === 'honor') continue;
    if (!byNumber[pong.num]) byNumber[pong.num] = new Set();
    byNumber[pong.num].add(pong.suit);
  }

  for (let [num, suits] of Object.entries(byNumber)) {
    // 兩組同數字刻子 + 該數字的眼牌
    if (suits.size >= 2 && parseInt(num) === eyeVal) {
      if (!suits.has(eyeTile.suit)) return true; // 眼牌的花色必須與刻子不同
    }
  }
  return false;
}

function checkDaSanSeXiongDiPeng(hand, melds, allMelds = []) {
  const pongs = getAllTriplets(hand, melds, allMelds);
  const byNumber = {};
  for (let pong of pongs) {
    if (pong.suit === 'honor') continue;
    if (!byNumber[pong.num]) byNumber[pong.num] = new Set();
    byNumber[pong.num].add(pong.suit);
  }
  for (let suits of Object.values(byNumber)) {
    if (suits.size >= 3) return true;
  }
  return false;
}
/**
 * 獲取所有刻子（包含數字和花色）
 */
// ✅ 升級：只從真正拆解出的刻子/槓子面子中提取 triplet，徹底抹除頻率認錯 Bug
function getAllTriplets(hand, melds, allMelds = []) {
  // 🌟 終極修正：如果傳入了全對局的面子拆解(allMelds)，直接從正統結果中提取！
  if (allMelds && allMelds.length > 0) {
    const triplets = [];
    for (let m of allMelds) {
      if (m && ['pong', 'anKong', 'mingKong', 'kong'].includes(m.type) && m.tiles && m.tiles.length > 0) {
        const tile = m.tiles[0];
        const num = parseInt(tile.value);
        triplets.push({ suit: tile.suit, num: isNaN(num) ? tile.value : num });
      }
    }
    return triplets;
  }
  
  // 備用防呆（若沒傳入組合，走原先老路）
  const all = [...hand];
  for (let m of melds) if (m && m.tiles) all.push(...m.tiles);
  const counts = {}; for (let t of all.filter(t => t.type === 'number')) counts[`${t.suit}_${t.value}`] = (counts[`${t.suit}_${t.value}`] || 0) + 1;
  const triplets = []; for (let [k, c] of Object.entries(counts)) if (c >= 3) { const [s, v] = k.split('_'); triplets.push({ suit: s, num: parseInt(v) }); }
  return triplets;
}

/**
 * 檢查小三色三連刻（兩組刻子 + 一對眼牌，不同色，數字連續）
 */
function checkXiaoSanSeSanLianKe(hand, melds, allMelds = [], eyeTile = null) {
  if (!eyeTile) return 0;
  
  // 🌟 核心保險栓
  const triplets = getAllTriplets(hand, melds, allMelds);
  if (triplets.length < 2) return 0;
  
  const eyeVal = parseInt(eyeTile.value);
  if (isNaN(eyeVal)) return 0;

  let count = 0;
  const used = new Set();
  
  for (let i = 0; i < triplets.length; i++) {
    for (let j = i + 1; j < triplets.length; j++) {
      const t1 = triplets[i], t2 = triplets[j];
      
      // 兩組刻子不同色，且數字與眼牌可以組成連續的 n, n+1, n+2
      if (t1.suit !== t2.suit && t1.suit !== eyeTile.suit && t2.suit !== eyeTile.suit) {
          const nums = [t1.num, t2.num, eyeVal].sort((a, b) => a - b);
          if (nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1) {
              const comboKey = `${t1.suit}_${t1.num}_${t2.suit}_${t2.num}_${eyeTile.suit}_${eyeVal}`;
              if (!used.has(comboKey)) { count++; used.add(comboKey); }
          }
      }
    }
  }
  return count;
}
/**
 * 檢查大三色三連刻（三組刻子，不同色，數字連續）
 */
function checkDaSanSeSanLianKe(hand, melds, allMelds = []) {
  // 🌟 核心保險栓：強制傳入 allMelds 獲取真實刻子
  const triplets = getAllTriplets(hand, melds, allMelds);
  if (triplets.length < 3) return 0;
  
  triplets.sort((a, b) => a.num - b.num);
  let count = 0;
  const used = new Set();
  
  for (let i = 0; i < triplets.length - 2; i++) {
    for (let j = i + 1; j < triplets.length - 1; j++) {
      for (let k = j + 1; k < triplets.length; k++) {
        const t1 = triplets[i], t2 = triplets[j], t3 = triplets[k];
        
        // 數字連續且花色各不相同
        const nums = [t1.num, t2.num, t3.num].sort((a, b) => a - b);
        if (nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1) {
          const suits = new Set([t1.suit, t2.suit, t3.suit]);
          if (suits.size === 3) {
            const key = `${t1.suit}_${t1.num}_${t2.suit}_${t2.num}_${t3.suit}_${t3.num}`;
            if (!used.has(key)) { count++; used.add(key); }
          }
        }
      }
    }
  }
  return count;
}
/**
 * 檢查小三色147/258/369碰（兩組刻子 + 眼牌，不同色，數字符合數列）
 */
function checkXiaoSanSe147(hand, melds, allMelds = [], eyeTile = null) {
    const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
    const triplets = getAllTriplets(hand, melds, allMelds);
    if (triplets.length < 2 || !eyeTile || eyeTile.type !== 'number') return 0;

    const eyeVal = parseInt(eyeTile.value);
    const eyeSuit = eyeTile.suit;

    let count = 0;
    const used = new Set();

    for (let pattern of patterns) {
        if (!pattern.includes(eyeVal)) continue; // 🌟 嚴格防呆：眼牌必須在數列中

        const patternTriplets = triplets.filter(t => t.suit !== 'honor' && pattern.includes(t.num));
        if (patternTriplets.length >= 2) {
            for (let i = 0; i < patternTriplets.length; i++) {
                for (let j = i + 1; j < patternTriplets.length; j++) {
                    const t1 = patternTriplets[i];
                    const t2 = patternTriplets[j];

                    // 🌟 嚴格防呆：刻子1、刻子2、眼牌 三者的花色必須互不相同！
                    if (t1.suit !== t2.suit && t1.suit !== eyeSuit && t2.suit !== eyeSuit) {
                        // 🌟 確保這三個數字確實完美湊齊了 147 或 258 或 369，沒有重複
                        const nums = new Set([t1.num, t2.num, eyeVal]);
                        if (nums.size === 3) {
                            const comboKey = `${pattern.join('_')}_${t1.suit}_${t2.suit}_${eyeSuit}`;
                            if (!used.has(comboKey)) {
                                count++;
                                used.add(comboKey);
                            }
                        }
                    }
                }
            }
        }
    }
    return count;
}
/**
 * 檢查大三色147/258/369碰（三組刻子，不同色，數字符合數列）
 */
function checkDaSanSe147(hand, melds, allMelds = []) {
    const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
    const triplets = getAllTriplets(hand, melds, allMelds);
    if (triplets.length < 3) return 0;

    let count = 0;
    const used = new Set();

    for (let pattern of patterns) {
        const patternTriplets = triplets.filter(t => t.suit !== 'honor' && pattern.includes(t.num));
        if (patternTriplets.length >= 3) {
            const bySuit = { wan: [], tong: [], tiao: [] };
            for (let t of patternTriplets) bySuit[t.suit].push(t.num);

            if (bySuit.wan.length > 0 && bySuit.tong.length > 0 && bySuit.tiao.length > 0) {
                for (let w of bySuit.wan) {
                    for (let t of bySuit.tong) {
                        for (let s of bySuit.tiao) {
                            const nums = new Set([w, t, s]);
                            let matchCount = 0;
                            for (let p of pattern) if (nums.has(p)) matchCount++;
                            if (matchCount === 3) {
                                const comboKey = `${pattern.join('_')}_${w}_${t}_${s}`;
                                if (!used.has(comboKey)) {
                                    count++;
                                    used.add(comboKey);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return count;
}

// 23. 十六不搭/十三么系列檢查函數
// 

/**
 * 檢查十六不搭
 * 牌型：三隻互相+3/-3萬子 + 三隻+3/-3筒子 + 三隻互相+3/-3索子 + 東南西北中發白各一隻 + 一隻以上描述的牌
 */
function checkShiLiuBuDa(hand, melds) {
  if (DEBUG) console.log('=== checkShiLiuBuDa 被調用 ===');
  
  if (melds.length > 0) {
    if (DEBUG) console.log('有副露，返回 false');
    return false;
  }
  
  const allTiles = [...hand];
  const normalTiles = allTiles.filter(t => t.type !== 'flower');
  
  const wanNumbers = [];
  const tongNumbers = [];
  const tiaoNumbers = [];
  const honorTiles = [];
  
  for (let tile of normalTiles) {
    if (tile.type === 'number') {
      const num = parseInt(tile.value);
      if (tile.suit === 'wan') wanNumbers.push(num);
      else if (tile.suit === 'tong') tongNumbers.push(num);
      else if (tile.suit === 'tiao') tiaoNumbers.push(num);
    } else if (tile.type === 'honor') {
      honorTiles.push(tile.value);
    }
  }
  
  // ========== 定義 checkDifferences 內部函數 ==========
  function checkDifferences(numbers) {
    if (numbers.length === 3) {
      const sorted = [...numbers].sort((a, b) => a - b);
      const diff1 = sorted[1] - sorted[0];
      const diff2 = sorted[2] - sorted[1];
      return diff1 >= 3 && diff2 >= 3;
    }
    
    if (numbers.length === 4) {
      // 找出哪個數字出現2次（眼牌）
      const counts = {};
      for (let num of numbers) {
        counts[num] = (counts[num] || 0) + 1;
      }
      
      // 找出眼牌數字（出現2次的那個）
      let eyeNum = null;
      for (let [num, count] of Object.entries(counts)) {
        if (count === 2) {
          eyeNum = parseInt(num);
          break;
        }
      }
      
      if (eyeNum === null) {
        // 沒有出現2次的數字，嘗試每一種組合
        for (let i = 0; i < numbers.length; i++) {
          for (let j = i + 1; j < numbers.length; j++) {
            const remaining = [];
            for (let k = 0; k < numbers.length; k++) {
              if (k !== i && k !== j) remaining.push(numbers[k]);
            }
            remaining.sort((a, b) => a - b);
            const diff1 = remaining[1] - remaining[0];
            const diff2 = remaining[2] - remaining[1];
            if (diff1 >= 3 && diff2 >= 3) {
              return true;
            }
          }
        }
        return false;
      }
      
      // 有眼牌數字，移除一張眼牌，保留一張作為3張的一部分
      const remaining = [];
      let eyeRemoved = false;
      for (let num of numbers) {
        if (num === eyeNum && !eyeRemoved) {
          eyeRemoved = true;  // 只移除一張眼牌
        } else {
          remaining.push(num);
        }
      }
      remaining.sort((a, b) => a - b);
      
      if (remaining.length !== 3) return false;
      
      const diff1 = remaining[1] - remaining[0];
      const diff2 = remaining[2] - remaining[1];
      return diff1 >= 3 && diff2 >= 3;
    }
    
    return false;
  }
  // ========== checkDifferences 定義結束 ==========
  
  // 字牌必須有全部7種
  const requiredHonors = ['東', '南', '西', '北', '中', '發', '白'];
  for (let honor of requiredHonors) {
    const count = honorTiles.filter(h => h === honor).length;
    if (count === 0) {
      if (DEBUG) console.log(`缺少字牌 ${honor}，返回 false`);
      return false;
    }
  }
  
  // 計算總牌數
  const totalNumberTiles = wanNumbers.length + tongNumbers.length + tiaoNumbers.length;
  const totalHonorTiles = honorTiles.length;
  
  // 字牌數量：7或8張
  if (totalHonorTiles < 7 || totalHonorTiles > 8) {
    if (DEBUG) console.log(`字牌數量 ${totalHonorTiles}，不是 7 或 8，返回 false`);
    return false;
  }
  
  // 數字牌數量：9或10張
  const expectedNumberTiles = (totalHonorTiles === 7) ? 10 : 9;
  if (totalNumberTiles !== expectedNumberTiles) {
    if (DEBUG) console.log(`數字牌數量 ${totalNumberTiles}，預期 ${expectedNumberTiles}，返回 false`);
    return false;
  }
  
  // 每種花色：3或4張
  const suits = [wanNumbers, tongNumbers, tiaoNumbers];
  let hasFourCount = 0;
  
  for (let suit of suits) {
    const len = suit.length;
    if (len !== 3 && len !== 4) {
      if (DEBUG) console.log(`花色長度 ${len}，不是 3 或 4，返回 false`);
      return false;
    }
    if (len === 4) hasFourCount++;
  }
  
  // 只能有一個花色有4張（眼牌在花色中），或者都沒有4張（眼牌在字牌中）
  if (totalHonorTiles === 7 && hasFourCount !== 1) {
    if (DEBUG) console.log(`字牌7張時，需要恰好一個花色有4張，實際有 ${hasFourCount} 個`);
    return false;
  }
  if (totalHonorTiles === 8 && hasFourCount !== 0) {
    if (DEBUG) console.log(`字牌8張時，不能有花色有4張，實際有 ${hasFourCount} 個`);
    return false;
  }
  
  // 檢查每種花色的差值
  if (!checkDifferences(wanNumbers)) {
    if (DEBUG) console.log('萬子差值不符合要求');
    return false;
  }
  if (!checkDifferences(tongNumbers)) {
    if (DEBUG) console.log('筒子差值不符合要求');
    return false;
  }
  if (!checkDifferences(tiaoNumbers)) {
    if (DEBUG) console.log('索子差值不符合要求');
    return false;
  }
  
  if (DEBUG) console.log('十六不搭檢查通過！');
  return true;
}
/**
 * 檢查十六不搭（蛇）- 筒索萬牌以147+258+369排列
 */
function checkShiLiuBuDaShe(hand, melds) {
  if (melds.length > 0) return false;
  
  const allTiles = [...hand];
  const normalTiles = allTiles.filter(t => t.type !== 'flower');
  
  let wanNumbers = [];
  let tongNumbers = [];
  let tiaoNumbers = [];
  const honorTiles = [];
  
  for (let tile of normalTiles) {
    if (tile.type === 'number') {
      const num = parseInt(tile.value);
      if (tile.suit === 'wan') wanNumbers.push(num);
      else if (tile.suit === 'tong') tongNumbers.push(num);
      else if (tile.suit === 'tiao') tiaoNumbers.push(num);
    } else if (tile.type === 'honor') {
      honorTiles.push(tile.value);
    }
  }
  
  // 檢查字牌：必須包含全部7種
  const requiredHonors = ['東', '南', '西', '北', '中', '發', '白'];
  for (let honor of requiredHonors) {
    if (!honorTiles.includes(honor)) return false;
  }
  
  // 字牌數量：7或8張
  const honorCount = honorTiles.length;
  if (honorCount < 7 || honorCount > 8) return false;
  
  // 處理可能有眼牌的花色（取出核心的3張數字）
  function getCoreNumbers(numbers) {
    if (numbers.length === 3) {
      return [...numbers].sort((a, b) => a - b);
    }
    if (numbers.length === 4) {
      // 找出哪個數字出現2次（眼牌）
      const counts = {};
      for (let num of numbers) {
        counts[num] = (counts[num] || 0) + 1;
      }
      
      // 找出眼牌數字（出現2次的那個）
      let eyeNum = null;
      for (let [num, count] of Object.entries(counts)) {
        if (count === 2) {
          eyeNum = parseInt(num);
          break;
        }
      }
      
      if (eyeNum === null) return null;
      
      // 移除一張眼牌，保留三張
      const remaining = [];
      let eyeRemoved = false;
      for (let num of numbers) {
        if (num === eyeNum && !eyeRemoved) {
          eyeRemoved = true;
        } else {
          remaining.push(num);
        }
      }
      return remaining.sort((a, b) => a - b);
    }
    return null;
  }
  
  const wanCore = getCoreNumbers(wanNumbers);
  const tongCore = getCoreNumbers(tongNumbers);
  const tiaoCore = getCoreNumbers(tiaoNumbers);
  
  if (!wanCore || !tongCore || !tiaoCore) return false;
  
  // 蛇的定義：萬子 1,4,7 / 筒子 2,5,8 / 索子 3,6,9
  // 或者任何順序的排列？根據規則，蛇是 147,258,369 的組合
  
  // 檢查是否為 1,4,7 的組合（順序不拘）
  function is147(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[0] === 1 && sorted[1] === 4 && sorted[2] === 7;
  }
  
  // 檢查是否為 2,5,8 的組合
  function is258(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[0] === 2 && sorted[1] === 5 && sorted[2] === 8;
  }
  
  // 檢查是否為 3,6,9 的組合
  function is369(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[0] === 3 && sorted[1] === 6 && sorted[2] === 9;
  }
  
  // 檢查三種花色是否分別是 147, 258, 369（順序可交換）
  const patterns = [is147, is258, is369];
  let usedPatterns = [false, false, false];
  
  // 檢查萬子
  let wanPattern = -1;
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i](wanCore)) {
      wanPattern = i;
      usedPatterns[i] = true;
      break;
    }
  }
  if (wanPattern === -1) return false;
  
  // 檢查筒子
  let tongPattern = -1;
  for (let i = 0; i < patterns.length; i++) {
    if (!usedPatterns[i] && patterns[i](tongCore)) {
      tongPattern = i;
      usedPatterns[i] = true;
      break;
    }
  }
  if (tongPattern === -1) return false;
  
  // 檢查索子
  let tiaoPattern = -1;
  for (let i = 0; i < patterns.length; i++) {
    if (!usedPatterns[i] && patterns[i](tiaoCore)) {
      tiaoPattern = i;
      usedPatterns[i] = true;
      break;
    }
  }
  if (tiaoPattern === -1) return false;
  
  // 檢查眼牌位置是否正確
  const hasEyeInSuit = (wanNumbers.length === 4) || (tongNumbers.length === 4) || (tiaoNumbers.length === 4);
  const hasEyeInHonor = (honorCount === 8);
  
  if (hasEyeInSuit && hasEyeInHonor) return false;
  if (!hasEyeInSuit && !hasEyeInHonor) return false;
  
  return true;
}

/**
 * 檢查十六不搭（相逢）- 筒索萬牌以同一數字排列
 */
function checkShiLiuBuDaXiangFeng(hand, melds) {
  if (melds.length > 0) return false;
  
  const allTiles = [...hand];
  const normalTiles = allTiles.filter(t => t.type !== 'flower');
  
  // 收集每種花色的數字
  let wanNumbers = [];
  let tongNumbers = [];
  let tiaoNumbers = [];
  const honorTiles = [];
  
  for (let tile of normalTiles) {
    if (tile.type === 'number') {
      const num = parseInt(tile.value);
      if (tile.suit === 'wan') wanNumbers.push(num);
      else if (tile.suit === 'tong') tongNumbers.push(num);
      else if (tile.suit === 'tiao') tiaoNumbers.push(num);
    } else if (tile.type === 'honor') {
      honorTiles.push(tile.value);
    }
  }
  
  // 檢查字牌：必須包含全部7種
  const requiredHonors = ['東', '南', '西', '北', '中', '發', '白'];
  for (let honor of requiredHonors) {
    if (!honorTiles.includes(honor)) return false;
  }
  
  // 字牌數量：7或8張
  const honorCount = honorTiles.length;
  if (honorCount < 7 || honorCount > 8) return false;
  
  // 處理可能有眼牌的花色（取出核心的3張數字）
  function getCoreNumbers(numbers) {
    if (numbers.length === 3) {
      return [...numbers].sort((a, b) => a - b);
    }
    if (numbers.length === 4) {
      // 找出哪個數字出現2次（眼牌）
      const counts = {};
      for (let num of numbers) {
        counts[num] = (counts[num] || 0) + 1;
      }
      
      // 找出眼牌數字（出現2次的那個）
      let eyeNum = null;
      for (let [num, count] of Object.entries(counts)) {
        if (count === 2) {
          eyeNum = parseInt(num);
          break;
        }
      }
      
      if (eyeNum === null) return null;
      
      // 移除一張眼牌，保留三張
      const remaining = [];
      let eyeRemoved = false;
      for (let num of numbers) {
        if (num === eyeNum && !eyeRemoved) {
          eyeRemoved = true;
        } else {
          remaining.push(num);
        }
      }
      return remaining.sort((a, b) => a - b);
    }
    return null;
  }
  
  const wanCore = getCoreNumbers(wanNumbers);
  const tongCore = getCoreNumbers(tongNumbers);
  const tiaoCore = getCoreNumbers(tiaoNumbers);
  
  if (!wanCore || !tongCore || !tiaoCore) return false;
  
  // 檢查每種花色的核心3張數字是否相同
  for (let i = 0; i < 3; i++) {
    if (wanCore[i] !== tongCore[i] || wanCore[i] !== tiaoCore[i]) {
      return false;
    }
  }
  
  // 檢查眼牌位置是否正確
  const hasEyeInSuit = (wanNumbers.length === 4) || (tongNumbers.length === 4) || (tiaoNumbers.length === 4);
  const hasEyeInHonor = (honorCount === 8);
  
  if (hasEyeInSuit && hasEyeInHonor) return false;  // 不能兩個地方都有眼牌
  if (!hasEyeInSuit && !hasEyeInHonor) return false; // 必須有一個地方有眼牌
  
  return true;
}

/**
 * 檢查十六不搭（十六飛）- 叫糊16隻牌
 * 與十六不搭相同，但需要檢查叫糊數量
 */
function checkShiLiuBuDaShiLiuFei(hand, melds) {
  // 先檢查是否為十六不搭
  if (!checkShiLiuBuDa(hand, melds)) return false;
  
  // 十六飛需要叫糊16隻牌，這裡簡化為與十六不搭相同
  // 實際需要在遊戲中判斷叫糊數量
  return true;
}

/**
 * 檢查十三么（19萬+19筒+19索+東南西北中發白各一 + 以上任意一隻 + 一組順子/刻子）
 * 港式台牌由於是17張，需加一組順子/刻子
 */
function checkShiSanYao(hand, melds) {
  if (melds.length > 0) return false;
  
  const allTiles = [...hand];
  const normalTiles = allTiles.filter(t => t.type !== 'flower');
  if (normalTiles.length !== 17) return false;
  
  // 十三么需要的13種牌
  const requiredKeys = new Set([
    'wan_1', 'wan_9', 'tong_1', 'tong_9', 'tiao_1', 'tiao_9',
    'honor_東', 'honor_南', 'honor_西', 'honor_北', 'honor_中', 'honor_發', 'honor_白'
  ]);
  
  // 統計每種牌的數量
  const counts = {};
  for (let tile of normalTiles) {
    const key = `${tile.suit}_${tile.value}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  
  // 1. 檢查是否所有13種牌都至少出現1次
  for (let required of requiredKeys) {
    if ((counts[required] || 0) === 0) {
      if (DEBUG) console.log(`十三么失敗: 缺少 ${required}`);
      return false;
    }
  }
  
  // 2. 統計么九牌的總數（不包括非么九牌）
  let yaochiuTotal = 0;
  for (let [key, count] of Object.entries(counts)) {
    if (requiredKeys.has(key)) {
      yaochiuTotal += count;
    }
  }
  
  // 3. 非么九牌只能出現在外加的面子中（最多3張）
  const nonYaochiuCount = normalTiles.length - yaochiuTotal;
  if (nonYaochiuCount > 3) {
    if (DEBUG) console.log(`十三么失敗: 非么九牌超過3張 (${nonYaochiuCount}張)`);
    return false;
  }
  
  if (DEBUG) console.log(`十三么檢查結果: true (么九牌共${yaochiuTotal}張, 非么九牌${nonYaochiuCount}張)`);
  return true;
}


/**
 * 檢查混帶么十三么（十三么 + 帶有1或9的順子）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
function checkHunDaiYaoShiSanYao(hand, melds) {
  // 先檢查是否為十三么
  if (!checkShiSanYao(hand, melds)) return false;
  
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  // 找出所有順子
  const chows = extractAllChows(hand, safeMelds);
  
  if (DEBUG) console.log('混帶么十三么檢查 - 順子列表:', chows.map(c => `${c.suit}_${c.start}-${c.end}`));
  
  // 檢查是否有順子包含 1 或 9
  let hasChowWithOneOrNine = false;
  
  for (let chow of chows) {
    const chowNumbers = [];
    for (let tile of chow.tiles) {
      const num = parseInt(tile.value);
      if (!isNaN(num)) {
        chowNumbers.push(num);
      }
    }
    if (DEBUG) console.log(`  順子數字: ${chowNumbers}`);
    
    if (chowNumbers.includes(1) || chowNumbers.includes(9)) {
      hasChowWithOneOrNine = true;
      if (DEBUG) console.log(`  包含1或9 ✅`);
      break;
    }
  }
  
  if (!hasChowWithOneOrNine) {
    if (DEBUG) console.log('混帶么十三么失敗: 沒有包含1或9的順子');
    return false;
  }
  
  if (DEBUG) console.log('混帶么十三么成立!');
  return true;
}


// ============================================
// 補充規則檢查函數
// ============================================


/**
 * 檢查無花（無花牌）
 */
function checkWuHua(hand, melds, flowers = []) {
  // 🌟 修正：直接檢查真實的花牌陣列
  return (!flowers || flowers.length === 0);
}

/**
 * 檢查無字（無字牌）
 */
// 無字牌 (2番)
function checkWuZi(hand, melds) {
    const allTiles = [...hand];
    for (let meld of melds) if (meld.tiles) allTiles.push(...meld.tiles);
    for (let t of allTiles) if (t.type === 'honor') return false;
    return true;
}

/**
 * 檢查暗槓（牌型台數）
 */
function checkAnGangForTai(melds) {
  const safeMelds = Array.isArray(melds) ? melds : [];
  let count = 0;
  for (let meld of safeMelds) {
    if (meld && meld.type === 'anKong') {
      count++;
    }
  }
  return count;
}

/**
 * 檢查明槓（牌型台數）
 */
function checkMingGangForTai(melds) {
  const safeMelds = Array.isArray(melds) ? melds : [];
  let count = 0;
  for (let meld of safeMelds) {
    if (meld && (meld.type === 'mingKong' || meld.type === 'kong')) {
      count++;
    }
  }
  return count;
}

/**
 * 檢查花/槓摸（摸花或槓牌後補的那隻牌可胡牌，不加計自摸）
 */
function checkHuaGangMo(extraInfo) {
  return extraInfo.isAfterFlowerOrKong && extraInfo.isWinOnDraw;
}

/**
 * 檢查花/槓上花（連續補牌後自摸）
 * @param {Object} extraInfo 額外資訊
 * @param {number} consecutiveCount 連續次數
 */
function checkHuaGangShangHua(extraInfo, consecutiveCount) {
  return extraInfo.consecutiveDrawAfterFlowerKong === consecutiveCount;
}

// ============================================
// 賞罰規則檢查函數
// ============================================

/**
 * 檢查暗槓（手牌四隻相同牌時槓牌）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
function checkAnKongReward(hand, melds) {
  // 檢查是否有暗槓（在副露中）
  for (let meld of melds) {
    if (meld && meld.type === 'anKong') {
      return true;
    }
  }
  
  // 檢查手牌中是否有4張相同牌（可以暗槓）
  const counts = {};
  for (let tile of hand) {
    if (tile.type !== 'flower') {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  
  for (let count of Object.values(counts)) {
    if (count === 4) {
      return true;
    }
  }
  
  return false;
}

/**
 * 檢查一枱草（花牌組成1234組合）
 * 春、夏、秋、冬 或 梅、蘭、竹、菊
 */
function checkYiTaiCaoReward(hand, melds, flowers = []) {
  // 🌟 修正：改從參數提取花牌
  const flowerValues = flowers ? flowers.map(f => f.value) : [];
  const springSet = ['春', '夏', '秋', '冬'];
  const summerSet = ['梅', '蘭', '竹', '菊'];
  
  const hasSpringSet = springSet.every(f => flowerValues.includes(f));
  const hasSummerSet = summerSet.every(f => flowerValues.includes(f));
  
  return hasSpringSet || hasSummerSet;
}

/**
 * 檢查一枱花（集齊一組花牌）
 */
function checkYiTaiHuaReward(hand, melds, flowers = []) {
  const flowerValues = flowers ? flowers.map(f => f.value) : [];
  const springSet = ['春', '夏', '秋', '冬'];
  const summerSet = ['梅', '蘭', '竹', '菊'];
  
  const hasSpringSet = springSet.every(f => flowerValues.includes(f));
  const hasSummerSet = summerSet.every(f => flowerValues.includes(f));
  
  return hasSpringSet || hasSummerSet;
}

/**
 * 檢查圍骰（三隻骰子數字一樣）
 * @param {Array} diceValues 骰子點數陣列
 * @returns {boolean}
 */
function checkWeiShaiReward(diceValues) {
  if (!diceValues || diceValues.length !== 3) return false;
  return diceValues[0] === diceValues[1] && diceValues[1] === diceValues[2];
}

/**
 * 檢查123骰（三隻骰子數字為1,2,3）
 */
function checkOneTwoThreeShaiPenalty(diceValues) {
  if (!diceValues || diceValues.length !== 3) return false;
  const sorted = [...diceValues].sort((a, b) => a - b);
  return sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3;
}

/**
 * 檢查三追番子（連續三位玩家打出同一隻番字牌，第四家打不出）
 * @param {Array} lastDiscards 最近打出的牌記錄
 * @returns {boolean}
 */
function checkSanZhuiFanZiPenalty(lastDiscards) {
  if (!lastDiscards || lastDiscards.length < 3) return false;
  
  const lastThree = lastDiscards.slice(-3);
  const firstTile = lastThree[0];
  
  // 檢查是否都是番字牌（字牌）
  if (firstTile.type !== 'honor') return false;
  
  // 檢查是否都是同一隻牌
  return lastThree.every(t => t.value === firstTile.value);
}

/**
 * 檢查三追非番子（連續三位玩家打出同一隻筒索萬牌，第四家打不出）
 */
function checkSanZhuiFeiFanZiPenalty(lastDiscards) {
  if (!lastDiscards || lastDiscards.length < 3) return false;
  
  const lastThree = lastDiscards.slice(-3);
  const firstTile = lastThree[0];
  
  // 檢查是否都是數字牌
  if (firstTile.type !== 'number') return false;
  
  // 檢查是否都是同一隻牌
  return lastThree.every(t => t.value === firstTile.value);
}

/**
 * 檢查4追番子（連續四位玩家打出同一隻番字牌）
 */
function checkFourZhuiFanZiPenalty(lastDiscards) {
  if (!lastDiscards || lastDiscards.length < 4) return false;
  
  const lastFour = lastDiscards.slice(-4);
  const firstTile = lastFour[0];
  
  if (firstTile.type !== 'honor') return false;
  
  return lastFour.every(t => t.value === firstTile.value);
}

/**
 * 檢查4追非番子（連續四位玩家打出同一隻筒索萬牌）
 */
function checkFourZhuiFeiFanZiPenalty(lastDiscards) {
  if (!lastDiscards || lastDiscards.length < 4) return false;
  
  const lastFour = lastDiscards.slice(-4);
  const firstTile = lastFour[0];
  
  if (firstTile.type !== 'number') return false;
  
  return lastFour.every(t => t.value === firstTile.value);
}

/**
 * 檢查出銃雙響/三響後自摸
 * @param {boolean} isAfterDoubleOrTriple 是否在雙響/三響之後
 * @param {boolean} isSelfDraw 是否自摸
 */
function checkChuChongDoubleTripleThenZiMoReward(isAfterDoubleOrTriple, isSelfDraw) {
  return isAfterDoubleOrTriple && isSelfDraw;
}

// ============================================
// 老少/雜龍系列檢查函數
// ============================================

function extractAllChowsAdvanced(hand, melds, winType = null, winTile = null, allMelds = []) {
    return extractAllChows(hand, melds, winType, winTile, allMelds);
}

/**
 * 檢查指定的順子組合是否都存在
 * @param {Array} chows 所有順子
 * @param {Array} requiredStarts 需要的順子起始數字，如 [1,4,7] 代表 123,456,789
 * @param {string|null} suit 花色（null 表示任何花色，用於雜龍）
 * @param {boolean} isMing 是否為明（至少一組副露）
 * @returns {boolean}
 */
function checkDragonPattern(chows, requiredStarts, suit, isMing) {
    // 按花色分組
    const bySuit = { wan: [], tong: [], tiao: [] };
    for (let chow of chows) {
        if (bySuit[chow.suit]) {
            bySuit[chow.suit].push(chow);
        }
    }
    
    if (suit !== null) {
        // 清龍：指定花色
        const suitChows = bySuit[suit] || [];
        if (suitChows.length < 3) return false;
        
        const starts = suitChows.map(c => c.start);
        let foundCount = 0;
        for (let start of requiredStarts) {
            if (starts.includes(start)) foundCount++;
        }
        if (foundCount !== 3) return false;
        
        if (isMing) {
            const hasMeld = suitChows.some(c => c.isMeld === true);
            if (!hasMeld) return false;
        } else {
            const hasMeld = suitChows.some(c => c.isMeld === true);
            if (hasMeld) return false;
        }
        return true;
    } else {
    // 雜龍：三種不同花色
    let found123 = null, found456 = null, found789 = null;
    
    for (let chow of chows) {
        if (chow.start === 1 && !found123) {
            found123 = chow;
        } else if (chow.start === 4 && !found456 && chow.suit !== found123?.suit) {
            found456 = chow;
        } else if (chow.start === 7 && !found789 && chow.suit !== found123?.suit && chow.suit !== found456?.suit) {
            found789 = chow;
        }
    }
    
    if (!found123 || !found456 || !found789) return false;
    
    // ✅ 只用這三組來判斷明暗
    const involvedChows = [found123, found456, found789];
    
    if (isMing) {
        const hasMeld = involvedChows.some(c => c.isMeld === true);
        if (!hasMeld) return false;
    } else {
        const hasMeld = involvedChows.some(c => c.isMeld === true);
        if (hasMeld) return false;
    }
    return true;
}
}

/**
 * 檢查明雜龍
 */
function checkMingZaLong(hand, melds) {
    const chows = extractAllChowsAdvanced(hand, melds);
    return checkDragonPattern(chows, [1, 4, 7], null, true);
}

/**
 * 檢查暗雜龍
 */
function checkAnZaLong(hand, melds) {
    const chows = extractAllChowsAdvanced(hand, melds);
    return checkDragonPattern(chows, [1, 4, 7], null, false);
}

/**
 * 檢查明清龍
 */
function checkMingQingLong(hand, melds) {
    const chows = extractAllChowsAdvanced(hand, melds);
    // 嘗試每種花色
    for (let suit of ['wan', 'tong', 'tiao']) {
        if (checkDragonPattern(chows, [1, 4, 7], suit, true)) {
            return true;
        }
    }
    return false;
}

/**
 * 檢查暗清龍（123+456+789，30番）
 */
function checkAnQingLong(hand, melds) {
    const chows = extractAllChows(hand, melds);
    const bySuit = { wan: [], tong: [], tiao: [] };
    for (let chow of chows) {
        if (!chow.isMeld) {  // 只計算暗的
            bySuit[chow.suit].push(chow.start);
        }
    }
    
    let qingLongCount = 0;
    for (let suit of ['wan', 'tong', 'tiao']) {
        const starts = bySuit[suit];
        const count1 = starts.filter(s => s === 1).length;
        const count4 = starts.filter(s => s === 4).length;
        const count7 = starts.filter(s => s === 7).length;
        const minCount = Math.min(count1, count4, count7);
        qingLongCount += minCount;
    }
    return qingLongCount;
}

// ============================================
// 老少系列檢查函數
// ============================================

/**
 * 檢查老少（同色的 123 和 789 順子）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
// ============================================
// 老少系列檢查函數
// ============================================

/**
 * 檢查老少（同色的 123 和 789 順子）
 */
function checkLaoShao(hand, melds) {
    const chows = extractAllChowsAdvanced(hand, melds);
    
    // 按花色分組
    const bySuit = { wan: [], tong: [], tiao: [] };
    for (let chow of chows) {
        if (bySuit[chow.suit]) {
            bySuit[chow.suit].push(chow.start);
        }
    }
    
    // 檢查每種花色是否有 123 和 789
    for (let suit of ['wan', 'tong', 'tiao']) {
        const starts = bySuit[suit];
        const has123 = starts.includes(1);
        const has789 = starts.includes(7);
        if (has123 && has789) {
            return true;
        }
    }
    return false;
}


/**
 * 檢查雙老少（兩種不同色的老少）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
function checkShuangLaoShao(hand, melds) {
    const chows = extractAllChowsAdvanced(hand, melds);
    
    // 按花色分組
    const bySuit = { wan: { has123: false, has789: false }, tong: { has123: false, has789: false }, tiao: { has123: false, has789: false } };
    for (let chow of chows) {
        if (chow.start === 1) bySuit[chow.suit].has123 = true;
        if (chow.start === 7) bySuit[chow.suit].has789 = true;
    }
    
    // 計算有多少種花色同時有 123 和 789
    let count = 0;
    for (let suit of ['wan', 'tong', 'tiao']) {
        if (bySuit[suit].has123 && bySuit[suit].has789) {
            count++;
        }
    }
    return count >= 2;
}

/**
 * 檢查指定的牌是否都沒有副露
 * @param {Array} tiles 要檢查的牌陣列
 * @param {Array} melds 所有副露
 * @returns {boolean}
 */
function hasNoOpenMeldForTiles(tiles, melds) {
  if (!tiles || tiles.length === 0) return true;
  const safeMelds = Array.isArray(melds) ? melds : [];
  if (safeMelds.length === 0) return true;
  
  const tileIds = new Set();
  for (let tile of tiles) {
    if (tile.id !== undefined) {
      tileIds.add(tile.id);
    } else {
      tileIds.add(`${tile.suit}_${tile.value}`);
    }
  }
  
  for (let meld of safeMelds) {
    if (meld && (meld.type === 'pong' || meld.type === 'mingKong' || meld.type === 'chow')) {
      if (meld.tiles) {
        for (let tile of meld.tiles) {
          const key = tile.id !== undefined ? tile.id : `${tile.suit}_${tile.value}`;
          if (tileIds.has(key)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function checkOneSetFlower(hand, melds, flowers = []) {
    // 🌟 修正：改從參數提取花牌
    const flowerValues = flowers ? flowers.map(f => f.value) : [];
    const springSet = ['春', '夏', '秋', '冬'];
    const summerSet = ['梅', '蘭', '竹', '菊'];
    const hasSpringSet = springSet.every(f => flowerValues.includes(f));
    const hasSummerSet = summerSet.every(f => flowerValues.includes(f));
    return hasSpringSet || hasSummerSet;
}

// ============================================
// 組合計算通用函數
// ============================================

/**
 * 計算同色步步高/三步高的組合數（支援重疊）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @param {string} suit 花色
 * @param {Array} requiredStarts 需要的起始數字，如 [1,2,3] 或 [1,3,5]
 * @param {boolean} isMing 是否為明
 * @returns {number} 組合數
 */
function countSameSuitCombinations(hand, melds, suit, requiredStarts, isMing = false, winType = null, winTile = null, allMelds = []) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    
    // 清龍特殊處理 (147)
    if (requiredStarts.length === 3 && requiredStarts[0] === 1 && requiredStarts[1] === 4 && requiredStarts[2] === 7) {
        let total = 0;
        const c1s = chows.filter(c => c.suit === suit && c.start === 1);
        const c4s = chows.filter(c => c.suit === suit && c.start === 4);
        const c7s = chows.filter(c => c.suit === suit && c.start === 7);

        for (let c1 of c1s) {
            for (let c4 of c4s) {
                for (let c7 of c7s) {
                    // 🌟 核心修正：獨立判定每條龍的明暗
                    const comboIsMing = c1.isMeld || c4.isMeld || c7.isMeld;
                    if (isMing === comboIsMing) total++;
                }
            }
        }
        return total;
    }
    
    // ============================================
    // 步步高/三步高計算
    // ============================================
    
    // 明牌型：統計所有順子（手牌 + 副露），但需要檢查是否有副露
    // 暗牌型：只統計暗順子（無副露）
    let filteredChows = chows;
    let hasMeld = false;
    
    if (isMing) {
        // 明牌型：使用所有順子
        filteredChows = chows;
        // 檢查是否有副露順子
        hasMeld = chows.some(c => c.isMeld && c.suit === suit);
    } else {
        // 暗牌型：只使用暗順子
        filteredChows = chows.filter(c => c.isMeld !== true);
    }
    
    // 指定花色
    filteredChows = filteredChows.filter(c => c.suit === suit);
    
    // 統計每種起始數字的數量
    const counts = {};
    for (let chow of filteredChows) {
        counts[chow.start] = (counts[chow.start] || 0) + 1;
    }
    
    if (DEBUG) console.log(`countSameSuitCombinations: suit=${suit}, isMing=${isMing}, requiredStarts=${requiredStarts}, counts=`, counts);
    
    // 如果是明牌型但沒有副露，返回 0
    if (isMing && !hasMeld) {
        if (DEBUG) console.log(`明牌型但花色 ${suit} 無副露順子，返回 0`);
        return 0;
    }
    
    // 計算步長
    const step = requiredStarts[1] - requiredStarts[0];
    
    let total = 0;
    
    // 遍歷所有可能的起始數字
    // 步步高 (step=1): n 從 1 到 7
    // 三步高 (step=2): n 從 1 到 5
    const maxN = (step === 1) ? 7 : 5;
    
    for (let n = 1; n <= maxN; n++) {
        // 計算需要的起始數字
        const needed = [];
        for (let i = 0; i < requiredStarts.length; i++) {
            needed.push(n + i * step);
        }
        
        // 檢查是否所有需要的數字都存在
        let valid = true;
        let combinationCount = 1;
        for (let need of needed) {
            const count = counts[need] || 0;
            if (count === 0) {
                valid = false;
                break;
            }
            combinationCount *= count;
        }
        
        if (valid) {
            total += combinationCount;
            if (DEBUG) console.log(`  找到組合: n=${n}, 需要=[${needed}], 組合數=${combinationCount}, 累計=${total}`);
        }
    }
    
    if (DEBUG) console.log(`  總組合數: ${total}`);
    return total;
}

/**
 * 雜龍組合計算（不同花色）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @param {boolean} isMing 是否為明
 * @returns {number} 組合數
 */
function countZaLongCombinations(hand, melds, isMing = false, winType = null, winTile = null, allMelds = []) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    const byStart = { 1: [], 4: [], 7: [] };
    
    for (let chow of chows) {
        if (byStart[chow.start] !== undefined) byStart[chow.start].push(chow); // 存入完整順子物件
    }
    
    if (byStart[1].length === 0 || byStart[4].length === 0 || byStart[7].length === 0) return 0;
    
    let count = 0;
    for (let c1 of byStart[1]) {
        for (let c4 of byStart[4]) {
            if (c4.suit === c1.suit) continue; // 必須不同花色
            for (let c7 of byStart[7]) {
                if (c7.suit === c1.suit || c7.suit === c4.suit) continue;
                
                // 🌟 核心修正：只針對參與這條龍的「這三組順子」判定明暗！
                const comboIsMing = c1.isMeld || c4.isMeld || c7.isMeld;
                if (isMing === comboIsMing) count++;
            }
        }
    }
    return count;
}

/**
 * 步步高/三步高組合計算（同色，連續數字）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @param {string} suit 花色
 * @param {Array} requiredStarts 需要的起始數字，如 [1,2,3] 或 [1,3,5]
 * @param {boolean} isMing 是否為明
 * @returns {number} 組合數
 */
function countStepCombinations(hand, melds, suit, requiredStarts, isMing = false) {
    return countSameSuitCombinations(hand, melds, suit, requiredStarts, isMing);
}

/**
 * 三色步步高組合計算（不同色 123+234+345）
 */
function countSanSeBuBuGaoCombinations(hand, melds, isMing = false) {
    const chows = extractAllChows(hand, melds);
    
    let filteredChows = chows;
    if (isMing) {
        filteredChows = chows.filter(c => c.isMeld === true);
    } else {
        filteredChows = chows.filter(c => c.isMeld !== true);
    }
    
    // 按起始數字分組
    const byStart = {};
    for (let chow of filteredChows) {
        if (!byStart[chow.start]) {
            byStart[chow.start] = [];
        }
        byStart[chow.start].push(chow.suit);
    }
    
    // 找出所有連續的三組 (n, n+1, n+2)
    let totalCombinations = 0;
    const startNumbers = Object.keys(byStart).map(Number).sort((a, b) => a - b);
    
    for (let start of startNumbers) {
        const suits1 = byStart[start] || [];
        const suits2 = byStart[start + 1] || [];
        const suits3 = byStart[start + 2] || [];
        
        if (suits1.length === 0 || suits2.length === 0 || suits3.length === 0) continue;
        
        // 計算不同花色的組合數
        for (let s1 of suits1) {
            for (let s2 of suits2) {
                if (s2 === s1) continue;
                for (let s3 of suits3) {
                    if (s3 === s1 || s3 === s2) continue;
                    totalCombinations++;
                }
            }
        }
    }
    
    return totalCombinations;
}
/**
 * 三色三步高組合計算（不同色 123+345+567）
 */
function countSanSeSanBuGaoCombinations(hand, melds, isMing = false) {
    const chows = extractAllChows(hand, melds);
    
    let filteredChows = chows;
    if (isMing) {
        filteredChows = chows.filter(c => c.isMeld === true);
    } else {
        filteredChows = chows.filter(c => c.isMeld !== true);
    }
    
    // 按起始數字分組
    const byStart = {};
    for (let chow of filteredChows) {
        if (!byStart[chow.start]) {
            byStart[chow.start] = [];
        }
        byStart[chow.start].push(chow.suit);
    }
    
    // 找出所有三步高的三組 (n, n+2, n+4)
    let totalCombinations = 0;
    const startNumbers = Object.keys(byStart).map(Number).sort((a, b) => a - b);
    
    for (let start of startNumbers) {
        const suits1 = byStart[start] || [];
        const suits2 = byStart[start + 2] || [];
        const suits3 = byStart[start + 4] || [];
        
        if (suits1.length === 0 || suits2.length === 0 || suits3.length === 0) continue;
        
        for (let s1 of suits1) {
            for (let s2 of suits2) {
                if (s2 === s1) continue;
                for (let s3 of suits3) {
                    if (s3 === s1 || s3 === s2) continue;
                    totalCombinations++;
                }
            }
        }
    }
    
    return totalCombinations;
}

/**
 * 檢查天梯（全步步高）
 * 條件：眼牌以外的順子可組成三組明/暗三色或一色步步高
 */
function checkTianTi(hand, melds, winType = null, winTile = null, allMelds = []) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    
    // 按花色和起始數字分組
    const bySuitAndStart = { wan: {}, tong: {}, tiao: {} };
    for (let chow of chows) {
        if (!bySuitAndStart[chow.suit][chow.start]) {
            bySuitAndStart[chow.suit][chow.start] = 0;
        }
        bySuitAndStart[chow.suit][chow.start]++;
    }
    
    // 收集所有步步高組合
    let stepUpCombinations = 0;
    
    // 檢查每種花色的步步高（一色步步高）
    for (let suit of ['wan', 'tong', 'tiao']) {
        const starts = Object.keys(bySuitAndStart[suit]).map(Number).sort((a, b) => a - b);
        
        for (let start of starts) {
            const count1 = bySuitAndStart[suit][start] || 0;
            const count2 = bySuitAndStart[suit][start + 1] || 0;
            const count3 = bySuitAndStart[suit][start + 2] || 0;
            
            if (count1 > 0 && count2 > 0 && count3 > 0) {
                // 計算可以組成的組合數
                const combinations = count1 * count2 * count3;
                stepUpCombinations += combinations;
                if (DEBUG) console.log(`一色步步高: ${suit} ${start},${start+1},${start+2} x${combinations}`);
            }
        }
    }
    
    // 檢查三色步步高（不同花色，相同起始數字）
    const byStart = {};
    for (let chow of chows) {
        if (!byStart[chow.start]) {
            byStart[chow.start] = [];
        }
        byStart[chow.start].push(chow.suit);
    }
    
    const startNumbers = Object.keys(byStart).map(Number).sort((a, b) => a - b);
    
    for (let start of startNumbers) {
        const suits1 = byStart[start] || [];
        const suits2 = byStart[start + 1] || [];
        const suits3 = byStart[start + 2] || [];
        
        if (suits1.length === 0 || suits2.length === 0 || suits3.length === 0) continue;
        
        // 計算三色步步高組合數（三種不同花色）
        let combinationCount = 0;
        for (let s1 of suits1) {
            for (let s2 of suits2) {
                if (s2 === s1) continue;
                for (let s3 of suits3) {
                    if (s3 === s1 || s3 === s2) continue;
                    combinationCount++;
                }
            }
        }
        
        if (combinationCount > 0) {
            stepUpCombinations += combinationCount;
            if (DEBUG) console.log(`三色步步高: 起始${start} x${combinationCount}`);
        }
    }
    
    if (DEBUG) console.log(`天梯檢查: 總步步高組合數 = ${stepUpCombinations}`);
    
    // 天梯需要至少3組步步高（無論是一色還是三色）
    return stepUpCombinations >= 3;
}

/**
 * 計算不被三相逢/四相逢/五相逢覆蓋的相逢次數
 * 只計算那些沒有形成完整集合的順子組合（即只有2種花色的）
 */
function countXiangFengExcludingFullSets(hand, melds) {
    const chows = extractAllChows(hand, melds);
    
    // 按順子數字分組
    const chowByNumbers = {};
    for (let chow of chows) {
        const key = `${chow.start},${chow.end}`;
        if (!chowByNumbers[key]) {
            chowByNumbers[key] = new Set();
        }
        chowByNumbers[key].add(chow.suit);
    }
    
    let totalCount = 0;
    for (let [key, suits] of Object.entries(chowByNumbers)) {
        const n = suits.size;
        
        if (n === 2) {
            // 兩種花色：計 1 次相逢
            totalCount += 1;
        }
        // n === 3 時由三相逢處理，不計普通相逢
        // n === 1 時不計
    }
    return totalCount;
}

// ============================================
// 手牌分析函數（找出面子和眼牌）
// ============================================

/**
 * 分析手牌，找出所有面子和眼牌
 * @param {Array} hand 手牌陣列
 * @param {Array} existingMelds 已有的副露（吃碰槓）
 * @returns {Object} { melds: 面子陣列, eyeTile: 眼牌的值 }
 */
function analyzeHandMelds(hand, existingMelds = []) {
    // 防禦性檢查：確保 existingMelds 是陣列
    const safeExistingMelds = Array.isArray(existingMelds) ? existingMelds : [];
    
    // 過濾花牌
    const normalTiles = hand.filter(t => t.type !== 'flower');
    
    // 按花色分組
    const bySuit = { wan: [], tong: [], tiao: [], honor: [] };
    for (let tile of normalTiles) {
        if (tile.type === 'honor') {
            bySuit.honor.push(tile);
        } else {
            bySuit[tile.suit].push(tile);
        }
    }
    
    // 獲取每種花色的所有組合
    const wanCombos = analyzeNumberTiles(bySuit.wan).combinations;
    const tongCombos = analyzeNumberTiles(bySuit.tong).combinations;
    const tiaoCombos = analyzeNumberTiles(bySuit.tiao).combinations;
    const honorCombos = analyzeHonorTiles(bySuit.honor).combinations;
    
    // 收集所有可能的整體組合
    let bestCombination = null;
    let maxMeldsCount = -1;
    
    // 遍歷所有組合可能性
    for (let wan of wanCombos) {
        for (let tong of tongCombos) {
            for (let tiao of tiaoCombos) {
                for (let honor of honorCombos) {
                    const allMelds = [...safeExistingMelds, ...wan.melds, ...tong.melds, ...tiao.melds, ...honor.melds];
                    const eyeTile = wan.eye || tong.eye || tiao.eye || honor.eye;
                    
                    // 總共應該有 5 組面子 + 1 組眼牌
                    if (allMelds.length === 5 && eyeTile) {
                        // 計算這個組合的番數（使用簡單的評分標準）
                        const score = evaluateCombination(allMelds, eyeTile);
                        if (score > maxMeldsCount) {
                            maxMeldsCount = score;
                            bestCombination = { melds: allMelds, eyeTile: eyeTile };
                        }
                    }
                }
            }
        }
    }
    
    // 如果沒有找到完整組合，返回第一個有效的
    if (!bestCombination) {
        // 使用原有的貪婪邏輯作為備用
        const allMelds = [...safeExistingMelds];
        let eyeTile = null;
        
        for (let suit of ['wan', 'tong', 'tiao']) {
            const tiles = bySuit[suit];
            if (tiles.length === 0) continue;
            tiles.sort((a, b) => parseInt(a.value) - parseInt(b.value));
            const result = analyzeNumberTiles(tiles);
            if (result.combinations[0] && result.combinations[0].melds) {
                allMelds.push(...result.combinations[0].melds);
            }
            if (result.combinations[0] && result.combinations[0].eye && !eyeTile) {
                eyeTile = result.combinations[0].eye;
            }
        }
        
        const honorResult = analyzeHonorTiles(bySuit.honor);
        if (honorResult.combinations[0] && honorResult.combinations[0].melds) {
            allMelds.push(...honorResult.combinations[0].melds);
        }
        if (honorResult.combinations[0] && honorResult.combinations[0].eye && !eyeTile) {
            eyeTile = honorResult.combinations[0].eye;
        }
        
        return { melds: allMelds, eyeTile: eyeTile };
    }
    
    return bestCombination;
}

// 簡單的組合評分函數（優先選擇順子多的組合，因為平糊番數較高）
function evaluateCombination(melds, eyeTile) {
    let chowCount = 0;
    let pongCount = 0;
    
    for (let meld of melds) {
        if (meld.type === 'chow') chowCount++;
        if (meld.type === 'pong') pongCount++;
    }
    
    // 順子越多越好（平糊 5番，對對糊 40番，但對對糊需要全部刻子）
    // 這裡簡單返回順子數量作為分數
    return chowCount;
}

// 🌟 具備「廢牌檢測」的數字牌解析器
function analyzeNumberTiles(tiles) {
    if (!tiles || tiles.length === 0) return { combinations: [{ melds: [], eye: null }] };
    
    const numbers = tiles.map(t => parseInt(t.value));
    const counts = {};
    for (let num of numbers) counts[num] = (counts[num] || 0) + 1;
    
    const tileMap = {};
    for (let tile of tiles) {
        const num = parseInt(tile.value);
        if (!tileMap[num]) tileMap[num] = [];
        tileMap[num].push(tile);
    }
    const allCombinations = [];
    
    function tryForm(remainingCounts, currentMelds, currentEye, currentTileMap, remainingTilesCount) {
        let hasTile = false;
        let first = null;
        for (let num = 1; num <= 9; num++) {
            if (remainingCounts[num] > 0) {
                hasTile = true;
                first = num;
                break;
            }
        }
        
        if (!hasTile) {
            // 🌟 核心防護：只有當「所有牌」都被用光時，才是一組完美的胡牌結構！
            if (remainingTilesCount === 0) { 
                allCombinations.push({ melds: [...currentMelds], eye: currentEye });
            }
            return;
        }
        
        if (remainingCounts[first] >= 3) {
            const newCounts = { ...remainingCounts };
            newCounts[first] -= 3;
            const newMelds = [...currentMelds, { type: 'pong', start: first, tiles: currentTileMap[first].slice(0, 3) }];
            const newTileMap = { ...currentTileMap };
            newTileMap[first] = currentTileMap[first].slice(3);
            tryForm(newCounts, newMelds, currentEye, newTileMap, remainingTilesCount - 3);
        }
        
        if (first <= 7 && remainingCounts[first + 1] > 0 && remainingCounts[first + 2] > 0) {
            const newCounts = { ...remainingCounts };
            newCounts[first]--; newCounts[first + 1]--; newCounts[first + 2]--;
            const newMelds = [...currentMelds, { type: 'chow', start: first, tiles: [currentTileMap[first][0], currentTileMap[first + 1][0], currentTileMap[first + 2][0]] }];
            const newTileMap = { ...currentTileMap };
            newTileMap[first] = currentTileMap[first].slice(1);
            newTileMap[first + 1] = currentTileMap[first + 1].slice(1);
            newTileMap[first + 2] = currentTileMap[first + 2].slice(1);
            tryForm(newCounts, newMelds, currentEye, newTileMap, remainingTilesCount - 3);
        }
        
        if (currentEye === null && remainingCounts[first] >= 2) {
            const newCounts = { ...remainingCounts };
            newCounts[first] -= 2;
            const newTileMap = { ...currentTileMap };
            newTileMap[first] = currentTileMap[first].slice(2);
            tryForm(newCounts, currentMelds, currentTileMap[first][0], newTileMap, remainingTilesCount - 2);
        }
    }
    
    tryForm(counts, [], null, tileMap, tiles.length);
    // 🌟 如果沒有成功組合，回傳空陣列讓它失敗，不要回傳假的有效解！
    return { combinations: allCombinations }; 
}

// 🌟 具備「廢牌檢測」的字牌解析器
function analyzeHonorTiles(tiles) {
    if (!tiles || tiles.length === 0) return { combinations: [{ melds: [], eye: null }] };
    
    const groups = {};
    for (let tile of tiles) {
        if (!groups[tile.value]) groups[tile.value] = [];
        groups[tile.value].push(tile);
    }
    const allCombinations = [];
    
    function tryForm(remainingGroups, currentMelds, currentEye, remainingCount) {
        if (Object.keys(remainingGroups).length === 0) {
            // 🌟 核心防護
            if (remainingCount === 0) {
                allCombinations.push({ melds: [...currentMelds], eye: currentEye });
            }
            return;
        }
        
        const firstValue = Object.keys(remainingGroups)[0];
        const tileList = remainingGroups[firstValue];
        const newGroups = { ...remainingGroups };
        delete newGroups[firstValue];
        
        if (tileList.length >= 3) {
            tryForm(newGroups, [...currentMelds, { type: 'pong', start: firstValue, tiles: tileList.slice(0, 3), isHonor: true }], currentEye, remainingCount - 3);
        }
        
        if (currentEye === null && tileList.length >= 2) {
            tryForm(newGroups, currentMelds, tileList[0], remainingCount - 2);
        }
    }
    
    tryForm(groups, [], null, tiles.length);
    return { combinations: allCombinations };
}

function checkHunDaiYaoWithMelds(hand, melds) {
    const { melds: analyzedMelds, eyeTile } = analyzeHandMelds(hand, melds);
    const allMelds = [...analyzedMelds];
    
    // 🌟 新增防護：如果連一組面子都沒有，絕對不是混帶么
    if (allMelds.length === 0) return false; 
    
    for (let meld of allMelds) {
      if (!meld || !meld.tiles || meld.tiles.length === 0) continue;
        let hasOneOrNine = false;
        for (let tile of meld.tiles) {
            if (tile.type === 'number') {
                const num = parseInt(tile.value);
                if (num === 1 || num === 9) {
                    hasOneOrNine = true;
                    break;
                }
            }
        }
        // 字牌面子（如東東東）不需要檢查
        if (!hasOneOrNine && meld.tiles[0].type !== 'honor') {
            if (DEBUG) console.log(`混帶么失敗: 面子 ${meld.type} 不包含1或9`);
            return false;
        }
    }
    
    if (eyeTile && eyeTile.type === 'number') {
        const num = parseInt(eyeTile.value);
        if (num !== 1 && num !== 9) {
            if (DEBUG) console.log(`混帶么失敗: 眼牌 ${eyeTile.value} 不是1或9`);
            return false;
        }
    }
    
    if (DEBUG) console.log('混帶么成立!');
    return true;
}

/**
 * 檢查全帶么（使用分析出的面子和眼牌）
 * 條件：所有面子都包含 1 或 9，且不能有字牌面子
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
function checkQuanDaiYaoWithMelds(hand, melds) {
    const { melds: analyzedMelds, eyeTile } = analyzeHandMelds(hand, melds);
    const allMelds = [...analyzedMelds];
    
    // 🌟 新增防護：如果連一組面子都沒有，絕對不是全帶么
    if (allMelds.length === 0) return false; 
    
    if (DEBUG) console.log('全帶么檢查開始');
    
    for (let meld of allMelds) {
      if (!meld || !meld.tiles || meld.tiles.length === 0) continue;
        // 檢查每個面子是否都包含 1 或 9
        let hasOneOrNine = false;
        for (let tile of meld.tiles) {
            if (tile.type === 'number') {
                const num = parseInt(tile.value);
                if (num === 1 || num === 9) {
                    hasOneOrNine = true;
                    break;
                }
            } else {
                // 全帶么不能有字牌面子
                if (DEBUG) console.log(`全帶么失敗: 面子包含字牌 ${tile.value}`);
                return false;
            }
        }
        if (!hasOneOrNine) {
            if (DEBUG) console.log(`全帶么失敗: 面子不包含1或9`);
            return false;
        }
    }
    
    // 檢查眼牌
    if (eyeTile) {
        if (eyeTile.type !== 'number') {
            if (DEBUG) console.log(`全帶么失敗: 眼牌是字牌`);
            return false;
        }
        const num = parseInt(eyeTile.value);
        if (num !== 1 && num !== 9) {
            if (DEBUG) console.log(`全帶么失敗: 眼牌 ${num} 不是1或9`);
            return false;
        }
    }
    
    if (DEBUG) console.log('全帶么成立!');
    return true;
}

function checkHunLaoTouWithMelds(hand, melds) {
    const allTiles = [...(hand || [])];
    if (melds && Array.isArray(melds)) {
        for (let meld of melds) {
            if (meld && meld.tiles) allTiles.push(...meld.tiles);
        }
    }
    
    for (let tile of allTiles) {
        if (tile.type === 'flower') continue;
        if (tile.type === 'honor') continue;
        if (tile.type === 'number') {
            const num = parseInt(tile.value);
            if (num !== 1 && num !== 9) {
                return false;
            }
        }
    }
    return true;
}

function checkQingLaoTouWithMelds(hand, melds) {
    const allTiles = [...(hand || [])];
    if (melds && Array.isArray(melds)) {
        for (let meld of melds) {
            if (meld && meld.tiles) allTiles.push(...meld.tiles);
        }
    }
    
    for (let tile of allTiles) {
        if (tile.type === 'flower') return false;
        if (tile.type === 'honor') return false;
        if (tile.type === 'number') {
            const num = parseInt(tile.value);
            if (num !== 1 && num !== 9) {
                return false;
            }
        }
    }
    return true;
}

/**
 * 檢查混老頭十三么（十三么 + 數字牌只有1和9，可有字牌）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {boolean}
 */
function checkHunLaoTouShiSanYao(hand, melds) {
  // 先檢查是否為十三么
  if (!checkShiSanYao(hand, melds)) return false;
  
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const normalTiles = allTiles.filter(t => t.type !== 'flower');
  
  for (let tile of normalTiles) {
    if (tile.type === 'number') {
      const num = parseInt(tile.value);
      if (num !== 1 && num !== 9) {
        if (DEBUG) console.log(`混老頭十三么失敗: 出現非1/9數字 ${tile.value}`);
        return false;
      }
    }
  }
  
  if (DEBUG) console.log('混老頭十三么成立!');
  return true;
}


// ============================================
// 暗刻系列檢查函數
// ============================================

/**
 * 計算手牌和副露中的暗刻數量（不包括副露中的明刻/明槓）
 * @param {Array} hand 手牌
 * @param {Array} melds 副露
 * @returns {number} 暗刻數量
 */
/**
 * 🌟 精確計算暗刻（排除出銃牌與明碰）
 */
function countAnKe(hand, melds, winType = null, winTile = null) {
    let anKeCount = 0;
    for (let m of melds) {
        if (m && (m.type === 'anKong' || m.type === 'anGang')) anKeCount++;
    }
    
    const handCounts = {};
    for (let t of hand) {
        if (t.type !== 'flower') {
            const key = `${t.suit}_${t.value}`;
            handCounts[key] = (handCounts[key] || 0) + 1;
        }
    }
    
    for (let [key, c] of Object.entries(handCounts)) {
        if (c >= 3) {
            const [suit, value] = key.split('_');
            // 🌟 出銃判斷：如果這個 3 張的刻子，包含了別人打的那張，就是明刻！不計入暗刻。
            if (winType === 'discard' && winTile && winTile.suit === suit && winTile.value === value) {
                continue; 
            }
            anKeCount++;
        }
    }
    return anKeCount;
}

function checkWuAnKe(hand, melds, winType, winTile) { return countAnKe(hand, melds, winType, winTile) === 5; }
function checkSiAnKe(hand, melds, winType, winTile) { return countAnKe(hand, melds, winType, winTile) === 4; }
function checkSanAnKe(hand, melds, winType, winTile) { return countAnKe(hand, melds, winType, winTile) === 3; }
function checkLiangAnKe(hand, melds, winType, winTile) { return countAnKe(hand, melds, winType, winTile) === 2; }

// ============================================
// 老少碰系列檢查函數
// ============================================

/**
 * 獲取所有刻子（包括手牌和副露）
 * @returns {Array} 刻子陣列 [{ suit, num, isOpen }]
 */
function getAllPongsWithInfo(hand, melds, winType = null, winTile = null, allMelds = []) {
  if (allMelds && allMelds.length > 0) {
    const pongs = [];
    for (let m of allMelds) {
      if (!m || !m.tiles || m.tiles.length === 0) continue;
      if (['pong', 'anKong', 'mingKong', 'kong'].includes(m.type)) {
        const tile = m.tiles[0];
        const num = parseInt(tile.value);
        let isOpenLocal = (m.type === 'mingKong' || m.type === 'kong');
        if (m.type === 'pong' && winType === 'discard' && winTile && winTile.suit === tile.suit && winTile.value === tile.value) {
          isOpenLocal = true;
        }
        pongs.push({ suit: isNaN(num) ? 'honor' : tile.suit, num: isNaN(num) ? tile.value : num, isOpen: isOpenLocal });
      }
    }
    return pongs;
  }
  return [];
}

/**
 * 檢查老少碰（同花色 1 和 9 刻子）
 */
function checkLaoShaoPeng(hand, melds, winType = null, winTile = null, allMelds = []) {
  const pongs = getAllPongsWithInfo(hand, melds, winType, winTile, allMelds);
  
  const bySuit = { wan: { has1: false, has9: false }, tong: { has1: false, has9: false }, tiao: { has1: false, has9: false } };
  
  for (let pong of pongs) {
    if (pong.suit !== 'honor') {
      if (pong.num === 1) bySuit[pong.suit].has1 = true;
      if (pong.num === 9) bySuit[pong.suit].has9 = true;
    }
  }
  
  for (let suit of ['wan', 'tong', 'tiao']) {
    if (bySuit[suit].has1 && bySuit[suit].has9) {
      return true;
    }
  }
  return false;
}

function getXiangFengDetails(hand, melds, winType, winTile, allMelds = []) {
    const chows = extractAllChows(hand, melds, winType, winTile, allMelds);
    
    // 按順子起始數字和完整的順子物件分組
    const chowByNumber = {};
    for (let chow of chows) {
        const key = chow.start;
        if (!chowByNumber[key]) chowByNumber[key] = [];
        chowByNumber[key].push(chow); // 🌟 核心修正：保留完整的 chow 物件，而不只是 suit
    }
    
    let totalTai = 0;
    let details = [];
    let wuMing = 0, wuAn = 0, siMing = 0, siAn = 0, sanMing = 0, sanAn = 0, normalCount = 0;
    
    for (let [startNum, chowList] of Object.entries(chowByNumber)) {
        const suits = chowList.map(c => c.suit);
        const uniqueSuits = new Set(suits).size;
        
        if (uniqueSuits >= 3) {
            // 🌟 核心判定：能不能從三種花色中，各找出一組「暗」順子？
            let canBeAn = false;
            const wans = chowList.filter(c => c.suit === 'wan');
            const tongs = chowList.filter(c => c.suit === 'tong');
            const tiaos = chowList.filter(c => c.suit === 'tiao');

            if (wans.some(c => !c.isMeld) && tongs.some(c => !c.isMeld) && tiaos.some(c => !c.isMeld)) {
                canBeAn = true; // 只要能各挑出一組暗的，就算暗相逢
            }
            
            if (chowList.length >= 5) {
                if (canBeAn) wuAn++; else wuMing++;
            } else if (chowList.length === 4) {
                if (canBeAn) siAn++; else siMing++;
            } else { 
                if (canBeAn) sanAn++; else sanMing++;
            }
        } else if (uniqueSuits === 2) {
            normalCount++;
        }
    }
    
    if (wuAn > 0) { totalTai += wuAn * 200; details.push({ name: `暗五相逢 x${wuAn}`, tai: wuAn * 200 }); }
    if (wuMing > 0) { totalTai += wuMing * 100; details.push({ name: `明五相逢 x${wuMing}`, tai: wuMing * 100 }); }
    if (siAn > 0) { totalTai += siAn * 80; details.push({ name: `暗四相逢 x${siAn}`, tai: siAn * 80 }); }
    if (siMing > 0) { totalTai += siMing * 40; details.push({ name: `明四相逢 x${siMing}`, tai: siMing * 40 }); }
    if (sanAn > 0) { totalTai += sanAn * 20; details.push({ name: `暗三相逢 x${sanAn}`, tai: sanAn * 20 }); }
    if (sanMing > 0) { totalTai += sanMing * 10; details.push({ name: `明三相逢 x${sanMing}`, tai: sanMing * 10 }); }
    
    if (wuAn === 0 && wuMing === 0 && siAn === 0 && siMing === 0 && sanAn === 0 && sanMing === 0) {
        if (normalCount >= 2) { totalTai += 11; details.push({ name: '雙相逢', tai: 11 }); }
        else if (normalCount === 1) { totalTai += 3; details.push({ name: '相逢', tai: 3 }); }
    }
    
    return { totalTai, details };
}

/**
 * 檢查是否有任何步步高牌型
 */
function checkHasBuBuGao(hand, melds) {
    // 檢查一色步步高
    for (let suit of ['wan', 'tong', 'tiao']) {
        const count = countSameSuitStepCombinations(hand, melds, suit, 1);
        if (count > 0) return true;
    }
    
    // 檢查三色步步高
    const sanSeCount = countSanSeBuBuGaoCombinations(hand, melds, false);
    if (sanSeCount > 0) return true;
    
    return false;
}

/**
 * 檢查小四喜（三組風牌刻子 + 一對風牌眼牌）
 * 與大四喜互斥
 */
function checkSmallFourWinds(hand, melds, extraInfo) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const windTiles = ['東', '南', '西', '北'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type === 'honor' && windTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  
  // 檢查是否為大四喜（四組都>=3張）
  let bigFourCount = 0;
  for (let wind of windTiles) {
    if ((counts[wind] || 0) >= 3) {
      bigFourCount++;
    }
  }
  
  // 如果大四喜成立，小四喜不成立（互斥）
  if (bigFourCount === 4) {
    if (DEBUG) console.log('小四喜失敗: 大四喜已成立');
    return false;
  }
  
  let pongCount = 0;
  let pairWind = null;
  
  for (let wind of windTiles) {
    const count = counts[wind] || 0;
    if (count >= 3) {
      pongCount++;
    } else if (count === 2) {
      pairWind = wind;
    }
  }
  
  if (DEBUG) console.log('小四喜檢查:', { counts, pongCount, pairWind });
  return pongCount === 3 && pairWind !== null;
}


function checkBigFourWinds(hand, melds, extraInfo) {
  const allTiles = [...hand];
  const safeMelds = Array.isArray(melds) ? melds : [];
  for (let meld of safeMelds) {
    if (meld && meld.tiles) allTiles.push(...meld.tiles);
  }
  
  const windTiles = ['東', '南', '西', '北'];
  const counts = {};
  for (let tile of allTiles) {
    if (tile.type === 'honor' && windTiles.includes(tile.value)) {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  }
  
  // 大四喜需要四種風牌各至少3張
  let hasAllFour = true;
  for (let wind of windTiles) {
    if ((counts[wind] || 0) < 3) {
      hasAllFour = false;
      break;
    }
  }
  
  if (DEBUG) console.log('大四喜檢查:', { counts, hasAllFour });
  return hasAllFour;
}

// ============================================
// 第四部分：主要計算函數 calculateTai
// ============================================

// server/taiCalculator.js - 修正版 calculateTai 函數

// server/taiCalculator.js - calculateTai 函數完整修正版

function calculateTai(params, customRules = null) {
  let isOnlyWaitAutomated = false; // 🌟 核心修正：宣告移到最頂層，確保全函數 Scope 100% 可見！
  try {
    // 防禦性檢查
    if (!params) params = {};
    
    // 確保 hand 是陣列
    const hand = Array.isArray(params.hand) ? params.hand : [];
    
    // 確保 melds 是陣列
    const melds = Array.isArray(params.melds) ? params.melds : [];
    
    if (DEBUG) console.log('=== 調試信息 ===');
    if (DEBUG) console.log('hand 類型:', typeof hand, '是否陣列:', Array.isArray(hand));
    if (DEBUG) console.log('hand 長度:', hand.length);
    if (DEBUG) console.log('melds 類型:', typeof melds, '是否陣列:', Array.isArray(melds));
    if (DEBUG) console.log('melds 長度:', melds.length);
    
    const winType = params.winType || 'discard';
    const extraInfo = params.extraInfo || {};
    const winTile = extraInfo?.winTile;
    const flowers = extraInfo?.flowers || [];
const flowerCount = flowers.length;

    const waitInfo = params.waitInfo || {};
    
    // 2. 獲取規則
    const rules = customRules || DefaultRules;
    
    // 3. 初始化變量
    let totalTai = 0;
    let taiDetails = [];
    
    // 定義互斥標誌（在頂層定義）
    let hasAnYiSeSanTongShun = false;
    let hasMingYiSeSanTongShun = false;
    let hasBuBuGao = false;  // 步步高標誌
    
    // 4. 分析手牌
    if (DEBUG) console.log('步驟1: 分析手牌...');
    let analyzedMeldsResult;
    try {
      analyzedMeldsResult = analyzeHandMelds(hand, melds);
    } catch (e) {
      if (DEBUG) console.error('analyzeHandMelds 失敗:', e);
      analyzedMeldsResult = { melds: [], eyeTile: null };
    }
    const { melds: analyzedMelds, eyeTile: analyzedEye } = analyzedMeldsResult;
    const eyeTile = extraInfo.eyeTile || analyzedEye;
    const allMelds = extraInfo.meldGroups || analyzedMelds;
    if (DEBUG) console.log('步驟1完成');
    
    // 5. 特殊胡牌標誌
    const isHeavenEarthHumanWin = extraInfo.isHeavenWin || extraInfo.isEarthWin || extraInfo.isHumanWin;

    // 🌟 核心修正：補上天/地/人糊的正式加番計算！
    try {
      if (extraInfo.isHeavenWin && rules.handPatterns?.heavenWin?.enabled) {
        totalTai += rules.handPatterns.heavenWin.tai;
        taiDetails.push({ name: rules.handPatterns.heavenWin.name, tai: rules.handPatterns.heavenWin.tai });
      } else if (extraInfo.isEarthWin && rules.handPatterns?.earthWin?.enabled) {
        totalTai += rules.handPatterns.earthWin.tai;
        taiDetails.push({ name: rules.handPatterns.earthWin.name, tai: rules.handPatterns.earthWin.tai });
      } else if (extraInfo.isHumanWin && rules.handPatterns?.humanWin?.enabled) {
        totalTai += rules.handPatterns.humanWin.tai;
        taiDetails.push({ name: rules.handPatterns.humanWin.name, tai: rules.handPatterns.humanWin.tai });
      }
    } catch (e) {
      console.error('天地人糊計算失敗:', e);
    }
    
    // 6. 特殊牌型標誌
    if (DEBUG) console.log('步驟2: 檢查特殊牌型...');
    let isShiSanYao = false;
    let isHunDaiYaoShiSanYao = false;
    let isHunLaoTouShiSanYao = false;
    let isShiLiuBuDa = false;
    let isShiLiuBuDaShiLiuFei = false;
    let isShiLiuBuDaShe = false;
    let isShiLiuBuDaXiangFeng = false;
    let isLikwuPattern = false;
    let isEightPairsLikwu = false;
    
    try {
      if (rules.handPatterns?.shiSanYao?.enabled) isShiSanYao = checkShiSanYao(hand, melds);
      if (rules.handPatterns?.hunDaiYaoShiSanYao?.enabled) isHunDaiYaoShiSanYao = checkHunDaiYaoShiSanYao(hand, melds);
      if (rules.handPatterns?.hunLaoTouShiSanYao?.enabled) isHunLaoTouShiSanYao = checkHunLaoTouShiSanYao(hand, melds);
      if (rules.handPatterns?.shiLiuBuDa?.enabled) isShiLiuBuDa = checkShiLiuBuDa(hand, melds);
      if (rules.handPatterns?.shiLiuBuDaShiLiuFei?.enabled) isShiLiuBuDaShiLiuFei = checkShiLiuBuDaShiLiuFei(hand, melds);
      if (rules.handPatterns?.shiLiuBuDaShe?.enabled) isShiLiuBuDaShe = checkShiLiuBuDaShe(hand, melds);
      if (rules.handPatterns?.shiLiuBuDaXiangFeng?.enabled) isShiLiuBuDaXiangFeng = checkShiLiuBuDaXiangFeng(hand, melds);
      if (rules.handPatterns?.likwu?.enabled) isLikwuPattern = checkLikwu(hand, melds, winTile);
      if (rules.handPatterns?.eightPairsLikwu?.enabled) isEightPairsLikwu = checkEightPairsLikwu(hand, melds, winTile);
    } catch (e) {
      if (DEBUG) console.error('特殊牌型檢查失敗:', e);
    }
    
    const isSpecialPattern =  isHunDaiYaoShiSanYao || isHunLaoTouShiSanYao || isShiSanYao || 
                             isShiLiuBuDaXiangFeng || isShiLiuBuDaShe || isShiLiuBuDa ||
                             isLikwuPattern || isEightPairsLikwu;
                             let isKaLongHuoChe = false;
    if (DEBUG) console.log('步驟2完成, isSpecialPattern:', isSpecialPattern);
    
    // ============================================
    // 以下為一般牌型計算
    // ============================================
    
    // 1. 花牌計算
    if (DEBUG) console.log('步驟3: 計算花牌...');
    try {
      const flowerVals = flowers.map(f => f.value);
      // 🌟 精準判定
      const hasYiTaiHua = rules.basicPatterns?.yiTaiHua?.enabled && ['梅','蘭','竹','菊'].every(v => flowerVals.includes(v));
      const hasYiTaiCao = rules.basicPatterns?.yiTaiCao?.enabled && ['春','夏','秋','冬'].every(v => flowerVals.includes(v));
      
      let usedFlowerCount = 0;

      if (hasYiTaiHua) {
          totalTai += rules.basicPatterns.yiTaiHua.tai;
          taiDetails.push({ name: rules.basicPatterns.yiTaiHua.name, tai: rules.basicPatterns.yiTaiHua.tai });
          usedFlowerCount += 4;
      }
      if (hasYiTaiCao) {
          totalTai += rules.basicPatterns.yiTaiCao.tai;
          taiDetails.push({ name: rules.basicPatterns.yiTaiCao.name, tai: rules.basicPatterns.yiTaiCao.tai });
          usedFlowerCount += 4;
      }

      // 扣除成套的花牌後，剩下的單張花牌每張計 2 番
      const extraFlowers = flowerCount - usedFlowerCount;
      if (extraFlowers > 0 && rules.basicPatterns?.flowerEach?.enabled) {
          const extraTai = extraFlowers * rules.basicPatterns.flowerEach.tai;
          totalTai += extraTai;
          taiDetails.push({ name: `額外花牌 x${extraFlowers}`, tai: extraTai });
      }
    } catch (e) {
      console.error('花牌計算失敗:', e);
    }
    
    // 2. 字牌刻子
    if (DEBUG) console.log('步驟4: 計算字牌刻子...');
    try {
      if (rules.basicPatterns?.honorEach?.enabled) {
        const allTiles = [...hand];
        for (let meld of melds) if (meld && meld.tiles) allTiles.push(...meld.tiles);
        const honorCounts = {};
        for (let tile of allTiles) {
          if (tile.type === 'honor') {
            honorCounts[tile.value] = (honorCounts[tile.value] || 0) + 1;
          }
        }
        for (let [value, count] of Object.entries(honorCounts)) {
          if (count >= 3) {
            const sets = Math.floor(count / 3);
            const tai = sets * rules.basicPatterns.honorEach.tai;
            totalTai += tai;
            taiDetails.push({ name: `${value}刻子 x${sets}`, tai: tai });
          }
        }
      }
    } catch (e) {
      console.error('字牌刻子計算失敗:', e);
    }
    
    // 3. 十六不搭/十三么系列
if (DEBUG) console.log('步驟5: 十六不搭/十三么系列...');
try {
  // 十六不搭系列（基礎，互斥）
  if (isShiLiuBuDaShiLiuFei) {
    totalTai += rules.handPatterns.shiLiuBuDaShiLiuFei.tai;
    taiDetails.push({ name: rules.handPatterns.shiLiuBuDaShiLiuFei.name, tai: rules.handPatterns.shiLiuBuDaShiLiuFei.tai });
  } else if (isShiLiuBuDa) {
    totalTai += rules.handPatterns.shiLiuBuDa.tai;
    taiDetails.push({ name: rules.handPatterns.shiLiuBuDa.name, tai: rules.handPatterns.shiLiuBuDa.tai });
  }
  
  // 附加牌型（疊加）
  if ((isShiLiuBuDa || isShiLiuBuDaShiLiuFei) && isShiLiuBuDaShe) {
    totalTai += rules.handPatterns.shiLiuBuDaShe.tai;
    taiDetails.push({ name: rules.handPatterns.shiLiuBuDaShe.name, tai: rules.handPatterns.shiLiuBuDaShe.tai });
  }
  
  if ((isShiLiuBuDa || isShiLiuBuDaShiLiuFei) && isShiLiuBuDaXiangFeng) {
    totalTai += rules.handPatterns.shiLiuBuDaXiangFeng.tai;
    taiDetails.push({ name: rules.handPatterns.shiLiuBuDaXiangFeng.name, tai: rules.handPatterns.shiLiuBuDaXiangFeng.tai });
  }
  
  // 十三么系列（互斥，優先級從高到低）
  if (isHunLaoTouShiSanYao) {
    totalTai += rules.handPatterns.hunLaoTouShiSanYao.tai;
    taiDetails.push({ name: rules.handPatterns.hunLaoTouShiSanYao.name, tai: rules.handPatterns.hunLaoTouShiSanYao.tai });
    if (DEBUG) console.log('加計: 混老頭十三么');
  } else if (isHunDaiYaoShiSanYao) {
    totalTai += rules.handPatterns.hunDaiYaoShiSanYao.tai;
    taiDetails.push({ name: rules.handPatterns.hunDaiYaoShiSanYao.name, tai: rules.handPatterns.hunDaiYaoShiSanYao.tai });
    if (DEBUG) console.log('加計: 混帶么十三么');
  } else if (isShiSanYao) {
    totalTai += rules.handPatterns.shiSanYao.tai;
    taiDetails.push({ name: rules.handPatterns.shiSanYao.name, tai: rules.handPatterns.shiSanYao.tai });
    if (DEBUG) console.log('加計: 十三么');
  }
} catch (e) {
  console.error('十六不搭/十三么系列計算失敗:', e);
}
    
// =======================================================
    // 🌟 核心修正：門清、叮牌、門清叮與叮即的終極互斥處理
    // =======================================================
    const isMenqing = isMengqing(melds);
    const isTing = extraInfo?.isTing || extraInfo?.tingType;
    
    // 🌟 修正：只有天叮與地叮被歸類為「不可門清」的超級叮牌
    const isHeavenOrEarth = extraInfo?.tingType && ['heaven', 'earth'].includes(extraInfo.tingType);

    if (isHeavenOrEarth) {
        // 天叮與地叮獨立結算，絕對不疊加門清或門清叮
        let tingTai = extraInfo.tingType === 'heaven' ? rules.handPatterns.heavenTing.tai : rules.handPatterns.earthTing.tai;
        let tingName = extraInfo.tingType === 'heaven' ? rules.handPatterns.heavenTing.name : rules.handPatterns.earthTing.name;
        totalTai += tingTai;
        taiDetails.push({ name: tingName, tai: tingTai });
    } 
    else {
        // 一般叮牌、五子叮、十子叮的處理 (允許疊加門清叮)
        let hasMenqingTing = false;

        // 1. 先判斷是否為門清叮
        if (isTing && isMenqing && rules.handPatterns?.menqingTing?.enabled) {
            totalTai += rules.handPatterns.menqingTing.tai;
            taiDetails.push({ name: rules.handPatterns.menqingTing.name, tai: rules.handPatterns.menqingTing.tai });
            hasMenqingTing = true;
        } 
        else if (isMenqing && !isHeavenEarthHumanWin && !isSpecialPattern && rules.handPatterns?.menqing?.enabled) {
            // 沒有叮牌的純門清，或門清叮沒開啟
            totalTai += rules.handPatterns.menqing.tai;
            taiDetails.push({ name: rules.handPatterns.menqing.name, tai: rules.handPatterns.menqing.tai });
        }

        // 2. 再判斷叮牌本身的名目
        if (isTing) {
            let tingTai = 0;
            let tingName = '';

            if (extraInfo.tingType === 'five') {
                // 五子叮保留自己的高番數
                tingTai = rules.handPatterns.fiveTilesTing.tai; 
                tingName = rules.handPatterns.fiveTilesTing.name;
            } else if (extraInfo.tingType === 'ten') {
                // 十子叮保留自己的高番數
                tingTai = rules.handPatterns.tenTilesTing.tai; 
                tingName = rules.handPatterns.tenTilesTing.name;
            } else {
                // 如果是普通叮，且已經拿過「門清叮」了，就不再重複給「普通叮牌」的番數
                if (!hasMenqingTing) {
                    tingTai = rules.handPatterns?.ting?.tai || 5;
                    tingName = rules.handPatterns?.ting?.name || '叮牌';
                }
            }

            // 如果有番數要加 (五子、十子，或未被門清叮吃掉的普通叮)
            if (tingTai > 0) {
                totalTai += tingTai;
                taiDetails.push({ name: tingName, tai: tingTai });
            }
        }
    }
    // 2. 門清自摸
    if (isMenqing && isSelfDraw(winType) && !isHeavenEarthHumanWin && !isHeavenOrEarth && rules.handPatterns?.menqingSelfDraw?.enabled) {
        totalTai += rules.handPatterns.menqingSelfDraw.tai;
        taiDetails.push({ name: rules.handPatterns.menqingSelfDraw.name, tai: rules.handPatterns.menqingSelfDraw.tai });
    } else if (isSelfDraw(winType) && !isHeavenEarthHumanWin) {
        totalTai += 1;
        taiDetails.push({ name: '自摸', tai: 1 });
    }
    // 3. 叮即 (一發)：因為 server.js 已經修好，這裡就會精準發動了！
    if (extraInfo?.isTingBeforeDraw && rules.handPatterns?.tingBeforeDraw?.enabled) {
        totalTai += rules.handPatterns.tingBeforeDraw.tai;
        taiDetails.push({ name: rules.handPatterns.tingBeforeDraw.name, tai: rules.handPatterns.tingBeforeDraw.tai });
    }

    // 🌟 修正：食叮牌 (必須是胡別人「宣告聽牌的當下」打出的那張牌，這張牌會有 isTingDiscard 標記！)
        if (rules.handPatterns && rules.handPatterns.eatTing && rules.handPatterns.eatTing.enabled) {
            if (winType === 'discard' && extraInfo.winTile && extraInfo.winTile.isTingDiscard) {
                totalTai += rules.handPatterns.eatTing.tai;
                taiDetails.push({ name: '食叮牌', tai: rules.handPatterns.eatTing.tai });
            }
        }
        // 5. 花色系列（優先級：綠一色 > 清一色 > 混一色）
    if (DEBUG) console.log('步驟7: 花色系列...');
try {
  let hasLuyise = false;
  let hasQingyise = false;
  let hasHunyise = false;
  
  if (rules.handPatterns?.luyise?.enabled && checkLuyise(hand, melds)) {
    hasLuyise = true;
    totalTai += rules.handPatterns.luyise.tai;
    taiDetails.push({ name: rules.handPatterns.luyise.name, tai: rules.handPatterns.luyise.tai });
  }
  
  if (!hasLuyise && rules.handPatterns?.qingyise?.enabled && checkQingyise(hand, melds)) {
    hasQingyise = true;
    totalTai += rules.handPatterns.qingyise.tai;
    taiDetails.push({ name: rules.handPatterns.qingyise.name, tai: rules.handPatterns.qingyise.tai });
  }
  
  if (!hasLuyise && !hasQingyise && rules.handPatterns?.hunyise?.enabled && checkHunyise(hand, melds)) {
    hasHunyise = true;
    totalTai += rules.handPatterns.hunyise.tai;
    taiDetails.push({ name: rules.handPatterns.hunyise.name, tai: rules.handPatterns.hunyise.tai });
  }
} catch (e) {
  console.error('花色系列計算失敗:', e);
}
    
        // 6. 對對糊 / 坎坎糊（坎坎糊 > 對對糊，互斥）
    try {
      const isKankanhu = rules.handPatterns?.kankanhu?.enabled && checkKankanhu(hand, melds);
      
      if (isKankanhu) {
        totalTai += rules.handPatterns.kankanhu.tai;
        taiDetails.push({ name: rules.handPatterns.kankanhu.name, tai: rules.handPatterns.kankanhu.tai });
      } else if (rules.handPatterns?.pongpong?.enabled && checkPongpong(hand, melds, allMelds)) {
        totalTai += rules.handPatterns.pongpong.tai;
        taiDetails.push({ name: rules.handPatterns.pongpong.name, tai: rules.handPatterns.pongpong.tai });
      }
    } catch (e) {
      console.error('對對糊/坎坎糊計算失敗:', e);
    }
    
    // 7. 147/258/369碰系列
    try {
      if (!isSpecialPattern) {
        const hasDaYise147 = rules.handPatterns?.daYise147?.enabled && checkDaYise147(hand, melds, allMelds);
    const hasXiaoYise147 = rules.handPatterns?.xiaoYise147?.enabled && checkXiaoYise147(hand, melds, allMelds);
        if (hasDaYise147) {
          totalTai += rules.handPatterns.daYise147.tai;
          taiDetails.push({ name: rules.handPatterns.daYise147.name, tai: rules.handPatterns.daYise147.tai });
        } else if (hasXiaoYise147) {
          totalTai += rules.handPatterns.xiaoYise147.tai;
          taiDetails.push({ name: rules.handPatterns.xiaoYise147.name, tai: rules.handPatterns.xiaoYise147.tai });
        }
        
        // ✅ 修正：把 eyeTile 傳給它
        const daSanSe147Count = checkDaSanSe147(hand, melds, allMelds);
        const xiaoSanSe147Count = checkXiaoSanSe147(hand, melds, allMelds, eyeTile);
        
        if (daSanSe147Count > 0 && rules.handPatterns?.daSanSe147?.enabled) {
          const tai = daSanSe147Count * rules.handPatterns.daSanSe147.tai;
          totalTai += tai;
          taiDetails.push({ name: `${rules.handPatterns.daSanSe147.name} x${daSanSe147Count}`, tai: tai });
        } else if (xiaoSanSe147Count > 0 && rules.handPatterns?.xiaoSanSe147?.enabled) {
          const tai = xiaoSanSe147Count * rules.handPatterns.xiaoSanSe147.tai;
          totalTai += tai;
          taiDetails.push({ name: `${rules.handPatterns.xiaoSanSe147.name} x${xiaoSanSe147Count}`, tai: tai });
        }
      }
    } catch (e) {
      console.error('147/258/369碰系列計算失敗:', e);
    }
    
    // 9. 風牌/箭牌系列
    let hasAllHonors = false;
    try {
  if (rules.windDragonSeries?.smallThreeWinds?.enabled && checkSmallThreeWinds(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.smallThreeWinds.tai;
    taiDetails.push({ name: rules.windDragonSeries.smallThreeWinds.name, tai: rules.windDragonSeries.smallThreeWinds.tai });
  }
  if (rules.windDragonSeries?.bigThreeWinds?.enabled && checkBigThreeWinds(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.bigThreeWinds.tai;
    taiDetails.push({ name: rules.windDragonSeries.bigThreeWinds.name, tai: rules.windDragonSeries.bigThreeWinds.tai });
  }
  if (rules.windDragonSeries?.smallThreeDragons?.enabled && checkSmallThreeDragons(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.smallThreeDragons.tai;
    taiDetails.push({ name: rules.windDragonSeries.smallThreeDragons.name, tai: rules.windDragonSeries.smallThreeDragons.tai });
  }
  if (rules.windDragonSeries?.bigThreeDragons?.enabled && checkBigThreeDragons(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.bigThreeDragons.tai;
    taiDetails.push({ name: rules.windDragonSeries.bigThreeDragons.name, tai: rules.windDragonSeries.bigThreeDragons.tai });
  }
  if (rules.windDragonSeries?.smallFourWinds?.enabled && checkSmallFourWinds(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.smallFourWinds.tai;
    taiDetails.push({ name: rules.windDragonSeries.smallFourWinds.name, tai: rules.windDragonSeries.smallFourWinds.tai });
  }
  if (rules.windDragonSeries?.bigFourWinds?.enabled && checkBigFourWinds(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.bigFourWinds.tai;
    taiDetails.push({ name: rules.windDragonSeries.bigFourWinds.name, tai: rules.windDragonSeries.bigFourWinds.tai });
  }
  if (rules.windDragonSeries?.allHonors?.enabled && checkAllHonors(hand, melds, extraInfo)) {
    totalTai += rules.windDragonSeries.allHonors.tai;
    taiDetails.push({ name: rules.windDragonSeries.allHonors.name, tai: rules.windDragonSeries.allHonors.tai });
   hasAllHonors = true;
  }
} catch (e) {
  console.error('風牌/箭牌系列計算失敗:', e);
}
    
        // 9. 將眼
    try {
      if (rules.handPatterns?.generalEye?.enabled) {
        // 🌟 核心修正：必須強制傳入系統精確算出的 eyeTile，絕對不讓系統盲猜！
        if (checkGeneralEye(hand, melds, { ...extraInfo, eyeTile: eyeTile })) {
          totalTai += rules.handPatterns.generalEye.tai;
          taiDetails.push({ name: rules.handPatterns.generalEye.name, tai: rules.handPatterns.generalEye.tai });
        }
      }
    } catch (e) {
      console.error('將眼計算失敗:', e);
    }
   // ============================================
    // 10. 智能觸發對碰/獨獨/假獨
    // ============================================
    try {
// ✅ 修正：把 allMelds 與 eyeTile 傳進去給它做精準剖析
        const autoWait = checkOnlyWaitAndPairWait(hand, melds, extraInfo.winTile, winType, allMelds, eyeTile);        
        if (rules.handPatterns?.pairWait?.enabled && autoWait.isPairWait) {
            totalTai += rules.handPatterns.pairWait.tai;
            taiDetails.push({ name: rules.handPatterns.pairWait.name, tai: rules.handPatterns.pairWait.tai });
        }
        if (rules.handPatterns?.onlyWait?.enabled && autoWait.isOnlyWait) {
            totalTai += rules.handPatterns.onlyWait.tai;
            taiDetails.push({ name: rules.handPatterns.onlyWait.name, tai: rules.handPatterns.onlyWait.tai });
        }
        // 🌟 補上假獨的番數計算！
        if (rules.handPatterns?.fakeOnlyWait?.enabled && autoWait.isFakeOnlyWait) {
            totalTai += rules.handPatterns.fakeOnlyWait.tai;
            taiDetails.push({ name: rules.handPatterns.fakeOnlyWait.name, tai: rules.handPatterns.fakeOnlyWait.tai });
        }
    } catch (e) {
        console.error('對碰/獨獨/假獨計算失敗:', e);
    }
    
    // 11. 海底撈月等
    try {
      if (rules.handPatterns?.lastTileDraw?.enabled && extraInfo.isLastTileDraw) {
        totalTai += rules.handPatterns.lastTileDraw.tai;
        taiDetails.push({ name: rules.handPatterns.lastTileDraw.name, tai: rules.handPatterns.lastTileDraw.tai });
      }
      if (rules.handPatterns?.lastTileDrawOneTong?.enabled && extraInfo.isLastTileDrawOneTong) {
        totalTai += rules.handPatterns.lastTileDrawOneTong.tai;
        taiDetails.push({ name: rules.handPatterns.lastTileDrawOneTong.name, tai: rules.handPatterns.lastTileDrawOneTong.tai });
      }
      if (rules.handPatterns?.lastTileDiscard?.enabled && extraInfo.isLastTileDiscard) {
        totalTai += rules.handPatterns.lastTileDiscard.tai;
        taiDetails.push({ name: rules.handPatterns.lastTileDiscard.name, tai: rules.handPatterns.lastTileDiscard.tai });
      }
      if (rules.handPatterns?.robKong?.enabled && extraInfo.isRobKong) {
        totalTai += rules.handPatterns.robKong.tai;
        taiDetails.push({ name: rules.handPatterns.robKong.name, tai: rules.handPatterns.robKong.tai });
      }
    } catch (e) {
      console.error('海底撈月等計算失敗:', e);
    }

    // 11.5 子內系列 (依照桌面總出牌數)
    try {
      if (!isHeavenEarthHumanWin && extraInfo.discardCount !== undefined) {
        const dc = extraInfo.discardCount;
        let insideRule = null;
        
        if (dc <= 2) insideRule = rules.handPatterns?.twoTilesInside;
        else if (dc === 3) insideRule = rules.handPatterns?.threeTilesInside;
        else if (dc === 4) insideRule = rules.handPatterns?.fourTilesInside;
        else if (dc === 5) insideRule = rules.handPatterns?.fiveTilesInside;
        else if (dc === 6) insideRule = rules.handPatterns?.sixTilesInside;
        else if (dc === 7) insideRule = rules.handPatterns?.sevenTilesInside;
        else if (dc === 8) insideRule = rules.handPatterns?.eightTilesInside;
        else if (dc === 9) insideRule = rules.handPatterns?.nineTilesInside;
        else if (dc === 10) insideRule = rules.handPatterns?.tenTilesInside;

        if (insideRule?.enabled) {
          totalTai += insideRule.tai;
          taiDetails.push({ name: insideRule.name, tai: insideRule.tai });
        }
      }
    } catch (e) {
      console.error('子內系列計算失敗:', e);
    }
    
    // 12. 般高/同順系列
    try {
      let hasMingSanTongShun = false, hasAnSanTongShun = false, hasMingSiTongShun = false, hasAnSiTongShun = false;
      if (rules.handPatterns?.mingYiSeSanTongShun?.enabled && checkMingYiSeSanTongShun(hand, melds, winType, winTile, allMelds)) hasMingSanTongShun = true;
      if (rules.handPatterns?.anYiSeSanTongShun?.enabled && checkAnYiSeSanTongShun(hand, melds, winType, winTile, allMelds)) hasAnSanTongShun = true;
      if (rules.handPatterns?.mingYiSeSiTongShun?.enabled && checkMingYiSeSiTongShun(hand, melds, winType, winTile, allMelds)) hasMingSiTongShun = true;
      if (rules.handPatterns?.anYiSeSiTongShun?.enabled && checkAnYiSeSiTongShun(hand, melds, winType, winTile, allMelds)) hasAnSiTongShun = true;
      
      let hasMingBanGao = false, hasAnBanGao = false, hasMingShuangBanGao = false, hasAnShuangBanGao = false;
      let hasQuanBanGao = false;
      
      const isLikwuPatternLocal = false; // 略過嚦咕
      if (!isLikwuPatternLocal) {
        if (rules.handPatterns?.mingBanGao?.enabled && checkMingBanGao(hand, melds, winType, winTile, allMelds)) hasMingBanGao = true;
        if (rules.handPatterns?.anBanGao?.enabled && checkAnBanGao(hand, melds, winType, winTile, allMelds)) hasAnBanGao = true;
        if (rules.handPatterns?.shuangBanGao?.enabled && checkMingShuangBanGao(hand, melds, winType, winTile, allMelds)) hasMingShuangBanGao = true;
        if (rules.handPatterns?.anShuangBanGao?.enabled && checkAnShuangBanGao(hand, melds, winType, winTile, allMelds)) hasAnShuangBanGao = true;
      }
      
      if (!isLikwuPatternLocal && rules.handPatterns?.quanBanGao?.enabled && checkQuanBanGao(hand, melds, winType, winTile, allMelds)) {
        hasQuanBanGao = true;
      }
      
      if (hasMingShuangBanGao) {
        totalTai += rules.handPatterns.shuangBanGao.tai;
        taiDetails.push({ name: rules.handPatterns.shuangBanGao.name, tai: rules.handPatterns.shuangBanGao.tai });
      } else if (hasMingBanGao) {
        totalTai += rules.handPatterns.mingBanGao.tai;
        taiDetails.push({ name: rules.handPatterns.mingBanGao.name, tai: rules.handPatterns.mingBanGao.tai });
      }
      
      if (hasAnShuangBanGao) {
        totalTai += rules.handPatterns.anShuangBanGao.tai;
        taiDetails.push({ name: rules.handPatterns.anShuangBanGao.name, tai: rules.handPatterns.anShuangBanGao.tai });
      } else if (hasAnBanGao) {
        totalTai += rules.handPatterns.anBanGao.tai;
        taiDetails.push({ name: rules.handPatterns.anBanGao.name, tai: rules.handPatterns.anBanGao.tai });
      }
      
      if (hasQuanBanGao) {
        totalTai += rules.handPatterns.quanBanGao.tai;
        taiDetails.push({ name: rules.handPatterns.quanBanGao.name, tai: rules.handPatterns.quanBanGao.tai });
      }
      
      if (hasMingSiTongShun) {
        totalTai += rules.handPatterns.mingYiSeSiTongShun.tai;
        taiDetails.push({ name: rules.handPatterns.mingYiSeSiTongShun.name, tai: rules.handPatterns.mingYiSeSiTongShun.tai });
      } else if (hasMingSanTongShun) {
        totalTai += rules.handPatterns.mingYiSeSanTongShun.tai;
        taiDetails.push({ name: rules.handPatterns.mingYiSeSanTongShun.name, tai: rules.handPatterns.mingYiSeSanTongShun.tai });
      }
      
      if (hasAnSiTongShun) {
        totalTai += rules.handPatterns.anYiSeSiTongShun.tai;
        taiDetails.push({ name: rules.handPatterns.anYiSeSiTongShun.name, tai: rules.handPatterns.anYiSeSiTongShun.tai });
      } else if (hasAnSanTongShun) {
        totalTai += rules.handPatterns.anYiSeSanTongShun.tai;
        taiDetails.push({ name: rules.handPatterns.anYiSeSanTongShun.name, tai: rules.handPatterns.anYiSeSanTongShun.tai });
      }
    } catch (e) {
      console.error('般高/同順系列計算失敗:', e);
    }
    
    // 13. 相逢系列
if (DEBUG) console.log('=== 相逢系列開始 ===');
try {
const xiangFengDetails = getXiangFengDetails(hand, melds, winType, extraInfo?.winTile, allMelds);    
    // 🌟 直接把計算好的相逢明細倒進去！
    if (xiangFengDetails.totalTai > 0) {
        totalTai += xiangFengDetails.totalTai;
        taiDetails.push(...xiangFengDetails.details);
    
    if (xiangFengDetails.wuXiangFengCount > 0) {
        taiDetails.push({ name: `暗五相逢 x${xiangFengDetails.wuXiangFengCount}`, tai: xiangFengDetails.wuXiangFengCount * 200 });
    } else if (xiangFengDetails.siXiangFengCount > 0) {
        taiDetails.push({ name: `暗四相逢 x${xiangFengDetails.siXiangFengCount}`, tai: xiangFengDetails.siXiangFengCount * 80 });
    } else if (xiangFengDetails.sanXiangFengCount > 0) {
        taiDetails.push({ name: `暗三相逢 x${xiangFengDetails.sanXiangFengCount}`, tai: xiangFengDetails.sanXiangFengCount * 20 });
    } else if (xiangFengDetails.normalXiangFengCount >= 2) {
        taiDetails.push({ name: '雙相逢', tai: 11 });
    } else if (xiangFengDetails.normalXiangFengCount === 1) {
        taiDetails.push({ name: '相逢', tai: 3 });
    }
}
    
    // 全相逢（獨立）
    if (rules.handPatterns?.quanXiangFeng?.enabled && checkQuanXiangFeng(hand, melds)) {
        totalTai += rules.handPatterns.quanXiangFeng.tai;
        taiDetails.push({ name: rules.handPatterns.quanXiangFeng.name, tai: rules.handPatterns.quanXiangFeng.tai });
        if (DEBUG) console.log('加計全相逢: 20番');
    }
    if (DEBUG) console.log('相逢系列執行完成');
} catch (e) {
    if (DEBUG) console.error('相逢系列計算失敗:', e);
}
    
    // =========================================================================
    // 14. 步步高系列（全新動態窮舉引擎，支援任意起點與出銃自動修正）
    // =========================================================================
    let mingYiSeBuBuGaoCount = 0;
    let anYiSeBuBuGaoCount = 0;
    let mingYiSeSanBuGaoCount = 0;
    let anYiSeSanBuGaoCount = 0;
    let mingSanSeBuBuGaoCount = 0;
    let anSanSeBuBuGaoCount = 0;
    let mingSanSeSanBuGaoCount = 0;
    let anSanSeSanBuGaoCount = 0;
    
    try {
      // 1. 提取全手牌與副露的所有順子
const chows = extractAllChows(hand, melds, winType, extraInfo?.winTile, allMelds) || [];
      // 2. 🌟 出銃補丁：如果是出銃胡，包含出銃牌的那組「手牌順子」強制升級為明面子
      if (winType === 'discard' && extraInfo?.winTile && extraInfo.winTile.type === 'number') {
          const winVal = parseInt(extraInfo.winTile.value);
          const winSuit = extraInfo.winTile.suit;
          for (let chow of chows) {
              if (!chow.isMeld && chow.suit === winSuit && winVal >= chow.start && winVal <= (chow.start + 2)) {
                  chow.isMeld = true; // 出銃面子直接視為副露
                  break; 
              }
          }
      }

      // 3. 🌟 窮舉任意三組順子的組合 (i < j < k 確保不重不漏)
      for (let i = 0; i < chows.length; i++) {
          for (let j = i + 1; j < chows.length; j++) {
              for (let k = j + 1; k < chows.length; k++) {
                  const c1 = chows[i], c2 = chows[j], c3 = chows[k];
                  
                  // 判定此組合是明還是暗（三組裡只要有任意一組是副露/明面子，此組合即為明）
                  const isMingCombo = c1.isMeld || c2.isMeld || c3.isMeld;
                  
                  // 將這三組順子按起始數字從小到大排序，便於檢查連續性
                  const sorted = [c1, c2, c3].sort((a, b) => a.start - b.start);
                  const s1 = sorted[0], s2 = sorted[1], s3 = sorted[2];

                  // ─── 情況 A：一色系列（三組順子花色完全相同） ───
                  if (c1.suit === c2.suit && c2.suit === c3.suit) {
                      // 一色步步高：數字依次遞增 1 (例：567, 678, 789)
                      if (s1.start + 1 === s2.start && s2.start + 1 === s3.start) {
                          if (isMingCombo) mingYiSeBuBuGaoCount++; else anYiSeBuBuGaoCount++;
                      }
                      // 一色三步高：數字依次遞增 2 (例：234, 456, 678)
                      else if (s1.start + 2 === s2.start && s2.start + 2 === s3.start) {
                          if (isMingCombo) mingYiSeSanBuGaoCount++; else anYiSeSanBuGaoCount++;
                      }
                  }
                  // ─── 情況 B：三色系列（三組順子花色互不相同） ───
                  else if (c1.suit !== c2.suit && c2.suit !== c3.suit && c1.suit !== c3.suit) {
                      // 三色步步高：數字依次遞增 1
                      if (s1.start + 1 === s2.start && s2.start + 1 === s3.start) {
                          if (isMingCombo) mingSanSeBuBuGaoCount++; else anSanSeBuBuGaoCount++;
                      }
                      // 三色三步高：數字依次遞增 2
                      else if (s1.start + 2 === s2.start && s2.start + 2 === s3.start) {
                          if (isMingCombo) mingSanSeSanBuGaoCount++; else anSanSeSanBuGaoCount++;
                      }
                  }
              }
          }
      }

      // 4. ─── 結算番數與明細紀錄 ───
      if (rules.handPatterns?.mingYiSeBuBuGao?.enabled && mingYiSeBuBuGaoCount > 0) {
        const tai = mingYiSeBuBuGaoCount * rules.handPatterns.mingYiSeBuBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingYiSeBuBuGao.name} x${mingYiSeBuBuGaoCount}`, tai: tai });
      }
      if (rules.handPatterns?.anYiSeBuBuGao?.enabled && anYiSeBuBuGaoCount > 0 && mingYiSeBuBuGaoCount === 0) {
        const tai = anYiSeBuBuGaoCount * rules.handPatterns.anYiSeBuBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anYiSeBuBuGao.name} x${anYiSeBuBuGaoCount}`, tai: tai });
      }
      
      if (rules.handPatterns?.mingYiSeSanBuGao?.enabled && mingYiSeSanBuGaoCount > 0) {
        const tai = mingYiSeSanBuGaoCount * rules.handPatterns.mingYiSeSanBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingYiSeSanBuGao.name} x${mingYiSeSanBuGaoCount}`, tai: tai });
      }
      if (rules.handPatterns?.anYiSeSanBuGao?.enabled && anYiSeSanBuGaoCount > 0 && mingYiSeSanBuGaoCount === 0) {
        const tai = anYiSeSanBuGaoCount * rules.handPatterns.anYiSeSanBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anYiSeSanBuGao.name} x${anYiSeSanBuGaoCount}`, tai: tai });
      }
      
      if (rules.handPatterns?.mingSanSeBuBuGao?.enabled && mingSanSeBuBuGaoCount > 0) {
        const tai = mingSanSeBuBuGaoCount * rules.handPatterns.mingSanSeBuBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingSanSeBuBuGao.name} x${mingSanSeBuBuGaoCount}`, tai: tai });
      }
      if (rules.handPatterns?.anSanSeBuBuGao?.enabled && anSanSeBuBuGaoCount > 0 && mingSanSeBuBuGaoCount === 0) {
        const tai = anSanSeBuBuGaoCount * rules.handPatterns.anSanSeBuBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anSanSeBuBuGao.name} x${anSanSeBuBuGaoCount}`, tai: tai });
      }
      
      if (rules.handPatterns?.mingSanSeSanBuGao?.enabled && mingSanSeSanBuGaoCount > 0) {
        const tai = mingSanSeSanBuGaoCount * rules.handPatterns.mingSanSeSanBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingSanSeSanBuGao.name} x${mingSanSeSanBuGaoCount}`, tai: tai });
      }
      if (rules.handPatterns?.anSanSeSanBuGao?.enabled && anSanSeSanBuGaoCount > 0 && mingSanSeSanBuGaoCount === 0) {
        const tai = anSanSeSanBuGaoCount * rules.handPatterns.anSanSeSanBuGao.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anSanSeSanBuGao.name} x${anSanSeSanBuGaoCount}`, tai: tai });
      }
    } catch (e) {
      console.error('步步高系列計算失敗:', e);
    }
    
    // 設置 hasBuBuGao 標記
    if (mingYiSeBuBuGaoCount > 0 || anYiSeBuBuGaoCount > 0 ||
        mingYiSeSanBuGaoCount > 0 || anYiSeSanBuGaoCount > 0 ||
        mingSanSeBuBuGaoCount > 0 || anSanSeBuBuGaoCount > 0 ||
        mingSanSeSanBuGaoCount > 0 || anSanSeSanBuGaoCount > 0) {
      hasBuBuGao = true;
      if (DEBUG) console.log('檢測到步步高牌型，hasBuBuGao = true');
    }
    
    // =========================================================================
    // 15. 天梯（全步步高）
    // =========================================================================
    try {
if (!isSpecialPattern && rules.handPatterns?.tianTi?.enabled && checkTianTi(hand, melds, winType, extraInfo?.winTile, allMelds)) {        totalTai += rules.handPatterns.tianTi.tai;
        totalTai += rules.handPatterns.tianTi.tai;
        taiDetails.push({ name: rules.handPatterns.tianTi.name, tai: rules.handPatterns.tianTi.tai });
        if (DEBUG) console.log('加計天梯: 40番');
      }
    } catch (e) {
      console.error('天梯計算失敗:', e);
    }
    
    // 16. 連刻系列（與步步高系列互斥）
    try {
      if (!hasBuBuGao && !hasAnYiSeSanTongShun && !hasMingYiSeSanTongShun) {
        const hasDaYiseSanLianKe = rules.handPatterns?.daYiseSanLianKe?.enabled && checkDaYiseSanLianKe(hand, melds, allMelds);
    // 🌟 加上 eyeTile
    const hasXiaoYiseSanLianKe = rules.handPatterns?.xiaoYiseSanLianKe?.enabled && checkXiaoYiseSanLianKe(hand, melds, allMelds, eyeTile);
    const hasYiseErLianKe = rules.handPatterns?.yiseErLianKe?.enabled && checkYiseErLianKe(hand, melds, allMelds);
        if (hasDaYiseSanLianKe) {
          totalTai += rules.handPatterns.daYiseSanLianKe.tai;
          taiDetails.push({ name: rules.handPatterns.daYiseSanLianKe.name, tai: rules.handPatterns.daYiseSanLianKe.tai });
        } else if (hasXiaoYiseSanLianKe) {
          totalTai += rules.handPatterns.xiaoYiseSanLianKe.tai;
          taiDetails.push({ name: rules.handPatterns.xiaoYiseSanLianKe.name, tai: rules.handPatterns.xiaoYiseSanLianKe.tai });
        } else if (hasYiseErLianKe) {
          totalTai += rules.handPatterns.yiseErLianKe.tai;
          taiDetails.push({ name: rules.handPatterns.yiseErLianKe.name, tai: rules.handPatterns.yiseErLianKe.tai });
        }
      }
    } catch (e) {
      console.error('連刻系列計算失敗:', e);
    }
    
    // 17. 數字組合系列
    try {
      if (!isSpecialPattern) {
        const hasShuangShu = rules.handPatterns?.shuangShu?.enabled && checkShuangShu(hand, melds);
if (hasShuangShu) {
  totalTai += rules.handPatterns.shuangShu.tai;
  taiDetails.push({ name: rules.handPatterns.shuangShu.name, tai: rules.handPatterns.shuangShu.tai });
}
if (!hasShuangShu && rules.handPatterns?.sanShu?.enabled && checkSanShu(hand, melds)) {
  totalTai += rules.handPatterns.sanShu.tai;
  taiDetails.push({ name: rules.handPatterns.sanShu.name, tai: rules.handPatterns.sanShu.tai });
}
        
// ✅ 修正：把 eyeTile 傳給它
        const hasDaSanSe = rules.handPatterns?.daSanSeXiongDiPeng?.enabled && checkDaSanSeXiongDiPeng(hand, melds, allMelds);
        const hasXiaoSanSe = rules.handPatterns?.xiaoSanSeXiongDiPeng?.enabled && checkXiaoSanSeXiongDiPeng(hand, melds, allMelds, eyeTile);
        const hasLiangSe = rules.handPatterns?.liangSeXiongDiPeng?.enabled && checkLiangSeXiongDiPeng(hand, melds, allMelds);
        
        if (hasDaSanSe) {
          totalTai += rules.handPatterns.daSanSeXiongDiPeng.tai;
          taiDetails.push({ name: rules.handPatterns.daSanSeXiongDiPeng.name, tai: rules.handPatterns.daSanSeXiongDiPeng.tai });
        } else if (hasXiaoSanSe) {
          totalTai += rules.handPatterns.xiaoSanSeXiongDiPeng.tai;
          taiDetails.push({ name: rules.handPatterns.xiaoSanSeXiongDiPeng.name, tai: rules.handPatterns.xiaoSanSeXiongDiPeng.tai });
        } else if (hasLiangSe) {
          totalTai += rules.handPatterns.liangSeXiongDiPeng.tai;
          taiDetails.push({ name: rules.handPatterns.liangSeXiongDiPeng.name, tai: rules.handPatterns.liangSeXiongDiPeng.tai });
        }
        
        // 🌟 加上 allMelds 和 eyeTile
    const daSanSeCount = checkDaSanSeSanLianKe(hand, melds, allMelds);
    const xiaoSanSeCount = checkXiaoSanSeSanLianKe(hand, melds, allMelds, eyeTile);
        
        if (daSanSeCount > 0 && rules.handPatterns?.daSanSeSanLianKe?.enabled) {
          const tai = daSanSeCount * rules.handPatterns.daSanSeSanLianKe.tai;
          totalTai += tai;
          taiDetails.push({ name: `${rules.handPatterns.daSanSeSanLianKe.name} x${daSanSeCount}`, tai: tai });
        } else if (xiaoSanSeCount > 0 && rules.handPatterns?.xiaoSanSeSanLianKe?.enabled) {
          const tai = xiaoSanSeCount * rules.handPatterns.xiaoSanSeSanLianKe.tai;
          totalTai += tai;
          taiDetails.push({ name: `${rules.handPatterns.xiaoSanSeSanLianKe.name} x${xiaoSanSeCount}`, tai: tai });
        }
      }
    } catch (e) {
      console.error('數字組合系列計算失敗:', e);
    }
    
    // 18. 嚦咕系列
   try {
      if (rules.handPatterns?.likwu?.enabled && checkLikwu(hand, melds, winTile)) {
        totalTai += rules.handPatterns.likwu.tai;
        taiDetails.push({ name: rules.handPatterns.likwu.name, tai: rules.handPatterns.likwu.tai });
      }
      if (rules.handPatterns?.eightPairsLikwu?.enabled && checkEightPairsLikwu(hand, melds, winTile)) {
        totalTai += rules.handPatterns.eightPairsLikwu.tai;
        taiDetails.push({ name: rules.handPatterns.eightPairsLikwu.name, tai: rules.handPatterns.eightPairsLikwu.tai });
      }
      // ... 其他嚦咕系列
    } catch (e) {
      console.error('嚦咕系列計算失敗:', e);
    }
    
    // 19. 四歸系列
    try {
      if (!isSpecialPattern) {
        const hasAnSiGuiSi = rules.handPatterns?.anSiGuiSi?.enabled && checkAnSiGuiSi(hand, melds, winType, winTile);
        const hasMingSiGuiSi = rules.handPatterns?.mingSiGuiSi?.enabled && checkMingSiGuiSi(hand, melds, winType, winTile);
        const hasAnSiGuiEr = rules.handPatterns?.anSiGuiEr?.enabled && checkAnSiGuiEr(hand, melds, winType, winTile);
        const hasMingSiGuiEr = rules.handPatterns?.mingSiGuiEr?.enabled && checkMingSiGuiEr(hand, melds, winType, winTile);
        const hasAnSiGuiYi = rules.handPatterns?.anSiGuiYi?.enabled && checkAnSiGuiYi(hand, melds, winType, winTile);
        const hasMingSiGuiYi = rules.handPatterns?.mingSiGuiYi?.enabled && checkMingSiGuiYi(hand, melds, winType, winTile);
        
        if (hasAnSiGuiSi) {
          totalTai += rules.handPatterns.anSiGuiSi.tai;
          taiDetails.push({ name: rules.handPatterns.anSiGuiSi.name, tai: rules.handPatterns.anSiGuiSi.tai });
        } else if (hasMingSiGuiSi) {
          totalTai += rules.handPatterns.mingSiGuiSi.tai;
          taiDetails.push({ name: rules.handPatterns.mingSiGuiSi.name, tai: rules.handPatterns.mingSiGuiSi.tai });
        } else if (hasAnSiGuiEr) {
          totalTai += rules.handPatterns.anSiGuiEr.tai;
          taiDetails.push({ name: rules.handPatterns.anSiGuiEr.name, tai: rules.handPatterns.anSiGuiEr.tai });
        } else if (hasMingSiGuiEr) {
          totalTai += rules.handPatterns.mingSiGuiEr.tai;
          taiDetails.push({ name: rules.handPatterns.mingSiGuiEr.name, tai: rules.handPatterns.mingSiGuiEr.tai });
        } else if (hasAnSiGuiYi) {
          totalTai += rules.handPatterns.anSiGuiYi.tai;
          taiDetails.push({ name: rules.handPatterns.anSiGuiYi.name, tai: rules.handPatterns.anSiGuiYi.tai });
        } else if (hasMingSiGuiYi) {
          totalTai += rules.handPatterns.mingSiGuiYi.tai;
          taiDetails.push({ name: rules.handPatterns.mingSiGuiYi.name, tai: rules.handPatterns.mingSiGuiYi.tai });
        }
        
        if (rules.handPatterns?.shuangSiGui?.enabled && checkShuangSiGui(hand, melds)) {
          totalTai += rules.handPatterns.shuangSiGui.tai;
          taiDetails.push({ name: rules.handPatterns.shuangSiGui.name, tai: rules.handPatterns.shuangSiGui.tai });
        }
        if (rules.handPatterns?.anShuangSiGui?.enabled && checkAnShuangSiGui(hand, melds)) {
          totalTai += rules.handPatterns.anShuangSiGui.tai;
          taiDetails.push({ name: rules.handPatterns.anShuangSiGui.name, tai: rules.handPatterns.anShuangSiGui.tai });
        }
      }
    } catch (e) {
      console.error('四歸系列計算失敗:', e);
    }
    
    // 20. 組合類
    try {
      const hasQueYiMen = rules.handPatterns?.queYiMen?.enabled && checkQueYiMen(hand, melds);
      const hasQueWu = rules.handPatterns?.queWu?.enabled && checkQueWu(hand, melds);
      const hasDuanYao = rules.handPatterns?.duanYao?.enabled && checkDuanYao(hand, melds);
      const hasQueSanBao = rules.handPatterns?.queSanBao?.enabled && checkQueSanBao(hand, melds);
      const hasXiaoWuMenQi = rules.handPatterns?.xiaoWuMenQi?.enabled && checkXiaoWuMenQi(hand, melds);
      const hasDaWuMenQi = rules.handPatterns?.daWuMenQi?.enabled && checkDaWuMenQi(hand, melds);
     // 🌟 加上 flowers 參數
      const hasXiaoQiMenQi = rules.handPatterns?.xiaoQiMenQi?.enabled && checkXiaoQiMenQi(hand, melds, flowers);
      const hasDaQiMenQi = rules.handPatterns?.daQiMenQi?.enabled && checkDaQiMenQi(hand, melds, flowers);
      const hasBanQiuRen = rules.handPatterns?.banQiuRen?.enabled && checkBanQiuRen(hand, melds, winType, waitInfo);
      const hasQuanQiuRen = rules.handPatterns?.quanQiuRen?.enabled && checkQuanQiuRen(hand, melds, winType);
      const hasXiaoYuWu = rules.handPatterns?.xiaoYuWu?.enabled && checkXiaoYuWu(hand, melds);
      const hasDaYuWu = rules.handPatterns?.daYuWu?.enabled && checkDaYuWu(hand, melds);
      const hasKaLongHuoChe = rules.handPatterns?.kaLongHuoChe?.enabled && checkKaLongHuoChe(hand, melds);
      
      const hasHunDaiYiZhong = rules.handPatterns?.hunDaiYiZhong?.enabled && checkHunDaiYiZhong(hand, melds);
      const hasHunDaiLiangZhong = rules.handPatterns?.hunDaiLiangZhong?.enabled && checkHunDaiLiangZhong(hand, melds);
      const hasHunDaiSanZhong = rules.handPatterns?.hunDaiSanZhong?.enabled && checkHunDaiSanZhong(hand, melds);
      const hasManTingFang = rules.handPatterns?.manTingFang?.enabled && checkManTingFang(hand, melds);
      
      const hasQingLaoTouByMelds = rules.handPatterns?.qingLaoTou?.enabled && checkQingLaoTouWithMelds(hand, melds);
      const hasHunLaoTouByMelds = rules.handPatterns?.hunLaoTou?.enabled && checkHunLaoTouWithMelds(hand, melds);
      const hasQuanDaiYaoByMelds = rules.handPatterns?.quanDaiYao?.enabled && checkQuanDaiYaoWithMelds(hand, melds);
      const hasHunDaiYaoByMelds = rules.handPatterns?.hunDaiYao?.enabled && checkHunDaiYaoWithMelds(hand, melds);
      
      // 缺一門
      if (hasQueYiMen) {
        totalTai += rules.handPatterns.queYiMen.tai;
        taiDetails.push({ name: rules.handPatterns.queYiMen.name, tai: rules.handPatterns.queYiMen.tai });
      }
      
      // 缺三寶
      if (hasQueSanBao) {
        totalTai += rules.handPatterns.queSanBao.tai;
        taiDetails.push({ name: rules.handPatterns.queSanBao.name, tai: rules.handPatterns.queSanBao.tai });
      }
      
      // 五門齊/七門齊系列
      if (!isSpecialPattern) {
        // 🌟 核心修正：大七門齊和小七門齊是互斥的，先判斷大的！
        if (hasDaQiMenQi) {
          totalTai += rules.handPatterns.daQiMenQi.tai;
          // 確保 push 確實執行！
          taiDetails.push({ name: rules.handPatterns.daQiMenQi.name, tai: rules.handPatterns.daQiMenQi.tai });
        } else if (hasXiaoQiMenQi) {
          totalTai += rules.handPatterns.xiaoQiMenQi.tai;
          taiDetails.push({ name: rules.handPatterns.xiaoQiMenQi.name, tai: rules.handPatterns.xiaoQiMenQi.tai });
        } else if (hasDaWuMenQi) {
          totalTai += rules.handPatterns.daWuMenQi.tai;
          taiDetails.push({ name: rules.handPatterns.daWuMenQi.name, tai: rules.handPatterns.daWuMenQi.tai });
        } else if (hasXiaoWuMenQi) {
          totalTai += rules.handPatterns.xiaoWuMenQi.tai;
          taiDetails.push({ name: rules.handPatterns.xiaoWuMenQi.name, tai: rules.handPatterns.xiaoWuMenQi.tai });
        }
      }
      
      // 半求人/全求人
      if (hasBanQiuRen) {
        totalTai += rules.handPatterns.banQiuRen.tai;
        taiDetails.push({ name: rules.handPatterns.banQiuRen.name, tai: rules.handPatterns.banQiuRen.tai });
      }
      if (hasQuanQiuRen) {
        totalTai += rules.handPatterns.quanQiuRen.tai;
        taiDetails.push({ name: rules.handPatterns.quanQiuRen.name, tai: rules.handPatterns.quanQiuRen.tai });
      }
      
      // 小於五/大於五
      let hasLargeSmallCondition = false;
      if (hasXiaoYuWu) {
        totalTai += rules.handPatterns.xiaoYuWu.tai;
        taiDetails.push({ name: rules.handPatterns.xiaoYuWu.name, tai: rules.handPatterns.xiaoYuWu.tai });
        hasLargeSmallCondition = true;
      }
      if (hasDaYuWu) {
        totalTai += rules.handPatterns.daYuWu.tai;
        taiDetails.push({ name: rules.handPatterns.daYuWu.name, tai: rules.handPatterns.daYuWu.tai });
        hasLargeSmallCondition = true;
      }
      
      // 卡窿火車
    if (hasKaLongHuoChe) {
  totalTai += rules.handPatterns.kaLongHuoChe.tai;
  taiDetails.push({ name: rules.handPatterns.kaLongHuoChe.name, tai: rules.handPatterns.kaLongHuoChe.tai });
  isKaLongHuoChe = true;
}
      // 混帶數字系列
      if (!isSpecialPattern && !hasManTingFang) {
        if (hasHunDaiSanZhong) {
          totalTai += rules.handPatterns.hunDaiSanZhong.tai;
          taiDetails.push({ name: rules.handPatterns.hunDaiSanZhong.name, tai: rules.handPatterns.hunDaiSanZhong.tai });
        } else if (hasHunDaiLiangZhong) {
          totalTai += rules.handPatterns.hunDaiLiangZhong.tai;
          taiDetails.push({ name: rules.handPatterns.hunDaiLiangZhong.name, tai: rules.handPatterns.hunDaiLiangZhong.tai });
        } else if (hasHunDaiYiZhong) {
          totalTai += rules.handPatterns.hunDaiYiZhong.tai;
          taiDetails.push({ name: rules.handPatterns.hunDaiYiZhong.name, tai: rules.handPatterns.hunDaiYiZhong.tai });
        }
      }
      
      // 滿亭芳
      if (hasManTingFang) {
        totalTai += rules.handPatterns.manTingFang.tai;
        taiDetails.push({ name: rules.handPatterns.manTingFang.name, tai: rules.handPatterns.manTingFang.tai });
      }
      
      // 帶么/老頭系列
      let hasYaoCondition = false;
      if (!isSpecialPattern && !hasAllHonors) {
        if (hasQingLaoTouByMelds) {
          totalTai += rules.handPatterns.qingLaoTou.tai;
          taiDetails.push({ name: rules.handPatterns.qingLaoTou.name, tai: rules.handPatterns.qingLaoTou.tai });
          hasYaoCondition = true;
        } else if (hasHunLaoTouByMelds) {
          totalTai += rules.handPatterns.hunLaoTou.tai;
          taiDetails.push({ name: rules.handPatterns.hunLaoTou.name, tai: rules.handPatterns.hunLaoTou.tai });
          hasYaoCondition = true;
        } else if (hasQuanDaiYaoByMelds) {
          totalTai += rules.handPatterns.quanDaiYao.tai;
          taiDetails.push({ name: rules.handPatterns.quanDaiYao.name, tai: rules.handPatterns.quanDaiYao.tai });
          hasYaoCondition = true;
        } else if (hasHunDaiYaoByMelds) {
          totalTai += rules.handPatterns.hunDaiYao.tai;
          taiDetails.push({ name: rules.handPatterns.hunDaiYao.name, tai: rules.handPatterns.hunDaiYao.tai });
          hasYaoCondition = true;
        }
      }
      
      // 斷么
      if (hasDuanYao) {
        totalTai += rules.handPatterns.duanYao.tai;
        taiDetails.push({ name: rules.handPatterns.duanYao.name, tai: rules.handPatterns.duanYao.tai });
      }
      
      // 缺五（只有當沒有小於五、大於五、清老頭、混老頭、全帶么、混帶么時才加計）
      if (!hasLargeSmallCondition && !hasYaoCondition && hasQueWu) {
        totalTai += rules.handPatterns.queWu.tai;
        taiDetails.push({ name: rules.handPatterns.queWu.name, tai: rules.handPatterns.queWu.tai });
      }
    } catch (e) {
      console.error('組合類計算失敗:', e);
    }
    
   // 21. 無花/無字等補充規則
    try {
      const hasNoFlowerNoHonor = (rules.basicPatterns?.noFlowerNoHonor?.enabled && checkNoFlowerNoHonor(hand, melds, flowers));
      // 🌟 核心修正：把 flowers 參數傳進去！
      const hasWuZiHuaDaPingResult = (rules.handPatterns?.wuZiHuaDaPing?.enabled && checkWuZiHuaDaPing(hand, melds, flowers));
      const skipWuHuaWuZi = hasNoFlowerNoHonor || hasWuZiHuaDaPingResult || isKaLongHuoChe;
      
      // 無字花 (10番)
      if (rules.basicPatterns?.noFlowerNoHonor?.enabled && hasNoFlowerNoHonor && !hasWuZiHuaDaPingResult) {
        totalTai += rules.basicPatterns.noFlowerNoHonor.tai;
        taiDetails.push({ name: rules.basicPatterns.noFlowerNoHonor.name, tai: rules.basicPatterns.noFlowerNoHonor.tai });
      }
      if (rules.handPatterns?.pinghu?.enabled && !hasWuZiHuaDaPingResult && checkPinghu(hand, melds)) {
        totalTai += rules.handPatterns.pinghu.tai;
        taiDetails.push({ name: rules.handPatterns.pinghu.name, tai: rules.handPatterns.pinghu.tai });
      }
      if (rules.handPatterns?.wuZiHuaDaPing?.enabled && hasWuZiHuaDaPingResult) {
        totalTai += rules.handPatterns.wuZiHuaDaPing.tai;
        taiDetails.push({ name: rules.handPatterns.wuZiHuaDaPing.name, tai: rules.handPatterns.wuZiHuaDaPing.tai });
      }
      
      // 🌟 關鍵修正：如果已經拿了進階的「無字花」(10番)，就不應該再重複加計基礎的「無花」(2番)！
      if (rules.handPatterns?.wuHua?.enabled && flowers.length === 0 && !hasNoFlowerNoHonor && !hasWuZiHuaDaPingResult) {
        totalTai += rules.handPatterns.wuHua.tai;
        taiDetails.push({ name: rules.handPatterns.wuHua.name, tai: rules.handPatterns.wuHua.tai });
      }
      if (rules.handPatterns?.wuZi?.enabled && !skipWuHuaWuZi && checkWuZi(hand, melds)) {
        totalTai += rules.handPatterns.wuZi.tai;
        taiDetails.push({ name: rules.handPatterns.wuZi.name, tai: rules.handPatterns.wuZi.tai });
      }
    } catch (e) {
      console.error('無花/無字補充規則計算失敗:', e);
    }
    
    // 22. 槓牌台數
    try {
      if (rules.handPatterns?.anGang?.enabled) {
        const anGangCount = checkAnGangForTai(hand, melds);
        if (anGangCount > 0) {
          const tai = anGangCount * rules.handPatterns.anGang.tai;
          totalTai += tai;
          taiDetails.push({ name: `暗槓 x${anGangCount}`, tai: tai });
        }
      }
      if (rules.handPatterns?.mingGang?.enabled) {
        const mingGangCount = checkMingGangForTai(melds);
        if (mingGangCount > 0) {
          const tai = mingGangCount * rules.handPatterns.mingGang.tai;
          totalTai += tai;
          taiDetails.push({ name: `明槓 x${mingGangCount}`, tai: tai });
        }
      }
    } catch (e) {
      console.error('槓牌台數計算失敗:', e);
    }
    
    // 23. 花/槓上花
    try {
      if (rules.handPatterns?.huaGangMo?.enabled && checkHuaGangMo(extraInfo)) {
        totalTai += rules.handPatterns.huaGangMo.tai;
        taiDetails.push({ name: rules.handPatterns.huaGangMo.name, tai: rules.handPatterns.huaGangMo.tai });
      }
      if (rules.handPatterns?.huaGangShangHua2?.enabled && checkHuaGangShangHua(extraInfo, 2)) {
        totalTai += rules.handPatterns.huaGangShangHua2.tai;
        taiDetails.push({ name: rules.handPatterns.huaGangShangHua2.name, tai: rules.handPatterns.huaGangShangHua2.tai });
      }
      if (rules.handPatterns?.huaGangShangHua3?.enabled && checkHuaGangShangHua(extraInfo, 3)) {
        totalTai += rules.handPatterns.huaGangShangHua3.tai;
        taiDetails.push({ name: rules.handPatterns.huaGangShangHua3.name, tai: rules.handPatterns.huaGangShangHua3.tai });
      }
      if (rules.handPatterns?.huaGangShangHua4?.enabled && checkHuaGangShangHua(extraInfo, 4)) {
        totalTai += rules.handPatterns.huaGangShangHua4.tai;
        taiDetails.push({ name: rules.handPatterns.huaGangShangHua4.name, tai: rules.handPatterns.huaGangShangHua4.tai });
      }
    } catch (e) {
      console.error('花/槓上花計算失敗:', e);
    }
    
    // 24. 老少/雜龍系列
try {
    // 清龍系列（同色 123+456+789）
    let mingQingLongCount = 0;
    let anQingLongCount = 0;
    
    // 🌟 修正：同樣用迴圈跑所有花色
    for (let suit of ['wan', 'tong', 'tiao']) {
        mingQingLongCount += countSameSuitCombinations(hand, melds, suit, [1, 4, 7], true, winType, extraInfo?.winTile, allMelds);
        anQingLongCount += countSameSuitCombinations(hand, melds, suit, [1, 4, 7], false, winType, extraInfo?.winTile, allMelds);
    }
    
    if (DEBUG) console.log(`明清龍數量: ${mingQingLongCount}, 暗清龍數量: ${anQingLongCount}`);
    
    if (rules.handPatterns?.mingQingLong?.enabled && mingQingLongCount > 0) {
        const tai = mingQingLongCount * rules.handPatterns.mingQingLong.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingQingLong.name} x${mingQingLongCount}`, tai: tai });
        if (DEBUG) console.log(`加計明清龍: ${tai}番`);
    }
    if (rules.handPatterns?.anQingLong?.enabled && anQingLongCount > 0 && mingQingLongCount === 0) {
        const tai = anQingLongCount * rules.handPatterns.anQingLong.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anQingLong.name} x${anQingLongCount}`, tai: tai });
        if (DEBUG) console.log(`加計暗清龍: ${tai}番`);
    }
    
    // 雜龍系列（不同色 123+456+789）
    const mingZaLongCount = countZaLongCombinations(hand, melds, true, winType, extraInfo?.winTile, allMelds);
    const anZaLongCount = countZaLongCombinations(hand, melds, false, winType, extraInfo?.winTile, allMelds);
    
    if (DEBUG) console.log(`明雜龍數量: ${mingZaLongCount}, 暗雜龍數量: ${anZaLongCount}`);
    
    if (rules.handPatterns?.mingZaLong?.enabled && mingZaLongCount > 0) {
        const tai = mingZaLongCount * rules.handPatterns.mingZaLong.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.mingZaLong.name} x${mingZaLongCount}`, tai: tai });
        if (DEBUG) console.log(`加計明雜龍: ${tai}番`);
    }
    if (rules.handPatterns?.anZaLong?.enabled && anZaLongCount > 0 && mingZaLongCount === 0) {
        const tai = anZaLongCount * rules.handPatterns.anZaLong.tai;
        totalTai += tai;
        taiDetails.push({ name: `${rules.handPatterns.anZaLong.name} x${anZaLongCount}`, tai: tai });
        if (DEBUG) console.log(`加計暗雜龍: ${tai}番`);
    }
} catch (e) {
    console.error('老少/雜龍系列計算失敗:', e);
}
    
// 25. 老少系列（與清龍互斥：暗清龍 > 老少）
try {
    // 先檢查是否已有清龍（清龍成立時不計老少）
// 加上 winType 和 winTile 傳參
const chows = extractAllChows(hand, melds, winType, extraInfo?.winTile, allMelds);   
let hasQingLong = false;
    for (let suit of ['wan', 'tong', 'tiao']) {
        const starts = chows.filter(c => c.suit === suit).map(c => c.start);
        if (starts.includes(1) && starts.includes(4) && starts.includes(7)) {
            hasQingLong = true;
            break;
        }
    }
    
    // 只有當清龍不成立時才計老少
    if (!hasQingLong) {
        const bySuit = { wan: { has123: false, has789: false }, 
                         tong: { has123: false, has789: false }, 
                         tiao: { has123: false, has789: false } };
        
        for (let chow of chows) {
            if (chow.start === 1) bySuit[chow.suit].has123 = true;
            if (chow.start === 7) bySuit[chow.suit].has789 = true;
        }
        
        let laoShaoCount = 0;
        for (let suit of ['wan', 'tong', 'tiao']) {
            if (bySuit[suit].has123 && bySuit[suit].has789) {
                laoShaoCount++;
            }
        }
        
        if (laoShaoCount >= 2) {
            totalTai += rules.handPatterns.shuangLaoShao.tai;
            taiDetails.push({ name: rules.handPatterns.shuangLaoShao.name, tai: rules.handPatterns.shuangLaoShao.tai });
        } else if (laoShaoCount === 1) {
            totalTai += rules.handPatterns.laoShao.tai;
            taiDetails.push({ name: rules.handPatterns.laoShao.name, tai: rules.handPatterns.laoShao.tai });
        }
    }
} catch (e) {
    console.error('老少系列計算失敗:', e);
}
    
  // 26. 暗刻系列（與步步高系列、一色三同順互斥）
    const isKankanhuForAnKe = rules.handPatterns?.kankanhu?.enabled && checkKankanhu(hand, melds, winType, winTile);

    if (!isSpecialPattern && !hasBuBuGao && !hasAnYiSeSanTongShun && !hasMingYiSeSanTongShun && !isKankanhuForAnKe) {
        let concealedPungCount = 0;

        if (allMelds && allMelds.length > 0) {
            for (let m of allMelds) {
                // 🌟 核心修正：檢查這個面子是不是已經碰/槓在地上的
                const isExisting = melds.includes(m);

                if (isExisting) {
                    // 已經在地上的副露，只有「暗槓」才算暗刻！(明槓/補槓都不算)
                    if (m.type === 'anKong' || m.type === 'anGang') {
                        concealedPungCount++;
                    }
                } else {
                    // 來自手牌的隱藏面子
                    const tiles = Array.isArray(m) ? m : (m.tiles || []);
                    if (tiles.length < 3) continue;

                    const isPung = tiles[0].suit === tiles[1].suit && 
                                   tiles[0].value === tiles[1].value && 
                                   tiles[1].value === tiles[2].value;

                    if (isPung) {
                        let isConcealed = true;
                        // 如果是出銃胡牌，且這組手牌刻子包含了別人打的那張牌，這就變成「明刻」了
                        if (winType === 'discard' && extraInfo && extraInfo.winTile) {
                            if (tiles[0].suit === extraInfo.winTile.suit && parseInt(tiles[0].value) === parseInt(extraInfo.winTile.value)) {
                                isConcealed = false; 
                            }
                        }
                        
                        if (isConcealed) {
                            concealedPungCount++;
                        }
                    }
                }
            }
        }

        // 結算暗刻番數 (支援 2~5 暗刻)
        if (rules.handPatterns) {
            if (rules.handPatterns.wuAnKe && rules.handPatterns.wuAnKe.enabled && concealedPungCount === 5) {
                totalTai += rules.handPatterns.wuAnKe.tai;
                taiDetails.push({ name: rules.handPatterns.wuAnKe.name || '五暗刻', tai: rules.handPatterns.wuAnKe.tai });
            } 
            else if (rules.handPatterns.siAnKe && rules.handPatterns.siAnKe.enabled && concealedPungCount === 4) {
                totalTai += rules.handPatterns.siAnKe.tai;
                taiDetails.push({ name: rules.handPatterns.siAnKe.name || '四暗刻', tai: rules.handPatterns.siAnKe.tai });
            } 
            else if (rules.handPatterns.sanAnKe && rules.handPatterns.sanAnKe.enabled && concealedPungCount === 3) {
                totalTai += rules.handPatterns.sanAnKe.tai;
                taiDetails.push({ name: rules.handPatterns.sanAnKe.name || '三暗刻', tai: rules.handPatterns.sanAnKe.tai });
            }
            else if (rules.handPatterns.liangAnKe && rules.handPatterns.liangAnKe.enabled && concealedPungCount === 2) {
                totalTai += rules.handPatterns.liangAnKe.tai;
                taiDetails.push({ name: rules.handPatterns.liangAnKe.name || '兩暗刻', tai: rules.handPatterns.liangAnKe.tai });
            }
        }
    }
    
    // 27. 老少碰系列
    try {
      if (!isSpecialPattern) {
const laoShaoPeng = rules.handPatterns?.laoShaoPeng?.enabled && checkLaoShaoPeng(hand, melds, winType, extraInfo?.winTile, allMelds);        if (laoShaoPeng) {
          totalTai += rules.handPatterns.laoShaoPeng.tai;
          taiDetails.push({ name: rules.handPatterns.laoShaoPeng.name, tai: rules.handPatterns.laoShaoPeng.tai });
        }
      }
    } catch (e) {
      console.error('老少碰系列計算失敗:', e);
    }
    


     // 28. 雞糊/鴨糊（最後處理）
    let finalTai = totalTai;
    let finalDetails = [...taiDetails]; // 複製陣列防止記憶體二次污染
    
    if (rules.handPatterns?.jiHu?.enabled && winType !== 'selfDraw' && totalTai < 4 && totalTai >=0) {
      finalTai = rules.handPatterns.jiHu.tai;
      finalDetails = [{ name: rules.handPatterns.jiHu.name, tai: rules.handPatterns.jiHu.tai }];
    }
    
    if (rules.handPatterns?.yaHu?.enabled && winType === 'selfDraw' && totalTai < 4 && totalTai >=0) {
      finalTai = rules.handPatterns.yaHu.tai;
      finalDetails = [{ name: rules.handPatterns.yaHu.name, tai: rules.handPatterns.yaHu.tai }];
    }
    
    // ============================================
    // 🌟 終極防呆：在結算回傳前，強行補上莊家與連莊台數！
    // ============================================
   // ============================================
    // 🌟 終極防呆：強行補上莊家與連莊台數！
    // ============================================
    if (extraInfo) {
        if (extraInfo.isDealer) {
            // 保留原本的連莊計算邏輯，但只限莊家自己胡牌才有
            const consecutive = extraInfo.dealerConsecutive || 0;
            const tai = 1 + 2 * consecutive; // 莊家 1 番 + 連莊番數
            finalTai += tai;
            finalDetails.push({ name: consecutive > 0 ? `莊家 (連${consecutive})` : '莊家', tai: tai });
        } 
        // 已經將 isDiscarderDealer (擊敗莊家) 的區塊完全刪除
    }
    // 底番
    const baseTai = rules.basic?.baseTai ?? 5;
    
    // 檢查最低起胡
    const minTai = rules.basic?.minTai ?? 1;
    if (finalTai < minTai) {
      return {
        totalTai: finalTai,
        canWin: false,
        details: finalDetails,
        baseTai: baseTai,
        message: `未達最低起胡 ${minTai} 番（目前 ${finalTai} 番）`
      };
    }
    
    if (DEBUG) console.log('=== 計算完成 ===');
    if (DEBUG) console.log('總台數:', finalTai);
    
    // 🌟 唯一且正確的回傳出口！保證帶有 finalScore
    return {
      totalTai: finalTai,
      canWin: true,
      details: finalDetails,
      baseTai: baseTai,
      finalScore: (baseTai + finalTai) 
    };
    
  } catch (error) {
    console.error('=== calculateTai 嚴重錯誤 ===');
    console.error('錯誤訊息:', error.message);
    console.error('錯誤堆疊:', error.stack);
    return {
      totalTai: 0,
      canWin: false,
      details: [],
      baseTai: 5,
      message: `計算錯誤: ${error.message}`
    };
  }
}


/**
 * 計算胡牌總分（含底）
 * @param {Object} params 計算參數
 * @returns {number}
 */
function calculateTotalScore(params) {
  const result = calculateTai(params);
  if (!result.canWin) return 0;
  return result.finalScore;
}

// ============================================
// 賞罰規則計算函數
// ============================================

/**
 * 計算賞罰結果
 * @param {Object} params 參數
 * @param {Array} params.hand 當前玩家的手牌
 * @param {Array} params.melds 副露記錄
 * @param {Array} params.diceValues 骰子點數
 * @param {Array} params.lastDiscards 最近打出的牌記錄（最多4張）
 * @param {boolean} params.isAfterDoubleOrTriple 是否在雙響/三響之後
 * @param {boolean} params.isSelfDraw 是否自摸
 * @returns {Object} { rewards: [], penalties: [] }
 */
function calculateRewardPenalty(params, customRules = null) {
  const {
    hand = [],
    melds = [],
    flowers = [], // 🌟 補上花牌參數
    diceValues = null,
    lastDiscards = [],
    isAfterDoubleOrTriple = false,
    isSelfDraw = false
  } = params;
  
  const rules = customRules || RewardPenaltyRules;
  
  const rewards = [];
  const penalties = [];
  
  // 暗槓（收1底）
  if (rules.anKong?.enabled && checkAnKongReward(hand, melds)) {
    rewards.push({ name: rules.anKong.name, amount: rules.anKong.reward });
  }
  
 // 一枱草（收0.5底）
  if (rules.yiTaiCao?.enabled && checkYiTaiCaoReward(hand, melds, flowers)) { // 🌟 補上 flowers
    rewards.push({ name: rules.yiTaiCao.name, amount: rules.yiTaiCao.reward });
  }
  
  // 一枱花（收1底）
  if (rules.yiTaiHua?.enabled && checkYiTaiHuaReward(hand, melds, flowers)) { // 🌟 補上 flowers
    rewards.push({ name: rules.yiTaiHua.name, amount: rules.yiTaiHua.reward });
  }
  
  // 圍骰（收1底）
  if (rules.weiShai?.enabled && checkWeiShaiReward(diceValues)) {
    rewards.push({ name: rules.weiShai.name, amount: rules.weiShai.reward });
  }
  
  // 123骰（罰1底）
  if (rules.oneTwoThreeShai?.enabled && checkOneTwoThreeShaiPenalty(diceValues)) {
    penalties.push({ name: rules.oneTwoThreeShai.name, amount: rules.oneTwoThreeShai.penalty });
  }
  
  // 三追番子（罰0.5底）
  if (rules.sanZhuiFanZi?.enabled && checkSanZhuiFanZiPenalty(lastDiscards)) {
    penalties.push({ name: rules.sanZhuiFanZi.name, amount: rules.sanZhuiFanZi.penalty });
  }
  
  // 三追非番子（罰1底）
  if (rules.sanZhuiFeiFanZi?.enabled && checkSanZhuiFeiFanZiPenalty(lastDiscards)) {
    penalties.push({ name: rules.sanZhuiFeiFanZi.name, amount: rules.sanZhuiFeiFanZi.penalty });
  }
  
  // 4追番子（罰1底）
  if (rules.fourZhuiFanZi?.enabled && checkFourZhuiFanZiPenalty(lastDiscards)) {
    penalties.push({ name: rules.fourZhuiFanZi.name, amount: rules.fourZhuiFanZi.penalty });
  }
  
  // 4追非番子（罰2底）
  if (rules.fourZhuiFeiFanZi?.enabled && checkFourZhuiFeiFanZiPenalty(lastDiscards)) {
    penalties.push({ name: rules.fourZhuiFeiFanZi.name, amount: rules.fourZhuiFeiFanZi.penalty });
  }
  
  // 出銃雙響/三響後自摸（收2底）
  if (rules.chuChongDoubleTripleThenZiMo?.enabled && 
      checkChuChongDoubleTripleThenZiMoReward(isAfterDoubleOrTriple, isSelfDraw)) {
    rewards.push({ name: rules.chuChongDoubleTripleThenZiMo.name, amount: rules.chuChongDoubleTripleThenZiMo.reward });
  }
  
  return { rewards, penalties };
}



// ============================================
// 第五部分：導出
// ============================================

module.exports = {
  DefaultRules,
  calculateTai,
  calculateTotalScore,
  getTileNumber,
  countFlowers,
  isMengqing,
  isSelfDraw,
  checkGeneralEye,
  checkOnlyWait,
  checkHunyise,
  checkQingyise,
  checkLuyise,
  checkPongpong,
  checkYiseErLianKe,
  checkXiaoYiseSanLianKe,
  checkDaYiseSanLianKe,
  checkXiaoYise147,
  checkDaYise147,
  checkSmallThreeWinds,
  checkBigThreeWinds,
  checkSmallThreeDragons,
  checkBigThreeDragons,
  checkAllHonors,
  checkLikwu,
  checkEightPairsLikwu,
  checkThreeWindsLikwu,
  checkThreeDragonsLikwu,
  checkFourWindsLikwu,
  checkThreeConsecutivePairs,
  checkFourConsecutivePairs,
  checkFiveConsecutivePairs,
  checkSixConsecutivePairs,
  checkSevenConsecutivePairs,
  checkEightConsecutivePairs,
   checkMingSiGuiYi,
  checkAnSiGuiYi,
  checkMingSiGuiEr,
  checkAnSiGuiEr,
  checkMingSiGuiSi,
  checkAnSiGuiSi,
  checkShuangSiGui,
  checkAnShuangSiGui,
  isOpenMeld,
  countPongs,
  countGangs,
  checkKankanhu,
  checkWuGangZi,
  checkPinghu,
  checkQueYiMen,
  checkQueWu,
  checkDuanYao,
  checkBanQiuRen,
  checkQuanQiuRen,
  checkXiaoYuWu,
  checkDaYuWu,
  checkQueSanBao,
  checkXiaoWuMenQi,
  checkDaWuMenQi,
  checkHunDaiYao,
  checkQuanDaiYao,
  checkHunLaoTou,
  checkQingLaoTou,
   checkXiaoQiMenQi,
  checkDaQiMenQi,
  checkBanQiuRen,
  checkQuanQiuRen,
  isJiHu,
  isYaHu,
  checkWuZiHuaDaPing,
  checkKaLongHuoChe,
  checkHunDaiYiZhong,
  checkHunDaiLiangZhong,
  checkHunDaiSanZhong,
  checkManTingFang,
   getTileCategories,
  getNumbersSet,
  getFlowers,
   findAllChowsWithMeldInfo,
  checkMingBanGao,
  checkAnBanGao,
  checkMingShuangBanGao,
  checkAnShuangBanGao,
  checkMingYiSeSanTongShun,
  checkAnYiSeSanTongShun,
  checkMingYiSeSiTongShun,
  checkAnYiSeSiTongShun,
  checkQuanBanGao,
  extractAllChows,
  checkMingYiSeBuBuGao,
  checkAnYiSeBuBuGao,
  checkMingYiSeSanBuGao,
  checkAnYiSeSanBuGao,
  checkMingSanSeBuBuGao,
  checkAnSanSeBuBuGao,
  checkMingSanSeSanBuGao,
  checkAnSanSeSanBuGao,
  checkXiangFeng,
  checkMingSanXiangFeng,
  checkAnSanXiangFeng,
  checkMingSiXiangFeng,
  checkAnSiXiangFeng,
  checkMingWuXiangFeng,
  checkAnWuXiangFeng,
  checkQuanXiangFeng,
  getAllNumbers,
  getUniqueNumbers,
  getAllPongs,
  getAllTriplets,
  checkShuangShu,
  checkSanShu,
  checkLiangSeXiongDiPeng,
  checkXiaoSanSeXiongDiPeng,
  checkDaSanSeXiongDiPeng,
  checkXiaoSanSeSanLianKe,
  checkDaSanSeSanLianKe,
  checkXiaoSanSe147,
  checkDaSanSe147,
  checkShiLiuBuDa,
  checkShiLiuBuDaShiLiuFei,
  checkShiLiuBuDaShe,
  checkShiLiuBuDaXiangFeng,
  checkShiSanYao,
  checkHunDaiYaoShiSanYao,
  RewardPenaltyRules,
  calculateRewardPenalty,
  checkAnKongReward,
  checkYiTaiCaoReward,
  checkYiTaiHuaReward,
  checkWeiShaiReward,
  checkOneTwoThreeShaiPenalty,
  checkSanZhuiFanZiPenalty,
  checkSanZhuiFeiFanZiPenalty,
  checkFourZhuiFanZiPenalty,
  checkFourZhuiFeiFanZiPenalty,
  checkChuChongDoubleTripleThenZiMoReward,
  checkWuHua,
  checkWuZi,
  checkAnGangForTai,
  checkMingGangForTai,
  checkHuaGangMo,
  checkHuaGangShangHua,
   extractAllChowsAdvanced,
  checkDragonPattern,
  checkMingZaLong,
  checkAnZaLong,
  checkMingQingLong,
  checkAnQingLong,
  checkLaoShao,
  checkShuangLaoShao,
  countSameChows,
  countSameChowsWithMeldInfo,
  checkOneSetFlower,
   countAnKe,
  checkLiangAnKe,
  checkSanAnKe,
  checkSiAnKe,
  checkWuAnKe,
  checkLaoShaoPeng,
  getAllPongsWithInfo,
  countSameSuitCombinations,
  countZaLongCombinations,
  checkSmallFourWinds,
  checkBigFourWinds,
  getXiangFengDetails,
  countXiangFengExcludingFullSets,
  checkHunLaoTouShiSanYao,
   checkQuanDaiYaoWithMelds,
   getChowCountWithTile,
   getAllTileCounts,
   checkTianTi
};