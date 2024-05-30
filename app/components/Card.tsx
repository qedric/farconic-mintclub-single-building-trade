/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { NFT, getOpenseaData, getDetail } from '@/app/utils'
import { ethers } from 'ethers'

export const CardImage = async ( building:NFT, userImg:string | undefined, userName:string | undefined ) => {

    const [openseaData, detail] = await Promise.all([
        getOpenseaData((building as NFT).address),
        getDetail((building as NFT).address)
    ])

    //console.log('mintclub token details:', detail)
    //console.log('opensea data:', openseaData)

    console.log('\n\nbuilding.building_color:', building.building_color)

    const buildingName = building.metadata.name
    let buildingNameFontSize:string = buildingName.length > 28 
        ? 'text-2xl my-1'
        : 'text-4xl my-4 pb-2'

    //const style:string = `flex text-4xl p-2 bg-[#e9464b] rounded-[20px] uppercase`
    const style:string = `flex text-4xl p-2 bg-[${building.building_color}] rounded-[20px] uppercase`

    return (
        <div tw="flex w-full h-full items-center justify-center">
            <div tw="flex w-full h-full items-center justify-center" style={{ backgroundPosition: '-22px 0%', backgroundSize: '105% 100%', backgroundImage: `url(${process.env.NEXT_PUBLIC_GATEWAY_URL}/QmSC9TQbDfdtUQq6aTkQTiFGXs6faakwbRchBHL2oDomcS)`}}>
            <div tw="flex flex-wrap relative p-6 w-3/5 h-11/12 text-white rounded-[40px]" >
                <div tw={ `py-2 flex flex-col items-center justify-center w-full h-9/12 ${ style }` }>
                    <p tw="text-2xl absolute top-4 left-9">{ building.metadata.attributes.find(attr => attr.trait_type == 'Country')?.value }</p>
                    <p tw="text-2xl absolute top-4 right-9">{ building.metadata.attributes.find(attr => attr.trait_type == 'City')?.value }</p>
                    <img tw="pt-16 w-full" style={{ objectFit: 'contain' }} src={ building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                    <h3 tw={`px-8 text-center ${buildingNameFontSize}`}>{ buildingName }</h3>
                    { userImg && 
                        <div tw="absolute -top-14 w-full flex flex-col justify-center items-center">
                            <img src={userImg} tw="w-28 h-28 rounded-full" />
                            <div tw="flex lowercase mt-1" style={{ fontSize: '16px'}}>@{ userName }</div>
                        </div>
                    }
                </div>
                <div tw="my-5 w-full flex justify-between items-center">
                    <div tw="flex flex-col w-1/2">
                        <div tw="px-2 text-2xl font-bold">Current Price:</div>
                        <div tw={ `mr-2 ${ style }` }>
                            <span tw="px-2">{ Math.round(parseFloat(ethers.formatEther(detail.info.priceForNextMint))*1e4) / 1e4 }</span>ETH
                        </div>
                    </div>
                    <div tw="flex flex-col w-1/2">
                        <div tw="px-2 text-2xl font-bold">Supply:</div>
                        <div tw={ `ml-2 ${ style }` }>
                            <span tw="px-2">{ detail.info.currentSupply.toString() }</span>
                        </div>
                    </div>
                </div>
                <div tw="w-full flex justify-between items-center">
                    <div tw="flex flex-col w-1/2">
                        <div tw="px-2 text-2xl font-bold">Liquidity:</div>
                        <div tw={ `mr-2 ${ style }` }>
                            <span tw="px-2">{ Math.round(parseFloat(ethers.formatEther(detail.info.reserveBalance))*1e4) / 1e4 }</span>ETH
                        </div>
                    </div>
                    <div tw="flex flex-col w-1/2">
                        <div tw="px-2 text-2xl font-bold">Holders:</div>
                        <div tw={ `ml-2 ${ style }` }>
                            <span tw="px-2">{ openseaData.owners.length }</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            
        </div>
    )
}