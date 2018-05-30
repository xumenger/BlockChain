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

blockchain = [b0, b1, b2, b3]

pp blockchain

