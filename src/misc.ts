import { Buffer } from "buffer";

const U32_MAX_VALUE = 2 ** 32 - 1
const I32_MAX_VALUE = 2 ** 31 - 1
const ARRAY_MAX_SIZE = I32_MAX_VALUE

function bufferToHex(buffer: Uint8Array): string {
    return Array.prototype.map
        .call(buffer, (x: number) => ('00' + x.toString(16)).slice(-2))
        .join('');
}

function hexToBuffer(hex: string) {
    if (/^0x/.test(hex)) {
        hex = hex.slice(2)
    }

    const length = hex.length
    const numbers = []
    for (let i = 0; i < length; i += 2) {
        numbers.push(parseInt(hex.substr(i, 2), 16))
    }
    return Buffer.from(numbers)
}

class Optional<T> {
    vt: new () => T
    v?: T

    static some<T>(vt: new () => T, v?: T): Optional<T> {
        return new Optional(vt, v)
    }

    static none<T>(vt: new () => T): Optional<T> {
        return new Optional(vt, undefined)
    }

    constructor(vt: new () => T, v?: T) {
        this.vt = vt
        this.v = v
    }

    unwrap() {
        if (this.v == null) {
            throw new ReferenceError('this.value is null')
        }
        return this.v
    }

    isSome() {
        return this.v != null
    }

    isNone() {
        return this.v == null
    }
}

class Result<V, E> {
    value?: V
    err?: E

    constructor(v?: V, e?: E) {
        this.value = v
        this.err = e
    }

    static safe<V>(provider: () => V): Result<V, Error> {
        try {
            return Result.ok(provider())
        } catch (err) {
            return Result.err(err)
        }
    }

    static ok<V, E>(v: V) {
        return new Result<V, E>(v, undefined)
    }

    static err<V, E>(e: E) {
        return new Result<V, E>(undefined, e)
    }

    unwrap(): V {
        if (this.err != null) {
            throw this.err
        }
        if (this.value == null) {
            throw new ReferenceError('this.value is null')
        }
        return this.value as V
    }

    isOK(): boolean {
        return this.value != null
    }

    isErr(): boolean {
        return this.err != null
    }
}

export {
    bufferToHex,
    hexToBuffer,
    Result,
    U32_MAX_VALUE,
    I32_MAX_VALUE,
    ARRAY_MAX_SIZE,
    Optional,
}