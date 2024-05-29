/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { NFT, getNFTBalance, getTransactionReceipt } from '@/app/utils'
import { mintclub, getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'
import { getAddressesForFid } from "frames.js"
import { ErrorFrame } from "@/app/components/Error"
import { baseSepolia } from "viem/chains"

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

    console.log('handleRequest called')

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

        const building:NFT = JSON.parse(ctx.searchParams.building)

        const details = await mintclub.network('basesepolia').token(building.address).getDetail()

        console.log('details', details)

        // If ctx.message?.inputText cannot be converted to a bigint, or if it is greater than max supply minus current supply, then check ctx.searchParams.qty. 
        // If that is also not a valid bigint or is larget than details.currentSupply, then default to 1
        let qty: bigint = BigInt(1)
        if (ctx.message?.inputText) {
            try {
                const inputQty = BigInt(ctx.message.inputText)
                if (inputQty <= details.info.maxSupply - details.info.currentSupply) {
                    qty = inputQty
                } else {
                    qty = details.info.maxSupply - details.info.currentSupply
                }
            } catch (error) {
                // qty stays as 1, carry on
            }
        } else if (ctx.searchParams.qty) {
            try {
                const inputQty = BigInt(ctx.searchParams.qty)
                if (inputQty <= details.info.maxSupply - details.info.currentSupply) {
                    qty = inputQty
                } else {
                    qty = details.info.maxSupply - details.info.currentSupply
                }
            } catch (error) {
                // qty stays as 1, carry on
            }
        }
        const isSell:boolean = ctx.searchParams.isSell == 'true'

        console.log('building', building)
        console.log(`${isSell ? 'Selling' : 'Buying'} ${qty} of ${building.metadata.name}`)
       
        if (isSell) {

            // check that the connected address has balance to sell
            const balance:bigint = (await getNFTBalance((building.address as `0x${string}`), addresses[0].address) as bigint)
            console.log(`Balance: ${balance}`)
            if (balance < qty) {
                return {
                    image: (
                        <div tw="flex flex-col w-3/4 mx-auto text-left">
                            <p>{`You don't have enough ${building.metadata.name} cards!`}</p>
                            <p>Your balance:<span tw="ml-5">{ balance }</span></p>
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
                        <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade" }}>
                            Back
                        </Button>
                    ]
                }
            }
        }

        const estimation = await estimate(building.address, qty, isSell)

        return {
            image: (
                <div tw="flex flex-col justify-center items-center w-full h-full">
                    <h1 tw="text-5xl">{ (isSell ? 'Sell' : 'Buy')}{` ${qty}`}</h1>
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
                <Button action="post" target={{ query: { building: JSON.stringify(building), qty: qty.toString(), isSell: isSell }, pathname: "/trade" }}>
                    Refresh Price
                </Button>,
                <Button action="tx" target={{ query: { contractAddress: building.address, qty: qty.toString(), estimation:estimation.toString(), isSell:isSell, userAddress:addresses[0].address }, pathname: "/trade/txdata" }} post_url="/trade/txStatusTrade">
                    Confirm
                </Button>
            ],
            textInput: 'Quantity'
        }
    } else {
        return ErrorFrame("Error: can't find building")
    }
})

export const GET = handleRequest
export const POST = handleRequest