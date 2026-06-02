#!/usr/bin/env node

/**
 * Shared configuration for Typst resume/cover letter generation
 */

import { resolve } from 'path';
import os from 'os';

export const getConfig = () => ({
  TYPST_BIN: resolve(os.homedir(), '.typst/bin/typst'),
  TYPST_TEMPLATE_DIR: resolve(process.cwd(), 'templates'),
  FONT_PATH: resolve(process.cwd(), 'lib/fonts'),
  PORTFOLIO_DIR: resolve(process.cwd(), '../portfolio'),
});

export const CONFIG = getConfig();

export const DATA_FILE = resolve(CONFIG.TYPST_TEMPLATE_DIR, 'data.json');

// Override file patterns
export const OVERRIDE_PATTERN = /^\d{3}-.+\.json$/;

// Logging utilities
export const log = {
  i: (m) => logWithIcon('📋', m),
  s: (m) => logWithIcon('✅', m),
  w: (m) => logWithIcon('⚠️', m),
  e: (m) => logWithIcon('❌', m),
};

function logWithIcon(icon, message) {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${icon} [${time}] ${message}`);
}

// Variant validation
export const VALID_VARIANTS = ['default', 'growth', 'product'];

export function validateVariant(variant) {
  if (!VALID_VARIANTS.includes(variant)) {
    throw new Error(`Invalid variant: ${variant}. Must be one of: ${VALID_VARIANTS.join(', ')}`);
  }
  return variant;
}