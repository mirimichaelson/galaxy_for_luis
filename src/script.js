import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Test cube
 */
// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshBasicMaterial()
// )
// scene.add(cube)

const textureLoader = new THREE.TextureLoader()
const particlesTexture = textureLoader.load('/textures/particles/1.png')

// Galaxy
const galaxyParams = {
  count: 100000,
  size: 0.01,
  radius: 5.5,
  branches: 4,
  spin: 1,
  randomness: 0.402,
  randomnessPower: 1.924,
  insideColour: '#498efd',
  outsideColour: '#142348',
  // randomness: 0.02,
  // randomnessPower: 3,
  // insideColour: '#ff6030',
  // outsideColour: '#1b3984',

  zoom: 1, // Initial zoom level
  yOffset: 5, // Initial vertical offset
}

let geometry = null
let material = null
let points = null

const generateGalaxy = () => {
  if (points !== null) {
    geometry.dispose()
    material.dispose()
    scene.remove(points)
  }
  const positions = new Float32Array(galaxyParams.count * 3)
  const colours = new Float32Array(galaxyParams.count * 3)

  const colourInside = new THREE.Color(galaxyParams.insideColour)
  const colourOutside = new THREE.Color(galaxyParams.outsideColour)

  //   for (let i = 0; i < galaxyParams.count * 3; i++) {
  //     positions[i] = (Math.random() - 0.5) * 10
  //   }
  for (let i = 0; i < galaxyParams.count * 3; i++) {
    const i3 = i * 3

    // Position
    const radius = Math.random() * galaxyParams.radius
    const spinAngle = radius * galaxyParams.spin
    const branchAngle = ((i % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2

    // const randomX = (Math.random() - 0.5) * galaxyParams.randomness
    // const randomY = (Math.random() - 0.5) * galaxyParams.randomness
    // const randomZ = (Math.random() - 0.5) * galaxyParams.randomness
    const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
    const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
    const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

    positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX
    positions[i3 + 1] = randomY
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

    // Colour
    const mixedColour = colourInside.clone()
    mixedColour.lerp(colourOutside, radius / galaxyParams.radius)

    colours[i3 + 0] = mixedColour.r
    colours[i3 + 1] = mixedColour.g
    colours[i3 + 2] = mixedColour.b
  }

  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))

  //   Material
  material = new THREE.PointsMaterial({
    size: galaxyParams.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    map: particlesTexture,
    alphaMap: particlesTexture,
    depthWrite: false,
  })

  points = new THREE.Points(geometry, material)
  scene.add(points)
}

generateGalaxy()
gui.add(galaxyParams, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'radius').min(0.01).max(20).step(0.1).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'branches').min(2).max(15).step(1).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'spin').min(-5).max(5).step(0.1).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(galaxyParams, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(galaxyParams, 'insideColour').onFinishChange(generateGalaxy)
gui.addColor(galaxyParams, 'outsideColour').onFinishChange(generateGalaxy)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 7
camera.position.y = 3
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

let isRotationPaused = false;
// Add an event listener for the 'keydown' event
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    isRotationPaused = !isRotationPaused;
  }
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

document.addEventListener('wheel', (event) => {
  galaxyParams.zoom += event.deltaY * 0.001 // Adjust the zoom sensitivity
  galaxyParams.zoom = Math.max(0.1, Math.min(5, galaxyParams.zoom)) // Clamp the zoom level

  // Update the camera's distance based on the zoom level
  const radius = galaxyParams.radius * galaxyParams.zoom
  controls.target.set(0, 0, 0) // Ensure the target is at the origin (or your object's position)
  camera.position.set(
    Math.cos(controls.getAzimuthalAngle()) * radius,
    galaxyParams.yOffset * galaxyParams.zoom, // Maintain the relative y offset
    Math.sin(controls.getAzimuthalAngle()) * radius
  )
  controls.update()
})

let runningTime = 0;
let rotationSpeed = 0.2;

const accelerate = (currentSpeed, targetSpeed) => {
  const deltaSpeed = targetSpeed - currentSpeed;

  if (Math.abs(deltaSpeed) < 0.0001) {
    return targetSpeed;
  } else {
    return currentSpeed + deltaSpeed / 10;
  }
}

const tick = () => {
  const delta = clock.getDelta();

  const radius = galaxyParams.radius * galaxyParams.zoom

  controls.enabled = false

  // Always update the camera position
  rotationSpeed = accelerate(rotationSpeed, isRotationPaused ? 0 : 0.2);
  runningTime += delta * rotationSpeed;
  camera.position.x = Math.cos(runningTime) * radius;
  camera.position.z = Math.sin(runningTime) * radius;
  camera.position.y = galaxyParams.yOffset * galaxyParams.zoom;

  controls.target.set(0, 0, 0) // Ensure the target is at the origin (or your object's position)
  controls.update()

  // camera.position.y = galaxyParams.yPosition // Maintain the initial y position

  // camera.position.x = Math.cos(elapsedTime) * galaxyParams.radius
  // camera.position.z = Math.sin(elapsedTime) * galaxyParams.radius
  // camera.position.y = (Math.sin(elapsedTime * 0.5) * galaxyParams.radius) / 2 // Optional: to add a vertical oscillation effect
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
