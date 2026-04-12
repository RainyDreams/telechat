/**
 * Snowflake ID 生成器
 * 64-bit ID: 1bit(0) + 41bit(timestamp) + 10bit(worker) + 12bit(sequence)
 */
const EPOCH = 1700000000000; // 2023-11-14 起始时间戳

let lastTimestamp = 0;
let sequence = 0;
let workerId = 1;

export function setSnowflakeWorkerId(id) {
  workerId = id & 0x3ff; // 10 bit
}

export function generateSnowflakeId() {
  let now = Date.now();

  if (now < lastTimestamp) {
    // 时钟回拨，等待追上
    const offset = lastTimestamp - now;
    if (offset > 5000) {
      throw new Error(`Clock moved backwards by ${offset}ms`);
    }
    now = lastTimestamp;
  }

  if (now === lastTimestamp) {
    sequence = (sequence + 1) & 0xfff; // 12 bit
    if (sequence === 0) {
      // 同一毫秒内序列号溢出，等待下一毫秒
      while (Date.now() <= now) {
        // busy wait
      }
      now = Date.now();
    }
  } else {
    sequence = 0;
  }

  lastTimestamp = now;

  const ts = BigInt(now - EPOCH);
  const w = BigInt(workerId);
  const s = BigInt(sequence);

  // (ts << 22) | (w << 12) | s
  const id = (ts << 22n) | (w << 12n) | s;
  return id.toString();
}

/**
 * 从 snowflake ID 中提取时间戳
 */
export function extractTimestampFromSnowflake(id) {
  const num = BigInt(id);
  const ts = num >> 22n;
  return Number(ts) + EPOCH;
}

/**
 * 比较两个 snowflake ID 的大小（按时间排序）
 */
export function compareSnowflakeId(a, b) {
  const na = BigInt(a);
  const nb = BigInt(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}
