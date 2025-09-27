# Frontend - Restaurant Recipe App

React frontend for the Restaurant Recipe & Plating Guide application.

## 🚀 Quick Start

### Development Mode
```bash
npm start
```
Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
```
Creates optimized production build in the `build` folder.

### Testing
```bash
npm test
```
Runs the test suite in interactive watch mode.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── utils/              # Utility functions and validation
├── tests/              # Test files
├── App.js              # Main application component
└── index.js            # Application entry point
```

## 🔧 Key Features

- **Recipe Management** - Create, edit, and view recipes
- **Ingredient Tracking** - Manage ingredients and purveyors
- **Form Validation** - Real-time validation with user feedback
- **File Upload** - Image upload with validation
- **Responsive Design** - Bootstrap-based UI
- **Authentication** - User login and role management

## 🧪 Testing

### Validation Tests
```bash
# Run frontend validation tests
npm test -- --testPathPattern=validation.test.js
```

### Manual Testing
Open `../manual-validation-test.html` for interactive testing.

## 📦 Dependencies

- **React** - UI framework
- **Bootstrap** - CSS framework
- **Axios** - HTTP client
- **React Router** - Navigation
- **Jest** - Testing framework

## 🔗 API Integration

The frontend communicates with the backend API at `http://localhost:8080` (configured in `docker-compose.yml`).

Key API endpoints:
- `/recipes` - Recipe CRUD operations
- `/ingredients` - Ingredient management
- `/purveyors` - Purveyor management
- `/auth` - Authentication endpoints