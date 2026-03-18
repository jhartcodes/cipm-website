/**
 * Sanity TypeScript Type Definitions
 *
 * These types represent the Sanity schema structure.
 * Update these as your schema evolves.
 */

import type { SanityImageSource } from "@sanity/image-url";

// ============================================
// Core Sanity Types
// ============================================

export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface SanitySlug {
  current: string;
  _type: "slug";
}

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  caption?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface SanityReference {
  _type: "reference";
  _ref: string;
}

// ============================================
// Portable Text Types
// ============================================

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  style?: "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "blockquote";
  listItem?: "bullet" | "number";
  level?: number;
  children: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
}

export interface PortableTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}

export interface PortableTextMarkDef {
  _type: string;
  _key: string;
  [key: string]: any;
}

export interface PortableTextLink extends PortableTextMarkDef {
  _type: "link";
  href?: string;
  linkType?: "internal" | "external";
  externalUrl?: string;
  internalPage?: SanityReference;
  blank?: boolean;
  openInNewTab?: boolean;
}

export type PortableTextContent = (PortableTextBlock | SanityImage)[];

// ============================================
// Link Types
// ============================================

export interface InternalLink {
  _type: string;
  slug?: SanitySlug;
}

export interface LinkObject {
  linkType: "internal" | "external";
  externalUrl?: string;
  internalPage?: InternalLink;
  internalLink?: InternalLink;
}

// ============================================
// SEO Types
// ============================================

export interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImage;
  noIndex?: boolean;
}

// ============================================
// Site Settings
// ============================================

export interface SiteSettings extends SanityDocument {
  _type: "siteSettings";
  siteName?: string;
  siteDescription?: string;
  defaultOgImage?: SanityImage;
}

// ============================================
// Navigation Types
// ============================================

export interface MenuItem {
  _key: string;
  title: string;
  linkType: "internal" | "external";
  externalUrl?: string;
  internalPage?: InternalLink;
}

export interface NavigationData {
  menuItems: MenuItem[];
  showCtaButton?: boolean;
  ctaText?: string;
  ctaLink?: LinkObject;
}

// ============================================
// Hero Types
// ============================================

export interface HeroSection {
  heading?: string;
  subheading?: string;
}

// ============================================
// Content Types
// ============================================

export interface Category extends SanityDocument {
  _type: "category";
  title?: string;
  slug?: SanitySlug;
  color?: string;
  description?: string;
}

export interface BlogPost extends SanityDocument {
  _type: "blogPost";
  title?: string;
  slug?: SanitySlug;
  excerpt?: string;
  featuredImage?: SanityImage;
  category?: Category;
  publishedAt?: string;
  author?: string;
  showAuthor?: boolean;
  content?: PortableTextContent;
  seo?: SeoData;
}

export interface Service extends SanityDocument {
  _type: "service";
  title?: string;
  slug?: SanitySlug;
  shortDescription?: string;
  bulletPoints?: string[];
  image?: SanityImage;
  enableDetailPage?: boolean;
  content?: PortableTextContent;
}

export interface PropertyType {
  _key?: string;
  title?: string;
  slug?: { current: string };
  image?: SanityImage;
  shortDescription?: string;
  enableDetailPage?: boolean;
}

export interface TeamMember {
  _key: string;
  name?: string;
  title?: string;
  headshot?: SanityImage;
  bio?: string;
  linkedinUrl?: string;
}

export interface Testimonial {
  _key: string;
  quote?: string;
  authorName?: string;
  authorTitle?: string;
}

export interface FaqItem {
  _key: string;
  question?: string | PortableTextContent;
  answer?: string | PortableTextContent;
}

export interface AboutRichTextSection {
  _key: string;
  _type: "aboutRichTextSection";
  eyebrow?: string;
  headline?: string;
  content?: PortableTextContent;
  layout?: "centered" | "twoColumn";
  background?: "white" | "gray";
}

export interface AboutSidebarSection {
  _key: string;
  _type: "aboutSidebarSection";
  headline?: string;
  content?: PortableTextContent;
  sidebar?: {
    title?: string;
    content?: PortableTextContent;
  };
  image?: SanityImage;
  imagePosition?: "sidebar" | "full-width" | "inline";
  background?: "white" | "gray";
}

export interface AboutSplitImageSection {
  _key: string;
  _type: "aboutSplitImageSection";
  headline?: string;
  content?: PortableTextContent;
  image?: SanityImage;
  imageSide?: "left" | "right";
  background?: "white" | "gray";
}

export interface AboutFeatureListSectionItem {
  _key?: string;
  title?: string;
  description?: string;
}

export interface AboutFeatureListSection {
  _key: string;
  _type: "aboutFeatureListSection";
  headline?: string;
  intro?: PortableTextContent;
  items?: AboutFeatureListSectionItem[];
  layout?: "cards" | "list";
  background?: "white" | "gray" | "navy";
}

export type AboutStorySection =
  | AboutRichTextSection
  | AboutSidebarSection
  | AboutSplitImageSection
  | AboutFeatureListSection;

// ============================================
// Page Types
// ============================================

export interface HomePage extends SanityDocument {
  _type: "homePage";
  seo?: SeoData;
  heroVariant?: "primary" | "secondary";
  hero?: HeroSection;
  introductionHeadline?: string;
  introductionText?: string;
  whoWeAreHeading?: string;
  whoWeAreContent?: PortableTextContent;
  whoWeAreImage?: SanityImage;
  whatWeManageHeading?: string;
  whatWeManageContent?: PortableTextContent;
  propertyTypes?: PropertyType[];
  whatWeOfferHeading?: string;
  whatWeOfferContent?: PortableTextContent;
  whatWeOfferImage?: SanityImage;
  featuredServices?: Service[];
  testimonialsHeading?: string;
  featuredTestimonials?: Testimonial[];
  contactHeading?: string;
  contactSubheading?: string;
  contactButtonText?: string;
  contactButtonLink?: LinkObject;
}

export interface AboutPage extends SanityDocument {
  _type: "aboutPage";
  seo?: SeoData;
  hero?: HeroSection;
  storySections?: AboutStorySection[];
  teamHeading?: string;
  teamIntro?: string;
  teamMembers?: TeamMember[];
  faqHeading?: string;
  faqs?: FaqItem[];
}

export interface ServicesPage extends SanityDocument {
  _type: "servicesPage";
  seo?: SeoData;
  hero?: HeroSection;
  services?: Service[];
  showCta?: boolean;
  ctaHeading?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonLink?: LinkObject;
}

export interface ContactPage extends SanityDocument {
  _type: "contactPage";
  seo?: SeoData;
  contactHeading?: string;
  address?: string;
  phone?: string;
  email?: string;
  mapEmbedUrl?: string;
  formHeading?: string;
  formDescription?: string;
  submitButtonText?: string;
  successMessage?: string;
}

export interface BlogPage extends SanityDocument {
  _type: "blogPage";
  seo?: SeoData;
  hero?: HeroSection;
  heading?: string;
  intro?: string;
}

// ============================================
// Footer Types
// ============================================

export interface SocialLink {
  _key: string;
  platform: string;
  url: string;
}

export interface FooterData {
  phoneNumber?: string;
  email?: string;
  address?: string;
  description?: string;
  landAcknowledgement?: string;
  socialLinks?: SocialLink[];
  copyrightText?: string;
}

// ============================================
// Blog Block Types (for rich content)
// ============================================

export interface TextBlock {
  _type: "textBlock";
  _key: string;
  content: PortableTextContent;
}

export interface ImageBlock {
  _type: "imageBlock";
  _key: string;
  image: SanityImage;
  alt: string;
  caption?: string;
  size?: "full" | "large" | "medium";
}

export interface VideoBlock {
  _type: "videoBlock";
  _key: string;
  videoType: "youtube" | "vimeo" | "upload";
  url?: string;
  upload?: {
    url: string;
  };
  title: string;
  caption?: string;
}

export type BlogContentBlock = TextBlock | ImageBlock | VideoBlock;

// ============================================
// Type Guards
// ============================================

export function isPortableTextContent(value: unknown): value is PortableTextContent {
  return Array.isArray(value) && value.every(
    (item) => typeof item === "object" && item !== null && "_type" in item
  );
}

export function isSanityImage(value: unknown): value is SanityImage {
  return (
    typeof value === "object" &&
    value !== null &&
    "_type" in value &&
    (value as any)._type === "image"
  );
}
