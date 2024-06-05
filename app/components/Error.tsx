/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { FramesHandlerFunctionReturnType } from "frames.js/types"

export const ErrorFrame = async (message: string, post_button_label:string | null=null, post_button_query: string | null=null, suggestion: string | undefined=undefined):Promise<FramesHandlerFunctionReturnType<any>> =>({
    image: (
        <div tw="flex w-full h-full justify-center items-center" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
            <div tw="flex flex-col absolute px-20 justify-center items-center">
                <h1 tw="text-[50px]">Error:</h1>
                <h1 tw="text-[50px] mb-5 leading-6">{ message }</h1>
                { suggestion && <p tw="text-[30px] leading-6">{ suggestion }</p>}                          
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