import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Load static airspace data
let airspaceData = null;
try {
  const dataPath = path.join(__dirname, 'airspaceData.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  airspaceData = JSON.parse(rawData);
  console.log(`Loaded ${airspaceData.airspaces.length} airspaces from static dataset`);
} catch (error) {
  console.error('Error loading airspace data:', error);
  process.exit(1);
}

// Filter airspaces within bounds
function filterAirspacesByBounds(bounds = null) {
  let filteredAirspaces = airspaceData.airspaces;
  
  if (bounds) {
    const minLat = Math.min(bounds.south, bounds.north);
    const maxLat = Math.max(bounds.south, bounds.north);
    const minLon = Math.min(bounds.west, bounds.east);
    const maxLon = Math.max(bounds.west, bounds.east);
    
    filteredAirspaces = airspaceData.airspaces.filter(airspace => {
      const lat = airspace.center.latitude;
      const lon = airspace.center.longitude;
      
      // Handle longitude wrapping around the globe
      let lonInBounds = false;
      if (minLon <= maxLon) {
        lonInBounds = lon >= minLon && lon <= maxLon;
      } else {
        // Crosses the 180/-180 meridian
        lonInBounds = lon >= minLon || lon <= maxLon;
      }
      
      return lat >= minLat && lat <= maxLat && lonInBounds;
    });
  }
  
  return filteredAirspaces;
}

// API endpoint to get airspace shapes
app.get('/api/airspaces', (req, res) => {
  // Parse bounds from query parameters
  let bounds = null;
  if (req.query.north && req.query.south && req.query.east && req.query.west) {
    bounds = {
      north: parseFloat(req.query.north),
      south: parseFloat(req.query.south),
      east: parseFloat(req.query.east),
      west: parseFloat(req.query.west)
    };
  }
  
  const airspaces = filterAirspacesByBounds(bounds);
  
  // Add some delay to simulate real API
  setTimeout(() => {
    res.json({
      success: true,
      data: airspaces,
      count: airspaces.length,
      totalAvailable: airspaceData.airspaces.length,
      bounds: bounds,
      timestamp: new Date().toISOString()
    });
  }, Math.random() * 500 + 100); // 100-600ms delay
});

// API endpoint to get a single airspace by ID
app.get('/api/airspaces/:id', (req, res) => {
  const id = req.params.id;
  const airspace = airspaceData.airspaces.find(a => a.id === id);
  
  if (!airspace) {
    return res.status(404).json({
      success: false,
      error: 'Airspace not found',
      timestamp: new Date().toISOString()
    });
  }
  
  setTimeout(() => {
    res.json({
      success: true,
      data: airspace,
      timestamp: new Date().toISOString()
    });
  }, Math.random() * 200 + 50);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  console.log(`Mock airspace server running on http://localhost:${port}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/airspaces?count=10`);
  console.log(`  GET /api/airspaces/:id`);
  console.log(`  GET /api/health`);
});
