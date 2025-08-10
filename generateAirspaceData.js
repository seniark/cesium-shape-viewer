import fs from 'fs';

// Generate 10,000 airspaces spread across the globe
function generateAirspaceDataset() {
  const airspaces = [];
  const airspaceTypes = ['CTR', 'TMA', 'CTA', 'FIR', 'UIR'];
  const shapeTypes = ['circle', 'oval', 'rectangle', 'track'];
  const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FF8844', '#8844FF'];
  
  // Major cities and airports for realistic airspace placement
  const majorLocations = [
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'NewYork', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Moscow', lat: 55.7558, lon: 37.6176 },
    { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'LosAngeles', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
    { name: 'MexicoCity', lat: 19.4326, lon: -99.1332 },
    { name: 'SaoPaulo', lat: -23.5505, lon: -46.6333 },
    { name: 'BuenosAires', lat: -34.6118, lon: -58.3960 },
    { name: 'CapeTown', lat: -33.9249, lon: 18.4241 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018 }
  ];

  for (let i = 1; i <= 10000; i++) {
    const airspaceType = airspaceTypes[Math.floor(Math.random() * airspaceTypes.length)];
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Generate location - either near a major city or random global location
    let lat, lon;
    if (Math.random() < 0.3) {
      // 30% chance to be near a major city
      const location = majorLocations[Math.floor(Math.random() * majorLocations.length)];
      lat = location.lat + (Math.random() - 0.5) * 10; // ±5 degrees
      lon = location.lon + (Math.random() - 0.5) * 10;
    } else {
      // 70% chance to be random global location
      lat = (Math.random() - 0.5) * 180; // -90 to 90
      lon = (Math.random() - 0.5) * 360; // -180 to 180
    }
    
    // Clamp coordinates to valid ranges
    lat = Math.max(-85, Math.min(85, lat));
    lon = Math.max(-180, Math.min(180, lon));
    
    const altitude = Math.random() * 8000 + 500; // 500-8500m
    const opacity = 0.2 + Math.random() * 0.6; // 0.2-0.8
    
    let dimensions = {};
    let description = '';
    
    switch (shapeType) {
      case 'circle':
        const radius = Math.random() * 50000 + 5000; // 5-55km
        dimensions = { radius };
        description = `${airspaceType} ${i} - Circular airspace with ${Math.round(radius/1000)}km radius`;
        break;
        
      case 'oval':
        const semiMajorAxis = Math.random() * 60000 + 10000; // 10-70km
        const semiMinorAxis = Math.random() * 40000 + 5000; // 5-45km
        const rotation = Math.random() * 360; // 0-360 degrees
        dimensions = { semiMajorAxis, semiMinorAxis, rotation };
        description = `${airspaceType} ${i} - Oval airspace ${Math.round(semiMajorAxis/1000)}x${Math.round(semiMinorAxis/1000)}km`;
        break;
        
      case 'rectangle':
        const width = Math.random() * 80000 + 10000; // 10-90km
        const height = Math.random() * 60000 + 10000; // 10-70km
        const rectRotation = Math.random() * 360;
        dimensions = { width, height, rotation: rectRotation };
        description = `${airspaceType} ${i} - Rectangular airspace ${Math.round(width/1000)}x${Math.round(height/1000)}km`;
        break;
        
      case 'track':
        const length = Math.random() * 100000 + 20000; // 20-120km
        const trackWidth = Math.random() * 20000 + 5000; // 5-25km
        const trackRotation = Math.random() * 360;
        dimensions = { length, width: trackWidth, rotation: trackRotation };
        description = `${airspaceType} ${i} - Track airspace ${Math.round(length/1000)}x${Math.round(trackWidth/1000)}km`;
        break;
    }
    
    const airspace = {
      id: `airspace_${i}`,
      name: `${airspaceType}_${i}`,
      type: shapeType,
      center: {
        latitude: lat,
        longitude: lon,
        altitude: altitude
      },
      dimensions,
      color,
      opacity,
      outline: true,
      outlineColor: '#FFFFFF',
      description
    };
    
    airspaces.push(airspace);
  }
  
  return { airspaces };
}

// Generate and save the dataset
const dataset = generateAirspaceDataset();
fs.writeFileSync('airspaceData.json', JSON.stringify(dataset, null, 2));
console.log(`Generated ${dataset.airspaces.length} airspaces in airspaceData.json`);

