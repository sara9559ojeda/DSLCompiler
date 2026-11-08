import { useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Outlines } from "@react-three/drei";
import * as THREE from "three";

/**
 * The hero sculpture: a procedural, flat-coloured "living eye" (concentric
 * discs, like the brand's illustrations) with satellites at different depths.
 * Every part is a primitive geometry — no external models, ~20 meshes — with an
 * inked outline and a 3-step toon ramp so it reads as a 3D illustration.
 */

const INK = "#03141a";
const PALETTE = {
  cream: "#fff2dc",
  blue: "#087ebd",
  orange: "#ff9c1a",
  red: "#f13b2d",
  pink: "#f35ba5",
  night: "#0b2e3a",
} as const;

/** 3-tone ramp, nearest-filtered: hard-edged cel shading instead of smooth gradients. */
function useToonRamp(): THREE.DataTexture {
  return useMemo(() => {
    const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

interface PartProps {
  readonly color: string;
  readonly ramp: THREE.DataTexture;
  readonly children: ReactNode;
  readonly outline?: number;
}

/** A mesh body: toon material + inked outline. `children` is the geometry. */
function Body({ color, ramp, children, outline = 0.035 }: PartProps): JSX.Element {
  return (
    <>
      {children}
      <meshToonMaterial color={color} gradientMap={ramp} />
      <Outlines thickness={outline} color={INK} />
    </>
  );
}

/** Springy hover: the part grows with overshoot and settles back; also reports hover for the cursor. */
function Hoverable({
  children,
  position,
  onHover,
}: {
  readonly children: ReactNode;
  readonly position: [number, number, number];
  readonly onHover: (hovered: boolean) => void;
}): JSX.Element {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const velocity = useRef(0);
  const scale = useRef(1);

  useFrame((_, delta) => {
    const target = hovered.current ? 1.18 : 1;
    // damped spring (underdamped → a small elastic overshoot)
    const dt = Math.min(delta, 0.05);
    velocity.current += ((target - scale.current) * 90 - velocity.current * 9) * dt;
    scale.current += velocity.current * dt;
    group.current?.scale.setScalar(scale.current);
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        hovered.current = true;
        onHover(true);
      }}
      onPointerOut={() => {
        hovered.current = false;
        onHover(false);
      }}
    >
      {children}
    </group>
  );
}

function starShape(outer: number, inner: number, points: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

const STAR_EXTRUDE = { depth: 0.28, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 };

/** One concentric "eye": stacked discs facing the camera, a domed pupil, a highlight. */
function Eye({ ramp, scale = 1 }: { readonly ramp: THREE.DataTexture; readonly scale?: number }): JSX.Element {
  const layers: readonly [number, string, number][] = [
    [1.9, PALETTE.cream, 0],
    [1.5, PALETTE.blue, 0.1],
    [1.18, PALETTE.night, 0.2],
    [0.88, PALETTE.orange, 0.3],
  ];
  return (
    <group scale={scale}>
      {layers.map(([radius, color, z]) => (
        <mesh key={color} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <Body color={color} ramp={ramp}>
            <cylinderGeometry args={[radius, radius, 0.14, 48]} />
          </Body>
        </mesh>
      ))}
      <mesh position={[0, 0, 0.34]} scale={[1, 1, 0.8]}>
        <Body color={PALETTE.night} ramp={ramp}>
          <sphereGeometry args={[0.55, 32, 24]} />
        </Body>
      </mesh>
      <mesh position={[0.2, 0.22, 0.82]}>
        <meshToonMaterial color={PALETTE.cream} gradientMap={ramp} />
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
    </group>
  );
}

interface SculptureProps {
  readonly lite: boolean;
  readonly onCursor: (cursor: "grab" | "grabbing" | "auto") => void;
}

function Sculpture({ lite, onCursor }: SculptureProps): JSX.Element {
  const ramp = useToonRamp();
  const rig = useRef<THREE.Group>(null);
  const drag = useRef({ active: false, x: 0, y: 0, offsetYaw: 0, offsetPitch: 0, vYaw: 0, vPitch: 0 });
  const hoverCount = useRef(0);
  const star = useMemo(() => new THREE.ExtrudeGeometry(starShape(0.62, 0.26, 5), STAR_EXTRUDE), []);

  const setHover = (hovered: boolean): void => {
    hoverCount.current = Math.max(0, hoverCount.current + (hovered ? 1 : -1));
    if (!drag.current.active) onCursor(hoverCount.current > 0 ? "grab" : "auto");
  };

  useFrame((state, delta) => {
    const group = rig.current;
    if (!group) return;
    const d = drag.current;
    const dt = Math.min(delta, 0.05);

    if (!d.active) {
      // Elastic return of the dragged rotation toward the slow idle orbit.
      d.vYaw += (-d.offsetYaw * 22 - d.vYaw * 5) * dt;
      d.vPitch += (-d.offsetPitch * 22 - d.vPitch * 5) * dt;
      d.offsetYaw += d.vYaw * dt;
      d.offsetPitch += d.vPitch * dt;
    }

    const t = state.clock.elapsedTime;
    const idleYaw = Math.sin(t * 0.22) * 0.38; // slow sway rather than a full spin: the eye keeps facing the viewer
    const targetYaw = idleYaw + d.offsetYaw + state.pointer.x * 0.28;
    const targetPitch = d.offsetPitch - state.pointer.y * 0.2 + Math.sin(t * 0.17) * 0.06;
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetYaw, 5, dt);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetPitch, 5, dt);
  });

  const onDown = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    (event.target as unknown as Element).setPointerCapture?.(event.pointerId);
    drag.current = { ...drag.current, active: true, x: event.clientX, y: event.clientY, vYaw: 0, vPitch: 0 };
    onCursor("grabbing");
  };
  const onMove = (event: ThreeEvent<PointerEvent>): void => {
    const d = drag.current;
    if (!d.active) return;
    d.offsetYaw += (event.clientX - d.x) * 0.012;
    d.offsetPitch += (event.clientY - d.y) * 0.012;
    d.offsetYaw = THREE.MathUtils.clamp(d.offsetYaw, -2.2, 2.2);
    d.offsetPitch = THREE.MathUtils.clamp(d.offsetPitch, -1, 1);
    d.x = event.clientX;
    d.y = event.clientY;
  };
  const onUp = (event: ThreeEvent<PointerEvent>): void => {
    (event.target as unknown as Element).releasePointerCapture?.(event.pointerId);
    drag.current.active = false;
    onCursor(hoverCount.current > 0 ? "grab" : "auto");
  };

  return (
    <group ref={rig} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {/* invisible drag surface so grabbing the empty space between parts works too */}
      <mesh visible={false}>
        <sphereGeometry args={[4.2, 8, 6]} />
        <meshBasicMaterial />
      </mesh>

      <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.5}>
        <Hoverable position={[0, 0, 0]} onHover={setHover}>
          <Eye ramp={ramp} />
        </Hoverable>
      </Float>

      {/* orbit ring that crosses the eye at an angle */}
      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={0.3}>
        <Hoverable position={[0, 0, 0.3]} onHover={setHover}>
          <mesh rotation={[1.15, 0.35, 0.2]}>
            <Body color={PALETTE.orange} ramp={ramp} outline={0.03}>
              <torusGeometry args={[2.85, 0.15, 14, 72]} />
            </Body>
          </mesh>
        </Hoverable>
      </Float>

      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1}>
        <Hoverable position={[-2.9, 1.9, 1.1]} onHover={setHover}>
          <mesh geometry={star} rotation={[0.2, 0.3, 0.15]}>
            <Body color={PALETTE.red} ramp={ramp}>
              {null}
            </Body>
          </mesh>
        </Hoverable>
      </Float>

      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
        <Hoverable position={[2.9, -1.7, 1.2]} onHover={setHover}>
          <mesh>
            <Body color={PALETTE.pink} ramp={ramp}>
              <sphereGeometry args={[0.62, 32, 24]} />
            </Body>
          </mesh>
        </Hoverable>
      </Float>

      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={0.8}>
        <Hoverable position={[-2.6, -2.2, 0.6]} onHover={setHover}>
          <mesh rotation={[0.5, 0, 0.4]}>
            <Body color={PALETTE.blue} ramp={ramp}>
              <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </Body>
          </mesh>
        </Hoverable>
      </Float>

      <Float speed={2} rotationIntensity={1.6} floatIntensity={0.9}>
        <Hoverable position={[2.5, 2.3, -0.6]} onHover={setHover}>
          <mesh rotation={[0.6, 0.6, 0]}>
            <Body color={PALETTE.cream} ramp={ramp}>
              <boxGeometry args={[0.55, 0.55, 0.55]} />
            </Body>
          </mesh>
        </Hoverable>
      </Float>

      {!lite ? (
        <>
          <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.7}>
            <Hoverable position={[3.05, 0.5, -1.8]} onHover={setHover}>
              <Eye ramp={ramp} scale={0.42} />
            </Hoverable>
          </Float>
          <Float speed={1.7} rotationIntensity={1} floatIntensity={0.8}>
            <Hoverable position={[-3.5, -0.2, -1.2]} onHover={setHover}>
              <mesh rotation={[0.9, 0.2, 0.5]}>
                <Body color={PALETTE.pink} ramp={ramp}>
                  <torusKnotGeometry args={[0.32, 0.1, 64, 10]} />
                </Body>
              </mesh>
            </Hoverable>
          </Float>
          <Float speed={1.5} rotationIntensity={1.2} floatIntensity={0.9}>
            <Hoverable position={[0.4, -3.1, 0.9]} onHover={setHover}>
              <mesh rotation={[0, 0, 0.6]}>
                <Body color={PALETTE.orange} ramp={ramp}>
                  <coneGeometry args={[0.38, 0.8, 4]} />
                </Body>
              </mesh>
            </Hoverable>
          </Float>
        </>
      ) : null}
    </group>
  );
}

export interface SculptureCanvasProps {
  /** Rendering is paused (frameloop "never") while the hero is off screen. */
  readonly active: boolean;
  /** Fewer parts and a lower pixel ratio for small / low-power screens. */
  readonly lite: boolean;
  readonly onFailure: () => void;
}

export default function SculptureCanvas({ active, lite, onFailure }: SculptureCanvasProps): JSX.Element {
  const [cursor, setCursor] = useState<"grab" | "grabbing" | "auto">("auto");

  return (
    <Canvas
      className="sculpture__canvas"
      style={{ cursor }}
      frameloop={active ? "always" : "never"}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [0, 0, 13.6], fov: 34 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onFailure();
        });
      }}
    >
      <ambientLight intensity={1.15} color="#ffe9c7" />
      <directionalLight position={[4, 5, 7]} intensity={2.6} color="#fff6e6" />
      <directionalLight position={[-6, -2, -2]} intensity={1.1} color="#3bb6ee" />
      <Sculpture lite={lite} onCursor={setCursor} />
    </Canvas>
  );
}
