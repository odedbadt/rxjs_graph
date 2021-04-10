// import {Hub, publish, register_consumer, Consumer} from './csp'
// import {forIn, forEach, clone, range, random} from 'lodash-es';
// import {Vector, plus, minus, round, scale} from './vector'

// export const MOUSE_INPUT = 'MOUSE_INPUT';
// export const MOUSE_OUTPUT = 'MOUSE_OUTPUT';



// export interface IndicesPermutation {
//     f: Map<number,number>,
//     b: Map<number,number>,
// }

// export interface MouseConfig {
//     debug: boolean;
//     debug_mapping?: IndicesPermutation;
//     ctx: CanvasRenderingContext2D;
//     mouse_trap_ctx: CanvasRenderingContext2D
// }

// export interface Sprite {
//     offset: Vector;
//     radius: number;
//     color: string
// }

// export interface MouseState {
//     dragged: number;
//     sprites: Array<Sprite>;
//     edges: Array<[number,number]>;
// }

// export function permute_indices():IndicesPermutation {
//     const forward:Map<number,number> = new Map();
//     const backward:Map<number,number> = new Map();
//     forIn(range(0,1000), function(a:number) {
//         var b = random(0, 0xFFFFFF);
//         while (backward.has(b)) {
//             b = random(0, 0xFFFFFF);
//         };
//         forward.set(a, b);
//         backward.set(b, a);
//     });
//     return {'f': forward, 'b': backward}
// }

// function _draw(config:MouseConfig, color:string, 
//               idx:number, commands_callback:Function):void {
//   const used_idx = config.debug ? config.debug_mapping.f.get(idx) : idx
//   const trap_color= 'rgb(' + 
//                  Math.floor(used_idx / (256 * 256)) + ', ' +
//                  Math.floor(used_idx / (256)) % 256 + ', ' +
//                  used_idx % 256  + ')'
//   commands_callback(config.mouse_trap_ctx, trap_color)
//   commands_callback(config.ctx, color)
// }

// export function render(config:MouseConfig, sprites:Array<Sprite>):void {
//     config.ctx.clearRect(0,0,600,600);
//     config.mouse_trap_ctx.clearRect(0,0,600,600);
//     forEach(sprites, function(sprite:Sprite, j:number) {

//         _draw(config, sprite.color, j, function(ctx:CanvasRenderingContext2D, color:string) {
//             ctx.beginPath();
//             ctx.arc(sprite.offset[0], sprite.offset[1], sprite.radius, 0, 2 * Math.PI);
//             ctx.fillStyle= color
//             ctx.fill();
//         });
//     });
// }

// function* _mouse_processor(config:MouseConfig, 
//     initial_state:MouseState, hub:Hub, 
//     output_topic:string, 
//     render:Function):Generator<any,any,any> {

//   var mouse_state = clone(initial_state);
//   var c = 0;
//   while (true) {
//       var prev_state = mouse_state;
//       mouse_state = clone(mouse_state);
//       mouse_state._src = 'sprite_input'
//       var evt = yield;      
//       switch (evt.type) {
//         case 'override':
//             mouse_state.sprites = evt.sprites;
//             if (mouse_state.dragged != -1 && mouse_state.sprites[mouse_state.dragged]) {
//                 mouse_state._src = 'data';
//                 publish(hub, output_topic, mouse_state);
//             }
//             break;
//         case 'mousedown':
//         if (evt.shiftKey) {
//             if (document.getElementById('canvas').style['display'] == 'none') {
//                 document.getElementById('canvas').style['display'] = 'block';
//                 document.getElementById('mouse_trap').style['display'] = 'none';
//             } else {
//                 document.getElementById('canvas').style['display'] = 'none';
//                 document.getElementById('mouse_trap').style['display'] = 'block';

//             }
//             publish(hub, output_topic, mouse_state);
//             break;
//         }
//         mouse_state.down_without_move = true;
//         if (prev_state.dragged == -1) {
//             const image_data =  config.mouse_trap_ctx
//                 .getImageData(evt.offsetX, evt.offsetY, 1, 1)
//             const dragged_data = image_data.data;
//         const dragged_unmapped = 
//                 dragged_data[0] * 256 * 256 + 
//                 dragged_data[1] * 256 + 
//                 dragged_data[2];
//             var dragged = config.debug ? 
//                 config.debug_mapping.b.get(dragged_unmapped) : 
//                 dragged_unmapped;
//             if (dragged > -1) {
//                 mouse_state.dragged = dragged;
//                 mouse_state.chosen_at = [evt.offsetX, evt.offsetY];
//                 mouse_state.dragged_sprite_offset = mouse_state.sprites[dragged].offset;
//                 mouse_state.sprite_chosen_at = mouse_state.sprites[dragged].offset;
//             }
//             break;
//         }
//         case 'mousemove':
//             mouse_state.down_without_move = false
//             if (prev_state.dragged != -1) {        
//                 const sprite_loc = prev_state.sprites[prev_state.dragged].offset
//                 const mouse_loc = [evt.offsetX, evt.offsetY] as Vector
//                 //new_loc = mouse_loc + sprite_chosen_at - chosen_at
//                 //sprite_chosen_at = new_loc + chosen_at - mouse_loc
//                 const new_loc = plus(minus(
//                         prev_state.sprite_chosen_at, // S0
//                         prev_state.chosen_at), // M0
//                         mouse_loc);
//                 mouse_state.dragged_sprite_offset = new_loc;        
//                 mouse_state.last_modified = mouse_state.dragged;
//                 mouse_state.mouse_loc = mouse_loc;
//                 publish(hub, output_topic, mouse_state);
//             break;
//             }
//         case 'mouseup':
//             if (mouse_state.dragged != -1) {
//                 mouse_state.sprites[mouse_state.dragged].offset =
//                     mouse_state.dragged_sprite_offset;
//             }
//             if (prev_state.down_without_move) {
//                 // click

//             }
//             mouse_state.down_without_move = false;
//             mouse_state.dragged = -1;
//         default:
//         publish(hub, output_topic, mouse_state);
//         break;
//       }
//       render(config, mouse_state.sprites);
//     }
// }

// export function init_mouse(config:MouseConfig, 
//     initial_mouse_state:MouseState, 
//     node:Node, hub:Hub, render:Function):void {
//     forIn(['mousedown', 'mousemove', 'mouseup'], function(name:string) {
//         node.addEventListener(name, function(evt:MouseEvent) {
//             publish(hub, MOUSE_INPUT, evt)
//         })
//     });
//     const mouse_processor = _mouse_processor(config, 
//         initial_mouse_state, hub, 
//         MOUSE_OUTPUT, 
//         render);

//     register_consumer(hub, MOUSE_INPUT, mouse_processor);

// }

// export function register_mouse_consumer(hub:Hub, consumer:Consumer):void {
//     register_consumer(hub, MOUSE_OUTPUT, consumer);
// }


