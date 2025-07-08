import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
    //       dest: './'
    //     },
    //     {
    //       src: 'node_modules/@ricky0123/vad-web/dist/silero*.onnx',
    //       dest: './'
    //     },
    //     {
    //       src: 'node_modules/onnxruntime-web/dist/*.wasm',
    //       dest: './'
    //     },
    //     {
    //       src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 
    //       dest: './'
    //     }        
    //   ]
    // })
  ],
})
