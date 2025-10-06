
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for our data structures
interface POItem {
  PONumber: string;
  SKUId: string;
  ProductName: string;
  OrderedQty: number;
  City: string;
  VendorName: string;
  POCreatedDate: string;
}

interface POInput {
  data: POItem[];
}

interface Vendor {
  id?: number;
  name: string;
  city?: string;
  contact_info?: string;
  group_id?: number;
  platform_id?: number;
}

interface Platform {
  id?: number;
  name: string;
  description?: string;
}

interface LandingRate {
  id?: number;
  platform_id: number;
  sku_id: string;
  product_name: string;
  mrp: number;
  billing_value_per_qty: number;
  cases?: number;
  effective_date?: string;
}

interface PurchaseOrder {
  id?: number;
  po_number: string;
  vendor_id: number;
  platform_id: number;
  city: string;
  po_created_date: string;
  status?: string;
}

interface OrderItem {
  id?: number;
  po_id: number;
  sku_id: string;
  ordered_quantity: number;
  received_quantity?: number;
}

class PoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      "https://ydtfzuminlakhxtveynd.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdGZ6dW1pbmxha2h4dHZleW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgwNjYwOSwiZXhwIjoyMDc0MzgyNjA5fQ.5fmvx1U_F3gaGJO68THhShRPQH9peMOB2ipjRdFQ6oc"
    );
  }

  /**
   * Main function to process PO data
   */
  async processPOData(input: POInput, platformName?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    errors?: string[];
  }> {
    try {
      const errors: string[] = [];
      const processedPOs: any[] = [];

      // Group items by PO Number
      const poGroups = this.groupByPONumber(input.data);

      for (const [poNumber, items] of Object.entries(poGroups)) {
        try {
          const result = await this.processSinglePO(poNumber, items, platformName);
          processedPOs.push(result);
        } catch (error) {
          errors.push(`Error processing PO ${poNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 ? 'All POs processed successfully' : 'Some POs had errors',
        data: processedPOs,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process PO data',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Group items by PO Number
   */
  private groupByPONumber(items: POItem[]): Record<string, POItem[]> {
    if (!items || !Array.isArray(items)) {
      throw new Error(`Invalid items array: ${JSON.stringify(items)}`);
    }
    
    return items.reduce((groups, item) => {
      if (!groups[item.PONumber]) {
        groups[item.PONumber] = [];
      }
      groups[item.PONumber].push(item);
      return groups;
    }, {} as Record<string, POItem[]>);
  }

  /**
   * Process a single PO and its items
   */
  private async processSinglePO(poNumber: string, items: POItem[], platformName?: string): Promise<any> {
    // Get the first item to extract common PO data
    const firstItem = items[0];
    
    // 1. Ensure platform exists (use provided platform or default to 'Default Platform')
    const platform = await this.ensurePlatform(platformName || 'Default Platform');
    
    // 2. Ensure vendor exists
    const vendor = await this.ensureVendor({
      name: firstItem.VendorName,
      city: firstItem.City,
      platform_id: platform.id
    });

    // 3. Ensure all SKUs exist in landing_rate
    for (const item of items) {
      await this.ensureLandingRate({
        platform_id: platform.id!,
        sku_id: item.SKUId,
        product_name: item.ProductName,
        mrp: 0, // Default values - you may want to provide these
        billing_value_per_qty: 0,
        effective_date: new Date().toISOString().split('T')[0]
      });
    }

    // 4. Create or update purchase order
    const purchaseOrder = await this.ensurePurchaseOrder({
      po_number: poNumber,
      vendor_id: vendor.id!,
      platform_id: platform.id!,
      city: firstItem.City,
      po_created_date: firstItem.POCreatedDate,
      status: 'Pending'
    });

    // 5. Create or update order items
    const orderItems = [];
    for (const item of items) {
      const orderItem = await this.ensureOrderItem({
        po_id: purchaseOrder.id!,
        sku_id: item.SKUId,
        ordered_quantity: item.OrderedQty
      });
      orderItems.push(orderItem);
    }

    return {
      poNumber,
      platform,
      vendor,
      purchaseOrder,
      orderItems
    };
  }

  /**
   * Ensure platform exists, create if not
   */
  async ensurePlatform(name: string, description?: string): Promise<Platform> {
    try {
      // Check if platform exists
      const { data: existing, error: selectError } = await this.supabase
        .from('platform')
        .select('*')
        .eq('name', name)
        .single();

      if (existing && !selectError) {
        return existing;
      }

      // Create new platform
      const { data: newPlatform, error: insertError } = await this.supabase
        .from('platform')
        .insert({
          name,
          description: description || `Platform for ${name}`
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create platform: ${insertError.message}`);
      }

      return newPlatform;
    } catch (error) {
      throw new Error(`Platform operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure vendor exists, create if not
   */
  async ensureVendor(vendorData: Omit<Vendor, 'id'>): Promise<Vendor> {
    try {
      // Check if vendor exists
      const { data: existing, error: selectError } = await this.supabase
        .from('vendors')
        .select('*')
        .eq('name', vendorData.name)
        .maybeSingle();

      if (existing && !selectError) {
        return existing;
      }

      // Create new vendor
      const { data: newVendor, error: insertError } = await this.supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create vendor: ${insertError.message}`);
      }

      return newVendor;
    } catch (error) {
      throw new Error(`Vendor operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure landing rate (SKU) exists, create if not
   */
  async ensureLandingRate(landingRateData: Omit<LandingRate, 'id'>): Promise<LandingRate> {
    try {
      // Check if SKU exists
      const { data: existing, error: selectError } = await this.supabase
        .from('landing_rate')
        .select('*')
        .eq('sku_id', landingRateData.sku_id)
        .maybeSingle();

      if (existing && !selectError) {
        return existing;
      }

      // Create new landing rate entry
      const { data: newLandingRate, error: insertError } = await this.supabase
        .from('landing_rate')
        .insert(landingRateData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create landing rate: ${insertError.message}`);
      }

      return newLandingRate;
    } catch (error) {
      throw new Error(`Landing rate operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure purchase order exists, create if not
   */
  async ensurePurchaseOrder(poData: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    try {
      // Check if PO exists
      const { data: existing, error: selectError } = await this.supabase
        .from('purchase_orders')
        .select('*')
        .eq('po_number', poData.po_number)
        .maybeSingle();

      if (existing && !selectError) {
        return existing;
      }

      // Create new purchase order
      const { data: newPO, error: insertError } = await this.supabase
        .from('purchase_orders')
        .insert(poData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create purchase order: ${insertError.message}`);
      }

      return newPO;
    } catch (error) {
      throw new Error(`Purchase order operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure order item exists, create or update if not
   */
  async ensureOrderItem(orderItemData: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    try {
      // Check if order item exists
      const { data: existing, error: selectError } = await this.supabase
        .from('order_item')
        .select('*')
        .eq('po_id', orderItemData.po_id)
        .eq('sku_id', orderItemData.sku_id)
        .maybeSingle();

      if (existing && !selectError) {
        // Update existing order item
        const { data: updated, error: updateError } = await this.supabase
          .from('order_item')
          .update({
            ordered_quantity: orderItemData.ordered_quantity,
            received_quantity: orderItemData.received_quantity || 0
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update order item: ${updateError.message}`);
        }

        return updated;
      }

      // Create new order item
      const { data: newOrderItem, error: insertError } = await this.supabase
        .from('order_item')
        .insert({
          ...orderItemData,
          received_quantity: orderItemData.received_quantity || 0
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create order item: ${insertError.message}`);
      }

      return newOrderItem;
    } catch (error) {
      throw new Error(`Order item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchase order by PO number with all related data
   */
  async getPurchaseOrderByNumber(poNumber: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors(*),
          platform(*),
          order_item(*, landing_rate(*))
        `)
        .eq('po_number', poNumber)
        .single();

      if (error) {
        throw new Error(`Failed to fetch purchase order: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Get purchase order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all purchase orders with optional filters
   */
  async getAllPurchaseOrders(filters?: {
    vendorName?: string;
    city?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<any[]> {
    try {
      let query = this.supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors(*),
          platform(*),
          order_item(*, landing_rate(*))
        `);

      if (filters) {
        if (filters.city) {
          query = query.eq('city', filters.city);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.fromDate) {
          query = query.gte('po_created_date', filters.fromDate);
        }
        if (filters.toDate) {
          query = query.lte('po_created_date', filters.toDate);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch purchase orders: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Get all purchase orders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update purchase order status
   */
  async updatePurchaseOrderStatus(poNumber: string, status: string): Promise<PurchaseOrder> {
    try {
      const { data, error } = await this.supabase
        .from('purchase_orders')
        .update({ status })
        .eq('po_number', poNumber)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update purchase order status: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Update purchase order status failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update received quantity for order items
   */
  async updateReceivedQuantity(poNumber: string, skuId: string, receivedQty: number): Promise<OrderItem> {
    try {
      // First get the PO ID
      const { data: po, error: poError } = await this.supabase
        .from('purchase_orders')
        .select('id')
        .eq('po_number', poNumber)
        .single();

      if (poError) {
        throw new Error(`Purchase order not found: ${poError.message}`);
      }

      // Update the order item
      const { data, error } = await this.supabase
        .from('order_item')
        .update({ received_quantity: receivedQty })
        .eq('po_id', po.id)
        .eq('sku_id', skuId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update received quantity: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Update received quantity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default PoService;
export type { POInput, POItem, Vendor, Platform, LandingRate, PurchaseOrder, OrderItem };
