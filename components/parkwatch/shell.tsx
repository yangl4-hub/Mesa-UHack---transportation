'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Camera, CarFront, ChevronRight, CircleParking, FlaskConical, GraduationCap, LayoutDashboard, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useParking } from './provider';
import { ParkingAssistant } from './assistant';

const navigation = [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }, { href: '/lots', label: 'Parking Lots', icon: CircleParking }, { href: '/vehicle', label: 'My Vehicle', icon: CarFront }, { href: '/security', label: 'Security', icon: ShieldCheck }, { href: '/camera', label: 'AI Camera', icon: Camera }];

function Navigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { alerts } = useParking();
  const unread = alerts.filter(alert => !alert.read).length;
  return <Sidebar className="pw-sidebar">
    <SidebarHeader className="brand-header"><Link href="/" className="brand" onClick={() => setOpenMobile(false)}><span className="brand-symbol">P<span /></span><span>ParkWatch<span className="brand-sub">CAMPUS, CONNECTED.</span></span></Link></SidebarHeader>
    <SidebarContent className="sidebar-body"><div className="nav-caption">WORKSPACE</div><SidebarMenu>{navigation.map(({ href, label, icon: Icon }) => <SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={pathname === href} className="pw-nav"><Link href={href} onClick={() => setOpenMobile(false)} aria-current={pathname === href ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{href === '/security' && unread > 0 && <span className="nav-count">{unread}</span>}{pathname === href && <span className="active-marker" />}</Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
      <div className="sidebar-campus"><div className="campus-icon"><GraduationCap size={22} /></div><div><strong>Skyline College</strong><span>San Bruno, California</span></div></div>
    </SidebarContent>
    <SidebarFooter className="sidebar-bottom"><div className="demo-note"><FlaskConical size={18} /><div><strong>Hackathon demo</strong><p>Simulated data. Real possibilities.</p></div></div><div className="sidebar-profile"><span className="avatar">S</span><div><strong>Student workspace</strong><span>No sign-in needed</span></div><ShieldCheck size={18} /></div></SidebarFooter>
  </Sidebar>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { alerts, error, refresh } = useParking();
  const title = navigation.find(item => item.href === pathname)?.label || 'ParkWatch';
  return <SidebarProvider style={{ '--sidebar-width': '240px' } as React.CSSProperties}><Navigation /><SidebarInset className="workspace"><header className="topbar"><div className="breadcrumb"><SidebarTrigger className="mobile-menu" /><span>Workspace</span><ChevronRight size={14} /><strong>{title}</strong></div><div className="topbar-right"><span className="connection"><Wifi size={15} /> Demo connected</span><Link className="notification-button" href="/security" aria-label={`Security notifications, ${alerts.filter(a => !a.read).length} unread`}><Bell size={20} />{alerts.some(a => !a.read) && <i />}</Link><span className="avatar small">S</span></div></header><main id="main" className="page-content">{error && <div className="error-banner" role="alert">{error}<button onClick={refresh}>Try again</button></div>}{children}<footer className="page-footer"><span><MapPin size={13} /> Skyline layout · Simulated spaces & walk times</span><span>ParkWatch <span className="footer-divider">/</span> Built for a better campus</span></footer></main></SidebarInset><ParkingAssistant /><Toaster position="top-right" richColors closeButton /></SidebarProvider>;
}
