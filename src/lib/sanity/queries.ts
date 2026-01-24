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
    ctaLink
  },
  "topRibbon": *[_type == "topRibbon"][0]{
    enabled,
    phoneNumber,
    email
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
    alt
  }
}
`;

export const HOME_PAGE_QUERY = /* groq */ `
*[_type == "homePage"][0]{
  ${HERO_PROJECTION},
  whoWeAreHeading,
  whoWeAreContent,
  whoWeAreImage{
    asset,
    alt
  },
  whatWeManageHeading,
  whatWeManageContent,
  propertyTypes[]{
    title,
    icon
  },
  whatWeOfferHeading,
  whatWeOfferIntro,
  featuredServices[]-> {
    title,
    slug,
    shortDescription,
    image{
      asset,
      alt
    },
    enableDetailPage
  },
  testimonialsHeading,
  featuredTestimonials[]-> {
    quote,
    authorName,
    authorTitle,
    image
  },
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
  ourStoryHeading,
  ourStoryContent,
  ourStoryImage{
    asset,
    alt
  },
  teamHeading,
  teamIntro,
  teamMembers[]{
    name,
    title,
    headshot{
      asset,
      alt
    },
    bio
  },
  faqHeading,
  faqs[]{
    question,
    answer
  },
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
      alt
    },
    enableDetailPage
  },
  showCta,
  ctaHeading,
  ctaText,
  ctaButtonText,
  ctaButtonLink{
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

export const CONTACT_PAGE_QUERY = /* groq */ `
*[_type == "contactPage"][0]{
  ${HERO_PROJECTION},
  contactHeading,
  address,
  phone,
  email,
  mapEmbedUrl,
  formHeading,
  formDescription,
  submitButtonText,
  successMessage,
  recipientEmail,
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
  seo
}
`;

export const BLOG_CATEGORIES_QUERY = /* groq */ `
*[_type == "blogCategory"] | order(title asc){
  title,
  slug,
  color
}
`;

export const BLOG_LIST_QUERY = /* groq */ `
*[_type == "blogPost"] | order(publishedAt desc){
  title,
  slug,
  publishedAt,
  excerpt,
  featuredImage{
    asset,
    alt
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

export const BLOG_POST_QUERY = /* groq */ `
*[_type == "blogPost" && slug.current == $slug][0]{
  title,
  slug,
  publishedAt,
  excerpt,
  featuredImage,
  author,
  showAuthor,
  category->{
    title,
    slug,
    color
  },
  content[]{
    _type,
    // textBlock
    content,
    // imageBlock
    image,
    alt,
    caption,
    size,
    // videoBlock
    videoType,
    url,
    upload,
    title,
    caption
  },
  seo
}
`;
