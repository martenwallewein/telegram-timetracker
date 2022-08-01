FROM node as builder
WORKDIR /root/
COPY ["package.json", "package-lock.json", "./"]
RUN ["npm", "install"]
COPY [".", "."]
RUN ["npm", "run", "build"]

FROM node:alpine
WORKDIR /root/
COPY --from=0 /root/ ./
ENTRYPOINT ["node", "/root/build/main/index.js"]