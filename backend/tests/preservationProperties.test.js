/**
 * Preservation Property Tests
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 *
 * PURPOSE: Capture baseline (non-defect) behavior that MUST be preserved
 * after the cleanup fixes are applied. These tests inspect source code
 * statically — no server required.
 *
 * These tests MUST PASS on the UNFIXED code. Re-running them after the fix
 * (task 9) confirms no regressions were introduced.
 *
 * **Validates: Requirements 3.1, 3.2, 3.6, 3.7, 3.8**
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

/** Read a file relative to the workspace root. */
function readSrc(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Property 1 — API URL Preservation (Requirement 3.1)
// WHEN REACT_APP_API_URL is set, the frontend uses that value unchanged.
// The env var check must come BEFORE the fallback in RecipeForm.js.
// ---------------------------------------------------------------------------
describe('Property 1 — API URL Preservation (Requirement 3.1)', () => {
  test('RecipeForm.js uses process.env.REACT_APP_API_URL before any fallback', () => {
    const content = readSrc('frontend/src/RecipeForm.js');

    // The env var reference must exist
    expect(content).toContain('process.env.REACT_APP_API_URL');

    // The env var check must appear before the fallback string
    const envVarPos = content.indexOf('process.env.REACT_APP_API_URL');
    const fallbackPos = content.search(/http:\/\/(172\.30\.184\.138|localhost):8080/);

    expect(envVarPos).toBeGreaterThanOrEqual(0);
    expect(fallbackPos).toBeGreaterThanOrEqual(0);
    // Env var check comes first — this is the preservation invariant
    expect(envVarPos).toBeLessThan(fallbackPos);
  });

  test('RecipeForm.js apiUrl assignment uses || operator (env var takes precedence)', () => {
    const content = readSrc('frontend/src/RecipeForm.js');
    // The pattern: const apiUrl = process.env.REACT_APP_API_URL || '<fallback>'
    expect(content).toMatch(/const apiUrl\s*=\s*process\.env\.REACT_APP_API_URL\s*\|\|/);
  });
});

// ---------------------------------------------------------------------------
// Property 2 — Image Fallback Preservation (Requirement 3.2)
// RecipeList.js must still have the image fallback logic (onError handler /
// default image assignment) even after console.log calls are removed.
// ---------------------------------------------------------------------------
describe('Property 2 — Image Fallback Preservation (Requirement 3.2)', () => {
  test('RecipeList.js defines a handleImageError function', () => {
    const content = readSrc('frontend/src/RecipeList.js');
    expect(content).toMatch(/handleImageError/);
  });

  test('RecipeList.js handleImageError assigns a fallback src (e.target.src = ...)', () => {
    const content = readSrc('frontend/src/RecipeList.js');
    // The fallback assignment must be present regardless of console.log calls
    expect(content).toMatch(/e\.target\.src\s*=/);
  });

  test('RecipeList.js defines a fallback image variable', () => {
    const content = readSrc('frontend/src/RecipeList.js');
    // Either validDefaultImage or fallbackImage must be referenced in the error handler
    expect(content).toMatch(/validDefaultImage|fallbackImage/);
  });
});

// ---------------------------------------------------------------------------
// Property 3 — ChangeLog Creation Preservation (Requirement 3.6)
// server.js must still contain ChangeLog.create() in the PUT handler.
// The changelog entry creation logic must remain after the import is reorganized.
// ---------------------------------------------------------------------------
describe('Property 3 — ChangeLog Creation Preservation (Requirement 3.6)', () => {
  test('server.js contains ChangeLog.create() call', () => {
    const content = readSrc('backend/server.js');
    expect(content).toContain('ChangeLog.create(');
  });

  test('server.js ChangeLog.create() is inside the PUT /recipes/:id handler', () => {
    const content = readSrc('backend/server.js');
    // Find the PUT handler block and confirm ChangeLog.create is within it
    const putHandlerStart = content.indexOf("app.put('/recipes/:id'");
    const deleteHandlerStart = content.indexOf("app.delete('/recipes/:id'");
    expect(putHandlerStart).toBeGreaterThanOrEqual(0);
    expect(deleteHandlerStart).toBeGreaterThan(putHandlerStart);

    const putHandlerBlock = content.slice(putHandlerStart, deleteHandlerStart);
    expect(putHandlerBlock).toContain('ChangeLog.create(');
  });

  test('server.js ChangeLog.create() in PUT handler includes image_uploaded action', () => {
    const content = readSrc('backend/server.js');
    const putHandlerStart = content.indexOf("app.put('/recipes/:id'");
    const deleteHandlerStart = content.indexOf("app.delete('/recipes/:id'");
    const putHandlerBlock = content.slice(putHandlerStart, deleteHandlerStart);
    expect(putHandlerBlock).toContain("'image_uploaded'");
  });
});

// ---------------------------------------------------------------------------
// Property 4 — Chat Metadata Log Preservation (Requirement 3.7)
// chatController.js must still contain the 'Chat message sent' logger.info
// call with userId/recipeId/timestamp after the debugIngredients block is removed.
// ---------------------------------------------------------------------------
describe('Property 4 — Chat Metadata Log Preservation (Requirement 3.7)', () => {
  test("chatController.js contains logger.info('Chat message sent', ...) call", () => {
    const content = readSrc('backend/controllers/chatController.js');
    expect(content).toContain("'Chat message sent'");
  });

  test("chatController.js 'Chat message sent' log includes userId field", () => {
    const content = readSrc('backend/controllers/chatController.js');
    // Find the Chat message sent block and verify it has userId
    const logPos = content.indexOf("'Chat message sent'");
    expect(logPos).toBeGreaterThanOrEqual(0);
    // Grab a window around the log call to check its metadata fields
    const logBlock = content.slice(logPos, logPos + 200);
    expect(logBlock).toContain('userId');
  });

  test("chatController.js 'Chat message sent' log includes recipeId field", () => {
    const content = readSrc('backend/controllers/chatController.js');
    const logPos = content.indexOf("'Chat message sent'");
    const logBlock = content.slice(logPos, logPos + 200);
    expect(logBlock).toContain('recipeId');
  });

  test("chatController.js 'Chat message sent' log includes timestamp field", () => {
    const content = readSrc('backend/controllers/chatController.js');
    const logPos = content.indexOf("'Chat message sent'");
    const logBlock = content.slice(logPos, logPos + 200);
    expect(logBlock).toContain('timestamp');
  });
});

// ---------------------------------------------------------------------------
// Property 5 — Structured Logger Transport Preservation (Requirement 3.8)
// utils/logger.js must export a logger with both console and file transports.
// This is the baseline that migrated backend files will use.
// ---------------------------------------------------------------------------
describe('Property 5 — Structured Logger Transport Preservation (Requirement 3.8)', () => {
  test('utils/logger.js exports a logger object', () => {
    const logger = require('../utils/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  test('utils/logger.js source configures a Console transport', () => {
    const content = readSrc('backend/utils/logger.js');
    expect(content).toContain('transports.Console');
  });

  test('utils/logger.js source configures a File transport', () => {
    const content = readSrc('backend/utils/logger.js');
    expect(content).toContain('transports.File');
  });

  test('utils/logger.js source configures both error.log and combined.log file transports', () => {
    const content = readSrc('backend/utils/logger.js');
    expect(content).toContain('error.log');
    expect(content).toContain('combined.log');
  });

  test('utils/logger.js logger has at least one transport configured', () => {
    const logger = require('../utils/logger');
    // Winston logger exposes transports array
    expect(logger.transports).toBeDefined();
    expect(logger.transports.length).toBeGreaterThan(0);
  });
});
