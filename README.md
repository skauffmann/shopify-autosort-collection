# Shopify AutoSort Collection

## Description

`shopify-autosort-collection` is a script that automatically reorders products in a Shopify collection, moving out-of-stock items to the end. This ensures that available products are highlighted.

## Features

- **Automated Sorting**: Out-of-stock products are moved to the end of the collection.
- **Manual Sort Check**: Verifies that the collection's sort order is 'MANUAL'.
- **Configuration Options**: Set up via the `.dotenv` file, environment variables, or a configuration file.

## How it Works

- Fetches collections, focusing on those with products.

- For each collection with a 'MANUAL' sort order:
  - Identifies the first in-stock product.
  - Moves out-of-stock products appearing before this product to the end of the collection.

## Installation

1. Clone the repo:

    ```bash
      git clone git@github.com:skauffmann/shopify-autosort-collection.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Configuration:

    Export the following environment variables:

    - `SHOPIFY_SHOP_NAME`: Your Shopify shop URL (e.g., xxx.myshopify.com).
    - `SHOPIFY_ACCESS_TOKEN`: Your Shopify access token (e.g., shppa_xxxx).
    - `SHOPIFY_LOCATION_ID`: Optional. If not set, the default location is used.
    - Alternatively, you can pass a configuration file path when starting the script.

    Ensure these permissions for the Shopify API key: `read_products`, `write_products`, `read_inventory`


## Usage

Start the script with:

```bash
npm start
# yarn start
```

## Adanced configuration

For advanced configuration, you can also pass a configuration file path:

```bash
npm run start ./config.json
```

Example configuration file (config.json):

```json
{
  "collections": {
    "default": {
      "moveUnavailableToEnd": true,
      "sort": "publish_date"
    },
    "produits-populaires": {
      "moveUnavailableToEnd": true,
      "sort": "best_selling"
    },
    "derniers-ajouts": {
      "moveUnavailableToEnd": true,
      "sort": false
    },
    "livres-et-manga": {
      "moveUnavailableToEnd": true,
      "sort": "publish_date",
      "pinnedProducts": [
        { "position": 1, "handle": "livre-hommage-a-pokemon" },
        { "position": 2, "handle": "bd-pokemon-detective-pikachu" }
      ]
    }
  }
}
```

- `collections.default`: Configures the default behavior.
- `collections.[handler]`: Configures sorting behavior for a specific collection handler.
- `moveUnavailableToEnd` (boolean): Specifies whether out-of-stock items should be moved to the end.
- `sort` (string): Configures the sorting method.
  Possible values:
  - `publish_date`: Sort by publish date (newest first).
  - `best_selling`: Sort by best-selling items first.
  - `stock`: Sort by available stock quantity first.
- `pinnedProducts`: A list of pinned products. The position starts with 1 (and not 0). The product handle is the url fragment of your product.
