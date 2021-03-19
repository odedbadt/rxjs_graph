import {forIn} from 'lodash-es';
function step(hub) {
  forIn(hub.consumers, function(k, v, o) {
    if (hub.producers[k]) {
        var v = hub.producers[k].next()
        hub.consumers[k].next(v);
    }
  });
  forIn(hub.buffers, function(k, v, o) {
    consumer = hub.consumers.shift();
    hub.consumers.push(consumer);
    consumer.next(v);
  });
}
export function register_consumer(hub, topic, consumer) {
  hub.consumers[topic] = consumer;
  step(hub);
}
export function register_producer(hub, producer, topics) {
  hub.consumers[topic] = nonsumer
  step(hub);
}
export function publish(hub, topic, v) {
    if (hub.consumers[topic]) {
        window.setTimeout(function() {
            hub.consumers[topic].next(v);
        },0);
    }
}
export function init_hub() {
    return {
      'buffers': {
      },
      'consumers': {
      },
      'producers': {
      }
    }
}


