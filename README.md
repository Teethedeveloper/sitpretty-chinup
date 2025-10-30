# SitPretty & ChinUp

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-%5E18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-%5E4.0-blueviolet)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-%20replace_with_your_CI-blue)](https://github.com/<your-username>/<your-repo>/actions)

SitPretty & ChinUp is a posture-detection web app that analyzes live webcam feeds or uploaded videos in real time using TensorFlow.js, visualizes analytics with D3.js, and persists session analytics to MongoDB. Built with React, Express, Node.js, Vite, SASS, and TypeScript.

## Installation

1. Clone the repo
```bash
git clone https://github.com/<your-username>/sitpretty_chinup.git
cd sitpretty_chinup
```

2. Install dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

Create a `.env` file in `backend/` with (example):
```env
PORT=5000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Run the app
```bash
# Start backend API
cd backend
npm start

# Start frontend (Vite)
cd ../frontend
npm run dev
```

By default, Vite serves the frontend at: http://localhost:5173

## Usage

- Open http://localhost:5173 in your browser.
- Use the Posture Detector to:
  - Enable webcam access for real-time posture analysis, or
  - Upload a recorded video for processing.
- The app uses TensorFlow.js models to estimate keypoints, computes posture metrics, and displays interactive analytics in the Dashboard with D3.js charts.
- Session analytics are stored and can be reviewed in the dashboard.

## Project Structure (key files/folders)

- frontend/
  - src/components/PostureDetector.tsx — core posture detection UI and TF.js integration
  - src/components/Dashboard.tsx — D3.js analytics visualizations
  - src/assets/ — images, styles and SASS files
  - src/utils/draw.ts, geometry.ts, postureRules.ts — drawing helpers and posture logic
  - src/styles/ — SASS variables and global styles
- backend/
  - src/index.ts — backend entry (API) implementation
  - routes/posture.ts — posture-related API endpoints
  - types/types.ts — shared backend TypeScript types
  - (Example API entry reference) backend/server.ts — API server entry point (if present in alternative setups)
- README.md, LICENSE, CONTRIBUTING.md — repo-level docs

## Contributing

Contributions are welcome. Please:
1. Fork the repository.
2. Create a feature branch.
3. Open a Pull Request describing your changes.

See CONTRIBUTING.md for full guidelines. By contributing you agree to follow the repository's code of conduct.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- TensorFlow.js for browser-based ML.
- D3.js for visualization.
- Vite + React + TypeScript for fast, type-safe frontend development.