"""Generate a pinned network catalog from saved official CCIP Directory HTML.

Usage: python3 scripts/import-directory.py /path/usdc-test.html /path/usdc-main.html /path/gho-main.html
Fetch/review the official pages before running; this never deploys or sends transactions.
"""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path


def decode(value):
    if isinstance(value, list) and value and isinstance(value[0], int):
        if len(value) < 2:
            return None
        return [decode(item) for item in value[1]] if value[0] == 1 else decode(value[1])
    if isinstance(value, dict):
        return {key: decode(item) for key, item in value.items()}
    return value


class Directory(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.chains = {}
        self.networks = {}
        self.lanes = {}
        self.feed(Path(path).read_text())
        if not self.chains or not self.networks:
            raise ValueError("Directory format changed: refusing to generate empty config")

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag != "astro-island" or "props" not in attrs:
            return
        props = decode(json.loads(attrs["props"]))
        if "chains" in props:
            self.chains = {chain["key"]: chain for chain in props["chains"]}
        if "networks" in props:
            self.networks = {network["key"]: network for network in props["networks"]}
            self.lanes = props["lanes"]


# EIP-155 IDs are separate from CCIP uint64 selectors. Never convert selectors to JS numbers.
MAINNET = {
    "mainnet": 1,
    "ethereum-mainnet-arbitrum-1": 42161,
    "ethereum-mainnet-base-1": 8453,
    "ethereum-mainnet-optimism-1": 10,
    "matic-mainnet": 137,
    "avalanche-mainnet": 43114,
    "bsc-mainnet": 56,
    "xdai-mainnet": 100,
    "ethereum-mainnet-scroll-1": 534352,
    "ethereum-mainnet-linea-1": 59144,
    "ethereum-mainnet-mantle-1": 5000,
    "ethereum-mainnet-andromeda-1": 1088,
        "monad-mainnet": 143,
        "plasma-mainnet": 9745,
        "ethereum-mainnet-xlayer-1": 196,
    "ethereum-mainnet-unichain-1": 130,
    "ethereum-mainnet-ink-1": 57073,
    "hyperliquid-mainnet": 999,
}
TESTNET = {"ethereum-testnet-sepolia-base-1": 84532, "ethereum-testnet-sepolia-arbitrum-1": 421614}


def build(environment, chain_ids, hub, directories):
    chains = directories[0].chains
    result = []
    for key, chain_id in chain_ids.items():
        if key not in chains:
            continue
        chain = chains[key]
        tokens = []
        for symbol, directory in zip(["USDC", "GHO"], directories):
            network = directory.networks.get(key)
            hub_token = directory.networks.get(hub)
            if not network or not hub_token:
                continue
            route = key != hub and hub in directory.lanes.get(key, {})
            tokens.append({
                "symbol": symbol, "address": network["tokenAddress"],
                "decimals": network["tokenDecimals"], "hubToken": hub_token["tokenAddress"],
                "routeToHub": route,
            })
        if not tokens:
            continue
        result.append({
            "key": key, "name": chain["name"], "environment": environment,
            "chainId": chain_id, "chainSelector": chain["chainSelector"],
            "router": chain["router"]["address"],
            "nativeSymbol": chain["nativeToken"]["symbol"],
            "explorer": chain["explorer"]["baseUrl"], "tokens": tokens,
            "directory": f"https://docs.chain.link/ccip/directory/{environment}/chain/{key}",
        })
    return result


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    test, usdc, gho = [Directory(path) for path in sys.argv[1:]]
    networks = build("testnet", TESTNET, "ethereum-testnet-sepolia-arbitrum-1", [test])
    networks += build("mainnet", MAINNET, "ethereum-mainnet-arbitrum-1", [usdc, gho])
    output = {
        "verifiedAt": "2026-10-06",
        "sources": [f"https://docs.chain.link/ccip/directory/{env}/token/{token}" for env, token in [("testnet", "USDC"), ("mainnet", "USDC"), ("mainnet", "GHO")]],
        "hubs": {"testnet": "ethereum-testnet-sepolia-arbitrum-1", "mainnet": "ethereum-mainnet-arbitrum-1"},
        "networks": networks,
    }
    target = Path(__file__).resolve().parent.parent / "config/networks.json"
    target.write_text(json.dumps(output, indent=2) + "\n")
    for network in networks:
        routes = [token["symbol"] for token in network["tokens"] if token["routeToHub"]]
        print(network["name"], network["chainId"], "routes:", ", ".join(routes) or "hub / no direct token route")
