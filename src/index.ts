import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {PubSub} from './pubsub'
import {Vector, plus, minus, round, scale} from './vector'
import {IndicesPermutation, MouseConfig, MouseState, Sprite, init_mouse, 
    permute_indices, MOUSE_INPUT, MOUSE_OUTPUT, render} from './sprites'

interface PhysicalObject     {
    offset: Vector;
}
interface PhysicalState {
    objects: Array<PhysicalObject>;
}


async function _data_processor(pubsub:PubSub, mouse_input:string, mouse_output:string):Promise<any> {
    var physical_state:PhysicalState = {
        'objects': [
        ]
    }
    var subscription = pubsub.subscribe(mouse_output);
    while (true) {
        const prev_physical_state = clone(physical_state)
        const sprite_state = await subscription.get();
        physical_state.objects = map(sprite_state.sprites, 
            function(sprite:Sprite, j:number) {
            if (j == sprite_state.dragged) {
                return {
                    'offset': round(scale(sprite_state.dragged_sprite_offset, 1/4), 1)}
            } else {
                return {'offset': round(scale(sprite.properties.offset, 1/4), 1)}
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
                        'offset': object ? scale(object.offset, 4) : sprite.offset,
                        'shape': sprite.shape,
                        'properties': {
                            'radius': sprite.properties.radius
                        }
                    }                    
                    return [j, result];
                }
            ));
            if (sprite_state._src != 'upstream') {
                pubsub.publish_value(mouse_input, {
                    'type': 'data',
                    '_src': 'upstream',
                    'sprites': sprites});
            }
        }
    }
}

function init() {
    const colors = ['red', 'violet', 'blue',  'white', 'green']
    const config:MouseConfig = {
      'debug': true,
      'debug_mapping': permute_indices(),
      'mouse_trap_ctx': (document.getElementById('mouse_trap') as HTMLCanvasElement).getContext('2d'),
      'canvas': (document.getElementById('canvas') as HTMLCanvasElement),
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
        }])) ),
      'edges': [],
      'last_modified':null
    }
    const initial_mouse_state:MouseState = {
      'dragged': -1,
      'sprites': new Map<number, Sprite>(map(range(0,5),
              ((x:number, j:number)=>[j, {
            'shape': 'circle',
            'offset': [x*50+100,x*50+100],
            'properties': {
                'radius': 10
            },
            'color': colors[j]
        }])) ),
      'edges': [],
      'last_modified':null
    }
    const pubsub:PubSub = new PubSub();
    const data_processor = partial(_data_processor, pubsub, MOUSE_INPUT, MOUSE_OUTPUT);
    setTimeout(data_processor, 0);
    const initialConfig = (window as any); 
    initialConfig.__INITIAL_CONFIG__ = config
    /* Init mouse event listeners to listen on "document"*/
    init_mouse(config, initial_mouse_state, document, pubsub, render);


}
window.addEventListener('load', init)

