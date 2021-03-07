import { fromEvent, merge, of, Subject} from 'rxjs';
import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { collectionData } from 'rxfire/firestore';
// import { fromEvent, merge, of, Subject} from 'rxjs';
// import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range, set, clone, forIn } from 'lodash-es';
//import { collectionData } from 'rxfire/firestore';

function norm2(x,y) {
  return x*x + y*y;
}
function dist2(x1,y1,x2,y2) {
  return norm2(x1-x2, y1-y2);
}
function minus(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
}
function plus(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]]
}
function scale(p, s) {
  return [s*p[0], s*p[1]]
}
function round(p, gridsize) {
    return [Math.round(p[0]/gridsize)*gridsize, Math.round(p[1]/gridsize)*gridsize]
}
function permute_indices() {
    const forward = new Map();
    const backward = new Map();
    forEach(range(0,1000), function(a) {
        var b = random(0, 0xFFFFFF);
        while (backward.has(b)) {
            b = random(0, 0xFFFFFF);
        };
        forward[a] = b;
        backward[b] = a;
    });
    return {'f': forward, 'b': backward}
}
 

function draw(state, color, idx, commands_callback) {
  const used_idx = state['debug'] ? state.debug_mapping.f[idx] : idx + 1
  const trap_color= 'rgb(' + 
                 Math.floor(used_idx / (256 * 256)) + ', ' +
                 Math.floor(used_idx / (256)) % 256 + ', ' +
                 used_idx % 256  + ')'
  commands_callback(state['mouse_trap_ctx'], trap_color)
  commands_callback(state['ctx'], color)

}

function render(sprite_state) {
    const mouse_trap_ctx = sprite_state['mouse_trap_ctx'];
    const ctx = sprite_state['ctx'];
    ctx.clearRect(0,0,600,600);
    mouse_trap_ctx.clearRect(0,0,600,600);
    forEach(sprite_state.sprites, function(c, j) {
        draw(sprite_state, c.color, j, function(ctx, color) {
            ctx.beginPath();
            ctx.arc(c.offset[0], c.offset[1], c.radius, 0, 2 * Math.PI);
            ctx.fillStyle= color
            ctx.fill();
        });
    });

    forEach(sprite_state.edges, function(e) {
        var f = sprite_state.sprites[e[0]].offset;
        var t = sprite_state.sprites[e[1]].offset;
        ctx.lineWidth = 1;
        ctx.strokeStyle= 'black';
        ctx.beginPath();
        ctx.moveTo(f[0], f[1]);
        ctx.lineTo(t[0], t[1]);
        ctx.stroke();
    });
}
function* _mouse_processor(initial_state, hub, output_channel) {

  var sprite_state = clone(initial_state);
  var c = 0;
  while (true) {
      var prev_state = sprite_state;
      sprite_state = clone(sprite_state);
      sprite_state._src = 'sprite_input'
      var evt = yield;      
      if (evt._src) {
          console.log('EVT', evt)
      }
      switch (evt.type) {
        case 'override':
            sprite_state.sprites = evt.sprites;
            sprite_state._src = 'data';
            publish(hub, output_channel, sprite_state);
            break;
        case 'mousedown':
        if (evt.shiftKey) {
            if (document.getElementById('canvas').style['display'] == 'none') {
                document.getElementById('canvas').style['display'] = 'block';
                document.getElementById('mouse_trap').style['display'] = 'none';
            } else {
                document.getElementById('canvas').style['display'] = 'none';
                document.getElementById('mouse_trap').style['display'] = 'block';

            }
            publish(hub, output_channel, sprite_state);
            break;
        }
        if (prev_state.hovered == -1) {
            const image_data =  sprite_state['mouse_trap_ctx']
                .getImageData(evt.offsetX, evt.offsetY, 1, 1)
            const hovered_data = image_data.data;
        const hovered_unmapped = 
                hovered_data[0] * 256 * 256 + 
                hovered_data[1] * 256 + 
                hovered_data[2];
            var hovered = prev_state['debug'] ? 
                prev_state.debug_mapping.b[hovered_unmapped] : 
                hovered_unmapped;
            if (hovered > -1) {
                sprite_state.hovered = hovered;
                sprite_state.chosen_at = [evt.offsetX, evt.offsetY];
                sprite_state.sprite_chosen_at = sprite_state.sprites[hovered].offset;
            }
            break;
        }
        case 'mousemove':

            if (prev_state.hovered && prev_state.hovered > -1) {        
                const sprite_loc = prev_state.sprites[prev_state.hovered].offset
                const mouse_loc = [evt.offsetX, evt.offsetY]
                const new_loc = plus(minus(
                        prev_state.sprite_chosen_at, // S0
                        prev_state.chosen_at), // M0
                        mouse_loc);
                sprite_state.sprites[sprite_state.hovered].offset = new_loc;        
                sprite_state.last_modified = sprite_state.hovered;
                publish(hub, output_channel, sprite_state);
            break;
            }
        case 'mouseup':
            sprite_state.last_modified = sprite_state.hovered;
            sprite_state.hovered = -1;
            sprite_state.chosen_at = [];
        default:
        publish(hub, output_channel, sprite_state);
        break;
      }
      render(sprite_state);
    }
}
function* _data_processor(hub, mouse_topic) {
    while (true) {
        var prev_state = clone(sprite_state)
        var sprite_state = yield;
        var a = sprite_state.last_modified;
        if (typeof(a) != "undefined" && a != -1) {
            for (var j = 0; j < 3; j++) {
                if (j < a) {
                    sprite_state.sprites[j].offset = prev_state.sprites[j].offset;
                } 
            }
            var b = (a + 1) % 3; 
            var c = (a + 2) % 3;
            var modified_sprite_state = clone(sprite_state);
            modified_sprite_state.sprites[c].offset =
                scale(plus(
                    modified_sprite_state.sprites[b].offset,
                    modified_sprite_state.sprites[a].offset
                    ), 0.5)
            var is_data_src = sprite_state._src == 'data';
            if (!is_data_src) {
                window.setTimeout(function() {
                    publish(hub0, mouse_topic, {'type': 'override', 'sprites': 
                        modified_sprite_state.sprites})
                }, 0);
            }
        }
    }
}
function* _renderer() {
    while (true) {
        var sprite_state = yield;
        render(sprite_state);
    }
}
const hub0 = {
  'buffers': {
  },
  'consumers': {
  },
  'producers': {
  }
}
function step(hub) {
  forIn(hub.consumers, function(k, v, o) {
    if (hub.producers[k]) {
        var v = hub.producers[k].next()
        hub.consumers[k].next(v);
    }
  });
  forIn(hub.buffers, function(k, v, o) {
    consumer = hub.consumers.shift();
    hub.consumers.push(consumer);
    consumer.next(v);
  });
}
function register_consumer(hub, topic, consumer) {
  hub.consumers[topic] = consumer;
  step(hub);
}
function register_producer(hub, producer, topics) {
  hub.consumers[topic] = nonsumer
  step(hub);
}
function publish(hub, topic, v) {
    if (hub.consumers[topic]) {
        window.setTimeout(function() {
            hub.consumers[topic].next(v);
        },0);
    }
}
function init() {
    const canvas = document.getElementById('canvas');
    const mouse_trap = document.getElementById('mouse_trap');
    const ctx = canvas.getContext('2d');
    const mouse_trap_ctx = mouse_trap.getContext('2d');
    const colors = ['red', 'violet', 'blue']
    const initial_sprite_state = {
      'hovered': -1,
      'sprites': map(range(0,3), ((x,j)=>({
        'offset': [x*50+100,x*50+100],
        'radius': 10,
        'color': colors[j]}))),
      'debug': true,
      'debug_mapping': permute_indices(),
      'edges': [],
      '_gen': 0,
      'mouse_trap_ctx': document.getElementById('mouse_trap').getContext('2d'),
      'ctx': document.getElementById('canvas').getContext('2d')
    }
    const mouse_processor = _mouse_processor(initial_sprite_state, hub0, 'sprite_output');
    const data_processor = _data_processor(hub0, 'sprite_input');
    const renderer = _renderer();
    forEach(['mousedown', 'mousemove', 'mouseup'], function(name) {
        document.addEventListener(name, function(evt) {
            publish(hub0, 'sprite_input', evt)
        })
    });
    render(initial_sprite_state);
    register_consumer(hub0, 'sprite_input', mouse_processor);
    register_consumer(hub0, 'sprite_output', data_processor);
}
var a = {}
function* g() {
    yield
    a._g.next()
}
const _g = g()
a._g = _g
_g.next();

init();
