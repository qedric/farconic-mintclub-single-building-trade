/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { NFT, getNFTBalance } from '@/app/utils'
import { mintclub, getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'
import { getAddressesForFid } from "frames.js"
import { ErrorFrame } from "@/app/components/Error"
import { baseSepolia } from "viem/chains"
import { estimatePriceMiddleware } from '@/app/utils'

const handleRequest = frames(async (ctx) => {

    const fid = ctx.message?.requesterFid
    if (!fid) {
        return ErrorFrame("Error: can't find requester fid")
    }

    const addresses = await getAddressesForFid({
        fid: fid,
    })

    if (addresses.length == 0) {
        ErrorFrame("Error: can't find connected address")
    }
    
    if (ctx.searchParams?.building) {

        const estimation = BigInt(ctx.priceEstimate)
        if (!estimation) {
            return ErrorFrame("Error: can't find price estimate")
        }

        const building:NFT = JSON.parse(ctx.searchParams.building)

        //console.log('building', building)
        console.log(`${ctx.isSell ? 'Selling' : 'Buying'} ${ctx.qty} ${building.metadata.name}`)
       
        if (ctx.isSell) {

            // check that the connected address has balance to sell
            const balance:bigint = (await getNFTBalance((building.address as `0x${string}`), addresses[0].address) as bigint)
            console.log(`Balance: ${balance}`)
            if (balance < ctx.qty) {
                return {
                    image: (
                        <div tw="flex flex-col w-3/4 mx-auto items-center justify-center text-center">
                            <h1 tw="text-5xl">{`You don't have enough ${building.metadata.name} cards!`}</h1>
                            <h2 tw="text-4xl">Your balance:<span tw="ml-5">{ balance.toString() }</span></h2>
                        </div>
                    ),
                    imageOptions: {
                        aspectRatio: "1:1",
                    },
                    buttons: [
                        <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/card" }}>
                            Back
                        </Button>,
                        <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                            view on opensea
                        </Button>
                    ]
                }
            }

            // check that the seller has approved the contract to spend the NFT
            const isApproved = await mintclub.network(baseSepolia.id).nft(building.address).getIsApprovedForAll({
                owner: (addresses[0].address as `0x${string}`),
                spender: getMintClubContractAddress('ZAP', baseSepolia.id)
            })

            console.log(`Is Approved for ${addresses[0].address}:`, isApproved)

            if (!isApproved) {
                return {
                    image: (
                        <div tw="flex items-center justify-center w-3/4 mx-auto text-center">
                            <h1>{`You need to approve the contract to sell ${building.metadata.name} cards!`}</h1>
                        </div>
                    ),
                    imageOptions: {
                        aspectRatio: "1:1",
                    },
                    buttons: [
                        <Button action="tx" target={{ query: { contractAddress: building.address, approve:true, userAddress:addresses[0].address }, pathname: "/trade/txdata" }} post_url="/trade/txStatusApprove">
                            Approve Contract
                        </Button>,
                        <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/" }}>
                            Back
                        </Button>
                    ]
                }
            }
        }

        return {
            image: (
                <div tw="flex flex-col justify-center items-center w-full h-full">
                    <h1 tw="text-5xl">{ (ctx.isSell ? 'Sell' : 'Buy')}{` ${ctx.qty}`}</h1>
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
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/card" }}>
                    Back
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), qty: ctx.qty.toString(), isSell: ctx.isSell }, pathname: "/trade" }}>
                    Refresh Price
                </Button>,
                <Button action="tx" target={{ query: { contractAddress: building.address, qty: ctx.qty.toString(), estimation:estimation.toString(), isSell:ctx.isSell, userAddress:addresses[0].address }, pathname: "/trade/txdata" }} post_url="/trade/txStatusTrade">
                    Confirm
                </Button>
            ],
            textInput: 'Quantity'
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