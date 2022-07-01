import {forIn, forEach} from 'lodash-es';
import {CyclicBuffer} from './struct'

export class Hub {
    consumer_called_callbacks: Map<string, Function>;
    producer_called_callbacks: Map<string, Function>;
    buffers: Map<string, CyclicBuffer<any>>
    constructor() {
         this.consumer_called_callbacks = new Map<string, Function>();
         this.producer_called_callbacks = new Map<string, Function>();
         this.buffers = new Map<string, CyclicBuffer<any>>();
    }
    consume_value(topic:string):Promise<any> {    
        const that = this;
        if (this.buffers.has(topic) && !this.buffers.get(topic).is_empty()) {
            return this.buffers.get(topic).pop();
        }
        if (this.consumer_called_callbacks.has(topic)) {
            const consumer_called_callback = this.consumer_called_callbacks.get(topic);
            consumer_called_callback();
        }

        const consumer_promise = new Promise(function(resolve) {
            that.producer_called_callbacks.set(topic, function(v:any) {
                resolve(v);
            })
        });
        return consumer_promise;
    }
    publish_value(topic:string, value:any):Promise<void> {
        const that = this;

        if (this.producer_called_callbacks.has(topic)) {
            const producer_called_callback = this.producer_called_callbacks.get(topic);
            producer_called_callback(value);
        } else {
            if (!this.buffers.has(topic)) {
                this.buffers.set(topic, new CyclicBuffer<any>(1000));
            }
            this.buffers.get(topic).push(value)
        }
        const producer_promise:Promise<void> = new Promise<void>(function(resolve) {
            that.consumer_called_callbacks.set(topic, resolve);
        });
        return producer_promise;
    }
}
