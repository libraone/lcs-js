
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

// deserialize struct RawTransaction
const deserializer = new SimpleDeserializer(serializedBytes)
const rawTxnDecode = deserializer.decodeStruct(RawTransaction)