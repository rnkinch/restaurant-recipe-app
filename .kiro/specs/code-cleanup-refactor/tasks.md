# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - All Five Defect Categories Present in Unfixed Code
  - **CRITICAL**: This test MUST FAIL (or surface counterexamples) on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected post-fix state — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate each defect category exists
  - **Scoped PBT Approach**: Scope each check to the concrete failing locations identified in isBugCondition
  - Category A — grep `frontend/src` for `172.30.184.138`; expect matches in RecipeForm.js, RecipePdfPreview.js, InlinePdfPreview.js, CanvasEditor.js, BatchPdfGenerator.js
  - Category B — grep the 7 affected frontend files for `console\.(log|error)\(`; expect debug matches in RecipeList.js, RecipeForm.js, RecipeFormIngredients.js, RecipeFormModal.js, App.js, RecipePdfPreview.js, Purveyors.js
  - Category C — grep the 5 affected backend files for `console\.(log|error|warn)\(`; expect matches in middleware/changelog.js, routes/templates.js, routes/bulkUpload.js, utils/bulkUpload.js, utils/metrics.js
  - Category D — inspect server.js top-level imports; confirm `ChangeLog` is NOT imported at the top level (only inline inside DELETE handler)
  - Category E — inspect chatController.js; confirm `debugIngredients` variable and `Chat recipe context` logger.info call are present
  - Run on UNFIXED code — expect each check to find the defect (confirms bugs exist)
  - **EXPECTED OUTCOME**: All five category checks find their respective defects (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., "172.30.184.138 found in 5 files", "ChangeLog not in top-level imports of server.js")
  - Mark task complete when test is written, run, and all counterexamples are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Defect Behavior Is Unchanged
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code first
  - Observe: when `REACT_APP_API_URL` is set, the configured URL is used (not the fallback IP)
  - Observe: image load errors in RecipeList still trigger the default image fallback silently
  - Observe: recipe CRUD operations (create/read/update/delete) return correct responses
  - Observe: `Chat message sent` log entry (userId, recipeId, timestamp) is emitted by chatController.js
  - Observe: backend files that already use logger write to both console and file transports
  - Write property-based test: for any non-empty `REACT_APP_API_URL` value, the frontend uses that value unchanged
  - Write property-based test: for any recipe object with image data, PUT endpoint creates a ChangeLog entry (once Category D is fixed, this should already pass on unfixed code for the preservation path)
  - Write property-based test: for any chat message input, `Chat message sent` metadata log is always emitted
  - Verify all preservation tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 3. Fix Category A — Replace hardcoded private IPs in frontend files

  - [x] 3.1 Replace hardcoded IP in RecipeForm.js
    - Replace `'http://172.30.184.138:8080'` fallback with `'http://localhost:8080'`
    - Replace both `'http://172.30.184.138:3000${defaultImage}'` references with `'http://localhost:3000${defaultImage}'`
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipeForm.js' AND location.code CONTAINS '172.30.184.138'_
    - _Expected_Behavior: frontend falls back to http://localhost:8080 and http://localhost:3000_
    - _Preservation: REACT_APP_API_URL env var continues to take precedence when set_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Replace hardcoded IP in RecipePdfPreview.js, InlinePdfPreview.js, CanvasEditor.js, BatchPdfGenerator.js
    - RecipePdfPreview.js: replace `'http://172.30.184.138:8080'` with `'http://localhost:8080'`
    - InlinePdfPreview.js: replace `'http://172.30.184.138:8080'` with `'http://localhost:8080'`
    - CanvasEditor.js: replace both `'http://172.30.184.138:8080'` occurrences with `'http://localhost:8080'`
    - BatchPdfGenerator.js: replace `'http://172.30.184.138:8080'` with `'http://localhost:8080'`
    - _Bug_Condition: isBugCondition(location) where location.file IN [RecipePdfPreview.js, InlinePdfPreview.js, CanvasEditor.js, BatchPdfGenerator.js] AND location.code CONTAINS '172.30.184.138'_
    - _Expected_Behavior: all four files fall back to http://localhost:8080_
    - _Preservation: configured REACT_APP_API_URL continues to be used when set_
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 4. Fix Category B — Remove debug console.log calls in frontend components

  - [x] 4.1 Clean up RecipeList.js
    - Remove `console.log` in `getImageUrl` (image URL resolution log)
    - Remove `console.error` in `handleImageError` (image load failure log)
    - Remove `console.log` in `handleImageError` (default image fallback log)
    - Remove all `console.log` / `console.error` calls inside `handleDelete`
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipeList.js' AND location.code MATCHES /console\.(log|error)\(/ AND location.purpose = 'debug'_
    - _Expected_Behavior: image URL resolution and delete operations produce no console output_
    - _Preservation: image load errors still trigger default image fallback; successful delete still refreshes recipe list_
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.2, 3.3_

  - [x] 4.2 Clean up RecipeForm.js debug console calls
    - Remove all debug `console.log` / `console.error` calls logging purveyors, ingredients, form data, steps, platingGuide, save response
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipeForm.js' AND location.code MATCHES /console\.(log|error)\(/ AND location.purpose = 'debug'_
    - _Expected_Behavior: form load and submit produce no console output_
    - _Preservation: validation and submission errors continue to be displayed to the user via error state_
    - _Requirements: 1.4, 2.4, 3.4_

  - [x] 4.3 Clean up RecipeFormIngredients.js
    - Remove the two `console.log` calls in the `useEffect` body (formData.ingredients and validationErrors)
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipeFormIngredients.js' AND location.code MATCHES /console\.log\(/_
    - _Expected_Behavior: component renders without logging form state on every cycle_
    - _Preservation: ingredient rendering and validation error display are unaffected_
    - _Requirements: 1.5, 2.5_

  - [x] 4.4 Clean up RecipeFormModal.js
    - Remove the two debug `console.log` calls in `handleSubmitNewIngredient`
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipeFormModal.js' AND location.code MATCHES /console\.log\(/_
    - _Expected_Behavior: ingredient submission produces no debug console output_
    - _Preservation: ingredient submission logic and error handling are unaffected_
    - _Requirements: 1.6, 2.6_

  - [x] 4.5 Clean up App.js
    - Remove all `console.log` calls (refreshing recipes, recipes fetched, login successful, search triggered, filtered recipes, auth state logs)
    - Remove redundant `console.error` calls where error is already set in state
    - _Bug_Condition: isBugCondition(location) where location.file = 'App.js' AND location.code MATCHES /console\.(log|error)\(/ AND location.purpose = 'debug'_
    - _Expected_Behavior: auth state changes and recipe fetches produce no console output_
    - _Preservation: auth flow, recipe fetching, and error state management are unaffected_
    - _Requirements: 1.7, 2.7_

  - [x] 4.6 Clean up RecipePdfPreview.js debug console calls
    - Remove the debug `useEffect` that logs image states on every render
    - Remove `console.log('Starting PDF export...')` and `console.log('PDF preview opened successfully')` calls
    - _Bug_Condition: isBugCondition(location) where location.file = 'RecipePdfPreview.js' AND location.code MATCHES /console\.log\(/ AND location.purpose = 'debug'_
    - _Expected_Behavior: PDF load and export produce no debug console output_
    - _Preservation: PDF generation and error handling are unaffected_
    - _Requirements: 1.8, 2.8_

  - [x] 4.7 Clean up Purveyors.js
    - Remove `console.log('Loaded purveyors:', ...)` and `console.log('Loaded ingredients:', ...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'Purveyors.js' AND location.code MATCHES /console\.log\(/_
    - _Expected_Behavior: purveyor data loads without logging raw arrays to the console_
    - _Preservation: purveyor and ingredient data loading logic is unaffected_
    - _Requirements: 1.9, 2.9_

- [ ] 5. Fix Category C — Migrate console.* to structured logger in backend files

  - [x] 5.1 Migrate backend/middleware/changelog.js
    - Add `const logger = require('../utils/logger')` import at the top
    - Replace every `console.log(...)` with `logger.info(...)`
    - Replace every `console.error(...)` with `logger.error(...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'middleware/changelog.js' AND location.code MATCHES /console\.(log|error)\(/_
    - _Expected_Behavior: changelog middleware uses structured logger for all output_
    - _Preservation: logging failures remain non-fatal; logs continue to write to both console and file transports_
    - _Requirements: 1.10, 2.10, 3.5, 3.8_

  - [x] 5.2 Migrate backend/routes/templates.js
    - Add `const logger = require('../utils/logger')` import at the top
    - Replace every `console.log(...)` with `logger.info(...)`
    - Replace every `console.error(...)` with `logger.error(...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'routes/templates.js' AND location.code MATCHES /console\.(log|error)\(/_
    - _Expected_Behavior: template routes use structured logger for all output_
    - _Preservation: template request handling and error responses are unaffected_
    - _Requirements: 1.11, 2.11, 3.8_

  - [x] 5.3 Migrate backend/routes/bulkUpload.js
    - Add `const logger = require('../utils/logger')` import at the top
    - Replace every `console.error(...)` with `logger.error(...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'routes/bulkUpload.js' AND location.code MATCHES /console\.error\(/_
    - _Expected_Behavior: bulk upload route uses structured logger for error output_
    - _Preservation: upload error handling and response logic are unaffected_
    - _Requirements: 1.12, 2.12, 3.8_

  - [x] 5.4 Migrate backend/utils/bulkUpload.js
    - Add `const logger = require('./logger')` import at the top
    - Replace `console.error('File parsing error:', error)` with `logger.error(...)`
    - Replace `console.error('Error processing ingredients:', error)` with `logger.error(...)`
    - Replace `console.log('Created new ingredient: ...')` with `logger.info(...)`
    - Replace `console.error('Error finding/creating ingredient ...')` with `logger.error(...)`
    - Replace `console.error('Error logging bulk upload recipe creation:', logError)` with `logger.error(...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'utils/bulkUpload.js' AND location.code MATCHES /console\.(log|error)\(/_
    - _Expected_Behavior: bulk upload utility uses structured logger for all output_
    - _Preservation: ingredient processing and error handling logic are unaffected_
    - _Requirements: 1.13, 2.13, 3.8_

  - [x] 5.5 Migrate backend/utils/metrics.js
    - Add `const logger = require('./logger')` import at the top
    - Replace `console.error('Error updating database metrics:', error)` with `logger.error(...)`
    - _Bug_Condition: isBugCondition(location) where location.file = 'utils/metrics.js' AND location.code MATCHES /console\.error\(/_
    - _Expected_Behavior: metrics utility uses structured logger for error output_
    - _Preservation: database metrics collection logic is unaffected_
    - _Requirements: 1.14, 2.14, 3.8_

- [ ] 6. Fix Category D — Add missing ChangeLog top-level import in server.js

  - [x] 6.1 Add top-level ChangeLog import
    - Add `const ChangeLog = require('./models/ChangeLog')` alongside the other model imports near the top of server.js
    - Remove the duplicate inline `const ChangeLog = require('./models/ChangeLog')` inside the DELETE handler (now redundant)
    - _Bug_Condition: isBugCondition(location) where location.file = 'server.js' AND location.code CONTAINS 'ChangeLog.create(' AND 'ChangeLog' NOT IN location.file.topLevelImports_
    - _Expected_Behavior: ChangeLog is available in scope for the PUT handler; no ReferenceError is thrown_
    - _Preservation: recipe PUT with image still creates a ChangeLog entry; DELETE handler continues to work_
    - _Requirements: 1.15, 2.15, 3.6_

- [ ] 7. Fix Category E — Remove debug ingredient log in chatController.js

  - [x] 7.1 Remove debugIngredients block
    - Remove the `debugIngredients` variable declaration
    - Remove the `logger.info('Chat recipe context', { ingredients: debugIngredients })` call entirely
    - Preserve the subsequent `logger.info('Chat message sent', { userId, recipeId, timestamp })` call
    - _Bug_Condition: isBugCondition(location) where location.file = 'chatController.js' AND location.code CONTAINS 'debugIngredients'_
    - _Expected_Behavior: chat message processing does not log ingredient details to the server log_
    - _Preservation: Chat message sent metadata log (userId, recipeId, timestamp) continues to be emitted_
    - _Requirements: 1.16, 2.16, 3.7_

- [x] 8. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - All Five Defect Categories Are Absent
  - **IMPORTANT**: Re-run the SAME checks from task 1 — do NOT write new tests
  - Re-run Category A grep: expect zero matches for `172.30.184.138` in frontend/src
  - Re-run Category B grep: expect zero debug `console.(log|error)(` matches in the 7 frontend files
  - Re-run Category C grep: expect zero `console.(log|error|warn)(` matches in the 5 backend files
  - Re-run Category D inspection: confirm `ChangeLog` IS present in server.js top-level imports
  - Re-run Category E inspection: confirm `debugIngredients` and `Chat recipe context` log call are absent from chatController.js
  - **EXPECTED OUTCOME**: All five category checks find zero defects (confirms all bugs are fixed)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16_

- [x] 9. Verify preservation tests still pass
  - **Property 2: Preservation** - Non-Defect Behavior Is Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
  - Verify REACT_APP_API_URL env var still takes precedence over any fallback
  - Verify image load errors still trigger the default image fallback in RecipeList
  - Verify recipe CRUD operations return the same responses as before
  - Verify PUT recipe with image still creates a ChangeLog entry (no ReferenceError)
  - Verify `Chat message sent` metadata log (userId, recipeId, timestamp) is still emitted
  - Verify migrated backend files still write to both console and file transports via structured logger
  - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass; ask the user if any questions arise
  - Run the full backend test suite: `cd backend && npm test -- --run`
  - Confirm no new test failures were introduced by the cleanup changes
  - Confirm the five defect categories are fully resolved across all affected files
