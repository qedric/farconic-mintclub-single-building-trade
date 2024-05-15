/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { NFT, getNFTBalance } from '@/app/utils'
import { mintclub } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'

const estimate = async (tokenAddress:string, amount:bigint, isSell:boolean) => {
    const [estimation, royalty] = isSell
    ? await mintclub
        .network('basesepolia')
        .token(tokenAddress)
        .getSellEstimation(amount)
    : await mintclub
        .network('basesepolia')
        .token(tokenAddress)
        .getBuyEstimation(amount)
    console.log(`Estimate for ${amount}: ${ethers.formatUnits(estimation, 18)} ETH`)
    console.log('Royalties paid:', ethers.formatUnits(royalty.toString(), 18).toString())
    return estimation
}

const handleRequest = frames(async (ctx) => {

    if (ctx.message?.transactionId) {
        const url = `https://base-sepolia.blockscout.com/tx/${ctx.message.transactionId}`
        return {
            image: (
                <div tw="flex">Transaction Submitted</div>
            ),
            buttons: [
                <Button action="link" target={url}>
                    view tx
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                    My Cards / Learn more
                </Button>
            ]
        }
    }
    
    if (ctx.searchParams?.building) {

        const building:NFT = JSON.parse(ctx.searchParams.building)
        const qty:bigint = ctx.message?.inputText ? BigInt(ctx.message?.inputText) : ctx.searchParams.qty ? ctx.searchParams.qty : BigInt(1)
        const isSell:boolean = ctx.searchParams.isSell == 'true'

        console.log('building', building)
        console.log(`Trading ${qty} of ${building.metadata.name}`)

        // check that the connected address has balance to sell
        if (isSell) {
            const balance:bigint = (await getNFTBalance((building.address as `0x${string}`), (ctx as any).message.requesterVerifiedAddresses[0]) as bigint)
            if (balance < qty) {
                return {
                    image: (
                        <div tw="flex flex-col w-3/4 mx-auto text-center">
                            <p>You don't have enough { building.metadata.name } cards!</p>
                            <p>Your balance: { balance }</p>
                        </div>
                    ),
                    imageOptions: {
                        aspectRatio: "1:1",
                    },
                    buttons: [
                        <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/card" }}>
                            Back
                        </Button>,
                        <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                            view on opensea
                        </Button>
                    ]
                }
            }
        }

        const estimation = await estimate(building.address, qty, isSell)

        return {
            image: (
                <div tw="flex flex-col justify-center items-center w-full h-full">
                    <h1>{ isSell ? 'Sell' : 'Buy'}</h1>
                    <div tw="flex shadow-xl">
                        <img tw="rotate-45" width="500" src={building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string} />
                    </div>
                    <div tw="flex flex-col items-center">
                        <h1 tw="text-center">{`Price: ${(parseFloat(ethers.formatUnits(estimation, 18)).toFixed(4))} ETH`}</h1>
                        <p tw="text-center">slippage will be applied when you approve the transaction</p>
                    </div>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/card" }}>
                    Back
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), qty: qty.toString() }, pathname: "/building/trade" }}>
                    Refresh Price
                </Button>,
                <Button action="tx" target={{ query: { contractAddress: building.address, qty: qty.toString(), estimation:estimation.toString(), isSell:isSell }, pathname: "/building/trade/txdata" }} post_url="/building/trade">
                    Confirm
                </Button>
            ]
        }
    } else {
        return {
            image: (
                <div>error can't find building</div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target="/">
                    Reset
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ]
        }
    }
})

export const GET = handleRequest
export const POST = handleRequest