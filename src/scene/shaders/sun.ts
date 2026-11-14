import { noise3D } from './noise'

/** The crimson star: churning plasma, limb glow, and an ignition uniform. */
export const sunVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

export const sunFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uRadius;
varying vec3 vPos;
varying vec3 vNormalV;
varying vec3 vViewDir;
${noise3D}

void main() {
  vec3 p = normalize(vPos);
  float t = uTime * 0.035;
  // Two layers of plasma moving against each other.
  float n1 = fbm(p * 2.4 + vec3(t, -t * 0.6, t * 0.3));
  float n2 = fbm(p * 6.0 - vec3(t * 1.4, t, 0.0));
  float cells = smoothstep(-0.25, 0.65, n1 + n2 * 0.45);

  float facing = clamp(dot(vNormalV, vViewDir), 0.0, 1.0);
  float limb = pow(1.0 - facing, 2.2);

  vec3 deep = vec3(0.20, 0.012, 0.012);   // #8B1A1A in the dark
  vec3 red = vec3(0.79, 0.045, 0.06);     // #E63946-ish, linear
  vec3 hot = vec3(1.6, 0.42, 0.26);       // only the hottest filaments

  vec3 col = mix(deep, red, cells);
  col = mix(col, hot, smoothstep(0.78, 1.0, cells) * 0.3);
  // Core darkens slightly, the rim burns — reads as a sphere, not a disc.
  col *= 0.4 + 0.55 * pow(facing, 0.8);
  col += red * limb * 2.6;

  col *= uIntensity * 0.95;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** Corona billboard: soft falloff plus slow, noisy rays. Additive. */
export const haloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const haloFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uCorona;
varying vec2 vUv;
${noise3D}

void main() {
  vec2 c = vUv - 0.5;
  // Plane is 6 radii wide: d == 1.0 at the star's edge.
  float d = length(c) * 6.0;
  float a = atan(c.y, c.x);
  float rays = snoise(vec3(cos(a) * 2.0, sin(a) * 2.0, uTime * 0.06)) * 0.5 + 0.5;
  rays = pow(rays, 3.0);
  float glow = exp(-(d - 1.0) * 2.4) * step(0.98, d);
  float soft = exp(-max(d - 1.0, 0.0) * 1.8);
  float corona = (glow * (0.45 + rays * 1.6) * uCorona);
  vec3 col = vec3(0.85, 0.06, 0.07) * (soft * 0.12 + corona * 1.1);
  col += vec3(1.0, 0.55, 0.45) * glow * rays * uCorona * 0.6;
  float edge = smoothstep(3.0, 2.2, d);
  col *= edge * uIntensity;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** Sky dome: near-black with a crimson haze that pools on the horizon under the star. */
export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const skyFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform float uIntensity;
uniform float uTime;
varying vec3 vDir;
${noise3D}
void main() {
  vec3 dir = normalize(vDir);
  float horizon = exp(-abs(dir.y - 0.01) * 26.0);
  float toward = pow(max(dot(dir, uSunDir), 0.0), 18.0);
  float haze = horizon * (0.06 + toward * 0.8) + toward * 0.08;
  float clouds = fbm(vec3(dir.x * 3.0, dir.y * 9.0, uTime * 0.01)) * 0.5 + 0.5;
  vec3 col = vec3(0.012, 0.008, 0.008);
  col += vec3(0.16, 0.01, 0.014) * haze * (0.55 + clouds * 0.6) * uIntensity;
  col += vec3(0.025, 0.006, 0.006) * toward * uIntensity;
  // faint stars high above
  float s = snoise(dir * 220.0);
  col += vec3(0.6, 0.55, 0.52) * smoothstep(0.92, 1.0, s) * smoothstep(0.1, 0.45, dir.y) * 0.5;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
