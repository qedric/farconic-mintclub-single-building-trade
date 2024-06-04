/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { NFT, getNFTBalance, estimatePriceMiddleware } from '@/app/utils'
import { mintclub, getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'
import { getAddressesForFid } from "frames.js"
import { ErrorFrame } from "@/app/components/Error"
import { baseSepolia } from "viem/chains"
import { error } from "frames.js/core"

const handleRequest = frames(async (ctx) => {

    const fid = ctx.message?.requesterFid
    if (!fid) {
        return ErrorFrame("Error: can't find requester fid")
    }

    const addresses = await getAddressesForFid({
        fid: fid,
    })

    if (addresses.length == 0) {
        error("Error: can't find connected address")
    }
    
    if (ctx.searchParams?.building) {

        let qty = ctx.qty

        const estimation = BigInt(ctx.priceEstimate)
        if (!estimation) {
            return ErrorFrame("Error: can't find price estimate")
        }

        const building:NFT = JSON.parse(ctx.searchParams.building)

        //console.log('building', building)
        console.log(`${ctx.isSell ? 'Selling' : 'Buying'} ${qty} ${building.metadata.name}`)

        // check that the connected address has balance to sell
        const balance:bigint = (await getNFTBalance((building.address as `0x${string}`), addresses[0].address) as bigint)

        console.log(`Balance: ${balance}`)

        let isApproved = false
        if (balance > 0) {
            // check that the seller has approved the contract to spend the NFT
            isApproved = await mintclub.network(baseSepolia.id).nft(building.address).getIsApprovedForAll({
                owner: (addresses[0].address as `0x${string}`),
                spender: getMintClubContractAddress('ZAP', baseSepolia.id)
            })

            console.log(`Balance: ${balance}`)
            if (ctx.isSell && balance < qty) {
                qty = balance
            }
            console.log(`Is Approved for ${addresses[0].address}:`, isApproved)
        }

        return {
            image: (
                <div tw="flex flex-col justify-center items-center w-full h-full">
                    <h1 tw="text-5xl">{ (ctx.isSell ? 'Sell' : 'Buy')}{` ${qty}`}</h1>
                    { ctx.isSell && <h2>{ `Your balance: ${balance}` }</h2>}
                    <div tw="flex shadow-xl">
                        <img width="900" src={building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string} />
                    </div>
                    <div tw="flex flex-col py-2 items-center">
                        <h1 tw="text-center text-4xl mb-2">{`Price: ${(parseFloat(ethers.formatUnits(estimation, 18)).toFixed(4))} ETH`}</h1>
                        <p tw="text-center text-3xl">slippage will be applied when you approve the transaction</p>
                    </div>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button 
                    action={ ctx.isSell ? "post" : "tx" }
                    target={
                        ctx.isSell
                            ? { query: { building: JSON.stringify(building), qty: qty.toString() }, pathname: "/trade" }
                            : { query: { contractAddress: building.address, qty: qty.toString(), estimation: estimation.toString() }, pathname: "/trade/txdata" }
                        }
                        post_url="/trade/txStatusTrade">
                    Buy
                </Button>,
                <Button 
                    action={
                        balance > 0
                            ? !isApproved || (ctx.isSell && isApproved)
                                ? 'tx'
                                : 'post'
                            : 'post'
                    }
                    target={
                        balance > 0 
                            ? !isApproved || (ctx.isSell && isApproved)
                                ? { query: { contractAddress: building.address, isSell:true, isApproved, qty: qty.toString(), estimation: estimation.toString() }, pathname: "/trade/txdata" }
                                : { query: { building: JSON.stringify(building), isSell:true }, pathname: "/trade" }
                            : '/'
                    }
                    post_url={
                        isApproved
                            ? "/trade/txStatusTrade"
                            : "/trade/txStatusApprove"
                    }
                >{ balance > 0 ? isApproved ? 'Sell' : 'Approve Selling' : 'Home' }
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), qty: qty.toString(), isSell: ctx.isSell }, pathname: "/trade" }}>
                    Refresh Price
                </Button>,
                <Button action="post" target="/">
                    Home
                </Button>,
            ],
            textInput: 'Set Quantity & Refresh Price',
        }
    } else {
        return ErrorFrame("Error: can't find building")
    }
},
{
    middleware: [estimatePriceMiddleware]
})

export const GET = handleRequest
export const POST = handleRequest