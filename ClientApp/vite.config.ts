import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ command }) =>
{
    const isDev = command === 'serve';

    return {
        plugins: [react()],
        root: path.resolve(__dirname),
        base: isDev ? '/' : './',      // important: dev uses absolute /, production uses relative
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: 'https://localhost:5001', // update if your dotnet runs at another url
                    changeOrigin: true,
                    secure: false
                }
            }
        },
        build: {
            outDir: path.resolve(__dirname, '../wwwroot'),
            emptyOutDir: true,
            sourcemap: false
        },
        resolve: {
            alias: { '@': path.resolve(__dirname, 'src') }
        }
    };
});
