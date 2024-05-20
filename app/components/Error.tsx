/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { FramesHandlerFunctionReturnType } from "frames.js/types"

export const ErrorFrame = async (message: string, post_button_label:string | null=null, post_button_query: string | null=null):Promise<FramesHandlerFunctionReturnType<any>> =>({
    image:  (
        <div tw="px-5 mx-auto flex flex-col items-center justify-center">
            <p tw="text-center">{ message }</p>
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