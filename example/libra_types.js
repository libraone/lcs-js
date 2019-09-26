const Long = require("long")
const { Buffer } = require("buffer")
const { CanonicalSerializable, CanonicalSerializer,
    CanonicalDeserializer, CanonicalDeserializable,
    Result, SimpleSerializer } = require('../dist')

/**
 * @param {string} hex
 * @return {Buffer}
 */
function hexToBuffer(hex) {
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
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {string | undefined} address 
 */
function AccountAddress(address) {
    this.address = hexToBuffer(address ? address : '')
}

/**
 * @memberof AccountAddress
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
AccountAddress.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer.encodeBytes(this.address).unwrap()
        return {}
    })
}

/**
 * @memberof AccountAddress
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<AccountAddress, Error>}
 */
AccountAddress.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        this.address = deserializer.decodeBytes().unwrap()
        return this
    })
}


const TransactionArgumentKind = {
    U64: 0,
    Address: 1,
    String: 2,
    ByteArray: 3,
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {number | undefined} kind 
 * @param {any | undefined} value 
 */
function TransactionArgument(kind, value) {
    this.kind = kind != null ? kind : TransactionArgumentKind.U64
    this.value = value != null ? value : 0
}

/**
 * @memberof TransactionArgument
 * @param {CanonicalSerializer} serializer 
 * @return {Result<{}, Error>}
 */
TransactionArgument.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        if (this.kind == TransactionArgumentKind.U64) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeU64(this.value).unwrap()
        } else if (this.kind == TransactionArgumentKind.Address) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeStruct(this.value).unwrap()
        } else if (this.kind == TransactionArgumentKind.ByteArray) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeBytes(this.value)
        } else if (this.kind == TransactionArgumentKind.String) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeString(this.value)
        } else {
            throw new Error(`unknown kind. kind: ${this.kind}`)
        }

        return {}
    })
}

/**
 * @memberof TransactionArgument
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<TransactionArgument, Error>}
 */
TransactionArgument.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const kind = deserializer.decodeU32().unwrap()
        /** @type {any} */
        let value = null

        if (kind == TransactionArgumentKind.U64) {
            value = deserializer.decodeU64().unwrap()
        } else if (kind == TransactionArgumentKind.Address) {
            value = deserializer.decodeStruct(AccountAddress).unwrap()
        } else if (kind == TransactionArgumentKind.ByteArray) {
            value = deserializer.decodeBytes()
        } else if (kind == TransactionArgumentKind.String) {
            value = deserializer.decodeString()
        }

        if (value == null) {
            throw new Error(`unknown kind. kind: ${kind}`)
        }

        return new TransactionArgument(kind, value)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {Buffer | undefined} code 
 * @param {TransactionArgument[] | undefined} args 
 * @param {Buffer[] | undefined} modules 
 */
function Program(code, args, modules) {
    this.code = code || Buffer.alloc(0)
    this.args = args || []
    this.modules = modules || []
}

/**
 * @memberof Program
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
Program.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer.encodeBytes(this.code)
        serializer.encodeVec(this.args)
        serializer.encodeVec(this.modules.map(x => new BufferWrapper(x)))
        return {}
    })
}

/**
 * @memberof Program
 * @param {CanonicalDeserializer} deserializer 
 * @return {Result<Program, Error>}
 */
Program.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const code = deserializer.decodeBytes().unwrap()
        const args = deserializer.decodeVec(TransactionArgument).unwrap()
        const modules = deserializer.decodeVec(BufferWrapper).unwrap().map(x => x.v)
        return new Program(code, args, modules)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {Buffer | undefined} code 
 */
function Module() {
    this.code = code ? code : Buffer.alloc(0)
}

/**
 * @memberof Module
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
Module.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeBytes(this.code).unwrap()
        return {}
    })
}

/**
 * @memberof Module
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<Module, Error>}
 */
Module.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const code = deserializer.decodeBytes().unwrap()
        return new Module(code)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable, CanonicalDeserializable}
 * @param {Buffer | undefined} code 
 * @param {TransactionArgument[] | undefined} args 
 */
function Script(code, args) {
    this.code = code || Buffer.alloc(0)
    this.args = args || []
}

/**
 * @memberof Script
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
Script.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeBytes(this.code).unwrap()
            .encodeVec(this.args)
        return {}
    })
}

/**
 * @memberof Script
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<Script, Error>}
 */
Script.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const code = deserializer.decodeBytes().unwrap()
        const args = deserializer.decodeVec(TransactionArgument).unwrap()
        return new Script(code, args)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {AccountAddress | undefined} address 
 * @param {Buffer | undefined} path 
 */
function AccessPath(address, path) {
    this.address = address || new AccountAddress()
    this.path = path || Buffer.alloc(0)
}

/**
 * @memberof AccessPath
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
AccessPath.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeStruct(this.address).unwrap()
            .encodeBytes(this.path).unwrap()
        return {}
    })
}

/**
 * @memberof AccessPath
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<AccessPath, Error>}
 */
AccessPath.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const address = deserializer.decodeStruct(AccountAddress).unwrap()
        const path = deserializer.decodeBytes().unwrap()
        return new AccessPath(address, path)
    })
}

const WriteOPKind = {
    Deletion: 0,
    Value: 1,
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {number | undefined} kind 
 * @param {any} value 
 */
function WriteOP(kind, value) {
    this.kind = kind != null ? kind : WriteOPKind.Deletion
    this.value = value
}

/**
 * @memberof WriteOP
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
WriteOP.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        if (this.kind == WriteOPKind.Deletion) {
            serializer
                .encodeU32(this.kind).unwrap()
        } else if (this.kind == WriteOPKind.Value) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeBytes(this.value)
        } else {
            throw new Error(`unknown kind. kind: ${this.kind}`)
        }
        return {}
    })
}

/**
 * @memberof WriteOP
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<WriteOP, Error>}
 */
WriteOP.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const kind = deserializer.decodeU32().unwrap()
        let value = null

        if (kind == WriteOPKind.Value) {
            value = deserializer.decodeBytes()
        }

        if (kind != WriteOPKind.Deletion && kind != WriteOPKind.Value) {
            throw new Error(`unknown kind. kind: ${kind}`)
        }

        return new WriteOP(kind, value)
    })
}

/**
 * @class
 * @constructor
 * @param {[AccessPath, WriteOP][] | undefined} writeSet 
 */
function WriteSetMut(writeSet) {
    this.writeSet = writeSet || []
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {WriteSetMut | undefined} v 
 */
function WriteSet(v) {
    this.v = v || new WriteSetMut()
}

/**
 * @memberof WriteSet
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
WriteSet.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        const set = this.v.writeSet
        serializer.encodeU32(set.length).unwrap()
        for (const [x, y] of set) {
            serializer
                .encodeStruct(x).unwrap()
                .encodeStruct(y).unwrap()
        }
        return {}
    })
}

/**
 * @memberof WriteSet
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<WriteSet, Error>}
 */
WriteSet.prototype.deserialize = function (deserializer) {
    /** @type {[AccessPath, WriteOP][]} */
    const set = []

    const length = deserializer.decodeU32().unwrap()
    for (let i = 0; i < length; ++i) {
        const x = deserializer.decodeStruct(AccessPath).unwrap()
        const y = deserializer.decodeStruct(WriteOP).unwrap()
        set.push([x, y])
    }

    return new WriteSet(new WriteSetMut(set))
}

const TransactionPayloadKind = {
    Program: 0,
    WriteSet: 1,
    Script: 2,
    Module: 3,
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {number | undefined} kind 
 * @param {any} value 
 */
function TransactionPayload(kind, value) {
    this.kind = kind != null ? kind : TransactionPayloadKind.Program
    this.value = value
}

/**
 * @memberof TransactionPayload 
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
TransactionPayload.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        if (this.kind >= 0 && this.kind <= 3) {
            serializer
                .encodeU32(this.kind).unwrap()
                .encodeStruct(this.value).unwrap()
        } else {
            throw new Error(`unknown kind. kind: ${this.kind}`)
        }
        return {}
    })
}

/**
 * @memberof TransactionPayload
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<TransactionPayload, Error>}
 */
TransactionPayload.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const kind = deserializer.decodeU32().unwrap()
        let value = null

        if (kind >= 0 && kind <= 3) {
            if (kind == TransactionPayloadKind.Program) {
                value = deserializer.decodeStruct(Program).unwrap()
            } else if (kind == TransactionPayloadKind.WriteSet) {
                value = deserializer.decodeStruct(WriteSet).unwrap()
            } else if (kind == TransactionPayloadKind.Script) {
                value = deserializer.decodeStruct(Script).unwrap()
            } else if (kind == TransactionPayloadKind.Module) {
                value = deserializer.decodeStruct(Module).unwrap()
            }
        } else {
            throw new Error(`unknown kind. kind: ${this.kind}`)
        }

        return new TransactionPayload(kind, value)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {AccountAddress | undefined} sender 
 * @param {Long | undefined} sequenceNumber 
 * @param {TransactionPayload | undefined} payload 
 * @param {Long | undefined} maxGasAmount 
 * @param {Long | undefined} gasUnitPrice 
 * @param {Long | undefined} expirationTime 
 */
function RawTransaction(sender, sequenceNumber, payload, maxGasAmount, gasUnitPrice, expirationTime) {
    this.sender = sender || new AccountAddress()
    this.sequenceNumber = sequenceNumber || Long.UZERO
    this.payload = payload || new TransactionPayload()
    this.maxGasAmount = maxGasAmount || Long.UZERO
    this.gasUnitPrice = gasUnitPrice || Long.UZERO
    this.expirationTime = expirationTime || Long.UZERO
}

/**
 * @memberof RawTransaction
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
RawTransaction.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeStruct(this.sender).unwrap()
            .encodeU64(this.sequenceNumber).unwrap()
            .encodeStruct(this.payload).unwrap()
            .encodeU64(this.maxGasAmount).unwrap()
            .encodeU64(this.gasUnitPrice).unwrap()
            .encodeU64(this.expirationTime).unwrap()
        return {}
    })
}

/**
 * @memberof RawTransaction
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<RawTransaction, Error>}
 */
RawTransaction.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const sender = deserializer.decodeStruct(AccountAddress).unwrap()
        const sequenceNumber = deserializer.decodeU64().unwrap()
        const payload = deserializer.decodeStruct(TransactionPayload).unwrap()
        const maxGasAmount = deserializer.decodeU64().unwrap()
        const gasUnitPrice = deserializer.decodeU64().unwrap()
        const expirationTime = deserializer.decodeU64().unwrap()

        return new RawTransaction(sender, sequenceNumber, payload, maxGasAmount, gasUnitPrice, expirationTime)
    })
}

/**
 * @class
 * @constructor
 * @implements {CanonicalSerializable | CanonicalDeserializable}
 * @param {RawTransaction | undefined} rawTxn 
 * @param {Buffer | undefined} publicKey 
 * @param {Buffer | undefined} signature 
 */
function SignedTransaction(rawTxn, publicKey, signature) {
    this.rawTxn = rawTxn || new RawTransaction()
    this.publicKey = publicKey || Buffer.alloc(0)
    this.signature = signature || Buffer.alloc(0)
}

/**
 * @memberof SignedTransaction
 * @param {CanonicalSerializer} serializer
 * @return {Result<{}, Error>}
 */
SignedTransaction.prototype.serialize = function (serializer) {
    return Result.safe(() => {
        serializer
            .encodeStruct(this.rawTxn).unwrap()
            .encodeBytes(this.publicKey).unwrap()
            .encodeBytes(this.signature).unwrap()
        return {}
    })
}

/**
 * @memberof SignedTransaction 
 * @param {CanonicalDeserializer} deserializer
 * @return {Result<SignedTransaction, Error>}
 */
SignedTransaction.prototype.deserialize = function (deserializer) {
    return Result.safe(() => {
        const rawTxn = deserializer.decodeStruct(RawTransaction).unwrap()
        const publicKey = deserializer.decodeBytes().unwrap()
        const signature = deserializer.decodeBytes().unwrap()
        return new SignedTransaction(rawTxn, publicKey, signature)
    })
}

module.exports = {
    BufferWrapper,
    AccountAddress,
    TransactionArgumentKind,
    TransactionArgument,
    Program,
    Module,
    Script,
    AccessPath,
    WriteOPKind,
    WriteOP,
    WriteSetMut,
    WriteSet,
    TransactionPayloadKind,
    TransactionPayload,
    RawTransaction,
    SignedTransaction,
}