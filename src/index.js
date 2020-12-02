import { fromEvent, merge, of} from 'rxjs';
import { scan, map as rxMap, mergeMap } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range} from 'lodash-es';

function norm2(x,y) {
  return x*x + y*y;
}
function dist2(x1,y1,x2,y2) {
  return norm2(x1-x2, y1-y2);
}
function minus(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]]
}
function plus(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]]
}

function process_mouse(state, evt) {
  switch (event.type) {
    case 'mousedown':
      var dists = map(state.circles, c =>
      dist2(evt.offsetX, evt.offsetY, c[0][0], c[0][1]) - c[1]*c[1])
      var chosen_circle = findIndex(dists, d => d < 0);

    if (chosen_circle > -1) {
      state.chosen_circle = chosen_circle;
      state.chosen_at = [evt.offsetX, evt.offsetY];
    }
    return state;
    case 'mousemove':
    if (state.chosen_circle > -1) {
      var circ = state.circles[state.chosen_circle][0]
      var offset = minus([evt.offsetX, evt.offsetY], state.chosen_at)
      state.circles[state.chosen_circle][0] = plus(state.chosen_at, offset);
    }
    return state;
    case 'mouseup':
    state.chosen_circle = -1;
    state.chosen_at = [];
    default:
    return state;
  }
}
function render(ctx, state) {
  ctx.clearRect(0,0,600,600);
  forEach(state.circles, function(c) {
    ctx.beginPath();
    ctx.arc(c[0][0], c[0][1], c[1], 0, 2 * Math.PI);
    ctx.fillStyle= 'red'
    ctx.fill();
  });
  forEach(state.edges, function(e) {
    var f = state.circles[e[0]][0];
    var t = state.circles[e[1]][0];
    ctx.lineWidth = 1;
    ctx.strokeStyle= 'black';
    ctx.beginPath();
    ctx.moveTo(f[0], f[1]);
    ctx.lineTo(t[0], t[1]);
    ctx.stroke();
  });
}

function init() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const down = fromEvent(document, 'mousedown');
    const move = fromEvent(document, 'mousemove');
    const up = fromEvent(document, 'mouseup');
    const mouse = of('mousedown', 'mousemove', 'mouseup').pipe(
      mergeMap(partial(fromEvent,document)));
    const initial_state = {
      'chosen_circle': -1,
      'circles': map(range(0,41), x=>[
        [random(10,590),random(10,590)],
        10]),
      'edges': map(range(0,500), x=>
        [random(0,40), random(0,40)])
    }
    const mouse_observer = mouse.pipe(scan(process_mouse, initial_state))
    render(ctx, initial_state);
    mouse_observer.subscribe(partial(render, ctx))
}

init();
