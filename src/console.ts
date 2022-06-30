import { collectionData } from 'rxfire/firestore';
import { partial, forEach, map, random, findIndex, range, set, clone, forIn, zip } from 'lodash-es';
import {Hub} from './csp'
import {CyclicBuffer} from './struct'


function test_csp() {
    const hub = new Hub();
    async function producer(TTL:number, pace:number) {
        if (TTL < 0) {
            return
        }
        console.log(TTL, 'publishing ' + TTL);
        await hub.publish_value('T', TTL);
        console.log(TTL, 'published');
        setTimeout(partial(producer, TTL - 1, pace), pace)
    }
    async function consumer(TTL:number, pace:number) {
        if (TTL < 0) {
            return
        }
        console.log(TTL, 'consuming...');
        var v = await hub.consume_value('T');
        console.log(TTL, 'consumed ' + v);
        setTimeout(partial(consumer, TTL - 1, pace), pace)
    }
    hub.publish_value('T', 'B1')
    hub.publish_value('T', 'B2')
    setTimeout(partial(producer, 10, 500), 500);
    setTimeout(partial(consumer, 30, 2000), 2000);
}

function test_struct():void {
    const buf = new CyclicBuffer(200);
    for (var i = 0; i < 100; ++i) {
        buf.push(i);
    }
    for (var i = 0; i < 200; ++i) {
        console.log(buf.pop());
    }
}
//test_csp();
forEach(['a', 'b'], console.log)