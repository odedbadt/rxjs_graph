import {forIn, forEach} from 'lodash-es';

export type Consumer<T = any> = Generator<any, any, T>
export type Producer<T = any> = Generator<T, any, any>

export interface Hub {
  'buffers': Map<string, Function>;
  'consumers': Map<string, Array<Consumer>>;
  'producers': Map<string, Array<Producer>>;
}

function step(hub:Hub) {
    forIn(hub.consumers, function(k:string, consumer:Consumer<any>):void {
        if (hub.producers.has(k)) {
            let producers:Array<Producer> = hub.producers.get(k)
            if (producers.length > 0) {
                let producer:Producer = producers.pop()
                consumer.next(producer.next().value);
            } else {
                hub.producers.delete(k);
            }
        }
    });
    // forIn(hub.buffers, function(topic:string, :any) {
    //     const consumer = hub.consumers.shift();
    //     hub.consumers.push(consumer);
    //     consumer.next(v.value);
    // });
}

export function register_consumer(hub:Hub, topic:string, consumer:Consumer) {
  var arr = hub.consumers.get(topic);
  if (arr == null) {
      arr = [];
      hub.consumers.set(topic, arr)
  }
  arr.push(consumer);
  step(hub);
}

export function register_producer(hub:Hub, 
    producer:Producer, 
    topic:string):void {
  var arr:Array<Producer> = hub.producers.get(topic);
  if (arr == null) {
      arr = [];
      hub.producers.set(topic, arr)
  }
  arr.push(producer);
  step(hub);
}

export function register_multiple_consumers(hub:Hub, topic:string, consumers:Array<Consumer>):void {
  var arr:Array<Consumer> = hub.consumers.get(topic);
  if (arr == null) {
      arr = [];
      hub.consumers.set(topic, arr)
  }
  forIn(consumers, (consumer:Consumer) =>
      arr.push(consumer));
}

export function publish(hub:Hub, topic:string, v:any):void {
    if (hub.consumers.has(topic)) {
        window.setTimeout(function() {
            forIn(hub.consumers.get(topic), (consumer:Consumer) =>
                consumer.next(v));
        },0);
    }
}

export function init_hub():Hub {
    return {
      'buffers': new Map(),
      'consumers': new Map(),
      'producers': new Map()
    }
}