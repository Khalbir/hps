import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "./Footer.module.css";

/* Inline social icons */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

const serviceLinks = [
  { name: "Residential Cleaning", href: "/services/cleaning" },
  { name: "Plumbing Services", href: "/services/plumbing" },
  { name: "Electrical Repairs", href: "/services/electrical" },
  { name: "AC Installation & Service", href: "/services/ac-repair" },
  { name: "Painting & Decorating", href: "/services/painting" },
  { name: "Explore All Services →", href: "/services" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "🛠️ Join as an Artisan / Pro", href: "/auth/register?role=PROFESSIONAL" },
  { name: "Track Active Booking", href: "/track" },
  { name: "Contact Dispatch", href: "/contact" },
  { name: "Frequently Asked Questions", href: "/faq" },
];

const legalLinks = [
  { name: "Terms of Service", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Refund & Escrow Policy", href: "/refund" },
  { name: "Legal & Governance Hub", href: "/legal" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Newsletter Section */}
      <div className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <div className={styles.newsletterContent}>
            <h3 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0", fontWeight: 800 }}>
              Stay Ahead with Home Care Insights 🛠️
            </h3>
            <p className={styles.newsletterText}>
              Get property maintenance guides, emergency artisan dispatch alerts, and exclusive seasonal vouchers.
            </p>
          </div>
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your official email address"
              className={`input ${styles.newsletterInput}`}
              aria-label="Email address for newsletter"
            />
            <button type="submit" className="btn btn-accent btn-md" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              Subscribe
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className={`container ${styles.main}`}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink} title="HandyHub Pro Solutions Home">
              <BrandLogo size="lg" lightText={true} />
            </Link>
            <p className={styles.brandDesc}>
              HandyHub Pro Solutions is Nigeria&apos;s leading tech platform for booking background-verified artisans & facility engineers. Transparent escrow payments, guaranteed quality work.
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactPillsGroup}>
                <a
                  href="tel:+2348122222936"
                  className={styles.contactPillCall}
                  title="Call 24/7 Priority Support Helpline"
                >
                  <Phone size={14} color="#38BDF8" />
                  <span>Call 24/7 Helpline</span>
                </a>
                <a
                  href="https://wa.me/2348122222936?text=Hello%20HandyHub%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactPillWhatsApp}
                  title="Chat with Customer Support on WhatsApp"
                >
                  <MessageSquare size={14} color="#4ADE80" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
              <a href="mailto:info@handyhubpro.ng" className={styles.contactItem} title="Email Dispatch Support">
                <Mail size={15} color="#00A8B5" />
                <span>info@handyhubpro.ng</span>
              </a>
              <div className={styles.contactItem}>
                <MapPin size={15} color="#FF6B00" />
                <span>Abuja (FCT) & Expanding States, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className={styles.linkGroup}>
            <h4 className={styles.linkGroupTitle}>Verified Services</h4>
            <ul className={styles.links}>
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={styles.link}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={styles.linkGroup}>
            <h4 className={styles.linkGroupTitle}>Company</h4>
            <ul className={styles.links}>
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={styles.link}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.linkGroup}>
            <h4 className={styles.linkGroupTitle}>Legal & Escrow</h4>
            <ul className={styles.links}>
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={styles.link}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} HandyHub Pro Solutions. All rights reserved. Registered in Nigeria.
          </p>
          <div className={styles.socials}>
            <a href="#" aria-label="Facebook" className={styles.socialLink}>
              <FacebookIcon />
            </a>
            <a href="#" aria-label="Twitter" className={styles.socialLink}>
              <TwitterIcon />
            </a>
            <a href="#" aria-label="Instagram" className={styles.socialLink}>
              <InstagramIcon />
            </a>
            <a href="#" aria-label="LinkedIn" className={styles.socialLink}>
              <LinkedinIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
