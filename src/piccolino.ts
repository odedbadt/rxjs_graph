import { collectionData } from 'rxfire/firestore';
import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {Hub} from './csp'
import {Vector, plus, minus, round, scale} from './vector'
import {IndicesPermutation, MouseConfig, MouseState, Sprite, init_mouse, 
    permute_indices, MOUSE_INPUT, MOUSE_OUTPUT, render} from './sprites'

interface PhysicalObject     {
    offset: Vector;
}
interface PhysicalState {
    objects: Array<PhysicalObject>;
}


async function _data_processor(hub:Hub, mouse_input:string, mouse_output:string):Promise<any> {
    var physical_state:PhysicalState = {
        'objects': [
        ]
    }
    while (true) {
        const prev_physical_state = clone(physical_state)
        const sprite_state = await hub.consume_value(mouse_output);
        physical_state.objects = map(sprite_state.sprites, 
            function(sprite:Sprite, j:number) {
            if (j == sprite_state.dragged) {
                return {

                    'offset': round(scale(sprite_state.dragged_sprite_offset, 1/40), 1)}
            } else {
                return {'offset': round(scale(sprite.properties.offset, 1/40), 1)}
            }
        })
        if (sprite_state.dragged != -1) {
            const sprites = new Map<number, Sprite>(map(zip(physical_state.objects,
                sprite_state.sprites.values()), function(
                obj_sprite_pair: [PhysicalObject, Sprite], j:number) {
                    const object = obj_sprite_pair[0];
                    const sprite = obj_sprite_pair[1];
                    const result:Sprite = {
                        'color': sprite.color,
                        'offset': object ? scale(object.offset, 40) : sprite.offset,
                        'shape': sprite.shape,
                        'properties': {
                            'radius': sprite.properties.radius
                        }
                    }                    
                    return [j, result];
                }
            ));
            if (sprite_state.type != 'upstream') {
                hub.publish_value(mouse_input, {
                    'type': 'upstream',
                    '_src': 'upstream',
                    'sprites': sprites});
            }
        }
    }
}
function init() {
    console.log('I');
    const colors = ['red', 'violet', 'blue',  'white', 'green']
    const config:MouseConfig = {
      'debug': true,
      'debug_mapping': permute_indices(),
      'mouse_trap_ctx': (document.getElementById('mouse_trap') as HTMLCanvasElement).getContext('2d'),
      'ctx': (document.getElementById('canvas') as HTMLCanvasElement).getContext('2d')
    }
    const initial_sprite_state:MouseState = {
      'dragged': -1,
      'sprites': new Map<number, Sprite>(map(range(0,5), 
          ((x:number, j:number)=>[j, {
        'shape': 'circle',
        'offset': [x*50+100,x*50+100],
        'properties': {            
            'radius': 10
        },
        'color': colors[j]
    }]))),
      'edges': [],
    }

    const hub:Hub = new Hub();
    const data_processor = partial(_data_processor, hub, MOUSE_INPUT, MOUSE_OUTPUT);
    setTimeout(data_processor, 0);

    init_mouse(config, initial_sprite_state, document, hub, render);
}
window.addEventListener('load', init)

