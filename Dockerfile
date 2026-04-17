FROM node:18-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY . .

# Build bundler.js using the repository's established pipeline.
# Clone required submodules explicitly because Docker build context does not include git metadata.
# Keep refs pinned for reproducible builds (override with --build-arg when needed).
ARG ACCOUNT_ABSTRACTION_REF=abff2aca61a8f0934e533d0d352978055fddbd96
ARG RIP7560_REF=5903e3850d775f2eda30b8fcccb630b1253df0a5
RUN rm -rf submodules/account-abstraction submodules/rip7560 \
	&& git clone https://github.com/eth-infinitism/account-abstraction.git submodules/account-abstraction \
	&& git -C submodules/account-abstraction checkout "$ACCOUNT_ABSTRACTION_REF" \
	&& git clone https://github.com/eth-infinitism/rip7560_contracts.git submodules/rip7560 \
	&& git -C submodules/rip7560 checkout "$RIP7560_REF"

RUN yarn install --frozen-lockfile
RUN yarn lerna-clear
RUN yarn hardhat-compile
RUN yarn --cwd packages/utils tsc
RUN yarn --cwd packages/sdk tsc
RUN yarn --cwd packages/validation-manager tsc

WORKDIR /app/packages/bundler
EXPOSE 3000

CMD ["yarn", "bundler", "--config", "./localconfig/bundler.sepolia.config.json"]
