# ruby demo.rb 运行程序

require "digest"

class Block

    attr_reader :timestamp
    attr_reader :data
    attr_reader :previous_hash
    attr_reader :hash

    def initialize(data, previous_hash)
        @timestamp     = Time.now
        @data          = data
        @previous_hash = previous_hash
        @hash          = compute_hash_with_proof_of_work
    end

    # 创世区块
    def self.first(data = "Genesis")
        Block.new( data, "0000000000000000000000000000000000000000000000000000000000000000")    end

    # 创建下一个区块
    def self.next(previous, data="Transaction Data...")
        Block.new(data, previous.hash)
    end

    # 添加工作累证明算法的实现
    # 在经典的区块链中，你必须通过计算得到00开头的哈希作为块的标识符
    # 前缀的00越多，计算了就越大，也就越困难
    # 出于简单考虑，我们将难度设定为两个前缀0
    # 也就是 2^16 = 256 种可能
    def compute_hash_with_proof_of_work(difficulty = "00")
        nonce = 0
        loop do
            hash = calc_hash_with_nonce(nonce)
            if hash.start_with?(difficulty)
                return [nonce, hash]
            else
                nonce += 1
            end
        end
    end

    def calc_hash_with_nonce(nonce = 0)
        sha = Digest::SHA256.new
        sha.update(nonce.to_s + @index.to_s + @timestamp.to_s + @data.to_s + @previous_hash.to_s)
        sha.hexdigest
    end

end


# 测试
b0 = Block.first("Genesis")
b1 = Block.next( b0, "Transaction Data..." )
b2 = Block.next( b1, "Transaction Data......" )
b3 = Block.next( b2, "More Transaction Data..." )

# 难道区块链就是链表吗？
# 当然不是。我们使用链表的目的是获得指向前一个块的引用
# 在区块链中，每个块都必须有一个标识符，而这个标识符还必须依赖于前面块的标识符
# 这就意味着如果你要替换区块链中的一个块，就必须重新计算后面所有块的标识符
# 在上面的实现中，调用`calc_hash`方法计算块的标识符时，需要传入前一个块的签名，就是这个意思
blockchain = [b0, b1, b2, b3]

p blockchain

