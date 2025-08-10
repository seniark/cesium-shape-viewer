import './App.css'
import { useEffect, useRef, useState } from 'react'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  Viewer,
  createWorldTerrainAsync,
  Cartesian3,
  Math as CesiumMath,
  Color,
  HeadingPitchRange,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  OpenStreetMapImageryProvider,
  ImageryLayer,
} from 'cesium'
import { AirspaceService, type AirspaceShape, type MapBounds } from './services/airspaceService'

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [airspaces, setAirspaces] = useState<AirspaceShape[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null)
  const [totalAvailable, setTotalAvailable] = useState<number>(0)

  const fetchAirspaces = async (bounds?: MapBounds) => {
    try {
      setLoading(true)
      setError(null)
      const data = await AirspaceService.getAirspaces(undefined, bounds)
      setAirspaces(data)
      if (bounds) {
        setCurrentBounds(bounds)
      }
      setTotalAvailable(data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch airspaces')
      console.error('Error fetching airspaces:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentMapBounds = (viewer: Viewer): MapBounds => {
    const camera = viewer.camera
    const rectangle = camera.computeViewRectangle()
    
    if (rectangle) {
      return {
        north: CesiumMath.toDegrees(rectangle.north),
        south: CesiumMath.toDegrees(rectangle.south),
        east: CesiumMath.toDegrees(rectangle.east),
        west: CesiumMath.toDegrees(rectangle.west)
      }
    }
    
    // Fallback bounds if rectangle computation fails
    return {
      north: 45.0,
      south: 35.0,
      east: -70.0,
      west: -80.0
    }
  }

  const renderAirspaceShapes = (viewer: Viewer, airspaceData: AirspaceShape[]) => {
    const entities = viewer.entities
    
    // Clear existing airspace entities
    entities.values.forEach(entity => {
      if (entity.name && entity.name.toString().startsWith('airspace_')) {
        entities.remove(entity)
      }
    })
    
    // Add new airspace entities
    airspaceData.forEach(airspace => {
      const color = Color.fromCssColorString(airspace.color).withAlpha(airspace.opacity)
      const outlineColor = Color.fromCssColorString(airspace.outlineColor)
      
      const entityConfig: any = {
        name: airspace.id,
        position: Cartesian3.fromDegrees(
          airspace.center.longitude,
          airspace.center.latitude,
          airspace.center.altitude
        ),
        description: airspace.description,
      }
      
      switch (airspace.type) {
        case 'circle':
          entityConfig.cylinder = {
            length: 1000, // Default height
            topRadius: airspace.dimensions.radius,
            bottomRadius: airspace.dimensions.radius,
            material: color,
            outline: airspace.outline,
            outlineColor: outlineColor,
          }
          break
          
        case 'oval':
          // Ensure semiMajorAxis is always greater than or equal to semiMinorAxis
          const majorAxis = Math.max(airspace.dimensions.semiMajorAxis || 0, airspace.dimensions.semiMinorAxis || 0);
          const minorAxis = Math.min(airspace.dimensions.semiMajorAxis || 0, airspace.dimensions.semiMinorAxis || 0);
          
          entityConfig.ellipse = {
            semiMinorAxis: minorAxis,
            semiMajorAxis: majorAxis,
            material: color,
            outline: airspace.outline,
            outlineColor: outlineColor,
            rotation: airspace.dimensions.rotation ? CesiumMath.toRadians(airspace.dimensions.rotation) : 0,
            extrudedHeight: 1000, // Default height
          }
          break
          
        case 'rectangle':
          // Ensure semiMajorAxis is always greater than or equal to semiMinorAxis
          const rectWidth = airspace.dimensions.width || 30000;
          const rectHeight = airspace.dimensions.height || 20000;
          const rectMajorAxis = Math.max(rectWidth, rectHeight) / 2;
          const rectMinorAxis = Math.min(rectWidth, rectHeight) / 2;
          
          entityConfig.ellipse = {
            semiMinorAxis: rectMinorAxis,
            semiMajorAxis: rectMajorAxis,
            material: color,
            outline: airspace.outline,
            outlineColor: outlineColor,
            rotation: airspace.dimensions.rotation ? CesiumMath.toRadians(airspace.dimensions.rotation) : 0,
            extrudedHeight: 1000, // Default height
          }
          break
          
        case 'track':
          // Ensure semiMajorAxis is always greater than or equal to semiMinorAxis
          const trackLength = airspace.dimensions.length || 50000;
          const trackWidth = airspace.dimensions.width || 15000;
          const trackMajorAxis = Math.max(trackLength, trackWidth) / 2;
          const trackMinorAxis = Math.min(trackLength, trackWidth) / 2;
          
          entityConfig.ellipse = {
            semiMinorAxis: trackMinorAxis,
            semiMajorAxis: trackMajorAxis,
            material: color,
            outline: airspace.outline,
            outlineColor: outlineColor,
            rotation: airspace.dimensions.rotation ? CesiumMath.toRadians(airspace.dimensions.rotation) : 0,
            extrudedHeight: 1000, // Default height
          }
          break
      }
      
      entities.add(entityConfig)
    })
  }

  useEffect(() => {
    if (!containerRef.current) return

    const viewer = new Viewer(containerRef.current, {
      terrainProvider: undefined,
      timeline: false,
      animation: false,
      baseLayerPicker: true,
      geocoder: true,
      sceneModePicker: true,
      homeButton: true,
      navigationHelpButton: true,
      fullscreenButton: true,
      scene3DOnly: false,
    })
    viewerRef.current = viewer

    // Add OpenStreetMap as a custom layer option
    const openStreetMapLayer = new ImageryLayer(
      new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      })
    )
    viewer.imageryLayers.add(openStreetMapLayer)

    ;(async () => {
      try {
        const terrain = await createWorldTerrainAsync()
        viewer.terrainProvider = terrain
      } catch {}
    })()

    // Fetch and render airspace shapes for current view
    const initialBounds = getCurrentMapBounds(viewer)
    fetchAirspaces(initialBounds)

    // Listen for camera changes to update airspaces
    const cameraChangedHandler = () => {
      const bounds = getCurrentMapBounds(viewer)
      fetchAirspaces(bounds)
    }
    
    // Debounce camera changes to avoid too many API calls
    let cameraChangeTimeout: number
    viewer.camera.changed.addEventListener(() => {
      clearTimeout(cameraChangeTimeout)
      cameraChangeTimeout = window.setTimeout(cameraChangedHandler, 1000) // 1 second delay
    })

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-75.59777, 40.03883, 8000.0),
      orientation: {
        heading: CesiumMath.toRadians(20.0),
        pitch: CesiumMath.toRadians(-25.0),
        roll: 0.0,
      },
      duration: 1.5,
    })

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(() => {
      viewer.zoomTo(viewer.entities, new HeadingPitchRange(0, -0.5, 8000))
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    const onResize = () => viewer.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (cameraChangeTimeout) {
        clearTimeout(cameraChangeTimeout)
      }
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  // Render airspaces when they change
  useEffect(() => {
    if (viewerRef.current && airspaces.length > 0) {
      renderAirspaceShapes(viewerRef.current, airspaces)
    }
  }, [airspaces])

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} id="cesiumContainer" style={{ height: '100%', width: '100%' }} />
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Airspace Controls</h3>
        
        {loading && (
          <div style={{ marginBottom: '10px', color: '#4CAF50' }}>
            Loading airspaces...
          </div>
        )}
        
        {error && (
          <div style={{ marginBottom: '10px', color: '#f44336' }}>
            Error: {error}
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <span>Airspaces in view: {airspaces.length.toLocaleString()}</span>
          {airspaces.length > 1000 && (
            <div style={{ fontSize: '11px', color: '#FFA500', marginTop: '5px' }}>
              ⚠️ Many airspaces - performance may be slower
            </div>
          )}
        </div>
        
        {currentBounds && (
          <div style={{ marginBottom: '10px', fontSize: '12px', opacity: 0.8 }}>
            <div>Bounds:</div>
            <div>N: {currentBounds.north.toFixed(2)}°</div>
            <div>S: {currentBounds.south.toFixed(2)}°</div>
            <div>E: {currentBounds.east.toFixed(2)}°</div>
            <div>W: {currentBounds.west.toFixed(2)}°</div>
          </div>
        )}
        
        <button
          onClick={() => {
            if (viewerRef.current) {
              const bounds = getCurrentMapBounds(viewerRef.current)
              fetchAirspaces(bounds)
            }
          }}
          disabled={loading}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : 'Refresh Airspaces'}
        </button>
      </div>
    </div>
  )
}

export default App
