/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluate } from './zenith-reality-evaluator.js';
import { debugLogger } from './debugLogger.js';

describe('ZenithRealityEvaluator', () => {
  beforeEach(() => {
    vi.spyOn(debugLogger, 'warn').mockImplementation(() => {});
    vi.spyOn(debugLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('evaluate – standard path (drift < 0.88)', () => {
    it('evaluates a plain number expression', () => {
      expect(evaluate('42', {}, 0)).toBe(42);
    });

    it('resolves a single variable from context', () => {
      expect(evaluate('Willpower', { Willpower: 75 }, 0)).toBe(75);
    });

    it('evaluates addition', () => {
      expect(evaluate('10 + 5', {}, 0)).toBe(15);
    });

    it('evaluates subtraction', () => {
      expect(evaluate('10 - 3', {}, 0)).toBe(7);
    });

    it('evaluates multiplication', () => {
      expect(evaluate('4 * 3', {}, 0)).toBe(12);
    });

    it('evaluates division', () => {
      expect(evaluate('12 / 4', {}, 0)).toBe(3);
    });

    it('evaluates a variable multiplied by a constant', () => {
      expect(evaluate('Willpower * 1.5', { Willpower: 100 }, 0)).toBe(150);
    });

    it('evaluates a compound expression with addition and multiplication', () => {
      // Multiplication is handled in parseTerm() before addition in
      // parseExpression(), so operator precedence is correctly preserved.
      expect(evaluate('2*3+4', {}, 0)).toBe(10);
    });

    it('handles whitespace in expressions', () => {
      expect(evaluate('  10   +   5  ', {}, 0)).toBe(15);
    });

    it('returns 0 and logs a warning for an unrecognised variable', () => {
      evaluate('Unknown', {}, 0);
      expect(debugLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unrecognized factor in reality formula'),
      );
    });

    it('returns 0 and logs an error on division by zero', () => {
      const result = evaluate('10 / 0', {}, 0);
      expect(result).toBe(0);
      expect(debugLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Core Logic Exception'),
      );
    });

    it('treats currentDrift exactly at the boundary (0.879…) as normal', () => {
      const result = evaluate('10', {}, 0.879);
      expect(result).toBe(10);
    });
  });

  describe('evaluate – void corruption path (drift >= 0.88)', () => {
    it('logs the 9-bit parity warning when drift >= 0.88', () => {
      evaluate('Strength', { Strength: 50 }, 0.88);
      expect(debugLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('9-Bit Parity Failure'),
      );
    });

    it('returns a value in the chaos range for non-psychological stats', () => {
      const result = evaluate('Strength', { Strength: 50 }, 1.0);
      // chaosBase ranges from -50 to 50
      expect(result).toBeGreaterThanOrEqual(-50);
      expect(result).toBeLessThanOrEqual(50);
    });

    it('punishes Willpower expressions by subtracting 100 from chaosBase', () => {
      const result = evaluate('Willpower * 2', { Willpower: 50 }, 0.99);
      // chaosBase is in [-50, 50], so result is in [-150, -50]
      expect(result).toBeLessThan(-50);
      expect(result).toBeGreaterThanOrEqual(-150);
    });

    it('punishes Empathy expressions by subtracting 100 from chaosBase', () => {
      const result = evaluate('Empathy + 10', { Empathy: 30 }, 0.9);
      expect(result).toBeLessThan(-50);
      expect(result).toBeGreaterThanOrEqual(-150);
    });

    it('triggers void corruption at exactly 0.88', () => {
      evaluate('10', {}, 0.88);
      expect(debugLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('9-Bit Parity Failure'),
      );
    });
  });
});
