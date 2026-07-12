import { db } from "./db";
import { categories, products, customers, users, transactions, transactionItems } from "./schema";

async function main() {
  console.log("Cleaning database tables...");
  
  // Clean up order matters for foreign keys
  await db.delete(transactionItems).run();
  await db.delete(transactions).run();
  await db.delete(products).run();
  
  console.log("Database tables cleaned!");

  // Seed Categories
  await db.insert(categories).values([
    { id: 1, name: 'Makanan Ringan', description: 'Camilan, biskuit, keripik, dll' },
    { id: 2, name: 'Minuman', description: 'Air mineral, bersoda, teh, kopi kemasan' },
    { id: 3, name: 'Kebutuhan Harian', description: 'Sabun, pasta gigi, detergen, shampoo' },
    { id: 4, name: 'Mi Instan & Sembako', description: 'Mie instan, minyak goreng, gula, garam' },
    { id: 5, name: 'Obat-obatan', description: 'Obat bebas, vitamin, plester' }
  ]).onConflictDoNothing();

  console.log("Categories seeded!");

  // Generate 200 products (40 per category)
  const productList: any[] = [];
  let prodId = 1;

  // Snack Category (ID: 1)
  const snackBrands = ['Chitato', 'Lays', 'Qtela', 'Pringles', 'Oreo', 'Beng Beng', 'Kusuka', 'Taro', 'Silverqueen', 'Gerry', 'Roma', 'Khong Guan', 'Tango', 'Chocolatos', 'Piattos', 'Ritz', 'Nextar', 'Nabati', 'Sari Roti', 'Chiki'];
  const snackFlavors = ['Cokelat', 'Keju', 'Vanilla', 'Strawberry', 'Sapi Panggang', 'Rumput Laut', 'Singkong Balado', 'Original', 'Barbeque', 'Jagung Bakar'];

  // Drinks Category (ID: 2)
  const drinkBrands = ['Aqua', 'Le Minerale', 'Ades', 'Vit', 'Teh Botol Sosro', 'Frestea', 'Ultra Milk', 'Indomilk', 'Good Day', 'Kapal Api', 'Sprite', 'Fanta', 'Coca Cola', 'Pocari Sweat', 'Hydro Coco', 'Yakult', 'Cimory', 'Teh Pucuk', 'Milo', 'Kratingdaeng'];
  const drinkFlavors = ['Dingin', 'Cokelat', 'Strawberry', 'Vanilla', 'Melon', 'Original', 'Less Sugar', 'Kopi Susu', 'Mocha', 'Soda Gembira'];

  // Daily Care Category (ID: 3)
  const careBrands = ['Pepsodent', 'Colgate', 'Close Up', 'Sensodyne', 'Lifebuoy', 'Dettol', 'Biore', 'Lux', 'Giv', 'Sunsilk', 'Pantene', 'Clear', 'Rexona', 'Nivea', 'Vaseline', 'Rinso', 'So Klin', 'Daia', 'Sunlight', 'Downy'];
  const careTypes = ['Action 123', 'Anti Dandruff', 'Total Protect', 'Lemon Fresh', 'Cool Menthol', 'Floral Soft', 'Lavender', 'Active Clean', 'Sensitif', 'Bright Fresh'];

  // Sembako Category (ID: 4)
  const sembakoBrands = ['Indomie', 'Mie Sedaap', 'Sarimi', 'Minyak Bimoli', 'Minyak Filma', 'Sania', 'Gulaku', 'Garam Gurih', 'Beras Cianjur', 'Beras Ramos', 'Segitiga Biru', 'Kecap Bango', 'Kecap ABC', 'Saus Indofood', 'Blue Band', 'Kopi Kapal Api'];
  const sembakoTypes = ['Goreng Spesial', 'Kari Ayam', 'Soto Spesial', 'Minyak Goreng Pouch', 'Gula Tebu', 'Garam Dapur', 'Beras Pandan Wangi', 'Tepung Serbaguna', 'Kecap Manis', 'Saus Cabai Pedas', 'Mentega Serbaguna'];

  // Medicine Category (ID: 5)
  const medBrands = ['Panadol', 'Paramex', 'Bodrex', 'Mixagrip', 'Decolgen', 'Promag', 'Diapet', 'Tolak Angin', 'Antimo', 'Sangobion', 'Neurobion', 'Betadine', 'Hansaplast', 'Minyak Cap Lang', 'Salonpas', 'Counterpain', 'Mylanta', 'Sanaflu', 'Procold', 'Oskadon'];
  const medTypes = ['Extra', 'Flu & Batuk', 'Sakit Kepala', 'Maag Cair', 'Anak-anak', 'Dewasa', 'Herbal', 'Plester Kain', 'Minyak Kayu Putih', 'Salep Otot'];

  // Generate 40 items for Snack
  for (let i = 1; i <= 40; i++) {
    const brand = snackBrands[i % snackBrands.length];
    const flavor = snackFlavors[(i * 3) % snackFlavors.length];
    const size = (i % 3 === 0) ? 'Large' : (i % 3 === 1) ? 'Medium' : 'Small';
    const buy = Math.round((2000 + (i * 250)) / 100) * 100;
    const sell = Math.round((buy * 1.25) / 100) * 100;
    
    productList.push({
      id: prodId,
      barcode: '8991' + String(prodId).padStart(8, '0'),
      name: `${brand} ${flavor} ${size}`,
      categoryId: 1,
      buyPrice: buy,
      sellPrice: sell,
      stock: 20 + (i * 7) % 80,
      minStock: 5 + (i % 10),
      unit: 'Pcs',
      isActive: 1
    });
    prodId++;
  }

  // Generate 40 items for Drinks
  for (let i = 1; i <= 40; i++) {
    const brand = drinkBrands[i % drinkBrands.length];
    const flavor = drinkFlavors[(i * 3) % drinkFlavors.length];
    const size = (i % 3 === 0) ? '600ml' : (i % 3 === 1) ? '250ml' : '1500ml';
    const unit = (i % 4 === 0) ? 'Kotak' : (i % 4 === 1) ? 'Kaleng' : 'Botol';
    const buy = Math.round((1500 + (i * 200)) / 100) * 100;
    const sell = Math.round((buy * 1.3) / 100) * 100;

    productList.push({
      id: prodId,
      barcode: '8992' + String(prodId).padStart(8, '0'),
      name: `${brand} ${flavor} ${size}`,
      categoryId: 2,
      buyPrice: buy,
      sellPrice: sell,
      stock: 25 + (i * 9) % 75,
      minStock: 5 + (i % 12),
      unit: unit,
      isActive: 1
    });
    prodId++;
  }

  // Generate 40 items for Daily Care
  for (let i = 1; i <= 40; i++) {
    const brand = careBrands[i % careBrands.length];
    const type = careTypes[(i * 3) % careTypes.length];
    const size = (i % 3 === 0) ? 'Refill 800ml' : (i % 3 === 1) ? '200ml' : '150g';
    const unit = (size.includes('Refill')) ? 'Pouch' : (size.includes('ml')) ? 'Botol' : 'Pcs';
    const buy = Math.round((5000 + (i * 600)) / 100) * 100;
    const sell = Math.round((buy * 1.2) / 100) * 100;

    productList.push({
      id: prodId,
      barcode: '8993' + String(prodId).padStart(8, '0'),
      name: `${brand} ${type} ${size}`,
      categoryId: 3,
      buyPrice: buy,
      sellPrice: sell,
      stock: 15 + (i * 5) % 60,
      minStock: 4 + (i % 8),
      unit: unit,
      isActive: 1
    });
    prodId++;
  }

  // Generate 40 items for Sembako
  for (let i = 1; i <= 40; i++) {
    const brand = sembakoBrands[i % sembakoBrands.length];
    const type = sembakoTypes[(i * 3) % sembakoTypes.length];
    const size = (i % 3 === 0) ? '1 Kg' : (i % 3 === 1) ? '2 Liter' : 'Pcs';
    const unit = (size.includes('Kg')) ? 'Kg' : (size.includes('Liter')) ? 'Pouch' : 'Pcs';
    const buy = Math.round((3000 + (i * 1200)) / 100) * 100;
    const sell = Math.round((buy * 1.15) / 100) * 100;

    productList.push({
      id: prodId,
      barcode: '8994' + String(prodId).padStart(8, '0'),
      name: `${brand} ${type} ${size}`,
      categoryId: 4,
      buyPrice: buy,
      sellPrice: sell,
      stock: 10 + (i * 11) % 90,
      minStock: 6 + (i % 15),
      unit: unit,
      isActive: 1
    });
    prodId++;
  }

  // Generate 40 items for Medicine
  for (let i = 1; i <= 40; i++) {
    const brand = medBrands[i % medBrands.length];
    const type = medTypes[(i * 3) % medTypes.length];
    const size = (i % 3 === 0) ? 'Strip' : (i % 3 === 1) ? '60ml Botol' : 'Sachet';
    const unit = (size === 'Strip') ? 'Strip' : (size.includes('Botol')) ? 'Botol' : 'Sachet';
    const buy = Math.round((2500 + (i * 450)) / 100) * 100;
    const sell = Math.round((buy * 1.22) / 100) * 100;

    productList.push({
      id: prodId,
      barcode: '8995' + String(prodId).padStart(8, '0'),
      name: `${brand} ${type} ${size}`,
      categoryId: 5,
      buyPrice: buy,
      sellPrice: sell,
      stock: 30 + (i * 6) % 70,
      minStock: 8 + (i % 10),
      unit: unit,
      isActive: 1
    });
    prodId++;
  }

  // Batch insert products to database
  console.log("Inserting 200 products into database...");
  await db.insert(products).values(productList).onConflictDoNothing();
  console.log("200 Products seeded successfully!");

  // Seed Customers
  await db.insert(customers).values([
    { id: 1, name: 'Budi Santoso', phone: '081234567890', points: 150, createdAt: new Date().toISOString() },
    { id: 2, name: 'Siti Rahma', phone: '085777888999', points: 420, createdAt: new Date().toISOString() },
    { id: 3, name: 'Joko Widodo', phone: '081122334455', points: 80, createdAt: new Date().toISOString() },
    { id: 4, name: 'Dewi Lestari', phone: '089988776655', points: 950, createdAt: new Date().toISOString() }
  ]).onConflictDoNothing();

  console.log("Customers seeded!");

  // Seed Users
  await db.insert(users).values([
    { id: 1, username: 'admin', passwordHash: 'admin123', name: 'Supervisor Admin', role: 'ADMIN', createdAt: new Date().toISOString() },
    { id: 2, username: 'siti', passwordHash: 'siti123', name: 'Siti Aminah', role: 'CASHIER', createdAt: new Date().toISOString() }
  ]).onConflictDoNothing();

  console.log("Users seeded!");
  console.log("Database seeding completed successfully!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
