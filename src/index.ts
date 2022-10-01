import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {PubSub} from './pubsub'
import {Vector, plus, minus, round, scale} from './vector'
import {IndicesPermutation, MouseConfig, MouseState, Shape, init_mouse,
    permute_indices, MOUSE_INPUT, MOUSE_OUTPUT, render} from './shapes'

interface PhysicalObject {
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
    var subscription = pubsub.subscribe(MOUSE_OUTPUT);
    while (true) {
        const prev_physical_state = clone(physical_state)
        const shape_state = await subscription.get();
        console.log('GOT', shape_state);
        if (!shape_state) {
            continue
        }
        physical_state.objects = map(shape_state.shapes,
            function(shape:Shape, j:number) {
            if (j == shape_state.dragged) {
                return {
                    'offset': round(scale(shape_state.dragged_shape_offset, 1/4), 1)}
            } else {
                return {'offset': round(scale(shape.properties.offset, 1/4), 1)}
            }
        })
        if (shape_state.dragged != -1) {
            const shapes = new Map<number, Shape>(map(zip(physical_state.objects,
                shape_state.shapes.values()), function(
                obj_shape_pair: [PhysicalObject, Shape], j:number) {
                    const object = obj_shape_pair[0];
                    const shape = obj_shape_pair[1];
                    const result:Shape = {
                        'color': shape.color,
                        'offset': object ? scale(object.offset, 4) : shape.offset,
                        'shape': shape.shape,
                        'properties': {
                            'radius': shape.properties.radius
                        }
                    }                    
                    return [j, result];
                }
            ));
            if (shape_state._src != 'upstream') {
                pubsub.publish_value(mouse_input, {
                    'type': 'data',
                    '_src': 'upstream',
                    'shapes': shapes});
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
    const initial_shape_state:MouseState = {
      'dragged': -1,
      'shapes': new Map<number, Shape>(map(range(0,5),
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
      'shapes': new Map<number, Shape>(map(range(0,5),
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

