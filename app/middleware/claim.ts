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