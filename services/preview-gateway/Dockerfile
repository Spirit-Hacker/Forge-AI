FROM node:22-bookworm

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY services ./services

RUN npm ci

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace=@forge/preview-gateway"]
