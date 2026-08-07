FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG OJJEOM_PUBLIC_ORIGIN=https://macmini.tailbba978.ts.net:10000/ojjeom
ARG CHAENGI_RELEASE_COMMIT
ENV VITE_APP_ENV=real
ENV OJJEOM_PUBLIC_ORIGIN=${OJJEOM_PUBLIC_ORIGIN}

RUN npm run build:real \
  && node --experimental-strip-types ops/web/writeReleaseContract.ts /app/dist/__release "${CHAENGI_RELEASE_COMMIT}"

FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0

ARG CHAENGI_RELEASE_COMMIT
LABEL org.opencontainers.image.title="Ipfit production web" \
      org.opencontainers.image.revision="${CHAENGI_RELEASE_COMMIT}" \
      io.chaengi.release.commit="${CHAENGI_RELEASE_COMMIT}"

COPY ops/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/ojjeom

EXPOSE 15174
