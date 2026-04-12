FROM node:20-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /src

COPY package.json pnpm-lock.yaml tsconfig.json README.md ./
COPY data ./data
COPY frontend ./frontend
COPY public ./public
COPY scripts ./scripts
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN npm pack --pack-destination /tmp

FROM node:20-bookworm-slim AS runtime

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /workspace

COPY --from=builder /tmp/better-auth-studio-*.tgz /tmp/better-auth-studio.tgz
RUN npm install -g /tmp/better-auth-studio.tgz && rm /tmp/better-auth-studio.tgz

COPY docker/entrypoint.sh /usr/local/bin/better-auth-studio-docker
RUN chmod +x /usr/local/bin/better-auth-studio-docker

EXPOSE 3002

ENTRYPOINT ["better-auth-studio-docker"]
