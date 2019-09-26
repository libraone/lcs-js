import * as Long from "long";
import { Buffer } from "buffer"
import { CanonicalDeserializable, CanonicalDeserializer } from "./canonical_deserialize"
import { Result, Optional, ARRAY_MAX_SIZE } from "./misc";
import { TextDecoder } from "platform/index"

class SimpleDeserializer extends CanonicalDeserializer {

    private __buffer: Buffer
    private __offset: number
    private __capacity: number

    constructor(target: Buffer) {
        super()
        this.__offset = 0
        this.__buffer = Buffer.from(target)
        this.__capacity = target.length
    }

    clone() {
        const duplicate = new SimpleDeserializer(this.__buffer)
        duplicate.__offset = this.__offset
        duplicate.__capacity = this.__capacity
        return duplicate
    }

    reset(target: Buffer) {
        this.__offset = 0
        this.__buffer = target
        this.__capacity = target.length
    }

    isEmpty() {
        return this.__offset >= this.__buffer.length
    }

    static deserialize<T extends CanonicalDeserializable>(t: new () => T, data: Buffer): Result<T, Error> {
        const deserializer = new SimpleDeserializer(data)
        return new t().deserialize(deserializer)
    }

    decodeBool(): Result<boolean, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readUInt8(this.__offset)
            if (v != 0 && v != 1) {
                throw new Error(`bool must be 0 or 1, found ${v}`)
            }
            this.__offset += 1
            return v == 1
        })
    }

    decodeBytes(): Result<Buffer, Error> {
        return Result.safe(() => {
            const length = this.__buffer.readUInt32LE(this.__offset)
            if (length > ARRAY_MAX_SIZE) {
                throw new Error(`array length longer than max allowed length. len: ${length}, max: ${ARRAY_MAX_SIZE}`)
            }
            this.__offset += 4

            const remain = this.__capacity - this.__offset
            if (remain < length) {
                throw new Error(`not enough bytes left. len: ${length}, remaining: ${remain}`)
            }

            const v = Buffer.alloc(length)
            this.__buffer.copy(v, 0, this.__offset, this.__offset + length)
            this.__offset += length
            return v
        })
    }

    decodeI8(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readInt8(this.__offset)
            this.__offset += 1
            return v
        })
    }

    decodeI16(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readInt16LE(this.__offset)
            this.__offset += 2
            return v
        })
    }

    decodeI32(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readInt32LE(this.__offset)
            this.__offset += 4
            return v
        })
    }

    decodeI64(): Result<Long, Error> {
        return Result.safe(() => {
            const bytes = this.__buffer
                .slice(this.__offset, this.__offset + 8)
                .reduce((pv, cv) => {
                    pv.push(cv)
                    return pv
                }, [] as number[])

            if (bytes.length != 8) {
                throw new Error(`not enough bytes left. len: ${8}, remaining: ${bytes.length}`)
            }

            this.__offset += 8
            return Long.fromBytesLE(bytes, false)
        })
    }

    decodeString(): Result<string, Error> {
        return Result.safe(() => {
            const length = this.decodeU32().unwrap()
            const buffer = Buffer.alloc(16)
            this.__buffer.copy(buffer, 0, this.__offset, length)
            this.__offset += length
            return new TextDecoder().decode(buffer)
        })
    }

    decodeU8(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readUInt8(this.__offset)
            this.__offset += 1
            return v
        })
    }

    decodeU16(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readUInt16LE(this.__offset)
            this.__offset += 2
            return v
        })
    }

    decodeU32(): Result<number, Error> {
        return Result.safe(() => {
            const v = this.__buffer.readUInt32LE(this.__offset)
            this.__offset += 4
            return v
        })
    }

    decodeU64(): Result<Long, Error> {
        return Result.safe(() => {
            const bytes = this.__buffer
                .slice(this.__offset, this.__offset + 8)
                .reduce((pv, cv) => {
                    pv.push(cv)
                    return pv
                }, [] as number[])

            if (bytes.length != 8) {
                throw new Error(`not enough bytes left. len: ${8}, remaining: ${bytes.length}`)
            }
            this.__offset += 8
            return Long.fromBytesLE(bytes, true)
        })
    }

    decodeTuple2<T0 extends CanonicalDeserializable, T1 extends CanonicalDeserializable>(t0: new () => T0, t1: new () => T1): Result<[T0, T1], Error> {
        return Result.safe(() => {
            const v0 = new t0().deserialize(this).unwrap()
            const v1 = new t1().deserialize(this).unwrap()
            return [v0, v1]
        })
    }

    decodeTuple3<T0 extends CanonicalDeserializable, T1 extends CanonicalDeserializable, T2 extends CanonicalDeserializable>(t0: new () => T0, t1: new () => T1, t2: new () => T2): Result<[T0, T1, T2], Error> {
        return Result.safe(() => {
            const v0 = new t0().deserialize(this).unwrap()
            const v1 = new t1().deserialize(this).unwrap()
            const v2 = new t2().deserialize(this).unwrap()
            return [v0, v1, v2]
        })
    }

    decodeMap<K extends CanonicalDeserializable, V extends CanonicalDeserializable>(tk: new () => K, tv: new () => V): Result<Map<K, V>, Error> {
        return Result.safe(() => {
            const map = new Map<K, V>()

            const length = this.decodeU32().unwrap()

            if (length > ARRAY_MAX_SIZE) {
                throw new Error(`array length longer than max allowed. size: ${length}, max: ${ARRAY_MAX_SIZE}`)
            }

            for (let i = 0; i < length; ++i) {
                const key = new tk().deserialize(this).unwrap()
                const value = new tv().deserialize(this).unwrap()
                map.set(key, value)
            }

            return map
        })
    }

    decodeOptional<T extends CanonicalDeserializable>(t: new () => T): Result<Optional<T>, Error> {
        return Result.safe(() => {
            if (this.decodeBool().unwrap()) {
                const v = this.decodeStruct(t).unwrap()
                return Optional.some(t, v)
            }

            return Optional.none(t)
        })
    }

    decodeStruct<T extends CanonicalDeserializable>(t: new () => T): Result<T, Error> {
        return Result.safe(() => {
            return new t().deserialize(this).unwrap()
        })
    }

    decodeVec<T extends CanonicalDeserializable>(t: new () => T): Result<T[], Error> {
        return Result.safe(() => {
            const length = this.decodeU32().unwrap()
            if (length > ARRAY_MAX_SIZE) {
                throw new Error(`array length longer than max allowed. size: ${length}, max: ${ARRAY_MAX_SIZE}`)
            }

            const v = []
            for (let i = 0; i < length; ++i) {
                const e = new t().deserialize(this).unwrap()
                v.push(e)
            }
            return v
        })
    }
}

export {
    SimpleDeserializer
}

export default SimpleDeserializer