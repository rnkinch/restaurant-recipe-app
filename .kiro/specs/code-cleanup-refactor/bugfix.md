# Bugfix Requirements Document

## Introduction

The codebase has accumulated several fragmentation and inconsistency issues across the frontend and backend that need to be resolved before new features are added. These include: hardcoded IP addresses in frontend files that break portability, leftover debug `console.log` statements scattered throughout both frontend and backend code, inconsistent logging (mixing `console.*` with the structured `logger` utility in backend files), a missing `ChangeLog` import in `server.js` that causes a runtime error on the recipe update path, and a debug comment in `chatController.js` that logs ingredient data to the server log on every chat message.

None of these are crashes in isolation, but together they represent code quality debt that will cause confusion, expose debug noise in production, and make the codebase harder to extend.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the frontend falls back to a default API URL THEN the system uses a hardcoded private IP address (`172.30.184.138`) instead of `localhost`, making the app non-functional on any machine other than the original developer's

1.2 WHEN a recipe image is rendered in `RecipeList` THEN the system logs the image URL resolution to the browser console on every render, producing noise in production

1.3 WHEN a recipe is deleted via `RecipeList` THEN the system logs multiple debug messages (recipe ID, full recipe object, request URL, response) to the browser console

1.4 WHEN `RecipeForm` loads or submits THEN the system logs raw purveyor data, processed ingredients, form state, and step/platingGuide values to the browser console

1.5 WHEN `RecipeFormIngredients` renders THEN the system logs `formData.ingredients` and `validationErrors` to the browser console on every render cycle

1.6 WHEN `RecipeFormModal` submits a new ingredient THEN the system logs debug submission messages to the browser console

1.7 WHEN `App.js` fetches recipes or handles auth state changes THEN the system logs internal state transitions to the browser console

1.8 WHEN `RecipePdfPreview` loads or exports a PDF THEN the system logs image state and export progress to the browser console

1.9 WHEN `Purveyors` loads data THEN the system logs raw purveyor and ingredient arrays to the browser console

1.10 WHEN backend `changelog.js` middleware logs a recipe change THEN the system uses `console.log` and `console.error` instead of the structured `logger` utility, producing unstructured output

1.11 WHEN backend `routes/templates.js` handles template requests THEN the system uses `console.log` and `console.error` instead of the structured `logger` utility

1.12 WHEN backend `routes/bulkUpload.js` handles upload errors THEN the system uses `console.error` instead of the structured `logger` utility

1.13 WHEN backend `utils/bulkUpload.js` processes ingredients or encounters errors THEN the system uses `console.log` and `console.error` instead of the structured `logger` utility

1.14 WHEN backend `utils/metrics.js` encounters a database metrics error THEN the system uses `console.error` instead of the structured `logger` utility

1.15 WHEN a recipe PUT request reaches the image-change logging block in `server.js` THEN the system references `ChangeLog` without importing it in that scope, causing a `ReferenceError` at runtime

1.16 WHEN `chatController.js` processes a chat message THEN the system logs full ingredient details (names, quantities, measures) to the server log on every request, which is a debug artifact that should not run in production

### Expected Behavior (Correct)

2.1 WHEN the frontend falls back to a default API URL THEN the system SHALL use `http://localhost:8080` (and `http://localhost:3000` for the frontend origin) as the fallback, consistent with the rest of the codebase

2.2 WHEN a recipe image is rendered in `RecipeList` THEN the system SHALL resolve the image URL silently without logging to the console

2.3 WHEN a recipe is deleted via `RecipeList` THEN the system SHALL perform the deletion without emitting debug console messages

2.4 WHEN `RecipeForm` loads or submits THEN the system SHALL complete the operation without logging internal state to the browser console

2.5 WHEN `RecipeFormIngredients` renders THEN the system SHALL render without logging form state on every cycle

2.6 WHEN `RecipeFormModal` submits a new ingredient THEN the system SHALL submit without logging debug messages to the console

2.7 WHEN `App.js` fetches recipes or handles auth state changes THEN the system SHALL manage state transitions without console output

2.8 WHEN `RecipePdfPreview` loads or exports a PDF THEN the system SHALL complete the operation without logging debug image state or export progress

2.9 WHEN `Purveyors` loads data THEN the system SHALL load without logging raw data arrays to the console

2.10 WHEN backend `changelog.js` middleware logs a recipe change THEN the system SHALL use the structured `logger` utility for all output

2.11 WHEN backend `routes/templates.js` handles template requests THEN the system SHALL use the structured `logger` utility for all output

2.12 WHEN backend `routes/bulkUpload.js` handles upload errors THEN the system SHALL use the structured `logger` utility for error output

2.13 WHEN backend `utils/bulkUpload.js` processes ingredients or encounters errors THEN the system SHALL use the structured `logger` utility for all output

2.14 WHEN backend `utils/metrics.js` encounters a database metrics error THEN the system SHALL use the structured `logger` utility for error output

2.15 WHEN a recipe PUT request reaches the image-change logging block in `server.js` THEN the system SHALL have `ChangeLog` available in scope (imported at the top of the file) so no `ReferenceError` is thrown

2.16 WHEN `chatController.js` processes a chat message THEN the system SHALL NOT log ingredient details to the server log; only the existing metadata log (userId, recipeId, timestamp) SHALL remain

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid API URL is set via `REACT_APP_API_URL` environment variable THEN the system SHALL CONTINUE TO use that configured URL without modification

3.2 WHEN a recipe image fails to load THEN the system SHALL CONTINUE TO fall back to the default image silently

3.3 WHEN a recipe is deleted successfully THEN the system SHALL CONTINUE TO refresh the recipe list and show the appropriate success state

3.4 WHEN `RecipeForm` encounters a validation or submission error THEN the system SHALL CONTINUE TO display the error to the user via the existing error state

3.5 WHEN backend middleware encounters a logging failure THEN the system SHALL CONTINUE TO not fail the request (logging errors are non-fatal)

3.6 WHEN a recipe PUT request updates image data THEN the system SHALL CONTINUE TO create a `ChangeLog` entry for the image change

3.7 WHEN `chatController.js` sends a message THEN the system SHALL CONTINUE TO log the metadata (userId, recipeId, timestamp) for observability

3.8 WHEN backend routes use the structured `logger` THEN the system SHALL CONTINUE TO write logs to both console and file transports as configured in `utils/logger.js`
