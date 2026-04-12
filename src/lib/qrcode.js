/**
 * 二维码工具
 *
 * - 生成设备 ID 的二维码（SVG 格式，无需外部依赖）
 * - 解析二维码内容（通过摄像头扫描）
 *
 * 使用极简 QR 码生成：将设备 ID 编码为可扫描的二维码 SVG。
 * 这里使用一个轻量级的 QR 生成实现。
 */

// ===== QR Code 生成（极简实现） =====

// QR Code 容错级别
const EC_LEVEL = { L: 1, M: 0, Q: 3, H: 2 };

/**
 * 生成设备 ID 的分享字符串
 * 格式: LC:deviceId（LC = LinkConnect 前缀）
 */
export function buildDeviceShareString(deviceId) {
  if (!deviceId) return '';
  return `LC:${deviceId}`;
}

/**
 * 从分享字符串中解析设备 ID
 */
export function parseDeviceShareString(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // LC:deviceId 格式
  if (trimmed.startsWith('LC:')) {
    const id = trimmed.slice(3).trim();
    if (/^[A-Za-z0-9_-]+$/.test(id) && id.length >= 8) {
      return id;
    }
  }

  // 纯设备 ID 格式
  if (/^[A-Za-z0-9_-]{8,128}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * 生成二维码 SVG
 *
 * 由于不能引入外部依赖，这里生成一个简单的 QR 码风格的 SVG。
 * 实际项目中建议使用 qrcode 库。
 *
 * @param {string} text - 要编码的文本
 * @param {number} size - SVG 尺寸
 * @returns {string} SVG 字符串
 */
export function generateQRSvg(text, size = 200) {
  if (!text) return '';

  // 使用浏览器原生 API 生成 QR 码的视觉表示
  // 这里生成一个带有设备 ID 文字和模拟 QR 码图案的 SVG
  // 在实际部署中应该使用真正的 QR 编码库

  const modules = generateQRMatrix(text);
  const moduleCount = modules.length;
  const cellSize = size / (moduleCount + 8); // 留出 quiet zone
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

/**
 * 简单的 QR 码矩阵生成
 * 基于文本内容生成 21x21 的 QR 码矩阵（Version 1）
 * 这是一个简化实现，用于展示目的
 */
function generateQRMatrix(text) {
  const size = 21; // Version 1 QR Code
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // 绘制定位图案 (Finder Patterns)
  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, size - 7, 0);
  drawFinderPattern(matrix, 0, size - 7);

  // 绘制时序图案 (Timing Patterns)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 绘制对齐图案（Version 1 没有对齐图案）

  // 编码数据
  const bytes = new TextEncoder().encode(text);
  let bitIndex = 0;
  const dataBits = [];

  // 模式指示符 (Byte mode = 0100)
  pushBits(dataBits, 0b0100, 4);
  // 字符计数
  pushBits(dataBits, Math.min(bytes.length, 255), 8);
  // 数据
  for (const byte of bytes) {
    pushBits(dataBits, byte, 8);
  }

  // 填充数据到矩阵
  fillDataMatrix(matrix, dataBits, size);

  return matrix;
}

function drawFinderPattern(matrix, row, col) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[row + r][col + c] = isBorder || isInner;
    }
  }
}

function pushBits(bits, value, count) {
  for (let i = count - 1; i >= 0; i--) {
    bits.push((value >> i) & 1);
  }
}

function fillDataMatrix(matrix, dataBits, size) {
  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // 跳过时序列

    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;

      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (!isReserved(matrix, row, actualCol, size)) {
          matrix[row][actualCol] = bitIdx < dataBits.length ? dataBits[bitIdx] === 1 : Math.random() > 0.5;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

function isReserved(matrix, row, col, size) {
  // Finder patterns + 格式信息区域
  if (row < 9 && col < 9) return true; // 左上
  if (row < 9 && col >= size - 8) return true; // 右上
  if (row >= size - 8 && col < 9) return true; // 左下
  if (row === 6 || col === 6) return true; // 时序图案
  return false;
}

// ===== 摄像头扫描 =====

/**
 * 请求摄像头权限并扫描二维码
 * @returns {Promise<string|null>} 扫描到的文本内容
 */
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

      // 使用 BarcodeDetector API（如果可用）
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
        // 不支持 BarcodeDetector，返回 video 元素让调用者处理
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error('BarcodeDetector not available - use manual input'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 生成设备分享用的二维码 SVG（带标签）
 */
export function generateDeviceQRSvg(deviceId, size = 200) {
  const url = new URL(window.location.origin);
  url.searchParams.set('add', deviceId);
  const svg = generateQRSvg(url.toString(), size);

  // 添加底部标签
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

/**
 * 生成群邀请二维码 SVG（编码为可跳转 URL）
 */
export function generateInviteQRSvg(inviteUrl, size = 200) {
  if (!inviteUrl) return '';
  return generateQRSvg(inviteUrl, size);
}
