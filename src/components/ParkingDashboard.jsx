import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  Grid,
  Card,
  CardContent,
  Badge,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  SvgIcon,
  Chip,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Fade,
  Grow,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  DirectionsCar,
  LocalParking,
  Payment,
  Timer,
  Brightness4,
  Brightness7,
  Assessment,
  History
} from '@mui/icons-material';
import './ParkingDashboard.css';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '24px' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Update the SPLogo component
const SPLogo = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M3 3h7c3.31 0 6 2.69 6 6s-2.69 6-6 6H6v6H3V3zm7 9c1.66 0 3-1.34 3-3s-1.34-3-3-3H6v6h4z"/>
  </SvgIcon>
);

// Add this helper function at the top of the component
const generateTimeLabels = () => {
  const labels = [];
  for (let i = 0; i < 24; i++) {
    labels.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      count: 0
    });
  }
  return labels;
};

// Add this helper function to calculate parking fee
const calculateParkingFee = (duration) => {
  const hours = duration / (1000 * 60 * 60);
  const rate = 10; // ฿10 per hour
  return Math.ceil(hours) * rate;
};

// Add these helper functions
const calculateAverageDuration = (slotId) => {
  const slotHistory = detailedParkingHistory.filter(h => h.slotId === slotId && h.duration);
  if (slotHistory.length === 0) return '0m';
  const avgDuration = slotHistory.reduce((acc, curr) => acc + curr.duration, 0) / slotHistory.length;
  const minutes = Math.floor(avgDuration / (1000 * 60));
  return `${minutes}m`;
};

const calculatePeakHours = () => {
  const peakHour = parkingActivity.reduce((max, curr) => 
    curr.count > max.count ? curr : max
  , parkingActivity[0]);
  return `${peakHour.time} (${peakHour.count} cars)`;
};

const calculateUptime = () => {
  // This is a placeholder - you would typically track actual system uptime
  return '99.9%';
};

const ParkingDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [totalEarningsHistory, setTotalEarningsHistory] = useState(0);
  const [parkingSlots, setParkingSlots] = useState(Array(16).fill().map((_, index) => ({
    id: index + 1,
    isOccupied: false,
    vehicle: null,
    entryTime: null,
    payment: 0,
    totalSlotEarnings: 0
  })));
  const [parkingHistory, setParkingHistory] = useState([]);
  const [parkingActivity, setParkingActivity] = useState(generateTimeLabels());
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Sun', cars: 0, dailyTotal: 0 },
    { day: 'Mon', cars: 0, dailyTotal: 0 },
    { day: 'Tue', cars: 0, dailyTotal: 0 },
    { day: 'Wed', cars: 0, dailyTotal: 0 },
    { day: 'Thu', cars: 0, dailyTotal: 0 },
    { day: 'Fri', cars: 0, dailyTotal: 0 },
    { day: 'Sat', cars: 0, dailyTotal: 0 }
  ]);
  const [dailyParkingTime, setDailyParkingTime] = useState(0);
  const [dailyEntries, setDailyEntries] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [prevOccupiedCount, setPrevOccupiedCount] = useState(0);
  const [detailedParkingHistory, setDetailedParkingHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authData, setAuthData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [authError, setAuthError] = useState('');
  const [parkingDurations, setParkingDurations] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const theme = createTheme({
    typography: {
      fontFamily: '"Orbitron", sans-serif',
      h6: { fontWeight: 600 },
      h3: { fontWeight: 700 },
      body2: { fontFamily: '"Roboto Mono", monospace' }
    },
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#1976d2' : '#2196f3',
      },
      background: {
        default: darkMode ? '#1a1f2c' : '#f5f5f5',
        paper: darkMode ? '#242a38' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#2c3e50',
        secondary: darkMode ? '#90caf9' : '#64b5f6',
      }
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: '#1976d2',
            boxShadow: 'none',
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: '#242a38',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSlotClick = (slotId) => {
    setParkingSlots(prevSlots => {
      const currentOccupiedCount = prevSlots.filter(s => s.isOccupied).length;
      const dayIndex = new Date().getDay();
      const currentHour = new Date().getHours();
      const currentTime = new Date();

      return prevSlots.map(slot => {
        if (slot.id === slotId) {
          if (!slot.isOccupied) {
            // Entry logic
            setDetailedParkingHistory(prev => [...prev, {
              slotId,
              entryTime: currentTime,
              exitTime: null,
              duration: null,
              status: 'Parked',
              payment: null
            }]);
            setWeeklyData(prevWeekly => {
              const newData = [...prevWeekly];
              if (currentOccupiedCount < 16) {
                newData[dayIndex] = {
                  ...newData[dayIndex],
                  cars: currentOccupiedCount + 1,
                  dailyTotal: prevWeekly[dayIndex].dailyTotal + 1
                };
              }
              return newData;
            });

            // Update parking activity
            setParkingActivity(prev => {
              const newActivity = [...prev];
              const newCount = currentOccupiedCount + 1;
              newActivity[currentHour] = {
                time: `${currentHour.toString().padStart(2, '0')}:00`,
                count: Math.max(newCount, prev[currentHour].count)
              };
              return newActivity;
            });

            return {
              ...slot,
              isOccupied: true,
              vehicle: 'Car',
              entryTime: currentTime,
              payment: 0
            };
          } else {
            // Exit logic
            const parkingDuration = currentTime - new Date(slot.entryTime);
            const hours = Math.ceil(parkingDuration / (1000 * 60 * 60));
            const payment = hours <= 1 ? 10 : 10 + (hours - 1) * 20;

            setDetailedParkingHistory(prev => {
              const updatedHistory = prev.map(record => {
                if (record.slotId === slotId && !record.exitTime) {
                  return {
                    ...record,
                    exitTime: currentTime,
                    duration: parkingDuration,
                    status: 'Completed',
                    payment
                  };
                }
                return record;
              });
              return updatedHistory;
            });
            setWeeklyData(prev => {
              const newData = [...prev];
              newData[dayIndex] = {
                ...newData[dayIndex],
                cars: currentOccupiedCount - 1,
              };
              return newData;
            });

            setDailyParkingTime(prev => prev + parkingDuration);

            const newTotalSlotEarnings = slot.totalSlotEarnings + payment;
            setTotalEarningsHistory(prev => prev + payment);

            return {
              ...slot,
              isOccupied: false,
              vehicle: null,
              entryTime: null,
              payment: payment,
              totalSlotEarnings: newTotalSlotEarnings
            };
          }
        }
        return slot;
      });
    });
  };

  // Helper function to count occupied slots
  const countOccupiedSlots = () => {
    return parkingSlots.filter(slot => slot.isOccupied).length;
  };

  // Calculate dashboard statistics
  const occupiedSlots = parkingSlots.filter(slot => slot.isOccupied).length;
  const availableSlots = parkingSlots.length - occupiedSlots;
  const totalEarnings = totalEarningsHistory;
  const averageOccupancyTime = parkingSlots
    .filter(slot => slot.isOccupied)
    .reduce((sum, slot) => {
      const duration = new Date() - new Date(slot.entryTime);
      return sum + duration;
    }, 0) / (occupiedSlots || 1);

  // Add parking event to history when slots change
  useEffect(() => {
    const timestamp = new Date();
    setParkingHistory(prev => [...prev, {
      time: timestamp.toLocaleTimeString(),
      occupied: occupiedSlots,
      available: availableSlots
    }].slice(-8)); // Keep last 8 records
  }, [occupiedSlots, availableSlots]);

  // Calculate occupancy percentage
  const occupancyPercentage = (occupiedSlots / parkingSlots.length) * 100;

  // Update the chart colors to be theme-aware
  const chartColors = {
    available: darkMode ? '#64ffda' : '#81c784',    // Green
    occupied: darkMode ? '#ff4081' : '#e57373',     // Red
    total: darkMode ? '#90caf9' : '#2196f3',        // Blue
    accent: darkMode ? '#ffab40' : '#ff9800',       // Orange
    background: darkMode ? '#242a38' : '#ffffff',   // Card background
    grid: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Grid lines
  };

  // Update the pie chart data
  const pieData = [
    { name: 'Occupied', value: occupiedSlots, color: chartColors.occupied },
    { name: 'Available', value: availableSlots, color: chartColors.available }
  ];

  // Update the chart card styles
  const styles = {
    chartCard: {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      '& .recharts-cartesian-grid-horizontal line, & .recharts-cartesian-grid-vertical line': {
        stroke: chartColors.grid,
      },
      '& .recharts-text': {
        fill: theme.palette.text.primary,
      }
    },
  };

  // Update the tooltip style
  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    padding: '10px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '4px',
    color: theme.palette.text.primary
  };

  // Add this effect to handle theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Add a reset function for midnight
  useEffect(() => {
    const resetDailyCounters = () => {
      const dayIndex = new Date().getDay();
      setWeeklyData(prev => {
        const newData = [...prev];
        newData[dayIndex] = {
          ...newData[dayIndex],
          dailyTotal: newData[dayIndex].dailyTotal // Keep the existing total
        };
        return newData;
      });
    };

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;

    const timer = setTimeout(resetDailyCounters, timeUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Add useEffect to update the timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setParkingDurations(prevDurations => {
        const newDurations = { ...prevDurations };
        parkingSlots.forEach(slot => {
          if (slot.isOccupied && slot.entryTime) {
            const duration = Date.now() - new Date(slot.entryTime).getTime();
            newDurations[slot.id] = duration;
          }
        });
        return newDurations;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [parkingSlots]);

  // Helper function to format duration
  const formatDuration = (duration) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add new History tab component
  const ParkingHistory = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parking History
        </Typography>
        <Card sx={{ mt: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: theme.palette.background.paper
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <th style={{ padding: 16 }}>Slot</th>
                  <th style={{ padding: 16 }}>Entry Time</th>
                  <th style={{ padding: 16 }}>Exit Time</th>
                  <th style={{ padding: 16 }}>Duration</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {detailedParkingHistory.map((record, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      backgroundColor: record.status === 'Parked' 
                        ? theme.palette.action.hover 
                        : 'transparent'
                    }}
                  >
                    <td style={{ padding: 16, textAlign: 'center' }}>
                      {record.slotId}
                    </td>
                    <td style={{ padding: 16 }}>
                      {new Date(record.entryTime).toLocaleString()}
                    </td>
                    <td style={{ padding: 16 }}>
                      {record.exitTime 
                        ? new Date(record.exitTime).toLocaleString()
                        : '-'
                      }
                    </td>
                    <td style={{ padding: 16 }}>
                      {record.duration 
                        ? `${Math.floor(record.duration / (1000 * 60 * 60))}h ${Math.floor((record.duration % (1000 * 60 * 60)) / (1000 * 60))}m`
                        : 'In Progress'
                      }
                    </td>
                    <td style={{ padding: 16 }}>
                      <Chip 
                        label={record.status}
                        color={record.status === 'Parked' ? 'primary' : 'success'}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: 16 }}>
                      {record.payment ? `฿${record.payment}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Card>
      </Box>
    );
  };

  // Update the AuthDialog component
  const AuthDialog = ({ open, onClose }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Check for admin credentials
      if (authData.phone === '0000' && authData.password === '0000') {
        setIsAdmin(true);
        setIsLoggedIn(true);
        onClose();
        return;
      }

      // Regular user validation
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(authData.phone)) {
        setAuthError('Phone number must be 10 digits and start with 0');
        return;
      }

      if (!/^\d{4}$/.test(authData.password)) {
        setAuthError('Password must be exactly 4 digits');
        return;
      }

      if (authMode === 'register') {
        if (authData.password !== authData.confirmPassword) {
          setAuthError('Passwords do not match');
          return;
        }
      }

      setIsLoggedIn(true);
      setIsAdmin(false);  // Regular users are not admins
      onClose();
    };

    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        TransitionProps={{
          timeout: 300  // Add smooth transition for dialog
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={authMode === 'login' ? 0 : 1}
            onChange={(e, newValue) => {
              // Don't reset form data immediately
              setAuthMode(newValue === 0 ? 'login' : 'register');
              setAuthError('');
            }}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                transition: 'all 0.3s ease'  // Smooth tab indicator transition
              }
            }}
          >
            <Tab 
              label="Login" 
              sx={{ 
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  transition: 'all 0.3s ease'
                }
              }}
            />
            <Tab 
              label="Register" 
              sx={{ 
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  transition: 'all 0.3s ease'
                }
              }}
            />
          </Tabs>
        </Box>

        <DialogContent>
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 2,
              transition: 'all 0.3s ease',  // Smooth form transition
              opacity: 1  // Maintain opacity
            }}
          >
            {authMode === 'register' && (
              <Fade in={true} timeout={300}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Please register with:
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      <li>Your phone number (starts with 0, 10 digits)</li>
                      <li>A 4-digit PIN for your password</li>
                    </ul>
                  </Typography>
                </Alert>
              </Fade>
            )}

            <TextField
              fullWidth
              label="Phone Number"
              value={authData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setAuthData(prev => ({ ...prev, phone: value }));
              }}
              margin="normal"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              sx={{ transition: 'all 0.3s ease' }}  // Smooth field transition
            />

            <TextField
              fullWidth
              label="Password"
              value={authData.password}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setAuthData(prev => ({ ...prev, password: value }));
              }}
              margin="normal"
              type="password"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              sx={{ transition: 'all 0.3s ease' }}  // Smooth field transition
            />

            <Fade in={authMode === 'register'} timeout={300}>
              <Box sx={{ height: authMode === 'register' ? 'auto' : 0, overflow: 'hidden' }}>
                {authMode === 'register' && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    value={authData.confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setAuthData(prev => ({ ...prev, confirmPassword: value }));
                    }}
                    margin="normal"
                    type="password"
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
                    sx={{ transition: 'all 0.3s ease' }}  // Smooth field transition
                  />
                )}
              </Box>
            </Fade>

            {authError && (
              <Fade in={!!authError} timeout={300}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {authError}
                </Alert>
              </Fade>
            )}

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ 
                mt: 3,
                transition: 'all 0.3s ease'  // Smooth button transition
              }}
            >
              {authMode === 'login' ? 'Login' : 'Register'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  // First, let's modify how we get today's total cars
  const getTodaysCars = () => {
    const today = new Date().getDay();  // 0-6 for Sun-Sat
    const todayData = weeklyData[today];
    return todayData.dailyTotal;  // Use dailyTotal instead of cars
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ 
          backgroundColor: '#1976d2', // Changed to blue
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              '&::before': {
                content: '"🚗"',  // Add car emoji
                fontSize: '24px'
              }
            }}>
              Parking Dashboard
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {isLoggedIn ? (
              <Button 
                color="inherit" 
                onClick={() => {
                  setIsLoggedIn(false);
                  setIsAdmin(false);
                  setCurrentTab(0);  // Return to first tab when logging out
                }}
                sx={{ mr: 2 }}
              >
                Logout
              </Button>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => setShowAuthDialog(true)}
                sx={{ mr: 2 }}
              >
                Login / Register
              </Button>
            )}
            <IconButton 
              onClick={() => setDarkMode(!darkMode)}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                transition: 'all 0.3s ease',
                transform: darkMode ? 'rotate(180deg)' : 'rotate(0)',
              }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flex: 1 }}>
          <Box sx={{ 
            borderRight: 1, 
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1f2c' : '#f8fafc',
            minHeight: '100vh',
            width: 220  // Fixed width
          }}>
            <Tabs
              orientation="vertical"
              value={currentTab}
              onChange={(e, newValue) => {
                // Prevent access to Dashboard tab (index 1) if not admin
                if (newValue === 1 && !isAdmin) {
                  setAuthError('Please login as admin to access the Dashboard');
                  setShowAuthDialog(true);
                  return;
                }
                handleTabChange(e, newValue);
              }}
              sx={{
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: '4px',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: theme.palette.mode === 'dark' ? '#64ffda' : '#1976d2',
                },
                '& .MuiTab-root': {
                  minHeight: 60,
                  padding: '12px 24px',
                  justifyContent: 'flex-start',
                  borderLeft: '4px solid transparent',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.04)',
                    color: theme.palette.text.primary,
                  },
                  '&.Mui-selected': {
                    color: theme.palette.mode === 'dark' ? '#64ffda' : '#1976d2',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(100, 255, 218, 0.1)' 
                      : 'rgba(25, 118, 210, 0.1)',
                  },
                  '&::before': {
                    marginRight: '8px',
                    fontSize: '20px'
                  }
                },
                '& .MuiTab-root .MuiSvgIcon-root': {
                  marginRight: '12px',
                  fontSize: '20px',
                },
              }}
            >
              <Tab 
                label="Parking Dashboard"
                sx={{ 
                  minWidth: '200px', 
                  alignItems: 'center',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&::before': {
                    content: '"🅿️"'  // Parking emoji
                  }
                }} 
              />
              <Tab 
                label="Dashboard"
                disabled={!isAdmin}  // Disable tab for non-admins
                sx={{ 
                  minWidth: '200px', 
                  alignItems: 'center',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  opacity: !isAdmin ? 0.5 : 1,  // Dim the tab if not admin
                  '&::before': {
                    content: '"📊"'
                  }
                }} 
              />
              <Tab 
                label="History"
                sx={{ 
                  minWidth: '200px', 
                  alignItems: 'center',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&::before': {
                    content: '"📅"'  // Calendar emoji
                  }
                }} 
              />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1 }}>
            <TabPanel value={currentTab} index={0}>
              <Fade in={true} timeout={1000}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: '24px',
                  padding: '16px',
                  maxWidth: '1400px',
                  margin: '0 auto',
                  pl: '0px',
                }}>
                  {/* Parking Grid with staggered animation */}
                  <div className="parking-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    maxWidth: '900px',
                    aspectRatio: '1/1',
                    marginLeft: '0',
                    paddingLeft: '0',
                  }}>
                    {parkingSlots.map((slot, index) => (
                      <Grow 
                        in={true} 
                        timeout={1000 + (index * 100)}  // Staggered animation
                        key={slot.id}
                      >
                        <Paper
                          className={`parking-slot ${slot.isOccupied ? 'occupied' : 'available'}`}
                          elevation={3}
                          onClick={() => handleSlotClick(slot.id)}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            aspectRatio: '1/1',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            backgroundColor: slot.isOccupied ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                            border: `2px solid ${slot.isOccupied ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)'}`,
                            minWidth: '200px',  // Set minimum width
                            minHeight: '200px',  // Set minimum height
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[6],
                              backgroundColor: slot.isOccupied ? 'rgba(255, 0, 0, 0.15)' : 'rgba(0, 255, 0, 0.15)',
                            },
                            animation: `pulse 2s infinite ${index * 0.1}s`,  // Add pulse animation
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(1)',
                              },
                              '50%': {
                                transform: 'scale(1.02)',
                              },
                              '100%': {
                                transform: 'scale(1)',
                              },
                            },
                          }}
                        >
                          <Typography 
                            variant="h2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: slot.isOccupied ? 'error.main' : 'success.main',
                              fontSize: '4rem'  // Increased font size
                            }}
                          >
                            {slot.id}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: slot.isOccupied ? 'error.main' : 'success.main',
                              mt: 1,
                              fontSize: '1.2rem'  // Slightly larger text
                            }}
                          >
                            {slot.isOccupied ? 'Occupied' : 'Available'}
                          </Typography>
                          {slot.isOccupied && (
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              gap: 0.5 
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'error.main',
                                  fontSize: '1rem',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {new Date(slot.entryTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'error.main',
                                  fontSize: '1rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold'
                                }}
                              >
                                {formatDuration(parkingDurations[slot.id] || 0)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'error.main',
                                  fontSize: '1.1rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold',
                                  mt: 0.5,
                                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px'
                                }}
                              >
                                ฿{calculateParkingFee(parkingDurations[slot.id] || 0)}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grow>
                    ))}
                  </div>

                  {/* Right side charts with slide-in animation */}
                  <Fade 
                    in={true} 
                    timeout={1500}
                    style={{ 
                      transitionDelay: '500ms',
                      transform: 'translateX(20px)',
                      animation: 'slideIn 1s forwards'
                    }}
                  >
                    <Box sx={{ 
                      width: '500px',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '32px',
                      ml: 'auto',
                      '@keyframes slideIn': {
                        from: {
                          opacity: 0,
                          transform: 'translateX(20px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                      },
                    }}>
                      {/* Current Occupancy Chart */}
                      <Card sx={{ ...styles.chartCard, height: '400px' }}>  {/* Increased height */}
                        <CardContent sx={{ p: 2.5 }}>  {/* Increased padding */}
                          <Typography variant="h6" gutterBottom>  {/* Larger title */}
                            Current Occupancy
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={320}>  {/* Increased height */}
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={80}  // Increased radius
                                  outerRadius={120}  // Increased radius
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div style={{
                                          ...tooltipStyle,
                                          padding: '10px 15px',  // Increased padding
                                          fontSize: '1.1rem'     // Larger font
                                        }}>
                                          <p>{`${data.name}: ${data.value}`}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '1.1rem' }} />  {/* Larger legend text */}
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Maximum Parking Activity Chart */}
                      <Card sx={{ ...styles.chartCard, height: '400px' }}>  {/* Increased height */}
                        <CardContent sx={{ p: 2.5 }}>  {/* Increased padding */}
                          <Typography variant="h6" gutterBottom>  {/* Larger title */}
                            Maximum Parking Activity Today
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={320}>  {/* Increased height */}
                              <BarChart data={parkingActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="time"
                                  tick={{ fontSize: 12 }}
                                  interval={1}  // Show all hour labels
                                  angle={-45}   // Angle the labels
                                  textAnchor="end"
                                  height={60}   // More space for labels
                                />
                                <YAxis 
                                  domain={[0, 16]}
                                  ticks={[0, 4, 8, 12, 16]}
                                  label={{ 
                                    value: 'Cars Parked', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fontSize: '1.1rem' }  // Larger axis label
                                  }}
                                  tick={{ fontSize: 12 }}  // Larger tick labels
                                />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div style={{
                                          ...tooltipStyle,
                                          padding: '10px 15px',  // Increased padding
                                          fontSize: '1.1rem'     // Larger font
                                        }}>
                                          <p>{`Time: ${data.time}`}</p>
                                          <p>{`Max Cars: ${data.count}`}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar 
                                  dataKey="count"
                                  name="Cars Parked"
                                  fill={chartColors.accent}
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={40}  // Wider bars
                                >
                                  {parkingActivity.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.count > 12 ? chartColors.occupied : 
                                        entry.count > 8 ? chartColors.accent : 
                                        chartColors.available
                                      }
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Fade>
                </Box>
              </Fade>

              {/* Weekly Overview with fade up animation */}
              <Fade 
                in={true} 
                timeout={2000}
                style={{ 
                  transitionDelay: '1000ms',
                  transform: 'translateY(20px)',
                  animation: 'fadeUp 1s forwards'
                }}
              >
                <Grid 
                  container 
                  spacing={1.5}
                  sx={{ 
                    maxWidth: '1400px',
                    margin: '20px auto',
                    padding: '16px',
                    '@keyframes fadeUp': {
                      from: {
                        opacity: 0,
                        transform: 'translateY(20px)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                  }}
                >
                  <Grid item xs={12}>
                    <Card sx={{ ...styles.chartCard, height: '350px' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Weekly Parking Overview
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <ResponsiveContainer width="100%" height={290}>
                            <BarChart data={weeklyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="day"
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis
                                domain={[0, 100]}
                                ticks={[0, 20, 40, 60, 80, 100]}
                                tickFormatter={(value) => value}
                                label={{ 
                                  value: 'Total Cars', 
                                  angle: -90, 
                                  position: 'insideLeft',
                                  style: { textAnchor: 'middle' }
                                }}
                              />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div style={tooltipStyle}>
                                        <p>{`${label}`}</p>
                                        <p>{`Cars Today: ${data.dailyTotal}`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="dailyTotal"
                                name="Cars Today"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                              >
                                {weeklyData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      entry.day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]
                                        ? chartColors.accent
                                        : chartColors.total
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <Grid 
                container 
                spacing={1.5}
                sx={{ 
                  maxWidth: '1000px',
                  margin: '0 auto',
                  padding: '16px'
                }}
              >
                {/* Keep only the stat cards in the Dashboard tab */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card className="dashboard-card available" sx={{ minHeight: '120px' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Slots
                      </Typography>
                      <Typography variant="h5">{availableSlots}</Typography>
                      <DirectionsCar sx={{ fontSize: 28 }} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="dashboard-card total" sx={{ minHeight: '120px' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Total Cars Today
                      </Typography>
                      <Typography variant="h5">{getTodaysCars()}</Typography>
                      <DirectionsCar sx={{ fontSize: 28 }} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="dashboard-card earnings" sx={{ minHeight: '120px' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Total Earnings
                      </Typography>
                      <Typography variant="h5">฿{totalEarnings}</Typography>
                      <Payment sx={{ fontSize: 28 }} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card className="dashboard-card time" sx={{ minHeight: '120px' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Total Parking Time
                      </Typography>
                      <Typography variant="h5">
                        {Math.floor(dailyParkingTime / (1000 * 60 * 60))}h{' '}
                        {Math.floor((dailyParkingTime % (1000 * 60 * 60)) / (1000 * 60))}m
                      </Typography>
                      <Timer sx={{ fontSize: 28 }} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <ParkingHistory />
            </TabPanel>
          </Box>
        </Box>

        {/* Add AuthDialog */}
        <AuthDialog 
          open={showAuthDialog} 
          onClose={() => {
            setShowAuthDialog(false);
            setAuthMode('login');
            setAuthData({ phone: '', password: '', confirmPassword: '' });
          }}
        />
      </Box>
    </ThemeProvider>
  );
};

export default ParkingDashboard; 