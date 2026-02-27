"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: any
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const { current: refs } = sceneRef

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `
    const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float xScale;
  uniform float yScale;
  uniform float distortion;

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    float d = length(p) * distortion;
    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);
    
    // Core wave thickness
    float intensity = 0.05; 
    
    float r = intensity / abs(p.y + sin((rx + time) * xScale) * yScale);
    float g = intensity / abs(p.y + sin((gx + time) * xScale) * yScale);
    float b = intensity / abs(p.y + sin((bx + time) * xScale) * yScale);
    
    vec3 wave = vec3(r, g, b);
    
    // CORRECTED FALLOFF: 
    // This smoothly goes from 1.0 (full light) at the center to 0.0 (no light) at the edges.
    // The 0.8 ensures the light dies completely BEFORE it hits the boundary.
    float falloffY = 1.0 - smoothstep(0.2, 0.8, abs(p.y));
    wave *= falloffY;
    
    // DYNAMIC TRANSPARENCY:
    // The alpha (opacity) is now exactly equal to the brightest part of the wave.
    // At the edges where 'wave' is 0.0, 'alpha' becomes 0.0 -> 100% invisible canvas.
    float alpha = max(max(wave.r, wave.g), wave.b);
    
    gl_FragColor = vec4(wave, alpha);
  }
`;
    
    const initScene = () => {
  refs.scene = new THREE.Scene()
  
  // 1. ADD alpha: true to the renderer
  refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true }) 
  refs.renderer.setPixelRatio(window.devicePixelRatio)
  
  // 2. Set clear color to black with 0 opacity (transparent)
  refs.renderer.setClearColor(0x000000, 0) 
  refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

  refs.uniforms = {
    resolution: { value: [canvas.clientWidth, canvas.clientHeight] },
    time: { value: 0.0 },
    xScale: { value: 1.0 },
    yScale: { value: 0.5 },
    distortion: { value: 0.008 },
  }

  const position = [
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0,  1.0, 0.0,
  ]

  const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", positions)

  const material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: refs.uniforms,
    side: THREE.DoubleSide,
    // 3. ADD transparency and AdditiveBlending here
    transparent: true,
    blending: THREE.AdditiveBlending, 
  })

  refs.mesh = new THREE.Mesh(geometry, material)
  refs.scene.add(refs.mesh)
  handleResize()
}

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value += 0.01
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms || !canvas) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value = [width, height]
    }

    initScene()
    animate()
    window.addEventListener("resize", handleResize)

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      window.removeEventListener("resize", handleResize)
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      refs.renderer?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  )
}