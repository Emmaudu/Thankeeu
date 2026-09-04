import {
  Home, Users, Bell, Settings, LogOut, Plus, Minus, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, Search, Filter, Download, Upload, Trash2, Edit3,
  Eye, EyeOff, Copy, Check, X, AlertCircle, Info, HelpCircle,
  Heart, Gift, Star, Cake, Calendar, Clock, Mail, Phone, Globe,
  Building2, User, UserPlus, UserCheck, UserX, Shield, Lock, Unlock,
  CreditCard, Wallet, TrendingUp, BarChart2, PieChart, Activity,
  Send, MessageSquare, Image, Paperclip, Smile, Mic,
  Share2, Link, ExternalLink, Tag, FileText, FolderOpen, Table, Grid, List,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RefreshCw,
  Zap, Award, Flag, Briefcase, BookOpen, Package, Store, ShoppingCart,
  MapPin, DollarSign, Percent, LayoutDashboard, Layers, Repeat, Camera,
  Sparkles, Wand2, MessageCircle, Smartphone, ShieldCheck, Banknote,
  Rocket, Target, Compass, Layout, MousePointerClick, HandHeart, Sticker,
  Lightbulb, Menu, PartyPopper, ThumbsUp, Quote,
  Twitter, Linkedin, Instagram, GraduationCap, Baby,
  Sun, Flower2, HeartPulse, Snowflake, Sunrise, ThumbsUp as ThumbsUpDup,
  TrendingDown, TrendingUp as TrendingUpIcon, LayoutGrid, Archive, AlertTriangle,
  Film, Loader2, Play, Video, Music, CheckCircle,
  Diamond, QrCode, Radio, HeartHandshake, Monitor, Presentation, PenLine, LogIn,
  Volume2, VolumeX, Images, Moon, Printer, Reply, Square,
} from 'lucide-react';

const ICONS = {
  Home, Users, Bell, Settings, LogOut, Plus, Minus,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Search, Filter, Download, Upload, Trash: Trash2, Trash2, Edit: Edit3,
  Eye, EyeOff, Copy, Check, Close: X, X, AlertCircle, Info, HelpCircle,
  Heart, Gift, Star, Cake, Calendar, Clock, Mail, Phone, Globe,
  Building: Building2, Building2, User, UserPlus, UserCheck, UserX,
  Shield, Lock, Unlock,
  Card: CreditCard, CreditCard, Wallet, TrendingUp, BarChart: BarChart2, BarChart2, PieChart, Activity,
  Send, Message: MessageSquare, MessageSquare, Image, Paperclip, Smile, Mic,
  Share: Share2, Share2, Link, ExternalLink, Tag,
  File: FileText, FileText, Folder: FolderOpen, Table, Grid, List,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Refresh: RefreshCw,
  // BookOpen was only registered under the alias "Book", so every caller asking
  // for "BookOpen" (the album/flipbook toggles) silently fell back to Sparkles.
  Zap, Award, Flag, Briefcase, Book: BookOpen, BookOpen,
  Package, Store, Cart: ShoppingCart, ShoppingCart, MapPin,
  Dollar: DollarSign, Percent, Dashboard: LayoutDashboard, LayoutDashboard, Layers, Repeat, Camera,
  Sparkles, Wand: Wand2, MessageCircle, Smartphone, ShieldCheck, Banknote,
  Rocket, Target, Compass, Layout, Click: MousePointerClick, HandHeart, Sticker,
  Lightbulb, Menu, Party: PartyPopper, PartyPopper, ThumbsUp, Quote,
  Twitter, Linkedin, Instagram, GraduationCap, Baby,
  Sun, Flower: Flower2, HeartPulse, Snowflake, Sunrise,
  TrendingDown, LayoutGrid, Archive, AlertTriangle,
  Film, Loader: Loader2, Play, Video, Music, CheckCircle,
  Diamond, QrCode, Radio, HeartHandshake, Monitor, Presentation, PenLine, LogIn,
  Volume2, VolumeX, Images, Moon, Printer, Reply, Square,
  // Semantic aliases used by data-driven navigation and dashboard cards.
  Billing: CreditCard,
  Event: Calendar,
  GL: BarChart2,
  Leader: Award,
  Member: User,
  Sync: RefreshCw,
  Team: Users,
};

const SIZES = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, '2xl': 32 };

export default function Icon({ name, size = 'md', strokeWidth = 1.75, className = '', ...props }) {
  // Never leave an unexplained blank where an icon was requested. Dynamic
  // dashboard data occasionally introduces a new semantic name; Sparkles is a
  // branded, standard SVG fallback until that name is explicitly registered.
  const Component = ICONS[name] || Sparkles;
  const px = typeof size === 'number' ? size : (SIZES[size] ?? 16);
  return <Component size={px} strokeWidth={strokeWidth} className={className} {...props} />;
}

export { ICONS };
