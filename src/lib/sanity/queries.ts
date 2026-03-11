// src/lib/sanity/queries.ts

export const GLOBAL_CHROME_QUERY = /* groq */ `
{
  "site": *[_type == "siteSettings"][0]{
    siteName,
    siteDescription,
    logo,
    favicon,
    defaultOgImage,
    contactEmail,
    contactPhone,
    address
  },
  "nav": *[_type == "navigation"][0]{
    menuItems[]{
      title,
      linkType,
      externalUrl,
      internalPage->{
        _type
      }
    },
    showCtaButton,
    ctaText,
    ctaLinkType,
    ctaExternalUrl,
    ctaInternalPage->{
      _type,
      slug
    }
  },
  "topRibbon": *[_type == "topRibbon"][0]{
    enabled,
    phoneNumber,
    email,
    serviceText

  },
  "footer": *[_type == "footer"][0]{
    phoneNumber,
    email,
    address,
    landAcknowledgement,
    socialLinks[]{ platform, url },
    copyrightText
  }
}
`;

const HERO_PROJECTION = /* groq */ `
hero{
  heading,
  subheading,
  backgroundImage{
    asset,
    alt,
    hotspot,
    crop
  }
}
`;

export const CTA_SECTION_QUERY = /* groq */ `
*[_type == "ctaSection"][0]{
  heading,
  subheading,
  backgroundImage{
    asset,
    alt,
    hotspot,
    crop
  },
  buttonText,
  buttonLink{
    linkType,
    internalLink->{
      _type,
      slug
    },
    externalUrl,
    openInNewTab
  }
}
`;

const CTA_SECTION_PROJECTION = /* groq */ `
{
  heading,
  subheading,
  backgroundImage{
    asset,
    alt,
    hotspot,
    crop
  },
  buttonText,
  buttonLink{
    linkType,
    internalLink->{
      _type,
      slug
    },
    externalUrl,
    openInNewTab
  }
}
`;

export const HOME_PAGE_QUERY = /* groq */ `
*[_type == "homePage"][0]{
  heroVariant,
  ${HERO_PROJECTION},
  introductionHeadline,
  introductionText,
  whoWeAreHeading,
  whoWeAreContent,
  whoWeAreImage{
    asset,
    alt,
    hotspot,
    crop
  },
  whatWeManageHeading,
  whatWeManageContent,
  propertyTypes[]->{
    title,
    slug,
    shortDescription,
    image{
      asset,
      alt,
      hotspot,
      crop
    },
    icon{
      asset,
      alt
    },
    enableDetailPage
  },
  whatWeOfferHeading,
  whatWeOfferIntro,
  whatWeOfferImage{
    asset,
    alt,
    hotspot,
    crop
  },
  featuredServices[]-> {
    title,
    shortDescription,
    icon{
      asset,
      alt
    }
  },
  testimonialsHeading,
  featuredTestimonials[]-> {
    quote,
    authorName,
    authorTitle,
    image{
      asset,
      alt,
      hotspot,
      crop
    }
  },
  showCta,
  "ctaData": select(
    showCta => *[_type == "ctaSection"][0]${CTA_SECTION_PROJECTION},
    {
      "heading": contactHeading,
      "subheading": contactSubheading,
      "buttonText": contactButtonText,
      "buttonLink": contactButtonLink{
        linkType,
        internalLink->{
          _type,
          slug
        },
        externalUrl,
        openInNewTab
      }
    }
  ),
  contactHeading,
  contactSubheading,
  contactButtonText,
  contactButtonLink{
    linkType,
    internalLink->{
      _type,
      slug
    },
    externalUrl,
    openInNewTab
  },
  seo
}
`;

export const ABOUT_PAGE_QUERY = /* groq */ `
*[_type == "aboutPage"][0]{
  ${HERO_PROJECTION},
  storySections[]{
    _key,
    _type,
    eyebrow,
    headline,
    content,
    layout,
    background,
    sidebar{
      title,
      content
    },
    imagePosition,
    imageSide,
    image{
      asset,
      alt,
      hotspot,
      crop
    },
    intro,
    items[]{
      title,
      description
    }
  },
  communityEyebrow,
  communityHeading,
  communityIntro,
  communityImage{
    asset,
    alt,
    hotspot,
    crop
  },
  teamHeading,
  teamIntro,
  teamMembers[]{
    name,
    title,
    headshot{
      asset,
      alt,
      hotspot,
      crop
    },
    bio
  },
  showCta,
  "ctaData": select(
    showCta => *[_type == "ctaSection"][0]${CTA_SECTION_PROJECTION},
    null
  ),
  seo
}
`;

export const SERVICES_PAGE_QUERY = /* groq */ `
*[_type == "servicesPage"][0]{
  ${HERO_PROJECTION},
  introHeading,
  introContent,
  services[]->{
    title,
    slug,
    shortDescription,
    bulletPoints,
    image{
      asset,
      alt,
      hotspot,
      crop
    },
    enableDetailPage
  },
  faqHeading,
  faqs[]{
    question,
    answer
  },
  showCta,
  "ctaData": select(
    showCta => *[_type == "ctaSection"][0]${CTA_SECTION_PROJECTION},
    null
  ),
  seo
}
`;

export const CONTACT_PAGE_QUERY = /* groq */ `
*[_type == "contactPage"][0]{
  contactHeading,
  address,
  phone,
  email,
  "mapEmbedUrl": mapEmbed,
  formHeading,
  formDescription,
  submitButtonText,
  successMessage,
  recipientEmail,
  showCta,
  "ctaData": select(
    showCta => *[_type == "ctaSection"][0]${CTA_SECTION_PROJECTION},
    null
  ),
  seo
}
`;

export const BLOG_PAGE_QUERY = /* groq */ `
*[_type == "blogPage"][0]{
  ${HERO_PROJECTION},
  heading,
  introText,
  postsPerPageDesktop,
  postsPerPageMobile,
  showCta,
  "ctaData": select(
    showCta => *[_type == "ctaSection"][0]${CTA_SECTION_PROJECTION},
    null
  ),
  seo
}
`;

export const BLOG_LIST_QUERY = /* groq */ `
*[_type == "blogPost"] | order(publishedAt desc)[$start...$end]{
  title,
  slug,
  publishedAt,
  excerpt,
  featuredImage{
    asset,
    alt,
    hotspot,
    crop
  },
  author,
  showAuthor,
  category->{
    title,
    slug,
    color
  }
}
`;

export const BLOG_COUNT_QUERY = /* groq */ `
count(*[_type == "blogPost"])
`;

export const BLOG_COUNT_AND_LIST_QUERY = /* groq */ `
{
  "totalCount": count(*[_type == "blogPost"]),
  "posts": *[_type == "blogPost"] | order(publishedAt desc)[$start...$end]{
    title,
    slug,
    publishedAt,
    excerpt,
    featuredImage{
      asset,
      alt,
      hotspot,
      crop
    },
    author,
    showAuthor,
    category->{
      title,
      slug,
      color
    }
  }
}
`;

export const BLOG_POST_QUERY = /* groq */ `
*[_type == "blogPost" && slug.current == $slug][0]{
  title,
  slug,
  publishedAt,
  excerpt,
  featuredImage{
    asset,
    alt,
    hotspot,
    crop
  },
  author,
  showAuthor,
  category->{
    title,
    slug,
    color
  },
  content[]{
    _type,
    _key,
    content,
    image,
    alt,
    caption,
    size,
    videoType,
    "url": select(
      videoType == "youtube" => youtubeUrl,
      videoType == "vimeo" => vimeoUrl
    ),
    "upload": uploadedVideo,
    "title": caption
  },
  seo
}
`;

export const PROPERTY_TYPE_OPTIONS_QUERY = /* groq */ `
*[_type == "propertyType"] | order(title asc){
  _id,
  title,
  slug
}
`;

export const REQUEST_PROPOSAL_PAGE_QUERY = /* groq */ `
*[_type == "requestProposalPage"][0]{
  formHeading,
  formDescription,
  submitButtonText,
  successMessage,
  seo
}
`;
