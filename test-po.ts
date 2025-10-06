import PoService, { type POInput } from "./service/PoService.js";

// Test data based on your example with platform
const testData = {
  data: {
    name: [
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "146265",
        ProductName: "BH-Wow! Corn & Cheese Momos 10 Pcs, 24 gm/pc",
        OrderedQty: 210,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "151381",
        ProductName: "BH-Wow! Momo Chatpata Paneer Momos, 250 gm",
        OrderedQty: 40,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "151383",
        ProductName: "BH-Wow! Momo Peri Peri Momos - Buy 1 Get 1 Free, 500 gm",
        OrderedQty: 160,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "142561",
        ProductName: "BH-Wow! Momo Veg Darjeeling Momos (Frozen), 1 Pack (10 Pieces)",
        OrderedQty: 210,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "142546",
        ProductName: "BH-Wow! Momo Chicken Darjeeling Momos (Frozen), 1 Pack (10 Pieces)",
        OrderedQty: 240,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "151382",
        ProductName: "BH-Wow! Momo Masala Chicken Momos - Buy 1 Get 1 Free (Packet), 500 gm",
        OrderedQty: 60,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      },
      {
        PONumber: "CPCTN26-PO-2213002",
        SKUId: "142498",
        ProductName: "BH-Wow! Momo Veg Darjeeling Momos (Frozen), 1 Pack (20 Pieces)",
        OrderedQty: 60,
        City: "Chennai",
        VendorName: "ARC FOODS AND BEVERAGES",
        POCreatedDate: "2025-09-25",
      }
    ]
  },
  platform: "Blinkit"
};

async function testPoService() {
  console.log("🚀 Testing PO Service...");
  
  const poService = new PoService();
  
  try {
    // Test processing PO data
    console.log("\n📝 Processing PO data...");
    const result = await poService.processPOData(testData.data as unknown as POInput, testData.platform as string);
    
    console.log("✅ Result:", JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("\n🔍 Fetching processed PO...");
      const fetchedPO = await poService.getPurchaseOrderByNumber("CPCTN26-PO-2213002");
      console.log("📄 Fetched PO:", JSON.stringify(fetchedPO, null, 2));
      
      console.log("\n📊 Getting all POs...");
      const allPOs = await poService.getAllPurchaseOrders({ city: "Chennai" });
      console.log(`📋 Found ${allPOs.length} POs for Chennai`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
testPoService();