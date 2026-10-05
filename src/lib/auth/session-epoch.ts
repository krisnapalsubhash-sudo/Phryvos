let currentSessionEpoch = 0;

export function getSessionEpoch(): number {
  return currentSessionEpoch;
}

export function incrementSessionEpoch(): number {
  currentSessionEpoch++;
  return currentSessionEpoch;
}

export function isStaleRequest(epoch: number): boolean {
  return epoch !== currentSessionEpoch;
}
