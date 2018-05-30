var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require("body-parser");
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(",") : [];


/*
 * 区块类
 */
class Block{
    constructor(index, previousHash, timestamp, data, hash){
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
    }
}


/*
 * 存储自己作为P2P服务端收到的所有P2P连接
 */
var sockets = [];


/*
 * 消息类型
 */
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};


/*
 * 生成第一个区块
 * 使用blockchain存储阵列。第一个块总是硬编码“创世纪块”
 */
var getGenesisBlock = () =>{
    return new Block(0, "0", 1465154705, "my genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
};
var blockchain = [getGenesisBlock()];


var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.join());
    
    app.get("/blocks", (req, res) => res.send(JSON.stringify(blockchain)));

    app.post("/mineBlock", (req, res) => {
        var newBlock = generateNextBlock(req.body.data);
        addBlock(newBlock);
        broadcast(responseLatestMsg());
        console.log("block added: " + JSON.stringify(newBlock));
        res.send();
    });

    app.get("/peers", (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ":" + s._socket.remotePort));
    });

    app.post("/addPeer", (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });

    app.listen(http_port, () => console.log("Listening http on port: " + http_port)); 
};


var initP2PServer = () => {
    var server = new WebSocket.Server({port: p2p_port});
    /*
     * 注册收到P2P连接后的回调函数
     * 将连接的ws放到sockets中！
     * 供boastcast函数广播使用
     */
    server.on("connection", ws => initConnection(ws));
    console.log("listening websocket p2p port on: " + p2p_port); 
};


var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};


var initMessageHandler = (ws) => {
    ws.on("message", (data) => {
        var message = JSON.parse(data);
        console.log("Received message" + JSON.stringify(message));
        switch(message.type){
            case MessageType.QUERY_LATEST:

                /*
                    收到其他节点查询最后一个区块的请求
                    发送本地的最后一个区块信息

                    var responseLatestMsg = () => ({
                        "type": MessageType.RESPONSE_BLOCKCHAIN,
                        "data": JSON.stringify([getLatestBlock()])
                    });
                */
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                /*
                    收到其他节点查询到全部区块链的请求
                    发送自己本地所有的区块链信息

                    var responseChainMsg = () => ({
                        "type": MessageType.RESPONSE_BLOCKCHAIN, 
                        "data": JSON.stringify(blockchain);
                    });
                */
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};


var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log("connection failed to peer: " + ws.url);  
        sockets.splice(sockets.indexOf(ws), 1);  
    };
    ws.on("close", () => closeConnection(ws));
    ws.on("error", () => closeConnection(ws));
};


/*
 * 产生单元
 * 要生成块，需要知道前一块的哈希
 */
var generateNextBlock = (blockData) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
};


var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};


/*
 * 计算哈希
 * 哈希块需要保持数据的完整性。本实现中选择SHA-256
 */
var calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};


/*
 * 往本地区块链中添加新的区块
 */
var addBlock = (newBlock) => {
    if(isValidNewBlock(newBlock, getLatestBlock())){
        blockchain.push(newBlock);
    }
};


/*
 * 确认块的完整性
 * 我们必须始终能够确认单元或电路的完整性
 * 尤其是当你从其他单位新的单位，必须决定是否接受它们
 */
var isValidNewBlock = (newBlock, previousBlock) =>{
    if(previousBlock.index + 1 !== newBlock.index){
        console.log("invalid index");
        return false;
    }
    else if(previousBlock.hash !== newBlock.previousHash){
        console.log("invalid previoushash");
        return false;
    }
    else if(calculateHashForBlock(newBlock) !== newBlock.hash){
        console.log(typeof(newBlock.hash) + " " + typeof calculateHashForBlock(newBlock));
        console.log("invalid hash: " + calculateHashForBlock(newBlock) + " " + newBlock.hash);
        return false;
    }
    return true;
};


/*
 * 连接到区块链分布式网络上的所有P2P节点
 */
var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on("open", () => initConnection(ws));
        ws.on("error", () => {  
            console.log("connection failed")  
        }); 
    });
};


/*
 * 收到`MessageType.RESPONSE_BLOCKCHAIN`请求消息后的处理函数
 */
var handleBlockchainResponse = (message) => {
    // 解析消息，请求消息中是将整个区块链打包，为了顺序需要按照index排序
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    // 获取请求消息区块链中的最后一个区块
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    // 获取本地的最后一个区块
    var latestBlockHeld = getLatestBlock();
    /*
     * 如果请求区块链的最后一个区块的index大于本地区块链的最后一个区块的index
     * 说明需要更新本地区块
     */
    if(latestBlockReceived.index > latestBlockHeld.index){
        console.log("blockchain possibly behind. We got: " + latestBlockHeld.index + " Peer got: " + latestBlockReceived.index); 
        if(latestBlockHeld.hash === latestBlockReceived.previousHash){
            console.log("We can append the received block to our chain");
            blockchain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        }
        else if(receivedBlocks.length === 1){
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        }
        else{
            console.log("Received blockchain is longer than current blockchain");  
            replaceChain(receivedBlocks);
        }
    }
    else{
        console.log("received blockchain is not longer than received blockchain. Do nothing");
    }
};


/*
 * 选择链最长的
 * 在区块链的顺序必须被明确指定，但是在发生冲突的情况下
 * 例如，两个节点同时在同一生成的块和相同数量
 * 我们选择区块链，其中包含的块数量较多
 */
var replaceChain = (newBlocks) => {
    if(isValidChain(newBlocks) && newBlocks.length > blockchain.length){
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcast(responseLatestMsg());
    }
    else{
       console.log('Received blockchain invalid');
    }
};


/*
 * 判断当前的区块链是不是一个合法的区块链
 */
var isValidChain = (blockchainToValidate) => {
    // 判断blockchainToValidate的第一个区块是不是“创世纪”区块
    if(JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())){
        return false;
    }

    // 逐个判断每个区块是否合法
    var tempBlocks = [blockchainToValidate[0]];
    for(var i=1; i<blockchainToValidate.length; i++){
        if(isValidNewBlock(blockchainToValidate[i], tempBlocks[i-1])){
            tempBlocks.push(blockchainToValidate[i]);
        }
        else{
            return false;
        }
    }
    return true;
};


/*
 * 获取区块链中的最后一个区块
 */
var getLatestBlock = () => blockchain[blockchain.length - 1];


var queryChainLengthMsg = () => ({"type": MessageType.QUERY_LATEST});


var queryAllMsg = () => ({"type": MessageType.QUERY_ALL});


/*
 * 生成获取完整区块的请求消息
 */
var responseChainMsg = () => ({
    "type": MessageType.RESPONSE_BLOCKCHAIN, 
    "data": JSON.stringify(blockchain);
});


/*
 * 生成获取最后一个区块的请求消息
 */
var responseLatestMsg = () => ({
    "type": MessageType.RESPONSE_BLOCKCHAIN,
    "data": JSON.stringify([getLatestBlock()])
});


/*
 * 使用websocket发送消息
 */
var write = (ws, message) => ws.send(JSON.stringify(message));


/*
 * 使用WebSocket广播消息
 * 也就是向sockets中的每个对象发送消息
 */
var broadcast = (message) => sockets.forEach(socket => write(socket, message));



// 连接到所有的P2P节点
connectToPeers(initialPeers);
// 作为HTTP服务器启动
initHttpServer();
// 作为P2P服务器启动
initP2PServer();
/*
 * 特别说明一下P2P架构，每个节点既是P2P客户端，又是P2P服务端
 */
