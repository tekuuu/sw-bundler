import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'


import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/src/types/config'

const privateKey = process.env.BUNDLER_PRIVATE_KEY
const networkUrl = process.env.NETWORK_URL

function getNetwork (url: string): NetworkUserConfig {
  // Only use NETWORK_URL from .env
  if (networkUrl && networkUrl.trim() !== '') {
    url = networkUrl.trim()
  }
  return {
    url,
    accounts: privateKey ? [privateKey] : undefined
  }
}

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5'
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545/',
      saveDeployments: false
    },
    sepolia: getNetwork('sepolia')
  },
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true }
    }
  }
}

export default config
