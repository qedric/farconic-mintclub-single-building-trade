import { ImageResponse } from "@vercel/og"
import { createImagesWorker } from "frames.js/middleware/images-worker/next"
import * as fs from "node:fs/promises"
import * as path from "node:path"

export const runtime = "nodejs"

const imagesRoute = createImagesWorker()

export const GET = imagesRoute(async (jsx) => {

  const quicksandBoldFont = fs.readFile(
    path.join(path.resolve(process.cwd(), "public"), "Quicksand-Bold.ttf")
  )

  const quicksandBoldData = await quicksandBoldFont

  return new ImageResponse(<Scaffold>{jsx}</Scaffold>, {
    width: 1200,
    height: 1200,
    fonts: [
      {
        name: "QuicksandBold",
        data: quicksandBoldData,
        weight: 700,
      }
    ],
  })
})

function Scaffold({ children }: { children: React.ReactNode }) {
  return (
    <div tw="flex relative w-full h-screen overflow-hidden">
      {children}
    </div>
  )
}