import React from "react";
import { Link } from "react-router-dom";
import { Tv, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useShowUniverseData } from "@/hooks/useShowUniverseData";

const sitemapLinks = [
  {
    section: "Public",
    links: [
      { title: "All Universes", to: "/public/universes" },
      { title: "All Shows", to: "/public/shows" },
      { title: "Shared Universes", to: "/public/shared-universes" },
    ],
  },
  {
    section: "TV Shows",
    links: [
      { title: "Dashboard", to: "/tv-shows" },
      { title: "My Shows", to: "/tv-shows/my-shows" },
      { title: "Browse Shows", to: "/tv-shows/public-shows" },
      { title: "Public Universes", to: "/tv-shows/public-universes" },
      { title: "Private Universes", to: "/tv-shows/private-universes" },
    ],
  },
  {
    section: "Finance",
    links: [
      { title: "Dashboard", to: "/finance" },
      { title: "Transactions", to: "/finance/transactions" },
      { title: "Wallets", to: "/finance/wallets" },
      { title: "Categories", to: "/finance/categories" },
      { title: "Transfers", to: "/finance/transfers" },
      { title: "Budgets", to: "/finance/budgets" },
      { title: "Reports", to: "/finance/reports" },
      { title: "Credits", to: "/finance/credits" },
      { title: "Settings", to: "/finance/settings" },
    ],
  },
  {
    section: "Movies",
    links: [
      { title: "Dashboard", to: "/movies" },
      { title: "My Movies", to: "/movies/my-movies" },
      { title: "Public Movies", to: "/movies/public" },
      { title: "Universes", to: "/movies/universes" },
      { title: "Analytics", to: "/movies/analytics" },
    ],
  },
  {
    section: "SettleBill",
    links: [
      { title: "Overview", to: "/settlebill" },
      { title: "Networks", to: "/settlebill/networks" },
      { title: "Bills", to: "/settlebill/bills" },
      
    ],
  },
  {
    section: "Household",
    links: [
      { title: "Dashboard", to: "/household" },
      { title: "Ledger", to: "/household/ledger" },
      { title: "Balance", to: "/household/balance" },
      { title: "Analytics", to: "/household/analytics" },
    ],
  },
  {
    section: "Inventory",
    links: [
      { title: "Dashboard", to: "/inventory" },
      { title: "Items", to: "/inventory/items" },
      { title: "Stores", to: "/inventory/stores" },
      { title: "Categories", to: "/inventory/categories" },
      { title: "Analytics", to: "/inventory/analytics" },
    ],
  },
  {
    section: "Images",
    links: [
      { title: "Gallery", to: "/images" },
      { title: "Albums", to: "/images/albums" },
      { title: "Favorites", to: "/images/favorites" },
    ],
  },
  {
    section: "Shared Universe",
    links: [
      { title: "Dashboard", to: "/shared-universe" },
      { title: "Public Universes", to: "/shared-universe/public" },
      { title: "Create Universe", to: "/shared-universe/create" },
    ],
  },
  {
    section: "Quick Commerce",
    links: [
      { title: "Store", to: "/quick-commerce/store" },
      { title: "Cart", to: "/quick-commerce/cart" },
      { title: "My Orders", to: "/quick-commerce/orders" },
      { title: "Order Tracking", to: "/quick-commerce/tracking" },
      { title: "Analytics", to: "/quick-commerce/analytics" },
    ],
  },
  {
    section: "General",
    links: [
      { title: "Home", to: "/" },
      { title: "Profile", to: "/profile" },
      { title: "Settings", to: "/settings" },
      { title: "Requests", to: "/requests" },
      { title: "Sign In", to: "/login" },
      { title: "Sign Up", to: "/signup" },
      { title: "Privacy Policy", to: "/privacy" },
      { title: "Terms of Service", to: "/terms" },
    ],
  },
];

const CardLink = ({ to, title }: { to: string; title: string }) => (
  <Link
    to={to}
    className="block group border border-border rounded-lg px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 mb-2 hover:border-primary/30 bg-card"
  >
    <div className="flex items-center gap-2">
      <Tv className="w-5 h-5 text-primary/60 group-hover:text-primary" />
      <span className="font-semibold text-primary group-hover:underline">{title}</span>
    </div>
  </Link>
);

const Sitemap: React.FC = () => {
  const { data, isLoading } = useShowUniverseData();

  // Derive unique shows and universes for dynamic public links
  const uniqueShows = [...new Map(data.map(d => [d.show_id, d])).values()];
  const uniqueUniverses = [...new Map(data.map(d => [d.universe_id, d])).values()];

  return (
    <>
      <Helmet>
        <title>Sitemap | Track Hub</title>
        <meta name="description" content="Explore all public and private pages and features in Track Hub." />
      </Helmet>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Sitemap</h1>

        {/* Dynamic Public Show & Universe Pages */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Public Show Pages</h2>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading public pages...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {uniqueShows.map((show) => (
                <CardLink
                  key={show.show_id}
                  to={`/public/show/${show.slug || show.show_title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                  title={show.show_title}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Public Universe Pages</h2>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading public pages...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {uniqueUniverses.map((u) => (
                <CardLink
                  key={u.universe_id}
                  to={`/public/universe/${u.universe_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                  title={u.universe_name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Static sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sitemapLinks.map((section) => (
            <div key={section.section}>
              <h2 className="text-xl font-semibold mb-3 text-foreground">{section.section}</h2>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <CardLink key={link.to} to={link.to} title={link.title} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sitemap;