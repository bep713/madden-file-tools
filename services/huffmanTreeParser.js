const { BitView, BitStream } = require('bit-buffer');
const HuffmanRoot = require('../filetypes/TDB/HuffmanRoot');
const HuffmanNode = require('../filetypes/TDB/HuffmanNode');
const HuffmanLeaf = require('../filetypes/TDB/HuffmanLeafNode');

let huffmanTreeParser = {};

huffmanTreeParser.parseTree = (buf) => {
    // given an entire tree buffer, create the tree data structure and return its root

    let previousQueue = [];
    let nextQueue = [];
    let currentIndex = 0;

    const rootNode = new HuffmanRoot(0);
    previousQueue.push(rootNode);

    while (previousQueue.length > 0) {
        const node = previousQueue.shift();

        for (let i = 0; i <= 1; i++) {
            let newNode;

            const index = buf.readUInt8(currentIndex);
            const value = buf.readUInt8(currentIndex + 1);
    
            if (index === 0) {
                newNode = new HuffmanLeaf(value);
            }
            else {
                newNode = new HuffmanNode(index);
            }

            if (i === 0) {
                newNode.huffmanValue = '0';
                node.left = newNode;
            }
            else {
                newNode.huffmanValue = '1';
                node.right = newNode;
            }
    
            currentIndex += 2;
        }

        if (node.right instanceof HuffmanNode) {
            nextQueue.push(node.right);
        }
        if (node.left instanceof HuffmanNode) {
            nextQueue.push(node.left);
        }

        if (previousQueue.length === 0 && nextQueue.length > 0) {
            const swapQueue = previousQueue;
            previousQueue = nextQueue;
            nextQueue = swapQueue;
        }
    }

    let mapping = {};
    buildLookupTable(rootNode, mapping, null);
    rootNode.lookupTable = mapping;
    return rootNode;
};

huffmanTreeParser.decodeBufferFromRoot = (root, buf, valueLength) => {
    // Given a buffer to decode and a Huffman root node, decode the text inside the buffer.
    let decodedResult = '';
    let currentByteIndex = 0;
    let currentNode = root;

    while (currentByteIndex < buf.length) {
        let currentByte = buf.readUInt8(currentByteIndex);

        for (let i = 0; i <= 7; i++) {
            const currentBit = (currentByte & 0x80) >> 7;
            let nodeToLookAt;

            if (currentBit === 0) {
                nodeToLookAt = currentNode.left;
            }
            else {
                nodeToLookAt = currentNode.right;
            }

            if (nodeToLookAt instanceof HuffmanLeaf) {
                decodedResult += String.fromCharCode(nodeToLookAt.value);
                currentNode = root;
            }
            else {
                currentNode = nodeToLookAt;
            }

            currentByte = (currentByte << 1) & 0xFF;
        }

        currentByteIndex += 1;
    }

    return decodedResult.slice(0, valueLength);
};

huffmanTreeParser.encodeStringFromRoot = (root, value) => {
    const stream = new BitStream(new BitView(Buffer.alloc(value.length*2)));
    stream.bigEndian = true;

    value.split('').filter((char) => {
        const lookupValue = root.lookupTable[char];
        if (!lookupValue) {
            console.warn(`Warning: The character '${char}' is not available in the Huffman tree, so it will be removed from the string.`)
        }
        return root.lookupTable[char];
    }).reduce((accum, cur) => {
        const lookupValue = root.lookupTable[cur];
        accum.writeBits(parseInt(lookupValue, 2), lookupValue.length);
        return accum;
    }, stream);

    return stream.buffer.slice(0, stream.byteIndex);
};

module.exports = huffmanTreeParser;

function buildLookupTable(node, mapping, value) {
    if (!value) { value = '' }

    const newValue = value + node.huffmanValue;

    if (node.left) {
        buildLookupTable(node.left, mapping, newValue);
    }

    if (node.right) {
        buildLookupTable(node.right, mapping, newValue);
    }

    if (!node.left && !node.right) {
        mapping[String.fromCharCode(node.value)] = newValue;
    }
};