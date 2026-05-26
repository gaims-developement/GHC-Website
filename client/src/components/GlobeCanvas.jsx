import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const RADIUS = 2.2;

const cities = {
  Delhi: { lon: 77.2, lat: 28.6 },
  Mumbai: { lon: 72.9, lat: 19.1 },
  Dubai: { lon: 55.3, lat: 25.2 },
  Tokyo: { lon: 139.7, lat: 35.7 },
  London: { lon: -0.1, lat: 51.5 },
  Geneva: { lon: 6.1, lat: 46.2 },
  "New Delhi": { lon: 77.2, lat: 28.6 },
  Sydney: { lon: 151.2, lat: -33.9 },
  Nairobi: { lon: 36.8, lat: -1.3 },
  "New York": { lon: -74, lat: 40.7 },
};

const routes = [
  ["Delhi", "London", 0.78],
  ["Delhi", "Geneva", 0.62],
  ["Mumbai", "Dubai", 0.42],
  ["New Delhi", "Tokyo", 0.52],
  ["Nairobi", "Delhi", 0.58],
  ["New York", "Geneva", 0.72],
];

const continents = [
  {
    name: "Africa",
    points: [[-17, 35], [6, 37], [31, 32], [47, 12], [43, -15], [30, -34], [17, -35], [6, -24], [-8, -8], [-16, 12]],
  },
  {
    name: "Europe",
    points: [[-11, 36], [2, 45], [12, 56], [31, 60], [43, 50], [35, 41], [18, 36], [6, 38]],
  },
  {
    name: "Asia",
    points: [[32, 34], [45, 50], [72, 58], [105, 55], [135, 43], [145, 28], [122, 9], [104, 1], [88, 20], [72, 8], [58, 22], [44, 18]],
  },
  {
    name: "Australia",
    points: [[113, -22], [128, -12], [146, -18], [154, -31], [142, -40], [121, -36]],
  },
  {
    name: "North America",
    points: [[-164, 55], [-137, 68], [-104, 61], [-72, 48], [-61, 28], [-87, 16], [-109, 24], [-125, 42]],
  },
];

const glowRegions = [
  { name: "India", lon: 77.2, lat: 22.8, color: "#ff8bb4" },
  { name: "Geneva", lon: 6.1, lat: 46.2, color: "#bde7ff" },
  { name: "London", lon: -0.1, lat: 51.5, color: "#bde7ff" },
  { name: "New Delhi", lon: 77.2, lat: 28.6, color: "#ffbdd5" },
];

const isMobileViewport = () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

const latLonToVector = (lat, lon, radius = RADIUS) => {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    -radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.sin(lonRad)
  );
};

const buildSphericalPolygonGeometry = (points, radius) => {
  const centerLon = points.reduce((total, [lon]) => total + lon, 0) / points.length;
  const centerLat = points.reduce((total, [, lat]) => total + lat, 0) / points.length;
  const center = latLonToVector(centerLat, centerLon, radius);
  const vertices = [];

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const a = latLonToVector(point[1], point[0], radius);
    const b = latLonToVector(next[1], next[0], radius);
    vertices.push(center.x, center.y, center.z, a.x, a.y, a.z, b.x, b.y, b.z);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
};

function SceneTuning() {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2("#080813", 0.045);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
}

function Atmosphere({ mobile }) {
  const ref = useRef(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      colorA: { value: new THREE.Color("#7dd3fc") },
      colorB: { value: new THREE.Color("#ff6b9d") },
      intensity: { value: mobile ? 0.38 : 0.5 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform float intensity;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.8);
        vec3 glow = mix(colorA, colorB, rim * 0.35);
        gl_FragColor = vec4(glow, rim * intensity);
      }
    `,
  }), [mobile]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01);
  });

  return (
    <mesh ref={ref} scale={1.08}>
      <sphereGeometry args={[RADIUS, mobile ? 48 : 96, mobile ? 32 : 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 96, 64]} />
      <meshStandardMaterial
        color="#071b3a"
        roughness={0.74}
        metalness={0.08}
        emissive="#061224"
        emissiveIntensity={0.32}
      />
    </mesh>
  );
}

function Continent({ continent, mobile }) {
  const fillGeometry = useMemo(() => buildSphericalPolygonGeometry(continent.points, RADIUS + 0.018), [continent.points]);
  const edgePoints = useMemo(() => {
    const points = continent.points.map(([lon, lat]) => latLonToVector(lat, lon, RADIUS + 0.021));
    return [...points, points[0]];
  }, [continent.points]);
  const edgeGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(edgePoints), [edgePoints]);

  return (
    <group>
      <mesh geometry={fillGeometry}>
        <meshBasicMaterial
          color="#9fb4c8"
          transparent
          opacity={mobile ? 0.075 : 0.105}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <line geometry={edgeGeometry}>
        <lineBasicMaterial color="#bdd7ec" transparent opacity={mobile ? 0.08 : 0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </line>
    </group>
  );
}

function RegionalGlow({ region, mobile }) {
  const ref = useRef(null);
  const position = useMemo(() => latLonToVector(region.lat, region.lon, RADIUS + 0.028), [region.lat, region.lon]);

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + region.lon * 0.02) * 0.08;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[mobile ? 0.075 : 0.105, 24, 24]} />
      <meshBasicMaterial color={region.color} transparent opacity={mobile ? 0.075 : 0.105} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function ContinentLayer({ mobile }) {
  return (
    <group>
      {continents.map((continent) => (
        <Continent key={continent.name} continent={continent} mobile={mobile} />
      ))}
      {glowRegions.map((region) => (
        <RegionalGlow key={region.name} region={region} mobile={mobile} />
      ))}
    </group>
  );
}

function GridLine({ points, opacity = 0.16 }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#a7d8ff" transparent opacity={opacity} blending={THREE.AdditiveBlending} />
    </line>
  );
}

function GlobeGrid({ mobile }) {
  const grid = useMemo(() => {
    const lines = [];
    const radius = RADIUS + 0.012;

    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 4) points.push(latLonToVector(lat, lon, radius));
      lines.push(points);
    }

    for (let lon = -180; lon < 180; lon += 30) {
      const points = [];
      for (let lat = -86; lat <= 86; lat += 4) points.push(latLonToVector(lat, lon, radius));
      lines.push(points);
    }

    return lines;
  }, []);

  return (
    <group>
      {grid.map((points, index) => (
        <GridLine key={index} points={points} opacity={mobile ? 0.1 : 0.15} />
      ))}
    </group>
  );
}

function CityNode({ name, city, mobile }) {
  const [hovered, setHovered] = useState(false);
  const coreRef = useRef(null);
  const haloRef = useRef(null);
  const position = useMemo(() => latLonToVector(city.lat, city.lon, RADIUS + 0.035), [city.lat, city.lon]);

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2 + city.lon * 0.03) * 0.25;
    if (coreRef.current) coreRef.current.scale.setScalar(pulse);
    if (haloRef.current) haloRef.current.scale.setScalar(1.15 + pulse * 0.18);
  });

  return (
    <group
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (!mobile) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ff6b9d" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color="#ffd2e4" toneMapped={false} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={9} position={[0, 0.12, 0]} style={{ pointerEvents: "none" }}>
          <span className="globe-tooltip">{name}</span>
        </Html>
      )}
    </group>
  );
}

function RouteArc({ from, to, height, index, mobile }) {
  const lineRef = useRef(null);
  const packetRef = useRef(null);
  const curve = useMemo(() => {
    const start = latLonToVector(from.lat, from.lon, RADIUS + 0.045);
    const end = latLonToVector(to.lat, to.lon, RADIUS + 0.045);
    const midpoint = start.clone().add(end).multiplyScalar(0.5).normalize();
    const distance = start.distanceTo(end);
    const control = midpoint.multiplyScalar(RADIUS + height + Math.min(distance * 0.12, 0.22));
    return new THREE.QuadraticBezierCurve3(start, control, end);
  }, [from.lat, from.lon, height, to.lat, to.lon]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(mobile ? 36 : 72)), [curve, mobile]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const travel = (time * (mobile ? 0.14 : 0.19) + index * 0.18) % 1;
    if (packetRef.current) packetRef.current.position.copy(curve.getPoint(travel));
    if (lineRef.current) lineRef.current.material.opacity = 0.2 + Math.sin(time * 1.4 + index) * 0.045;
  });

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color="#ff8bb4" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </line>
      <mesh ref={packetRef}>
        <sphereGeometry args={[mobile ? 0.015 : 0.022, 12, 12]} />
        <meshBasicMaterial color="#ffe4ef" transparent opacity={0.9} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

function NetworkLayer({ mobile }) {
  const visibleRoutes = mobile ? routes.slice(0, 4) : routes;

  return (
    <group>
      {Object.entries(cities).map(([name, city]) => (
        <CityNode key={name} name={name} city={city} mobile={mobile} />
      ))}
      {visibleRoutes.map(([from, to, height], index) => (
        <RouteArc key={`${from}-${to}`} from={cities[from]} to={cities[to]} height={height} index={index} mobile={mobile} />
      ))}
    </group>
  );
}

function GlobeScene({ mobile }) {
  const globeRef = useRef(null);
  const parallaxRef = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }, delta) => {
    if (!globeRef.current) return;
    if (!mobile) {
      parallaxRef.current.x += (pointer.x * 0.12 - parallaxRef.current.x) * 0.045;
      parallaxRef.current.y += (pointer.y * 0.08 - parallaxRef.current.y) * 0.045;
    }
    globeRef.current.rotation.y += delta * (mobile ? 0.02 : 0.03);
    globeRef.current.rotation.x += (parallaxRef.current.y - globeRef.current.rotation.x) * 0.04;
    globeRef.current.rotation.z += (-parallaxRef.current.x * 0.25 - globeRef.current.rotation.z) * 0.04;
  });

  return (
    <>
      <SceneTuning />
      <ambientLight intensity={0.58} />
      <pointLight position={[-3.8, 2.8, 4.2]} intensity={0.72} color="#ffb8d0" />
      <pointLight position={[3.8, -2.2, 3.4]} intensity={0.55} color="#7dd3fc" />
      <directionalLight position={[4, 3.5, 5]} intensity={1.5} color="#ffffff" />
      <group ref={globeRef} position={mobile ? [0.18, -0.16, 0] : [0.36, -0.22, 0]} rotation={[THREE.MathUtils.degToRad(-12), THREE.MathUtils.degToRad(16), 0]}>
        <Earth />
        <ContinentLayer mobile={mobile} />
        <GlobeGrid mobile={mobile} />
        <NetworkLayer mobile={mobile} />
        <Atmosphere mobile={mobile} />
      </group>
      <Stars radius={36} depth={22} count={mobile ? 320 : 850} factor={mobile ? 1.8 : 2.6} saturation={0} fade speed={0.2} />
      <Sparkles count={mobile ? 12 : 38} scale={mobile ? 5.4 : 7} size={mobile ? 0.85 : 1.25} speed={0.12} opacity={0.24} color="#dbeafe" />
    </>
  );
}

export default function GlobeCanvas({ className = "" }) {
  const [mobile, setMobile] = useState(isMobileViewport);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const onChange = () => setMobile(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div className={className}>
      <style>{`
        .globe-tooltip {
          display: inline-flex;
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 999px;
          background: rgba(8, 12, 28, 0.62);
          padding: 0.2rem 0.46rem;
          color: rgba(244, 249, 255, 0.94);
          font-family: "DM Sans", Inter, system-ui, sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
          backdrop-filter: blur(12px);
        }
      `}</style>
      <Canvas
        camera={{ position: [0, 0, 7], fov: mobile ? 38 : 34 }}
        dpr={mobile ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", minHeight: mobile ? 310 : 500, overflow: "visible" }}
      >
        <GlobeScene mobile={mobile} />
      </Canvas>
    </div>
  );
}
