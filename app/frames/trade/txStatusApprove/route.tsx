/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getTransactionReceipt } from '@/app/utils'
import buildings from '@/app/data/buildings.json'

const handleRequest = frames(async (ctx) => {

    if (ctx.message?.transactionId) {
        
        const url = `https://base-sepolia.blockscout.com/tx/${ctx.message.transactionId}`

        const receipt = await getTransactionReceipt(ctx.message.transactionId)
        console.log('receipt', receipt.logs[0])

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = receipt.logs[0].topics[0]
            const building = buildings.find((building) => building.address === building_address)

            return {
                image: (
                    <div tw="flex">Transaction Submitted</div>
                ),
                buttons: [
                    <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/confirm" }}>
                        {`Sell ${building?.metadata.name}`}
                    </Button>,
                    <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                        My Cards / Learn more
                    </Button>
                ]
            }
        } else {
            return {
                image: (
                    <div>{`transaction status: ${receipt.status}`}</div>
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
                    <Button action="post" target={{ query: { transactionId: ctx.message.transactionId }, pathname: "/trade/sellApproved/txStatus" }}>
                        Refresh
                    </Button>
                ]
            }
        }
    } else {
        return {
            image: (
                <div>error can&apos;t find transaction</div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target="/">
                    Reset
                </Button>
            ]
        }
    }
})

export const GET = handleRequest
export const POST = handleRequest