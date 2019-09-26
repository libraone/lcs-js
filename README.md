# lcs-js Document


lcs-js is serialize library of the Facebook's Libra project, developed with pure javascript, could be applied for both web front-end and nodejs project.
lcs-js is published by LibraOne, created by NodePacific, as being a member of LibraOne.



## What is LCS？

LCS official document： <https://github.com/libra/libra/tree/master/common/canonical_serialization>


## Build

nodejs build：

```sh
yarn install && yarn run build::node
```

web front-end build：

```sh
yarn install && yarn run build::web
```

## Usage

##### 1. Primitive type serialize:

u32 serialize：

```javascript
// example for serialize/deserialize u32
const {
    SimpleSerializer, SimpleDeserializer,
} = require("../dist")

// serialize u32
const serializer = new SimpleSerializer()
serializer.encodeU32(1024).unwrap()
const serializedBytes = serializer.getOutput()
```


u32  deserialize:
    
```javascript
// deserialize u32
const deserializer = new SimpleDeserializer(serializedBytes)
const number = deserializer.decodeU32().unwrap()
```

##### 2. struct serialize

Define struct：

```javascript
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
```

strcut serialize：

```javascript
// serialize struct Foo
const serializer = new SimpleSerializer()
serializer.encodeStruct(new Foo(1, 'hello', true)).unwrap()
const serializedBytes = serializer.getOutput()
```

struct deserialize:

```javascript
// deserialize struct Foo
const deserializer = new SimpleDeserializer(serializedBytes)
const foo = deserializer.decodeStruct(Foo)
```

##### 3. libra RawTransaction serialize

Serialize RawTransaction：

```javascript
// example for serialize/deserialize struct RawTransaction
const {
    CanonicalSerializable, CanonicalSerializer,
    CanonicalDeserializable, CanonicalDeserializer,
    SimpleSerializer, SimpleDeserializer,
    Result
} = require("../dist")
const { RawTransaction } = require('./libra_types')

// new RawTransaction

const sender = new AccountAddress('c3398a599a6f3b9f30b635af29f2ba046d3a752c26e9d0647b9647d1f4c04ad4')
const sequenceNumber = Long.fromString('32', true)
const address1 = new AccountAddress('a71d76faa2d2d5c3224ec3d41deb293973564a791e55c6782ba76c2bf0495f9a')
const path1 = hexToBuffer('01217da6c6b3e19f1825cfb2676daecce3bf3de03cf26647c78df00b371b25cc97')
const accessPath1 = new AccessPath(address1, path1)
const op1 = new WriteOP(WriteOPKind.Deletion, null)
/** @type {[AccessPath, WriteOP]} */
const write1 = [accessPath1, op1]
const address2 = new AccountAddress('c4c63f80c74b11263e421ebf8486a4e398d0dbc09fa7d4f62ccdb309f3aea81f')
const path2 = hexToBuffer('01217da6c6b3e19f18')
const accessPath2 = new AccessPath(address2, path2)
const op2 = new WriteOP(WriteOPKind.Value, Buffer.from([0xca, 0xfe, 0xd0, 0x0d]))
/** @type {[AccessPath, WriteOP]} */
const write2 = [accessPath2, op2]
const writeSet = new WriteSet(new WriteSetMut([write1, write2]))
const payload = new TransactionPayload(TransactionPayloadKind.WriteSet, writeSet)
const maxGasAmount = Long.fromString('0', true)
const gasUnitPrice = Long.fromString('0', true)
const expirationTime = Long.fromString('18446744073709551615', true)
const rawTxnEncode = new RawTransaction(sender, sequenceNumber, payload, maxGasAmount, gasUnitPrice, expirationTime)

// serialize struct RawTransaction
const serializer = new SimpleSerializer()
serializer.encodeStruct(rawTxnEncode).unwrap()
const serializedBytes = serializer.getOutput()
```

Deserialize RawTransaction：

```javascript
// deserialize struct RawTransaction
const deserializer = new SimpleDeserializer(serializedBytes)
const rawTxnDecode = deserializer.decodeStruct(RawTransaction)
```

#### More Libra type

Please see: [example/libra_types.js](example/libra_types.js)
