/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { NFT } from '@/app/utils'

const handleRequest = frames(async (ctx) => {
    
    if (ctx.searchParams?.buildingData) {

        const building:NFT = JSON.parse(ctx.searchParams.buildingData)

        // image: building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string,

        return {
            image: (
                <div tw="flex w-full h-full bg-gray-200 items-center justify-center shadow-2xl">
                    <div tw="flex flex-wrap mx-auto w-3/5 p-8 h-5/6 shadow-2xl bg-pink-700 text-white rounded-lg">
                        <div tw="p-4 flex flex-col items-center justify-center w-full h-4/5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                            <img tw="w-full object-contain" src={building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string} />
                            <h3 tw="my-2">{building.metadata.name}</h3>
                        </div>
                        <div tw="my-5 w-full flex justify-between items-center">
                            <div tw="text-sm w-1/3 mr-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">Liquidity</div>
                            <div tw="text-sm w-1/3 mx-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">Holders</div>
                            <div tw="text-sm w-1/3 ml-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">Traders</div>
                        </div>
                        <div tw="w-full flex justify-between items-center">
                            <div tw="text-base w-2/5 mr-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">IDs</div>
                            <div tw="text-base w-3/5 ml-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">City:</div>
                        </div>
                        
                    </div>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/trade/buy" }}>
                    Buy
                </Button>,
                <Button action="post" target="/">
                    Sell
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ],
            textInput: 'Quantity - TO DO: show buy price'
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