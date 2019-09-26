import * as Long from "long"
import { Buffer } from "buffer"
import { Result, Optional } from "./misc"

interface CanonicalDeserializable {
    deserialize(deserializer: CanonicalDeserializer): Result<this, Error>
}

abstract class CanonicalDeserializer {
    abstract decodeBool(): Result<boolean, Error>
    abstract decodeBytes(): Result<Buffer, Error>
    abstract decodeI8(): Result<number, Error>
    abstract decodeI16(): Result<number, Error>
    abstract decodeI32(): Result<number, Error>
    abstract decodeI64(): Result<Long, Error>
    abstract decodeString(): Result<string, Error>
    abstract decodeU8(): Result<number, Error>
    abstract decodeU16(): Result<number, Error>
    abstract decodeU32(): Result<number, Error>
    abstract decodeU64(): Result<Long, Error>
    abstract decodeTuple2<T0 extends CanonicalDeserializable, T1 extends CanonicalDeserializable>(t0: new () => T0, t1: new () => T1): Result<[T0, T1], Error>
    abstract decodeTuple3<T0 extends CanonicalDeserializable, T1 extends CanonicalDeserializable, T2 extends CanonicalDeserializable>(t0: new () => T0, t1: new () => T1, t2: new () => T2): Result<[T0, T1, T2], Error>
    abstract decodeMap<K extends CanonicalDeserializable, V extends CanonicalDeserializable>(tk: new () => K, tv: new () => V): Result<Map<K, V>, Error>
    abstract decodeOptional<T extends CanonicalDeserializable>(t: new () => T): Result<Optional<T>, Error>
    abstract decodeStruct<T extends CanonicalDeserializable>(t: new () => T): Result<T, Error>
    abstract decodeVec<T extends CanonicalDeserializable>(t: new () => T): Result<T[], Error>
}

// extends existed types
Optional.prototype.deserialize = function (deserializer: CanonicalDeserializer): Result<Optional<any>, Error> {
    return Result.safe(() => {
        return deserializer.decodeOptional(this.vt).unwrap()
    })
}

export {
    CanonicalDeserializable,
    CanonicalDeserializer,
}

export default CanonicalDeserializer
