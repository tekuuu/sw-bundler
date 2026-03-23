FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY . .

# Build bundler.js using the repository's established pipeline.
# Clone required submodules explicitly because Docker build context does not include git metadata.
RUN rm -rf submodules/account-abstraction submodules/rip7560 \
	&& git clone --depth 1 --branch develop https://github.com/eth-infinitism/account-abstraction.git submodules/account-abstraction \
	&& git clone --depth 1 https://github.com/eth-infinitism/rip7560_contracts.git submodules/rip7560

RUN yarn install --frozen-lockfile
RUN cd submodules/account-abstraction && yarn && yarn --cwd contracts prepack
RUN yarn lerna-clear
RUN yarn hardhat-compile
RUN yarn --cwd packages/utils tsc
RUN yarn --cwd packages/sdk tsc
RUN yarn --cwd packages/validation-manager tsc

WORKDIR /app/packages/bundler
EXPOSE 3000

CMD ["yarn", "bundler", "--config", "./localconfig/bundler.sepolia.config.json"]
