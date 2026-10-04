interface MetricEntry {
  count: number;
  lastUpdated: number;
}

class MetricsRegistry {
  private counters: Map<string, MetricEntry> = new Map();
  private maxKeys = 200; // Bound cardinality to prevent memory leak

  public increment(name: string, value: number = 1) {
    if (this.counters.size >= this.maxKeys && !this.counters.has(name)) {
      return; // Drop unbound new keys to avoid cardinality explosion
    }
    const current = this.counters.get(name) || { count: 0, lastUpdated: Date.now() };
    current.count += value;
    current.lastUpdated = Date.now();
    this.counters.set(name, current);
  }

  public getSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const [key, entry] of this.counters.entries()) {
      snapshot[key] = entry.count;
    }
    return snapshot;
  }
}

export const metrics = new MetricsRegistry();
