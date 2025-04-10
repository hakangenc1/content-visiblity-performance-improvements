import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [items] = useState(() => 
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      title: `Item ${i + 1}`,
      description: `This is item ${i + 1} with detailed description. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(3)}`,
      price: (Math.random() * 100).toFixed(2),
      rating: Math.floor(Math.random() * 5) + 1
    }))
  )

  const containerRef = useRef(null)
  const [visibleRange, setVisibleRange] = useState([0, 20])
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    domSize: 0,
    memory: 0,
    lastPaint: 0
  })
  const [performanceLog, setPerformanceLog] = useState([])
  
  // Initialize from localStorage or default to true
  const [useContentVisibility, setUseContentVisibility] = useState(() => {
    const saved = localStorage.getItem('useContentVisibility')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId
    let memoryInterval

    const updateMetrics = () => {
      const now = performance.now()
      frameCount++
      
      if (now >= lastTime + 1000) {
        const newMetrics = {
          fps: frameCount,
          domSize: document.querySelectorAll('.item').length,
          memory: window.performance.memory ? 
            Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
          timestamp: now,
          mode: useContentVisibility ? 'With Optimization' : 'Without Optimization'
        }
        
        setMetrics(prev => ({ ...prev, ...newMetrics }))
        setPerformanceLog(prev => [...prev, newMetrics].slice(-20))
        frameCount = 0
        lastTime = now
      }
      
      animationFrameId = requestAnimationFrame(updateMetrics)
    }

    animationFrameId = requestAnimationFrame(updateMetrics)
    memoryInterval = setInterval(() => {
      if (window.performance?.memory) {
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024)
        }))
      }
    }, 1000)

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearInterval(memoryInterval)
    }
  }, [useContentVisibility])

  // Scroll handling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const startTime = performance.now()
      
      const { scrollTop, clientHeight } = container
      const itemHeight = 150
      const startIdx = Math.floor(scrollTop / itemHeight)
      const endIdx = Math.ceil((scrollTop + clientHeight) / itemHeight) + 5

      setVisibleRange([Math.max(0, startIdx - 5), Math.min(items.length, endIdx + 5)])
      
      const renderTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, renderTime }))
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [items.length, useContentVisibility])

  // Save to localStorage and adjust visible range
  useEffect(() => {
    localStorage.setItem('useContentVisibility', JSON.stringify(useContentVisibility))
    setVisibleRange(useContentVisibility ? [0, 20] : [0, items.length])
  }, [useContentVisibility, items.length])

  const toggleOptimization = () => {
    setUseContentVisibility(prev => !prev)
  }

  const clearSettings = () => {
    localStorage.removeItem('useContentVisibility')
    setUseContentVisibility(true)
  }

  return (
    <div className="app">
      <h1>Performance Comparison Demo</h1>
      
      <div className="controls">
        <button 
          onClick={toggleOptimization}
          className={`toggle-btn ${useContentVisibility ? 'active' : ''}`}
        >
          {useContentVisibility ? 'Disable' : 'Enable'} Content-Visibility
        </button>
        <button onClick={clearSettings} className="reset-btn">
          Reset to Default
        </button>
      </div>
      
      <div className="metrics-panel">
        <div className="metric">
          <span className="metric-label">Mode:</span>
          <span className="metric-value">
            {useContentVisibility ? 'Optimized' : 'Unoptimized'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">FPS:</span>
          <span className="metric-value" style={{ color: metrics.fps < 45 ? '#e74c3c' : '#2ecc71' }}>
            {metrics.fps}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Render Time:</span>
          <span className="metric-value" style={{ color: metrics.renderTime > 10 ? '#e74c3c' : '#2ecc71' }}>
            {metrics.renderTime.toFixed(2)}ms
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">DOM Items:</span>
          <span className="metric-value">
            {useContentVisibility ? metrics.domSize : items.length}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Memory:</span>
          <span className="metric-value" style={{ color: metrics.memory > 100 ? '#e74c3c' : '#2ecc71' }}>
            {metrics.memory}MB
          </span>
        </div>
      </div>
      
      <div className="storage-info">
        <p>Current mode is saved in localStorage. Refresh the page to test Lighthouse in this mode.</p>
        <p>Value in localStorage: <code>useContentVisibility = {useContentVisibility.toString()}</code></p>
      </div>
      
      <div className="scroll-container" ref={containerRef}>
        <div 
          className="scroll-content" 
          style={{ height: `${items.length * 150}px` }}
        >
          {(useContentVisibility 
            ? items.slice(visibleRange[0], visibleRange[1])
            : items
          ).map((item, idx) => (
            <div 
              key={item.id}
              className="item"
              style={{
                position: useContentVisibility ? 'absolute' : 'relative',
                top: useContentVisibility ? `${(visibleRange[0] + idx) * 150}px` : 'auto',
                width: 'calc(100% - 2rem)',
                contentVisibility: useContentVisibility ? 'auto' : 'visible',
                containIntrinsicSize: useContentVisibility ? '150px' : 'none'
              }}
            >
              <h3>{item.title}</h3>
              <div className="stars">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
              <p>{item.description}</p>
              <p className="price">${item.price}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="performance-log">
        <h3>Performance Log (Last 20 entries):</h3>
        <div className="log-entries">
          {performanceLog.map((entry, index) => (
            <div key={index} className={`log-entry ${entry.mode?.replace(' ', '-').toLowerCase()}`}>
              {entry.timestamp && new Date(entry.timestamp).toLocaleTimeString()} - 
              {entry.mode}: {entry.fps && `FPS: ${entry.fps}`} {entry.renderTime && `Render: ${entry.renderTime.toFixed(2)}ms`}
              {entry.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App