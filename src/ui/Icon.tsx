/**
 * Icon system — curated Lucide subset, stroke-based, 2px stroke, round caps.
 * Names follow the design system's kebab-case vocabulary (Icon.jsx handoff).
 */
import {
  ArrowRight, ArrowUpRight, Bell, Briefcase, Calendar, Camera, ChartNoAxesColumn,
  Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Ellipsis, FileText, Flame,
  Globe, Heart, Home, Languages, Lock, LockOpen, Map, MapPin, Mic, Moon, Mountain,
  Package, Pause, Pencil, Phone, Plane, Play, Plus, RotateCcw, Search, Settings,
  Share2, SkipForward, Square, Star, Sun, ThumbsDown, ThumbsUp, Trash2, User,
  Wallet, X, Zap,
} from 'lucide-react-native';
import React from 'react';

const MAP = {
  'home': Home,
  'bar-chart': ChartNoAxesColumn,
  'zap': Zap,
  'map': Map,
  'map-pin': MapPin,
  'wallet': Wallet,
  'lock': Lock,
  'lock-open': LockOpen,
  'plus': Plus,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'bell': Bell,
  'heart': Heart,
  'check': Check,
  'plane': Plane,
  'briefcase': Briefcase,
  'package': Package,
  'calendar': Calendar,
  'clock': Clock,
  'flame': Flame,
  'mountain': Mountain,
  'file-text': FileText,
  'share': Share2,
  'camera': Camera,
  'search': Search,
  'user': User,
  'star': Star,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  'more-horizontal': Ellipsis,
  'x': X,
  'moon': Moon,
  'sun': Sun,
  'settings': Settings,
  'trash': Trash2,
  'mic': Mic,
  'play': Play,
  'pause': Pause,
  'square': Square,
  'rotate-ccw': RotateCcw,
  'skip-forward': SkipForward,
  'pencil': Pencil,
  'phone': Phone,
  'languages': Languages,
  'globe': Globe,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 24,
  color = '#101012',
  strokeWidth = 2,
}: {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Cmp = MAP[name as IconName] ?? Zap;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
