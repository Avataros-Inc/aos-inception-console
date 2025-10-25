# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Development

## Updating the Streamer Submodule

The project uses the `inception-stream-component` as a local file dependency from `submodules/streamer/v2`. When you update the streamer submodule, follow these steps to ensure the changes are reflected in the main package:

1. Update the submodule to the desired commit:
   ```bash
   cd submodules/streamer
   git pull origin main  # or checkout a specific commit
   cd ../..
   ```

2. Remove the old package and reinstall:
   ```bash
   rm -rf node_modules/inception-stream-component
   npm install
   ```

3. Stage both the submodule reference and package-lock.json:
   ```bash
   git add submodules/streamer package-lock.json
   ```

This ensures that both the submodule pointer and npm dependencies are updated together.


# Build

docker build -t git.avataros.xyz/avataros/avatarpipelineinterface:console-latest .
docker run -p 6666:80 git.avataros.xyz/avataros/avatarpipelineinterface:console-latest


docker build -t git.avataros.xyz/avataros/avatarpipelineinterface:console-latest . && \
docker push git.avataros.xyz/avataros/avatarpipelineinterface:console-latest