import { fromHEX } from '@mysten/bcs';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
function isHexPrivateKey(value) {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    return /^[0-9a-fA-F]+$/.test(hex) && (hex.length === 64 || hex.length === 128);
}
export function loadKeypair(privateKey) {
    const normalized = privateKey.trim();
    if (normalized.length === 0) {
        throw new Error('Private key value is empty.');
    }
    if (normalized.startsWith('suiprivkey')) {
        const { schema, secretKey } = decodeSuiPrivateKey(normalized);
        switch (schema) {
            case 'ED25519':
                return Ed25519Keypair.fromSecretKey(secretKey);
            case 'Secp256k1':
                return Secp256k1Keypair.fromSecretKey(secretKey);
            case 'Secp256r1':
                return Secp256r1Keypair.fromSecretKey(secretKey);
            default:
                throw new Error(`Unsupported signature scheme parsed from private key: ${schema}`);
        }
    }
    if (isHexPrivateKey(normalized)) {
        const bytes = fromHEX(normalized.startsWith('0x') ? normalized.slice(2) : normalized);
        if (bytes.length === 32) {
            return Ed25519Keypair.fromSecretKey(bytes);
        }
        if (bytes.length === 64) {
            // Some tools export Ed25519 private keys as 64 byte concatenated secret+public key.
            return Ed25519Keypair.fromSecretKey(bytes.slice(0, 32));
        }
        throw new Error(`Unexpected hex private key length: ${bytes.length} bytes.`);
    }
    throw new Error('Unsupported private key format. Use `suiprivkey...` Bech32 or 32-byte hex.');
}
//# sourceMappingURL=keypair.js.map