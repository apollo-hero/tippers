const { RectAreaLight } = require("three");
const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const {initializeContract} = require("../utils/contractInit");

const contract = initializeContract()
exports.createCandidate = asyncErrorHandler(async(req ,res , next ) =>{
    if(!contract){
        return res.status(500).json({
            success : false,
            error : 'Contract not initialised'
        })
    }
    const {name , ownwerAddress , ownerPrivateKey} = req.body;

    try {
        const contractOwner = await contract.methods.onwer().call();
        if(ownwerAddress.toLowerCase() != contractOwner.toLowerCase()){
            return res.status(403).json({
                success : false,
                error : 'Only owner can add candidate'
            })
        }
        let txHash;

        if(ownerPrivateKey){
            // sign and send transaction with private key
            const account = web3.eth.accounts.prtivateKeyToAccount(ownerPrivateKey);
            const tx = contract.methods.addCandidate(name.trim());
            const gas = await tx.estimateGas({from : ownwerAddress});
            const gasPrice = await web3.eth.getGasPrice();

            const txData = {
                to : CONTACT_ADDRESS,
                data : tx.encodeABI(),
                gas : gas,
                gasPrice : gasPrice
            };

            const signedTx = await account.signTransaction(txData);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            txHash = receipt.transactionHash;
        }else{
            const receipt = await contract.methods.addCandidate(name.trim()).send({
                from : ownwerAddress,
                gas :30000
            });
            txHash = receipt.transactionHash;
        }
        res.status(201).json({
            success : true,
            data : {
                name : name.trim(),
                transactionHash : txHash
            }
        })
    } catch (error) {
        res.status(500).json({
            succsess : false,
            error : error.message || 'Failed to add candidate'
        });
    }
});

exports.getCandidates = asyncErrorHandler(async(req, res , next) => {
    if(!contract){
        return res.status(500).json({
            success : false,
            error : 'Contract not initialised'
        })
    }

    try {
        const candidates = await contract.methods.getCandidates().call();
        const totalVotes = await contract.methods.getTotalVotes().call();

        const formattedCandidates = candidates.map((candidate ,index) => ({
            index,
            name : candidate.name,
            voteCount : parseInt(candidate.voteCount),
            percentage : totalVotes > 0 ? ((parseInt(candidate.voteCount) / parseInt(totalVotes)) * 100).toFixed(2) : 0
        }))

        res.status(200).json({
            success : true,
            data : {
                candidates : formattedCandidates,
                totalVotes,
                totalCandidates : candidates.length
            }
        })
    } catch (error) {
        res.status(500).json({
            success : false,
            error : error.message 
        })
    }
})

exports.createVote = asyncErrorHandler(async(req  , res , next) => {
    if(!contract){
        return res.status(500).json({
            success : false,
            error : 'Contract not initialised'
        })
    }
    const {address , candidateIndex ,  privateKey} = req.body;
    try {
        const hasVoted= await contract.methods.hasVoted(address).call();
        if(hasVoted){
            res.status(400).json({
                succsess : false,
                error : 'Address already voted'
            })
        }

        const candidateCount = await contract.methods.getCandidateCount().call();
        if(candidateIndex >= parseInt(candidateCount)){
            res.status(400).json({
                succsess : false,
                error : 'Invalid candidate index'
            })
        }

        let txHash;

        if(ownerPrivateKey){
            // sign and send transaction with private key
            const account = web3.eth.accounts.prtivateKeyToAccount(ownerPrivateKey);
            const tx = contract.methods.vote(candidateIndex);
            const gas = await tx.estimateGas({from : ownwerAddress});
            const gasPrice = await web3.eth.getGasPrice();

            const txData = {
                to : CONTACT_ADDRESS,
                data : tx.encodeABI(),
                gas : gas,
                gasPrice : gasPrice
            };

            const signedTx = await account.signTransaction(txData);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            txHash = receipt.transactionHash;
        }else{
            const receipt = await contract.methods.vote(candidateIndex).send({
                from : ownwerAddress,
                gas :30000
            });
            txHash = receipt.transactionHash;
        }
        res.status(201).json({
            success : true,
            message : "Vote cast successful",
            data : {
                voter : address,
                candidateIndex,
                transactionHash : txHash
            }
        })
    } catch (error) {
        res.status(500).json({
            success : false,
            error : error.message 
        })
    }
})

exports.getWinner = asyncErrorHandler(async(req , res , next) => {
    if(!contract){
        return res.status(500).json({
            success : false,
            error : 'Contract not initialised'
        })
    }

    try{
        const winner = await contract.methods.getWinner().call();
        const candidates = await contract.methods.getCandidates().call();
        const totalVotes = await contract.methods.getTotalVotes().call();

        let winnerDetails =null;
        if(winnder !== 'Tie - No clear winner' && winner !== "No votes cast yet"){
            winnderDetails =  candidates.find(candidate => candidate.name === winner);
        }

        res.status(200).json({
            succsess : true,
            data : {
                winnder : winner,
                winnerDetails : winnderDetails ? {
                    name : winnderDetails.name,
                    voteCount : parseInt(winnderDetails.voteCount),
                    parcentage : totalVotes >0 ? ((parseInt(winnerDetails.voteCount) / parseInt(totalVotes)) *100).toFixed(2) : 0
                } : null,
                totalVotes 
            }
        })
    }catch (error) {
        res.status(500).json({
            success : false,
            error : error.message 
        })
    }
})