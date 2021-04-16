import { collectionData } from 'rxfire/firestore';
import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {Hub, publish_value, consume_value, init_hub} from './csp'
const hub = init_hub();
async function producer(TTL:number, pace:number) {
    if (TTL < 0) {
        return
    }
    console.log(TTL, 'publishing ' + TTL);
    await publish_value(hub, 'T', TTL);
    console.log(TTL, 'published');
    setTimeout(partial(producer, TTL - 1, pace), pace)
}
async function consumer(TTL:number, pace:number) {
    if (TTL < 0) {
        return
    }
    console.log(TTL, 'consuming...');
    var v = await consume_value(hub, 'T');
    console.log(TTL, 'consumed ' + v);
    setTimeout(partial(consumer, TTL - 1, pace), pace)
}
setTimeout(partial(producer, 10, 500), 500);
setTimeout(partial(consumer, 30, 2000), 2000);