# Sample Data Scripts

This directory contains utility scripts for setting up the Restaurant Recipe App with sample data and admin accounts.

## Scripts

### `createAdmin.js`
Creates an admin user account for testing and development.

**Usage:**
```bash
# Copy to backend container and run
docker cp createAdmin.js <container-name>:/app/
docker exec <container-name> node createAdmin.js
```

**Creates:**
- Username: `admin`
- Password: `SecurePassword123`
- Role: `admin`
- Email: `admin@example.com`

### `loadIngredients.js`
Loads sample ingredients from `ingredients.json` into the database.

**Usage:**
```bash
# Copy to backend container and run
docker cp loadIngredients.js <container-name>:/app/
docker exec <container-name> node loadIngredients.js
```

### `loadPurveyors.js`
Loads sample purveyors from `purveyors.json` into the database.

**Usage:**
```bash
# Copy to backend container and run
docker cp loadPurveyors.js <container-name>:/app/
docker exec <container-name> node loadPurveyors.js
```

### `loadRecipes.js`
Loads sample recipes from `recipes.json` into the database.

**Usage:**
```bash
# Copy to backend container and run
docker cp loadRecipes.js <container-name>:/app/
docker exec <container-name> node loadRecipes.js
```

## Data Files

- `ingredients.json` - Sample ingredient data
- `purveyors.json` - Sample purveyor data  
- `recipes.json` - Sample recipe data

## Prerequisites

- MongoDB running (in Docker container)
- Node.js with `mongodb` and `bcryptjs` packages
- Backend container running

## Container Names

- **Development**: `dev-backend-1`
- **Staging**: `stage-backend-1`
- **Production**: `production-backend-1`

## Quick Setup

```bash
# Create admin account
docker cp createAdmin.js dev-backend-1:/app/
docker exec dev-backend-1 node createAdmin.js

# Load sample data
docker cp loadIngredients.js dev-backend-1:/app/
docker cp loadPurveyors.js dev-backend-1:/app/
docker cp loadRecipes.js dev-backend-1:/app/
docker cp ingredients.json dev-backend-1:/app/
docker cp purveyors.json dev-backend-1:/app/
docker cp recipes.json dev-backend-1:/app/

docker exec dev-backend-1 node loadIngredients.js
docker exec dev-backend-1 node loadPurveyors.js
docker exec dev-backend-1 node loadRecipes.js
```

## Notes

- Scripts use `mongodb://mongo:27017/recipeDB` for container-to-container communication
- Admin password is hardcoded for development/testing purposes
- All scripts include error handling and logging
- Data files are in JSON format for easy editing
