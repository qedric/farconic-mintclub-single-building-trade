/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../../frames"
import { Element } from '@/app/utils'
import { mintclub } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'

const TEST_MINTCLUB_TOKEN_ADDRESS="0x61c14879b2d63253aef48f41e4be704a08501ad1"

const handleRequest = frames(async (ctx) => {

    const estimate = async (amount:bigint) => {
        const [estimation, royalty] = await mintclub
          .network('basesepolia')
          .token(TEST_MINTCLUB_TOKEN_ADDRESS)
          .getBuyEstimation(amount)
        console.log(`Estimated cost for ${amount}: ${ethers.formatUnits(estimation, 18)} ETH`)
        console.log('Royalties paid:', ethers.formatUnits(royalty.toString(), 18).toString())
        return estimation
    }

    if (ctx.message?.transactionId) {
        const url = `https://base-sepolia.blockscout.com/tx/${ctx.message.transactionId}`
        return {
            image: (
                <div tw="flex">Transaction Subnitted</div>
            ),
            buttons: [
                <Button action="link" target={url}>
                    view tx
                </Button>
            ]
        }
    }
    
    if (ctx.searchParams?.building) {

        if (!ctx.message?.inputText) {
            throw new Error("No quantity")
        }

        const building:Element = JSON.parse(ctx.searchParams.building)
        const qty:bigint = BigInt(ctx.message?.inputText)

        return {
            image: (
                <div tw="flex flex-col justify-center items-center w-full h-full">
                    <div tw="flex shadow-xl">
                        <img tw="rotate-45" width="500" src={building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string} />
                    </div>
                    <div tw="flex flex-col items-center">
                        <h1 tw="text-center">{`Price: ${ethers.formatUnits(await estimate(qty), 18)} ETH`}</h1>
                        <p tw="text-center">slippage will be applied when you approve the transaction</p>
                    </div>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/trade" }}>
                    Back
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/trade/buy" }}>
                    Refresh Price
                </Button>,
                <Button action="tx" target={{ query: { contractAddress: TEST_MINTCLUB_TOKEN_ADDRESS, qty: qty.toString() }, pathname: "/building/trade/txdata" }} post_url="/building/trade/buy">
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