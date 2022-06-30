export class CyclicBuffer<T> {
    buffer: Array<T>;
    size: number;
    head: number;
    tail: number;

    constructor(size:number) {
        this.buffer = new Array<T>();
        this.size =  size;
        this.head = 0;
        this.tail = 0;
    }
    push(value:T) {
        this.head = this.head + 1;
        this.buffer[this.head % this.size] = value;
    }
    is_empty():boolean {
        return !((this.tail) < (this.head + 1));
    }

    pop():T {
        if (this.is_empty()) {
            throw new Error('Cyclic buffer is empty')
        }
        this.tail = this.tail + 1;
        return this.buffer[this.tail];
    }
}