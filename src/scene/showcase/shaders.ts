/** Shaders for the Works stage (src/scene/showcase). */

export const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The room behind the stage: near-black, with slow smoke in the project's deep
 * colour and its accent light pooling behind the pedestal. `uFocus` is the
 * direction (from the sphere's centre) of the stage as the camera sees it.
 */
export const skyFrag = /* glsl */ `
  uniform vec3 uDeep, uAccent, uFocus;
  uniform float uOn, uPulse, uTime;
  uniform sampler2D uSmoke;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float back = smoothstep(0.55, -0.8, d.z);
    // smoke drifting across the room (two layers of a tiling noise picture), thicker low down and at the edges
    vec2 p = vec2(atan(d.x, -d.z) * 0.9, d.y * 1.3);
    float n = texture2D(uSmoke, p * 0.85 + vec2(uTime * 0.006, 0.0)).r * 0.62
            + texture2D(uSmoke, p * 2.1 + vec2(-uTime * 0.009, uTime * 0.003)).r * 0.38;
    float smoke = smoothstep(0.36, 0.86, n);
    float low = smoothstep(0.35, -0.45, d.y - uFocus.y);
    float side = smoothstep(0.2, 0.9, abs(d.x - uFocus.x * 0.5));
    vec3 c = vec3(0.0035, 0.003, 0.0045);
    c += uDeep * 0.14 * back;
    c += (uDeep * (0.5 + 0.9 * max(low, side)) + vec3(0.01)) * smoke * back;
    // the project's own light, pooled behind its stage
    float f = distance(d, uFocus);
    // The room opens from the stage outward (and closes back into it on the way out): an iris
    // with a smoky, broken front that glows in the project's colour, instead of a flat dim.
    // (the frame spans about ±0.7 of direction around the stage, so the front sweeps 0 → 1.3)
    float front = uOn * 1.45 - 0.12;
    float e = f - front + (n - 0.5) * 0.2;
    float inside = max(smoothstep(0.05, -0.07, e), smoothstep(0.9, 0.98, uOn));
    float opening = 1.0 - smoothstep(0.86, 0.98, uOn);
    float rim = exp(-abs(e) * 11.0) * opening * smoothstep(0.0, 0.06, uOn);
    float pool = smoothstep(0.95, 0.0, f) * back;
    c += uAccent * pool * (0.03 + smoke * 0.09);
    // a soft shaft falling on the pedestal
    float shaft = smoothstep(0.14, 0.0, abs(d.x - uFocus.x - (d.y - uFocus.y) * 0.16)) * smoothstep(-0.1, 0.55, d.y - uFocus.y) * back;
    c += uAccent * shaft * 0.016 * (0.5 + smoke);
    // a ring of the new colour sweeps outward from the stage when the project changes
    float wave = smoothstep(0.07, 0.0, abs(f - uPulse * 1.6)) * (1.0 - uPulse);
    c += uAccent * wave * 0.22 * (0.35 + smoke);
    // the iris front: a band of lit smoke in the project's colour
    c += uAccent * rim * (0.16 + smoke * 0.42);
    gl_FragColor = vec4(c, clamp(max(inside, rim * 0.7), 0.0, 1.0));
    #include <colorspace_fragment>
  }
`

export const plainVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** A real screenshot on glass: rounded corners, cover-fit, a sheen that slides with the view. */
export const screenVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`
export const screenFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uScale, uOffset, uSize;
  uniform float uRadius, uReady, uGlow, uOn, uBright;
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  float rbox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = rbox(p, uSize * 0.5, uRadius);
    float aa = fwidth(d) * 0.75;
    float mask = 1.0 - smoothstep(-aa, aa, d);
    vec2 uv = vUv * uScale + uOffset;
    vec3 c = texture2D(uMap, uv).rgb * uReady + vec3(0.015) * (1.0 - uReady);
    // a lit screen, but never pure white: highlights stay under the bloom threshold
    c *= uBright;
    float sheen = smoothstep(0.32, 0.0, abs(vUv.x - vUv.y * 0.55 - 0.18 - vView.x * 0.6)) * 0.035;
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
    c = c * (1.0 - fres * 0.35) + sheen + uGlow * 0.03;
    gl_FragColor = vec4(c, mask * uOn);
    #include <colorspace_fragment>
  }
`

/** The orbit: a thin line of light, drawn on around its circle, with a spark running along it. */
export const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const ringFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uI, uDraw, uTime, uSpeed;
  varying vec2 vUv;
  void main() {
    float u = vUv.x;
    float drawn = 1.0 - smoothstep(uDraw - 0.04, uDraw, u);
    float k = fract(u - uTime * uSpeed);
    float spark = pow(smoothstep(0.82, 1.0, k), 6.0) * 3.0 + smoothstep(0.6, 1.0, k) * 0.35;
    float base = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(u * 6.2832 * 1.0 + 1.3), 2.0);
    gl_FragColor = vec4(uColor * uI * drawn * (base + spark), 1.0);
  }
`

/** A soft round light, additive. */
export const glowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uI, uSoft;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(max(1.0 - d, 0.0), uSoft);
    gl_FragColor = vec4(uColor * a * uI, 1.0);
  }
`

/** A soft contact shadow under an object. */
export const shadowFrag = /* glsl */ `
  uniform float uI;
  uniform vec2 uStretch;
  varying vec2 vUv;
  void main() {
    float d = length((vUv - 0.5) * uStretch) * 2.0;
    gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(1.0, 0.0, d) * uI);
  }
`

/**
 * A project's backdrop photo (supplied by the owner), on a plane behind the
 * stage. Graded a little darker, more so under the type column (on the left,
 * or at the foot on portrait screens), and feathered at its edges into the room.
 */
export const backdropFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity, uStacked;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb * 0.92;
    float shade = mix(smoothstep(0.04, 0.5, vUv.x), smoothstep(0.3, 0.72, vUv.y), uStacked);
    c *= mix(mix(0.6, 0.3, uStacked), 1.0, shade);
    float e = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x) * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
    gl_FragColor = vec4(c, uOpacity * e);
    #include <colorspace_fragment>
  }
`
