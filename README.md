# PO Service - Purchase Order Management System

A robust TypeScript service for managing Purchase Orders using Supabase backend.

## Features

- **Automatic Entity Creation**: Automatically creates vendors, platforms, SKUs if they don't exist
- **Batch Processing**: Process multiple PO items in a single request
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Data Validation**: Validates input data and relationships
- **RESTful API**: Full REST API for managing purchase orders

## Database Schema

The service works with the following tables:
- `vendor_group` - Vendor grouping
- `platform` - Sales platforms
- `vendors` - Vendor information
- `landing_rate` - Product/SKU master data
- `purchase_orders` - Purchase order headers
- `order_item` - Purchase order line items

## API Endpoints

### Process PO Data
```http
POST /process-po
Content-Type: application/json

{
  "name": [
    {
      "PONumber": "CPCTN26-PO-2213002",
      "SKUId": "146265",
      "ProductName": "BH-Wow! Corn & Cheese Momos 10 Pcs, 24 gm/pc",
      "OrderedQty": 210,
      "City": "Chennai",
      "VendorName": "ARC FOODS AND BEVERAGES",
      "POCreatedDate": "2025-09-25"
    }
  ]
}
```

### Get PO by Number
```http
GET /po/{poNumber}
```

### Get All POs (with optional filters)
```http
GET /pos?city=Chennai&status=Pending&fromDate=2025-01-01&toDate=2025-12-31
```

### Update PO Status
```http
PATCH /po/{poNumber}/status
Content-Type: application/json

{
  "status": "Processing"
}
```

### Update Received Quantity
```http
PATCH /po/{poNumber}/item/{skuId}/received
Content-Type: application/json

{
  "receivedQty": 200
}
```

### Health Check
```http
GET /health
```

## Installation and Setup

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To test:

```bash
bun run test-po.ts
```

## Service Features

### Auto-Creation Logic

1. **Platform**: Creates "Default Platform" if not specified
2. **Vendor**: Creates vendor if doesn't exist with the given name
3. **Landing Rate**: Creates SKU entry if doesn't exist
4. **Purchase Order**: Creates PO if doesn't exist
5. **Order Items**: Creates or updates order items

### Error Handling

- Each operation is wrapped in try-catch blocks
- Detailed error messages for debugging
- Graceful handling of missing data
- Partial success reporting (some POs succeed, others fail)

### Data Validation

- Required field validation
- Foreign key relationship validation
- Data type validation
- Business logic validation

## Usage Examples

### Using HTTP Requests

Use the `req.http` file with REST Client extension in VS Code or similar tools.

## Service Architecture

### PoService Class

The main service class provides:

- `processPOData(input)` - Main entry point for processing PO data
- `ensurePlatform(name)` - Ensures platform exists
- `ensureVendor(vendorData)` - Ensures vendor exists
- `ensureLandingRate(landingRateData)` - Ensures SKU exists
- `ensurePurchaseOrder(poData)` - Ensures PO exists
- `ensureOrderItem(orderItemData)` - Ensures order item exists
- `getPurchaseOrderByNumber(poNumber)` - Fetches complete PO data
- `getAllPurchaseOrders(filters)` - Fetches all POs with filters
- `updatePurchaseOrderStatus(poNumber, status)` - Updates PO status
- `updateReceivedQuantity(poNumber, skuId, receivedQty)` - Updates received quantities

### Data Flow

1. Input validation
2. Group items by PO Number
3. For each PO:
   - Ensure platform exists
   - Ensure vendor exists
   - Ensure all SKUs exist in landing_rate
   - Create/update purchase order
   - Create/update order items
4. Return comprehensive result

## Configuration

### Supabase Connection

Update the Supabase credentials in `PoService.ts`:

```typescript
this.supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);
```

### Default Values

- Default platform: "Default Platform"
- Default PO status: "Pending"
- Default received quantity: 0
- Default MRP/billing values: 0 (should be updated based on business logic)

## Error Scenarios Handled

1. **Missing Vendors**: Automatically creates new vendors
2. **Missing SKUs**: Automatically creates landing rate entries
3. **Duplicate POs**: Updates existing POs instead of creating duplicates
4. **Invalid Data**: Returns detailed error messages
5. **Database Errors**: Wraps and reports Supabase errors
6. **Partial Failures**: Reports which POs succeeded and which failed

This project was created using `bun init` in bun v1.1.42. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
