import { frames } from "../../frames"
import { TransactionTargetResponse } from "frames.js";
import { NextResponse } from "next/server"
import { 
    encodeFunctionData,
    Abi,
    http,
    createWalletClient
} from "viem"
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/abi.json'
import { getTypedData } from "@/app/utils"

export const POST = frames(async (ctx) => {
    if (!ctx.message) {
        throw new Error("No message");
    }

    const userAddress = ctx.message.requesterVerifiedAddresses[0]

    const account = privateKeyToAccount(process.env.PK as any)
    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
    })

    // generate a claim request
    const typedData = await getTypedData(
        userAddress || '',
        ctx.state?.cityClaimArgs?.buildingsForThisCity,
        ctx.state?.cityClaimArgs?.city.cityId,
    )

    // sign the claim request
    const signature = await client.signTypedData(typedData as any)

    // prepare the transaction params for claimBatch function
    const calldata = encodeFunctionData({
        abi: (abi.filter((item: any) => item.name === "claimWithSignature") as Abi),
        functionName: "claimWithSignature",
        args: [
            typedData.message,
            signature
        ],
    })

    return NextResponse.json<TransactionTargetResponse>({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: {
            abi: abi as Abi,
            to: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
            data: calldata,
            value: "0"
        }
    })
})