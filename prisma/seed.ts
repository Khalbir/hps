import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database structure...");

  // ============================================
  // 1. Create Super Admin & Admin General Accounts
  // ============================================
  const adminPassword = await hash(process.env.ADMIN_PASSWORD || "AdminPass123!", 12);
  
  await prisma.user.upsert({
    where: { email: "admin@handyhubpro.ng" },
    update: { role: "SUPER_ADMIN", isVerified: true },
    create: {
      email: "admin@handyhubpro.ng",
      phone: "+2349000000001",
      firstName: "Chief",
      lastName: "Commander",
      password: adminPassword,
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@handyhubpro.com" },
    update: { role: "ADMIN", isVerified: true },
    create: {
      email: "admin@handyhubpro.com",
      phone: "+2349000000002",
      firstName: "Admin",
      lastName: "General",
      password: adminPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("✅ Admin accounts initialized (Chief Commander & Admin General)");

  // ============================================
  // 2. Create Service Categories
  // ============================================
  const categories = [
    { name: "Cleaning", slug: "cleaning", icon: "Sparkles", description: "Professional cleaning services for homes and offices", order: 1 },
    { name: "Plumbing", slug: "plumbing", icon: "Droplets", description: "Pipe repairs, installations & water systems", order: 2 },
    { name: "Electrical", slug: "electrical", icon: "Zap", description: "Wiring, sockets, panels & electrical installations", order: 3 },
    { name: "HVAC", slug: "hvac", icon: "Wind", description: "Air conditioning installation, repair & servicing", order: 4 },
    { name: "Painting", slug: "painting", icon: "Paintbrush", description: "Interior & exterior painting services", order: 5 },
    { name: "Carpentry", slug: "carpentry", icon: "Hammer", description: "Furniture, woodwork & custom installations", order: 6 },
    { name: "Security", slug: "security", icon: "Camera", description: "CCTV, alarms & security installations", order: 7 },
    { name: "Solar & Power", slug: "solar-power", icon: "Sun", description: "Solar panels, inverters & power solutions", order: 8 },
    { name: "Home Improvement", slug: "home-improvement", icon: "Home", description: "Renovations, remodeling & interior design", order: 9 },
    { name: "Outdoor", slug: "outdoor", icon: "TreePine", description: "Gardening, landscaping & outdoor maintenance", order: 10 },
    { name: "Laundry", slug: "laundry", icon: "Shirt", description: "Professional washing, ironing & dry cleaning", order: 11 },
    { name: "Moving", slug: "moving", icon: "Truck", description: "Home & office relocation services", order: 12 },
    { name: "General", slug: "general", icon: "Wrench", description: "General handyman & maintenance services", order: 13 },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Service categories initialized");

  // ============================================
  // 3. Create Services with Base Pricing
  // ============================================
  const cleaningCat = await prisma.serviceCategory.findUnique({ where: { slug: "cleaning" } });
  const plumbingCat = await prisma.serviceCategory.findUnique({ where: { slug: "plumbing" } });
  const electricalCat = await prisma.serviceCategory.findUnique({ where: { slug: "electrical" } });
  const hvacCat = await prisma.serviceCategory.findUnique({ where: { slug: "hvac" } });
  const paintingCat = await prisma.serviceCategory.findUnique({ where: { slug: "painting" } });
  const carpentryCat = await prisma.serviceCategory.findUnique({ where: { slug: "carpentry" } });
  const securityCat = await prisma.serviceCategory.findUnique({ where: { slug: "security" } });
  const solarCat = await prisma.serviceCategory.findUnique({ where: { slug: "solar-power" } });
  const homeCat = await prisma.serviceCategory.findUnique({ where: { slug: "home-improvement" } });
  const outdoorCat = await prisma.serviceCategory.findUnique({ where: { slug: "outdoor" } });
  const laundryCat = await prisma.serviceCategory.findUnique({ where: { slug: "laundry" } });
  const movingCat = await prisma.serviceCategory.findUnique({ where: { slug: "moving" } });
  const generalCat = await prisma.serviceCategory.findUnique({ where: { slug: "general" } });

  const services = [
    // Cleaning
    { name: "Residential Cleaning", slug: "residential-cleaning", description: "Standard cleaning for apartments and houses", categoryId: cleaningCat!.id, basePrice: 15000, icon: "Sparkles" },
    { name: "Commercial Cleaning", slug: "commercial-cleaning", description: "Office and business space cleaning", categoryId: cleaningCat!.id, basePrice: 35000, icon: "Sparkles" },
    { name: "Deep Cleaning", slug: "deep-cleaning", description: "Thorough deep cleaning of every surface", categoryId: cleaningCat!.id, basePrice: 25000, icon: "Sparkles" },
    { name: "Post Construction Cleaning", slug: "post-construction-cleaning", description: "Cleanup after renovation or construction", categoryId: cleaningCat!.id, basePrice: 40000, icon: "Sparkles" },
    // Plumbing
    { name: "Pipe Repairs", slug: "pipe-repairs", description: "Fix leaking and burst pipes", categoryId: plumbingCat!.id, basePrice: 10000, icon: "Droplets" },
    { name: "Drainage & Sewage", slug: "drainage-sewage", description: "Drain unblocking and sewage maintenance", categoryId: plumbingCat!.id, basePrice: 15000, icon: "Droplets" },
    { name: "Water Heater Installation", slug: "water-heater", description: "Install or repair water heating systems", categoryId: plumbingCat!.id, basePrice: 20000, icon: "Droplets" },
    // Electrical
    { name: "Wiring & Rewiring", slug: "wiring-rewiring", description: "Full or partial electrical wiring", categoryId: electricalCat!.id, basePrice: 15000, icon: "Zap" },
    { name: "Socket & Switch Repair", slug: "socket-switch", description: "Replace or install sockets and switches", categoryId: electricalCat!.id, basePrice: 5000, icon: "Zap" },
    { name: "Lighting Installation", slug: "lighting-installation", description: "Install chandeliers, spotlights & more", categoryId: electricalCat!.id, basePrice: 8000, icon: "Zap" },
    // HVAC
    { name: "AC Installation", slug: "ac-installation", description: "Split unit AC installation", categoryId: hvacCat!.id, basePrice: 15000, icon: "Wind" },
    { name: "AC Servicing", slug: "ac-servicing", description: "AC cleaning and gas refill", categoryId: hvacCat!.id, basePrice: 8000, icon: "Wind" },
    { name: "AC Repair", slug: "ac-repair", description: "Diagnose and fix AC faults", categoryId: hvacCat!.id, basePrice: 12000, icon: "Wind" },
    // Painting
    { name: "Interior Painting", slug: "interior-painting", description: "Full interior room painting", categoryId: paintingCat!.id, basePrice: 20000, icon: "Paintbrush" },
    { name: "Exterior Painting", slug: "exterior-painting", description: "Building exterior painting", categoryId: paintingCat!.id, basePrice: 35000, icon: "Paintbrush" },
    // Carpentry
    { name: "Furniture Assembly", slug: "furniture-assembly", description: "Assemble flat-pack and custom furniture", categoryId: carpentryCat!.id, basePrice: 8000, icon: "Hammer" },
    { name: "Custom Carpentry", slug: "custom-carpentry", description: "Custom shelves, cabinets & wardrobes", categoryId: carpentryCat!.id, basePrice: 25000, icon: "Hammer" },
    // Security
    { name: "CCTV Installation", slug: "cctv-installation", description: "Security camera setup & configuration", categoryId: securityCat!.id, basePrice: 25000, icon: "Camera" },
    // Solar
    { name: "Solar Panel Installation", slug: "solar-installation", description: "Solar panel and inverter systems", categoryId: solarCat!.id, basePrice: 50000, icon: "Sun" },
    { name: "Inverter Installation", slug: "inverter-installation", description: "Inverter and battery setup", categoryId: solarCat!.id, basePrice: 30000, icon: "Sun" },
    // Home Improvement
    { name: "Interior Decoration", slug: "interior-decoration", description: "Space planning & interior design", categoryId: homeCat!.id, basePrice: 30000, icon: "Sofa" },
    { name: "Home Renovation", slug: "home-renovation", description: "Complete home remodeling", categoryId: homeCat!.id, basePrice: 100000, icon: "Home" },
    // Outdoor
    { name: "Gardening", slug: "gardening", description: "Lawn care, landscaping & maintenance", categoryId: outdoorCat!.id, basePrice: 12000, icon: "TreePine" },
    // Laundry
    { name: "Laundry Services", slug: "laundry-services", description: "Washing, ironing & dry cleaning", categoryId: laundryCat!.id, basePrice: 5000, icon: "Shirt" },
    // Moving
    { name: "Moving Services", slug: "moving-services", description: "Home & office relocation", categoryId: movingCat!.id, basePrice: 25000, icon: "Truck" },
    // General
    { name: "Generator Repairs", slug: "generator-repairs", description: "Generator servicing & maintenance", categoryId: generalCat!.id, basePrice: 8000, icon: "Wrench" },
    { name: "General Handyman", slug: "general-handyman", description: "Odd jobs, assembly & minor repairs", categoryId: generalCat!.id, basePrice: 8000, icon: "Settings" },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: svc,
    });
  }
  console.log("✅ Services initialized");

  // ============================================
  // 4. Create Active Promo Codes
  // ============================================
  await prisma.promoCode.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: {
      code: "WELCOME50",
      discountType: "PERCENTAGE",
      discountValue: 50,
      maxUses: 1000,
      maxDiscount: 5000,
      expiresAt: new Date("2027-12-31"),
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "HANDY2000" },
    update: {},
    create: {
      code: "HANDY2000",
      discountType: "FIXED",
      discountValue: 2000,
      maxUses: 500,
      minAmount: 10000,
      expiresAt: new Date("2027-06-30"),
    },
  });
  console.log("✅ Production promo codes initialized");

  console.log("\n🎉 Clean database structure ready for live users and real artisans!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
