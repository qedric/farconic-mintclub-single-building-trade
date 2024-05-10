import { types } from "frames.js/next"
import { baseSepolia } from "viem/chains"
import { getMerkleProof, getTypedData } from "@/app/utils"
import { ethers } from "ethers"

export const claimCity: types.FramesMiddleware<any, { txId: string }> = async (
    ctx,
    next
) => {
    if (!(ctx as any).message) {
        throw new Error("No message")
    }

    let txId: string | undefined
    const userAddress = (ctx as any).message.requesterVerifiedAddresses[0]

    console.log('user address:', userAddress)

    const state = JSON.parse((ctx as any).message.state);
    console.log('state:', state)

    const typedData = await getTypedData(
        userAddress || '',
        state.buildingsForThisCity,
        state.city.cityId
    )

    try {

        // first sign the claim request
        let options = {
            method: 'POST',
            headers: {
            Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
            'Content-Type': 'application/json'
            },
            body: `{"signerAddress":"${process.env.SYNDICATE_SIGNER_ADDRESS}","message":${JSON.stringify(typedData.message)},"domain":${JSON.stringify(typedData.domain)},"types":${JSON.stringify(typedData.types)},"primaryType":"${typedData.primaryType}"}`
        }
        
        const getTypedDataTx = await fetch(`https://api.syndicate.io/wallet/project/${process.env.SYNDICATE_PROJECT_ID}/signTypedData`, options)
        const txResult = await getTypedDataTx.json()

        // prepare the claimWithSignature transaction body
        options.body = `{"projectId":"${process.env.SYNDICATE_PROJECT_ID}","contractAddress":"0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}","chainId":${baseSepolia.id},"functionSignature":"claimWithSignature((address to, uint256[] inTokenIds, uint256 outTokenId, uint128 validityStartTimestamp, uint128 validityEndTimestamp, bytes32 uid) _req, bytes _signature)","args":{"_req":${JSON.stringify(typedData.message)},"_signature":"${txResult.signature}"}}`
        const response = await fetch('https://api.syndicate.io/transact/sendTransaction', options)
        const responseData = await response.json()

        txId = responseData.transactionId ? responseData.transactionId : ''

    } catch (err) {
        console.error(err)
    }

    console.log('tx id:', txId)

    return next({ txId: txId || '' })
}

export const claimBuildings: types.FramesMiddleware<any, { txId: string }> = async (
    ctx,
    next
) => {
    if (!(ctx as any).message) {
        throw new Error("No message")
    }

    const LAST_BUILDING_ID:number = parseInt(process.env.LAST_BUILDING_ID as string) || 0
    const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const ZERO_BYTES = ethers.zeroPadValue(ethers.toUtf8Bytes(''), 32)

    let txId: string | undefined
    const userAddress = (ctx as any).message.requesterVerifiedAddresses[0]

    console.log('user address:', userAddress)

    try {
        const fSig = "claimRandomBatch(uint8 _batchSize, uint256 _min, uint256 _max, address _receiver, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data)"
        const proof = JSON.stringify(getMerkleProof([], userAddress || "", "10", '0'))
        const args = `{"_batchSize": "10", "_min": "0", "_max": "${LAST_BUILDING_ID}", "_receiver": "${userAddress}", "_currency": "${NATIVE_TOKEN}", "_pricePerToken": "0", "_allowlistProof": ${proof}, "_data": "${ZERO_BYTES}"}`
        console.log(args)
        // prep the transaction
        let options = {
            method: 'POST',
            headers: {
            Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
            'Content-Type': 'application/json'
            },
            body: `{"projectId":"${process.env.SYNDICATE_PROJECT_ID}","contractAddress":"0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}","chainId":${baseSepolia.id},"functionSignature":"${fSig}","args":${args}}`
        }

        const response = await fetch('https://api.syndicate.io/transact/sendTransaction', options)
        const responseData = await response.json()

        txId = responseData.transactionId ? responseData.transactionId : ''

    } catch (err) {
        console.error(err)
    }

    return next({ txId: txId || '' })
}