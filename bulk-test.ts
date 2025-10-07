import PoService, { type POInput } from "./service/PoService.js";

// Generate large test data for bulk processing
function generateBulkTestData(numPOs: number, itemsPerPO: number): { data: POInput, platform: string } {
  const items = [];
  
  for (let poIndex = 1; poIndex <= numPOs; poIndex++) {
    const poNumber = `BULK-PO-${poIndex.toString().padStart(6, '0')}`;
    
    for (let itemIndex = 1; itemIndex <= itemsPerPO; itemIndex++) {
      items.push({
        PONumber: poNumber,
        SKUId: `SKU-${(poIndex * 1000 + itemIndex).toString().padStart(8, '0')}`,
        ProductName: `Bulk Test Product ${poIndex}-${itemIndex}`,
        OrderedQty: Math.floor(Math.random() * 500) + 50, // Random quantity between 50-550
        City: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad"][poIndex % 7],
        VendorName: `Bulk Vendor ${Math.ceil(poIndex / 5)}`, // Group POs by vendor (5 POs per vendor)
        POCreatedDate: "2025-10-06"
      });
    }
  }
  
  return {
    data: { name: items },
    platform: "Bulk Test Platform"
  };
}

async function testBulkProcessing() {
  console.log("🚀 Starting Bulk PO Processing Test...");
  console.log("=" .repeat(50));
  
  const poService = new PoService();
  
  // Test configurations
  const testConfigs = [
    { pos: 10, itemsPerPO: 5, name: "Small batch" },
    { pos: 25, itemsPerPO: 4, name: "Medium batch" },
    { pos: 50, itemsPerPO: 3, name: "Large batch" },
    // Uncomment for extreme testing:
    // { pos: 100, itemsPerPO: 5, name: "Extra large batch" }
  ];
  
  for (const config of testConfigs) {
    console.log(`\\n📊 Testing ${config.name}: ${config.pos} POs with ${config.itemsPerPO} items each (${config.pos * config.itemsPerPO} total items)`);
    console.log("-".repeat(80));
    
    try {
      // Generate test data
      const testData = generateBulkTestData(config.pos, config.itemsPerPO);
      console.log(`✅ Generated ${testData.data.name.length} test items`);
      
      // Process bulk data
      const startTime = Date.now();
      const result = await poService.processPOData(testData.data, testData.platform);
      const totalTime = Date.now() - startTime;
      
      // Display results
      console.log(`\\n📈 Results for ${config.name}:`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.stats) {
        console.log(`   📊 Statistics:`);
        console.log(`      Total Items: ${result.stats.totalItems}`);
        console.log(`      Total POs: ${result.stats.totalPOs}`);
        console.log(`      Processed POs: ${result.stats.processedPOs}`);
        console.log(`      Failed POs: ${result.stats.failedPOs}`);
        console.log(`      Processing Time: ${result.stats.processingTime}ms`);
        console.log(`      Items/Second: ${Math.round(result.stats.totalItems / (result.stats.processingTime / 1000))}`);
      }
      
      if (result.errors && result.errors.length > 0) {
        console.log(`   ❌ Errors (${result.errors.length}):`);
        result.errors.slice(0, 5).forEach(error => console.log(`      - ${error}`));
        if (result.errors.length > 5) {
          console.log(`      ... and ${result.errors.length - 5} more errors`);
        }
      }
      
      console.log(`\\n⏱️  Total test time: ${totalTime}ms`);
      
    } catch (error) {
      console.error(`❌ Error in ${config.name}:`, error);
    }
    
    // Wait between tests
    console.log("\\n⏳ Waiting 2 seconds before next test...");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\\n🎉 Bulk processing tests completed!");
  console.log("=" .repeat(50));
}

// Additional utility functions for testing
async function testSpecificPORetrieval(poService: PoService) {
  console.log("\\n🔍 Testing PO retrieval...");
  
  try {
    // Test retrieving a specific PO
    const po = await poService.getPurchaseOrderByNumber("BULK-PO-000001");
    console.log(`✅ Successfully retrieved PO with ${po.order_item.length} items`);
    
    // Test getting all POs with filters
    const allPOs = await poService.getAllPurchaseOrders({ 
      city: "Mumbai",
      status: "Pending" 
    });
    console.log(`✅ Found ${allPOs.length} POs in Mumbai with Pending status`);
    
  } catch (error) {
    console.error("❌ Error in PO retrieval test:", error);
  }
}

async function performanceAnalysis(poService: PoService) {
  console.log("\\n📊 Performance Analysis...");
  
  const performances = [];
  
  for (let size of [10, 25, 50]) {
    const testData = generateBulkTestData(size, 3);
    const startTime = Date.now();
    
    try {
      await poService.processPOData(testData.data, `Perf-Test-${size}`);
      const time = Date.now() - startTime;
      const itemsPerSecond = Math.round((size * 3) / (time / 1000));
      
      performances.push({
        size: size * 3,
        time,
        itemsPerSecond
      });
      
      console.log(`   ${size * 3} items: ${time}ms (${itemsPerSecond} items/sec)`);
    } catch (error) {
      console.error(`   Error with ${size * 3} items:`, error);
    }
  }
  
  console.log("\\n📈 Performance Summary:");
  performances.forEach(p => {
    console.log(`   ${p.size} items: ${p.itemsPerSecond} items/sec`);
  });
}

// Run the comprehensive test
async function runFullTest() {
  const poService = new PoService();
  
  await testBulkProcessing();
  await testSpecificPORetrieval(poService);
  await performanceAnalysis(poService);
  
  console.log("\\n🏁 All tests completed!");
}

// Execute the test
runFullTest().catch(console.error);