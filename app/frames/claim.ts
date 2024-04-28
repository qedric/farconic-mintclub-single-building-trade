import { types } from "frames.js/next"
import {
    http,
    createWalletClient
} from "viem"
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from "viem/chains"
import { getTypedData } from "@/app/utils"

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

    /* const body = JSON.stringify({
        "signerAddress": process.env.SYNDICATE_WALLET_ADDRESS,
        "message": typedData.message,
        "domain": typedData.domain,
        "types": typedData.types,
        "primaryType": typedData.primaryType
    }) */

    const account = privateKeyToAccount(process.env.PK as any)
    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
    })

    // sign the claim request
    const signature = await client.signTypedData(typedData as any)

    console.log('sig:', signature)
    console.log(typedData.message)

    try {

        const options = {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: `{"projectId":"${process.env.SYNDICATE_PROJECT_ID}","contractAddress":"0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}","chainId":${baseSepolia.id},"functionSignature":"claimWithSignature((address to, uint256[] inTokenIds, uint256 outTokenId, uint128 validityStartTimestamp, uint128 validityEndTimestamp, bytes32 uid) _req, bytes _signature)","args":{"_req":${JSON.stringify(typedData.message)},"_signature":"${signature}"}}`
        }
        
        const response = await fetch('https://api.syndicate.io/transact/sendTransaction', options)

        const responseData = await response.json()

        txId = responseData.transactionId ? responseData.transactionId : ''

    } catch (err) {
        console.error(err)
    }

    console.log('tx id:', txId)

    return next({ txId: txId || '' })
}