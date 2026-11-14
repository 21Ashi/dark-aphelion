import { noise3D } from './noise'

/* ── Dust: drifting motes, pushed aside by the pointer (all on the GPU). ── */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform vec2 uPointer;
uniform float uScatter;
attribute float aSeed;
varying float vSeed;
varying float vAlpha;

void main() {
  vec3 p = position;
  float s = aSeed;
  p.x += sin(uTime * (0.08 + s * 0.1) + s * 30.0) * (1.2 + s * 1.5);
  p.y += sin(uTime * (0.05 + s * 0.06) + s * 12.0) * 1.4 + uTime * 0.04 * (s - 0.3);
  p.y = mod(p.y, 34.0);
  p.z += cos(uTime * 0.07 + s * 20.0) * 1.2;
  p.xz *= 1.0 + uScatter * s * 0.4;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  // Pointer repulsion in screen space.
  vec2 ndc = clip.xy / clip.w;
  vec2 delta = ndc - uPointer;
  float force = smoothstep(0.28, 0.0, length(delta));
  clip.xy += normalize(delta + 1e-4) * force * 0.09 * clip.w;

  gl_Position = clip;
  float size = uSize * (0.35 + s * s * 1.6);
  gl_PointSize = size * uPixelRatio * (60.0 / -mv.z);
  vSeed = s;
  vAlpha = smoothstep(220.0, 30.0, -mv.z) * smoothstep(0.5, 3.0, -mv.z);
}
`

export const dustFragment = /* glsl */ `
uniform float uTime;
varying float vSeed;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + vSeed * 3.0) + vSeed * 40.0);
  vec3 warm = vec3(1.0, 0.92, 0.88);
  vec3 ember = vec3(1.0, 0.18, 0.2);
  vec3 col = mix(warm, ember, step(0.82, vSeed));
  gl_FragColor = vec4(col * a * twinkle * vAlpha * 0.85, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* ── Floor grid: anti-aliased lines, fading with distance, with a pulse ring. ── */
export const gridVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

export const gridFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uOrigin;
uniform float uOpacity;
varying vec3 vWorld;

float gridLine(vec2 p, float spacing) {
  vec2 g = abs(fract(p / spacing - 0.5) - 0.5) / fwidth(p / spacing);
  return 1.0 - min(min(g.x, g.y), 1.0);
}

void main() {
  float camDist = distance(vWorld.xz, cameraPosition.xz);
  float fade = exp(-camDist * 0.022);
  float minor = gridLine(vWorld.xz, 4.0) * 0.35;
  float major = gridLine(vWorld.xz, 20.0) * 0.8;

  // A slow ring of light leaves the sculpture's base every few seconds.
  float r = distance(vWorld.xz, uOrigin.xz);
  float wave = fract(uTime * 0.12);
  float ring = exp(-abs(r - wave * 90.0) * 0.35) * (1.0 - wave);

  float lines = max(minor, major);
  vec3 col = vec3(0.5, 0.05, 0.06) * lines * (0.16 + ring * 1.8);
  col += vec3(0.9, 0.12, 0.13) * ring * 0.05;
  gl_FragColor = vec4(col * fade * uOpacity, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* ── Smoke sheets: slow fbm, kept faint. ── */
export const smokeVertex = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`

export const smokeFragment = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;
varying float vDepth;
${noise3D}
void main() {
  vec2 uv = vUv;
  float n = fbm(vec3(uv.x * 3.0 + uTime * 0.018 + uSeed, uv.y * 1.6 - uTime * 0.01, uSeed + uTime * 0.02));
  n = smoothstep(-0.15, 0.6, n);
  float edge = smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x) * smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.45, uv.y);
  float near = smoothstep(4.0, 22.0, vDepth);
  float a = n * edge * near * uOpacity;
  gl_FragColor = vec4(uColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* ── Light shafts: open cones, brightest at the top, soft at grazing angles. ── */
export const shaftVertex = /* glsl */ `
varying vec2 vUv;
varying float vFacing;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vFacing = abs(dot(n, normalize(cameraPosition - w.xyz)));
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

export const shaftFragment = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
varying vec2 vUv;
varying float vFacing;
${noise3D}
void main() {
  float fall = pow(vUv.y, 1.6);
  float flicker = 0.75 + 0.25 * snoise(vec3(vUv.x * 6.0, vUv.y * 2.0 - uTime * 0.12, uSeed));
  float a = fall * pow(vFacing, 2.0) * flicker * uOpacity;
  vec3 col = vec3(1.0, 0.55, 0.5) * a;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
