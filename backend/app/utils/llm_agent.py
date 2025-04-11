# app/utils/llm_agent.py
import aiohttp
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any
import re
import logging
import json
from urllib.parse import urljoin, urlparse
from openai import AsyncAzureOpenAI


from app.utils.task_queue import update_task_progress
from app.config import settings

from .web_scraper import extract_business_areas,extract_company_description, extract_company_name, find_about_page_url, find_contact_page_url

logger = logging.getLogger(__name__)



async def generate_email_with_agent(task_id, company_data, target_url, find_contact=False, tone="professional", personalization_level="medium", custom_instructions=None):
    """Generate an email using the LLM agent."""
    try:
        update_task_progress(task_id, 10, "Starting website analysis")
        
        # Step 1: Analyze the target website
        target_info = await analyze_website(target_url, task_id)
        update_task_progress(task_id, 40, "Website analyzed")
        
        # Step 2: Find contact information if requested
        contact_info = None
        if find_contact:
            update_task_progress(task_id, 45, "Searching for contact information")
            contact_info = await find_contact_information(target_url, target_info, task_id)
            update_task_progress(task_id, 60, "Contact search completed")
        
        # Step 3: Generate the email
        update_task_progress(task_id, 70, "Generating email content")
        email_content = await generate_email_content(
            company_data,
            target_info,
            contact_info,
            tone,
            personalization_level,
            custom_instructions,
            task_id
        )
        
        update_task_progress(task_id, 100, "Email generation completed")
        
        return {
            "subject": email_content["subject"],
            "body": email_content["body"],
            "target_company_name": target_info.get("name", "Unknown Company"),
            "contact_info": contact_info,
            "target_url": target_url
        }
    except Exception as e:
        import traceback
        logger.error(f"Error in generate_email_with_agent: {str(e)}")
        logger.error(traceback.format_exc())
        # Return a basic result so the task completes
        return {
            "subject": f"Introduction from {company_data.get('name', 'Our Company')}",
            "body": f"An error occurred while generating this email: {str(e)}",
            "target_company_name": "Unknown Company",
            "contact_info": None,
            "target_url": target_url
        }

def extract_emails(soup: BeautifulSoup) -> List[str]:
    """Extract email addresses from the HTML."""
    # Look for email addresses in the text
    text = soup.get_text()
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    
    # Also check for mailto links
    mailto_links = soup.select('a[href^="mailto:"]')
    for link in mailto_links:
        href = link.get('href', '')
        email = href.replace('mailto:', '').split('?')[0].strip()
        if email and email not in emails:
            emails.append(email)
    
    return emails

def extract_phone_numbers(soup: BeautifulSoup) -> List[str]:
    """Extract phone numbers from the HTML."""
    # Look for phone numbers in the text
    text = soup.get_text()
    # Simple pattern for international phone numbers
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    
    # Clean up and format the phone numbers
    formatted_phones = []
    for phone_parts in phones:
        phone = ''.join(phone_parts).strip()
        if phone:
            # Remove duplicate symbols and spaces
            phone = re.sub(r'[-.\s]+', '-', phone)
            formatted_phones.append(phone)
    
    # Also check for tel: links
    tel_links = soup.select('a[href^="tel:"]')
    for link in tel_links:
        href = link.get('href', '')
        phone = href.replace('tel:', '').strip()
        if phone and phone not in formatted_phones:
            formatted_phones.append(phone)
    
    return formatted_phones

def extract_contact_person(soup: BeautifulSoup) -> Optional[Dict[str, str]]:
    """Extract information about a contact person."""
    # This is more complex and would depend on the website structure
    # For this example, we'll look for common patterns
    
    # Look for sections that might contain contact information
    contact_sections = soup.select('.contact, .team, .staff, .employee')
    
    for section in contact_sections:
        # Look for names (usually in headings)
        name_elem = section.select_one('h1, h2, h3, h4, h5, h6, .name, .contact-name')
        if name_elem:
            name = name_elem.get_text().strip()
            
            # Look for a position/title near the name
            position_elem = section.select_one('.position, .title, .job-title, .role')
            position = position_elem.get_text().strip() if position_elem else None
            
            return {
                "name": name,
                "position": position
            }
    
    return None

async def analyze_website(url: str, task_id: str) -> Dict[str, Any]:
    """Analyze a website to extract company information."""
    update_task_progress(task_id, 15, "Fetching website content")
    
    # Fetch the main page
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=30) as response:
                html = await response.text()
        except Exception as e:
            logger.error(f"Error fetching URL {url}: {str(e)}")
            update_task_progress(task_id, 20, f"Error fetching website: {str(e)}")
            return {"name": "Unknown Company", "description": "", "business_areas": []}
    
    # Parse the HTML
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract company name
    update_task_progress(task_id, 20, "Extracting company name")
    company_name = extract_company_name(soup, url)
    
    # Extract company description
    update_task_progress(task_id, 25, "Extracting company description")
    description = extract_company_description(soup)
    
    # Extract business areas
    update_task_progress(task_id, 30, "Identifying business areas")
    business_areas = extract_business_areas(soup)
    
    # Check for about page and contact page
    update_task_progress(task_id, 35, "Looking for additional pages")
    about_url = find_about_page_url(soup, url)
    contact_url = find_contact_page_url(soup, url)
    
    # Fetch about page if it exists
    if about_url and about_url != url:
        update_task_progress(task_id, 37, "Analyzing about page")
        try:
            async with session.get(about_url, timeout=30) as response:
                about_html = await response.text()
                about_soup = BeautifulSoup(about_html, 'html.parser')
                
                # Update description if the new one is better
                about_description = extract_company_description(about_soup)
                if len(about_description) > len(description):
                    description = about_description
                
                # Add any new business areas
                about_areas = extract_business_areas(about_soup)
                for area in about_areas:
                    if area not in business_areas:
                        business_areas.append(area)
        except Exception as e:
            logger.error(f"Error fetching about URL {about_url}: {str(e)}")
    
    return {
        "name": company_name,
        "description": description,
        "business_areas": business_areas,
        "contact_url": contact_url
    }

async def find_contact_information(url: str, target_info: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    """Find contact information on the website."""
    contact_url = target_info.get("contact_url", None)
    contact_info = {
        "email": None,
        "phone": None,
        "name": None,
        "position": None,
        "found": False
    }
    
    # If no contact URL was found, we can't proceed
    if not contact_url:
        update_task_progress(task_id, 50, "No contact page found")
        return contact_info
    
    update_task_progress(task_id, 50, "Analyzing contact page")
    
    # Fetch the contact page
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(contact_url, timeout=30) as response:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Look for email addresses
                update_task_progress(task_id, 52, "Looking for email addresses")
                emails = extract_emails(soup)
                if emails:
                    contact_info["email"] = emails[0]  # Take the first email
                    contact_info["found"] = True
                
                # Look for phone numbers
                update_task_progress(task_id, 54, "Looking for phone numbers")
                phones = extract_phone_numbers(soup)
                if phones:
                    contact_info["phone"] = phones[0]  # Take the first phone
                    contact_info["found"] = True
                
                # Look for contact person information
                update_task_progress(task_id, 56, "Looking for contact person")
                person_info = extract_contact_person(soup)
                if person_info:
                    contact_info["name"] = person_info.get("name")
                    contact_info["position"] = person_info.get("position")
                    contact_info["found"] = True
                
        except Exception as e:
            logger.error(f"Error fetching contact URL {contact_url}: {str(e)}")
            update_task_progress(task_id, 58, f"Error fetching contact page: {str(e)}")
    
    return contact_info



# Implement the email generation function with Azure OpenAI
async def generate_email_content(
    company_data: Dict[str, Any],
    target_info: Dict[str, Any],
    contact_info: Optional[Dict[str, Any]],
    tone: str,
    personalization_level: str,
    custom_instructions: Optional[str],
    task_id: str
) -> Dict[str, str]:
    """Generate email content using Azure OpenAI."""
    update_task_progress(task_id, 75, "Crafting email with AI")
    
    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
    )
    
    # Format services into a readable format
    services_text = ""
    for service in company_data.get("services", []):
        name = service.get("name", "")
        description = service.get("description", "")
        
        services_text += f"- {name}"
        if description:
            services_text += f": {description}"
        services_text += "\n"
    
    # Format contact info if available
    contact_text = "No specific contact information found."
    if contact_info and contact_info.get("found"):
        contact_text = "Contact information:"
        if contact_info.get("name"):
            contact_text += f"\n- Name: {contact_info.get('name')}"
        if contact_info.get("position"):
            contact_text += f"\n- Position: {contact_info.get('position')}"
        if contact_info.get("email"):
            contact_text += f"\n- Email: {contact_info.get('email')}"
        if contact_info.get("phone"):
            contact_text += f"\n- Phone: {contact_info.get('phone')}"
    
    # Adjust tone instructions
    tone_instructions = {
        "professional": "Keep the tone professional, polished, and business-appropriate.",
        "casual": "Keep the tone friendly, conversational, and approachable, but still professional.",
        "formal": "Use a formal tone with proper business etiquette and traditional business language.",
        "direct": "Be straightforward and concise, focusing on clarity and directness."
    }.get(tone, "Keep the tone professional and business-appropriate.")
    
    # Adjust personalization instructions
    personalization_instructions = {
        "low": "Include minimal personalization, focusing on general value propositions.",
        "medium": "Include moderate personalization based on the target company's business.",
        "high": "Create a highly personalized email that demonstrates deep understanding of the target company."
    }.get(personalization_level, "Include moderate personalization based on the target company's business.")
    
    # Build the prompt
    prompt = f"""
    You are a professional cold email writer. You need to write a personalized cold email from a company to a potential client.

    SENDER COMPANY INFORMATION:
    - Company Name: {company_data.get('name')}
    - Company Description: {company_data.get('description') or 'No description provided'}
    - Services Offered:
    {services_text or '- No specific services provided'}

    TARGET COMPANY INFORMATION:
    - Company Name: {target_info.get('name', 'Unknown Company')}
    - Company Description: {target_info.get('description', 'No description available')}
    - Business Areas: {', '.join(target_info.get('business_areas', ['Unknown']))}
    
    CONTACT INFORMATION:
    {contact_text}

    STYLE INSTRUCTIONS:
    - {tone_instructions}
    - {personalization_instructions}
    - Do not use emojis or excessive formatting.
    - Focus on how the sender's services can specifically benefit the target company.
    - Be concise and respect the reader's time.
    - Include a clear call-to-action that's easy to respond to.

    CUSTOM INSTRUCTIONS:
    {custom_instructions or 'No specific additional instructions.'}
    
    FORMAT:
    First provide just the email subject line labeled as "SUBJECT:", then provide the email body.
    """

    update_task_progress(task_id, 85, "Processing with AI")
    
    try:
        response = await client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are a professional email writer who creates effective cold emails."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Extract subject and content from the response
        full_text = response.choices[0].message.content.strip()
        
        # Parse the subject and body
        subject = "Introduction from " + company_data.get('name', 'Our Company')
        body = full_text
        
        if "SUBJECT:" in full_text:
            parts = full_text.split("SUBJECT:", 1)
            if len(parts) > 1:
                subject_and_body = parts[1].strip()
                body_parts = subject_and_body.split("\n", 1)
                
                subject = body_parts[0].strip()
                body = body_parts[1].strip() if len(body_parts) > 1 else ""
        
        update_task_progress(task_id, 95, "Email content generated")
        
        return {
            "subject": subject,
            "body": body
        }
        
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        update_task_progress(task_id, 95, f"Error generating email: {str(e)}")
        
        return {
            "subject": f"Introduction from {company_data.get('name', 'Our Company')}",
            "body": f"[Error generating personalized email. Please try again later.]"
        }