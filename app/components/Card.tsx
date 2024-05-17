/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { NFT, getOpenseaData, getDetail } from '@/app/utils'
import { ethers } from 'ethers'

export const CardImage = async ( building:NFT ) => {

    const [openseaData, detail] = await Promise.all([
        getOpenseaData((building as NFT).address),
        getDetail((building as NFT).address)
    ])

    const style:string = "bg-fuchsia-800 border border-white rounded-lg"

    return (
        <div tw="flex w-full h-full bg-gray-200 items-center justify-center">
            <div tw="flex flex-wrap p-8 w-3/5 h-7/8 bg-pink-700 text-white rounded-lg">
                <div tw={ `p-4 flex flex-col items-center justify-center w-full h-4/5 ${ style }` }>
                    <img tw="w-full" src={ building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                    <h3 tw="my-2 overflow-hidden">{ building.metadata.name }</h3>
                </div>
                <div tw="my-5 w-full flex justify-between items-center">
                    <div tw={ `flex text-sm w-1/3 mr-2 p-2 ${ style }` }>
                        Liquidity<span tw="px-2 uppercase">{ Math.round(parseFloat(ethers.formatEther(detail.info.reserveBalance))*1e4) / 1e4 }</span>ETH
                    </div>
                    <div tw={ `flex text-sm w-1/3 mx-2 p-2 ${ style }` }>
                        Holders:<span tw="px-2 uppercase">{ openseaData.owners.length }</span>
                    </div>
                    <div tw={ `flex text-sm w-1/3 ml-2 p-2 ${ style }` }>
                        Supply:<span tw="px-2 uppercase">{ detail.info.currentSupply.toString() }</span>
                    </div>
                </div>
                <div tw="w-full flex justify-between items-center">
                    <div tw={ `flex text-base w-2/5 mr-4 p-5 ${ style }` }>
                        Current Price:<span tw="px-2 uppercase font-bold">{ Math.round(parseFloat(ethers.formatEther(detail.info.priceForNextMint))*1e4) / 1e4 }</span>ETH
                    </div>
                    <div tw={ `flex text-base w-3/5 ml-4 p-5 ${ style }` }>
                        City:<span tw="px-2 uppercase font-bold">{ building.metadata.attributes.find(attr => attr.trait_type == 'City')?.value as string }</span>
                    </div>
                </div>
            </div>
        </div>
    )
}