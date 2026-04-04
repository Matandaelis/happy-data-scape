import { DashboardCard, SectionHead, EmptyState, DashboardBtn, DashboardAccordion, FieldRow, UploadZone, DashboardToggle } from "../dashboard/DashboardAtoms";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { useState } from "react";

export function PlaylistsPage() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Playlists" action={<DashboardBtn icon="plus">Create a Playlist</DashboardBtn>} />
      <EmptyState icon="list" title="You have not created any Playlists yet!" body="Create a playlist to group shows and videos for your storefront" cta="Create a Playlist" />
    </div>
  );
}

export function HostsPage() {
  const [modal, setModal] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Manage Hosts"
        action={
          <div className="flex items-center gap-2 py-[5px] px-3 bg-card border border-border rounded-md">
            <DashboardIcon name="lock" size={12} className="text-primary" strokeWidth={2} />
            <span className="font-mono text-[11px]">LpOSg8KD9ckhGfWY</span>
          </div>
        }
      />
      <EmptyState icon="hosts" title="You have not created any Hosts yet!" body="Hosts go live from the iOS & Android host apps" cta="Add New Host" onCta={() => setModal(true)} />
      {modal && (
        <div className="fixed inset-0 bg-black/45 z-[300] flex items-start justify-end" onClick={() => setModal(false)}>
          <div className="animate-slide-in bg-card w-[380px] h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 px-6 border-b border-border flex items-start justify-between">
              <div>
                <p className="font-display font-extrabold text-base">Create a New Host</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Set login credentials for the iOS & Android Host Apps.</p>
              </div>
              <button onClick={() => setModal(false)} className="bg-transparent border-none cursor-pointer text-muted-foreground text-lg leading-none p-0.5">✕</button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-3.5">
              {["Name", "Email", "Password"].map((f) => (
                <FieldRow key={f} label={f} required>
                  <input type={f === "Password" ? "password" : "text"} placeholder={`Enter ${f.toLowerCase()}`} className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </FieldRow>
              ))}
              <DashboardBtn className="mt-1.5">Add Host</DashboardBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsStorePage() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Store" sub="Sync your Store with our Platform" />
      <DashboardCard className="p-[22px] animate-fade-up-1">
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Store URL" required><input defaultValue="https://pixelselectronics.co.ke" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></FieldRow>
          <FieldRow label="Live Shop Page URL" required>
            <div className="flex gap-2">
              <input defaultValue="https://pixelselectronics.co.ke" className="flex-[2] bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary" />
              <input defaultValue="/streams" className="flex-1 bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary" />
            </div>
          </FieldRow>
          <FieldRow label="Products API URL" help="WooCommerce: /wp-json/wc/v3/products">
            <input defaultValue="https://pixelselectronics.co.ke/wp-json/api/products" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </FieldRow>
          <div className="flex justify-end"><DashboardBtn>Save</DashboardBtn></div>
        </div>
      </DashboardCard>
      <DashboardCard className="p-5 animate-fade-up-2">
        <h3 className="font-display font-bold text-sm mb-3.5">Frequently Asked Questions</h3>
        <DashboardAccordion items={[
          { q: "How do I set the Store Configuration?", a: "Navigate to Settings > Store, enter your Store URL, Live Shop Page URL, and Products API URL." },
          { q: "What is the Products API URL?", a: "The Products API URL is the REST endpoint used to fetch your product catalog during a live show." },
        ]} />
      </DashboardCard>
    </div>
  );
}

export function SettingsBrandingPage() {
  const [hide, setHide] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Custom Branding" sub="Elevate your Live Shows & Shoppable Videos with Custom Branding" />
      <DashboardCard className="p-[22px] animate-fade-up-1">
        <FieldRow label="Upload Brand Logo" help="Appears on all embed surfaces and the live viewer page">
          <UploadZone height={120} hint="PNG, SVG — transparent background recommended" />
        </FieldRow>
        <div className="mt-4 flex items-center justify-between py-3 border-b border-border last:border-b-0">
          <div><p className="text-[13px] font-medium">Hide Logo</p><p className="text-[11px] text-muted-foreground mt-[1px]">Hide the brand logo from all embed surfaces</p></div>
          <DashboardToggle on={hide} onToggle={() => setHide((p) => !p)} />
        </div>
        <div className="mt-4 flex justify-end"><DashboardBtn>Save</DashboardBtn></div>
      </DashboardCard>
    </div>
  );
}

export function SettingsNotifsPage() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Email & SMS Notifications" sub="Notify your viewers about specific individual Shows or all of your Upcoming Shows" />
      <DashboardCard className="p-[22px] animate-fade-up-1">
        <div className="flex gap-2 mb-5">
          {["Klaviyo (Email)", "Africa's Talking (SMS)"].map((p, i) => (
            <button key={p} className={`px-3.5 py-[7px] rounded-md border font-display font-bold text-[11px] cursor-pointer transition-colors ${i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>{p}</button>
          ))}
        </div>
        <FieldRow label="Klaviyo Private API Key" required>
          <input type="password" placeholder="Enter your Klaviyo Private API Key" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </FieldRow>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          To obtain the Klaviyo Private API Key, navigate to <strong>Account &gt; Settings &gt; API Keys</strong>.
        </p>
        <div className="mt-4 flex justify-end"><DashboardBtn>Next</DashboardBtn></div>
      </DashboardCard>
    </div>
  );
}

export function SimulcastPage() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Simulcast" sub="Stream to multiple platforms simultaneously via RTMP (MediaMTX)" />
      <DashboardCard className="p-4 px-5 bg-amber-50 border-amber-200 animate-fade-up-1">
        <div className="flex gap-2.5 items-start">
          <DashboardIcon name="signal" size={16} className="text-warning" strokeWidth={1.8} />
          <div>
            <p className="text-[13px] font-display font-bold text-amber-800">Simulcast is handled by MediaMTX on your Joburg VPS</p>
            <p className="text-[12px] text-amber-800 mt-0.5">This configuration is completely decoupled from the LiveKit broadcast layer.</p>
          </div>
        </div>
      </DashboardCard>
      {["YouTube Live", "Facebook Live"].map((label, i) => (
        <DashboardCard key={i} className="p-4 animate-fade-up-2">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-display font-bold text-[13px]">{label}</span>
            <DashboardBtn size="sm" variant="danger" icon="trash" />
          </div>
          <input placeholder="rtmp://…" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[11px] outline-none mb-2" />
          <input placeholder="Stream key" type="password" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[11px] outline-none" />
        </DashboardCard>
      ))}
      <div className="flex gap-2.5 animate-fade-up-3">
        <DashboardBtn variant="ghost" icon="plus">Add Destination</DashboardBtn>
        <DashboardBtn>Save Simulcast Config</DashboardBtn>
      </div>
    </div>
  );
}

export function IntegrationsPage() {
  const [tab, setTab] = useState<"woo" | "any">("woo");
  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Integrations" sub="Find all the information you need about our integrated E-commerce platforms." />
      <DashboardCard className="overflow-hidden animate-fade-up-1">
        <div className="flex border-b border-border px-1">
          {[{ k: "woo" as const, l: "WooCommerce" }, { k: "any" as const, l: "Any Website & Apps" }].map((t) => (
            <button key={t.k} className={`py-2.5 px-4 font-display font-bold text-[12px] border-b-2 bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors ${tab === t.k ? "text-primary border-b-primary" : "text-muted-foreground border-b-transparent"}`} onClick={() => setTab(t.k)}>{t.l}</button>
          ))}
        </div>
        {tab === "woo" && (
          <div className="p-[22px]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-[15px]">Setup Instructions:</h3>
              <div className="bg-[#7f54b3] rounded-md py-1 px-2.5"><span className="font-display font-extrabold text-[11px] text-card tracking-[.03em]">WooCommerce</span></div>
            </div>
            {[
              "Install the Plugin",
              "Configure the Plugin",
              "Copy your API Keys",
              "Your Live Shop Page is Ready",
              "Go Live",
            ].map((s, i) => (
              <div key={i} className="flex gap-3.5 py-4 border-b border-border last:border-b-0">
                <div className="w-[26px] h-[26px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-[11px] font-extrabold shrink-0 mt-[1px]">{i + 1}</div>
                <div>
                  <p className="font-semibold text-[13px] mb-1"><strong>Step {i + 1}:</strong> {s}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">Follow the step-by-step instructions in our Help Center.</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "any" && (
          <div className="p-[22px] flex flex-col gap-5">
            <div>
              <h3 className="font-display font-bold text-sm mb-3">Live Shows Playlist Embed</h3>
              <div className="bg-sidebar rounded-md p-4 font-mono text-[11.5px] text-sky-300 leading-relaxed overflow-x-auto whitespace-pre border border-sidebar-border">
                {`<live-shop-playlist\n  playlist-id="YOUR_ID"\n  format="carousel"\n></live-shop-playlist>\n<script src="https://yourplatform.com/embed/playlist.js"></script>`}
              </div>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display font-extrabold text-[22px] tracking-tight animate-fade-up">Help</h1>
      <DashboardCard className="bg-sidebar border-none p-8 text-center relative overflow-hidden animate-fade-up-1">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(22,72,232,.2),transparent_60%)] pointer-events-none" />
        <h2 className="font-display font-extrabold text-[17px] text-card mb-2 relative">Have questions?</h2>
        <p className="text-[13px] text-sidebar-foreground mb-5 relative">
          Facing Issues? Contact us or write at: <a href="mailto:info@liveshop.io" className="text-primary font-semibold">info@liveshop.io</a>
        </p>
        <div className="flex gap-2.5 justify-center relative">
          <button className="py-[7px] px-4 bg-sidebar-accent text-card border border-sidebar-border rounded-md font-display font-bold text-[12px] cursor-pointer">Dashboard Walkthrough</button>
          <button className="py-[7px] px-4 bg-primary text-card border-none rounded-md font-display font-bold text-[12px] cursor-pointer shadow-[0_2px_8px_hsl(var(--brand-glow))]">Visit Help Center</button>
        </div>
      </DashboardCard>
      <DashboardCard className="p-5 animate-fade-up-2">
        <h3 className="font-display font-extrabold text-[15px] mb-3.5">Frequently asked questions</h3>
        <DashboardAccordion items={[
          { q: "How can I create a Live show?", a: "Navigate to Live Shows and click Create Live Show. Fill in the details and publish." },
          { q: "How can I edit a show?", a: "Click the edit icon next to any show in your shows list." },
          { q: "What is Control Room?", a: "The Control Room is where you manage your live broadcast, chat with viewers, and pin products." },
          { q: "How can I create a Shoppable Video?", a: "Navigate to Shoppable Videos and click Create Shoppable Video. Upload your video and add products." },
        ]} />
      </DashboardCard>
    </div>
  );
}
