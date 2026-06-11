import {
  Home, Users, Bell, Settings, LogOut, Plus, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, Search, Filter, Download, Upload, Trash2, Edit3,
  Eye, EyeOff, Copy, Check, X, AlertCircle, Info, HelpCircle,
  Heart, Gift, Star, Cake, Calendar, Clock, Mail, Phone, Globe,
  Building2, User, UserPlus, UserCheck, UserX, Shield, Lock, Unlock,
  CreditCard, Wallet, TrendingUp, BarChart2, PieChart, Activity,
  Send, MessageSquare, Image, Paperclip, Smile, Mic,
  Share2, Link, ExternalLink, Tag, FileText, FolderOpen, Table, Grid, List,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RefreshCw,
  Zap, Award, Flag, Briefcase, BookOpen, Package, Store, ShoppingCart,
  MapPin, DollarSign, Percent, LayoutDashboard, Layers, Repeat,
} from 'lucide-react';

const ICONS = {
  Home, Users, Bell, Settings, LogOut, Plus,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Search, Filter, Download, Upload, Trash: Trash2, Edit: Edit3,
  Eye, EyeOff, Copy, Check, Close: X, X, AlertCircle, Info, HelpCircle,
  Heart, Gift, Star, Cake, Calendar, Clock, Mail, Phone, Globe,
  Building: Building2, User, UserPlus, UserCheck, UserX,
  Shield, Lock, Unlock,
  Card: CreditCard, Wallet, TrendingUp, BarChart: BarChart2, PieChart, Activity,
  Send, Message: MessageSquare, Image, Paperclip, Smile, Mic,
  Share: Share2, Link, ExternalLink, Tag,
  File: FileText, Folder: FolderOpen, Table, Grid, List,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Refresh: RefreshCw,
  Zap, Award, Flag, Briefcase, Book: BookOpen,
  Package, Store, Cart: ShoppingCart, MapPin,
  Dollar: DollarSign, Percent, Dashboard: LayoutDashboard, Layers, Repeat,
};

const SIZES = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, '2xl': 32 };

export default function Icon({ name, size = 'md', strokeWidth = 1.75, className = '', ...props }) {
  const Component = ICONS[name];
  if (!Component) return null;
  const px = typeof size === 'number' ? size : (SIZES[size] ?? 16);
  return <Component size={px} strokeWidth={strokeWidth} className={className} {...props} />;
}

export { ICONS };
