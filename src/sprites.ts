import {Hub} from './csp'
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

export interface Sprite {
    color: string,
    shape: string,
    offset: Vector,
    properties:any
}


export interface MouseState {
    dragged: number;
    sprites: Map<number, Sprite>;
    edges: Array<[number,number]>;
}

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
const SHAPES:Map<string,Function> = new Map<string,Function>([
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

export function render(config:MouseConfig, sprites:Map<number, Sprite>):void {
    config.ctx.clearRect(0,0,600,600);
    config.mouse_trap_ctx.clearRect(0,0,600,600);
    // iterate by key order
    var zindices = Array.from(sprites.keys());
    zindices.sort();
    sprites.forEach(function(sprite:Sprite, sprite_id:number) {
        if (!SHAPES.has(sprite.shape)) {
            throw new Error('No such shape: ' + sprite.shape)
        }
        const shape_callback = partial(
            SHAPES.get(sprite.shape), sprite.properties);
        _draw(config, sprite.offset, sprite.color, sprite_id, shape_callback)
    });
}

async function _mouse_processor(config:MouseConfig, 
    initial_state:MouseState, hub:Hub, 
    input_topic:string, 
    output_topic:string, 
    render:Function):Promise<any> {
  // Called with every mouse event
  // 
  var mouse_state = clone(initial_state);
  var c = 0;
  while (true) {
      render(config, mouse_state.sprites);
      var prev_state = mouse_state;
      mouse_state = clone(mouse_state);
      mouse_state._src = 'user_input'
      const evt = await hub.consume_value(input_topic);
      const rect = config.canvas.getBoundingClientRect()
      const x = evt.clientX - rect.left
      const y = evt.clientY - rect.top
      if (evt._src == 'upstream') {
          mouse_state._src = 'upstream';
      }
      switch (evt.type) {
        case 'upstream':
            mouse_state.sprites = evt.sprites;
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
            console.log(config.debug_mapping)
            const dragged = config.debug ? 
                  config.debug_mapping.b.get(dragged_unmapped) : 
                  dragged_unmapped;
            console.log(evt, 
x, y,
                dragged_data, dragged_unmapped, config.debug_mapping.b.get(dragged_unmapped), config.debug_mapping.f.get(dragged_unmapped))
            if (dragged > -1) {
                console.log(config.debug_mapping.f.get(0), config.debug_mapping.f.get(1))
                mouse_state.dragged = dragged;
                mouse_state.chosen_at = [x, y];
                mouse_state.dragged_sprite_offset = mouse_state.sprites.get(dragged).offset;
                mouse_state.sprite_chosen_at = mouse_state.sprites.get(dragged).offset;
            }
            break;
        }
        case 'mousemove':
            mouse_state.down_without_move = false
            if (prev_state.dragged != -1) {        
                const sprite_loc = prev_state.sprites.get(prev_state.dragged).offset
                const mouse_loc = [x, y] as Vector
                //new_loc = mouse_loc + sprite_chosen_at - chosen_at
                //sprite_chosen_at = new_loc + chosen_at - mouse_loc
                const new_loc = plus(minus(
                        prev_state.sprite_chosen_at, // S0
                        prev_state.chosen_at), // M0
                        mouse_loc);
                mouse_state.dragged_sprite_offset = new_loc;        
                mouse_state.sprites.get(mouse_state.dragged).offset =
                    mouse_state.dragged_sprite_offset;
                mouse_state.last_modified = mouse_state.dragged;
                mouse_state.mouse_loc = mouse_loc;
                mouse_state.clicked_sprite = prev_state.dragged;
                break;
            }
        case 'mouseup':
            if (mouse_state.dragged != -1) {
                mouse_state.sprites.get(mouse_state.dragged).offset =
                    mouse_state.dragged_sprite_offset;
            }
            if (prev_state.down_without_move) {
                mouse_state.clicked_sprite = mouse_state.dragged;

            }
            mouse_state.down_without_move = false;
            mouse_state.dragged = -1;
        default:
        break;
      }
      hub.publish_value(output_topic, mouse_state);
    }
}

export function init_mouse(config:MouseConfig, 
    initial_mouse_state:MouseState, 
    node:Node, hub:Hub, render:Function):void {
    console.log('IM');

    ['mousedown', 'mousemove', 'mouseup'].forEach(function(name:string) {
        console.log('Adding event listener for ' + name);
        node.addEventListener(name, function(evt:MouseEvent) {
            setTimeout(bind(hub.publish_value, hub, MOUSE_INPUT, evt), 0)
        })
    });
    const mouse_processor = partial(_mouse_processor, 
        config, 
        initial_mouse_state,
        hub, 
        MOUSE_INPUT,
        MOUSE_OUTPUT, 
        render);
    setTimeout(mouse_processor, 0);
}

