/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { FramesHandlerFunctionReturnType } from "frames.js/types"

export const ErrorFrame = async (message: string, post_button_label:string | null=null, post_button_query: string | null=null):Promise<FramesHandlerFunctionReturnType<any>> =>({
    image: (
        <div tw="flex w-full h-full" style={{ backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmY2ayTRPEwBMZkWa5uvfgHn1nnSFAQgCUvANa8Z3PENZW)`}}>
            <div tw="flex flex-col relative bottom-20 w-full h-full items-center justify-center">
                <h1 tw="relative top-[16%] text-7xl">Error</h1>
                <h2 tw="relative px-20 text-center bottom-[20%] flex text-4xl">{ message }</h2>
            </div>
        </div> 
    ),
    imageOptions: {
        aspectRatio: "1:1",
    },
    buttons: post_button_query
    ?   [
            <Button action="post" target={ JSON.parse(post_button_query) }>
                { `${post_button_label}` }
            </Button>,
            <Button action="post" target="/">
                Reset
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                Farconic App
            </Button>
        ]
    :   [
            <Button action="post" target="/">
                Reset
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                Farconic App
            </Button>
        ]
})