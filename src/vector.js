export function norm2(x,y) {
  return x*x + y*y;
}
export function dist2(x1,y1,x2,y2) {
  return norm2(x1-x2, y1-y2);
}
export function minus(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
}
export function plus(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]]
}
export function scale(p, s) {
  return [s*p[0], s*p[1]]
}
export function round(p, gridsize) {
    return [Math.round(p[0]/gridsize)*gridsize, Math.round(p[1]/gridsize)*gridsize]
}
