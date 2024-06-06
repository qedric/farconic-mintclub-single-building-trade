/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { getUserDataForFid } from 'frames.js'
import { NFT, estimatePriceMiddleware } from '@/app/utils'
import { mintclub, getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ethers } from 'ethers'
import { getAddressesForFid } from "frames.js"
import { ErrorFrame } from "@/app/components/Error"
import { baseSepolia } from "viem/chains"
import { error } from "frames.js/core"
import { getOpenseaData, getDetail } from '@/app/utils'

const handleRequest = frames(async (ctx) => {

    const fid = ctx.message?.requesterFid
    if (!fid) {
        return ErrorFrame("Requester FID Not Found", null, null, "A fresh start might do the trick. If the problem persists, let us know!")
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
            return ErrorFrame("Couldn't Get Price Estimate", null, null, "A fresh start might do the trick. If the problem persists, let us know!")
        }

        const building:NFT = JSON.parse(ctx.searchParams.building)

        let isApproved = false
        const approvedAddresses: string[] = []
        let balance = BigInt(0)
        if (ctx.searchParams.balance) {
            balance = BigInt(ctx.searchParams.balance)
        }
        if (balance > 0) {
            if (ctx.searchParams.approvedAddress) {
                console.log(`Address ${ctx.searchParams.approvedAddress} approved`)
                approvedAddresses.push(ctx.searchParams.approvedAddress)
                isApproved = true
            } else {
                // check that the seller has approved the contract to spend the NFT
                for (const address of addresses) {
                    const isApproved = await mintclub.network(baseSepolia.id).nft(building.address).getIsApprovedForAll({
                        owner: (address.address as `0x${string}`),
                        spender: getMintClubContractAddress('ZAP', baseSepolia.id)
                    })
                    if (isApproved) {
                        approvedAddresses.push(address.address);
                    }
                }
                isApproved = approvedAddresses.length > 0
                isApproved && console.log("Approved Addresses:", approvedAddresses)
            }

            if (ctx.isSell && isApproved && BigInt(balance) < qty) {
                qty = BigInt(balance)
            }
        }

        const [openseaData, detail] = await Promise.all([
            getOpenseaData((building as NFT).address),
            getDetail((building as NFT).address)
        ])

        const userData = await getUserDataForFid({ fid: (ctx.message?.requesterFid as number) })

        const buildingName = building.metadata.name
        let buildingNameFontSize:string = buildingName.length > 28 
            ? 'text-xs'
            : 'text-lg'

        const containerStyle:string = `flex items-center bg-[${building.building_color}] rounded-[16px] uppercase`
        const InfoDisplay: React.FC<{ label: string, value: string }> = ({ label, value }) => {
            return (
                <div tw="flex flex-col w-[12vw]">
                    <div tw="text-[12px] font-bold mb-0">{ label }</div>
                    <div tw={ `px-2 h-[2.625vw] text-[18px] ${containerStyle}` }>
                        { value }
                    </div>
                </div>
            )
        }

        return {
            image: (
                <div tw="flex w-full h-full" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
                    <div tw="flex flex-col relative bottom-[80px] w-full items-center justify-center">
                        <h1 tw="absolute top-[180px] text-[36px]">{ `${ctx.isSell ? 'Sell' : 'Buy'} Preview` }</h1>
                        
                        <div tw="flex relative -top-[40px] w-[600px] h-[600px] items-center justify-center" style={{ backgroundSize: '100% 100%', backgroundImage: `url(${process.env.NEXT_PUBLIC_GATEWAY_URL}/QmYHgaiorK3VJaab1qnHytF4csJ9ELPcmLZ6zK5wWfSeE5)`}}>
                            <div tw="flex flex-wrap relative w-[26.5vw] text-white p-0 m-0">
                                <div tw={ `flex flex-col relative w-full ${ containerStyle } h-[32.25vw]` }>
                                    <div tw="flex flex-1 text-[24px] w-[24vw] mb-1.5 items-end justify-between">
                                        <div tw="text-[8px]">{ building.metadata.attributes.find(attr => attr.trait_type == 'Country')?.value }</div>
                                        <div tw="text-[8px]">{ building.metadata.attributes.find(attr => attr.trait_type == 'City')?.value }</div>
                                    </div>
                                    <div tw="flex bg-red-200 items-center">
                                        <img tw="bg-green-200 w-[24vw]" src={ building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                                    </div>
                                    <div tw={`flex w-full flex-1 items-center justify-center px-4`}>
                                        <h1 tw={ `m-0 text-center ${buildingNameFontSize}` }>{ buildingName }</h1>
                                    </div>
                                </div>
                                <div tw="mt-2 w-full flex justify-between">
                                    <InfoDisplay label="Current Price:" value={ `${Math.round(parseFloat(ethers.formatEther(detail.info.priceForNextMint))*1e4) / 1e4} ETH` } />
                                    <InfoDisplay label="Supply:" value={ detail.info.currentSupply.toString() } />
                                </div>
                                <div tw="mt-1 w-full flex justify-between">
                                    <InfoDisplay label="Liquidity:" value={ `${Math.round(parseFloat(ethers.formatEther(detail.info.reserveBalance))*1e4) / 1e4} ETH` } />
                                    <InfoDisplay label="Holders:" value={ openseaData.owners.length } />
                                </div>
                            </div>
                        </div>

                        { userData && 
                            <div tw="absolute top-[270px] w-full flex flex-col justify-center items-center">
                                <img src={userData.profileImage} tw="w-[4.55vw] h-[4.55vw] rounded-full" />
                                {/* <div tw="flex flex-col w-[5.25vw] h-[5.25vw] rounded-full">
                                    <div tw="flex justify-center items-center bg-green-200 w-full h-1/2 rounded-t-full text-center"><div>T</div></div>
                                    <div tw="flex justify-center items-center bg-red-200 w-full h-1/2 rounded-b-full text-center"><div>B</div></div>
                                </div> */}
                                <div tw="flex lowercase text-[14px] text-white" style={{ transform: 'scale(0.6)' }}>@{ userData.username }</div>
                            </div>
                        }
                        
                        <div tw="flex flex-col absolute px-20 justify-center items-center bottom-[150px]">
                            <h1 tw="text-[50px] mb-5 leading-6">{ `Quantity: ${qty} ${ ctx.isSell ? ` | Your balance: ${balance}` : '' }` }</h1>
                            <h1 tw="text-[50px] mb-5 leading-6">{ `${ctx.isSell ? 'Total Value:' : 'Price:'} ${ (parseFloat(ethers.formatUnits(estimation, 18)).toFixed(4)) } ETH` }</h1>
                            <p tw="text-[30px] leading-6">{ `Is Approved for ${ approvedAddresses }`}</p> 
                            <p tw="text-[30px] leading-6">Slippage will be applied when you approve the transaction.</p>
                        </div>
                        
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
                            ? { query: { building: JSON.stringify(building), qty: qty.toString(), balance:balance.toString() }, pathname: "/trade" }
                            : { query: { contractAddress: building.address, qty: qty.toString(), estimation: estimation.toString() }, pathname: "/trade/txdata" }
                        }
                        post_url="/trade/txStatusTrade">
                    { ctx.isSell ? 'Buy Preview' : 'Buy 🛒' }
                </Button>,
                <Button 
                    action={
                        balance > 0 && ctx.isSell // tx will be either sell or approve
                            ? 'tx'
                            : 'post'
                    }
                    target={
                        balance > 0
                            ? ctx.isSell 
                                ? { query: { contractAddress: building.address, isSell:true, isApproved, qty: qty.toString(), estimation: estimation.toString() }, pathname: "/trade/txdata" }
                                : { query: { building: JSON.stringify(building), isSell:true, balance:balance.toString() }, pathname: "/trade" }
                            : '/'

                    }
                    post_url={
                        isApproved
                            ? "/trade/txStatusTrade"
                            : "/trade/txStatusApprove"
                    }
                >{ balance > 0 ? isApproved ? (ctx.isSell ? 'Sell 💰' : 'Sell Preview') : 'Approve Selling' : 'Home' }
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), qty: qty.toString(), isSell: ctx.isSell, balance:balance.toString() }, pathname: "/trade" }}>
                    Refresh Price
                </Button>
            ],
            textInput: 'Set Quantity & Refresh Price',
            headers: {  
                "Cache-Control": "max-age=0", 
            },
        }
    } else {
        return ErrorFrame(
            "Building Not Found",
            null,
            null,
            "If the issue persists, let us know!"
        )
    }
},
{
    middleware: [estimatePriceMiddleware]
})

export const GET = handleRequest
export const POST = handleRequest