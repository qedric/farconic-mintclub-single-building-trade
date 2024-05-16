/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import buildings from "@/app/data/buildings.json"

export const maxDuration = 20

const handleRequest = frames(async (ctx) => {
    const style:string = "bg-fuchsia-800 border border-white rounded-lg"
    return {
        image: (
            <div tw="flex w-full h-full bg-gray-200 items-center justify-center">
                <div tw="flex flex-wrap p-8 w-3/5 h-7/8 bg-pink-700 text-white rounded-lg">
                    <div tw={`flex items-center justify-center w-full h-4/5 ${ style }`}>
                        <h1>?</h1>
                    </div>
                    <div tw="my-5 w-full flex justify-between">
                        <div tw={`flex text-sm w-1/3 mr-2 p-2 ${ style }`}>
                            Liquidity
                        </div>
                        <div tw={`flex text-sm w-1/3 mx-2 p-2 ${ style }`}>
                            Holders
                        </div>
                        <div tw={`flex text-sm w-1/3 ml-2 p-2 ${ style }`}>
                            Supply
                        </div>
                    </div>
                    <div tw="w-full flex justify-between items-center">
                        <div tw={`flex text-base w-2/5 mr-4 p-5 ${ style }`}>
                            Current Price
                        </div>
                        <div tw={`flex text-base w-3/5 ml-4 p-5 ${ style }`}>
                            City
                        </div>
                    </div>
                </div>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        textInput: "search e.g. \"bridge\" or \"Rome\"",
        buttons: [
            <Button action="post" target="/building/search">
                Search
            </Button>,
            <Button action="post" target={{ query: { building: JSON.stringify(buildings[Math.floor(Math.random() * buildings.length)]) }, pathname: "/building/card" }}>
                Random
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest