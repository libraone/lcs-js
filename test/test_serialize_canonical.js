const Long = require("long")
const { Buffer } = require("buffer")
const { expect } = require("chai")
const {
    CanonicalSerializable, CanonicalSerializer,
    CanonicalDeserializable, CanonicalDeserializer,
    SimpleSerializer, SimpleDeserializer,
    Result, Optional,
} = require("../dist")

const { bufferToHex } = require('./misc')

const ARRAY_MAX_SIZE = 2 ** 31 - 1


/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {Buffer | undefined} v 
 */
function BufferWrapper(v) {
    this.v = v ? v : Buffer.alloc(0)
}

/**
 * @memberof BufferWrapper
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
BufferWrapper.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer.encodeBytes(this.v).unwrap()
        return {}
    })
}

/**
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<BufferWrapper, Error>}
 */
BufferWrapper.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        this.v = deserializer.decodeBytes().unwrap()
        return this
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable|CanonicalDeserializable}
 * @param {Buffer | undefined} v 
 */
function Addr(v) {
    this.v = v ? v : Buffer.alloc(0)
}

/**
 * @memberof Addr
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
Addr.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeBytes(this.v).unwrap()
        return {}
    })
}

/**
 * @memberof Addr
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<Addr, Error>}
 */
Addr.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const v = deserializer.decodeBytes().unwrap()
        return new Addr(v)
    })
}


/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable|CanonicalDeserializable}
 * @param {Long | undefined} a 
 * @param {Buffer | undefined} b 
 * @param {Addr | undefined} c 
 * @param {number | undefined} d 
 */
function Bar(a, b, c, d) {
    this.a = a ? a : Long.UZERO
    this.b = b ? b : Buffer.alloc(0)
    this.c = c ? c : new Addr()
    this.d = d != null ? d : 0
}

/**
 * @memberof Bar
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>} 
 */
Bar.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeU64(this.a).unwrap()
            .encodeBytes(this.b).unwrap()
            .encodeStruct(this.c).unwrap()
            .encodeU32(this.d).unwrap()
        return {}
    })
}

/**
 * @memberof Bar
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<Bar, Error>}
 */
Bar.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const a = deserializer.decodeU64().unwrap()
        const b = deserializer.decodeBytes().unwrap()
        const c = deserializer.decodeStruct(Addr).unwrap()
        const d = deserializer.decodeU32().unwrap()
        return new Bar(a, b, c, d)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable|CanonicalDeserializable}
 * @param {Long | undefined} a 
 * @param {Buffer | undefined} b 
 * @param {Bar | undefined} c 
 * @param {boolean | undefined} d 
 * @param {Map<BufferWrapper, BufferWrapper> | undefined} e 
 */
function Foo(a, b, c, d, e) {
    this.a = a ? a : Long.UZERO
    this.b = b ? b : Buffer.alloc(0)
    this.c = c ? c : new Bar()
    this.d = d != null ? d : false
    this.e = e ? e : new Map()
}

/**
 * @memberof Foo
 * @param {CanonicalSerializer} serializer 
 * @return {Result<{}, Error>}
 */
Foo.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeU64(this.a).unwrap()
            .encodeBytes(this.b).unwrap()
            .encodeStruct(this.c).unwrap()
            .encodeBool(this.d).unwrap()
            .encodeMap(this.e).unwrap()
        return {}
    })
}

/**
 * @memberof Foo
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<Foo, Error>}
 */
Foo.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const a = deserializer.decodeU64().unwrap()
        const b = deserializer.decodeBytes().unwrap()
        const c = deserializer.decodeStruct(Bar).unwrap()
        const d = deserializer.decodeBool().unwrap()
        const e = deserializer.decodeMap(BufferWrapper, BufferWrapper).unwrap()
        return new Foo(a, b, c, d, e)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable|CanonicalDeserializable}
 * @param {number | undefined} v 
 */
function U32(v) {
    this.v = v != null ? v : 0
}

/**
 * @memberof U32
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
U32.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer.encodeU32(this.v).unwrap()
        return {}
    })
}

/**
 * @memberof U32
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<U32, Error>}
 */
U32.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const v = deserializer.decodeU32().unwrap()
        return new U32(v)
    })
}

describe('canonical_serialization', () => {
    it('test_serialization_correctness_using_known_vector', () => {
        const bar = new Bar(
            Long.fromNumber(100, true),
            Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
            new Addr(Buffer.alloc(32, 5)),
            99,
        )

        /** @type {Map<BufferWrapper, BufferWrapper> */
        const map = new Map()
        map.set(new BufferWrapper(Buffer.from([0, 56, 21])), new BufferWrapper(Buffer.from([22, 10, 5])))
        map.set(new BufferWrapper(Buffer.from([1])), new BufferWrapper(Buffer.from([22, 21, 67])))
        map.set(new BufferWrapper(Buffer.from([20, 21, 89, 105])), new BufferWrapper(Buffer.from([201, 23, 90])))

        const foo = new Foo(
            Long.MAX_UNSIGNED_VALUE,
            Buffer.from([100, 99, 88, 77, 66, 55]),
            bar,
            true,
            map,
        )

        const serializer = new SimpleSerializer()
        const result = foo.serialize(serializer)
        expect(result.isOK()).eq(true)
        const serialized_bytes = serializer.getOutput()

        expect(bufferToHex(serialized_bytes)).eq(
            'ffffffffffffffff060000006463584d4237640000000000000009000000000102' +
            '03040506070820000000050505050505050505050505050505050505050505050505' +
            '05050505050505056300000001030000000100000001030000001615430300000000' +
            '381503000000160a05040000001415596903000000c9175a')
    })

    it("test_btreemap_lexicographic_order", () => {
        /** @type {Map<BufferWrapper, BufferWrapper>} */
        const map = new Map()
        const value = new BufferWrapper(Buffer.from([54, 20, 21, 200]))
        const key1 = new BufferWrapper(Buffer.from([0]))
        const key2 = new BufferWrapper(Buffer.from([0, 6]))
        const key3 = new BufferWrapper(Buffer.from([1]))
        const key4 = new BufferWrapper(Buffer.from([2]))
        map.set(key1, value)
        map.set(key2, value)
        map.set(key3, value)
        map.set(key4, value)

        const serializer = new SimpleSerializer()
        const result = serializer.encodeMap(map)
        expect(result.isOK()).eq(true)
        const serialized_bytes = serializer.getOutput()

        const deserialized = new SimpleDeserializer(serialized_bytes)
        expect(deserialized.decodeU32().unwrap()).eq(4)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(key1.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(value.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(key3.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(value.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(key4.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(value.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(key2.v)
        expect(deserialized.decodeBytes().unwrap()).deep.eq(value.v)
    })

    it("test_serialization_optional", () => {

        /**
         * @param {Optional<U32>} v 
         */
        function assert_encode_decode(v) {
            const serialized = SimpleSerializer.serialize(v).unwrap()
            const deserializer = new SimpleDeserializer(serialized)
            const deserialized = new Optional(U32, null).deserialize(deserializer)

            expect(deserialized.isOK()).eq(true)
            expect(deserialized.unwrap()).deep.eq(v)
            expect(deserializer.isEmpty()).eq(true)
        }

        const bar1 = Optional.some(U32, new U32(42))
        assert_encode_decode(bar1)

        const bar2 = Optional.none(U32)
        assert_encode_decode(bar2)
    })

    it('test_deserialization_failure_cases', () => {
        // invalid length prefix should fail on all decoding methods
        const bytes_len_2 = Buffer.alloc(0, 2)
        const deserializer = new SimpleDeserializer(bytes_len_2)
        expect(deserializer.clone().decodeU64().isErr()).eq(true)
        expect(deserializer.clone().decodeBytes().isErr()).eq(true)
        expect(deserializer.clone().decodeStruct(Foo).isErr()).eq(true)
        expect(new Foo().deserialize(deserializer).isErr()).eq(true)

        // a length prefix longer than maximum allowed should fail
        const long_bytes = Buffer.alloc(4)
        long_bytes.writeUInt32LE(ARRAY_MAX_SIZE + 1, 0)
        deserializer.reset(long_bytes)
        expect(deserializer.clone().decodeBytes().isErr()).eq(true)

        // vec not long enough should fail
        const bytes_len_10 = Buffer.alloc(4)
        bytes_len_10.writeUInt32LE(32, 0)
        deserializer.reset(bytes_len_10)
        expect(deserializer.clone().decodeBytes().isErr()).eq(true)

        // malformed struct should fail
        const some_bytes = Buffer.alloc(12)
        Long.fromNumber(10, true).toBytesLE().forEach((x, idx) => {
            some_bytes.writeUInt8(x, idx)
        })
        some_bytes.writeUInt32LE(50, 8)
        deserializer.reset(some_bytes)
        expect(deserializer.clone().decodeStruct(Foo).isErr()).eq(true)

        // malformed encoded bytes with length prefix larger than real
        const evil_bytes = Buffer.alloc(499 + 4)
        evil_bytes.writeUInt32LE(500, 0)
        deserializer.reset(evil_bytes)
        expect(deserializer.clone().decodeBytes().isErr()).eq(true)

        // malformed encoded bool with value not 0 or 1
        const bool_bytes = Buffer.alloc(1)
        bool_bytes.writeUInt8(2, 0)
        deserializer.reset(bool_bytes)
        expect(deserializer.decodeBool().isErr()).eq(true)
    })
})