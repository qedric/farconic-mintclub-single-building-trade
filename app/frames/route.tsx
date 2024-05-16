/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"

export const config = {
    maxDuration: 60,
}

const handleRequest = frames(async (ctx) => {

    return {
        image: (
            <div tw="flex w-full h-full bg-gray-200 items-center justify-center shadow-2xl">
                <div tw="flex flex-wrap mx-auto w-3/5 p-8 h-7/8 shadow-2xl bg-pink-700 text-white rounded-lg">
                    <div tw="p-4 flex flex-col items-center justify-center w-full h-4/5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                        <h1>?</h1>
                    </div>
                    <div tw="my-5 w-full flex justify-between items-center">
                        <div tw="flex text-sm w-1/3 mr-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                            Liquidity
                        </div>
                        <div tw="flex text-sm w-1/3 mx-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                            Holders
                        </div>
                        <div tw="flex text-sm w-1/3 ml-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                            Supply
                        </div>
                    </div>
                    <div tw="w-full flex justify-between items-center">
                        <div tw="flex text-base w-2/5 mr-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                            Current Price
                        </div>
                        <div tw="flex text-base w-3/5 ml-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
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
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest