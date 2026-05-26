FROM node:22-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium-browser
WORKDIR /app
RUN npm install -g @marp-team/marp-cli
COPY package.json .
RUN npm install
COPY server.js .
EXPOSE 8080
CMD ["node", "server.js"]
