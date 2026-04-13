/**
 * QR Code 工具
 * 
 * 使用 CDN 加载的 qrcode 库：https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js
 * 
 * - 生成设备 ID 的二维码（SVG 格式）
 * - 生成群邀请二维码
 * - 解析二维码内容（通过摄像头扫描）
 */

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

// ===== QR 码生成 =====

export async function generateDeviceQRSvg(deviceId, size = 200) {
  if (!deviceId || deviceId.length < 8) return '';
  
  const url = new URL(window.location.origin);
  url.searchParams.set('add', deviceId);
  const text = url.toString();

  if (typeof QRCode !== 'undefined' && QRCode.toString) {
    return await QRCode.toString(text, { 
      type: 'svg',
      width: size, 
      margin: 2,
      errorCorrectionLevel: 'H'
    });
  }
  
  throw new Error('QRCode library not loaded');
}

export async function generateInviteQRSvg(inviteUrl, size = 200) {
  if (!inviteUrl) return '';
  
  if (typeof QRCode !== 'undefined' && QRCode.toString) {
    return await QRCode.toString(inviteUrl, {
      type: 'svg',
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
  }
  
  throw new Error('QRCode library not loaded');
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