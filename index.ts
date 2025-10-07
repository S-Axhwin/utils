
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import PoService, { type POInput } from "./service/PoService.js";

const app = new Hono();

// Initialize PO Service
const poService = new PoService();

// Main endpoint to process PO data
app.post("/process-po", async (c) => {
    try {
        console.log("im into json process");
        
        const {pos, platform}: {pos: POInput, platform: string} = await c.req.json();
        console.log("Received PO data", pos, "with platform:", platform);
        
        console.log('Received PO data with platform:', platform);
        console.log(`Processing ${pos.data.length} items across multiple POs...`);
        
        // Process the PO data with platform
        const result = await poService.processPOData(pos, platform);
        
        return c.json({
            success: result.success,
            message: result.message,
            data: result.data,
            errors: result.errors,
            stats: result.stats
        });
    } catch (error) {
        console.error('Error processing PO:', error);
        return c.json({
            success: false,
            message: 'Failed to process PO data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get PO by PO Number
app.get("/po/:poNumber", async (c) => {
    try {
        const poNumber = c.req.param('poNumber');
        const result = await poService.getPurchaseOrderByNumber(poNumber);
        
        return c.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching PO:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch purchase order',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get all POs with optional filters
app.get("/pos", async (c) => {
    try {
        const query = c.req.query();
        const filters = {
            vendorName: query.vendorName,
            city: query.city,
            status: query.status,
            fromDate: query.fromDate,
            toDate: query.toDate
        };
        
        // Remove undefined values
        Object.keys(filters).forEach(key => {
            if (filters[key as keyof typeof filters] === undefined) {
                delete filters[key as keyof typeof filters];
            }
        });
        
        const result = await poService.getAllPurchaseOrders(filters);
        
        return c.json({
            success: true,
            data: result,
            count: result.length
        });
    } catch (error) {
        console.error('Error fetching POs:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch purchase orders',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Update PO status
app.patch("/po/:poNumber/status", async (c) => {
    try {
        const poNumber = c.req.param('poNumber');
        const { status } = await c.req.json();
        
        if (!status) {
            return c.json({
                success: false,
                message: 'Status is required'
            }, 400);
        }
        
        const result = await poService.updatePurchaseOrderStatus(poNumber, status);
        
        return c.json({
            success: true,
            message: 'Purchase order status updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating PO status:', error);
        return c.json({
            success: false,
            message: 'Failed to update purchase order status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Update received quantity
app.patch("/po/:poNumber/item/:skuId/received", async (c) => {
    try {
        const poNumber = c.req.param('poNumber');
        const skuId = c.req.param('skuId');
        const { receivedQty } = await c.req.json();
        
        if (receivedQty === undefined || receivedQty < 0) {
            return c.json({
                success: false,
                message: 'Valid receivedQty is required'
            }, 400);
        }
        
        const result = await poService.updateReceivedQuantity(poNumber, skuId, receivedQty);
        
        return c.json({
            success: true,
            message: 'Received quantity updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating received quantity:', error);
        return c.json({
            success: false,
            message: 'Failed to update received quantity',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Health check endpoint
app.get("/health", async (c) => {
    return c.json({
        success: true,
        message: 'PO Service is running',
        timestamp: new Date().toISOString()
    });
});

// Start the server
const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Starting PO Service on port ${port}...`);

serve({
    fetch: app.fetch,
    port: port
}, (info:any) => {
    console.log(`✅ PO Service is running at http://localhost:${info.port}`);
});

export default app;
