import {forIn, forEach} from 'lodash-es';
import {CyclicBuffer} from './struct'
export class Event<T> {
    constructor(source_id: number, payload:T, parent:Event<any>) {
        this.parent= parent;
        this.payload = payload;
        this.source_id = source_id;
        this.event_mask = parent.event_mask | (1n << BigInt(source_id));
    }
    payload:T;
    parent:Event<any>;
    source_id: number;
    event_mask:bigint;


}
export class Subscription {
    callback: (value:any)=>void;
    buffer: CyclicBuffer<any>;
    constructor(buffer_size:number) {
        this.buffer = new CyclicBuffer<any>(buffer_size);
    }
    _consume(value:any) {
        console.log('_consume')
        if (this.callback) {
            console.log('calling back')

            console.log('Callback', this.callback)
            this.callback(value);
            console.log('called back')
        } else {
            console.log('buffering')
            // TODO: check overflow
            this.buffer.push(value);
            console.log('buffered')
        }
    }
    get():Promise<any> {
        const that = this
        if (!this.buffer.is_empty()) {
            return new Promise(function(resolve) {
                resolve(that.buffer.pop())
            });
        } else {
            return new Promise(function(resolve) {
                that.callback = resolve
            });
        }

    }

}
export class PubSub {
    subscriptions: Map<string, Array<Subscription> >;
    producer_called_callbacks: Map<string, (value:any)=>void>;
    constructor() {
         this.subscriptions = new Map<string, Array<Subscription>>();
         this.producer_called_callbacks = new Map<string, (value:any)=>void>();
    }
    subscribe(topic:string):Subscription {
        console.log('Subscribing to', topic)
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Array<Subscription>());
        }
        var subscription = new Subscription(1000);
        this.subscriptions.get(topic).push(subscription);
        return subscription;
    }
    publish_value(topic:string, value:any) {
        if (this.subscriptions.has(topic)) {
            forEach(this.subscriptions.get(topic), function(subscription:Subscription) {
                setTimeout(function() {
                    console.log(topic, 'consume')
                    subscription._consume(value);
                }, 0)
            });
        }
    }
}


