import {PubSub} from './pubsub'
import {partial, forIn, forEach, slice, clone, range, random, bind} from 'lodash-es';
import {Vector, plus, minus, round, scale} from './vector'

export const MOUSE_INPUT = 'MOUSE_INPUT';
export const MOUSE_OUTPUT = 'MOUSE_OUTPUT';


export interface IndicesPermutation {
    f: Map<number,number>,
    b: Map<number,number>,
}

export interface MouseConfig {
    debug: boolean;
    debug_mapping?: IndicesPermutation;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    mouse_trap_ctx: CanvasRenderingContext2D
}


export interface MouseState {
    dragged: number;
    shapes: Map<number, Shape>;
    edges: Array<[number,number]>;
    down_without_move?:boolean,
    chosen_at?:Vector;
    dragged_shape_offset?:Vector;
    shape_chosen_at?:Vector;
    last_modified: number;
    _src?: any;
    mouse_loc?:Vector;
    clicked_shape?: number;
}

export interface Shape {
    color: string,
    shape: string,
    offset: Vector,
    properties:any
}


export type CommandsCallback = (t1: any, ...ts: any[]) => unknown
export function permute_indices():IndicesPermutation {
    const forward:Map<number,number> = new Map();
    const backward:Map<number,number> = new Map();
    forIn(range(0,1000), function(a:number) {
        var b = random(0, 0xFFFFFF);
        while (backward.has(b)) {
            b = random(0, 0xFFFFFF);
        };
        forward.set(a, b);
        backward.set(b, a);
    });
    return {'f': forward, 'b': backward}
}
function _rect(shape_properties:any,
               ctx:CanvasRenderingContext2D,
               offset:Vector,
               color:string):void {
            ctx.fillStyle = color;
            ctx.fillRect(shape_properties.offset[0], shape_properties.offset[1],
                         shape_properties.width, shape_properties.height);
        };
function _circle(shape_properties:any,
                 ctx:CanvasRenderingContext2D,
                 offset:Vector,
                 color:string):void {
            ctx.beginPath();
            ctx.arc(offset[0], offset[1], 
                    shape_properties.radius, 0, 2 * Math.PI);
        };
function _poly(shape_properties:any,
               ctx:CanvasRenderingContext2D,
               offset:Vector,
               color:string):void {
            if (shape_properties.vertices.length == 0) {
                return
            }
            ctx.beginPath();
            ctx.moveTo(offset[0], offset[1]);
            forEach(shape_properties, function(vertex:Vector) {
                ctx.lineTo(vertex[0], vertex[1]);
            })
            if (shape_properties.closed) {
                ctx.lineTo(shape_properties.vertices[0], shape_properties.vertices[1]);
            }
            ctx.fill();
        };
const SHAPES:Map<string, CommandsCallback> = new Map<string, CommandsCallback>([
    ['rect', _rect],
    ['circle', _circle],
    ['poly', _poly]
    ])

function _draw(config:MouseConfig, offset:Vector, color:string, 
              idx:number, commands_callback:Function):void {
  const used_idx = config.debug ? config.debug_mapping.f.get(idx) : idx
  const trap_color = 'rgb(' + 
                 Math.floor(used_idx / (256 * 256)) + ', ' +
                 Math.floor(used_idx / (256)) % 256 + ', ' +
                 used_idx % 256  + ')'
  config.mouse_trap_ctx.fillStyle = trap_color;
  config.mouse_trap_ctx.strokeStyle = trap_color;
  commands_callback(config.mouse_trap_ctx, offset, trap_color)
  config.mouse_trap_ctx.fill();
  config.mouse_trap_ctx.stroke();

  config.ctx.fillStyle = color;
  config.ctx.strokeStyle = color;
  commands_callback(config.ctx, offset, color)
  config.ctx.fill();
  config.ctx.stroke();

}

export function render(config:MouseConfig, shapes:Map<number, Shape>):void {
    config.ctx.clearRect(0,0,600,600);
    config.mouse_trap_ctx.clearRect(0,0,600,600);
    // iterate by key order
    var zindices = Array.from(shapes.keys());
    zindices.sort();
    shapes.forEach(function(shape:Shape, shape_id:number) {
        if (!SHAPES.has(shape.shape)) {
            throw new Error('No such shape: ' + shape.shape)
        }
        const shape_callback = partial(SHAPES.get(shape.shape), shape.properties);
        _draw(config, shape.offset, shape.color, shape_id, shape_callback)
    });
}
class MouseProcessor {
    state: MouseState;
    config: MouseConfig;
    pubsub:PubSub;
    constructor(config: MouseConfig, state: MouseState, pubsub:PubSub) {
        this.config = config;
        this.state = state;
        this.pubsub = pubsub;
    }
}

async function mouse_processor_process():Promise<any> {
      // Called with every mouse event
      //
      var mouse_state = clone(this.state);
      var c = 0;
      var subscription = this.pubsub.subscribe(MOUSE_INPUT)
      var config = this.config;
      while (true) {
          render(this.config, this.state.shapes);
          var prev_state = mouse_state;
          mouse_state = clone(mouse_state);
          mouse_state._src = 'user_input'
          const evt = await subscription.get();
          if (!evt) {
            continue;
          }
          const rect = this.config.canvas.getBoundingClientRect()
          const x = evt.clientX - rect.left
          const y = evt.clientY - rect.top
          if (evt._src == 'upstream') {
              mouse_state._src = 'upstream';
          }
          switch (evt.type) {
            case 'upstream':
                mouse_state.shapes = evt.shapes;
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
                break;
            }
            mouse_state.down_without_move = true;
            if (prev_state.dragged == -1) {
                const image_data = config.mouse_trap_ctx
                    .getImageData(x, y, 1, 1)
                const dragged_data = image_data.data;
                const dragged_unmapped =
                        dragged_data[0] * 256 * 256 +
                        dragged_data[1] * 256 +
                        dragged_data[2];
                console.log(this.config.debug_mapping)
                const dragged = this.config.debug ?
                      config.debug_mapping.b.get(dragged_unmapped) :
                      dragged_unmapped;
                console.log(evt,
    x, y,
                    dragged_data, dragged_unmapped, config.debug_mapping.b.get(dragged_unmapped), config.debug_mapping.f.get(dragged_unmapped))
                if (dragged > -1) {
                    console.log(this.config.debug_mapping.f.get(0), config.debug_mapping.f.get(1))
                    mouse_state.dragged = dragged;
                    mouse_state.chosen_at = [x, y];
                    mouse_state.dragged_shape_offset = mouse_state.shapes.get(dragged).offset;
                    mouse_state.shape_chosen_at = mouse_state.shapes.get(dragged).offset;
                }
                break;
            }
            case 'mousemove':
                mouse_state.down_without_move = false
                if (prev_state.dragged != -1) {
                    const shape_loc = prev_state.shapes.get(prev_state.dragged).offset
                    const mouse_loc = [x, y] as Vector
                    //new_loc = mouse_loc + shape_chosen_at - chosen_at
                    //shape_chosen_at = new_loc + chosen_at - mouse_loc
                    const new_loc = plus(minus(
                            prev_state.shape_chosen_at, // S0
                            prev_state.chosen_at), // M0
                            mouse_loc);
                    mouse_state.dragged_shape_offset = new_loc;
                    mouse_state.shapes.get(mouse_state.dragged).offset =
                        mouse_state.dragged_shape_offset;
                    mouse_state.last_modified = mouse_state.dragged;
                    mouse_state.mouse_loc = mouse_loc;
                    mouse_state.clicked_shape = prev_state.dragged;
                    break;
                }
            case 'mouseup':
                if (mouse_state.dragged != -1) {
                    mouse_state.shapes.get(mouse_state.dragged).offset =
                        mouse_state.dragged_shape_offset;
                }
                if (prev_state.down_without_move) {
                    mouse_state.clicked_shape = mouse_state.dragged;

                }
                mouse_state.down_without_move = false;
                mouse_state.dragged = -1;
            default:
            break;
          }
          //console.log('SENDING', mouse_state);
          //this.pubsub.publish_value(MOUSE_OUTPUT, mouse_state);
        }
}

export function init_mouse(config:MouseConfig, 
    initial_mouse_state:MouseState, 
    node:Node, pubsub:PubSub, render:Function):void {

    ['mousedown', 'mousemove', 'mouseup'].forEach(function(name:string) {
        console.log('Adding event listener for ' + name);
        node.addEventListener(name, function(evt:MouseEvent) {
            setTimeout(bind(pubsub.publish_value, pubsub, MOUSE_INPUT, evt), 0)
        })
    });
    const mouse_processor = new MouseProcessor(config, initial_mouse_state, pubsub);

    setTimeout(bind(mouse_processor_process, mouse_processor), 0);
}

