import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import ForumIcon from '@mui/icons-material/Forum';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../features/auth/context/AuthContext';
import { AiChatWidgetProvider } from '../features/ai-chat/context/AiChatWidgetContext';
import { AiChatWidget } from '../features/ai-chat/components/AiChatWidget';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const SUPER_ADMIN_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Users', path: '/users', icon: <PeopleIcon /> },
  { label: 'Communities', path: '/communities', icon: <GroupsIcon /> },
];

const COMMUNITY_ADMIN_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Members', path: '/members', icon: <PeopleIcon /> },
  { label: 'Chat', path: '/chat', icon: <ForumIcon /> },
  { label: 'Announcements', path: '/announcements', icon: <CampaignIcon /> },
];

export function AdminLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isSuperAdmin, isCommunityAdmin, activeCommunityId, setActiveCommunity, logout } = useAuth();
  const location = useLocation();

  const items = isSuperAdmin ? SUPER_ADMIN_ITEMS : COMMUNITY_ADMIN_ITEMS;
  const adminCommunities = user?.communities.filter((c) => c.role === 'COMMUNITY_ADMIN') ?? [];
  const activeCommunityName = adminCommunities.find((c) => c.communityId === activeCommunityId)?.communityName;

  const drawerContent = (
    <div>
      <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
        <Typography variant="h6" noWrap fontWeight={600}>
          Home Owners Hub
        </Typography>
        {!isSuperAdmin && activeCommunityName ? (
          <Typography variant="caption" color="text.secondary" noWrap>
            {activeCommunityName}
          </Typography>
        ) : null}
      </Toolbar>
      <Divider />
      <List>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {items.find((item) => location.pathname.startsWith(item.path))?.label ?? ''}
          </Typography>
          {!isSuperAdmin && adminCommunities.length > 1 ? (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={activeCommunityId ?? ''}
                onChange={(e) => setActiveCommunity(e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                {adminCommunities.map((c) => (
                  <MenuItem key={c.communityId} value={c.communityId}>{c.communityName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <IconButton color="inherit" onClick={logout} aria-label="Log out">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      <AiChatWidgetProvider>
        <AiChatWidget />
      </AiChatWidgetProvider>
    </Box>
  );
}
