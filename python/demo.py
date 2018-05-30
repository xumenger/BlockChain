"""使用Python2实现一个简单的区块链
"""

import hashlib as hasher

"""区块类
"""
class Block:
    def __init__(self, index, timestamp, data, previous_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.hash_block()

    def hash_block(self):
        sha = hasher.sha256()
        sha.update(str(self.index) + str(self.timestamp) + str(self.data) + self.previous_hash)
        return sha.hexdigest()

