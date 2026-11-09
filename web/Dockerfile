FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG ORBIT_API_URL=http://orbit-api:3000
ARG NEXT_PUBLIC_DEV_LOGIN=false
ARG NEXT_PUBLIC_ACCESS_LOGIN=false
ENV ORBIT_API_URL=$ORBIT_API_URL NEXT_PUBLIC_DEV_LOGIN=$NEXT_PUBLIC_DEV_LOGIN NEXT_PUBLIC_ACCESS_LOGIN=$NEXT_PUBLIC_ACCESS_LOGIN
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app
ARG ORBIT_BUILD_SHA=dev
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 ORBIT_BUILD_SHA=$ORBIT_BUILD_SHA
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
