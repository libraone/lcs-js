const { Buffer } = require("buffer")
const { expect } = require('chai')
const { SimpleSerializer, Result } = require('../dist')

/**
 * 
 * @param {Uint8Array} buffer 
 * @return {string}
 */
function bufferToHex(buffer) {
    return Array.prototype.map
        .call(buffer, (x) => ('00' + x.toString(16)).slice(-2))
        .join('');
}

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
 * @param {CanonicalSerializable} obj 
 * @return {Result<string, Error>}
 */
function hexSerializable(obj) {
    return Result.safe(() => {
        const serializer = new SimpleSerializer()
        obj.serialize(serializer).unwrap()
        return bufferToHex(serializer.getOutput()).toUpperCase()
    })
}

/**
 * @param {Result<string, Error>} result 
 * @param {string} valueExpect 
 */
function checkResult(result, valueExpect) {
    expect(result.isOK()).eq(true)
    expect(result.unwrap()).eq(valueExpect)
}

module.exports = {
    bufferToHex,
    hexToBuffer,
    hexSerializable,
    checkResult,
}