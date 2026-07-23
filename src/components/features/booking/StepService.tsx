"use client";

import {
  Sparkles, Droplets, Zap, Paintbrush, Wind, Camera, Sun,
  Hammer, Home, TreePine, Shirt, Truck, Settings, Search,
} from "lucide-react";
import { useState } from "react";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

const categories = [
  { id: "cleaning", name: "Cleaning", icon: Sparkles, color: "#0EA5E9",
    services: [
      { id: "residential-cleaning", name: "Residential Cleaning", price: 15000, desc: "Standard cleaning for apartments and houses" },
      { id: "commercial-cleaning", name: "Commercial Cleaning", price: 35000, desc: "Office and business space cleaning" },
      { id: "deep-cleaning", name: "Deep Cleaning", price: 25000, desc: "Thorough deep cleaning of every surface" },
      { id: "post-construction", name: "Post Construction Cleaning", price: 40000, desc: "Cleanup after renovation" },
    ] },
  { id: "plumbing", name: "Plumbing", icon: Droplets, color: "#3B82F6",
    services: [
      { id: "pipe-repairs", name: "Pipe Repairs", price: 10000, desc: "Fix leaking and burst pipes" },
      { id: "drainage-sewage", name: "Drainage & Sewage", price: 15000, desc: "Drain unblocking and sewage maintenance" },
      { id: "water-heater", name: "Water Heater Installation", price: 20000, desc: "Install or repair water heating" },
    ] },
  { id: "electrical", name: "Electrical", icon: Zap, color: "#F59E0B",
    services: [
      { id: "wiring-rewiring", name: "Wiring & Rewiring", price: 15000, desc: "Full or partial electrical wiring" },
      { id: "socket-switch", name: "Socket & Switch Repair", price: 5000, desc: "Replace or install sockets" },
      { id: "lighting", name: "Lighting Installation", price: 8000, desc: "Chandeliers, spotlights & more" },
    ] },
  { id: "hvac", name: "AC & HVAC", icon: Wind, color: "#06B6D4",
    services: [
      { id: "ac-installation", name: "AC Installation", price: 15000, desc: "Split unit AC installation" },
      { id: "ac-servicing", name: "AC Servicing", price: 8000, desc: "AC cleaning and gas refill" },
      { id: "ac-repair", name: "AC Repair", price: 12000, desc: "Diagnose and fix AC faults" },
    ] },
  { id: "painting", name: "Painting", icon: Paintbrush, color: "#EC4899",
    services: [
      { id: "interior-painting", name: "Interior Painting", price: 20000, desc: "Full interior room painting" },
      { id: "exterior-painting", name: "Exterior Painting", price: 35000, desc: "Building exterior painting" },
    ] },
  { id: "carpentry", name: "Carpentry", icon: Hammer, color: "#A16207",
    services: [
      { id: "furniture-assembly", name: "Furniture Assembly", price: 8000, desc: "Assemble flat-pack furniture" },
      { id: "custom-carpentry", name: "Custom Carpentry", price: 25000, desc: "Custom shelves, cabinets" },
    ] },
  { id: "security", name: "Security", icon: Camera, color: "#6366F1",
    services: [
      { id: "cctv-installation", name: "CCTV Installation", price: 25000, desc: "Camera setup & configuration" },
    ] },
  { id: "solar", name: "Solar & Power", icon: Sun, color: "#F97316",
    services: [
      { id: "solar-installation", name: "Solar Panel Installation", price: 50000, desc: "Solar panel and inverter" },
      { id: "inverter-installation", name: "Inverter Installation", price: 30000, desc: "Inverter and battery setup" },
      { id: "generator-repairs", name: "Generator Repairs", price: 8000, desc: "Generator servicing" },
    ] },
  { id: "home-improvement", name: "Home Improvement", icon: Home, color: "#059669",
    services: [
      { id: "interior-decoration", name: "Interior Decoration", price: 30000, desc: "Space planning & design" },
      { id: "home-renovation", name: "Home Renovation", price: 100000, desc: "Complete remodeling" },
    ] },
  { id: "outdoor", name: "Gardening", icon: TreePine, color: "#16A34A",
    services: [
      { id: "gardening", name: "Gardening", price: 12000, desc: "Lawn care & landscaping" },
    ] },
  { id: "laundry", name: "Laundry", icon: Shirt, color: "#0891B2",
    services: [
      { id: "laundry-services", name: "Laundry Services", price: 5000, desc: "Washing, ironing & dry cleaning" },
    ] },
  { id: "moving", name: "Moving", icon: Truck, color: "#CA8A04",
    services: [
      { id: "moving-services", name: "Moving Services", price: 25000, desc: "Home & office relocation" },
    ] },
  { id: "general", name: "Handyman", icon: Settings, color: "#64748B",
    services: [
      { id: "general-handyman", name: "General Handyman", price: 8000, desc: "Odd jobs & minor repairs" },
    ] },
];

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
}

export function StepService({ booking, updateBooking, onNext }: StepProps) {
  const [selectedCategory, setSelectedCategory] = useState(booking.serviceCategory || "");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = categories.find((c) => c.id === selectedCategory);

  const filteredCategories = searchQuery
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;

  const isCleaning = selectedCategory === "cleaning";

  const calculatePrice = (basePrice: number, bedrooms: number, bathrooms: number) => {
    if (isCleaning) {
      return basePrice + (bedrooms - 1) * 3000 + (bathrooms - 1) * 2000;
    }
    return basePrice;
  };

  const handleBedroomsChange = (n: number) => {
    updateBooking({ bedrooms: n });
  };

  const handleBathroomsChange = (n: number) => {
    updateBooking({ bathrooms: n });
  };

  const selectService = (catId: string, svc: { id: string; name: string; price: number }) => {
    const finalPrice = calculatePrice(svc.price, booking.bedrooms || 2, booking.bathrooms || 1);
    updateBooking({
      serviceCategory: catId,
      serviceId: svc.id,
      serviceName: svc.name,
      servicePrice: svc.price,
      totalPrice: finalPrice,
    });
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      {/* Search */}
      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search services... e.g. 'My sink is leaking'"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {!selectedCategory ? (
        <>
          <h2 className={styles.stepTitle}>What service do you need?</h2>
          <div className={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                className={styles.categoryCard}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className={styles.categoryIcon} style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                  <cat.icon size={24} />
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.services.length} service{cat.services.length > 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className={styles.backToCategories} onClick={() => setSelectedCategory("")}>
            ← All Categories
          </button>
          <h2 className={styles.stepTitle}>{activeCategory?.name} Services</h2>

          {selectedCategory === "cleaning" && (
            <div className={styles.configCard}>
              <div className={styles.configHeader}>
                <h4 className={styles.configTitle}>Customize Property Size</h4>
                <p className={styles.configSubtitle}>Specify rooms and bathrooms to get an accurate estimate instantly.</p>
              </div>
              <div className={styles.configControls}>
                <div className={styles.configField}>
                  <span className={styles.configLabel}>Bedrooms</span>
                  <div className={styles.configCounter}>
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange(Math.max(1, (booking.bedrooms || 2) - 1))}
                      className={styles.configBtn}
                      disabled={(booking.bedrooms || 2) <= 1}
                    >
                      -
                    </button>
                    <span className={styles.configValue}>{booking.bedrooms || 2}</span>
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange((booking.bedrooms || 2) + 1)}
                      className={styles.configBtn}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={styles.configField}>
                  <span className={styles.configLabel}>Bathrooms</span>
                  <div className={styles.configCounter}>
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange(Math.max(1, (booking.bathrooms || 1) - 1))}
                      className={styles.configBtn}
                      disabled={(booking.bathrooms || 1) <= 1}
                    >
                      -
                    </button>
                    <span className={styles.configValue}>{booking.bathrooms || 1}</span>
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange((booking.bathrooms || 1) + 1)}
                      className={styles.configBtn}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.serviceList}>
            {activeCategory?.services.map((svc) => {
              const calculatedPrice = calculatePrice(svc.price, booking.bedrooms || 2, booking.bathrooms || 1);
              return (
                <button
                  key={svc.id}
                  className={`card card-hover ${styles.serviceItem}`}
                  onClick={() => selectService(selectedCategory, svc)}
                >
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceItemName}>{svc.name}</h3>
                    <p className={styles.serviceItemDesc}>{svc.desc}</p>
                  </div>
                  <div className={styles.serviceItemPrice}>
                    <span className={styles.priceFrom}>
                      {isCleaning ? `${booking.bedrooms || 2} Bed, ${booking.bathrooms || 1} Bath` : "From"}
                    </span>
                    <span className={styles.priceAmount}>₦{calculatedPrice.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
