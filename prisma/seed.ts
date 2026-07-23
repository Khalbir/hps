import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1. Create Admin User
  // ============================================
  const adminPassword = await hash(process.env.ADMIN_PASSWORD || "AdminPass123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@handyhubpro.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@handyhubpro.com",
      phone: "+2349000000001",
      firstName: "Admin",
      lastName: "HandyHub",
      password: adminPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log("✅ Admin user created:", admin.email);

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
  console.log("✅ Service categories created");

  // ============================================
  // 3. Create Services with Pricing
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
  console.log("✅ Services created");

  // ============================================
  // 4. Create Sample Professionals
  // ============================================
  const proPasswords = await hash("ProPass123!", 12);

  const professionals = [
    { firstName: "Abubakar", lastName: "Tanko", email: "abubakar@handyhubpro.com", phone: "+2349000000010", bio: "Licensed electrician with 8 years of experience. Specializes in industrial and residential wiring.", yearsExperience: 8, rating: 4.9, totalJobs: 247 },
    { firstName: "Blessing", lastName: "Okafor", email: "blessing@handyhubpro.com", phone: "+2349000000011", bio: "Professional cleaner and team lead. Known for meticulous attention to detail.", yearsExperience: 5, rating: 4.8, totalJobs: 312 },
    { firstName: "Ibrahim", lastName: "Musa", email: "ibrahim@handyhubpro.com", phone: "+2349000000012", bio: "Master plumber certified by the Nigerian Institute of Plumbing. Emergency services available.", yearsExperience: 12, rating: 4.9, totalJobs: 189 },
    { firstName: "Chioma", lastName: "Eze", email: "chioma@handyhubpro.com", phone: "+2349000000013", bio: "Interior decorator with a keen eye for modern Nigerian aesthetics. Featured in Bellanaija Decor.", yearsExperience: 6, rating: 5.0, totalJobs: 78 },
    { firstName: "Yusuf", lastName: "Abdullahi", email: "yusuf@handyhubpro.com", phone: "+2349000000014", bio: "AC and refrigeration technician. Trained by Samsung and LG certified programs.", yearsExperience: 7, rating: 4.7, totalJobs: 156 },
    { firstName: "Ngozi", lastName: "Nwankwo", email: "ngozi@handyhubpro.com", phone: "+2349000000015", bio: "Professional painter with expertise in texturing, murals, and modern finishes.", yearsExperience: 10, rating: 4.8, totalJobs: 201 },
  ];

  for (const pro of professionals) {
    const user = await prisma.user.upsert({
      where: { email: pro.email },
      update: {},
      create: {
        email: pro.email,
        phone: pro.phone,
        firstName: pro.firstName,
        lastName: pro.lastName,
        password: proPasswords,
        role: "PROFESSIONAL",
        isVerified: true,
      },
    });

    await prisma.professional.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: pro.bio,
        yearsExperience: pro.yearsExperience,
        rating: pro.rating,
        totalJobs: pro.totalJobs,
        verificationStatus: "VERIFIED",
        isAvailable: true,
        responseTime: Math.floor(Math.random() * 30) + 15,
      },
    });
  }
  console.log("✅ Professionals created");

  // ============================================
  // 5. Create Sample Customer
  // ============================================
  const customerPassword = await hash("Customer123!", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      email: "customer@test.com",
      phone: "+2349000000099",
      firstName: "Test",
      lastName: "Customer",
      password: customerPassword,
      role: "CUSTOMER",
      isVerified: true,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      balance: 50000,
    },
  });

  await prisma.address.upsert({
    where: { id: "default-address" },
    update: {},
    create: {
      id: "default-address",
      userId: customer.id,
      label: "Home",
      address: "12 Aminu Kano Crescent",
      city: "Abuja",
      state: "FCT",
      landmark: "Opposite Transcorp Hilton",
      isDefault: true,
    },
  });
  console.log("✅ Sample customer created");

  // ============================================
  // 6. Create Promo Code
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
  console.log("✅ Promo codes created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("   Admin:    admin@handyhubpro.com / AdminPass123!");
  console.log("   Customer: customer@test.com / Customer123!");
  console.log("   Pro:      abubakar@handyhubpro.com / ProPass123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
