export type Vector = [number, number];

export function norm2(v:Vector):number {
  return v[0] * v[0] + v[1] * v[1];
}
export function dist2(v1:Vector,v2:Vector):number {
  return norm2([v1[0] - v2[0], v1[1] - v2[1]]);
}
export function minus(v1:Vector, v2:Vector):Vector {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}
export function plus(v1:Vector, v2:Vector):Vector {
  return [v1[0] + v2[0], v1[1] + v2[1]]
}
export function scale(v:Vector, s:number):Vector {
  return [s * v[0], s * v[1]]
}
export function round(v:Vector, gridsize:number):Vector {
    return [Math.round(v[0]/gridsize)*gridsize, 
            Math.round(v[1]/gridsize)*gridsize]
}
