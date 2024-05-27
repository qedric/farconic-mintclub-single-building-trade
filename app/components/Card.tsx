/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { NFT, getOpenseaData, getDetail } from '@/app/utils'
import { ethers } from 'ethers'  

export const CardImage = async ( building:NFT ) => {

    const [openseaData, detail] = await Promise.all([
        getOpenseaData((building as NFT).address),
        getDetail((building as NFT).address)
    ])

    const bgImage = { backgroundSize:'100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmXWmxA1zkXTqHpDAatvu5MBio5gisjveppu8PWqzd2XMt)`}

    const style:string = "bg-fuchsia-800 rounded-[12px] uppercase"

    return (
        <div tw="bg-gray-200 flex w-full h-full items-center justify-center">
            <div tw="flex absolute bg-gray-600 mt-120 w-3/5 h-11/12 rounded-[24px] bottom-0" style={{ transform: 'scale(0.95) translate(-40px, -12px) skew(2deg, 0deg)'}}></div>
            <div tw="flex flex-wrap p-8 w-3/5 h-11/12 text-white rounded-[24px]" style={{ boxShadow: 'box-shadow: -3px 3px 5px 0px #3B3B3B', backgroundImage: 'linear-gradient(100deg, rgba(169,169,169,1) 20%, rgba(238,41,41,1) 28%, rgba(255,240,9,1) 38%, rgba(30,113,244,1) 46%, rgba(232,224,53,1) 55%, rgba(221,101,74,1) 63%, rgba(169,169,169,1) 80%)'}}>
                <div tw={ `p-4 flex flex-col items-center w-full h-auto ${ style }` }>
                    <img tw="pt-16 w-full" src={ building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                    <h3 tw="mt-2 overflow-hidden">{ building.metadata.name }</h3>
                </div>
                <div tw="my-5 w-full flex justify-between items-center">
                    <div tw="flex flex-col w-1/3">
                        <div tw="px-2 text-lg font-bold">Liquidity:</div>
                        <div tw={ `flex text-2xl mr-2 p-2 ${ style }` }>
                            <span tw="px-2">{ Math.round(parseFloat(ethers.formatEther(detail.info.reserveBalance))*1e4) / 1e4 }</span>ETH
                        </div>
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