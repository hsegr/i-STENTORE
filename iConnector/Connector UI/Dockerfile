FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=@dataspace-connector/client-web --prod /prod/client-web
RUN pnpm deploy --filter=@dataspace-connector/api-server --prod /prod/api-server

FROM nginx:1.29.6-alpine3.23 AS client-web
COPY apps/client-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /prod/client-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM base AS api-server
COPY --from=build /prod/api-server /prod/api-server
WORKDIR /prod/api-server
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.mjs"]
