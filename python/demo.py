"""使用Python2实现一个简单的区块链
"""

import hashlib as hasher
import datetime as date

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


"""创建创世区块
"""
def create_genesis_block():
    return Block(0, date.datetime.now(), "Genesis Block", "0")


"""生成区块链中的后续区块
"""
def next_block(last_block):
    this_index = last_block.index + 1
    this_timestamp = date.datetime.now()
    # 这里写死data是一个字符串
    # 其实在区块链中，data可以是任意你想要存储的信息
    this_data = "Hey! I'm block " + str(this_index)
    this_previous_hash = last_block.hash
    return Block(this_index, this_timestamp, this_data, this_previous_hash)


