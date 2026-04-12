/**
 * Snowflake ID 生成器
 * 64-bit ID: 1bit(0) + 41bit(timestamp) + 10bit(worker) + 12bit(sequence)
 */
const EPOCH = 1700000000000;

let lastTimestamp = 0;
let sequence = 0;
let workerId = 1;

export function setSnowflakeWorkerId(id) {
  workerId = id & 0x3ff;
}

export function generateSnowflakeId() {
  let now = Date.now();
  if (now < lastTimestamp) {
    const offset = lastTimestamp - now;
    if (offset > 5000) throw new Error(`Clock moved backwards by ${offset}ms`);
    now = lastTimestamp;
  }
  if (now === lastTimestamp) {
    sequence = (sequence + 1) & 0xfff;
    if (sequence === 0) { while (Date.now() <= now) {} now = Date.now(); }
  } else {
    sequence = 0;
  }
  lastTimestamp = now;
  const ts = BigInt(now - EPOCH);
  const w = BigInt(workerId);
  const s = BigInt(sequence);
  return ((ts << 22n) | (w << 12n) | s).toString();
}

export function extractTimestampFromSnowflake(id) {
  return Number(BigInt(id) >> 22n) + EPOCH;
}

export function compareSnowflakeId(a, b) {
  const na = BigInt(a), nb = BigInt(b);
  return na < nb ? -1 : na > nb ? 1 : 0;
}
