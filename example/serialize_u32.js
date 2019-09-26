
// example for serialize/deserialize u32
const {
    SimpleSerializer, SimpleDeserializer,
} = require("../dist")

// serialize u32
const serializer = new SimpleSerializer()
serializer.encodeU32(1024).unwrap()
const serializedBytes = serializer.getOutput()

// deserialize u32
const deserializer = new SimpleDeserializer(serializedBytes)
const number = deserializer.decodeU32().unwrap()