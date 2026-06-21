/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Ambient module declarations for @opentelemetry/sdk-metrics and
 * @opentelemetry/resources.
 *
 * These packages at version 2.0.1 were published to npm without their bundled
 * TypeScript declaration (.d.ts) files, causing TS7016 ("implicitly has 'any'
 * type") errors under `noImplicitAny: true`. This file provides the minimal
 * type surface consumed by the telemetry code until the npm package is fixed.
 *
 * The types here are extracted from the OpenTelemetry JS source at the
 * corresponding tag (v2.0.1). They are intentionally minimal: only the
 * interfaces, enums and functions that our telemetry files actually import.
 */

declare module '@opentelemetry/resources' {
  import type { Attributes } from '@opentelemetry/api';

  /** A Resource identifies the entity producing telemetry as Attributes. */
  export interface Resource {
    readonly attributes: Attributes;
    merge(other: Resource | null): Resource;
  }

  /** Create a Resource from a plain attributes object. */
  export function resourceFromAttributes(attributes: Attributes): Resource;

  /** Default empty resource. */
  export const EMPTY_RESOURCE: Resource;
}

declare module '@opentelemetry/sdk-metrics' {
  import type { HrTime } from '@opentelemetry/api';
  import type { Resource } from '@opentelemetry/resources';

  /** Describes how metrics should be aggregated temporally. */
  export const enum AggregationTemporality {
    DELTA = 0,
    CUMULATIVE = 1,
  }

  /** A data point within a metric. */
  export interface DataPoint<T> {
    attributes: Record<string, unknown>;
    startTime: HrTime;
    endTime: HrTime;
    value: T;
  }

  /** A single scope's worth of metrics. */
  export interface ScopeMetrics {
    scope: { name: string; version?: string; schemaUrl?: string };
    metrics: MetricData[];
  }

  /** All metrics for a resource. */
  export interface ResourceMetrics {
    resource: Resource;
    scopeMetrics: ScopeMetrics[];
  }

  /** Metric data variant (simplified to match what the exporter serialises). */
  export type MetricData = {
    descriptor: { name: string; description: string; unit: string; type: string };
    aggregationTemporality: AggregationTemporality;
    dataPoints: DataPoint<number | bigint>[];
  };

  /** Metric exporter interface for push-based exporters. */
  export interface PushMetricExporter {
    export(
      metrics: ResourceMetrics,
      resultCallback: (result: { code: number; error?: Error }) => void,
    ): void;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
    getPreferredAggregationTemporality(): AggregationTemporality;
  }

  /** Reads metrics from the SDK and exports them on a schedule. */
  export class PeriodicExportingMetricReader {
    constructor(options: {
      exporter: PushMetricExporter;
      exportIntervalMillis?: number;
      exportTimeoutMillis?: number;
    });
  }

  /** Options for metric collection. */
  export interface CollectionOptions {
    timeoutMillis?: number;
  }
}
