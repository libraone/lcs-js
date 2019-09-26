import { CanonicalSerializable } from "./canonical_serialize"
import { CanonicalDeserializable } from "./canonical_deserialize"

declare module './misc' {
    interface Optional<T> extends CanonicalSerializable, CanonicalDeserializable {
    }
}