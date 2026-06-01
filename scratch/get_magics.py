import random
import json

def popcount(x):
    return bin(x).count('1')

def set_bit(x, sq):
    return x | (1 << sq)

def get_rank(sq): return sq >> 3
def get_file(sq): return sq & 7

def mask_rook(sq):
    mask = 0
    r = get_rank(sq)
    f = get_file(sq)
    for i in range(r + 1, 7): mask = set_bit(mask, i * 8 + f)
    for i in range(r - 1, 0, -1): mask = set_bit(mask, i * 8 + f)
    for i in range(f + 1, 7): mask = set_bit(mask, r * 8 + i)
    for i in range(f - 1, 0, -1): mask = set_bit(mask, r * 8 + i)
    return mask

def mask_bishop(sq):
    mask = 0
    r = get_rank(sq)
    f = get_file(sq)
    i, j = r + 1, f + 1
    while i < 7 and j < 7:
        mask = set_bit(mask, i * 8 + j)
        i += 1; j += 1
    i, j = r + 1, f - 1
    while i < 7 and j > 0:
        mask = set_bit(mask, i * 8 + j)
        i += 1; j -= 1
    i, j = r - 1, f + 1
    while i > 0 and j < 7:
        mask = set_bit(mask, i * 8 + j)
        i -= 1; j += 1
    i, j = r - 1, f - 1
    while i > 0 and j > 0:
        mask = set_bit(mask, i * 8 + j)
        i -= 1; j -= 1
    return mask

def rook_attacks_sq(sq, block):
    attacks = 0
    r = get_rank(sq)
    f = get_file(sq)
    for i in range(r + 1, 8):
        attacks = set_bit(attacks, i * 8 + f)
        if block & (1 << (i * 8 + f)): break
    for i in range(r - 1, -1, -1):
        attacks = set_bit(attacks, i * 8 + f)
        if block & (1 << (i * 8 + f)): break
    for i in range(f + 1, 8):
        attacks = set_bit(attacks, r * 8 + i)
        if block & (1 << (r * 8 + i)): break
    for i in range(f - 1, -1, -1):
        attacks = set_bit(attacks, r * 8 + i)
        if block & (1 << (r * 8 + i)): break
    return attacks

def bishop_attacks_sq(sq, block):
    attacks = 0
    r = get_rank(sq)
    f = get_file(sq)
    i, j = r + 1, f + 1
    while i < 8 and j < 8:
        attacks = set_bit(attacks, i * 8 + j)
        if block & (1 << (i * 8 + j)): break
        i += 1; j += 1
    i, j = r + 1, f - 1
    while i < 8 and j >= 0:
        attacks = set_bit(attacks, i * 8 + j)
        if block & (1 << (i * 8 + j)): break
        i += 1; j -= 1
    i, j = r - 1, f + 1
    while i >= 0 and j < 8:
        attacks = set_bit(attacks, i * 8 + j)
        if block & (1 << (i * 8 + j)): break
        i -= 1; j += 1
    i, j = r - 1, f - 1
    while i >= 0 and j >= 0:
        attacks = set_bit(attacks, i * 8 + j)
        if block & (1 << (i * 8 + j)): break
        i -= 1; j -= 1
    return attacks

def set_occupancy(index, bits_in_mask, mask):
    occupancy = 0
    for i in range(bits_in_mask):
        lsb = mask & -mask
        sq = popcount(lsb - 1)
        mask &= mask - 1
        if index & (1 << i):
            occupancy |= (1 << sq)
    return occupancy

def random_u64():
    return random.getrandbits(64)

def random_u64_fewbits():
    return random_u64() & random_u64() & random_u64()

def find_magic(sq, m, is_rook):
    mask = m[sq]
    n = popcount(mask)
    a = [0] * (1 << n)
    b = [0] * (1 << n)
    
    for i in range(1 << n):
        b[i] = set_occupancy(i, n, mask)
        a[i] = rook_attacks_sq(sq, b[i]) if is_rook else bishop_attacks_sq(sq, b[i])
        
    for k in range(100000000):
        magic = random_u64_fewbits()
        if popcount((mask * magic) & 0xFF00000000000000) < 6:
            continue
            
        b_atk = [0] * (1 << n)
        fail = False
        for i in range(1 << n):
            j = ((b[i] * magic) & 0xFFFFFFFFFFFFFFFF) >> (64 - n)
            if b_atk[j] == 0:
                b_atk[j] = a[i]
            elif b_atk[j] != a[i]:
                fail = True
                break
        if not fail:
            return magic
    return 0

r_masks = [mask_rook(i) for i in range(64)]
b_masks = [mask_bishop(i) for i in range(64)]

print("Generating rooks...")
r_magics = []
for i in range(64):
    r_magics.append(find_magic(i, r_masks, True))

print("Generating bishops...")
b_magics = []
for i in range(64):
    b_magics.append(find_magic(i, b_masks, False))

with open('scratch/magics.json', 'w') as f:
    json.dump({
        'rookMagics': ["0x{:016x}n".format(m) for m in r_magics],
        'bishopMagics': ["0x{:016x}n".format(m) for m in b_magics]
    }, f, indent=2)

print("DONE")
