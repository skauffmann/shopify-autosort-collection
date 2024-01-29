# Shopify AutoSort Collection

## Description

`shopify-autosort-collection` is a script that automatically reorders products in a Shopify collection, moving out-of-stock items to the end. This ensures that available products are highlighted.

## Features

- **Automated Sorting**: Out-of-stock products are moved to the end of the collection.
- **Manual Sort Check**: Verifies that the collection's sort order is 'MANUAL'.
- **Configuration Options**: Set up via the `.dotenv` file or environment variables.

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

    Ensure these permissions for the Shopify API key: `read_products`, `write_products`, `read_inventory`


## Usage

Start the script with:

```bash
npm start
```
