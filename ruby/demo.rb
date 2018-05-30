
class Block
    attr_reader :timestamp
    attr_reader :data
    attr_reader :previous_hash
    attr_reader :hash

    def initialize(data, previous_hash)
        @timestamp     = Time.now
        @data          = data
        @previous_hash = previous_hash
        @hash = calc_hash
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



