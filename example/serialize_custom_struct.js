
// example for serialize/deserialize customize struct
const {
    CanonicalSerializable, CanonicalSerializer,
    CanonicalDeserializable, CanonicalDeserializer,
    SimpleSerializer, SimpleDeserializer,
    Result
} = require("../dist")

// define struct and implements CanonicalSerializable/CanonicalDeserializable
/**
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {number | undefined} a 
 * @param {string | undefined} b 
 * @param {boolean | undefined} c 
 */
function Foo(a, b, c) {
    this.a = a || 0
    this.b = b || ''
    this.c = c || false
}

/**
 * @memberof Foo
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
Foo.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeU32(this.a).unwrap()
            .encodeString(this.b).unwrap()
            .encodeBool(this.c).unwrap()
        return {}
    })
}

/**
 * @memberof Foo
 * @param {CanonicalDeserializer} deserializer
 * @return {Result{Foo, Error}}
 */
Foo.prototype.deserialize = function (deserializer) {
    const a = deserializer.decodeU32().unwrap()
    const b = deserializer.decodeString().unwrap()
    const c = deserializer.decodeBool().unwrap()
    return new Foo(a, b, c)
}

// serialize struct Foo
const serializer = new SimpleSerializer()
serializer.encodeStruct(new Foo(1, 'hello', true)).unwrap()
const serializedBytes = serializer.getOutput()

// deserialize struct Foo
const deserializer = new SimpleDeserializer(serializedBytes)
const foo = deserializer.decodeStruct(Foo)