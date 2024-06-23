/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { ethers } from 'ethers'
import { getOpenseaData, getDetail, NFT } from '@/app/utils'

export const CardImage = async ( 
    building:NFT,
    userImg:string | undefined = undefined,
    userName:string | undefined = undefined,
    scale:string | undefined = undefined
) => {

    const [openseaData, detail] = await Promise.all([
        getOpenseaData((building as NFT).address),
        getDetail((building as NFT).address)
    ])

    const buildingName = building.metadata.name
    let buildingNameFontSize:string = buildingName.length > 28 
        ? 'text-2xl'
        : 'text-4xl'

    const scaleTransform = scale ? `scale(${scale})` : 'scale(1)'
    const containerStyle:string = `flex items-center bg-[${building.building_color}] rounded-[16px] uppercase`

    const InfoDisplay: React.FC<{ label: string, value: string }> = ({ label, value }) => {
        return (
            <div tw="flex flex-col w-[24vw]">
                <div tw="text-[24px] font-bold mb-1">{ label }</div>
                <div tw={ `px-4 h-[5.25vw] text-[36px] ${containerStyle}` }>
                    { value }
                </div>
            </div>
        )
    }

    return (
        <div tw="flex w-full h-full items-center justify-center" style={{ transform: scaleTransform, backgroundImage: `url(${process.env.NEXT_PUBLIC_GATEWAY_URL}/QmYHgaiorK3VJaab1qnHytF4csJ9ELPcmLZ6zK5wWfSeE5)`}}>
            <div tw="flex flex-wrap relative w-[53vw] text-white p-0 m-0">
                <div tw={ `flex flex-col w-full ${ containerStyle } h-[64.5vw]` }>
                    <div tw="flex flex-1 text-[24px] w-[48vw] mb-2 items-end justify-between">
                        <div>{ building.metadata.attributes.find(attr => attr.trait_type == 'Country')?.value }</div>
                        <div>{ building.metadata.attributes.find(attr => attr.trait_type == 'City')?.value }</div>
                    </div>
                    <div tw="flex bg-red-200 items-center">
                        <img tw="bg-green-200 w-[48vw]" src={ building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                    </div>
                    <div tw={`flex w-full flex-1 items-center justify-center px-8`}>
                        <h1 tw={ `m-0 text-center ${buildingNameFontSize}` }>{ buildingName }</h1>
                    </div>
                </div>
                <div tw="mt-4 w-full flex justify-between">
                    <InfoDisplay label="Current Price:" value={ `${Math.round(parseFloat(ethers.formatEther(detail.info.priceForNextMint))*1e6) / 1e6} ETH` } />
                    <InfoDisplay label="Supply:" value={ detail.info.currentSupply.toString() } />
                </div>
                <div tw="mt-2 w-full flex justify-between">
                    <InfoDisplay label="Liquidity:" value={ `${Math.round(parseFloat(ethers.formatEther(detail.info.reserveBalance))*1e6) / 1e6} ETH` } />
                    <InfoDisplay label="Holders:" value={ openseaData.owners.length } />
                </div>
            </div>
            { userImg && 
                <div tw="absolute top-[37px] w-full flex flex-col justify-center items-center">
                    <img src={userImg} tw="w-[8.75vw] h-[8.75vw] rounded-full" />
                    {/* <div tw="flex flex-col w-[8.75vw] h-[8.75vw] rounded-full">
                        <div tw="flex justify-center items-center bg-green-200 w-full h-1/2 rounded-t-full text-center"><div>T</div></div>
                        <div tw="flex justify-center items-center bg-red-200 w-full h-1/2 rounded-b-full text-center"><div>B</div></div>
                    </div> */}
                    <div tw="flex lowercase mt-1 text-[24px] text-white">@{ userName }</div>
                </div>
            }
        </div>
    )
}