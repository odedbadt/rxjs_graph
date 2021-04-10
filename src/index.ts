// import { collectionData } from 'rxfire/firestore';
// import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
// import {Hub, publish, register_consumer, init_hub} from './csp'
// import {Vector, plus, minus, round, scale} from './vector'
// import {IndicesPermutation, MouseConfig, MouseState, Sprite, 
//     register_mouse_consumer, init_mouse, permute_indices,
//     MOUSE_INPUT, MOUSE_OUTPUT, render} from './sprites'

// interface PhysicalObject     {
//     offset: Vector;
// }
// interface PhysicalState {
//     objects: Array<PhysicalObject>;
// }


// function* _data_processor(hub:Hub, mouse_topic:string):Generator<any, any, any> {
//     var physical_state:PhysicalState = {
//         'objects': [
//         ]
//     }
//     while (true) {
//         const prev_physical_state = clone(physical_state)
//         const sprite_state = yield;
//         physical_state.objects = map(sprite_state.sprites, function(sprite:Sprite, j:number) {
//             if (j == sprite_state.dragged) {
//                 return {'offset': round(scale(sprite_state.dragged_sprite_offset, 1/40), 1)}
//             } else {
//                 return {'offset': round(scale(sprite.offset, 1/40), 1)}
//             }
//         })
//         if (sprite_state.dragged != -1) {
//             const sprites = map(zip(physical_state.objects,
//                 sprite_state.sprites), function(
//                 obj_sprite_pair:[PhysicalObject, Sprite] , j:number) {
//                     const object = obj_sprite_pair[0];
//                     const sprite = obj_sprite_pair[1];
//                     var result:Sprite = {
//                         'offset': 

//                         object ? scale(object.offset, 40) : sprite.offset,
//                         'radius': sprite.radius,
//                         'color': sprite.color
//                     }                    
//                     return result;
//                 }
//             );
//             if (sprite_state._src != 'data') {
//                 window.setTimeout(function() {
//                     publish(hub, mouse_topic, {
//                         'type': 'override',
//                         'sprites': sprites})
//                 }, 0);
//             }
//         }
//     }
// }
// function init() {
//     console.log('I');
//     const colors = ['red', 'violet', 'blue',  'white', 'green']
//     const config:MouseConfig = {
//       'debug': true,
//       'debug_mapping': permute_indices(),
//       'mouse_trap_ctx': (document.getElementById('mouse_trap') as HTMLCanvasElement).getContext('2d'),
//       'ctx': (document.getElementById('canvas') as HTMLCanvasElement).getContext('2d')
//     }
//     const initial_sprite_state:MouseState = {
//       'dragged': -1,
//       'sprites': map(range(0,5), ((x:number, j:number)=>({
//         'offset': [x*50+100,x*50+100],
//         'radius': 10,
//         'color': colors[j]}))),
//       'edges': [],
//     }

//     const hub:Hub = init_hub();
//     const data_processor = _data_processor(hub, MOUSE_INPUT);
//     init_mouse(config, initial_sprite_state, document, hub, render);
//     register_mouse_consumer(hub, data_processor);
// }

// init();