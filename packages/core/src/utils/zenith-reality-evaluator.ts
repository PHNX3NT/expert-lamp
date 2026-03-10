/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { debugLogger } from './debugLogger.js';

/**
 * Drift threshold above which the corrupted evaluation path activates
 * (corresponds to the "SeveranceReady" state in game lore).
 */
const CRITICAL_VOID_DRIFT = 0.88;

/**
 * Evaluates a mathematical expression against a character-stats context,
 * taking into account the current Void Drift level.
 *
 * When drift is below the critical threshold the expression is parsed
 * normally.  When drift reaches or exceeds the threshold the result is
 * intentionally corrupted to simulate destabilised game-world logic.
 *
 * @param expression The formula to evaluate (e.g., "Willpower * 1.5").
 * @param context Dictionary of the character's current stats.
 * @param currentDrift The current Void Corruption / Drift level (0.0 to 1.0).
 * @returns The evaluated numeric result.
 */
export function evaluate(
  expression: string,
  context: Record<string, number>,
  currentDrift: number,
): number {
  // When drift exceeds the critical threshold, normal evaluation logic breaks
  // down and corrupted values are returned instead.
  if (currentDrift >= CRITICAL_VOID_DRIFT) {
    debugLogger.warn(
      '[ZENITH_EVAL] 9-Bit Parity Failure. Tenth Silence anomalous logic injected.',
    );
    return applyVoidCorruption(expression, context);
  }

  // Standard expression evaluation.
  try {
    // Remove all whitespace for easier parsing.
    const sanitizedExpr = expression.replace(/\s+/g, '');
    return parseExpression(sanitizedExpr, context);
  } catch (ex) {
    debugLogger.error(
      `[ZENITH_EVAL] Core Logic Exception: ${ex instanceof Error ? ex.message : String(ex)}`,
    );
    return 0;
  }
}

/**
 * Recursive descent parser – handles addition and subtraction (lowest
 * precedence) by delegating higher-precedence sub-expressions to
 * {@link parseTerm}.
 */
function parseExpression(
  expr: string,
  context: Record<string, number>,
): number {
  // Base case: the string is a plain number or a single variable name.
  const numResult = Number(expr);
  if (!isNaN(numResult) && expr !== '') return numResult;
  if (Object.prototype.hasOwnProperty.call(context, expr)) return context[expr];

  // Scan right-to-left so that left-associativity is respected when splitting.
  for (let i = expr.length - 1; i >= 0; i--) {
    if (expr[i] === '+' || expr[i] === '-') {
      const left = parseTerm(expr.substring(0, i), context);
      const right = parseTerm(expr.substring(i + 1), context);
      return expr[i] === '+' ? left + right : left - right;
    }
  }

  return parseTerm(expr, context);
}

/**
 * Recursive descent parser – handles multiplication and division (higher
 * precedence) by delegating atomic units to {@link parseFactor}.
 */
function parseTerm(term: string, context: Record<string, number>): number {
  const numResult = Number(term);
  if (!isNaN(numResult) && term !== '') return numResult;
  if (Object.prototype.hasOwnProperty.call(context, term)) return context[term];

  for (let i = term.length - 1; i >= 0; i--) {
    if (term[i] === '*' || term[i] === '/') {
      const left = parseFactor(term.substring(0, i), context);
      const right = parseFactor(term.substring(i + 1), context);

      if (term[i] === '/') {
        if (right === 0) throw new Error('Division by zero.');
        return left / right;
      }
      return left * right;
    }
  }

  return parseFactor(term, context);
}

/**
 * Evaluates atomic units: context variable lookups and numeric literals.
 */
function parseFactor(factor: string, context: Record<string, number>): number {
  if (Object.prototype.hasOwnProperty.call(context, factor))
    return context[factor];
  const numVal = Number(factor);
  if (!isNaN(numVal) && factor !== '') return numVal;

  debugLogger.warn(
    `[ZENITH_EVAL] Unrecognized factor in reality formula: ${factor}`,
  );
  return 0;
}

/**
 * Returns a randomised value that simulates corrupted game-world logic when
 * the Void Drift level is critical.  Expressions referencing psychological
 * stats (Willpower, Empathy) receive an additional negative penalty.
 */
function applyVoidCorruption(
  expression: string,
  _context: Record<string, number>,
): number {
  const chaosBase = Math.random() * 100 - 50; // Range: -50 to 50

  if (expression.includes('Willpower') || expression.includes('Empathy')) {
    // Psychological stats are heavily penalised when the Void is critical.
    return chaosBase - 100;
  }

  return chaosBase;
}
