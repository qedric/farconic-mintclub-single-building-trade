import { createFrames } from "frames.js/next"
import { imagesWorkerMiddleware } from "frames.js/middleware/images-worker"

export const frames = createFrames({
  basePath: "/frames",
  middleware: [
    imagesWorkerMiddleware({
      imagesRoute: "/images"
    }),
  ],
})