const fs = require('fs');

const randomBigInt = () => {
    return BigInt(Math.floor(Math.random() * 0xFFFFFFFF)) | (BigInt(Math.floor(Math.random() * 0xFFFFFFFF)) << 32n);
};

const randomBigIntFewBits = () => {
    return randomBigInt() & randomBigInt() & randomBigInt();
};

function popcount(x) {
    let count = 0n;
    while (x) {
        count++;
        x &= x - 1n;
    }
    return Number(count);
}

function setBit(x, sq) {
    return x | (1n << BigInt(sq));
}

function getRank(sq) { return sq >> 3; }
function getFile(sq) { return sq & 7; }

function maskRook(sq) {
    let mask = 0n;
    const r = getRank(sq);
    const f = getFile(sq);
    for (let i = r + 1; i <= 6; i++) mask = setBit(mask, i * 8 + f);
    for (let i = r - 1; i >= 1; i--) mask = setBit(mask, i * 8 + f);
    for (let i = f + 1; i <= 6; i++) mask = setBit(mask, r * 8 + i);
    for (let i = f - 1; i >= 1; i--) mask = setBit(mask, r * 8 + i);
    return mask;
}

function maskBishop(sq) {
    let mask = 0n;
    const r = getRank(sq);
    const f = getFile(sq);
    for (let i = r + 1, j = f + 1; i <= 6 && j <= 6; i++, j++) mask = setBit(mask, i * 8 + j);
    for (let i = r + 1, j = f - 1; i <= 6 && j >= 1; i++, j--) mask = setBit(mask, i * 8 + j);
    for (let i = r - 1, j = f + 1; i >= 1 && j <= 6; i--, j++) mask = setBit(mask, i * 8 + j);
    for (let i = r - 1, j = f - 1; i >= 1 && j >= 1; i--, j--) mask = setBit(mask, i * 8 + j);
    return mask;
}

function rookAttacksSq(sq, block) {
    let attacks = 0n;
    const r = getRank(sq);
    const f = getFile(sq);
    for (let i = r + 1; i <= 7; i++) { attacks = setBit(attacks, i * 8 + f); if (block & (1n << BigInt(i * 8 + f))) break; }
    for (let i = r - 1; i >= 0; i--) { attacks = setBit(attacks, i * 8 + f); if (block & (1n << BigInt(i * 8 + f))) break; }
    for (let i = f + 1; i <= 7; i++) { attacks = setBit(attacks, r * 8 + i); if (block & (1n << BigInt(r * 8 + i))) break; }
    for (let i = f - 1; i >= 0; i--) { attacks = setBit(attacks, r * 8 + i); if (block & (1n << BigInt(r * 8 + i))) break; }
    return attacks;
}

function bishopAttacksSq(sq, block) {
    let attacks = 0n;
    const r = getRank(sq);
    const f = getFile(sq);
    for (let i = r + 1, j = f + 1; i <= 7 && j <= 7; i++, j++) { attacks = setBit(attacks, i * 8 + j); if (block & (1n << BigInt(i * 8 + j))) break; }
    for (let i = r + 1, j = f - 1; i <= 7 && j >= 0; i++, j--) { attacks = setBit(attacks, i * 8 + j); if (block & (1n << BigInt(i * 8 + j))) break; }
    for (let i = r - 1, j = f + 1; i >= 0 && j <= 7; i--, j++) { attacks = setBit(attacks, i * 8 + j); if (block & (1n << BigInt(i * 8 + j))) break; }
    for (let i = r - 1, j = f - 1; i >= 0 && j >= 0; i--, j--) { attacks = setBit(attacks, i * 8 + j); if (block & (1n << BigInt(i * 8 + j))) break; }
    return attacks;
}

function setOccupancy(index, bitsInMask, mask) {
    let occupancy = 0n;
    for (let i = 0; i < bitsInMask; i++) {
        // get LSB of mask
        let lsb = mask & -mask;
        let sq = popcount(lsb - 1n);
        mask &= mask - 1n; // clear LSB
        if (index & (1 << i)) {
            occupancy |= (1n << BigInt(sq));
        }
    }
    return occupancy;
}

function findMagic(sq, m, isRook) {
    let mask = m[sq];
    let n = popcount(mask);
    let a = new Array(1 << n);
    let b = new Array(1 << n);
    let bAtk = new Array(1 << n);
    for (let i = 0; i < (1 << n); i++) {
        b[i] = setOccupancy(i, n, mask);
        a[i] = isRook ? rookAttacksSq(sq, b[i]) : bishopAttacksSq(sq, b[i]);
    }

    for (let k = 0; k < 100000000; k++) {
        let magic = randomBigIntFewBits();
        // Skip if not enough bits in upper 8 bits after multiply
        if (popcount((mask * magic) & 0xFF00000000000000n) < 6) continue;

        bAtk.fill(0n);
        let fail = false;
        for (let i = 0; !fail && i < (1 << n); i++) {
            // Using bigints for shift
            let j = Number((b[i] * magic) >> BigInt(64 - n));
            if (bAtk[j] === 0n) {
                bAtk[j] = a[i];
            } else if (bAtk[j] !== a[i]) {
                fail = true;
            }
        }
        if (!fail) return magic;
    }
    throw new Error('Magic not found');
}

let rMasks = new Array(64);
let bMasks = new Array(64);
for(let i=0; i<64; i++) { rMasks[i] = maskRook(i); bMasks[i] = maskBishop(i); }

let rMagics = new Array(64);
let bMagics = new Array(64);

console.log("Generating rooks...");
for(let i=0; i<64; i++) { rMagics[i] = findMagic(i, rMasks, true); }
console.log("Generating bishops...");
for(let i=0; i<64; i++) { bMagics[i] = findMagic(i, bMasks, false); }

fs.writeFileSync('d:/Developer/Next.Js/next-chess/scratch/magics.json', JSON.stringify({
    rookMagics: rMagics.map(m => "0x" + m.toString(16) + "n"),
    bishopMagics: bMagics.map(m => "0x" + m.toString(16) + "n")
}, null, 2));

console.log("DONE");