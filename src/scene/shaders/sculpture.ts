import { noise3D } from './noise'

/**
 * The central sculpture. One vertex program shared by the solid body and its
 * wireframe cage: a sphere that morphs toward a cube (uMorph), displaced by
 * flowing noise, dented by the pointer. Normals are rebuilt from neighbours
 * so lighting follows the displacement.
 */
const shapeChunk = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uAmp;
uniform float uFreq;
uniform vec3 uPointerObj;   // pointer ray's closest point, in object space
uniform float uPointerForce;
${noise3D}

float displacement(vec3 p) {
  float n = snoise(p * uFreq + vec3(0.0, uTime * 0.22, uTime * 0.1));
  n += 0.5 * snoise(p * uFreq * 2.4 - vec3(uTime * 0.16));
  return n;
}

vec3 shape(vec3 p) {
  vec3 dir = normalize(p);
  vec3 cube = dir / max(max(abs(dir.x), abs(dir.y)), abs(dir.z));
  vec3 base = mix(dir, cube * 0.84, uMorph);
  float d = displacement(dir) * uAmp;
  // The pointer presses a soft dent into the surface.
  float near = 1.0 - smoothstep(0.0, 1.1, distance(dir, normalize(uPointerObj + 1e-4)));
  d -= near * uPointerForce * 0.22;
  return base * (1.0 + d);
}
`

export const sculptureVertex = /* glsl */ `
${shapeChunk}
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vDisp;

void main() {
  vec3 p = normalize(position);
  vec3 tangent = normalize(cross(p, abs(p.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = normalize(cross(p, tangent));
  float e = 0.012;
  vec3 a = shape(p);
  vec3 b = shape(normalize(p + tangent * e));
  vec3 c = shape(normalize(p + bitangent * e));
  vec3 n = normalize(cross(b - a, c - a));
  if (dot(n, a) < 0.0) n = -n;

  vDisp = displacement(p);
  vec4 world = modelMatrix * vec4(a, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const sculptureFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform float uIntensity;
uniform float uVeins;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vDisp;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

  vec3 base = vec3(0.012, 0.009, 0.009);
  // Back-light from the star wraps around the silhouette.
  float back = pow(max(dot(-v, uSunDir), 0.0), 2.0);
  vec3 red = vec3(0.85, 0.05, 0.06);
  vec3 col = base;
  col += red * fres * (0.8 + back * 1.6);

  // Specular from the star on the front face.
  vec3 h = normalize(uSunDir + v);
  col += vec3(1.0, 0.45, 0.4) * pow(max(dot(n, h), 0.0), 60.0) * 0.6;
  // Cool, faint key from above-left so the form never goes flat.
  col += vec3(0.16, 0.13, 0.13) * pow(max(dot(n, normalize(vec3(-0.6, 0.8, 0.5))), 0.0), 3.0) * 0.4;

  // Molten contour lines that flow across the surface.
  float bands = abs(fract(vDisp * 3.2 - uTime * 0.06) - 0.5);
  float vein = smoothstep(0.05, 0.0, bands) * uVeins;
  col += vec3(1.1, 0.12, 0.12) * vein * (0.35 + fres);

  col *= uIntensity;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const cageVertex = /* glsl */ `
${shapeChunk}
varying float vFres;
void main() {
  vec3 p = normalize(position);
  vec3 a = shape(p) * 1.06;
  vec4 world = modelMatrix * vec4(a, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * p);
  vFres = pow(1.0 - abs(dot(n, normalize(cameraPosition - world.xyz))), 1.5);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const cageFragment = /* glsl */ `
uniform float uOpacity;
varying float vFres;
void main() {
  vec3 col = vec3(0.9, 0.12, 0.14) * (0.25 + vFres * 1.2);
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
