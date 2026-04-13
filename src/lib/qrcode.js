/**
 * QR Code 工具
 *
 * - 生成设备 ID 的二维码（SVG 格式，无需外部依赖）
 * - 生成群邀请二维码
 * - 解析二维码内容（通过摄像头扫描）
 *
 * 使用完整的 QR Code 编码实现（支持 Version 1-10）。
 * 基于 QR Code 标准 ISO/IEC 18004。
 */

// ===== QR Code 常量 =====

const EC_LEVEL = { L: 1, M: 0, Q: 3, H: 2 };

// [totalCodewords, ecCodewordsPerBlock, numBlocksInGroup1, numDataCodewordsInGroup1, numBlocksInGroup2, numDataCodewordsInGroup2]
// Indexed by [ecLevel][version-1], ecLevel: M=0, L=1, H=2, Q=3
const ECC_TABLE = {
  M: [
    [16,10,1,16,0,0],[28,16,1,28,0,0],[44,26,1,44,0,0],[64,18,2,32,0,0],[86,24,2,43,0,0],
    [108,16,4,27,0,0],[124,18,4,31,0,0],[154,22,2,38,2,39],[182,22,3,36,2,37],[216,26,4,43,1,44],
  ],
  L: [
    [19,7,1,19,0,0],[34,10,1,34,0,0],[55,15,1,55,0,0],[80,20,1,80,0,0],[108,26,1,108,0,0],
    [136,18,2,68,0,0],[156,20,2,78,0,0],[194,24,2,97,0,0],[232,30,2,116,0,0],[274,18,2,68,2,69],
  ],
  H: [
    [9,10,1,9,0,0],[16,16,1,16,0,0],[26,22,1,26,0,0],[36,28,1,36,0,0],[48,36,1,48,0,0],
    [64,24,2,32,0,0],[72,28,2,36,0,0],[88,30,2,44,0,0],[110,24,2,44,2,45],[130,28,3,40,2,41],
  ],
  Q: [
    [13,13,1,13,0,0],[22,22,1,22,0,0],[36,18,2,18,0,0],[52,26,2,26,0,0],[72,18,2,36,0,0],
    [96,24,4,24,0,0],[108,28,4,27,0,0],[132,22,4,33,0,0],[154,26,4,37,1,38],[180,30,4,40,1,41],
  ],
};

// 最大容量（Byte模式，M级别纠错） by version-1
const MAX_BYTES_M = [14,26,42,62,84,106,122,152,180,213];

// ===== 分享工具 =====

export function buildDeviceShareString(deviceId) {
  if (!deviceId) return '';
  return `LC:${deviceId}`;
}

export function parseDeviceShareString(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // LC:deviceId 格式
  if (trimmed.startsWith('LC:')) {
    const id = trimmed.slice(3).trim();
    if (/^[A-Za-z0-9._-]+$/.test(id) && id.length >= 8) {
      return id;
    }
  }

  // URL 格式 ?add=xxx
  try {
    const url = new URL(trimmed);
    const add = url.searchParams.get('add');
    if (add && /^[A-Za-z0-9._-]{8,128}$/.test(add)) return add;
  } catch { /* not a URL */ }

  // 纯设备 ID 格式
  if (/^[A-Za-z0-9._-]{8,128}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

// ===== QR Code 核心实现 =====

function chooseVersion(byteLength) {
  for (let v = 0; v < MAX_BYTES_M.length; v++) {
    if (byteLength <= MAX_BYTES_M[v]) return v + 1;
  }
  return 10; // 最大 Version 10
}

function getVersionSize(version) {
  return 17 + version * 4;
}

// Galois Field 运算
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfDiv(a, b) {
  if (b === 0) throw new Error('Division by zero');
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] + 255 - GF_LOG[b]) % 255];
}

// 生成纠错码生成多项式
function rsGeneratorPoly(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const newG = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      newG[j] ^= g[j];
      newG[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = newG;
  }
  return g;
}

// 计算 Reed-Solomon 纠错码
function rsCompute(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const coef = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      result[j] ^= gfMul(gen[j + 1], coef);
    }
  }
  return result;
}

// 字符计数指示器位数
function charCountBits(version) {
  if (version <= 9) return 8;
  return 16;
}

// 编码数据为比特流
function encodeData(text) {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  const bits = [];

  // 模式指示符: Byte mode = 0100
  pushBits(bits, 0b0100, 4);
  // 字符计数
  pushBits(bits, bytes.length, charCountBits(version));
  // 数据
  for (const byte of bytes) {
    pushBits(bits, byte, 8);
  }

  return { bits, version };
}

function pushBits(arr, value, count) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push((value >> i) & 1);
  }
}

// 将比特流填充为字节（加终止符和填充字节）
function bitsToBytes(bits, totalDataCodewords) {
  // 添加终止符 (最多4个0)
  for (let i = 0; i < 4 && bits.length < totalDataCodewords * 8; i++) {
    bits.push(0);
  }
  // 对齐到字节边界
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // 填充交替的 0xEC 和 0x11
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0);
    }
    bytes.push(byte);
  }
  while (bytes.length < totalDataCodewords) {
    bytes.push(bytes.length % 2 === 0 ? 0xEC : 0x11);
  }
  return bytes;
}

// 获取纠错参数
function getECCParams(version) {
  // 使用 M 级别纠错（较好的平衡）
  const idx = version - 1;
  const row = ECC_TABLE.M[idx];
  if (!row) return null;
  const [totalCodewords, ecPerBlock, blocksG1, dataG1, blocksG2, dataG2] = row;
  return { totalCodewords, ecPerBlock, blocksG1, dataG1, blocksG2, dataG2 };
}

// 生成纠错码并组合数据
function generateCodewords(text) {
  const { bits, version } = encodeData(text);
  const ecc = getECCParams(version);
  if (!ecc) throw new Error('Version not supported');

  const { totalCodewords, ecPerBlock, blocksG1, dataG1, blocksG2, dataG2 } = ecc;
  const totalDataCodewords = totalCodewords - ecPerBlock * (blocksG1 + blocksG2);

  const dataBytes = bitsToBytes(bits, totalDataCodewords);

  // 分组
  const blocks = [];
  let offset = 0;
  for (let i = 0; i < blocksG1; i++) {
    blocks.push(dataBytes.slice(offset, offset + dataG1));
    offset += dataG1;
  }
  for (let i = 0; i < blocksG2; i++) {
    blocks.push(dataBytes.slice(offset, offset + dataG2));
    offset += dataG2;
  }

  // 计算每块的纠错码
  const ecBlocks = blocks.map(block => rsCompute(new Uint8Array(block), ecPerBlock));

  // 交织数据码字
  const result = [];
  const maxDataLen = Math.max(dataG1, dataG2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  // 交织纠错码字
  for (let i = 0; i < ecPerBlock; i++) {
    for (const ecBlock of ecBlocks) {
      result.push(ecBlock[i]);
    }
  }

  return { codewords: result, version };
}

// ===== 矩阵操作 =====

function createMatrix(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function setModule(matrix, row, col, value) {
  if (row >= 0 && row < matrix.length && col >= 0 && col < matrix[0].length) {
    if (matrix[row][col] === null) {
      matrix[row][col] = value;
    }
  }
}

function isFunctionModule(row, col, size, version) {
  // Finder patterns + 分隔符
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;

  // 时序图案
  if (row === 6 || col === 6) return true;

  // 对齐图案
  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    for (const p1 of positions) {
      for (const p2 of positions) {
        if (Math.abs(row - p1) <= 2 && Math.abs(col - p2) <= 2) {
          // 排除与 finder 重叠的情况
          if ((p1 <= 8 && p2 <= 8) || (p1 <= 8 && p2 >= size - 9) || (p1 >= size - 9 && p2 <= 8)) continue;
          return true;
        }
      }
    }
  }

  // Version 信息区域
  if (version >= 7) {
    if (row < 6 && col >= size - 11) return true;
    if (col < 6 && row >= size - 11) return true;
  }

  return false;
}

function getAlignmentPositions(version) {
  if (version === 1) return [];
  const intervals = Math.floor(version / 7) + 1;
  const size = getVersionSize(version);
  const step = version === 32 ? 26 : Math.ceil((size - 13) / (intervals - 1) / 2) * 2;
  const positions = [6];
  for (let i = 1; i < intervals; i++) {
    positions.push(size - 7 - (intervals - 1 - i) * step);
  }
  return positions;
}

function drawFinderPattern(matrix, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const nr = row + r, nc = col + c;
      if (nr < 0 || nr >= matrix.length || nc < 0 || nc >= matrix[0].length) continue;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[nr][nc] = isBorder || isInner ? 1 : 0;
      } else {
        matrix[nr][nc] = 0;
      }
    }
  }
}

function drawAlignmentPattern(matrix, row, col) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const nr = row + r, nc = col + c;
      if (nr < 0 || nr >= matrix.length || nc < 0 || nc >= matrix[0].length) continue;
      if (matrix[nr][nc] !== null) continue;
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[nr][nc] = isBorder || isCenter ? 1 : 0;
    }
  }
}

function drawTimingPatterns(matrix) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

function drawVersionInfo(matrix, version) {
  if (version < 7) return;
  const size = matrix.length;
  const info = getVersionBits(version);

  for (let i = 0; i < 18; i++) {
    const bit = (info >> i) & 1;
    const row = Math.floor(i / 3);
    const col = i % 3;
    // 右上角
    matrix[row][size - 11 + col] = bit;
    // 左下角
    matrix[size - 11 + col][row] = bit;
  }
}

function getVersionBits(version) {
  // 预计算的版本信息（带 BCH 纠错）
  const VERSION_BITS = [
    0x07C94,0x085BC,0x09A99,0x0A4D3,0x0BBF6,0x0C762,0x0D847,0x0E60D,
    0x0F928,0x10B78,0x1145D,0x12A17,0x13532,0x149A6,0x15683,0x168C9,
    0x177EC,0x18EC4,0x191E1,0x1AFAB,0x1B08E,0x1CC1A,0x1D33F,0x1ED75,
    0x1F250,0x209D5,0x216F0,0x228BA,0x2379F,0x24B0B,0x2542E,0x26A64,
    0x27541,0x28C69,
  ];
  return VERSION_BITS[version - 7] || 0;
}

// 格式信息（纠错级别 + 掩码图案）
function getFormatBits(ecLevel, maskId) {
  const FORMAT_BITS = [
    0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0,
    0x77C4,0x72F3,0x7DAA,0x789D,0x662F,0x6318,0x6C41,0x6976,
    0x1689,0x13BE,0x1CE7,0x19D0,0x0762,0x0255,0x0D0C,0x083B,
    0x355F,0x3068,0x3F31,0x3A06,0x24B4,0x2183,0x2EDA,0x2BED,
  ];
  const ecIdx = { M: 0, L: 1, H: 2, Q: 3 };
  return FORMAT_BITS[(ecIdx[ecLevel] || 0) * 8 + (maskId || 0)];
}

// 填充数据到矩阵
function placeData(matrix, codewords) {
  const size = matrix.length;
  const bits = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;

    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;

      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (matrix[row][actualCol] === null) {
          matrix[row][actualCol] = bitIdx < bits.length ? bits[bitIdx] : 0;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

// 掩码评分（越低越好）
function evaluateMask(matrix) {
  let score = 0;
  const size = matrix.length;

  // 规则1: 连续相同颜色的行/列
  for (let r = 0; r < size; r++) {
    let count = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        count++;
        if (count === 5) score += 3;
        else if (count > 5) score++;
      } else {
        count = 1;
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let count = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        count++;
        if (count === 5) score += 3;
        else if (count > 5) score++;
      } else {
        count = 1;
      }
    }
  }

  // 规则2: 2x2 同色块
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  return score;
}

// 应用掩码
function applyMask(matrix, maskId, size) {
  const masks = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ];

  const maskFn = masks[maskId % 8];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunctionModule(r, c, size, 1) && matrix[r][c] !== null) {
        if (maskFn(r, c)) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }
}

// 设置格式信息
function placeFormatInfo(matrix, ecLevel, maskId) {
  const size = matrix.length;
  const bits = getFormatBits(ecLevel, maskId);

  // 水平放置（左下 finder 旁边）
  for (let i = 0; i < 6; i++) {
    matrix[size - 1 - i][8] = (bits >> i) & 1;
  }
  matrix[size - 7][8] = (bits >> 6) & 1;
  matrix[size - 8][8] = (bits >> 7) & 1;
  for (let i = 8; i < 15; i++) {
    matrix[size - 15 + i][8] = (bits >> i) & 1;
  }

  // 垂直放置（右上 finder 旁边）
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 1 - i] = (bits >> i) & 1;
  }
  matrix[8][size - 8] = (bits >> 8) & 1;
  for (let i = 9; i < 15; i++) {
    matrix[8][size - 15 + i] = (bits >> i) & 1;
  }

  // 固定深色模块
  matrix[size - 8][8] = 1;
}

// 完整的 QR 码矩阵生成
function generateQRMatrix(text) {
  const { codewords, version } = generateCodewords(text);
  const size = getVersionSize(version);
  const matrix = createMatrix(size);

  // 绘制功能图案
  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, 0, size - 7);
  drawFinderPattern(matrix, size - 7, 0);

  // 对齐图案
  const alignPos = getAlignmentPositions(version);
  for (const r of alignPos) {
    for (const c of alignPos) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      drawAlignmentPattern(matrix, r, c);
    }
  }

  // 时序图案
  drawTimingPatterns(matrix);

  // 版本信息
  drawVersionInfo(matrix, version);

  // 选择最佳掩码并放置数据
  let bestMatrix = null;
  let bestScore = Infinity;
  let bestMask = 0;

  for (let mask = 0; mask < 8; mask++) {
    const testMatrix = matrix.map(row => [...row]);
    placeData(testMatrix, codewords);
    applyMask(testMatrix, mask, size);
    placeFormatInfo(testMatrix, 'M', mask);

    // 清除非功能模块以进行评分
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFunctionModule(r, c, size, version)) {
          testMatrix[r][c] = null;
        }
      }
    }

    const score = evaluateMask(testMatrix);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
  }

  // 应用最佳掩码
  bestMatrix = matrix.map(row => [...row]);
  placeData(bestMatrix, codewords);
  applyMask(bestMatrix, bestMask, size);
  placeFormatInfo(bestMatrix, 'M', bestMask);

  return bestMatrix;
}

// ===== SVG 生成 =====

export function generateQRSvg(text, size = 200) {
  if (!text) return '';

  const modules = generateQRMatrix(text);
  const moduleCount = modules.length;
  const cellSize = size / (moduleCount + 8);
  const offset = cellSize * 4;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        const x = offset + col * cellSize;
        const y = offset + row * cellSize;
        svg += `<rect x="${x}" y="${y}" width="${cellSize + 0.5}" height="${cellSize + 0.5}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

// ===== 导出的生成函数 =====

export function generateDeviceQRSvg(deviceId, size = 200) {
  if (!deviceId || deviceId.length < 8) return '';
  
  const shareString = buildDeviceShareString(deviceId);
  const svg = generateQRSvg(shareString, size);

  const labelSize = size * 0.08;
  const labelY = size + labelSize + 4;
  const totalHeight = labelY + 4;

  return svg.replace(
    '</svg>',
    `<text x="${size / 2}" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="${labelSize}" fill="#64748b">${deviceId.slice(0, 12)}…</text></svg>`
  ).replace(
    `viewBox="0 0 ${size} ${size}"`,
    `viewBox="0 0 ${size} ${totalHeight}" height="${totalHeight}"`
  );
}

export function generateInviteQRSvg(inviteUrl, size = 200) {
  if (!inviteUrl) return '';
  return generateQRSvg(inviteUrl, size);
}

// ===== 摄像头扫描 =====

export function startQRScanner() {
  return new Promise(async (resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error('Camera not supported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.play();

      if ('BarcodeDetector' in window) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              stream.getTracks().forEach((t) => t.stop());
              resolve(barcodes[0].rawValue);
              return;
            }
          } catch {
            // no-op
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } else {
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error('BarcodeDetector not available - use manual input'));
      }
    } catch (error) {
      reject(error);
    }
  });
}
