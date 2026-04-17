import ow from 'ow'
import fs from 'fs'

import { BundlerConfig, bundlerConfigDefault, BundlerConfigShape } from './BundlerConfig'
import { Wallet, Signer } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import dotenv from 'dotenv'
dotenv.config()

function getCommandLineParams (programOpts: any): Partial<BundlerConfig> {
  const params: any = {}
  for (const bundlerConfigShapeKey in BundlerConfigShape) {
    const optionValue = programOpts[bundlerConfigShapeKey]
    if (optionValue != null) {
      params[bundlerConfigShapeKey] = optionValue
    }
  }
  return params as BundlerConfig
}

function mergeConfigs (...sources: Array<Partial<BundlerConfig>>): BundlerConfig {
  const mergedConfig = Object.assign({}, ...sources)
  ow(mergedConfig, ow.object.exactShape(BundlerConfigShape))
  return mergedConfig
}

export function getNetworkProvider (url: string): JsonRpcProvider {
  // Only use NETWORK_URL from .env
  const envNetworkUrl = process.env.NETWORK_URL
  if (envNetworkUrl && envNetworkUrl.trim() !== '') {
    url = envNetworkUrl.trim()
  }
  // Avoid leaking API keys in logs (e.g. Infura project IDs embedded in the URL path).
  const redactedUrl = url
    .replace(/(infura\.io\/v3\/)[^/?#]+/i, '$1***')
    .replace(/(alchemy\.com\/v2\/)[^/?#]+/i, '$1***')
  console.log('url=', redactedUrl)
  return new JsonRpcProvider(url)
}

export async function resolveConfiguration (programOpts: any): Promise<{ config: BundlerConfig, provider: JsonRpcProvider, wallet: Signer }> {
  const commandLineParams = getCommandLineParams(programOpts)
  let fileConfig: Partial<BundlerConfig> = {}
  const configFileName = programOpts.config
  if (fs.existsSync(configFileName)) {
    fileConfig = JSON.parse(fs.readFileSync(configFileName, 'ascii'))
  }
  const config = mergeConfigs(bundlerConfigDefault, fileConfig, commandLineParams)
  console.log('Merged configuration:', JSON.stringify(config))

  if (config.network === 'hardhat') {
    // eslint-disable-next-line
    const provider: JsonRpcProvider = require('hardhat').ethers.provider
    return { config, provider, wallet: provider.getSigner() }
  }

  const provider = getNetworkProvider(config.network)
  const privateKey = process.env.BUNDLER_PRIVATE_KEY
  if (!privateKey || privateKey.trim() === '') {
    throw new Error('BUNDLER_PRIVATE_KEY must be set in .env file or environment for the bundler to operate.')
  }
  let wallet: Wallet
  try {
    wallet = new Wallet(privateKey.trim(), provider)
  } catch (e: any) {
    throw new Error(`Unable to load wallet from BUNDLER_PRIVATE_KEY: ${e.message as string}`)
  }
  return { config, provider, wallet }
}
