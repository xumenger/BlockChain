classdef Miner
    properties
        blockchain     % Miner have a reference to Block Chain
    end
    
    methods
        function obj = Miner(blockchain)
            obj.blockchain = blockchain;
        end
        
        function mine(obj, newData)
            % get last block of the blockchain
            latestBlock = obj.blockchain.getLatest();
            % construct new block
            newBlock = Block(ltestBlock.index+1, newData, latestBlock.selfHash);
            % brute force to get vaild hash
            not_found = true;
            iter = 1;
            Opt.Method = 'SHA-256';
            Opt.Input = 'ascii';
            while(not_found)
               newHash = DataHash(strcat(newBlock.getCombined(), num2str(iter)));
               if(strcmp(newHash(1:2), '00'))
                   newBlock.nonce = iter;
                   newBlock.selfHash = newHash;
                   obj.blockchain.addBlock(newBlock);
                   break;
               end
               iter = iter + 1;
            end
        end
    end
    
end

