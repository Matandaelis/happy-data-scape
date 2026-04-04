import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { OverviewPage } from "@/components/pages/OverviewPage";
import { ShowsPage } from "@/components/pages/ShowsPage";
import { VideosPage } from "@/components/pages/VideosPage";
import { ControlRoomPage } from "@/components/pages/ControlRoomPage";
import {
  PlaylistsPage,
  HostsPage,
  SettingsStorePage,
  SettingsBrandingPage,
  SettingsNotifsPage,
  SimulcastPage,
  IntegrationsPage,
  HelpPage,
} from "@/components/pages/OtherPages";

function PageRouter({ active, setActive }: { active: string; setActive: (k: string) => void }) {
  const pages: Record<string, React.ReactNode> = {
    overview: <OverviewPage onNavigate={setActive} />,
    shows: <ShowsPage onControlRoom={() => setActive("control-room")} />,
    videos: <VideosPage />,
    playlists: <PlaylistsPage />,
    hosts: <HostsPage />,
    "settings-store": <SettingsStorePage />,
    "settings-branding": <SettingsBrandingPage />,
    "settings-notifs": <SettingsNotifsPage />,
    simulcast: <SimulcastPage />,
    integrations: <IntegrationsPage />,
    help: <HelpPage />,
    "control-room": <ControlRoomPage />,
  };
  return <>{pages[active] || <OverviewPage onNavigate={setActive} />}</>;
}

const Index = () => {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar active={active} setActive={setActive} />
      <TopBar onNavigate={setActive} />
      <main className="ml-[228px] pt-14 min-h-screen">
        <div className="max-w-[860px] mx-auto py-7 px-8">
          <PageRouter active={active} setActive={setActive} />
        </div>
      </main>
    </div>
  );
};

export default Index;
