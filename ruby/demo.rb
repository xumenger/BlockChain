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
        @hash          = calc_hash
    end

    # 创世区块
    def self.first(data = "Genesis")
        Block.new( data, "0000000000000000000000000000000000000000000000000000000000000000")    end

    # 创建下一个区块
    def self.next(previous, data="Transaction Data...")
        Block.new(data, previous.hash)
    end

private

    def calc_hash
        sha = Digest::SHA256.new
        sha.update(@timestamp.to_s + @previous_hash + @data)
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

pp blockchain

