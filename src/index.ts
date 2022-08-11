import { collectionData } from 'rxfire/firestore';
import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {Hub} from './csp'
import {Vector, plus, minus, round, scale} from './vector'
import {IndicesPermutation, MouseConfig, MouseState, Sprite, init_mouse, 
    permute_indices, MOUSE_INPUT, MOUSE_OUTPUT, render} from './sprites'
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCBUZBYv1S8zQ_mnyJ6sqv5kA2FGCV6FZ0",
  authDomain: "okku-295708.firebaseapp.com",
  databaseURL: "https://okku-295708.firebaseio.com",
  projectId: "okku-295708",
  storageBucket: "okku-295708.appspot.com",
  messagingSenderId: "811021926948",
  appId: "1:811021926948:web:9891f2ba52b50d432a8eb1",
  measurementId: "G-YDVPJ431XV"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

if (location.hostname === "localhost") {
  db.useEmulator("localhost", 8080);
}

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
                hub.publish_value(mouse_input, {
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
    }
    const hub:Hub = new Hub();
    const data_processor = partial(_data_processor, hub, MOUSE_INPUT, MOUSE_OUTPUT);
    setTimeout(data_processor, 0);
    const initialConfig = (window as any); 
    initialConfig.__INITIAL_CONFIG__ = config
    /* Init mouse event listeners to listen on "document"*/
    init_mouse(config, initial_mouse_state, document, hub, render);


}
window.addEventListener('load', init)

