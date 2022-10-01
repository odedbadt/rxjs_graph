import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {PubSub, Subscription} from './pubsub'
import {CyclicBuffer} from './struct'


function test_pubsub() {
    const pubsub = new PubSub();
    async function producer(TTL:number, pace:number) {
        if (TTL < 0) {
            return
        }
        console.log(TTL, 'publishing ' + TTL);
        pubsub.publish_value('T', TTL);
        console.log(TTL, 'published');
        setTimeout(partial(producer, TTL - 1, pace), pace)
    }
    async function consumer(subscription:Subscription, TTL:number, pace:number, log:string) {
        console.log(log, 'Consuming from', subscription, TTL, pace)
        if (TTL < 0) {
            return
        }
        var v = await subscription.get();
        console.log(log, TTL, 'consumed ', v);
        setTimeout(partial(consumer, subscription, TTL - 1, pace, log ), pace)
    }
    pubsub.publish_value('T', 'B1')
    pubsub.publish_value('T', 'B2')
    setTimeout(partial(producer,  10, 500), 500);
    const subscription = pubsub.subscribe('T');
    console.log('G', subscription);
    setTimeout(partial(consumer, subscription, 300, 100, 'A'), 0);
    const subscriptionB = pubsub.subscribe('T');
    setTimeout(partial(consumer, subscriptionB, 300, 500, 'B'), 0);
}
forEach(['ap', 'bp'], console.log)
console.log('Z')

window.addEventListener('load', function() {
    console.log('X')
})
test_pubsub();
