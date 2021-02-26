import { fromEvent, merge, of, Subject, Observable} from 'rxjs';
import { scan, map as rxMap, mergeMap, filter as rxFilter } from 'rxjs/operators';
import { partial, defaults, forEach, map, random, findIndex, range, pickBy} from 'lodash-es';
import { collectionData } from 'rxfire/firestore';

function* gen() {
    var x = 0
    while (true) {
        yield x++
    }
}
var g = gen();
var s1 = new Subject();
var s2 = new Subject();

s1.subscribe(x => s2.next(x));

s1.subscribe(partial(console.log, "s1"))
s2.subscribe(partial(console.log, "s2"))
s1.subscribe(x => s2.next(x));
s2.pipe(scan(
    function(s, x) {
        console.log('X', x)
        return {'_keep_': x._gen_ > s._gen_, '_gen_': x._gen_,'v': x.v};
    },
),rxFilter(x => x._keep_),
  rxMap(x => pickBy(x, k => k != '_keep_'))
).subscribe(function(x) {
    console.log('S2', x)
    s1.next(x);
});

s1.next({'_gen_': g.next().value, 'v': 100});
s2.next({'_gen_': g.next().value, 'v': 300});