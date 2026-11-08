# Simvito eSIM MCP server

Let an AI assistant find, compare and buy travel eSIM data plans for you.

Tell the assistant where you're going and for how long. It compares [Simvito](https://simvito.com/) plans by price, data and validity, shows which local networks each plan uses (4G/5G) and what happens when the data runs out, and gives you a link to pay on simvito.com. Searching is free and needs no account.

This is a hosted (remote) MCP server: connect to the URL below and there is nothing to install. For clients that only run local servers, this repository also has a small open-source stdio proxy (`index.js`, published on npm as `simvito-mcp`) that forwards every MCP message to the hosted server.

## Connect

Endpoint (Streamable HTTP, no API key):

```
https://mcp.simvito.com/mcp?src=github
```

**Claude**: add Simvito eSIM from the connectors directory, or add a custom connector with the URL above.

**Claude Code**

```bash
claude mcp add --transport http simvito "https://mcp.simvito.com/mcp?src=github"
```

**Cursor, VS Code, Windsurf and other clients**

```json
{
  "mcpServers": {
    "simvito": {
      "type": "http",
      "url": "https://mcp.simvito.com/mcp?src=github"
    }
  }
}
```

**Local (stdio) clients**: run the npm package, which forwards to the hosted server.

```json
{
  "mcpServers": {
    "simvito": {
      "command": "npx",
      "args": ["-y", "simvito-mcp"]
    }
  }
}
```

Or with Docker: `docker build -t simvito-mcp . && docker run -i --rm simvito-mcp`.

The proxy needs Node.js 18 or later and no API key. Account tools (`start_checkout`, `get_order_status`, `list_my_esims`) need the account connected, which works when your client connects to the hosted URL directly.

Connecting a Simvito account (OAuth) is optional. It adds checkout inside the chat, order status and your list of eSIMs.

## Tools

| Tool | What it does |
| --- | --- |
| `find_destination` | Find a country, region (Europe, Asia...) or multi-country plan by name in any language, ISO code or misspelling. Cities and islands such as Tokyo or Bali work too. |
| `search_plans` | Up to 5 plans for one destination and trip length, with price in your currency, data, validity, local operators with 4G/5G and what happens when the data runs out. |
| `compare_networks` | Every local operator at a destination side by side, e.g. "which eSIM has 5G in Tokyo". |
| `plan_trip` | For a trip through several countries, compares one regional plan against a separate plan per country. |
| `check_device` | Does this phone support eSIM? iPhone, Google Pixel and Samsung Galaxy, including models bought in mainland China, Hong Kong or Macao. |
| `get_checkout_options` | Languages, currencies and payment methods at checkout for a country or currency. |
| `get_buy_link` | A simvito.com checkout link for the plan you pick. |
| `start_checkout` | Account connected: places the order and returns payment links (cards, Apple Pay, Google Pay, local wallets, and PayPal where available). |
| `get_order_status` | Account connected: whether the payment arrived and the eSIM is ready, with a link to install it. |
| `list_my_esims` | Account connected: your eSIMs with status, data left and expiry, and a link to install or add data. |

All tools are read-only except `start_checkout`. Nothing is charged inside the assistant: you always pay on simvito.com.

## Prompts

Ready-made requests you can pick in clients that show MCP prompts:

| Prompt | Arguments |
| --- | --- |
| `trip_esim` | `destination`, `days`, optional `usage` |
| `best_network` | `destination` |
| `multi_country_trip` | `itinerary` |
| `check_phone` | `phone`, optional `bought_in` |

## Resources

- `simvito://guide`: how to search, compare and buy with these tools.
- `simvito://checkout-basics`: checkout languages and currencies, refund and terms links.

## Example prompts

- "I'm going to Japan for 7 days. Which eSIM should I get?"
- "Which eSIMs in Tokyo have 5G?"
- "Japan 7 days, then Korea 5 days. One plan or two?"
- "Does my iPhone 13 bought in Hong Kong support eSIM?"

## About Simvito

Simvito sells prepaid travel eSIMs. Checkout is in 20 languages and 25 currencies. An eSIM that was never installed can be refunded within 30 days of purchase.

- Website: https://simvito.com/
- Using Simvito in AI assistants: https://simvito.com/ai/
- Refunds: https://simvito.com/refund/
- Official MCP Registry: `com.simvito/esim`

## Files

- `index.js`, `package.json`, `Dockerfile`: the stdio proxy. `npm test` (`test.mjs`) starts it and checks the hosted server answers.
- `server.json`: the entry in the [official MCP Registry](https://registry.modelcontextprotocol.io/).
- `lhm.plugin.json`: the [LobeHub](https://lobehub.com/mcp) marketplace listing.
