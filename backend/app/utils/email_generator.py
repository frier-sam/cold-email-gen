import json
import logging
from typing import Dict, List, Tuple, Any, Optional

from openai import AsyncAzureOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Azure OpenAI client
client = AsyncAzureOpenAI(
    api_key=settings.AZURE_OPENAI_API_KEY,
    api_version=settings.AZURE_OPENAI_API_VERSION,
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
)

async def generate_cold_email(
    company_name: str,
    company_description: Optional[str],
    services: List[Dict[str, str]],
    target_company_info: Dict[str, Any],
    custom_instructions: Optional[str] = None
) -> Tuple[str, str]:
    """
    Generate a cold email using Azure OpenAI.
    
    Args:
        company_name: Name of the user's company
        company_description: Description of the user's company
        services: List of services offered by the user's company
        target_company_info: Information about the target company
        custom_instructions: Custom instructions for email generation
        
    Returns:
        A tuple of (subject, email_content)
    """
    try:
        # Format services into a readable format
        services_text = ""
        for service in services:
            name = service.get("name", "")
            description = service.get("description", "")
            
            services_text += f"- {name}"
            if description:
                services_text += f": {description}"
            services_text += "\n"
        
        # Build the prompt
        prompt = f"""
        You are a professional cold email writer. You need to write a personalized cold email from a company to a potential client.

        SENDER COMPANY INFORMATION:
        - Company Name: {company_name}
        - Company Description: {company_description or 'No description provided'}
        - Services Offered:
        {services_text or '- No specific services provided'}

        TARGET COMPANY INFORMATION:
        - Company Name: {target_company_info.get('name', 'Unknown Company')}
        - Company Description: {target_company_info.get('description', 'No description available')}
        - Business Areas: {', '.join(target_company_info.get('business_areas', ['Unknown']))}

        TASK:
        Write a personalized cold email that {company_name} could send to {target_company_info.get('name', 'the target company')}. 
        The email should introduce {company_name}, explain how their services could benefit the target company, and request a follow-up call or meeting.
        
        The email should be highly personalized based on the target company's business and needs.
        
        FORMAT:
        First provide just the email subject line labeled as "SUBJECT:", then provide the email body.
        
        ADDITIONAL INSTRUCTIONS:
        {custom_instructions or 'Keep the email concise, professional, and focused on value proposition.'}
        """

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
        if "SUBJECT:" in full_text:
            parts = full_text.split("SUBJECT:", 1)
            if len(parts) > 1:
                subject_and_body = parts[1].strip()
                body_parts = subject_and_body.split("\n", 1)
                
                subject = body_parts[0].strip()
                content = body_parts[1].strip() if len(body_parts) > 1 else ""
                
                return subject, content
        
        # Fallback if parsing fails
        return "Introduction from " + company_name, full_text
        
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        return (
            f"Introduction from {company_name}",
            f"[Error generating personalized email. Please try again later.]"
        )