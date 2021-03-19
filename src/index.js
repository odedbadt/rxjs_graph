import { fromEvent, merge, of, Subject} from 'rxjs';
import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { collectionData } from 'rxfire/firestore';
// import { fromEvent, merge, of, Subject} from 'rxjs';
// import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
//import { collectionData } from 'rxfire/firestore';
import {publish, register_consumer, init_hub} from './csp.js'
import {plus, minus, round, scale} from './vector.js'
import {register_mouse_consumer, init_mouse, MOUSE_INPUT, MOUSE_OUTPUT} from './mouse.js'
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
                    publish(hub, mouse_topic, {
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

    const hub = init_hub();
    const data_processor = _data_processor(hub, MOUSE_INPUT);
    init_mouse(config, initial_sprite_state, document, hub, render);
    register_mouse_consumer(hub, data_processor);
    render(config, initial_sprite_state.sprites);
}

init();
