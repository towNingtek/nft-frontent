import {
    ethers
} from "./ethers-5.6.9.esm.min.js";

export {
    connectMetaMask,
    purchase,
    getRemainder,
};

// Connect MetaMask wallet and return the provider
async function connectMetaMask() {
    // Set up connection with MetaMask
    let provider;
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    } catch (error) {
        console.error(error);
        console.error("Please install MetaMask.");
        throw error;
    }

    // Require user to add and switch to the correct blockchain
    // Use wallet_switchEthereumChain instead of wallet_addEthereumChain since Ethereum is in the default chain
    await provider.send("wallet_switchEthereumChain", chainConfig).catch(function(error) {
        console.error(error);
        throw error;
    })
    // Assign new provider with new chain
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // Require user to select wallet account
    await provider.send("eth_requestAccounts", []).catch(function(error) {
        if (error.code === 4001) { // EIP-1193 userRejectedRequest error
            console.error("Please connect to MetaMask.");
        } else {
            console.error(error);
        }
        throw error;
    });

    console.log("Connecting wallet is successful.");
    return provider;
}

// Generate the proof of the Merkle tree for the whitelist verification
function genMerkleTreeProof(signerAddr) {
    const hash = window.keccak256;
    const leaf = signerAddr;
    const tree = new window.MerkleTree(leaves, hash, merkleOptions);
    const proof = tree.getHexProof(hash(signerAddr));
    return proof;
}

// Interact with smart contract and buy NFT
async function purchase() {
    // Connect wallet and get provider
    let provider;
    try {
        provider = await connectMetaMask();
    } catch (error) {
        console.error(error);
        throw error;
    }
    const signer = provider.getSigner();

    // Call contract function for buying NFTs
    console.log("contract address: " + contractAddr);
    let response;
    const signerAddr = await signer.getAddress();
    const proof = [ "0xac0e4810f6992d16ad50d242e3dfd593b57b03665165850be41d1b09f7d59a54", "0x5bba912964a7620d90f46a71a08039f2750788d96d292862ab9fbf59760db694" ];// genMerkleTreeProof(signerAddr);
    const contract = new ethers.Contract(contractAddr, abi, signer);
    response = await contract.purchase(signerAddr, 1, proof).catch(function(error) {
        console.error("Contract error: " + error);
        throw error;
    });

    // Wait for transaction to be confirmed
    let receipt;
    let price;
    let replacedTx = true;
    let products = new Object();
    while (replacedTx) {
        await response.wait().then(function(result) {
            receipt = result;
            replacedTx = false;
        }).catch(function(error) {
            console.log(error.reason);
            if (error.cancelled)
                throw error;
            response = error.replacement;
        });
    }

    // Grab log for events
    // ERC721 NFT transfer
    const transactionHash = receipt.transactionHash
    for (let i = 0; i < receipt.logs.length; i++) {
        if (
            receipt.logs[i].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
            receipt.logs[i].topics[1] == "0x0000000000000000000000000000000000000000000000000000000000000000") {
            const tokenId = parseInt(receipt.logs[i].topics[3], 16);
            products[tokenId] = transactionHash;
        }
    }

    console.log("purchase transaction hash: " + transactionHash);
    console.log("purchase finished");
}

// Get the remainder of the available NFTs
async function getRemainder() {
    const provider = ethers.getDefaultProvider(rpcService);
    const contract = new ethers.Contract(contractAddr, abi, provider);
    // BigNumber objects
    const nextId = await contract.nextTokenId();
    const maxId = await contract.maxPurchaseId();
    const remainder = maxId.toNumber() - (nextId.toNumber() - 1);

    console.log(remainder);
    return remainder;
}
