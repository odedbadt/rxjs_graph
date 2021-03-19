import { fromEvent, merge, of, Subject} from 'rxjs';
import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { collectionData } from 'rxfire/firestore';
// import { fromEvent, merge, of, Subject} from 'rxjs';
// import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
//import { collectionData } from 'rxfire/firestore';
import {publish, register_consumer} from './csp.js'
import {plus, minus, round, scale} from './vector.js'
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
 

function draw(config, color, idx, commands_callback) {
  const used_idx = config.debug ? config.debug_mapping.f[idx] : idx + 1
  const trap_color= 'rgb(' + 
                 Math.floor(used_idx / (256 * 256)) + ', ' +
                 Math.floor(used_idx / (256)) % 256 + ', ' +
                 used_idx % 256  + ')'
  commands_callback(config.mouse_trap_ctx, trap_color)
  commands_callback(config.ctx, color)

}

function render(config, sprites) {
    config.ctx.clearRect(0,0,600,600);
    config.mouse_trap_ctx.clearRect(0,0,600,600);
    forEach(sprites, function(c, j) {
        draw(config, c.color, j, function(ctx, color) {
            ctx.beginPath();
            ctx.arc(c.offset[0], c.offset[1], c.radius, 0, 2 * Math.PI);
            ctx.fillStyle= color
            ctx.fill();
        });
    });
}
function* _mouse_processor(config, initial_state, hub, output_channel) {

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
            if (sprite_state.dragged != -1 && sprite_state.sprites[sprite_state.dragged]) {
                sprite_state._src = 'data';
                // sprite_state.sprite_chosen_at = minus(plus(
                //             sprite_state.sprites[sprite_state.dragged].offset,
                //             prev_state.chosen_at),
                //             prev_state.mouse_loc);                          
                publish(hub, output_channel, sprite_state);
            }
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
        if (prev_state.dragged == -1) {
            const image_data =  config.mouse_trap_ctx
                .getImageData(evt.offsetX, evt.offsetY, 1, 1)
            const dragged_data = image_data.data;
        const dragged_unmapped = 
                dragged_data[0] * 256 * 256 + 
                dragged_data[1] * 256 + 
                dragged_data[2];
            var dragged = config.debug ? 
                config.debug_mapping.b[dragged_unmapped] : 
                dragged_unmapped;
            if (dragged > -1) {
                sprite_state.dragged = dragged;
                sprite_state.chosen_at = [evt.offsetX, evt.offsetY];
                sprite_state.dragged_sprite_offset = sprite_state.sprites[dragged].offset;
                sprite_state.sprite_chosen_at = sprite_state.sprites[dragged].offset;
            }
            break;
        }
        case 'mouseclick':
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
        if (prev_state.dragged == -1) {
            const image_data =  config.mouse_trap_ctx
                .getImageData(evt.offsetX, evt.offsetY, 1, 1)
            const dragged_data = image_data.data;
            const dragged_unmapped = 
                    dragged_data[0] * 256 * 256 + 
                    dragged_data[1] * 256 + 
                    dragged_data[2];
            var dragged = config.debug ? 
                config.debug_mapping.b[dragged_unmapped] : 
                dragged_unmapped;
            if (dragged > -1) {
                sprite_state.dragged = dragged;
                sprite_state.chosen_at = [evt.offsetX, evt.offsetY];
                sprite_state.dragged_sprite_offset = sprite_state.sprites[dragged].offset;
                sprite_state.sprite_chosen_at = sprite_state.sprites[dragged].offset;
            }
            break;
        }
        case 'mousemove':
            if (prev_state.dragged != -1) {        
                const sprite_loc = prev_state.sprites[prev_state.dragged].offset
                const mouse_loc = [evt.offsetX, evt.offsetY]
                //new_loc = mouse_loc + sprite_chosen_at - chosen_at
                //sprite_chosen_at = new_loc + chosen_at - mouse_loc
                const new_loc = plus(minus(
                        prev_state.sprite_chosen_at, // S0
                        prev_state.chosen_at), // M0
                        mouse_loc);
                sprite_state.dragged_sprite_offset = new_loc;        
                sprite_state.last_modified = sprite_state.dragged;
                sprite_state.mouse_loc = mouse_loc;
                publish(hub, output_channel, sprite_state);
            break;
            }
        case 'mouseup':
            if (sprite_state.dragged != -1) {
                sprite_state.sprites[sprite_state.dragged].offset =
                    sprite_state.dragged_sprite_offset;
            }
            sprite_state.dragged = -1;
        default:
        publish(hub, output_channel, sprite_state);
        break;
      }
      render(config, sprite_state.sprites);
    }
}
function* _data_processor(hub, mouse_topic) {
    var physical_state = {
        'objects': [
        ]
    }
    while (true) {
        const prev_physical_state = clone(physical_state)
        const sprite_state = yield;
        physical_state.objects = map(sprite_state.sprites, function(sprite, j) {
            if (j == sprite_state.dragged) {
                return {'offset': round(scale(sprite_state.dragged_sprite_offset, 1/40), 1)}
            } else {
                return {'offset': round(scale(sprite.offset, 1/40), 1)}
            }
        })
        if (sprite_state.dragged != -1) {
            const sprites = map(zip(physical_state.objects,
                sprite_state.sprites), function(obj_sprite_pair, j) {
                    const object = obj_sprite_pair[0];
                    const sprite = obj_sprite_pair[1];
                    var r = {
                        'offset': 

                        object ? scale(object.offset, 40) : sprite.offset,
                        'radius': sprite.radius,
                        'color': sprite.color
                    }                    
                    return r;
                }
            );
            if (sprite_state._src != 'data') {
                window.setTimeout(function() {
                    publish(hub0, mouse_topic, {
                        'type': 'override',
                        'sprites': sprites,
                        sprites})
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
function init() {
    const colors = ['red', 'violet', 'blue',  'white', 'green']
    const config = {
      'debug': true,
      'debug_mapping': permute_indices(),
      'mouse_trap_ctx': document.getElementById('mouse_trap').getContext('2d'),
      'ctx': document.getElementById('canvas').getContext('2d')
    }
    const initial_sprite_state = {
      'dragged': -1,
      'sprites': map(range(0,5), ((x,j)=>({
        'offset': [x*50+100,x*50+100],
        'radius': 10,
        'color': colors[j]}))),
      'edges': [],
    }
    const mouse_processor = _mouse_processor(config, initial_sprite_state, hub0, 'sprite_output');
    const data_processor = _data_processor(hub0, 'sprite_input');
    forEach(['mousedown', 'mousemove', 'mouseup'], function(name) {
        document.addEventListener(name, function(evt) {
            publish(hub0, 'sprite_input', evt)
        })
    });
    render(config, initial_sprite_state.sprites);
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
