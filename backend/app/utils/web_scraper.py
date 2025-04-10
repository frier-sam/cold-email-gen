import aiohttp
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any
import re
import logging
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

async def fetch_url(url: str) -> str:
    """Fetch HTML content from a URL."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=30) as response:
                return await response.text()
    except Exception as e:
        logger.error(f"Error fetching URL {url}: {str(e)}")
        return ""

def extract_company_name(soup: BeautifulSoup, url: str) -> str:
    """Extract company name from the website."""
    # Try to get from title
    title = soup.title.string if soup.title else ""
    if title:
        # Clean up common title patterns
        company = re.sub(r' - Home.*$', '', title)
        company = re.sub(r' \| .*$', '', company)
        company = re.sub(r' – .*$', '', company)
        return company.strip()
    
    # Try to get from meta tags
    meta_name = soup.find('meta', property='og:site_name')
    if meta_name and meta_name.get('content'):
        return meta_name.get('content')
    
    # Try to get from logo alt text
    logo = soup.find('img', {'class': re.compile(r'logo', re.I)})
    if logo and logo.get('alt'):
        return logo.get('alt')
    
    # Fallback to domain name
    domain = urlparse(url).netloc
    domain = re.sub(r'^www\.', '', domain)
    domain = re.sub(r'\.com$|\.org$|\.net$', '', domain)
    return domain.title()

def extract_company_description(soup: BeautifulSoup) -> str:
    """Extract company description from the website."""
    # Try meta description
    meta_desc = soup.find('meta', {'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        return meta_desc.get('content')
    
    # Try to find about section content
    about_section = soup.find('section', {'id': re.compile(r'about', re.I)})
    if not about_section:
        about_section = soup.find('div', {'id': re.compile(r'about', re.I)})
    if not about_section:
        about_section = soup.find('div', {'class': re.compile(r'about', re.I)})
    
    if about_section:
        paragraphs = about_section.find_all('p')
        if paragraphs:
            return " ".join([p.text.strip() for p in paragraphs])
    
    # Fallback to first few paragraphs
    main_content = soup.find('main') or soup.find('div', {'id': 'content'}) or soup.body
    if main_content:
        paragraphs = main_content.find_all('p', limit=5)
        if paragraphs:
            return " ".join([p.text.strip() for p in paragraphs])
    
    return ""

def extract_business_areas(soup: BeautifulSoup) -> List[str]:
    """Extract business areas or services offered by the company."""
    business_areas = []
    
    # Look for sections that might contain services
    service_sections = soup.find_all(['section', 'div'], {'id': re.compile(r'service|product|solution', re.I)})
    if not service_sections:
        service_sections = soup.find_all(['section', 'div'], {'class': re.compile(r'service|product|solution', re.I)})
    
    for section in service_sections:
        # Extract headings
        headings = section.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        for heading in headings:
            if heading.text.strip():
                business_areas.append(heading.text.strip())
    
    # If no services found, try lists
    if not business_areas:
        service_lists = soup.find_all(['ul', 'ol'], {'class': re.compile(r'service|product|solution', re.I)})
        for service_list in service_lists:
            items = service_list.find_all('li')
            for item in items:
                if item.text.strip():
                    business_areas.append(item.text.strip())
    
    return business_areas[:10]  # Limit to top 10

def find_about_page_url(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    """Find URL to the about page if it exists."""
    about_links = soup.find_all('a', text=re.compile(r'about|company', re.I))
    if not about_links:
        about_links = soup.find_all('a', {'href': re.compile(r'about|company', re.I)})
    
    if about_links:
        about_url = about_links[0].get('href')
        if about_url:
            return urljoin(base_url, about_url)
    return None

def find_contact_page_url(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    """Find URL to the contact page if it exists."""
    contact_links = soup.find_all('a', text=re.compile(r'contact', re.I))
    if not contact_links:
        contact_links = soup.find_all('a', {'href': re.compile(r'contact', re.I)})
    
    if contact_links:
        contact_url = contact_links[0].get('href')
        if contact_url:
            return urljoin(base_url, contact_url)
    return None

async def scrape_site(url: str) -> Dict[str, Any]:
    """Scrape website content to extract company information."""
    html = await fetch_url(url)
    if not html:
        return {}
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract basic info
    company_name = extract_company_name(soup, url)
    description = extract_company_description(soup)
    business_areas = extract_business_areas(soup)
    
    # Find about and contact pages
    about_url = find_about_page_url(soup, url)
    contact_url = find_contact_page_url(soup, url)
    
    # If we have an about page, scrape it for better info
    if about_url and about_url != url:
        about_html = await fetch_url(about_url)
        if about_html:
            about_soup = BeautifulSoup(about_html, 'html.parser')
            if not description or len(description) < 100:
                description = extract_company_description(about_soup) or description
    
    return {
        "name": company_name,
        "description": description,
        "business_areas": business_areas,
        "contact_url": contact_url
    }

async def extract_company_info(main_url: str, additional_urls: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Extract information about a company from its website.
    
    Args:
        main_url: The main URL of the company website
        additional_urls: Additional URLs to scrape for more information
        
    Returns:
        A dictionary containing company information
    """
    # Scrape main website
    company_info = await scrape_site(main_url)
    
    # Scrape additional URLs if provided
    if additional_urls:
        for url in additional_urls:
            if url and url != main_url:
                additional_info = await scrape_site(url)
                
                # Merge descriptions if we got a new one
                if additional_info.get("description") and len(additional_info["description"]) > len(company_info.get("description", "")):
                    company_info["description"] = additional_info["description"]
                
                # Add business areas
                if additional_info.get("business_areas"):
                    existing_areas = set(company_info.get("business_areas", []))
                    for area in additional_info["business_areas"]:
                        if area not in existing_areas:
                            company_info.setdefault("business_areas", []).append(area)
    
    # Ensure we have at least empty values for required fields
    company_info.setdefault("name", "")
    company_info.setdefault("description", "")
    company_info.setdefault("business_areas", [])
    
    return company_info
