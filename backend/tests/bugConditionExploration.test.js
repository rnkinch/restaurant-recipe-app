/**
 * Bug Condition Exploration Test
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
 *            1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16
 *
 * PURPOSE: Confirm that each of the five defect categories has been REMOVED
 * from the fixed codebase. Each assertion checks for the ABSENCE of a defect.
 * When this test PASSES it proves all bugs have been resolved.
 *
 * This is the post-fix version of the exploration test (Task 8).
 * The original pre-fix version (Task 1) asserted defects were PRESENT.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve paths relative to the workspace root (two levels up from backend/tests/)
const ROOT = path.resolve(__dirname, '..', '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const BACKEND = path.join(ROOT, 'backend');

/** Read a file and return its contents as a string. */
function readSrc(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

/** Count regex matches in a string. */
function countMatches(content, regex) {
  return (content.match(regex) || []).length;
}

// ---------------------------------------------------------------------------
// Category A — Hardcoded private IP in frontend fallback URLs
// ---------------------------------------------------------------------------
describe('Category A — Hardcoded IP 172.30.184.138 removed from frontend files', () => {
  const IP = '172.30.184.138';

  const categoryAFiles = [
    'frontend/src/RecipeForm.js',
    'frontend/src/RecipePdfPreview.js',
    'frontend/src/InlinePdfPreview.js',
    'frontend/src/CanvasEditor.js',
    'frontend/src/BatchPdfGenerator.js',
  ];

  test.each(categoryAFiles)(
    '%s contains zero hardcoded IP matches (defect absent)',
    (relPath) => {
      const content = readSrc(relPath);
      const matches = countMatches(content, new RegExp(IP.replace(/\./g, '\\.'), 'g'));
      // Defect MUST be absent — zero occurrences expected
      expect(matches).toBe(0);
    }
  );

  test('all 5 Category A files have zero hardcoded IP occurrences', () => {
    const filesWithIP = categoryAFiles.filter((relPath) => {
      const content = readSrc(relPath);
      return content.includes(IP);
    });
    // All files should be clean — empty array expected
    expect(filesWithIP).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Category B — Debug console.log / console.error in frontend components
// ---------------------------------------------------------------------------
describe('Category B — Debug console.* calls removed from frontend components', () => {
  const CONSOLE_RE = /console\.(log|error)\(/g;

  const categoryBFiles = [
    'frontend/src/RecipeList.js',
    'frontend/src/RecipeForm.js',
    'frontend/src/RecipeFormIngredients.js',
    'frontend/src/RecipeFormModal.js',
    'frontend/src/App.js',
    'frontend/src/RecipePdfPreview.js',
    'frontend/src/Purveyors.js',
  ];

  test.each(categoryBFiles)(
    '%s contains zero debug console.* calls (defect absent)',
    (relPath) => {
      const content = readSrc(relPath);
      const matches = countMatches(content, CONSOLE_RE);
      // Defect MUST be absent — zero occurrences expected
      expect(matches).toBe(0);
    }
  );

  test('all 7 Category B files have zero debug console.* calls', () => {
    const filesWithConsole = categoryBFiles.filter((relPath) => {
      const content = readSrc(relPath);
      // Create a fresh regex per file to avoid stateful global flag issues
      return /console\.(log|error)\(/.test(content);
    });
    // All files should be clean — empty array expected
    expect(filesWithConsole).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Category C — console.* instead of structured logger in backend files
// ---------------------------------------------------------------------------
describe('Category C — console.* calls removed from backend files', () => {
  const CONSOLE_RE = /console\.(log|error|warn)\(/g;

  const categoryCFiles = [
    'backend/middleware/changelog.js',
    'backend/routes/templates.js',
    'backend/routes/bulkUpload.js',
    'backend/utils/bulkUpload.js',
    'backend/utils/metrics.js',
  ];

  test.each(categoryCFiles)(
    '%s contains zero console.* calls (defect absent)',
    (relPath) => {
      const content = readSrc(relPath);
      const matches = countMatches(content, CONSOLE_RE);
      // Defect MUST be absent — zero occurrences expected
      expect(matches).toBe(0);
    }
  );

  test('all 5 Category C backend files have zero console.* calls', () => {
    const filesWithConsole = categoryCFiles.filter((relPath) => {
      const content = readSrc(relPath);
      // Create a fresh regex per file to avoid stateful global flag issues
      return /console\.(log|error|warn)\(/.test(content);
    });
    // All files should be clean — empty array expected
    expect(filesWithConsole).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Category D — ChangeLog IS imported at top level of server.js
// ---------------------------------------------------------------------------
describe('Category D — ChangeLog top-level import present in server.js', () => {
  test('server.js HAS ChangeLog in the top-level imports section (defect fixed)', () => {
    const content = readSrc('backend/server.js');
    const lines = content.split('\n');

    // The top-level imports section is the first block of require() calls at the
    // top of the file (before any app.use / route definitions). We scan the first
    // 50 lines — well past all legitimate top-level model imports — to check
    // whether ChangeLog is imported alongside the other models.
    const TOP_LINES = 50;
    const topSection = lines.slice(0, TOP_LINES).join('\n');
    const topLevelImportRe = /const ChangeLog\s*=\s*require\(/;
    const hasTopLevelImport = topLevelImportRe.test(topSection);

    // Fix confirmed: ChangeLog IS now imported in the top-level imports section
    expect(hasTopLevelImport).toBe(true);
  });

  test('server.js DOES call ChangeLog.create() (confirming the import is used)', () => {
    const content = readSrc('backend/server.js');
    const hasCreate = content.includes('ChangeLog.create(');
    // The call exists and the import is now properly placed at the top
    expect(hasCreate).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Category E — Debug ingredient log removed from chatController.js
// ---------------------------------------------------------------------------
describe('Category E — Debug ingredient log removed from chatController.js', () => {
  test('chatController.js does NOT contain debugIngredients variable (defect absent)', () => {
    const content = readSrc('backend/controllers/chatController.js');
    const hasDebugVar = content.includes('debugIngredients');
    // Fix confirmed: debugIngredients variable must be gone
    expect(hasDebugVar).toBe(false);
  });

  test('chatController.js does NOT contain Chat recipe context logger.info call (defect absent)', () => {
    const content = readSrc('backend/controllers/chatController.js');
    const hasDebugLog = content.includes("'Chat recipe context'");
    // Fix confirmed: debug log call must be gone
    expect(hasDebugLog).toBe(false);
  });
});
