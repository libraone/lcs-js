import * as Long from "long"
import { Buffer } from "buffer";
import { Result, Optional } from "./misc"

interface CanonicalSerializable {
    serialize(serializer: CanonicalSerializer): Result<{}, Error>
}

abstract class CanonicalSerializer {
    abstract encodeBool(v: boolean): Result<this, Error>
    abstract encodeBytes(v: Buffer): Result<this, Error>
    abstract encodeI8(v: number): Result<this, Error>
    abstract encodeI16(v: number): Result<this, Error>
    abstract encodeI32(v: number): Result<this, Error>
    abstract encodeI64(v: Long): Result<this, Error>
    abstract encodeString(v: string): Result<this, Error>
    abstract encodeU8(v: number): Result<this, Error>
    abstract encodeU16(v: number): Result<this, Error>
    abstract encodeU32(v: number): Result<this, Error>
    abstract encodeU64(v: Long): Result<this, Error>
    abstract encodeTuple2<T0 extends CanonicalSerializable, T1 extends CanonicalSerializable>(v: [T0, T1]): Result<this, Error>
    abstract encodeTuple3<T0 extends CanonicalSerializable, T1 extends CanonicalSerializable, T2 extends CanonicalSerializable>(v: [T0, T1, T2]): Result<this, Error>
    abstract encodeMap<K extends CanonicalSerializable, V extends CanonicalSerializable>(v: Map<K, V>): Result<this, Error>
    abstract encodeOptional<T extends CanonicalSerializable>(v: Optional<T>): Result<this, Error>
    abstract encodeStruct<T extends CanonicalSerializable>(v: T): Result<this, Error>
    abstract encodeVec<T extends CanonicalSerializable>(v: T[]): Result<this, Error>
}

// extends existed types
Optional.prototype.serialize = function (serializer: CanonicalSerializer): Result<{}, Error> {
    return Result.safe(() => {
        serializer.encodeOptional(this).unwrap()
        return {}
    })
}

export {
    CanonicalSerializable,
    CanonicalSerializer,
}

export default CanonicalSerializer