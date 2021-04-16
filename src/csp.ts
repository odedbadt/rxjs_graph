import {forIn, forEach} from 'lodash-es';


export interface Hub {
  'consumers': Map<string, Promise<any> >;
  'producers': Map<string, Promise<void> >;
  'consumer_called_callbacks': Map<string, Function>;
  'producer_called_callbacks': Map<string, Function>;
  'buffers': Map<string, Array<any>>;
}

export function consume_value(hub:Hub, topic:string):Promise<any> {    
    if (hub.buffers.has(topic) && hub.buffers.get(topic).length > 0) {
        return hub.buffers.get(topic).pop();
    }
    if (hub.consumer_called_callbacks.has(topic)) {
        const consumer_called_callback = hub.consumer_called_callbacks.get(topic);
        consumer_called_callback();
    }

    const consumer_promise = new Promise(function(resolve) {
        hub.producer_called_callbacks.set(topic, function(v:any) {
            resolve(v);
        })
    });
    return consumer_promise;
}

export function publish_value(hub:Hub, topic:string, value:any):Promise<void> {
    if (hub.producer_called_callbacks.has(topic)) {
        const producer_called_callback = hub.producer_called_callbacks.get(topic);
        producer_called_callback(value);
    } else {
        if (!hub.buffers.has(topic)) {
            hub.buffers.set(topic, new Array<any>());
        }
        hub.buffers.get(topic).push(value)
    }
    const producer_promise:Promise<void> = new Promise<void>(function(resolve) {
        hub.consumer_called_callbacks.set(topic, resolve);
    });
    return producer_promise;
}

export function init_hub() {
    return {
        'consumers': new Map<string, Promise<any>>(),
        'producers': new Map<string, Promise<any>>(),
         'consumer_called_callbacks': new Map<string, Function>(),
         'producer_called_callbacks': new Map<string, Function>(),
         'buffers': new Map<string, Array<any>>()

    }
}