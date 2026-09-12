import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private counters: Record<string, number> = {
    httpRequestsTotal: 0,
    httpErrorsTotal: 0,
    aiRequestsTotal: 0,
    aiRequestErrors: 0,
    queueJobsTotal: 0,
    queueJobsFailed: 0,
    assessmentAttemptsTotal: 0,
  };

  private histograms: Record<string, number[]> = {
    httpDurationMs: [],
    dbQueryDurationMs: [],
    aiDurationMs: [],
    assessmentSubmissionDurationMs: [],
  };

  incrementCounter(name: string, labels?: Record<string, string>): void {
    if (this.counters[name] !== undefined) {
      this.counters[name]++;
    } else {
      this.counters[name] = 1;
    }
    
    if (labels) {
      const key = `${name}_${JSON.stringify(labels)}`;
      this.counters[key] = (this.counters[key] || 0) + 1;
    }
  }

  recordDuration(histogram: string, durationMs: number): void {
    if (!this.histograms[histogram]) {
      this.histograms[histogram] = [];
    }
    this.histograms[histogram].push(durationMs);
    
    if (this.histograms[histogram].length > 1000) {
      this.histograms[histogram].shift(); // Keep recent 1000 items
    }
  }

  private calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
    if (!values || values.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getMetrics(): object {
    const histogramMetrics: Record<string, any> = {};
    for (const [key, values] of Object.entries(this.histograms)) {
      histogramMetrics[key] = this.calculatePercentiles(values);
    }
    return {
      counters: this.counters,
      histograms: histogramMetrics,
    };
  }

  recordAiUsage(params: {
    provider: string;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    success: boolean;
    estimatedCostUsd: number;
  }): void {
    const labels = { provider: params.provider, model: params.model };
    
    this.incrementCounter('aiRequestsTotal', labels);
    if (!params.success) {
      this.incrementCounter('aiRequestErrors', labels);
    }
    this.recordDuration('aiDurationMs', params.latencyMs);

    // Track detailed counters directly
    const baseKey = `_${JSON.stringify(labels)}`;
    
    this.counters[`aiInputTokens${baseKey}`] = (this.counters[`aiInputTokens${baseKey}`] || 0) + params.inputTokens;
    this.counters[`aiOutputTokens${baseKey}`] = (this.counters[`aiOutputTokens${baseKey}`] || 0) + params.outputTokens;
    this.counters[`aiCostUsd${baseKey}`] = (this.counters[`aiCostUsd${baseKey}`] || 0) + params.estimatedCostUsd;
  }
}
