import {publish, register_consumer} from './csp.js'
import {forEach, clone} from 'lodash-es';
import {plus, minus, round, scale} from './vector.js'

export const MOUSE_INPUT = 'MOUSE_INPUT';
export const MOUSE_OUTPUT = 'MOUSE_OUTPUT';

function* _mouse_processor(config, initial_state, hub, output_channel, render) {

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
    }
}
export function init_mouse(config, initial_sprite_state, elem, hub, render) {
    forEach(['mousedown', 'mousemove', 'mouseup'], function(name) {
        elem.addEventListener(name, function(evt) {
            publish(hub, MOUSE_INPUT, evt)
        })
    });
    const mouse_processor = _mouse_processor(config, 
        initial_sprite_state, hub, 
        MOUSE_OUTPUT, 
        render);

    register_consumer(hub, MOUSE_INPUT, mouse_processor);

}

export function register_mouse_consumer(hub, consumer) {
    register_consumer(hub, MOUSE_OUTPUT, consumer);
}


