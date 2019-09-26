import * as Long from "long"
import { Buffer } from "buffer"
import { CanonicalSerializable, CanonicalSerializer } from "./canonical_serialize"
import { Result, ARRAY_MAX_SIZE, Optional } from "./misc"
import { TextEncoder } from "platform/index"

class SimpleSerializer extends CanonicalSerializer {
    __buffer: Buffer
    __offset: number
    __capacity: number

    constructor() {
        super()
        this.__offset = 0
        this.__capacity = 0
        this.__buffer = Buffer.alloc(this.__capacity)
    }

    private __ensureCapacity(v: number) {
        if (v <= this.__capacity) {
            return
        }

        let new_capacity = this.__capacity > 0 ? this.__capacity : 1
        while (new_capacity < v) {
            new_capacity *= 2
        }

        const old_buffer = this.__buffer
        const new_buffer = Buffer.alloc(new_capacity)
        old_buffer.copy(new_buffer, 0, 0, old_buffer.length)
        this.__buffer = new_buffer
        this.__capacity = new_capacity
    }

    static serialize(v: CanonicalSerializable): Result<Buffer, Error> {
        return Result.safe(() => {
            const serializer = new SimpleSerializer()
            v.serialize(serializer)
            return serializer.getOutput()
        })
    }

    clone() {
        const duplicate = new SimpleSerializer()
        duplicate.__buffer = Buffer.from(this.__buffer)
        duplicate.__offset = this.__offset
        duplicate.__capacity = this.__capacity
        return duplicate
    }

    isErr(): boolean {
        return false
    }

    reset(): SimpleSerializer {
        this.__offset = 0
        this.__capacity = 0
        this.__buffer = Buffer.alloc(this.__capacity)
        return this
    }

    getOutput(): Buffer {
        return Buffer.from(this.__buffer.slice(0, this.__offset))
    }


    encodeBool(v: boolean): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 1)
            this.__buffer.writeUInt8(v ? 1 : 0, this.__offset)
            this.__offset += 1
            return this
        })
    }

    encodeBytes(v: Buffer): Result<this, Error> {
        return Result.safe(() => {
            if (v.length > ARRAY_MAX_SIZE) {
                throw new Error(`array length exceeded the maximum length limit. length: ${v.length}, Max length limit: ${ARRAY_MAX_SIZE}`)
            }

            this.encodeU32(v.length).unwrap()
            this.__ensureCapacity(this.__capacity + v.length)
            v.copy(this.__buffer, this.__offset, 0, v.length)
            this.__offset += v.length
            return this
        })
    }

    encodeI8(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 1)
            this.__buffer.writeInt8(v, this.__offset)
            this.__offset += 1
            return this
        })
    }

    encodeI16(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 2)
            this.__buffer.writeInt16LE(v, this.__offset)
            this.__offset += 2
            return this
        })
    }

    encodeI32(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 4)
            this.__buffer.writeInt32LE(v, this.__offset)
            this.__offset += 4
            return this
        })
    }

    encodeI64(v: Long): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 8)
            const bytes = v.toBytesLE()
            for (let i = 0; i < 8; ++i) {
                this.__buffer.writeUInt8(bytes[i], this.__offset + i)
            }
            this.__offset += 8
            return this
        })
    }

    encodeString(v: string): Result<this, Error> {
        return Result.safe(() => {
            const bytes = Buffer.from(new TextEncoder().encode(v))
            this.encodeBytes(bytes).unwrap()
            return this
        })
    }

    encodeU8(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 1)
            this.__buffer.writeUInt8(v, this.__offset)
            this.__offset += 1
            return this
        })
    }

    encodeU16(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 2)
            this.__buffer.writeUInt16LE(v, this.__offset)
            this.__offset += 2
            return this
        })
    }

    encodeU32(v: number): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 4)
            this.__buffer.writeUInt32LE(v, this.__offset)
            this.__offset += 4
            return this
        })
    }

    encodeU64(v: Long): Result<this, Error> {
        return Result.safe(() => {
            this.__ensureCapacity(this.__capacity + 8)
            const bytes = v.toBytesLE()
            for (let i = 0; i < 8; ++i) {
                this.__buffer.writeUInt8(bytes[i], this.__offset + i)
            }
            this.__offset += 8
            return this
        })
    }

    encodeTuple2<T0 extends CanonicalSerializable, T1 extends CanonicalSerializable>(v: [T0, T1]): Result<this, Error> {
        return Result.safe(() => {
            v[0].serialize(this).unwrap()
            v[1].serialize(this).unwrap()
            return this
        })
    }

    encodeTuple3<T0 extends CanonicalSerializable, T1 extends CanonicalSerializable, T2 extends CanonicalSerializable>(v: [T0, T1, T2]): Result<this, Error> {
        return Result.safe(() => {
            v[0].serialize(this).unwrap()
            v[1].serialize(this).unwrap()
            v[2].serialize(this).unwrap()
            return this
        })
    }

    encodeMap<K extends CanonicalSerializable, V extends CanonicalSerializable>(v: Map<K, V>): Result<this, Error> {
        return Result.safe(() => {
            if (v.size > ARRAY_MAX_SIZE) {
                throw new Error(`array length exceeded the maximum limit. length: ${v.size}, max length limit: ${ARRAY_MAX_SIZE}`)
            }

            this.encodeU32(v.size).unwrap()

            const map = new Map<Buffer, Buffer>()
            for (const entry of v.entries()) {
                map.set(SimpleSerializer.serialize(entry[0]).unwrap(), SimpleSerializer.serialize(entry[1]).unwrap())
            }

            const keys = [...map.keys()]
            keys.sort((lhs, rhs) => lhs.compare(rhs))

            for (const key of keys) {
                const value = map.get(key) as Buffer
                const len_key = key.length
                const len_value = value.length
                this.__ensureCapacity(this.__offset + len_key + len_value)
                key.copy(this.__buffer, this.__offset, 0, len_key)
                value.copy(this.__buffer, this.__offset + len_key, 0, len_value)
                this.__offset += len_key + len_value
            }

            return this
        })
    }

    encodeOptional<T extends CanonicalSerializable>(v: Optional<T>): Result<this, Error> {
        return Result.safe(() => {
            this.encodeBool(v.isSome()).unwrap()
            if (v.isSome()) {
                v.unwrap().serialize(this).unwrap()
            }
            return this
        })
    }

    encodeStruct(v: CanonicalSerializable): Result<this, Error> {
        return Result.safe(() => {
            v.serialize(this).unwrap()
            return this
        })
    }

    encodeVec<T extends CanonicalSerializable>(v: T[]): Result<this, Error> {
        return Result.safe(() => {
            if (v.length > ARRAY_MAX_SIZE) {
                throw new Error(`array length exceeded the maximum limit. length: ${v.length}, max length limit: ${ARRAY_MAX_SIZE}`)
            }

            this.encodeU32(v.length)
            for (let i = 0; i < v.length; ++i) {
                v[i].serialize(this).unwrap()
            }
            return this
        })
    }
}

export {
    SimpleSerializer,
}

export default SimpleSerializer