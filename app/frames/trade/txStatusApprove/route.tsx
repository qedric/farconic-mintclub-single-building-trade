/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getTransactionReceipt, getNFTBalance } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { ErrorFrame } from "@/app/components/Error"
import { decodeEventLog } from 'viem'
import abi from '@/app/data/mc_building_abi.json'

const handleRequest = frames(async (ctx) => {

    const txId = ctx.message?.transactionId || ctx.searchParams.transactionId

    if (txId) {

        console.log('transactionId', txId)
       
        const url = `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/${txId}`
        let receipt
        try {
            receipt = await getTransactionReceipt(txId as `0x${string}`)
        } catch (e) {
            console.log('error getting receipt:', e)
            return ErrorFrame(
                "Transaction Receipt Not Found",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" }),
                "Refresh and see if that helps. If not, let us know!"
            )
        }

        //console.log('receipt', receipt)

        // Find the 'Mint' event log with the bond contract address
        // Find the 'ApprovalForAll' event log with the bond contract address
        const approveEventLog = receipt.logs
        .map(log => ({
            ...log,
            decoded: decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics
            })
        }))
        .find(log => log.decoded.eventName === 'ApprovalForAll')

        console.log('approveEventLog', approveEventLog)

        if (!approveEventLog) {
            return ErrorFrame(
                "Approve Event Not Found",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" }),
                "A refresh might do the trick.  If not, try again from the start. If the issue persists, let us know!"
            )
        }

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = (approveEventLog as any).address
            const building = buildings.find((building) => building.address?.toLowerCase() === building_address.toLowerCase())
            console.log('approveEventLog', approveEventLog)
            const approvedAddress = (approveEventLog as any).decoded.args.account

            console.log('approvedAddress', approvedAddress)

            if (!building) {
                return ErrorFrame(
                    "Building Not Found",
                    'Refresh',
                    JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" }),
                    "A refresh might do the trick.  If not, try again from the start. If the issue persists, let us know!"
                )
            }

            // find how many of this building the user has in their newly-approved address
            let balance: { address: string, balance: string }[] = []
            balance.push({ address:approvedAddress, balance:(await getNFTBalance(building.address as `0x${string}`, approvedAddress as `0x${string}`) as bigint).toString() })

            return {
                image: (
                    <div tw="flex w-full h-full justify-center items-center" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(${process.env.NEXT_PUBLIC_GATEWAY_URL}/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
                        <div tw="flex flex-col absolute px-20 justify-center items-center">
                            <h1 tw="text-[50px] mb-5 leading-6">Transaction Submitted</h1>
                            <h1 tw="text-[50px] mb-5 leading-6">{ `Your Balance: ${ balance[0].balance }\n (${approvedAddress.substring(0, 5)}...${approvedAddress.substring(approvedAddress.length - 4)})` }</h1>                      
                        </div>
                    </div>
                ),
                imageOptions: {
                    aspectRatio: "1:1"
                },
                buttons: [
                    <Button action="post" target={{ query: { building: JSON.stringify(building), isSell: true, balance:JSON.stringify(balance) }, pathname: "/trade" }}>
                        {`Sell ${building.metadata.name}`}
                    </Button>
                ],
                headers: {  
                    "Cache-Control": "max-age=0", 
                },
            }
        } else {
            return {
                image: (
                    <div tw="flex w-full h-full justify-center items-center" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
                        <div tw="flex flex-col absolute px-20 justify-center items-center">
                            <h1 tw="text-[50px] mb-5 leading-6">Transaction Status:</h1>
                            <p tw="text-[30px] leading-6">{receipt.status}</p>                            
                        </div>
                    </div>
                ),
                imageOptions: {
                    aspectRatio: "1:1",
                },
                buttons: [
                    <Button action="post" target="/">
                        Reset
                    </Button>,
                    <Button action="link" target={url}>
                        View tx
                    </Button>,
                    <Button action="post" target={{ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" }}>
                        Refresh
                    </Button>
                ],
                headers: {  
                    "Cache-Control": "max-age=0", 
                },
            }
        }
    } else {
        return ErrorFrame("Transaction Not Found", null, null, "A fresh start might do the trick. If the problem persists, let us know!")
    }
})

export const GET = handleRequest
export const POST = handleRequest