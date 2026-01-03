import solid from 'solid-start/vite'
// @ts-expect-error no typing
import vercel from 'solid-start-vercel'
import { defineConfig } from 'vite'
import dotenv from 'dotenv'

export default defineConfig(() => {
  dotenv.config()
  return {
    plugins: [solid({ adapter: vercel() })],
  }
})
