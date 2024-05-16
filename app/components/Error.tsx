export const ErrorFrame = ( message:string ) => {
    return (
        <div tw="flex p-5 items-center justify-center">
            <p>{ message }</p>
        </div>
    )
}